import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { postSchedules, posts } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUser = session.user as any;
  const { id } = await params;
  const { scheduledAt } = await req.json();

  if (!scheduledAt) {
    return NextResponse.json({ error: 'scheduledAt is required' }, { status: 400 });
  }

  const [row] = await db
    .select({
      scheduleId: postSchedules.id,
      companyId: posts.companyId,
      createdBy: posts.createdBy,
    })
    .from(postSchedules)
    .innerJoin(posts, eq(postSchedules.postId, posts.id))
    .where(eq(postSchedules.id, id))
    .limit(1);

  if (!row) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });

  if (row.companyId !== currentUser.companyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (currentUser.role === 'recruiter' && row.createdBy !== currentUser.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [updated] = await db
    .update(postSchedules)
    .set({ scheduledAt: new Date(scheduledAt) })
    .where(eq(postSchedules.id, id))
    .returning({ id: postSchedules.id, scheduledAt: postSchedules.scheduledAt });

  return NextResponse.json({ id: updated.id, scheduledAt: updated.scheduledAt });
}
