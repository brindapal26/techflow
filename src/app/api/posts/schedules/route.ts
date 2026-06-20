import { NextRequest, NextResponse } from 'next/server';
import { eq, and, asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { postSchedules, postVersions, posts, jobs } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUser = session.user as any;

  const conditions = [eq(posts.companyId, currentUser.companyId)];
  if (currentUser.role === 'recruiter') {
    conditions.push(eq(posts.createdBy, currentUser.id));
  }

  const rows = await db
    .select({
      id: postSchedules.id,
      scheduledAt: postSchedules.scheduledAt,
      status: postSchedules.status,
      platform: posts.platform,
      postId: postSchedules.postId,
      jobTitle: jobs.title,
      postVersionId: postSchedules.postVersionId,
    })
    .from(postSchedules)
    .innerJoin(posts, eq(postSchedules.postId, posts.id))
    .innerJoin(jobs, eq(posts.jobId, jobs.id))
    .where(and(...conditions))
    .orderBy(asc(postSchedules.scheduledAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUser = session.user as any;
  const { jobId, platform, caption, hashtags, scheduledAt, imageUrl } = await req.json();

  if (!jobId || !platform || !caption || !scheduledAt) {
    return NextResponse.json(
      { error: 'jobId, platform, caption, and scheduledAt are required' },
      { status: 400 }
    );
  }

  const [job] = await db
    .select({
      id: jobs.id,
      companyId: jobs.companyId,
      assignedRecruiterId: jobs.assignedRecruiterId,
    })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.companyId, currentUser.companyId)))
    .limit(1);

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  if (currentUser.role === 'recruiter' && job.assignedRecruiterId !== currentUser.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [post] = await db
    .insert(posts)
    .values({
      companyId: currentUser.companyId,
      jobId,
      createdBy: currentUser.id,
      platform,
      status: 'scheduled',
    })
    .returning();

  const versionValues: Record<string, unknown> = {
    postId: post.id,
    versionNumber: 1,
    caption,
    hashtags: hashtags ?? [],
    aiGenerated: true,
    createdBy: currentUser.id,
  };
  if (imageUrl) {
    versionValues.imageUrl = imageUrl;
  }

  const [version] = await db
    .insert(postVersions)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .values(versionValues as any)
    .returning();

  await db
    .update(posts)
    .set({ activeVersionId: version.id })
    .where(eq(posts.id, post.id));

  const [schedule] = await db
    .insert(postSchedules)
    .values({
      postId: post.id,
      postVersionId: version.id,
      scheduledAt: new Date(scheduledAt),
      status: 'pending',
      frequency: 'once',
    })
    .returning();

  return NextResponse.json(
    { postId: post.id, scheduleId: schedule.id, scheduledAt: schedule.scheduledAt },
    { status: 201 }
  );
}
