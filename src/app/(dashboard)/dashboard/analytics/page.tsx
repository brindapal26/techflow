'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Eye,
  Heart,
  MousePointer2,
  Users,
  TrendingUp,
  Calendar as CalendarIcon,
  Download,
  ArrowUpRight,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AnalyticsData {
  summary: {
    totalPosts: number;
    published: number;
    scheduled: number;
    draft: number;
    totalImpressions: number;
    totalClicks: number;
    totalApplications: number;
    engagementRate: number;
  };
  timeline: { name: string; impressions: number; clicks: number; posts: number }[];
  platformBreakdown: { name: string; color: string; posts: number; impressions: number; clicks: number; applications: number }[];
  topPosts: {
    id: string;
    jobTitle: string;
    platform: string;
    impressions: number;
    clicks: number;
    applications: number;
    engagementRate: string;
  }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="h-10 w-64 bg-slate-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  const s = data?.summary;
  const maxApps = Math.max(...(data?.topPosts.map(p => p.applications) ?? [1]), 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Analytics</h1>
          <p className="text-muted-foreground">Social recruiting ROI and channel effectiveness.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2" disabled>
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Impressions"
          value={fmt(s?.totalImpressions ?? 0)}
          sub={`${s?.published ?? 0} published posts`}
          icon={<Eye className="h-5 w-5 text-blue-600" />}
        />
        <StatCard
          title="Engagement Rate"
          value={`${s?.engagementRate?.toFixed(2) ?? '0.00'}%`}
          sub="likes + clicks / impressions"
          icon={<Heart className="h-5 w-5 text-red-600" />}
        />
        <StatCard
          title="Total Link Clicks"
          value={fmt(s?.totalClicks ?? 0)}
          sub={`across ${s?.totalPosts ?? 0} total posts`}
          icon={<MousePointer2 className="h-5 w-5 text-purple-600" />}
        />
        <StatCard
          title="Applications"
          value={fmt(s?.totalApplications ?? 0)}
          sub="attributed from posts"
          icon={<Users className="h-5 w-5 text-green-600" />}
        />
      </div>

      {/* Post Status Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Published', value: s?.published ?? 0, color: 'text-green-700 bg-green-50 border-green-100' },
          { label: 'Scheduled', value: s?.scheduled ?? 0, color: 'text-blue-700 bg-blue-50 border-blue-100' },
          { label: 'Drafts', value: s?.draft ?? 0, color: 'text-slate-700 bg-slate-50 border-slate-100' },
        ].map(item => (
          <Card key={item.label} className={`shadow-sm border ${item.color}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="h-4 w-4 shrink-0" />
              <div>
                <p className="text-2xl font-extrabold">{item.value}</p>
                <p className="text-xs font-semibold uppercase tracking-wide">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>Posts created + clicks over the last 8 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {(data?.timeline?.length ?? 0) > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data!.timeline}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Line type="monotone" dataKey="clicks" name="Clicks" stroke="#4F46E5" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="posts" name="Posts" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart label="No post data yet" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
            <CardDescription>Posts by social channel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {(data?.platformBreakdown?.length ?? 0) > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data!.platformBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#0f172a', fontWeight: 600, fontSize: 12 }} width={80} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="posts" name="Posts" radius={[0, 4, 4, 0]} barSize={28}>
                      {data!.platformBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart label="No platform data yet" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Posts Table */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Top Performing Posts</CardTitle>
            <CardDescription>Published posts sorted by impressions</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {(data?.topPosts?.length ?? 0) === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No published posts yet. Publish your first post to see analytics here.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="font-bold uppercase tracking-widest text-[10px]">Job</TableHead>
                  <TableHead className="font-bold uppercase tracking-widest text-[10px]">Platform</TableHead>
                  <TableHead className="font-bold uppercase tracking-widest text-[10px]">Impressions</TableHead>
                  <TableHead className="font-bold uppercase tracking-widest text-[10px]">Clicks</TableHead>
                  <TableHead className="font-bold uppercase tracking-widest text-[10px]">Applicants</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data!.topPosts.map(post => (
                  <TableRow key={post.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <TableCell>
                      <span className="font-semibold text-sm">{post.jobTitle}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-white capitalize">{post.platform}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-slate-600">{fmt(post.impressions)}</TableCell>
                    <TableCell className="font-medium text-slate-600">{fmt(post.clicks)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{post.applications}</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: `${(post.applications / maxApps) * 100}%` }} />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Health Score */}
      <Card className="shadow-lg border-primary/10 bg-gradient-to-br from-white to-blue-50/30">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex items-center gap-10">
              <HealthScoreCircle score={computeHealthScore(s)} />
              <div className="space-y-2 max-w-xs">
                <h3 className="text-xl font-bold tracking-tight">
                  {getHealthLabel(computeHealthScore(s))}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Based on your publishing frequency, engagement, and post diversity across platforms.
                </p>
                <div className="pt-2">
                  <Button size="sm" className="gap-2" disabled>
                    <TrendingUp className="h-3.5 w-3.5" />
                    How to improve
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <ScoreFactor label="Posts Published" score={Math.min(100, (s?.published ?? 0) * 10)} weight="30%" />
              <ScoreFactor label="Platforms Used" score={Math.min(100, (data?.platformBreakdown?.length ?? 0) * 33)} weight="20%" />
              <ScoreFactor label="Click Rate" score={s?.totalImpressions ? Math.min(100, Math.round((s.totalClicks / s.totalImpressions) * 1000)) : 0} weight="25%" />
              <ScoreFactor label="Applications" score={Math.min(100, (s?.totalApplications ?? 0) * 5)} weight="25%" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function computeHealthScore(s: AnalyticsData['summary'] | undefined) {
  if (!s) return 0;
  const publishedScore = Math.min(30, s.published * 3);
  const clickScore = s.totalImpressions > 0 ? Math.min(25, Math.round((s.totalClicks / s.totalImpressions) * 250)) : 0;
  const appScore = Math.min(25, s.totalApplications * 2);
  const engScore = Math.min(20, Math.round(s.engagementRate * 2));
  return publishedScore + clickScore + appScore + engScore;
}

function getHealthLabel(score: number) {
  if (score >= 70) return 'Recruiting Health: Strong';
  if (score >= 40) return 'Recruiting Health: Growing';
  return 'Recruiting Health: Getting Started';
}

function HealthScoreCircle({ score }: { score: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative w-40 h-40 shrink-0">
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * Math.min(score, 100)) / 100}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold text-slate-900 tracking-tighter">{score}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Health Score</span>
      </div>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function StatCard({ title, value, sub, icon }: { title: string; value: string; sub: string; icon: React.ReactNode }) {
  return (
    <Card className="shadow-sm border-slate-200">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">{icon}</div>
        </div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-extrabold mt-1 tracking-tight text-slate-900">{value}</h3>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

function ScoreFactor({ label, score, weight }: { label: string; score: number; weight: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
        <span className="text-slate-600">{label}</span>
        <span className="text-primary">{score}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-1000',
            score > 80 ? 'bg-primary' : score > 60 ? 'bg-blue-400' : 'bg-amber-400'
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground italic">Weight: {weight}</p>
    </div>
  );
}
