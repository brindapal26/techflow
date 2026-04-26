import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { companies } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.redirect(new URL('/login', req.url));

  const currentUser = session.user as any;

  // Read LinkedIn app credentials from DB (set by company admin)
  const [company] = await db
    .select({ linkedinClientId: companies.linkedinClientId })
    .from(companies)
    .where(eq(companies.id, currentUser.companyId))
    .limit(1);

  const clientId = company?.linkedinClientId || process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL('/dashboard/social-profiles?error=linkedin_not_configured', req.url)
    );
  }

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/social/linkedin/callback`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'openid profile email w_member_social',
    state: currentUser.id,
  });

  return NextResponse.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?${params}`
  );
}
