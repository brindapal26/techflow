import { NextResponse } from 'next/server';
import { eq, and, desc, sum, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  posts,
  postVersions,
  postSchedules,
  postAnalytics,
  jobs,
} from '@/lib/db/schema';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  const companyId = currentUser.companyId;

  // All posts for this company with job title and active version caption
  const allPosts = await db
    .select({
      id: posts.id,
      platform: posts.platform,
      status: posts.status,
      createdAt: posts.createdAt,
      jobId: posts.jobId,
      jobTitle: jobs.title,
      activeVersionId: posts.activeVersionId,
    })
    .from(posts)
    .leftJoin(jobs, eq(posts.jobId, jobs.id))
    .where(eq(posts.companyId, companyId))
    .orderBy(desc(posts.createdAt));

  // Aggregate analytics for this company's post schedules
  const analyticsRows = await db
    .select({
      postScheduleId: postAnalytics.postScheduleId,
      impressions: sum(postAnalytics.impressions),
      clicks: sum(postAnalytics.clicks),
      likes: sum(postAnalytics.likes),
      shares: sum(postAnalytics.shares),
      comments: sum(postAnalytics.comments),
      applications: sum(postAnalytics.applicationsAttributed),
    })
    .from(postAnalytics)
    .innerJoin(postSchedules, eq(postAnalytics.postScheduleId, postSchedules.id))
    .innerJoin(posts, eq(postSchedules.postId, posts.id))
    .where(eq(posts.companyId, companyId))
    .groupBy(postAnalytics.postScheduleId);

  // Map scheduleId → analytics
  const analyticsMap = new Map(analyticsRows.map(r => [r.postScheduleId, r]));

  // Post schedules with their post ids for joining
  const scheduleRows = await db
    .select({ id: postSchedules.id, postId: postSchedules.postId, scheduledAt: postSchedules.scheduledAt })
    .from(postSchedules)
    .innerJoin(posts, eq(postSchedules.postId, posts.id))
    .where(eq(posts.companyId, companyId));

  // Map postId → schedule ids
  const postToSchedules = new Map<string, string[]>();
  for (const s of scheduleRows) {
    const arr = postToSchedules.get(s.postId) ?? [];
    arr.push(s.id);
    postToSchedules.set(s.postId, arr);
  }

  // Roll up analytics per post
  function postAnalyticsSum(postId: string) {
    const schedIds = postToSchedules.get(postId) ?? [];
    let impressions = 0, clicks = 0, applications = 0, likes = 0;
    for (const sid of schedIds) {
      const a = analyticsMap.get(sid);
      if (a) {
        impressions += Number(a.impressions ?? 0);
        clicks += Number(a.clicks ?? 0);
        applications += Number(a.applications ?? 0);
        likes += Number(a.likes ?? 0);
      }
    }
    return { impressions, clicks, applications, likes };
  }

  // Summary stats
  const totalPosts = allPosts.length;
  const published = allPosts.filter(p => p.status === 'published').length;
  const scheduled = allPosts.filter(p => p.status === 'scheduled').length;
  const draft = allPosts.filter(p => p.status === 'draft').length;

  let totalImpressions = 0, totalClicks = 0, totalApplications = 0, totalLikes = 0;
  for (const p of allPosts) {
    const a = postAnalyticsSum(p.id);
    totalImpressions += a.impressions;
    totalClicks += a.clicks;
    totalApplications += a.applications;
    totalLikes += a.likes;
  }
  const engagementRate = totalImpressions > 0
    ? ((totalLikes + totalClicks) / totalImpressions) * 100
    : 0;

  // Platform breakdown
  const platformMap = new Map<string, { posts: number; impressions: number; clicks: number; applications: number }>();
  const PLATFORM_COLORS: Record<string, string> = {
    linkedin: '#0A66C2',
    facebook: '#1877F2',
    twitter: '#1DA1F2',
  };
  for (const p of allPosts) {
    const key = p.platform;
    const existing = platformMap.get(key) ?? { posts: 0, impressions: 0, clicks: 0, applications: 0 };
    const a = postAnalyticsSum(p.id);
    platformMap.set(key, {
      posts: existing.posts + 1,
      impressions: existing.impressions + a.impressions,
      clicks: existing.clicks + a.clicks,
      applications: existing.applications + a.applications,
    });
  }
  const platformBreakdown = Array.from(platformMap.entries()).map(([name, data]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    color: PLATFORM_COLORS[name] ?? '#64748b',
    ...data,
  }));

  // Weekly timeline — last 8 weeks
  const now = new Date();
  const timeline: { name: string; impressions: number; clicks: number; posts: number }[] = [];
  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - w * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekPosts = allPosts.filter(p => {
      const d = new Date(p.createdAt);
      return d >= weekStart && d < weekEnd;
    });

    let wImpressions = 0, wClicks = 0;
    for (const p of weekPosts) {
      const a = postAnalyticsSum(p.id);
      wImpressions += a.impressions;
      wClicks += a.clicks;
    }

    const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    timeline.push({ name: label, impressions: wImpressions, clicks: wClicks, posts: weekPosts.length });
  }

  // Top posts — published, sorted by impressions desc, top 10
  const topPosts = allPosts
    .filter(p => p.status === 'published')
    .map(p => ({ ...p, ...postAnalyticsSum(p.id) }))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 10)
    .map(p => ({
      id: p.id,
      jobTitle: p.jobTitle ?? 'Unknown Job',
      platform: p.platform,
      impressions: p.impressions,
      clicks: p.clicks,
      applications: p.applications,
      engagementRate: p.impressions > 0
        ? (((p.likes ?? 0) + p.clicks) / p.impressions * 100).toFixed(1)
        : '0.0',
    }));

  return NextResponse.json({
    summary: {
      totalPosts,
      published,
      scheduled,
      draft,
      totalImpressions,
      totalClicks,
      totalApplications,
      engagementRate: parseFloat(engagementRate.toFixed(2)),
    },
    timeline,
    platformBreakdown,
    topPosts,
  });
}
