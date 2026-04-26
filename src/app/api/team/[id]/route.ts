import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

// PATCH /api/team/[id] — update role or active status (admin only)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const { role, isActive } = await req.json();

  // Prevent admin from modifying their own role
  if (id === currentUser.id && role !== undefined) {
    return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 });
  }

  // Ensure target user belongs to same company
  const [target] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), eq(users.companyId, currentUser.companyId)))
    .limit(1);

  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const updates: Record<string, any> = {};
  if (role !== undefined && ['company_admin', 'recruiter'].includes(role)) updates.role = role;
  if (isActive !== undefined) updates.isActive = isActive;

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, id))
    .returning({ id: users.id, name: users.name, email: users.email, role: users.role, isActive: users.isActive });

  return NextResponse.json(updated);
}

// DELETE /api/team/[id] — deactivate user (soft delete)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  if (id === currentUser.id) {
    return NextResponse.json({ error: 'You cannot deactivate your own account' }, { status: 400 });
  }

  await db
    .update(users)
    .set({ isActive: false })
    .where(and(eq(users.id, id), eq(users.companyId, currentUser.companyId)));

  return NextResponse.json({ success: true });
}
