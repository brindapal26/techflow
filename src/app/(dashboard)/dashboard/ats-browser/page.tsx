'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  MapPin,
  Building2,
  RefreshCw,
  Users,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Database,
  X,
  Globe,
  Map,
  Code2,
  Filter,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AtsConnection {
  id: string;
  provider: string;
  status: string;
  lastSyncedAt: string | null;
  departmentId: string | null;
  config?: any;
}

interface Department {
  id: string;
  name: string;
}

interface CeipalUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface BrowseJob {
  id: string | number;
  jobCode: string;
  title: string;
  status: string;
  city: string;
  state: string;
  country: string;
  location: string | null;
  primarySkills: string;
  secondarySkills: string;
  taxTerms: string;
  jobType: string;
  duration: string;
  client: string;
  positions: number | string;
  startDate: string;
  payRate: string;
  workAuth: string;
  primaryRecruiterId: string;
  assignedToId: string;
  applyUrl: string | null;
}

function SkeletonCard() {
  return (
    <Card className="animate-pulse border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-5 w-16 bg-slate-200 rounded-full" />
          <div className="h-5 w-20 bg-slate-200 rounded-full" />
        </div>
        <div className="h-5 w-3/4 bg-slate-200 rounded" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-4 w-1/2 bg-slate-200 rounded" />
        <div className="flex gap-1">
          <div className="h-5 w-16 bg-slate-100 rounded-full" />
          <div className="h-5 w-20 bg-slate-100 rounded-full" />
          <div className="h-5 w-14 bg-slate-100 rounded-full" />
        </div>
        <div className="h-4 w-2/3 bg-slate-200 rounded" />
        <div className="h-4 w-full bg-slate-200 rounded" />
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = (status ?? '').toLowerCase();
  if (s === 'active') return <Badge className="bg-green-100 text-green-700 border-none text-[10px]">Active</Badge>;
  if (s === 'closed') return <Badge className="bg-slate-100 text-slate-600 border-none text-[10px]">Closed</Badge>;
  if (s === 'filled') return <Badge className="bg-blue-100 text-blue-700 border-none text-[10px]">Filled</Badge>;
  return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
}

function JobCard({
  job,
  users,
  onImport,
}: {
  job: BrowseJob;
  users: CeipalUser[];
  onImport: (job: BrowseJob) => void;
}) {
  const recruiter = users.find((u) => u.id === job.primaryRecruiterId);
  const skills = job.primarySkills
    ? job.primarySkills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  const visibleSkills = skills.slice(0, 3);
  const extraSkills = skills.length - visibleSkills.length;

  return (
    <Card className="border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all duration-200 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={job.status} />
            {job.jobCode && (
              <Badge variant="outline" className="text-[10px] font-mono text-slate-500">
                {job.jobCode}
              </Badge>
            )}
          </div>
        </div>
        <h3 className="font-semibold text-slate-900 leading-snug">{job.title || 'Untitled'}</h3>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{job.location || 'Remote'}</span>
        </div>

        {visibleSkills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {visibleSkills.map((skill) => (
              <span
                key={skill}
                className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full"
              >
                {skill}
              </span>
            ))}
            {extraSkills > 0 && (
              <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                +{extraSkills} more
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {job.client && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" /> {job.client}
            </span>
          )}
          {job.duration && <span>{job.duration}</span>}
          {job.taxTerms && <span className="text-slate-400">{job.taxTerms}</span>}
        </div>

        <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground truncate">
            {recruiter ? (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3 shrink-0" />
                <span className="truncate">{recruiter.name}</span>
              </span>
            ) : (
              <span className="text-slate-300">No recruiter</span>
            )}
            {job.startDate && (
              <span className="ml-2 text-slate-400">
                Start: {new Date(job.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 h-7 text-xs"
            onClick={() => onImport(job)}
          >
            Import
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const EMPTY_FILTERS = {
  search: '',
  recruiter: '',
  status: '',
  skills: '',
  country: '',
  state: '',
};

export default function AtsBrowserPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [connections, setConnections] = useState<AtsConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<AtsConnection | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<CeipalUser[]>([]);
  const [jobs, setJobs] = useState<BrowseJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [noEndpoint, setNoEndpoint] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [recruiter, setRecruiter] = useState('');
  const [status, setStatus] = useState('');
  const [skills, setSkills] = useState('');
  const [debouncedSkills, setDebouncedSkills] = useState('');
  const [country, setCountry] = useState('');
  const [debouncedCountry, setDebouncedCountry] = useState('');
  const [state, setState] = useState('');
  const [debouncedState, setDebouncedState] = useState('');
  // '_all' = all time (default), '_3m' = last 3 months, or a year string like '2025'
  const [period, setPeriod] = useState('_all');

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 2019 }, (_, i) => String(currentYear - i));

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skillsDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countryDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function debounce(
    ref: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
    setter: (v: string) => void,
    value: string
  ) {
    if (ref.current) clearTimeout(ref.current);
    ref.current = setTimeout(() => { setter(value); setPage(1); }, 500);
  }

  useEffect(() => { debounce(searchDebounce, setDebouncedSearch, search); }, [search]);
  useEffect(() => { debounce(skillsDebounce, setDebouncedSkills, skills); }, [skills]);
  useEffect(() => { debounce(countryDebounce, setDebouncedCountry, country); }, [country]);
  useEffect(() => { debounce(stateDebounce, setDebouncedState, state); }, [state]);

  const hasActiveFilters =
    search || recruiter || status || skills || country || state || period !== '_all';

  function clearAllFilters() {
    setSearch('');
    setDebouncedSearch('');
    setRecruiter('');
    setStatus('');
    setSkills('');
    setDebouncedSkills('');
    setCountry('');
    setDebouncedCountry('');
    setState('');
    setDebouncedState('');
    setPeriod('_all');
    setPage(1);
  }

  // Fetch connections + departments on mount
  useEffect(() => {
    Promise.all([fetch('/api/ats'), fetch('/api/departments')]).then(async ([atsRes, deptRes]) => {
      const atsData: AtsConnection[] = atsRes.ok ? await atsRes.json() : [];
      const deptData: Department[] = deptRes.ok ? await deptRes.json() : [];
      setConnections(atsData);
      setDepartments(deptData);
      // Auto-select first active connection
      const first = atsData.find((c) => c.status === 'active');
      if (first) setSelectedConnection(first);
    });
  }, []);

  // Fetch users when connection changes
  useEffect(() => {
    if (!selectedConnection) return;
    setUsersLoading(true);
    fetch(`/api/ats/${selectedConnection.id}/users`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setUsers(data); })
      .finally(() => setUsersLoading(false));
  }, [selectedConnection]);

  // Fetch jobs
  const fetchJobs = useCallback(
    async (p: number) => {
      if (!selectedConnection) return;
      setLoading(true);
      setNoEndpoint(false);
      const params = new URLSearchParams();
      params.set('page', String(p));
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (recruiter) params.set('recruiter', recruiter);
      if (status) params.set('status', status);
      if (debouncedSkills) params.set('skills', debouncedSkills);
      if (debouncedCountry) params.set('country', debouncedCountry);
      if (debouncedState) params.set('state', debouncedState);
      if (period === '_all') {
        params.set('last3months', 'false');
      } else if (period === '_6m') {
        params.set('last3months', 'false');
        params.set('last6months', 'true');
      } else if (period !== '_3m') {
        // specific year selected
        params.set('year', period);
        params.set('last3months', 'false');
      }
      // _3m is the default — no params needed (server defaults to last3months=true)

      const res = await fetch(`/api/ats/${selectedConnection.id}/browse?${params.toString()}`);
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        if (data?.error?.includes('No custom job endpoint')) setNoEndpoint(true);
        setJobs([]);
        setTotalPages(1);
        setTotalCount(0);
        return;
      }

      setJobs(data.results ?? []);
      setTotalPages(data.numPages ?? 1);
      setTotalCount(data.count ?? 0);
    },
    [selectedConnection, debouncedSearch, recruiter, status, debouncedSkills, debouncedCountry, debouncedState, period]
  );

  useEffect(() => { fetchJobs(page); }, [fetchJobs, page]);

  // Reset page when drop-down filters change
  useEffect(() => { setPage(1); }, [recruiter, status, period]);

  function handleImport(_job: BrowseJob) {
    setToast('Coming soon — import to TalentFlow will be available shortly.');
    setTimeout(() => setToast(null), 4000);
  }

  const activeUsers = users.filter((u) => (u.status ?? '').toLowerCase() === 'active');

  function connectionLabel(c: AtsConnection) {
    const provider = c.provider.charAt(0).toUpperCase() + c.provider.slice(1).replace('_', ' ');
    const dept = departments.find((d) => d.id === c.departmentId);
    return dept ? `${provider} — ${dept.name}` : provider;
  }

  if (role && role !== 'company_admin') {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Access restricted to company admins.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ATS Browser</h1>
          <p className="text-muted-foreground">
            Browse and import jobs directly from your connected ATS.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {connections.length > 1 && (
            <Select
              value={selectedConnection?.id ?? ''}
              onValueChange={(id) => {
                const c = connections.find((c) => c.id === id);
                if (c) { setSelectedConnection(c); setPage(1); setJobs([]); }
              }}
            >
              <SelectTrigger className="h-9 text-sm w-[220px]">
                <SelectValue placeholder="Select ATS connection" />
              </SelectTrigger>
              <SelectContent>
                {connections.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <span>{connectionLabel(c)}</span>
                      {c.status !== 'active' && (
                        <Badge variant="outline" className="text-[10px] text-red-600 border-red-200">
                          {c.status}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {connections.length === 1 && selectedConnection && (
            <Badge variant="outline" className="h-9 px-3 text-sm font-medium flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5" />
              {connectionLabel(selectedConnection)}
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => fetchJobs(page)} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-2 text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
          <Briefcase className="h-4 w-4 shrink-0" />
          {toast}
        </div>
      )}

      {/* No endpoint configured */}
      {noEndpoint && (
        <Card className="border-dashed border-amber-200 bg-amber-50/50">
          <CardContent className="py-12 flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Database className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Custom Job Endpoint Not Configured</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Configure the Custom Job Posting URL in ATS Connection settings to use this browser.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => (window.location.href = '/dashboard/ats-connection')}>
              Go to ATS Connection Settings
            </Button>
          </CardContent>
        </Card>
      )}

      {/* No active connection */}
      {connections.length === 0 && (
        <Card className="border-dashed border-slate-200 bg-slate-50/50">
          <CardContent className="py-12 flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Database className="h-6 w-6 text-slate-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">No ATS Connected</p>
              <p className="text-sm text-muted-foreground mt-1">
                Connect an ATS in settings to start browsing jobs.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => (window.location.href = '/dashboard/ats-connection')}>
              Go to ATS Connection Settings
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedConnection && !noEndpoint && (
        <>
          {/* Filters */}
          <Card className="shadow-sm border-slate-200">
            <CardContent className="pt-4 pb-4 space-y-3">
              {/* Row 1: search + recruiter + status + count + clear */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="h-9 pl-9 text-sm"
                    placeholder="Search by title, skills, keywords..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {/* Recruiter filter */}
                <div className="flex items-center gap-2 min-w-[220px]">
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Select
                    value={recruiter || '_all'}
                    onValueChange={(v) => { setRecruiter(v === '_all' ? '' : v); setPage(1); }}
                    disabled={usersLoading}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      {recruiter
                        ? (() => { const u = activeUsers.find(u => u.id === recruiter); return u ? <span className="truncate">{u.name}</span> : <span>Recruiter</span>; })()
                        : <span className="text-muted-foreground">All Recruiters</span>
                      }
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="_all">All Recruiters</SelectItem>
                      {activeUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          <div className="flex flex-col leading-tight py-0.5">
                            <span className="font-medium text-sm">{u.name}</span>
                            {u.email && <span className="text-[11px] text-muted-foreground">{u.email}</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status filter */}
                <Select
                  value={status || '_all'}
                  onValueChange={(v) => { setStatus(v === '_all' ? '' : v); setPage(1); }}
                >
                  <SelectTrigger className="h-9 text-sm w-[140px]">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">All Statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                    <SelectItem value="Filled">Filled</SelectItem>
                  </SelectContent>
                </Select>

                {/* Year / Period filter */}
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Select value={period} onValueChange={(v) => { setPeriod(v); setPage(1); }}>
                    <SelectTrigger className="h-9 text-sm w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_3m">Last 3 months</SelectItem>
                      <SelectItem value="_6m">Last 6 months</SelectItem>
                      <SelectItem value="_all">All time</SelectItem>
                      {yearOptions.map(y => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Count + clear */}
                <div className="flex items-center gap-2 ml-auto">
                  {!loading && (
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {totalCount} job{totalCount !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 gap-1.5"
                      onClick={clearAllFilters}
                    >
                      <X className="h-3.5 w-3.5" /> Clear Filters
                    </Button>
                  )}
                </div>
              </div>

              {/* Row 2: skills + country + state */}
              <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  <Filter className="h-3.5 w-3.5" />
                  <span>More filters:</span>
                </div>

                {/* Skills */}
                <div className="relative min-w-[200px] flex-1">
                  <Code2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    className="h-8 pl-8 text-sm"
                    placeholder="Skill (e.g. React, Java...)"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                  />
                  {skills && (
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => setSkills('')}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Country */}
                <div className="relative min-w-[160px]">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    className="h-8 pl-8 text-sm"
                    placeholder="Country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                  {country && (
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => setCountry('')}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* State */}
                <div className="relative min-w-[160px]">
                  <Map className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    className="h-8 pl-8 text-sm"
                    placeholder="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                  {state && (
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => setState('')}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <Card className="border-dashed border-slate-200 bg-slate-50/50">
              <CardContent className="py-16 flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-slate-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700">No jobs found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting your filters or search query.
                  </p>
                </div>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearAllFilters}>
                    <X className="h-4 w-4 mr-2" /> Clear All Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} users={users} onImport={handleImport} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
