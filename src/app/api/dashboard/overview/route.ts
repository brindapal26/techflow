import { NextResponse } from 'next/server';
import { eq, desc, sum, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { posts, postSchedules, postAnalytics, postVersions, jobs, users } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  const companyId = currentUser.companyId;

  // Aggregate analytics totals
  const [totals] = await db
    .select({
      totalImpressions: sum(postAnalytics.impressions),
      totalClicks: sum(postAnalytics.clicks),
      totalApplications: sum(postAnalytics.applicationsAttributed),
      totalLikes: sum(postAnalytics.likes),
    })
    .from(postAnalytics)
    .innerJoin(postSchedules, eq(postAnalytics.postScheduleId, postSchedules.id))
    .innerJoin(posts, eq(postSchedules.postId, posts.id))
    .where(eq(posts.companyId, companyId));

  // Post status counts
  const postRows = await db
    .select({ status: posts.status, createdAt: posts.createdAt })
    .from(posts)
    .where(eq(posts.companyId, companyId));

  const totalPosts = postRows.length;
  const scheduled = postRows.filter(p => p.status === 'scheduled').length;
  const published = postRows.filter(p => p.status === 'published').length;

  const totalImpressions = Number(totals?.totalImpressions ?? 0);
  const totalClicks = Number(totals?.totalClicks ?? 0);
  const totalApplications = Number(totals?.totalApplications ?? 0);
  const totalLikes = Number(totals?.totalLikes ?? 0);
  const engagementRate = totalImpressions > 0
    ? parseFloat(((totalLikes + totalClicks) / totalImpressions * 100).toFixed(2))
    : 0;

  // Monthly chart — last 7 months, count posts created
  const now = new Date();
  const monthlyChart: { name: string; posts: number; applications: number }[] = [];
  for (let m = 6; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const monthPosts = postRows.filter(p => {
      const pd = new Date(p.createdAt);
      return pd >= monthStart && pd < monthEnd;
    }).length;
    monthlyChart.push({ name: label, posts: monthPosts, applications: 0 });
  }

  // Recent activity — last 5 posts with creator name + job title
  const recentPosts = await db
    .select({
      id: posts.id,
      status: posts.status,
      platform: posts.platform,
      createdAt: posts.createdAt,
      jobTitle: jobs.title,
      creatorName: users.name,
    })
    .from(posts)
    .leftJoin(jobs, eq(posts.jobId, jobs.id))
    .leftJoin(users, eq(posts.createdBy, users.id))
    .where(eq(posts.companyId, companyId))
    .orderBy(desc(posts.createdAt))
    .limit(5);

  const recentActivity = recentPosts.map(p => {
    const who = p.creatorName ?? 'Someone';
    const action = p.status === 'published'
      ? 'published a post for'
      : p.status === 'scheduled'
      ? 'scheduled a post for'
      : 'drafted a post for';
    const timeAgo = formatTimeAgo(new Date(p.createdAt));
    return {
      user: who,
      action,
      target: p.jobTitle ?? 'a job',
      platform: p.platform,
      time: timeAgo,
    };
  });

  return NextResponse.json({
    summary: {
      totalPosts,
      published,
      scheduled,
      totalApplications,
      totalClicks,
      totalImpressions,
      engagementRate,
    },
    monthlyChart,
    recentActivity,
  });
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
