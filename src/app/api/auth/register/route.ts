import { NextRequest, NextResponse } from 'next/server';
import { eq, like } from 'drizzle-orm';
import { db } from '@/lib/db';
import { companies, users } from '@/lib/db/schema';
import { hashPassword, generateSlug } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyName, website, industry, name, email, password } = body;

    if (!companyName || !email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Check email not already taken
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Generate unique slug
    const baseSlug = generateSlug(companyName);
    const existingSlugs = await db
      .select({ slug: companies.slug })
      .from(companies)
      .where(like(companies.slug, `${baseSlug}%`));

    let slug = baseSlug;
    if (existingSlugs.length > 0) {
      slug = `${baseSlug}-${existingSlugs.length + 1}`;
    }

    // Create company
    const [company] = await db
      .insert(companies)
      .values({ name: companyName, slug, website, industry })
      .returning();

    // Create admin user
    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(users)
      .values({ email, name, passwordHash, companyId: company.id, role: 'company_admin' })
      .returning();

    return NextResponse.json(
      { userId: user.id, companyId: company.id, slug: company.slug },
      { status: 201 }
    );
  } catch (err) {
    console.error('[register]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
