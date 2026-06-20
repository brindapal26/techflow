import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { platformRules } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;

  const [rule] = await db
    .select()
    .from(platformRules)
    .where(and(eq(platformRules.id, id), eq(platformRules.companyId, currentUser.companyId)))
    .limit(1);

  if (!rule) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.delete(platformRules).where(eq(platformRules.id, id));

  return NextResponse.json({ success: true });
}
