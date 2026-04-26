import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { userDepartments, users, departments } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  // Verify dept belongs to this company
  const [dept] = await db
    .select({ id: departments.id })
    .from(departments)
    .where(and(eq(departments.id, id), eq(departments.companyId, currentUser.companyId)))
    .limit(1);

  if (!dept) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      assignedAt: userDepartments.assignedAt,
    })
    .from(userDepartments)
    .innerJoin(users, eq(userDepartments.userId, users.id))
    .where(eq(userDepartments.departmentId, id));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

  // Verify dept and user belong to this company
  const [dept] = await db
    .select({ id: departments.id })
    .from(departments)
    .where(and(eq(departments.id, id), eq(departments.companyId, currentUser.companyId)))
    .limit(1);
  if (!dept) return NextResponse.json({ error: 'Department not found' }, { status: 404 });

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.companyId, currentUser.companyId)))
    .limit(1);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Ignore if already in dept
  const [existing] = await db
    .select({ id: userDepartments.id })
    .from(userDepartments)
    .where(and(eq(userDepartments.userId, userId), eq(userDepartments.departmentId, id)))
    .limit(1);
  if (existing) return NextResponse.json({ error: 'User already in this department' }, { status: 409 });

  await db.insert(userDepartments).values({ userId, departmentId: id });

  return NextResponse.json({ success: true }, { status: 201 });
}
