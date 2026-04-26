'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Briefcase,
  Search,
  MapPin,
  Building2,
  ChevronRight,
  Star,
  RefreshCw,
  Users,
  Clock,
  Code2,
  Globe,
  X,
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  location: string | null;
  department: string | null;
  jobType: string | null;
  status: 'open' | 'closed' | 'filled';
  isPriority: boolean;
  externalId: string | null;
  applyUrl: string | null;
  postedDate: string | null;
  syncedAt: string | null;
  assignedRecruiter: { id: string; name: string | null; email: string } | null;
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

export default function JobsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role ?? 'recruiter';
  const isAdmin = role === 'company_admin';

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');
  const [yearFilter, setYearFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [syncing, setSyncing] = useState(false);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 2019 }, (_, i) => String(currentYear - i));

  const hasActiveFilters = search || (statusFilter && statusFilter !== 'open') || yearFilter || skillFilter || countryFilter;

  function clearFilters() {
    setSearch('');
    setStatusFilter('open');
    setYearFilter('');
    setSkillFilter('');
    setCountryFilter('');
  }

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('search', search);
    if (yearFilter) params.set('year', yearFilter);
    if (skillFilter) params.set('skill', skillFilter);
    if (countryFilter) params.set('country', countryFilter);
    const res = await fetch(`/api/jobs?${params}`);
    if (res.ok) setJobs(await res.json());
    setLoading(false);
  }, [search, statusFilter, yearFilter, skillFilter, countryFilter]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  async function handleSyncAll() {
    setSyncing(true);
    // Get first connection and trigger sync
    const atsRes = await fetch('/api/ats');
    if (atsRes.ok) {
      const connections = await atsRes.json();
      for (const conn of connections) {
        await fetch(`/api/ats/sync/${conn.id}`, { method: 'POST' });
      }
    }
    await fetchJobs();
    setSyncing(false);
  }

  const priorityJobs = jobs.filter(j => j.isPriority);
  const regularJobs = jobs.filter(j => !j.isPriority);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'All synced jobs — assign to recruiters to start campaigns.' : 'Your assigned job openings.'}
          </p>
        </div>
        {isAdmin && (
          <Button variant="outline" onClick={handleSyncAll} disabled={syncing} className="gap-2">
            <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Row 1: search + status + year */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="filled">Filled</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={yearFilter || '_all'} onValueChange={v => setYearFilter(v === '_all' ? '' : v)}>
            <SelectTrigger className="w-32 h-10">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All Years</SelectItem>
              {yearOptions.map(y => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Row 2: skill + country */}
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[200px]">
            <Code2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Skill / keyword..."
              value={skillFilter}
              onChange={e => setSkillFilter(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
            {skillFilter && (
              <button className="absolute right-2 top-2 text-slate-400 hover:text-slate-600" onClick={() => setSkillFilter('')}>
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="relative min-w-[160px]">
            <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Country..."
              value={countryFilter}
              onChange={e => setCountryFilter(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
            {countryFilter && (
              <button className="absolute right-2 top-2 text-slate-400 hover:text-slate-600" onClick={() => setCountryFilter('')}>
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      {!loading && jobs.length > 0 && (
        <div className="flex gap-6 text-sm text-muted-foreground">
          <span><strong className="text-foreground font-semibold">{jobs.length}</strong> jobs</span>
          {isAdmin && (
            <>
              <span><strong className="text-foreground font-semibold">{jobs.filter(j => j.assignedRecruiter).length}</strong> assigned</span>
              <span><strong className="text-amber-600 font-semibold">{jobs.filter(j => !j.assignedRecruiter && j.status === 'open').length}</strong> unassigned</span>
            </>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card className="border-dashed border-slate-300 bg-slate-50/50">
          <CardContent className="py-16 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
              <Briefcase className="h-7 w-7 text-slate-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">No jobs found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isAdmin ? 'Connect your ATS and sync to see jobs here.' : 'You have no jobs assigned yet. Ask your admin.'}
              </p>
            </div>
            {isAdmin && (
              <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
                <Link href="/dashboard/ats-connection">Connect ATS</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Priority section */}
          {priorityJobs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-600">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                Priority
              </div>
              <JobList jobs={priorityJobs} isAdmin={isAdmin} />
            </div>
          )}

          {/* Regular jobs */}
          {regularJobs.length > 0 && (
            <div className="space-y-2">
              {priorityJobs.length > 0 && (
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground pt-2">All Jobs</div>
              )}
              <JobList jobs={regularJobs} isAdmin={isAdmin} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function JobList({ jobs, isAdmin }: { jobs: Job[]; isAdmin: boolean }) {
  return (
    <div className="space-y-2">
      {jobs.map(job => (
        <Link key={job.id} href={`/dashboard/jobs/${job.id}`}>
          <div className="group p-5 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm transition-all flex items-center gap-5 cursor-pointer">
            {/* Icon */}
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
              job.isPriority ? 'bg-amber-50' : 'bg-slate-50'
            )}>
              {job.isPriority
                ? <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                : <Briefcase className="h-5 w-5 text-slate-400" />
              }
            </div>

            {/* Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                  {job.title}
                </h3>
                <Badge className={cn('border-none text-[10px] shrink-0', STATUS_COLORS[job.status] ?? 'bg-slate-100')}>
                  {job.status}
                </Badge>
                {job.jobType && (
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {JOB_TYPE_LABELS[job.jobType] ?? job.jobType}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {job.location}
                  </span>
                )}
                {job.department && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> {job.department}
                  </span>
                )}
                {job.syncedAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> synced {new Date(job.syncedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Recruiter */}
            {isAdmin && (
              <div className="shrink-0 text-right hidden sm:block">
                {job.assignedRecruiter ? (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xs">
                      {(job.assignedRecruiter.name ?? job.assignedRecruiter.email)[0].toUpperCase()}
                    </div>
                    <span className="text-slate-600 text-xs">{job.assignedRecruiter.name ?? job.assignedRecruiter.email}</span>
                  </div>
                ) : (
                  <span className="text-xs text-amber-600 flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> Unassigned
                  </span>
                )}
              </div>
            )}

            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0" />
          </div>
        </Link>
      ))}
    </div>
  );
}
