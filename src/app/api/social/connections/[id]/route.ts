import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { socialConnections } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  const { id } = await params;

  const result = await db
    .delete(socialConnections)
    .where(
      and(
        eq(socialConnections.id, id),
        eq(socialConnections.userId, currentUser.id)
      )
    )
    .returning({ id: socialConnections.id });

  if (result.length === 0) {
    return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
