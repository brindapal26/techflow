import { NextRequest, NextResponse } from 'next/server';
import { eq, and, isNotNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { postSchedules, posts, socialConnections, postAnalytics } from '@/lib/db/schema';
import { safeDecrypt } from '@/lib/crypto';

function getLinkedInVersion() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const schedules = await db
    .select({
      scheduleId: postSchedules.id,
      linkedinPostId: postSchedules.linkedinPostId,
      createdBy: posts.createdBy,
    })
    .from(postSchedules)
    .innerJoin(posts, eq(postSchedules.postId, posts.id))
    .where(
      and(
        eq(postSchedules.status, 'posted'),
        isNotNull(postSchedules.linkedinPostId)
      )
    );

  let synced = 0;
  let skipped = 0;

  const liVersion = getLinkedInVersion();

  for (const schedule of schedules) {
    const [conn] = await db
      .select({
        accessToken: socialConnections.accessToken,
      })
      .from(socialConnections)
      .where(
        and(
          eq(socialConnections.userId, schedule.createdBy),
          eq(socialConnections.platform, 'linkedin'),
          eq(socialConnections.isActive, true)
        )
      )
      .limit(1);

    if (!conn || !conn.accessToken) {
      skipped++;
      continue;
    }

    const accessToken = safeDecrypt(conn.accessToken);

    let statsRes: Response;
    try {
      statsRes = await fetch(
        `https://api.linkedin.com/rest/posts/${schedule.linkedinPostId}/statistics`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'LinkedIn-Version': liVersion,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );
    } catch {
      skipped++;
      continue;
    }

    if (!statsRes.ok) {
      skipped++;
      continue;
    }

    let data: Record<string, unknown>;
    try {
      data = await statsRes.json();
    } catch {
      skipped++;
      continue;
    }

    const value = (data.value ?? {}) as Record<string, unknown>;

    const impressions = Number(value.impressionCount ?? 0);
    const clicks = Number(value.clickCount ?? 0);
    const likes = Number(value.likeCount ?? 0);
    const shares = Number(value.shareCount ?? 0);
    const comments = Number(value.commentCount ?? 0);

    await db
      .delete(postAnalytics)
      .where(eq(postAnalytics.postScheduleId, schedule.scheduleId));

    await db.insert(postAnalytics).values({
      postScheduleId: schedule.scheduleId,
      impressions,
      clicks,
      likes,
      shares,
      comments,
      applicationsAttributed: 0,
      pulledAt: new Date(),
    });

    synced++;
  }

  return NextResponse.json({ synced, skipped });
}
