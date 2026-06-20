import { NextRequest, NextResponse } from 'next/server';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { platformRules, departments } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [rules, depts] = await Promise.all([
    db.select().from(platformRules).where(eq(platformRules.companyId, currentUser.companyId)),
    db
      .select({ id: departments.id, name: departments.name })
      .from(departments)
      .where(eq(departments.companyId, currentUser.companyId)),
  ]);

  return NextResponse.json({ rules, departments: depts });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { departmentId = null, role = null, allowedPlatforms } = body;

  if (!Array.isArray(allowedPlatforms)) {
    return NextResponse.json({ error: 'allowedPlatforms must be an array' }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(platformRules)
    .where(
      and(
        eq(platformRules.companyId, currentUser.companyId),
        departmentId ? eq(platformRules.departmentId, departmentId) : isNull(platformRules.departmentId),
        role ? eq(platformRules.role, role) : isNull(platformRules.role),
      ),
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(platformRules)
      .set({ allowedPlatforms, updatedAt: new Date() })
      .where(eq(platformRules.id, existing.id))
      .returning();
    return NextResponse.json(updated);
  }

  const [created] = await db
    .insert(platformRules)
    .values({
      companyId: currentUser.companyId,
      departmentId: departmentId ?? null,
      role: role ?? null,
      allowedPlatforms,
    })
    .returning();

  return NextResponse.json(created);
}
