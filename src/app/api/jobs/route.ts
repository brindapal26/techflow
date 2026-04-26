import { NextRequest, NextResponse } from 'next/server';
import { eq, and, or, ilike, gte, lt, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { jobs, users } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const year = searchParams.get('year');
  const skill = searchParams.get('skill');
  const country = searchParams.get('country');

  // Build where conditions
  const conditions = [eq(jobs.companyId, currentUser.companyId)];

  // Role scope: recruiters only see their assigned jobs
  if (currentUser.role === 'recruiter') {
    conditions.push(eq(jobs.assignedRecruiterId, currentUser.id));
  }

  if (status) {
    conditions.push(eq(jobs.status, status as any));
  }

  if (search) {
    conditions.push(
      or(
        ilike(jobs.title, `%${search}%`),
        ilike(jobs.location, `%${search}%`),
        ilike(jobs.department, `%${search}%`)
      )!
    );
  }

  if (year) {
    const y = parseInt(year, 10);
    conditions.push(gte(jobs.postedDate, `${y}-01-01` as any));
    conditions.push(lt(jobs.postedDate, `${y + 1}-01-01` as any));
  }

  if (skill) {
    conditions.push(
      or(
        ilike(jobs.title, `%${skill}%`),
        ilike(jobs.department, `%${skill}%`)
      )!
    );
  }

  if (country) {
    conditions.push(ilike(jobs.location, `%${country}%`));
  }

  const recruiter = {
    id: users.id,
    name: users.name,
    email: users.email,
  };

  const rows = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      location: jobs.location,
      department: jobs.department,
      jobType: jobs.jobType,
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
    })
    .from(jobs)
    .leftJoin(users, eq(jobs.assignedRecruiterId, users.id))
    .where(and(...conditions))
    .orderBy(desc(jobs.isPriority), desc(jobs.createdAt));

  const result = rows.map((row) => ({
    id: row.id,
    title: row.title,
    location: row.location,
    department: row.department,
    jobType: row.jobType,
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
  }));

  return NextResponse.json(result);
}
