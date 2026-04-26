import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { atsConnections } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const companyId = (session.user as any).companyId;

  const rows = await db
    .select({
      id: atsConnections.id,
      provider: atsConnections.provider,
      status: atsConnections.status,
      lastSyncedAt: atsConnections.lastSyncedAt,
      customUrl: atsConnections.customUrl,
      departmentId: atsConnections.departmentId,
      config: atsConnections.config,
    })
    .from(atsConnections)
    .where(eq(atsConnections.companyId, companyId));

  // Strip credentials before returning to client — expose only safe config keys
  const connections = rows.map(({ config, ...rest }) => ({
    ...rest,
    config: config ? { customJobEndpoint: (config as any).customJobEndpoint ?? null } : null,
    departmentId: rest.departmentId ?? null,
  }));

  return NextResponse.json(connections);
}
