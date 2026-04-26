import { NextRequest, NextResponse } from 'next/server';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { atsConnections, jobs, companyEmployees } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { testCeipalConnection, syncCeipalJobs, syncCeipalEmployees } from '@/lib/ats/ceipal';
import { encrypt } from '@/lib/crypto';

const VALID_PROVIDERS = ['greenhouse', 'lever', 'workday', 'smartrecruiters', 'bamboohr', 'ceipal', 'custom_url'];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') {
    return NextResponse.json({ error: 'Only admins can connect ATS systems' }, { status: 403 });
  }

  const { provider, apiKey, email, password, customUrl, customEndpointUrl, departmentId } = await req.json();

  if (!provider || !VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: 'Invalid ATS provider' }, { status: 400 });
  }

  if (provider === 'custom_url' && !customUrl) {
    return NextResponse.json({ error: 'Career site URL is required' }, { status: 400 });
  }

  if (provider === 'ceipal') {
    if (!apiKey || !email || !password) {
      return NextResponse.json({ error: 'API key, email, and password are required for Ceipal' }, { status: 400 });
    }
  } else if (provider !== 'custom_url' && !apiKey) {
    return NextResponse.json({ error: 'API key is required' }, { status: 400 });
  }

  // Check not already connected (same provider can exist in different departments)
  const [existing] = await db
    .select()
    .from(atsConnections)
    .where(
      and(
        eq(atsConnections.companyId, currentUser.companyId),
        eq(atsConnections.provider, provider),
        departmentId ? eq(atsConnections.departmentId, departmentId) : isNull(atsConnections.departmentId)
      )
    )
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: `${provider} is already connected` }, { status: 409 });
  }

  // For Ceipal: test connection before saving
  if (provider === 'ceipal') {
    const test = await testCeipalConnection(email, password, apiKey);
    if (!test.ok) {
      return NextResponse.json({ error: test.error ?? 'Failed to connect to Ceipal' }, { status: 400 });
    }
  }

  const [connection] = await db
    .insert(atsConnections)
    .values({
      companyId: currentUser.companyId,
      departmentId: departmentId || null,
      provider: provider as any,
      apiKey: apiKey || null,
      customUrl: customUrl || null,
      status: 'active',
      // Store email + encrypted password in config for re-auth on future syncs
      config: provider === 'ceipal' ? { email, password: encrypt(password), customJobEndpoint: customEndpointUrl || null } : null,
    })
    .returning();

  if (provider !== 'ceipal') {
    return NextResponse.json({ id: connection.id, provider: connection.provider }, { status: 201 });
  }

  // ── Initial Ceipal sync ───────────────────────────────────────────────────

  // Limit initial connect sync to 1 page (50 jobs) for fast response.
  // Use "Sync Now" on the ATS page to pull all jobs.
  const ceipalJobs = await syncCeipalJobs(email, password, apiKey, 1);

  // Dedup by externalId
  const existingJobs = await db
    .select({ externalId: jobs.externalId })
    .from(jobs)
    .where(eq(jobs.companyId, currentUser.companyId));
  const existingExternalIds = new Set(existingJobs.map((j) => j.externalId).filter(Boolean));

  const newJobs = ceipalJobs.filter((j) => !existingExternalIds.has(j.externalId));
  let syncedJobCount = 0;

  if (newJobs.length > 0) {
    const inserted = await db
      .insert(jobs)
      .values(
        newJobs.map((j) => ({
          companyId: currentUser.companyId as string,
          atsConnectionId: connection.id,
          externalId: j.externalId,
          title: j.title,
          description: j.description,
          location: j.location,
          department: j.department,
          jobType: j.jobType,
          salaryMin: j.salaryMin,
          salaryMax: j.salaryMax,
          applyUrl: j.applyUrl,
          status: j.status,
          postedDate: j.postedDate,
          expiresAt: j.expiresAt,
          syncedAt: new Date(),
        }))
      )
      .onConflictDoNothing()
      .returning({ id: jobs.id });
    syncedJobCount = inserted.length;
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

  await db
    .update(atsConnections)
    .set({
      lastSyncedAt: new Date(),
      config: { email, password: encrypt(password), customJobEndpoint: customEndpointUrl || null, totalJobsSynced: syncedJobCount },
    })
    .where(eq(atsConnections.id, connection.id));

  return NextResponse.json(
    { id: connection.id, provider: connection.provider, syncedJobCount, syncedEmployeeCount },
    { status: 201 }
  );
}
