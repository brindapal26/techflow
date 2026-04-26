import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/auth-utils';

// GET /api/profile — current user's profile
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email, avatarUrl: users.avatarUrl, role: users.role, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, (session.user as any).id))
    .limit(1);

  return NextResponse.json(user);
}

// PATCH /api/profile — update name / avatar
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, avatarUrl } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const [updated] = await db
    .update(users)
    .set({ name: name.trim(), avatarUrl: avatarUrl ?? null })
    .where(eq(users.id, (session.user as any).id))
    .returning({ id: users.id, name: users.name, email: users.email });

  return NextResponse.json(updated);
}

// POST /api/profile/password — change password
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Both current and new password are required' }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
  }

  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, (session.user as any).id))
    .limit(1);

  const valid = await verifyPassword(currentPassword, user.passwordHash!);
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, (session.user as any).id));

  return NextResponse.json({ success: true });
}
