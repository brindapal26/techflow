import { NextRequest, NextResponse } from 'next/server';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { atsConnections, departments } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const [dept] = await db
    .select({ id: departments.id })
    .from(departments)
    .where(and(eq(departments.id, id), eq(departments.companyId, currentUser.companyId)))
    .limit(1);
  if (!dept) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const rows = await db
    .select({
      id: atsConnections.id,
      provider: atsConnections.provider,
      status: atsConnections.status,
      lastSyncedAt: atsConnections.lastSyncedAt,
      customUrl: atsConnections.customUrl,
    })
    .from(atsConnections)
    .where(
      and(eq(atsConnections.companyId, currentUser.companyId), eq(atsConnections.departmentId, id))
    );

  return NextResponse.json(rows);
}

// Assign an existing (unlinked) ATS connection to this department
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const { atsId } = await req.json();
  if (!atsId) return NextResponse.json({ error: 'atsId is required' }, { status: 400 });

  const [dept] = await db
    .select({ id: departments.id })
    .from(departments)
    .where(and(eq(departments.id, id), eq(departments.companyId, currentUser.companyId)))
    .limit(1);
  if (!dept) return NextResponse.json({ error: 'Department not found' }, { status: 404 });

  const [updated] = await db
    .update(atsConnections)
    .set({ departmentId: id })
    .where(
      and(
        eq(atsConnections.id, atsId),
        eq(atsConnections.companyId, currentUser.companyId),
        isNull(atsConnections.departmentId) // only unassigned connections
      )
    )
    .returning({ id: atsConnections.id });

  if (!updated) {
    return NextResponse.json(
      { error: 'ATS connection not found or already assigned to a department' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
