import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { atsConnections, jobs, companyEmployees } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { syncCeipalJobs, syncCeipalEmployees } from '@/lib/ats/ceipal';
import { safeDecrypt, encrypt } from '@/lib/crypto';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  const { id } = await params;

  const [connection] = await db
    .select()
    .from(atsConnections)
    .where(and(eq(atsConnections.id, id), eq(atsConnections.companyId, currentUser.companyId)))
    .limit(1);

  if (!connection) return NextResponse.json({ error: 'Connection not found' }, { status: 404 });

  if (connection.provider === 'ceipal') {
    const cfg = (connection.config ?? {}) as Record<string, string>;
    const email = cfg.email;
    const password = safeDecrypt(cfg.password);
    const apiKey = connection.apiKey!;

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing Ceipal credentials — reconnect this ATS' }, { status: 400 });
    }

    // ── Sync jobs ─────────────────────────────────────────────────────────────
    // Limit to 20 pages (1,000 jobs) per sync to stay within request timeout.
    // Run multiple syncs to incrementally pull all jobs.
    const ceipalJobs = await syncCeipalJobs(email, password, apiKey, 20);

    const existingJobs = await db
      .select({ id: jobs.id, externalId: jobs.externalId })
      .from(jobs)
      .where(eq(jobs.companyId, currentUser.companyId));

    const existingByExternalId = new Map(
      existingJobs.filter((j) => j.externalId).map((j) => [j.externalId!, j.id])
    );

    let syncedJobCount = 0;

    for (const job of ceipalJobs) {
      const existingId = existingByExternalId.get(job.externalId);

      if (existingId) {
        await db
          .update(jobs)
          .set({
            title: job.title,
            description: job.description,
            location: job.location,
            department: job.department,
            jobType: job.jobType,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            applyUrl: job.applyUrl,
            status: job.status,
            postedDate: job.postedDate,
            expiresAt: job.expiresAt,
            syncedAt: new Date(),
          })
          .where(eq(jobs.id, existingId));
      } else {
        await db
          .insert(jobs)
          .values({
            companyId: currentUser.companyId as string,
            atsConnectionId: connection.id,
            externalId: job.externalId,
            title: job.title,
            description: job.description,
            location: job.location,
            department: job.department,
            jobType: job.jobType,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            applyUrl: job.applyUrl,
            status: job.status,
            postedDate: job.postedDate,
            expiresAt: job.expiresAt,
            syncedAt: new Date(),
          })
          .onConflictDoNothing();
      }
      syncedJobCount++;
    }

    // ── Sync employees ────────────────────────────────────────────────────────
    const ceipalEmployees = await syncCeipalEmployees(email, password, apiKey);

    const existingEmployees = await db
      .select({ email: companyEmployees.email })
      .from(companyEmployees)
      .where(eq(companyEmployees.companyId, currentUser.companyId));
    const existingEmails = new Set(existingEmployees.map((e) => e.email));

    const newEmployees = ceipalEmployees.filter((e) => !existingEmails.has(e.email));
    let syncedEmployeeCount = 0;

    if (newEmployees.length > 0) {
      const insertedEmployees = await db
        .insert(companyEmployees)
        .values(
          newEmployees.map((e) => ({
            companyId: currentUser.companyId as string,
            atsConnectionId: connection.id,
            email: e.email,
            name: e.name,
            title: e.title,
            department: e.department,
            phone: e.phone,
            atsEmployeeId: e.atsEmployeeId,
            source: 'ceipal',
            syncedAt: new Date(),
          }))
        )
        .onConflictDoNothing()
        .returning({ id: companyEmployees.id });
      syncedEmployeeCount = insertedEmployees.length;
    }

    const syncedAt = new Date();
    await db
      .update(atsConnections)
      .set({
        lastSyncedAt: syncedAt,
        // Preserve customJobEndpoint and other keys; only update mutable fields
        config: {
          ...((connection.config ?? {}) as Record<string, any>),
          email,
          password: encrypt(password),
          totalJobsSynced: syncedJobCount,
        },
      })
      .where(eq(atsConnections.id, id));

    return NextResponse.json({ success: true, syncedAt, syncedJobCount, syncedEmployeeCount });
  }

  // Non-Ceipal: no-op until implemented
  const syncedAt = new Date();
  await db.update(atsConnections).set({ lastSyncedAt: syncedAt }).where(eq(atsConnections.id, id));
  return NextResponse.json({ success: true, syncedAt, syncedJobCount: 0, syncedEmployeeCount: 0 });
}
