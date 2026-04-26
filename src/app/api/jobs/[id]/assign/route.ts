import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { jobs, users } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') {
    return NextResponse.json({ error: 'Only admins can assign recruiters' }, { status: 403 });
  }

  const { id } = await params;
  const { recruiterId } = await req.json();

  // Verify job belongs to this company
  const [job] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.id, id), eq(jobs.companyId, currentUser.companyId)))
    .limit(1);

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  // If assigning (not unassigning), verify recruiter belongs to same company
  if (recruiterId !== null && recruiterId !== undefined) {
    const [recruiter] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, recruiterId), eq(users.companyId, currentUser.companyId)))
      .limit(1);

    if (!recruiter) {
      return NextResponse.json({ error: 'Recruiter not found in this company' }, { status: 404 });
    }
  }

  const [updated] = await db
    .update(jobs)
    .set({ assignedRecruiterId: recruiterId ?? null })
    .where(eq(jobs.id, id))
    .returning({ id: jobs.id, assignedRecruiterId: jobs.assignedRecruiterId });

  return NextResponse.json(updated);
}
