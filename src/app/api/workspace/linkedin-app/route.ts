import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { companies } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { encrypt, safeDecrypt } from '@/lib/crypto';

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [company] = await db
    .select({ linkedinClientId: companies.linkedinClientId })
    .from(companies)
    .where(eq(companies.id, currentUser.companyId))
    .limit(1);

  return NextResponse.json({
    clientId: company?.linkedinClientId ?? '',
    // never return the secret — just whether it's set
    clientSecretSet: !!company?.linkedinClientSecret,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { clientId, clientSecret } = await req.json();
  if (!clientId?.trim()) {
    return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
  }

  // Check if already configured so we can keep the existing secret when blank
  const [existing] = await db
    .select({ linkedinClientSecret: companies.linkedinClientSecret })
    .from(companies)
    .where(eq(companies.id, currentUser.companyId))
    .limit(1);

  const isUpdate = !!existing?.linkedinClientSecret;
  if (!isUpdate && !clientSecret?.trim()) {
    return NextResponse.json({ error: 'Client Secret is required' }, { status: 400 });
  }

  const updates: Record<string, unknown> = { linkedinClientId: clientId.trim() };
  if (clientSecret?.trim()) {
    updates.linkedinClientSecret = encrypt(clientSecret.trim());
  }

  await db
    .update(companies)
    .set(updates)
    .where(eq(companies.id, currentUser.companyId));

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db
    .update(companies)
    .set({ linkedinClientId: null, linkedinClientSecret: null })
    .where(eq(companies.id, currentUser.companyId));

  return NextResponse.json({ ok: true });
}
