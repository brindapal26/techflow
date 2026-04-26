import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { socialConnections } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;

  const connections = await db
    .select({
      id: socialConnections.id,
      platform: socialConnections.platform,
      connectionType: socialConnections.connectionType,
      platformUserId: socialConnections.platformUserId,
      platformUsername: socialConnections.platformUsername,
      tokenExpiresAt: socialConnections.tokenExpiresAt,
      isActive: socialConnections.isActive,
      connectedAt: socialConnections.connectedAt,
    })
    .from(socialConnections)
    .where(eq(socialConnections.userId, currentUser.id));

  return NextResponse.json(connections);
}
