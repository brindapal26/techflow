import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { companies } from '@/lib/db/schema';

// GET /api/workspace/[slug] — validate slug and return company info for login page
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [company] = await db
    .select({ id: companies.id, name: companies.name, slug: companies.slug, logoUrl: companies.logoUrl })
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);

  if (!company) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  return NextResponse.json(company);
}
