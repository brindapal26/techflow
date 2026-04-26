import { NextRequest, NextResponse } from 'next/server';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { invitations, users } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth-utils';

// POST /api/invitations/accept
export async function POST(req: NextRequest) {
  try {
    const { token, name, password } = await req.json();

    if (!token || !name || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Find valid, unused invite
    const [invite] = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.token, token),
          isNull(invitations.acceptedAt),
          gt(invitations.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!invite) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const [user] = await db
      .insert(users)
      .values({
        email: invite.email,
        name,
        passwordHash,
        companyId: invite.companyId,
        role: invite.role,
        createdBy: invite.invitedBy,
      })
      .returning();

    // Mark invite as accepted
    await db
      .update(invitations)
      .set({ acceptedAt: new Date() })
      .where(eq(invitations.id, invite.id));

    return NextResponse.json({ userId: user.id }, { status: 201 });
  } catch (err) {
    console.error('[accept-invite]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
