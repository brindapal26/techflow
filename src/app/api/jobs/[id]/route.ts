import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { jobs, users, atsConnections } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  const { id } = await params;

  const [row] = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      description: jobs.description,
      location: jobs.location,
      department: jobs.department,
      jobType: jobs.jobType,
      salaryMin: jobs.salaryMin,
      salaryMax: jobs.salaryMax,
      currency: jobs.currency,
      status: jobs.status,
      isPriority: jobs.isPriority,
      externalId: jobs.externalId,
      applyUrl: jobs.applyUrl,
      postedDate: jobs.postedDate,
      expiresAt: jobs.expiresAt,
      syncedAt: jobs.syncedAt,
      createdAt: jobs.createdAt,
      assignedRecruiterId: jobs.assignedRecruiterId,
      recruiterName: users.name,
      recruiterEmail: users.email,
      atsConnectionId: jobs.atsConnectionId,
      atsProvider: atsConnections.provider,
      atsStatus: atsConnections.status,
    })
    .from(jobs)
    .leftJoin(users, eq(jobs.assignedRecruiterId, users.id))
    .leftJoin(atsConnections, eq(jobs.atsConnectionId, atsConnections.id))
    .where(and(eq(jobs.id, id), eq(jobs.companyId, currentUser.companyId)))
    .limit(1);

  if (!row) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  // Recruiters can only see jobs assigned to them
  if (currentUser.role === 'recruiter' && row.assignedRecruiterId !== currentUser.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    department: row.department,
    jobType: row.jobType,
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    currency: row.currency,
    status: row.status,
    isPriority: row.isPriority,
    externalId: row.externalId,
    applyUrl: row.applyUrl,
    postedDate: row.postedDate,
    expiresAt: row.expiresAt,
    syncedAt: row.syncedAt,
    createdAt: row.createdAt,
    assignedRecruiter: row.assignedRecruiterId
      ? { id: row.assignedRecruiterId, name: row.recruiterName, email: row.recruiterEmail }
      : null,
    atsConnection: row.atsConnectionId
      ? { id: row.atsConnectionId, provider: row.atsProvider, status: row.atsStatus }
      : null,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') {
    return NextResponse.json({ error: 'Only admins can update jobs' }, { status: 403 });
  }

  const { id } = await params;

  // Verify job belongs to this company
  const [existing] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.id, id), eq(jobs.companyId, currentUser.companyId)))
    .limit(1);

  if (!existing) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  const body = await req.json();
  const allowedFields: Record<string, unknown> = {};

  if ('assignedRecruiterId' in body) allowedFields.assignedRecruiterId = body.assignedRecruiterId ?? null;
  if ('isPriority' in body) allowedFields.isPriority = Boolean(body.isPriority);
  if ('status' in body) allowedFields.status = body.status;

  if (Object.keys(allowedFields).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const [updated] = await db
    .update(jobs)
    .set(allowedFields as any)
    .where(eq(jobs.id, id))
    .returning();

  return NextResponse.json(updated);
}
