'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';
import {
  UserPlus, Mail, Copy, Check, AlertCircle, Users, Clock,
  Shield, ShieldOff, UserX, MoreVertical, Link as LinkIcon,
  CheckCircle2, UserCheck, Search, Briefcase, Trash2, Plus,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

interface RosterEmployee {
  id: string;
  email: string;
  name: string | null;
  title: string | null;
  department: string | null;
  phone: string | null;
  source: string | null;
  userId: string | null;
  syncedAt: string;
}

type Tab = 'members' | 'roster';

export default function TeamPage() {
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;

  const [tab, setTab] = useState<Tab>('members');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [roster, setRoster] = useState<RosterEmployee[]>([]);
  const [rosterSearch, setRosterSearch] = useState('');
  const [workspaceUrl, setWorkspaceUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'recruiter' | 'company_admin'>('recruiter');
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Add employee form
  const [addForm, setAddForm] = useState({ email: '', name: '', title: '', department: '' });
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTeam();
    fetchInvitations();
    // Get workspace URL
    fetch('/api/workspace/me')
      .then(r => r.json())
      .then(data => {
        if (data.slug) setWorkspaceUrl(`${window.location.origin}/login/${data.slug}`);
      });
  }, []);

  useEffect(() => {
    if (tab === 'roster' && roster.length === 0) {
      fetch('/api/team/roster').then(r => r.json()).then(data => {
        if (Array.isArray(data)) setRoster(data);
      });
    }
  }, [tab]);

  async function fetchTeam() {
    const res = await fetch('/api/team');
    if (res.ok) setMembers(await res.json());
  }

  async function fetchInvitations() {
    const res = await fetch('/api/invitations');
    if (res.ok) setInvitations(await res.json());
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setInviteUrl('');

    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error || 'Failed to send invite'); return; }

    setInviteUrl(data.inviteUrl);
    setInviteEmail('');
    fetchInvitations();
  }

  async function handleRoleChange(id: string, role: 'company_admin' | 'recruiter') {
    await fetch(`/api/team/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    fetchTeam();
  }

  async function handleDeactivate(id: string) {
    await fetch(`/api/team/${id}`, { method: 'DELETE' });
    fetchTeam();
  }

  async function handleReactivate(id: string) {
    await fetch(`/api/team/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: true }),
    });
    fetchTeam();
  }

  function copyInviteLink() {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyWorkspaceUrl() {
    navigator.clipboard.writeText(workspaceUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  }

  async function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');
    setAddLoading(true);
    const res = await fetch('/api/team/roster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    });
    const data = await res.json();
    setAddLoading(false);
    if (!res.ok) { setAddError(data.error || 'Failed to add employee'); return; }
    setAddSuccess(`${addForm.email} added to roster.`);
    setAddForm({ email: '', name: '', title: '', department: '' });
    setShowAddForm(false);
    // Refresh roster
    const r = await fetch('/api/team/roster').then(r => r.json());
    if (Array.isArray(r)) setRoster(r);
    setTimeout(() => setAddSuccess(''), 4000);
  }

  async function handleDeleteEmployee(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/team/roster/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      setRoster(prev => prev.filter(e => e.id !== id));
    } else {
      setAddError(data.error || 'Failed to remove employee');
      setTimeout(() => setAddError(''), 4000);
    }
    setDeletingId(null);
  }

  const pendingInvites = invitations.filter(i => !i.acceptedAt && new Date(i.expiresAt) > new Date());

  const filteredRoster = roster.filter(e => {
    const q = rosterSearch.toLowerCase();
    return (
      !q ||
      (e.name ?? '').toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      (e.department ?? '').toLowerCase().includes(q) ||
      (e.title ?? '').toLowerCase().includes(q)
    );
  });

  const activatedCount = roster.filter(e => e.userId).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
        <p className="text-muted-foreground">Invite recruiters and manage your team's access.</p>
      </div>

      {/* Workspace URL banner */}
      {workspaceUrl && (
        <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
          <LinkIcon className="h-4 w-4 text-indigo-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-indigo-900">Recruiter Login URL</p>
            <p className="text-xs text-indigo-600 truncate mt-0.5">{workspaceUrl}</p>
          </div>
          <Button size="sm" variant="outline" onClick={copyWorkspaceUrl} className="shrink-0 border-indigo-200">
            {copiedUrl ? <><Check className="h-3.5 w-3.5 mr-1.5 text-green-600" />Copied</> : <><Copy className="h-3.5 w-3.5 mr-1.5" />Copy URL</>}
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {([
          { key: 'members' as Tab, label: 'Team Members', count: members.length },
          { key: 'roster' as Tab, label: 'Employee Roster', count: roster.length || null },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2',
              tab === t.key
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            {t.label}
            {t.count != null && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{t.count}</Badge>
            )}
          </button>
        ))}
      </div>

      {/* ── Team Members tab ── */}
      {tab === 'members' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Invite Form */}
          <div className="xl:col-span-1 space-y-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-indigo-600" />
                  Invite Team Member
                </CardTitle>
                <CardDescription>
                  Or share the <button onClick={() => setTab('roster')} className="text-indigo-600 hover:underline">Workspace URL</button> so recruiters can self-register from the Employee Roster.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="inviteEmail">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="inviteEmail"
                        type="email"
                        placeholder="recruiter@company.com"
                        className="pl-10 h-11"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Role</Label>
                    <div className="flex gap-2">
                      {(['recruiter', 'company_admin'] as const).map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setInviteRole(r)}
                          className={cn(
                            'flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors',
                            inviteRole === r
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          )}
                        >
                          {r === 'recruiter' ? 'Recruiter' : 'Admin'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />{error}
                    </div>
                  )}

                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                    {loading ? 'Generating invite...' : 'Generate Invite Link'}
                  </Button>
                </form>

                {inviteUrl && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-xl space-y-3">
                    <p className="text-sm font-semibold text-green-800">Invite link ready!</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs text-green-700 bg-green-100 rounded px-2 py-1.5 truncate">
                        {inviteUrl}
                      </code>
                      <Button size="sm" variant="outline" onClick={copyInviteLink} className="shrink-0">
                        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-green-700">Share this link with your team member. Expires in 7 days.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Team Members + Pending Invites */}
          <div className="xl:col-span-2 space-y-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members
                  <Badge variant="secondary" className="ml-auto">{members.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No team members yet. Invite your first recruiter!</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {members.map(m => {
                      const isSelf = m.id === currentUserId;
                      return (
                        <div key={m.id} className="flex items-center justify-between py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm">
                              {(m.name || m.email)[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm">{m.name || '—'}</p>
                                {isSelf && <span className="text-xs text-slate-400">(you)</span>}
                              </div>
                              <p className="text-xs text-muted-foreground">{m.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={m.role === 'company_admin' ? 'border-indigo-200 text-indigo-700 bg-indigo-50' : ''}>
                              {m.role === 'company_admin' ? 'Admin' : 'Recruiter'}
                            </Badge>
                            <Badge variant="outline" className={m.isActive ? 'border-green-200 text-green-700 bg-green-50' : 'border-red-200 text-red-700 bg-red-50'}>
                              {m.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            {!isSelf && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {m.role === 'recruiter' ? (
                                    <DropdownMenuItem onClick={() => handleRoleChange(m.id, 'company_admin')} className="gap-2">
                                      <Shield className="h-4 w-4 text-indigo-600" /> Promote to Admin
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => handleRoleChange(m.id, 'recruiter')} className="gap-2">
                                      <ShieldOff className="h-4 w-4" /> Demote to Recruiter
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  {m.isActive ? (
                                    <DropdownMenuItem onClick={() => handleDeactivate(m.id)} className="gap-2 text-red-600 focus:text-red-600">
                                      <UserX className="h-4 w-4" /> Deactivate
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => handleReactivate(m.id)} className="gap-2 text-green-600 focus:text-green-600">
                                      Reactivate
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {pendingInvites.length > 0 && (
              <Card className="shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-500" />
                    Pending Invitations
                    <Badge variant="secondary" className="ml-auto">{pendingInvites.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-slate-100">
                    {pendingInvites.map(inv => (
                      <div key={inv.id} className="flex items-center justify-between py-4">
                        <div>
                          <p className="font-semibold text-sm">{inv.email}</p>
                          <p className="text-xs text-muted-foreground">Expires {new Date(inv.expiresAt).toLocaleDateString()}</p>
                        </div>
                        <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
                          {inv.role === 'company_admin' ? 'Admin' : 'Recruiter'} · Pending
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ── Employee Roster tab ── */}
      {tab === 'roster' && (
        <div className="space-y-6">
          {/* How it works */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: <LinkIcon className="h-5 w-5 text-indigo-600" />, title: 'Share the URL', body: 'Send your workspace login URL to each recruiter below.' },
              { icon: <Mail className="h-5 w-5 text-indigo-600" />, title: 'They enter their email', body: 'The system recognises them from the ATS roster automatically.' },
              { icon: <CheckCircle2 className="h-5 w-5 text-indigo-600" />, title: 'They set a password', body: 'Their account is activated and they land on their dashboard.' },
            ].map((step, i) => (
              <div key={i} className="flex gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                  {step.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Add Employee form */}
          {showAddForm && (
            <Card className="shadow-sm border-indigo-100 bg-indigo-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-indigo-600" /> Add Employee to Roster
                </CardTitle>
                <CardDescription>They'll be able to self-register via the Workspace URL.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddEmployee} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Email <span className="text-red-500">*</span></Label>
                      <Input
                        type="email"
                        placeholder="recruiter@smartitframe.com"
                        className="h-9 text-sm"
                        value={addForm.email}
                        onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Full Name</Label>
                      <Input
                        placeholder="John Smith"
                        className="h-9 text-sm"
                        value={addForm.name}
                        onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Job Title</Label>
                      <Input
                        placeholder="Senior Recruiter"
                        className="h-9 text-sm"
                        value={addForm.title}
                        onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Department</Label>
                      <Input
                        placeholder="Talent Acquisition"
                        className="h-9 text-sm"
                        value={addForm.department}
                        onChange={e => setAddForm(f => ({ ...f, department: e.target.value }))}
                      />
                    </div>
                  </div>
                  {addError && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {addError}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 gap-1.5" disabled={addLoading}>
                      {addLoading ? 'Adding...' : <><Plus className="h-3.5 w-3.5" /> Add to Roster</>}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => { setShowAddForm(false); setAddError(''); }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {addSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> {addSuccess}
            </div>
          )}

          {/* Roster list */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-indigo-600" />
                    Employee Roster
                    <Badge variant="secondary">{roster.length}</Badge>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {roster.length > 0
                      ? <>{activatedCount} of {roster.length} have activated their accounts.</>
                      : 'Add employees manually or sync from ATS.'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      className="h-9 pl-8 text-sm w-48"
                      placeholder="Search roster..."
                      value={rosterSearch}
                      onChange={e => setRosterSearch(e.target.value)}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs shrink-0"
                    onClick={() => { setShowAddForm(s => !s); setAddError(''); }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Employee
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {roster.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                    <Briefcase className="h-5 w-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">No employees yet</p>
                  <p className="text-sm text-muted-foreground">Add employees manually or connect your ATS to sync.</p>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowAddForm(true)}>
                    <Plus className="h-3.5 w-3.5" /> Add First Employee
                  </Button>
                </div>
              ) : filteredRoster.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No employees match your search.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredRoster.map(emp => (
                    <div key={emp.id} className="flex items-center justify-between py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm shrink-0">
                          {(emp.name ?? emp.email)[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm truncate">{emp.name ?? '—'}</p>
                            {emp.title && <span className="text-xs text-slate-400 truncate">{emp.title}</span>}
                          </div>
                          <p className="text-xs text-muted-foreground">{emp.email}</p>
                          {emp.department && <p className="text-xs text-slate-400">{emp.department}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {emp.userId ? (
                          <Badge className="bg-green-100 text-green-700 border-none text-[10px]">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Activated
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 border-none text-[10px]">Pending</Badge>
                        )}
                        {emp.source && (
                          <Badge variant="outline" className="text-[10px] text-slate-400 capitalize">{emp.source}</Badge>
                        )}
                        {!emp.userId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50"
                            disabled={deletingId === emp.id}
                            onClick={() => handleDeleteEmployee(emp.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
