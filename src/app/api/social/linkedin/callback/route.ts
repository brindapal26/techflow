import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { companies, socialConnections } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { encrypt, safeDecrypt } from '@/lib/crypto';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.redirect(new URL('/login', req.url));

  const currentUser = session.user as any;
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(
      new URL('/dashboard/social-profiles?error=linkedin_denied', req.url)
    );
  }

  // Read credentials from company DB record
  const [company] = await db
    .select({
      linkedinClientId: companies.linkedinClientId,
      linkedinClientSecret: companies.linkedinClientSecret,
    })
    .from(companies)
    .where(eq(companies.id, currentUser.companyId))
    .limit(1);

  const clientId = company?.linkedinClientId || process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = company?.linkedinClientSecret
    ? safeDecrypt(company.linkedinClientSecret)
    : (process.env.LINKEDIN_CLIENT_SECRET ?? null);

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL('/dashboard/social-profiles?error=linkedin_not_configured', req.url)
    );
  }

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/social/linkedin/callback`;

  // Exchange code for access token
  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(
      new URL('/dashboard/social-profiles?error=linkedin_token', req.url)
    );
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  const expiresIn: number = tokenData.expires_in ?? 5184000;
  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

  // Get profile via OpenID Connect userinfo
  const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!profileRes.ok) {
    return NextResponse.redirect(
      new URL('/dashboard/social-profiles?error=linkedin_profile', req.url)
    );
  }

  const profile = await profileRes.json();
  const platformUserId = String(profile.sub);
  const platformUsername = profile.name ?? profile.email ?? 'LinkedIn User';

  const encryptedToken = encrypt(accessToken);

  // Upsert social connection
  const [existing] = await db
    .select({ id: socialConnections.id })
    .from(socialConnections)
    .where(
      and(
        eq(socialConnections.userId, currentUser.id),
        eq(socialConnections.platform, 'linkedin'),
        eq(socialConnections.connectionType, 'personal')
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(socialConnections)
      .set({ accessToken: encryptedToken, tokenExpiresAt, platformUserId, platformUsername, isActive: true })
      .where(eq(socialConnections.id, existing.id));
  } else {
    await db.insert(socialConnections).values({
      userId: currentUser.id,
      companyId: currentUser.companyId,
      platform: 'linkedin',
      connectionType: 'personal',
      platformUserId,
      platformUsername,
      accessToken: encryptedToken,
      tokenExpiresAt,
    });
  }

  return NextResponse.redirect(
    new URL('/dashboard/social-profiles?success=linkedin_connected', req.url)
  );
}
