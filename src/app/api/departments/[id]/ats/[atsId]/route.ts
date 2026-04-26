import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { atsConnections, departments } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

// Unlink an ATS connection from this department (sets departmentId to null)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; atsId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, atsId } = await params;

  const [dept] = await db
    .select({ id: departments.id })
    .from(departments)
    .where(and(eq(departments.id, id), eq(departments.companyId, currentUser.companyId)))
    .limit(1);
  if (!dept) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [updated] = await db
    .update(atsConnections)
    .set({ departmentId: null })
    .where(
      and(
        eq(atsConnections.id, atsId),
        eq(atsConnections.companyId, currentUser.companyId),
        eq(atsConnections.departmentId, id)
      )
    )
    .returning({ id: atsConnections.id });

  if (!updated) return NextResponse.json({ error: 'ATS connection not found in this department' }, { status: 404 });

  return NextResponse.json({ success: true });
}
