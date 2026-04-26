import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { companyEmployees, users, companies } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth-utils';

// POST /api/auth/register-employee
// Called when an employee is found in the roster and sets their password to join.
export async function POST(req: NextRequest) {
  try {
    const { email, slug, password, employeeId } = await req.json();

    if (!email || !slug || !password || !employeeId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Resolve company
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.slug, slug))
      .limit(1);

    if (!company) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

    // Verify employee record belongs to this company and email matches
    const [employee] = await db
      .select()
      .from(companyEmployees)
      .where(and(eq(companyEmployees.id, employeeId), eq(companyEmployees.companyId, company.id), eq(companyEmployees.email, email)))
      .limit(1);

    if (!employee) {
      return NextResponse.json({ error: 'Employee record not found' }, { status: 404 });
    }

    // Make sure they haven't already registered
    const [alreadyUser] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.companyId, company.id)))
      .limit(1);

    if (alreadyUser) {
      return NextResponse.json({ error: 'Account already exists. Please log in.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        name: employee.name ?? email.split('@')[0],
        passwordHash,
        companyId: company.id,
        role: 'recruiter',
      })
      .returning();

    // Link employee record to new user
    await db
      .update(companyEmployees)
      .set({ userId: newUser.id })
      .where(eq(companyEmployees.id, employeeId));

    return NextResponse.json({ userId: newUser.id }, { status: 201 });
  } catch (err) {
    console.error('[register-employee]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
