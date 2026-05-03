import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { Resend } from 'resend';
import { db } from '@/lib/db';
import { invitations, users, companies } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { generateInviteToken } from '@/lib/auth-utils';

// POST /api/invitations — admin sends invite
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { email, role = 'recruiter' } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  // Check not already a user
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return NextResponse.json({ error: 'User already exists with this email' }, { status: 409 });
  }

  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const [invite] = await db
    .insert(invitations)
    .values({
      email,
      companyId: currentUser.companyId,
      role,
      token,
      expiresAt,
      invitedBy: currentUser.id,
    })
    .returning();

  const inviteUrl = `${process.env.AUTH_URL ?? process.env.NEXTAUTH_URL}/invite/${token}`;

  // Send invite email via Resend
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const [company] = await db
      .select({ name: companies.name })
      .from(companies)
      .where(eq(companies.id, currentUser.companyId))
      .limit(1);

    const [sender] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, currentUser.id))
      .limit(1);

    const companyName = company?.name ?? 'Your Company';
    const senderName = sender?.name ?? sender?.email ?? 'Your Admin';
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@talentflow.app';

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `${senderName} invited you to join ${companyName} on TalentFlow`,
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:36px 40px;text-align:center;">
            <span style="color:white;font-size:22px;font-weight:800;letter-spacing:-0.5px;">TalentFlow</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 8px;font-size:14px;color:#6366f1;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">You're invited</p>
            <h1 style="margin:0 0 20px;font-size:26px;font-weight:800;color:#0f172a;line-height:1.2;">Join ${companyName} on TalentFlow</h1>
            <p style="margin:0 0 24px;font-size:16px;color:#475569;line-height:1.6;">
              <strong style="color:#0f172a;">${senderName}</strong> has invited you to join <strong style="color:#0f172a;">${companyName}'s</strong> workspace on TalentFlow — the AI-powered social recruiting platform.
            </p>
            <p style="margin:0 0 32px;font-size:14px;color:#94a3b8;">This invitation expires in 7 days.</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
              <tr>
                <td style="background:#4f46e5;border-radius:10px;">
                  <a href="${inviteUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;">Accept Invitation →</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#94a3b8;">Or copy this link: <a href="${inviteUrl}" style="color:#6366f1;">${inviteUrl}</a></p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">You received this because you were invited to ${companyName}'s TalentFlow workspace.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    }).catch(() => {
      // Non-fatal: invitation is created, email failure shouldn't block the response
    });
  }

  return NextResponse.json({ inviteUrl, token: invite.token }, { status: 201 });
}

// GET /api/invitations — list pending invitations for company
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const pending = await db
    .select()
    .from(invitations)
    .where(and(eq(invitations.companyId, currentUser.companyId)));

  return NextResponse.json(pending);
}
