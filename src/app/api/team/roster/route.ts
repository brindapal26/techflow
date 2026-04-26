import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { companyEmployees } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const roster = await db
    .select({
      id: companyEmployees.id,
      email: companyEmployees.email,
      name: companyEmployees.name,
      title: companyEmployees.title,
      department: companyEmployees.department,
      phone: companyEmployees.phone,
      source: companyEmployees.source,
      userId: companyEmployees.userId,
      syncedAt: companyEmployees.syncedAt,
    })
    .from(companyEmployees)
    .where(eq(companyEmployees.companyId, currentUser.companyId))
    .orderBy(companyEmployees.name);

  return NextResponse.json(roster);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { email, name, title, department, phone } = await req.json();
  if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  const normalizedEmail = email.trim().toLowerCase();

  // Check for duplicate
  const [existing] = await db
    .select({ id: companyEmployees.id })
    .from(companyEmployees)
    .where(and(eq(companyEmployees.email, normalizedEmail), eq(companyEmployees.companyId, currentUser.companyId)))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: 'This email is already in the roster.' }, { status: 409 });
  }

  const [employee] = await db
    .insert(companyEmployees)
    .values({
      companyId: currentUser.companyId,
      email: normalizedEmail,
      name: name?.trim() || null,
      title: title?.trim() || null,
      department: department?.trim() || null,
      phone: phone?.trim() || null,
      source: 'manual',
    })
    .returning();

  return NextResponse.json(employee, { status: 201 });
}
