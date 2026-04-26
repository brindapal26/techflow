import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { companyEmployees, users, companies } from '@/lib/db/schema';

// POST /api/auth/lookup
// Given an email + company slug, checks:
// 1. Is this person already a registered user? → prompt login
// 2. Are they in the employee list (from ATS sync)? → pre-fill name, prompt password creation
// 3. Neither → not found

export async function POST(req: NextRequest) {
  const { email, slug } = await req.json();

  if (!email || !slug) {
    return NextResponse.json({ error: 'Email and workspace slug required' }, { status: 400 });
  }

  // Resolve company from slug
  const [company] = await db
    .select({ id: companies.id, name: companies.name })
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);

  if (!company) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  // Check if already a registered user in this company
  const [existingUser] = await db
    .select({ id: users.id, name: users.name, email: users.email, isActive: users.isActive })
    .from(users)
    .where(and(eq(users.email, email), eq(users.companyId, company.id)))
    .limit(1);

  if (existingUser) {
    if (!existingUser.isActive) {
      return NextResponse.json({ error: 'Your account has been deactivated. Contact your admin.' }, { status: 403 });
    }
    return NextResponse.json({
      status: 'existing_user',
      name: existingUser.name,
      companyName: company.name,
    });
  }

  // Check employee roster (synced from ATS)
  const [employee] = await db
    .select({ id: companyEmployees.id, name: companyEmployees.name, title: companyEmployees.title, department: companyEmployees.department })
    .from(companyEmployees)
    .where(and(eq(companyEmployees.email, email), eq(companyEmployees.companyId, company.id)))
    .limit(1);

  if (employee) {
    return NextResponse.json({
      status: 'employee_found',
      name: employee.name,
      title: employee.title,
      department: employee.department,
      companyName: company.name,
      employeeId: employee.id,
    });
  }

  // Not found in either
  return NextResponse.json({
    status: 'not_found',
    companyName: company.name,
  });
}
