import { NextRequest, NextResponse } from 'next/server';
import { eq, and, inArray } from 'drizzle-orm';
import { Resend } from 'resend';
import { db } from '@/lib/db';
import { users, companies } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

function buildEmail({
  recruiterName,
  companyName,
  appUrl,
  senderName,
}: {
  recruiterName: string;
  companyName: string;
  appUrl: string;
  senderName: string;
}) {
  const connectUrl = `${appUrl}/dashboard/social-profiles`;

  return {
    subject: `${senderName} invited you to connect LinkedIn on TalentFlow`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Connect your LinkedIn</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:36px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;">
                  <span style="color:white;font-size:18px;font-weight:800;">T</span>
                </div>
                <span style="color:white;font-size:22px;font-weight:800;letter-spacing:-0.5px;">TalentFlow</span>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:14px;color:#6366f1;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Action required</p>
              <h1 style="margin:0 0 20px;font-size:26px;font-weight:800;color:#0f172a;line-height:1.2;">
                Connect your LinkedIn to start posting
              </h1>
              <p style="margin:0 0 24px;font-size:16px;color:#475569;line-height:1.6;">
                Hi ${recruiterName},
              </p>
              <p style="margin:0 0 24px;font-size:16px;color:#475569;line-height:1.6;">
                <strong style="color:#0f172a;">${senderName}</strong> has invited you to connect your LinkedIn profile on <strong style="color:#0f172a;">${companyName}'s TalentFlow workspace</strong>.
              </p>
              <p style="margin:0 0 32px;font-size:16px;color:#475569;line-height:1.6;">
                Once connected, TalentFlow will automatically publish AI-generated job posts to your LinkedIn — saving you hours each week.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background:#0A66C2;border-radius:10px;">
                    <a href="${connectUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;letter-spacing:-0.2px;">
                      Connect My LinkedIn →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Benefits -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:20px;">
                <tr>
                  <td style="padding:0 0 12px;">
                    <p style="margin:0;font-size:13px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.05em;">Why connect?</p>
                  </td>
                </tr>
                ${[
                  ['🚀', 'AI writes the posts — you review and approve'],
                  ['📅', 'Posts scheduled automatically at optimal times'],
                  ['📈', 'Personal profiles get 5× more reach than company pages'],
                  ['🔒', 'You stay in control — disconnect any time'],
                ].map(([icon, text]) => `
                <tr>
                  <td style="padding:4px 0;">
                    <p style="margin:0;font-size:14px;color:#475569;line-height:1.5;">
                      <span style="margin-right:8px;">${icon}</span>${text}
                    </p>
                  </td>
                </tr>`).join('')}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #f1f5f9;">
              <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;line-height:1.6;">
                You received this because you're a recruiter on <strong>${companyName}'s</strong> TalentFlow workspace.<br/>
                If you have questions, reply to this email or contact your admin.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}

// POST /api/social/remind
// Body: { userIds: string[] }  — array of recruiter IDs to remind
// Sends LinkedIn connect reminder to each
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  if (currentUser.role !== 'company_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userIds } = await req.json();
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: 'userIds array is required' }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email not configured — add RESEND_API_KEY to .env.local' }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  // Fetch company name
  const [company] = await db
    .select({ name: companies.name })
    .from(companies)
    .where(eq(companies.id, currentUser.companyId))
    .limit(1);

  // Fetch sender info
  const [sender] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, currentUser.id))
    .limit(1);

  // Fetch target recruiters
  const targets = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(
      and(
        eq(users.companyId, currentUser.companyId),
        inArray(users.id, userIds)
      )
    );

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@talentflow.app';
  const companyName = company?.name ?? 'Your Company';
  const senderName = sender?.name ?? sender?.email ?? 'Your Admin';

  const results = await Promise.allSettled(
    targets.map(target => {
      const { subject, html } = buildEmail({
        recruiterName: target.name ?? target.email,
        companyName,
        appUrl,
        senderName,
      });
      return resend.emails.send({
        from: fromEmail,
        to: target.email,
        subject,
        html,
      });
    })
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  return NextResponse.json({ sent, failed, total: targets.length });
}
