'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users, MousePointer2, BarChart3, TrendingUp,
  Calendar as CalendarIcon, Plus, ArrowUpRight,
  Briefcase, MapPin, Star, ChevronRight, CheckCircle2,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ── Admin dashboard ────────────────────────────────────────────────────────────

interface OverviewData {
  summary: {
    totalPosts: number;
    published: number;
    scheduled: number;
    totalApplications: number;
    totalClicks: number;
    totalImpressions: number;
    engagementRate: number;
  };
  monthlyChart: { name: string; posts: number; applications: number }[];
  recentActivity: { user: string; action: string; target: string; platform: string; time: string }[];
}

function AdminDashboard({ firstName }: { firstName: string }) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/overview')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const s = data?.summary;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {firstName}</h1>
          <p className="text-muted-foreground">Here's what's happening with your social recruiting today.</p>
        </div>
        <div className="flex gap-3">
          <Button className="flex items-center gap-2" asChild>
            <Link href="/dashboard/posts/create"><Plus className="h-4 w-4" /> Create Post</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i} className="shadow-sm border-slate-200">
              <CardContent className="p-6">
                <div className="h-20 bg-slate-100 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard title="Total Applications" value={fmt(s?.totalApplications ?? 0)}
              icon={<Users className="h-5 w-5 text-blue-600" />} description="attributed from posts" />
            <StatCard title="Link Clicks" value={fmt(s?.totalClicks ?? 0)}
              icon={<MousePointer2 className="h-5 w-5 text-purple-600" />} description="across all platforms" />
            <StatCard title="Engagement Rate" value={`${s?.engagementRate?.toFixed(2) ?? '0.00'}%`}
              icon={<TrendingUp className="h-5 w-5 text-green-600" />} description="likes + clicks / impressions" />
            <StatCard title="Posts Published" value={fmt(s?.published ?? 0)}
              icon={<Send className="h-5 w-5 text-orange-600" />} description={`${s?.scheduled ?? 0} scheduled`} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Posts Over Time</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-primary" /> Posts created
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              {loading ? (
                <div className="h-full bg-slate-50 rounded animate-pulse" />
              ) : (data?.monthlyChart?.length ?? 0) > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data!.monthlyChart}>
                    <defs>
                      <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="posts" name="Posts" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorPosts)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  No posts yet. Create your first post to see the chart.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader><CardTitle className="text-lg font-semibold">Recent Activity</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-slate-100 rounded w-3/4 animate-pulse" />
                      <div className="h-2 bg-slate-50 rounded w-1/3 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (data?.recentActivity?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No activity yet.</p>
            ) : (
              <div className="space-y-6">
                {data!.recentActivity.map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 font-bold text-xs">
                      {item.user[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-semibold">{item.user}</span>{' '}
                        {item.action}{' '}
                        <span className="text-primary font-medium">{item.target}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, description }: {
  title: string; value: string; icon: React.ReactNode; description: string;
}) {
  return (
    <Card className="shadow-sm border-slate-200 hover:border-primary/50 transition-colors group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-primary/5 transition-colors">{icon}</div>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Recruiter dashboard ────────────────────────────────────────────────────────

interface Job {
  id: string;
  title: string;
  location: string | null;
  department: string | null;
  jobType: string | null;
  status: string;
  isPriority: boolean;
  externalId: string | null;
  applyUrl: string | null;
  postedDate: string | null;
}

interface Post {
  id: string;
  createdBy: string;
  status: string;
}

function JobTypeLabel({ type }: { type: string | null }) {
  if (!type) return null;
  const map: Record<string, string> = { full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract', internship: 'Internship' };
  return <span className="text-xs text-slate-500">{map[type] ?? type}</span>;
}

function RecruiterDashboard({ firstName, userId }: { firstName: string; userId: string }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [postsCount, setPostsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/jobs').then(r => r.json()),
      fetch('/api/posts').then(r => r.json()),
    ]).then(([jobsData, postsData]) => {
      if (Array.isArray(jobsData)) setJobs(jobsData);
      if (Array.isArray(postsData)) {
        setPostsCount(postsData.filter((p: Post) => p.createdBy === userId).length);
      }
    }).finally(() => setLoading(false));
  }, [userId]);

  const priorityJobs = jobs.filter(j => j.isPriority);
  const regularJobs = jobs.filter(j => !j.isPriority);
  const openJobs = jobs.filter(j => j.status === 'open').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {firstName}</h1>
          <p className="text-muted-foreground">Your assigned jobs and quick actions.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700" asChild>
          <Link href="/dashboard/jobs"><Briefcase className="h-4 w-4 mr-2" /> View All Jobs</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Assigned Jobs', value: jobs.length, color: 'text-indigo-600' },
          { label: 'Open', value: openJobs, color: 'text-green-700' },
          { label: 'Priority', value: priorityJobs.length, color: 'text-amber-700' },
          { label: 'Posts Created', value: postsCount, color: 'text-purple-700' },
        ].map(stat => (
          <Card key={stat.label} className="shadow-sm border-slate-200">
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
              {loading
                ? <div className="h-8 w-12 bg-slate-100 rounded animate-pulse mt-1" />
                : <p className={cn('text-3xl font-bold mt-1', stat.color)}>{stat.value}</p>
              }
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && jobs.length === 0 && (
        <Card className="border-indigo-100 bg-indigo-50/40 shadow-sm">
          <CardHeader><CardTitle className="text-base">Getting Started</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { done: true, label: 'Account activated', sub: "You're signed in to your workspace." },
              { done: false, label: 'Get jobs assigned', sub: 'Ask your admin to assign jobs to you from the Jobs page.' },
              { done: false, label: 'Generate your first LinkedIn post', sub: 'Use AI to create a post for any assigned job.' },
            ].map((step, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className={cn('w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                  step.done ? 'bg-green-500' : 'border-2 border-slate-300')}>
                  {step.done && <CheckCircle2 className="h-5 w-5 text-white" />}
                </div>
                <div>
                  <p className={cn('text-sm font-medium', step.done ? 'line-through text-slate-400' : 'text-slate-800')}>{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.sub}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!loading && priorityJobs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> Priority Jobs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {priorityJobs.slice(0, 3).map(job => <JobCard key={job.id} job={job} />)}
          </div>
        </div>
      )}

      {!loading && regularJobs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Your Jobs</h2>
          <Card className="shadow-sm border-slate-200 divide-y divide-slate-100">
            {regularJobs.slice(0, 8).map(job => (
              <Link key={job.id} href={`/dashboard/jobs/${job.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors group">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{job.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {job.location && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {job.location}
                      </span>
                    )}
                    <JobTypeLabel type={job.jobType} />
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <Badge className={cn('text-[10px] border-none',
                    job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600')}>
                    {job.status}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
              </Link>
            ))}
            {regularJobs.length > 8 && (
              <div className="px-5 py-3 text-center">
                <Link href="/dashboard/jobs" className="text-sm text-indigo-600 hover:underline font-medium">
                  View all {regularJobs.length} jobs →
                </Link>
              </div>
            )}
          </Card>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse border-slate-200">
              <CardContent className="p-5 space-y-3">
                <div className="h-4 w-3/4 bg-slate-200 rounded" />
                <div className="h-3 w-1/2 bg-slate-100 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  return (
    <Link href={`/dashboard/jobs/${job.id}`}>
      <Card className="border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-snug">{job.title}</h3>
            {job.isPriority && <Star className="h-4 w-4 text-amber-400 fill-amber-400 shrink-0" />}
          </div>
          {job.location && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {job.location}
            </p>
          )}
          <div className="flex items-center gap-2">
            <Badge className={cn('text-[10px] border-none',
              job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600')}>
              {job.status}
            </Badge>
            <JobTypeLabel type={job.jobType} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ── Root export ────────────────────────────────────────────────────────────────

export default function DashboardOverview() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id ?? '';
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => setFirstName(data.name?.split(' ')[0] ?? 'there'));
  }, []);

  if (role === 'recruiter') return <RecruiterDashboard firstName={firstName} userId={userId} />;
  return <AdminDashboard firstName={firstName} />;
}
