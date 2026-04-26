import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, socialConnections } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

// Admin-only: returns all active team members with their social connection status
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const teamMembers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.companyId, currentUser.companyId));

  const connections = await db
    .select({
      userId: socialConnections.userId,
      platform: socialConnections.platform,
      connectionType: socialConnections.connectionType,
      platformUsername: socialConnections.platformUsername,
      tokenExpiresAt: socialConnections.tokenExpiresAt,
      isActive: socialConnections.isActive,
      connectedAt: socialConnections.connectedAt,
    })
    .from(socialConnections)
    .where(eq(socialConnections.companyId, currentUser.companyId));

  // Join: for each team member, attach their connections
  const result = teamMembers
    .filter(u => u.isActive)
    .map(u => ({
      ...u,
      connections: connections.filter(c => c.userId === u.id),
    }));

  return NextResponse.json(result);
}
