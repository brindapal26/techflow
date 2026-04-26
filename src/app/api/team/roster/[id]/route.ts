import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { companyEmployees } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const [employee] = await db
    .select({ id: companyEmployees.id, source: companyEmployees.source, userId: companyEmployees.userId })
    .from(companyEmployees)
    .where(and(eq(companyEmployees.id, id), eq(companyEmployees.companyId, currentUser.companyId)))
    .limit(1);

  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (employee.userId) {
    return NextResponse.json({ error: 'Cannot remove an employee who has already activated their account.' }, { status: 400 });
  }

  await db.delete(companyEmployees).where(eq(companyEmployees.id, id));

  return NextResponse.json({ success: true });
}
