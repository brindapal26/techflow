import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { atsConnections } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const { customJobEndpoint } = await req.json();

  const [connection] = await db
    .select()
    .from(atsConnections)
    .where(and(eq(atsConnections.id, id), eq(atsConnections.companyId, currentUser.companyId)))
    .limit(1);

  if (!connection) return NextResponse.json({ error: 'Connection not found' }, { status: 404 });

  const existingConfig = (connection.config ?? {}) as Record<string, any>;
  await db
    .update(atsConnections)
    .set({ config: { ...existingConfig, customJobEndpoint: customJobEndpoint || null } })
    .where(eq(atsConnections.id, id));

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  await db
    .delete(atsConnections)
    .where(and(eq(atsConnections.id, id), eq(atsConnections.companyId, currentUser.companyId)));

  return NextResponse.json({ success: true });
}
