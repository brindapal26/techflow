import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { socialConnections } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { safeDecrypt } from '@/lib/crypto';

function getLinkedInVersion() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1); // always use previous month — current month may not be released yet
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;

  // Fetch the user's LinkedIn connection
  const [conn] = await db
    .select({
      id: socialConnections.id,
      accessToken: socialConnections.accessToken,
      platformUserId: socialConnections.platformUserId,
      tokenExpiresAt: socialConnections.tokenExpiresAt,
    })
    .from(socialConnections)
    .where(
      and(
        eq(socialConnections.userId, currentUser.id),
        eq(socialConnections.platform, 'linkedin'),
        eq(socialConnections.connectionType, 'personal'),
        eq(socialConnections.isActive, true)
      )
    )
    .limit(1);

  if (!conn) {
    return NextResponse.json({ error: 'No active LinkedIn connection found.' }, { status: 400 });
  }

  // Check token expiry
  if (conn.tokenExpiresAt && new Date(conn.tokenExpiresAt) < new Date()) {
    return NextResponse.json({ error: 'LinkedIn token has expired. Please reconnect.' }, { status: 400 });
  }

  const accessToken = safeDecrypt(conn.accessToken!);
  const personUrn = `urn:li:person:${conn.platformUserId}`;

  const postBody = {
    author: personUrn,
    commentary: '🚀 We\'re hiring! Smart IT Frame is actively looking for top tech talent.\n\n💼 Explore open roles and apply at 👇\nhttps://smartitframe.com\n\n#hiring #nowhiring #techjobs #staffing #SmartITFrame\n\n(Test post via TalentFlow — please ignore or delete)',
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  };

  const res = await fetch('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': getLinkedInVersion(),
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postBody),
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errorMsg = `LinkedIn API error (${res.status})`;
    try {
      const errJson = JSON.parse(errorText);
      errorMsg = errJson.message ?? errJson.error_description ?? errorMsg;
    } catch {
      errorMsg = errorText.slice(0, 300) || errorMsg;
    }
    return NextResponse.json({ error: errorMsg }, { status: 502 });
  }

  // LinkedIn returns 201 with the post URN in the Location header (no body)
  const postUrn = res.headers.get('x-linkedin-id') ?? res.headers.get('location') ?? 'unknown';

  return NextResponse.json({ success: true, postUrn });
}
