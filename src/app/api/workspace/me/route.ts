import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { companies } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const companyId = (session.user as any).companyId;
  const [company] = await db
    .select({ id: companies.id, name: companies.name, slug: companies.slug, website: companies.website, industry: companies.industry, logoUrl: companies.logoUrl, brandColor: companies.brandColor, careerPageUrl: companies.careerPageUrl })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  return NextResponse.json(company);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') {
    return NextResponse.json({ error: 'Only admins can update workspace settings' }, { status: 403 });
  }

  const { name, website, industry, logoUrl, brandColor, careerPageUrl } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Company name is required' }, { status: 400 });

  const [updated] = await db
    .update(companies)
    .set({
      name: name.trim(),
      website: website || null,
      industry: industry || null,
      logoUrl: logoUrl || null,
      brandColor: brandColor || null,
      careerPageUrl: careerPageUrl || null,
    })
    .where(eq(companies.id, currentUser.companyId))
    .returning({ id: companies.id, name: companies.name, slug: companies.slug });

  return NextResponse.json(updated);
}
