import { NextRequest, NextResponse } from 'next/server';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { posts, postVersions, jobs } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;

  const rows = await db
    .select({
      id: posts.id,
      platform: posts.platform,
      status: posts.status,
      jobId: posts.jobId,
      createdBy: posts.createdBy,
      createdAt: posts.createdAt,
      activeVersionId: posts.activeVersionId,
    })
    .from(posts)
    .where(eq(posts.companyId, currentUser.companyId))
    .orderBy(desc(posts.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  const { jobId, platform, caption, hashtags } = await req.json();

  if (!jobId || !platform || !caption) {
    return NextResponse.json({ error: 'jobId, platform, and caption are required' }, { status: 400 });
  }

  // Verify job belongs to company
  const [job] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.companyId, currentUser.companyId)))
    .limit(1);

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  // Create post (draft)
  const [post] = await db
    .insert(posts)
    .values({
      companyId: currentUser.companyId,
      jobId,
      createdBy: currentUser.id,
      platform,
      status: 'draft',
    })
    .returning();

  // Create first version
  const [version] = await db
    .insert(postVersions)
    .values({
      postId: post.id,
      versionNumber: 1,
      caption,
      hashtags: hashtags ?? [],
      aiGenerated: true,
      createdBy: currentUser.id,
    })
    .returning();

  // Link active version
  await db
    .update(posts)
    .set({ activeVersionId: version.id })
    .where(eq(posts.id, post.id));

  return NextResponse.json({ id: post.id, versionId: version.id }, { status: 201 });
}
