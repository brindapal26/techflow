import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { atsConnections } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { getCeipalUsers } from '@/lib/ats/ceipal';
import { safeDecrypt } from '@/lib/crypto';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  const { id } = await params;

  const [connection] = await db
    .select()
    .from(atsConnections)
    .where(
      and(
        eq(atsConnections.id, id),
        eq(atsConnections.companyId, currentUser.companyId)
      )
    )
    .limit(1);

  if (!connection) {
    return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
  }

  if (connection.provider !== 'ceipal') {
    return NextResponse.json({ error: 'Users endpoint is only supported for Ceipal connections' }, { status: 400 });
  }

  const config = connection.config as any;
  const email = config?.email;
  const password = config?.password ? safeDecrypt(config.password) : null;
  const apiKey = connection.apiKey;

  if (!email || !password || !apiKey) {
    return NextResponse.json({ error: 'Missing credentials in connection config' }, { status: 400 });
  }

  try {
    const users = await getCeipalUsers(email, password, apiKey);
    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Failed to fetch users' }, { status: 500 });
  }
}
