import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { userDepartments, departments } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, userId } = await params;

  // Verify dept belongs to this company
  const [dept] = await db
    .select({ id: departments.id })
    .from(departments)
    .where(and(eq(departments.id, id), eq(departments.companyId, currentUser.companyId)))
    .limit(1);
  if (!dept) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db
    .delete(userDepartments)
    .where(and(eq(userDepartments.departmentId, id), eq(userDepartments.userId, userId)));

  return NextResponse.json({ success: true });
}
