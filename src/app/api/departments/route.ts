import { NextRequest, NextResponse } from 'next/server';
import { eq, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { departments, userDepartments, atsConnections } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rows = await db
    .select()
    .from(departments)
    .where(eq(departments.companyId, currentUser.companyId));

  // Fetch member and ATS counts per department
  const [memberCounts, atsCounts] = await Promise.all([
    db
      .select({ departmentId: userDepartments.departmentId, count: count() })
      .from(userDepartments)
      .groupBy(userDepartments.departmentId),
    db
      .select({ departmentId: atsConnections.departmentId, count: count() })
      .from(atsConnections)
      .where(eq(atsConnections.companyId, currentUser.companyId))
      .groupBy(atsConnections.departmentId),
  ]);

  const memberMap = new Map(memberCounts.map((r) => [r.departmentId, r.count]));
  const atsMap = new Map(atsCounts.map((r) => [r.departmentId, r.count]));

  const result = rows.map((d) => ({
    ...d,
    memberCount: memberMap.get(d.id) ?? 0,
    atsCount: atsMap.get(d.id) ?? 0,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { name, description } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
  }

  const [dept] = await db
    .insert(departments)
    .values({ companyId: currentUser.companyId, name: name.trim(), description: description?.trim() || null })
    .returning();

  return NextResponse.json({ ...dept, memberCount: 0, atsCount: 0 }, { status: 201 });
}
