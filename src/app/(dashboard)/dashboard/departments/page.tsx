'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Building2, Plus, Pencil, Trash2, Users, Database,
  ChevronRight, X, Check, AlertCircle, RefreshCw,
  CheckCircle2, UserMinus, UserPlus, Link2Off,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Department {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  atsCount: number;
  createdAt: string;
}

interface Member {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  assignedAt: string;
}

interface AtsConnection {
  id: string;
  provider: string;
  status: string;
  lastSyncedAt: string | null;
  customUrl: string | null;
  departmentId?: string | null;
}

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
}

const ATS_PROVIDERS = [
  { id: 'ceipal', name: 'Ceipal', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'greenhouse', name: 'Greenhouse', color: 'bg-green-50 text-green-700 border-green-200' },
  { id: 'lever', name: 'Lever', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'workday', name: 'Workday', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'smartrecruiters', name: 'SmartRecruiters', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'bamboohr', name: 'BambooHR', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { id: 'custom_url', name: 'Career Site URL', color: 'bg-slate-50 text-slate-700 border-slate-200' },
];

const providerLabel = (id: string) => ATS_PROVIDERS.find((p) => p.id === id)?.name ?? id;
const providerColor = (id: string) => ATS_PROVIDERS.find((p) => p.id === id)?.color ?? '';

type DetailTab = 'ats' | 'members';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selected, setSelected] = useState<Department | null>(null);
  const [tab, setTab] = useState<DetailTab>('ats');

  // Create / edit dept
  const [showForm, setShowForm] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Members panel
  const [members, setMembers] = useState<Member[]>([]);
  const [teamAll, setTeamAll] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState('');
  const [addingMemberId, setAddingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  // ATS panel
  const [atsConnections, setAtsConnections] = useState<AtsConnection[]>([]);
  const [atsLoading, setAtsLoading] = useState(false);
  const [showAtsForm, setShowAtsForm] = useState(false);
  const [atsProvider, setAtsProvider] = useState('');
  const [atsApiKey, setAtsApiKey] = useState('');
  const [atsEmail, setAtsEmail] = useState('');
  const [atsPassword, setAtsPassword] = useState('');
  const [atsCustomUrl, setAtsCustomUrl] = useState('');
  const [atsError, setAtsError] = useState('');
  const [atsConnecting, setAtsConnecting] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  // Assign existing ATS
  const [showAssignAts, setShowAssignAts] = useState(false);
  const [allAts, setAllAts] = useState<AtsConnection[]>([]);
  const [assigningAtsId, setAssigningAtsId] = useState<string | null>(null);

  // ── Fetch departments ──────────────────────────────────────────────────────

  async function fetchDepts() {
    const res = await fetch('/api/departments');
    if (res.ok) {
      const data = await res.json();
      setDepartments(data);
      // Refresh selected dept counts
      if (selected) {
        const updated = data.find((d: Department) => d.id === selected.id);
        if (updated) setSelected(updated);
      }
    }
  }

  useEffect(() => { fetchDepts(); }, []);

  // ── Fetch detail data when dept or tab changes ─────────────────────────────

  const fetchMembers = useCallback(async (deptId: string) => {
    setMembersLoading(true);
    const [membersRes, teamRes] = await Promise.all([
      fetch(`/api/departments/${deptId}/members`),
      fetch('/api/team'),
    ]);
    if (membersRes.ok) setMembers(await membersRes.json());
    if (teamRes.ok) setTeamAll(await teamRes.json());
    setMembersLoading(false);
  }, []);

  const fetchAts = useCallback(async (deptId: string) => {
    setAtsLoading(true);
    const res = await fetch(`/api/departments/${deptId}/ats`);
    if (res.ok) setAtsConnections(await res.json());
    setAtsLoading(false);
  }, []);

  useEffect(() => {
    if (!selected) return;
    if (tab === 'members') fetchMembers(selected.id);
    if (tab === 'ats') fetchAts(selected.id);
  }, [selected, tab, fetchMembers, fetchAts]);

  // ── Create / Edit department ───────────────────────────────────────────────

  function openCreate() {
    setEditingDept(null);
    setDeptName('');
    setDeptDesc('');
    setFormError('');
    setShowForm(true);
  }

  function openEdit(dept: Department, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingDept(dept);
    setDeptName(dept.name);
    setDeptDesc(dept.description ?? '');
    setFormError('');
    setShowForm(true);
  }

  async function handleSaveDept(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    const url = editingDept ? `/api/departments/${editingDept.id}` : '/api/departments';
    const method = editingDept ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: deptName, description: deptDesc }),
    });
    const data = await res.json();
    setFormLoading(false);
    if (!res.ok) { setFormError(data.error ?? 'Failed to save'); return; }

    if (editingDept) {
      setDepartments((prev) => prev.map((d) => d.id === editingDept.id ? { ...d, name: data.name, description: data.description } : d));
      if (selected?.id === editingDept.id) setSelected((s) => s ? { ...s, name: data.name, description: data.description } : s);
    } else {
      setDepartments((prev) => [...prev, data]);
    }
    setShowForm(false);
  }

  async function handleDeleteDept(dept: Department, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Delete "${dept.name}"? This cannot be undone.`)) return;
    setDeletingId(dept.id);
    await fetch(`/api/departments/${dept.id}`, { method: 'DELETE' });
    setDepartments((prev) => prev.filter((d) => d.id !== dept.id));
    if (selected?.id === dept.id) setSelected(null);
    setDeletingId(null);
  }

  // ── ATS ───────────────────────────────────────────────────────────────────

  async function handleConnectAts(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setAtsError('');
    setAtsConnecting(true);
    const res = await fetch('/api/ats/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: atsProvider,
        apiKey: atsApiKey,
        email: atsEmail,
        password: atsPassword,
        customUrl: atsCustomUrl,
        departmentId: selected.id,
      }),
    });
    const data = await res.json();
    setAtsConnecting(false);
    if (!res.ok) { setAtsError(data.error ?? 'Failed to connect'); return; }
    setShowAtsForm(false);
    setAtsProvider(''); setAtsApiKey(''); setAtsEmail(''); setAtsPassword(''); setAtsCustomUrl('');
    await fetchAts(selected.id);
    await fetchDepts();
  }

  async function handleUnlinkAts(atsId: string) {
    if (!selected) return;
    setUnlinkingId(atsId);
    await fetch(`/api/departments/${selected.id}/ats/${atsId}`, { method: 'DELETE' });
    setAtsConnections((prev) => prev.filter((a) => a.id !== atsId));
    await fetchDepts();
    setUnlinkingId(null);
  }

  async function handleSyncAts(atsId: string) {
    setSyncing(atsId);
    await fetch(`/api/ats/sync/${atsId}`, { method: 'POST' });
    if (selected) await fetchAts(selected.id);
    setSyncing(null);
  }

  async function openAssignExisting() {
    const res = await fetch('/api/ats');
    if (res.ok) {
      const data: AtsConnection[] = await res.json();
      setAllAts(data.filter((a) => !a.departmentId));
    }
    setShowAssignAts(true);
  }

  async function handleAssignExisting(atsId: string) {
    if (!selected) return;
    setAssigningAtsId(atsId);
    const res = await fetch(`/api/departments/${selected.id}/ats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ atsId }),
    });
    if (res.ok) {
      setShowAssignAts(false);
      await fetchAts(selected.id);
      await fetchDepts();
    }
    setAssigningAtsId(null);
  }

  // ── Members ───────────────────────────────────────────────────────────────

  const memberIds = new Set(members.map((m) => m.id));
  const addableMembers = teamAll.filter(
    (m) => !memberIds.has(m.id) && (
      addMemberSearch === '' ||
      m.email.toLowerCase().includes(addMemberSearch.toLowerCase()) ||
      (m.name ?? '').toLowerCase().includes(addMemberSearch.toLowerCase())
    )
  );

  async function handleAddMember(userId: string) {
    if (!selected) return;
    setAddingMemberId(userId);
    const res = await fetch(`/api/departments/${selected.id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) await fetchMembers(selected.id);
    await fetchDepts();
    setAddingMemberId(null);
  }

  async function handleRemoveMember(userId: string) {
    if (!selected) return;
    setRemovingMemberId(userId);
    await fetch(`/api/departments/${selected.id}/members/${userId}`, { method: 'DELETE' });
    setMembers((prev) => prev.filter((m) => m.id !== userId));
    await fetchDepts();
    setRemovingMemberId(null);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full gap-6 p-6">
      {/* ── Left: Department List ───────────────────────────────────────────── */}
      <div className="w-72 shrink-0 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Departments</h1>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
        </div>

        <div className="space-y-2">
          {departments.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
              No departments yet
            </div>
          )}
          {departments.map((dept) => (
            <div
              key={dept.id}
              onClick={() => { setSelected(dept); setTab('ats'); setShowAtsForm(false); }}
              className={cn(
                'rounded-lg border p-3 cursor-pointer transition-colors',
                selected?.id === dept.id
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{dept.name}</p>
                  {dept.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{dept.description}</p>
                  )}
                  <div className="flex gap-2 mt-1.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> {dept.memberCount}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Database className="h-3 w-3" /> {dept.atsCount}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={(e) => openEdit(dept, e)}
                    className="p-1 rounded hover:bg-slate-200 text-muted-foreground transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteDept(dept, e)}
                    disabled={deletingId === dept.id}
                    className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Detail Panel ─────────────────────────────────────────────── */}
      {selected ? (
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selected.name}</CardTitle>
                  {selected.description && (
                    <CardDescription className="mt-1">{selected.description}</CardDescription>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {/* Tabs */}
              <div className="flex gap-2 mt-3">
                {(['ats', 'members'] as DetailTab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-slate-100'
                    )}
                  >
                    {t === 'ats' ? 'ATS Connections' : 'Members'}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent>
              {/* ── ATS Tab ─────────────────────────────────────────────────── */}
              {tab === 'ats' && (
                <div className="space-y-4">
                  {atsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : (
                    <>
                      {atsConnections.length === 0 && !showAtsForm && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          <Database className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          No ATS connected to this department
                        </div>
                      )}
                      {atsConnections.map((ats) => (
                        <div key={ats.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className={cn('text-xs', providerColor(ats.provider))}>
                              {providerLabel(ats.provider)}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={ats.status === 'active' ? 'text-green-700 border-green-200' : 'text-red-600 border-red-200'}
                            >
                              {ats.status}
                            </Badge>
                            {ats.lastSyncedAt && (
                              <span className="text-xs text-muted-foreground">
                                Last sync: {new Date(ats.lastSyncedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSyncAts(ats.id)}
                              disabled={syncing === ats.id}
                            >
                              <RefreshCw className={cn('h-3.5 w-3.5 mr-1', syncing === ats.id && 'animate-spin')} />
                              Sync
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUnlinkAts(ats.id)}
                              disabled={unlinkingId === ats.id}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Link2Off className="h-3.5 w-3.5 mr-1" />
                              Unlink
                            </Button>
                          </div>
                        </div>
                      ))}

                      {/* Assign existing ATS panel */}
                      {showAssignAts && (
                        <div className="border rounded-lg p-4 space-y-3 bg-slate-50">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">Assign Existing ATS</p>
                            <button type="button" onClick={() => setShowAssignAts(false)}>
                              <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </div>
                          {allAts.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">
                              No unassigned ATS connections found. All existing connections are already linked to a department.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {allAts.map((ats) => (
                                <div key={ats.id} className="flex items-center justify-between p-2.5 rounded-md border bg-white">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={cn('text-xs', providerColor(ats.provider))}>
                                      {providerLabel(ats.provider)}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className={ats.status === 'active' ? 'text-green-700 border-green-200' : 'text-red-600 border-red-200'}
                                    >
                                      {ats.status}
                                    </Badge>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAssignExisting(ats.id)}
                                    disabled={assigningAtsId === ats.id}
                                    className="h-7 text-xs"
                                  >
                                    {assigningAtsId === ats.id ? 'Assigning...' : 'Assign'}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Add ATS form */}
                      {showAtsForm ? (
                        <form onSubmit={handleConnectAts} className="border rounded-lg p-4 space-y-4 bg-slate-50">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">Connect ATS</p>
                            <button type="button" onClick={() => { setShowAtsForm(false); setAtsError(''); }}>
                              <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </div>
                          <div className="grid gap-3">
                            <div className="space-y-1.5">
                              <Label>ATS Provider</Label>
                              <div className="flex flex-wrap gap-2">
                                {ATS_PROVIDERS.map((p) => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setAtsProvider(p.id)}
                                    className={cn(
                                      'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                                      atsProvider === p.id ? 'border-primary bg-primary text-primary-foreground' : `${p.color} hover:opacity-80`
                                    )}
                                  >
                                    {p.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {atsProvider && atsProvider !== 'custom_url' && (
                              <>
                                {atsProvider === 'ceipal' && (
                                  <>
                                    <div className="space-y-1.5">
                                      <Label>Email</Label>
                                      <Input value={atsEmail} onChange={(e) => setAtsEmail(e.target.value)} placeholder="your@email.com" required />
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label>Password</Label>
                                      <Input type="password" value={atsPassword} onChange={(e) => setAtsPassword(e.target.value)} required />
                                    </div>
                                  </>
                                )}
                                <div className="space-y-1.5">
                                  <Label>API Key</Label>
                                  <Input value={atsApiKey} onChange={(e) => setAtsApiKey(e.target.value)} placeholder="Paste your API key" required />
                                </div>
                              </>
                            )}
                            {atsProvider === 'custom_url' && (
                              <div className="space-y-1.5">
                                <Label>Career Site URL</Label>
                                <Input value={atsCustomUrl} onChange={(e) => setAtsCustomUrl(e.target.value)} placeholder="https://company.com/careers" required />
                              </div>
                            )}
                          </div>
                          {atsError && (
                            <p className="text-sm text-red-600 flex items-center gap-1.5">
                              <AlertCircle className="h-4 w-4" /> {atsError}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button type="submit" size="sm" disabled={!atsProvider || atsConnecting}>
                              {atsConnecting ? 'Connecting...' : 'Connect'}
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => { setShowAtsForm(false); setAtsError(''); }}>
                              Cancel
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setShowAtsForm(true); setShowAssignAts(false); }}>
                            <Plus className="h-4 w-4 mr-1" /> New ATS Connection
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { openAssignExisting(); setShowAtsForm(false); }}>
                            <Database className="h-4 w-4 mr-1" /> Assign Existing
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── Members Tab ─────────────────────────────────────────────── */}
              {tab === 'members' && (
                <div className="space-y-4">
                  {membersLoading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : (
                    <>
                      {/* Current members */}
                      {members.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          No members in this department
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {members.map((m) => (
                            <div key={m.id} className="flex items-center justify-between p-2.5 rounded-lg border">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                                  {(m.name ?? m.email)[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{m.name ?? '—'}</p>
                                  <p className="text-xs text-muted-foreground">{m.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {m.role.replace('_', ' ')}
                                </Badge>
                                <button
                                  onClick={() => handleRemoveMember(m.id)}
                                  disabled={removingMemberId === m.id}
                                  className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors"
                                >
                                  <UserMinus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add members section */}
                      <div className="border-t pt-4 space-y-2">
                        <p className="text-sm font-medium">Add team members</p>
                        <Input
                          placeholder="Search by name or email..."
                          value={addMemberSearch}
                          onChange={(e) => setAddMemberSearch(e.target.value)}
                          className="h-8 text-sm"
                        />
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {addableMembers.length === 0 && (
                            <p className="text-xs text-muted-foreground py-2 text-center">
                              {addMemberSearch ? 'No matches' : 'All team members already assigned'}
                            </p>
                          )}
                          {addableMembers.map((m) => (
                            <div key={m.id} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50">
                              <div>
                                <p className="text-sm">{m.name ?? '—'}</p>
                                <p className="text-xs text-muted-foreground">{m.email}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleAddMember(m.id)}
                                disabled={addingMemberId === m.id}
                                className="h-7 text-xs"
                              >
                                <UserPlus className="h-3.5 w-3.5 mr-1" />
                                Add
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center space-y-2">
            <ChevronRight className="h-8 w-8 mx-auto opacity-30" />
            <p className="text-sm">Select a department to manage it</p>
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ─────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">{editingDept ? 'Edit Department' : 'New Department'}</h2>
              <button onClick={() => setShowForm(false)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleSaveDept} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="dept-name">Name</Label>
                <Input
                  id="dept-name"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Engineering, Healthcare, Sales"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dept-desc">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="dept-desc"
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  placeholder="Brief description"
                />
              </div>
              {formError && (
                <p className="text-sm text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" /> {formError}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? 'Saving...' : editingDept ? 'Save changes' : 'Create department'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
