'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Briefcase,
  DollarSign,
  ExternalLink,
  Star,
  Users,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
  Sparkles,
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  department: string | null;
  jobType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  status: 'open' | 'closed' | 'filled';
  isPriority: boolean;
  externalId: string | null;
  applyUrl: string | null;
  postedDate: string | null;
  expiresAt: string | null;
  syncedAt: string | null;
  assignedRecruiter: { id: string; name: string | null; email: string } | null;
  atsConnection: { id: string; provider: string; status: string } | null;
}

interface Recruiter {
  id: string;
  name: string | null;
  email: string;
}

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  internship: 'Internship',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-500',
  filled: 'bg-blue-100 text-blue-700',
};

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role ?? 'recruiter';
  const isAdmin = role === 'company_admin';

  const [job, setJob] = useState<Job | null>(null);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRecruiter, setSelectedRecruiter] = useState<string>('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const [jobRes, teamRes] = await Promise.all([
        fetch(`/api/jobs/${id}`),
        isAdmin ? fetch('/api/team') : Promise.resolve(null),
      ]);

      if (!jobRes.ok) { router.push('/dashboard/jobs'); return; }
      const jobData = await jobRes.json();
      setJob(jobData);
      setSelectedRecruiter(jobData.assignedRecruiter?.id ?? 'unassigned');

      if (teamRes?.ok) {
        const team = await teamRes.json();
        setRecruiters(team);
      }
      setLoading(false);
    }
    load();
  }, [id, isAdmin, router]);

  async function handleAssign() {
    if (!job) return;
    setSaving(true);
    setError('');
    const recruiterId = selectedRecruiter === 'unassigned' ? null : selectedRecruiter;
    const res = await fetch(`/api/jobs/${job.id}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recruiterId }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? 'Failed to assign'); return; }
    const recruiter = recruiters.find(r => r.id === recruiterId) ?? null;
    setJob(prev => prev ? { ...prev, assignedRecruiter: recruiter ? { id: recruiter.id, name: recruiter.name, email: recruiter.email } : null } : prev);
    setSuccess(recruiterId ? `Assigned to ${recruiter?.name ?? recruiter?.email}` : 'Recruiter unassigned');
    setTimeout(() => setSuccess(''), 4000);
  }

  async function handleTogglePriority() {
    if (!job) return;
    const res = await fetch(`/api/jobs/${job.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPriority: !job.isPriority }),
    });
    if (res.ok) setJob(prev => prev ? { ...prev, isPriority: !prev.isPriority } : prev);
  }

  async function handleStatusChange(newStatus: string) {
    if (!job) return;
    const res = await fetch(`/api/jobs/${job.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) setJob(prev => prev ? { ...prev, status: newStatus as any } : prev);
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-slate-100 rounded" />
        <div className="h-64 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-4xl">
      {/* Back + header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
          <Link href="/dashboard/jobs">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Jobs
          </Link>
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mt-1', job.isPriority ? 'bg-amber-50' : 'bg-slate-100')}>
              {job.isPriority
                ? <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
                : <Briefcase className="h-6 w-6 text-slate-400" />
              }
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
                <Badge className={cn('border-none', STATUS_COLORS[job.status])}>
                  {job.status}
                </Badge>
                {job.jobType && (
                  <Badge variant="outline">{JOB_TYPE_LABELS[job.jobType] ?? job.jobType}</Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {job.location}
                  </span>
                )}
                {job.department && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" /> {job.department}
                  </span>
                )}
                {(job.salaryMin || job.salaryMax) && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    {job.salaryMin && job.salaryMax
                      ? `${job.salaryMin.toLocaleString()} – ${job.salaryMax.toLocaleString()} ${job.currency}`
                      : job.salaryMin
                        ? `From ${job.salaryMin.toLocaleString()} ${job.currency}`
                        : `Up to ${job.salaryMax!.toLocaleString()} ${job.currency}`
                    }
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0 flex-wrap">
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              <Link href={`/dashboard/posts/create?jobId=${job.id}`}>
                <Sparkles className="h-4 w-4" /> Create Post
              </Link>
            </Button>
            {job.applyUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" /> Apply Link
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: description */}
        <div className="lg:col-span-2 space-y-6">
          {job.description && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: job.description.replace(/\n/g, '<br />') }}
                />
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-slate-100">
                {[
                  { label: 'External ID', value: job.externalId ?? '—' },
                  { label: 'Posted', value: job.postedDate ? new Date(job.postedDate).toLocaleDateString() : '—' },
                  { label: 'Expires', value: job.expiresAt ? new Date(job.expiresAt).toLocaleDateString() : '—' },
                  { label: 'Last Synced', value: job.syncedAt ? new Date(job.syncedAt).toLocaleString() : '—' },
                  {
                    label: 'ATS Source',
                    value: job.atsConnection
                      ? `${job.atsConnection.provider.charAt(0).toUpperCase() + job.atsConnection.provider.slice(1)} (${job.atsConnection.status})`
                      : '—'
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2.5 text-sm">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Right: assignment + controls */}
        <div className="space-y-4">
          {/* Assign recruiter (admin only) */}
          {isAdmin && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" /> Assign Recruiter
                </CardTitle>
                <CardDescription>Select a recruiter to own this job's social posts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={selectedRecruiter} onValueChange={setSelectedRecruiter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recruiter..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">
                      <span className="text-muted-foreground">— Unassigned —</span>
                    </SelectItem>
                    {recruiters.map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name ?? r.email}
                        {r.name && <span className="text-muted-foreground text-xs ml-1">({r.email})</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  onClick={handleAssign}
                  disabled={saving || selectedRecruiter === (job.assignedRecruiter?.id ?? 'unassigned')}
                >
                  {saving ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Save Assignment'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Current recruiter (recruiter view) */}
          {!isAdmin && job.assignedRecruiter && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" /> Assigned To
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm">
                    {(job.assignedRecruiter.name ?? job.assignedRecruiter.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{job.assignedRecruiter.name ?? job.assignedRecruiter.email}</p>
                    <p className="text-xs text-muted-foreground">{job.assignedRecruiter.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin controls */}
          {isAdmin && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={job.status} onValueChange={handleStatusChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="filled">Filled</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-sm font-medium">Priority</p>
                    <p className="text-xs text-muted-foreground">Pin to top of jobs list</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTogglePriority}
                    className={cn(job.isPriority && 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100')}
                  >
                    <Star className={cn('h-4 w-4 mr-1.5', job.isPriority && 'fill-amber-400 text-amber-400')} />
                    {job.isPriority ? 'Prioritized' : 'Set Priority'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ATS info */}
          {job.atsConnection && (
            <Card className="shadow-sm border-slate-100 bg-slate-50/50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Database className="h-3.5 w-3.5" />
                  Synced from <strong className="capitalize text-slate-700">{job.atsConnection.provider}</strong>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
