'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Linkedin,
  Facebook,
  Twitter,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Clock,
  Users,
  XCircle,
  Eye,
  EyeOff,
  Settings2,
  Save,
  Send,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface SocialConnection {
  id: string;
  platform: 'linkedin' | 'facebook' | 'twitter';
  connectionType: 'personal' | 'company_page';
  platformUsername: string | null;
  tokenExpiresAt: string | null;
  isActive: boolean;
  connectedAt: string;
}

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
  connections: {
    platform: string;
    platformUsername: string | null;
    tokenExpiresAt: string | null;
    isActive: boolean;
    connectedAt: string;
  }[];
}

function isExpired(tokenExpiresAt: string | null): boolean {
  if (!tokenExpiresAt) return false;
  return new Date(tokenExpiresAt) < new Date();
}

function LinkedInAppSetup() {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch('/api/workspace/linkedin-app')
      .then(r => r.json())
      .then(data => {
        setClientId(data.clientId ?? '');
        setIsConfigured(!!(data.clientId && data.clientSecretSet));
        setLoading(false);
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    const res = await fetch('/api/workspace/linkedin-app', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setIsConfigured(true);
      setClientSecret('');
      setOpen(false);
      setToast({ type: 'success', msg: 'LinkedIn app credentials saved.' });
    } else {
      setToast({ type: 'error', msg: data.error ?? 'Failed to save.' });
    }
    setTimeout(() => setToast(null), 4000);
  }

  async function handleRemove() {
    setRemoving(true);
    await fetch('/api/workspace/linkedin-app', { method: 'DELETE' });
    setIsConfigured(false);
    setClientId('');
    setClientSecret('');
    setRemoving(false);
    setOpen(false);
    setToast({ type: 'success', msg: 'LinkedIn app credentials removed.' });
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <Card className="shadow-sm border-slate-200">
      <CardContent className="p-0">
        {/* Header row */}
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Settings2 className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">LinkedIn App Setup</h3>
                {loading ? (
                  <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
                ) : isConfigured ? (
                  <Badge className="bg-green-100 text-green-700 border-none text-[10px]">Configured</Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 border-none text-[10px]">Required</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your LinkedIn Developer App credentials — required before anyone can connect.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1.5"
            onClick={() => setOpen(o => !o)}
          >
            <Settings2 className="h-3.5 w-3.5" />
            {isConfigured ? 'Update' : 'Set up'}
          </Button>
        </div>

        {/* Expandable form */}
        {open && (
          <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">
            {toast && (
              <div className={cn(
                'flex items-center gap-2 text-xs rounded-lg px-3 py-2 border',
                toast.type === 'success' ? 'text-green-700 bg-green-50 border-green-100' : 'text-red-600 bg-red-50 border-red-100'
              )}>
                {toast.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
                {toast.msg}
              </div>
            )}

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 leading-relaxed">
              <strong>How to get these:</strong> Go to{' '}
              <a
                href="https://www.linkedin.com/developers/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold"
              >
                LinkedIn Developer Portal
              </a>{' '}
              → create or select your app → <strong>Auth</strong> tab. Add this redirect URL:{' '}
              <code className="bg-blue-100 px-1 rounded font-mono">
                {typeof window !== 'undefined' ? window.location.origin : ''}/api/social/linkedin/callback
              </code>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Client ID</Label>
              <Input
                placeholder="86xxxxxxxxxxxxxxxx"
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                className="h-9 font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Client Secret {isConfigured && <span className="font-normal text-muted-foreground">(leave blank to keep existing)</span>}
              </Label>
              <div className="relative">
                <Input
                  type={showSecret ? 'text' : 'password'}
                  placeholder={isConfigured ? '••••••••••••••••' : 'Enter client secret'}
                  value={clientSecret}
                  onChange={e => setClientSecret(e.target.value)}
                  className="h-9 font-mono text-sm pr-9"
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowSecret(s => !s)}
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2 h-9"
                disabled={!clientId || (!isConfigured && !clientSecret) || saving}
                onClick={handleSave}
              >
                {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Credentials
              </Button>
              {isConfigured && (
                <Button
                  variant="outline"
                  className="text-red-600 hover:bg-red-50 hover:border-red-200 h-9"
                  disabled={removing}
                  onClick={handleRemove}
                >
                  {removing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LinkedInCard({
  connection,
  onDisconnect,
  disconnecting,
}: {
  connection: SocialConnection | undefined;
  onDisconnect: (id: string) => void;
  disconnecting: string | null;
}) {
  const expired = connection ? isExpired(connection.tokenExpiresAt) : false;
  const [testPosting, setTestPosting] = useState(false);
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  async function handleTestPost() {
    setTestPosting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/social/linkedin/test-post', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setTestResult({ type: 'success', msg: 'Test post published! Check your LinkedIn profile.' });
      } else {
        setTestResult({ type: 'error', msg: data.error ?? 'Failed to post.' });
      }
    } catch {
      setTestResult({ type: 'error', msg: 'Network error — please try again.' });
    }
    setTestPosting(false);
    setTimeout(() => setTestResult(null), 8000);
  }

  return (
    <Card className="shadow-sm border-slate-200 overflow-hidden">
      <CardContent className="p-0">
        <div className="p-5 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12 border border-slate-200">
                <AvatarFallback className="bg-[#0A66C2]/10 text-[#0A66C2] font-bold text-sm">in</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white bg-[#0A66C2] flex items-center justify-center text-white">
                <Linkedin className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-900">LinkedIn</h3>
              <p className="text-xs text-muted-foreground">Your personal recruiter profile</p>
            </div>
          </div>
          {connection && !expired ? (
            <Badge className="bg-green-100 text-green-700 border-none">Connected</Badge>
          ) : connection && expired ? (
            <Badge className="bg-amber-100 text-amber-700 border-none">Token expired</Badge>
          ) : (
            <Badge variant="outline" className="text-slate-400">Not connected</Badge>
          )}
        </div>

        {connection ? (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2.5">
              <div className="w-8 h-8 rounded-full bg-[#0A66C2]/10 flex items-center justify-center text-[#0A66C2] font-bold shrink-0">
                {(connection.platformUsername ?? 'L')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold">{connection.platformUsername ?? 'LinkedIn User'}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Connected {new Date(connection.connectedAt).toLocaleDateString()}
                  {connection.tokenExpiresAt && (
                    <> · Expires {new Date(connection.tokenExpiresAt).toLocaleDateString()}</>
                  )}
                </p>
              </div>
            </div>

            {/* Test post result */}
            {testResult && (
              <div className={cn(
                'flex items-start gap-2 text-xs rounded-lg px-3 py-2 border',
                testResult.type === 'success'
                  ? 'text-green-700 bg-green-50 border-green-100'
                  : 'text-red-600 bg-red-50 border-red-100'
              )}>
                {testResult.type === 'success'
                  ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  : <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
                {testResult.msg}
              </div>
            )}

            <div className="flex gap-2">
              {!expired && (
                <Button
                  variant="outline"
                  className="flex-1 gap-2 border-[#0A66C2]/30 text-[#0A66C2] hover:bg-[#0A66C2]/5"
                  disabled={testPosting}
                  onClick={handleTestPost}
                >
                  {testPosting
                    ? <RefreshCw className="h-4 w-4 animate-spin" />
                    : <Send className="h-4 w-4" />}
                  Send Test Post
                </Button>
              )}
              {expired && (
                <Button asChild className="flex-1 bg-[#0A66C2] hover:bg-[#004182] gap-2">
                  <a href="/api/social/linkedin/connect">
                    <RefreshCw className="h-4 w-4" /> Reconnect
                  </a>
                </Button>
              )}
              <Button
                variant="outline"
                className="text-red-600 hover:bg-red-50 hover:border-red-200 gap-2"
                disabled={disconnecting === connection.id}
                onClick={() => onDisconnect(connection.id)}
              >
                {disconnecting === connection.id
                  ? <RefreshCw className="h-4 w-4 animate-spin" />
                  : <Trash2 className="h-4 w-4" />}
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-5">
            <p className="text-sm text-muted-foreground mb-4">
              Connect your LinkedIn profile so TalentFlow can publish job posts on your behalf.
            </p>
            <Button asChild className="w-full bg-[#0A66C2] hover:bg-[#004182] gap-2 h-11">
              <a href="/api/social/linkedin/connect">
                <Linkedin className="h-5 w-5" /> Connect My LinkedIn
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TeamLinkedInPanel({ adminConnection }: { adminConnection: SocialConnection | undefined }) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [reminding, setReminding] = useState<Set<string>>(new Set());
  const [remindingAll, setRemindingAll] = useState(false);
  const [remindToast, setRemindToast] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/social/team-connections')
      .then(r => r.json())
      .then(data => { setTeam(Array.isArray(data) ? data : []); setLoading(false); });
  }, [adminConnection]);

  async function sendReminder(userIds: string[]) {
    const res = await fetch('/api/social/remind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error ?? 'Failed to send' };
    return data;
  }

  async function handleRemindOne(userId: string, name: string) {
    setReminding(prev => new Set(prev).add(userId));
    const result = await sendReminder([userId]);
    setReminding(prev => { const s = new Set(prev); s.delete(userId); return s; });
    if (result.error) {
      setRemindToast(`Failed: ${result.error}`);
    } else {
      setRemindToast(`Reminder sent to ${name}`);
    }
    setTimeout(() => setRemindToast(null), 4000);
  }

  async function handleRemindAll() {
    const needRemind = needsReminder.map(m => m.id);
    if (needRemind.length === 0) return;
    setRemindingAll(true);
    const result = await sendReminder(needRemind);
    setRemindingAll(false);
    if (result.error) {
      setRemindToast(`Failed: ${result.error}`);
    } else {
      setRemindToast(`Sent ${result.sent} reminder${result.sent !== 1 ? 's' : ''}`);
    }
    setTimeout(() => setRemindToast(null), 4000);
  }

  const recruiters = team.filter(m => m.role === 'recruiter');
  const admins = team.filter(m => m.role === 'company_admin');
  const allMembers = [...admins, ...recruiters];

  const needsReminder = allMembers.filter(m => {
    const li = m.connections.find(c => c.platform === 'linkedin');
    return !li || isExpired(li.tokenExpiresAt);
  });

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" /> Team LinkedIn Status
            </CardTitle>
            <CardDescription className="mt-1">
              Posts publish from each recruiter's personal LinkedIn. They must connect individually.
            </CardDescription>
          </div>
          {needsReminder.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 gap-1.5 text-xs"
              disabled={remindingAll}
              onClick={handleRemindAll}
            >
              {remindingAll
                ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                : <Linkedin className="h-3.5 w-3.5" />}
              Remind All ({needsReminder.length})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {remindToast && (
          <div className="mb-3 flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> {remindToast}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : allMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No team members found.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {allMembers.map(member => {
              const li = member.connections.find(c => c.platform === 'linkedin');
              const expired = li ? isExpired(li.tokenExpiresAt) : false;
              const connected = li && !expired;
              const needRemind = !connected;
              const initials = (member.name ?? member.email)
                .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              const displayName = member.name ?? member.email;

              return (
                <div key={member.id} className="flex items-center gap-3 py-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xs shrink-0">
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {displayName}
                      {member.role === 'company_admin' && (
                        <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {li
                        ? `${li.platformUsername ?? 'LinkedIn'} · ${new Date(li.connectedAt).toLocaleDateString()}`
                        : member.email}
                    </p>
                  </div>

                  {/* Status + Remind */}
                  <div className="flex items-center gap-2 shrink-0">
                    {connected ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-medium">Connected</span>
                      </div>
                    ) : expired ? (
                      <>
                        <div className="flex items-center gap-1 text-amber-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-xs font-medium">Expired</span>
                        </div>
                        {member.role !== 'company_admin' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-indigo-600 hover:bg-indigo-50"
                            disabled={reminding.has(member.id)}
                            onClick={() => handleRemindOne(member.id, displayName)}
                          >
                            {reminding.has(member.id)
                              ? <RefreshCw className="h-3 w-3 animate-spin" />
                              : 'Remind'}
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1 text-slate-400">
                          <XCircle className="h-4 w-4" />
                          <span className="text-xs font-medium">Not connected</span>
                        </div>
                        {member.role !== 'company_admin' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-indigo-600 hover:bg-indigo-50"
                            disabled={reminding.has(member.id)}
                            onClick={() => handleRemindOne(member.id, displayName)}
                          >
                            {reminding.has(member.id)
                              ? <RefreshCw className="h-3 w-3 animate-spin" />
                              : 'Remind'}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-4 text-xs text-muted-foreground border-t border-slate-100 pt-3">
          Recruiters connect their own LinkedIn from their Social Profiles page.
        </p>
      </CardContent>
    </Card>
  );
}

function SocialProfilesInner() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role ?? 'recruiter';
  const isAdmin = role === 'company_admin';

  const searchParams = useSearchParams();
  const successMsg = searchParams.get('success');
  const errorMsg = searchParams.get('error');

  const [myConnections, setMyConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchMine = useCallback(async () => {
    const res = await fetch('/api/social/connections');
    if (res.ok) setMyConnections(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchMine(); }, [fetchMine]);

  useEffect(() => {
    if (successMsg === 'linkedin_connected') {
      setToast({ type: 'success', message: 'LinkedIn connected successfully!' });
      setTimeout(() => setToast(null), 5000);
    } else if (errorMsg) {
      const msgs: Record<string, string> = {
        linkedin_denied: 'LinkedIn authorization was denied.',
        linkedin_token: 'Failed to exchange LinkedIn token.',
        linkedin_profile: 'Failed to retrieve LinkedIn profile.',
        linkedin_not_configured: 'LinkedIn app not configured — ask your admin to enter the LinkedIn App credentials in Social Profiles.',
      };
      setToast({ type: 'error', message: msgs[errorMsg] ?? 'Something went wrong.' });
      setTimeout(() => setToast(null), 8000);
    }
  }, [successMsg, errorMsg]);

  async function handleDisconnect(id: string) {
    setDisconnecting(id);
    const res = await fetch(`/api/social/connections/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setMyConnections(prev => prev.filter(c => c.id !== id));
      setToast({ type: 'success', message: 'Disconnected.' });
    } else {
      setToast({ type: 'error', message: 'Failed to disconnect.' });
    }
    setDisconnecting(null);
    setTimeout(() => setToast(null), 4000);
  }

  const linkedInConn = myConnections.find(c => c.platform === 'linkedin');

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Social Profiles</h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? 'Manage your own social connections and monitor your team\'s status.'
            : 'Connect your social accounts so TalentFlow can publish job posts on your behalf.'}
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={cn(
          'flex items-center gap-2 text-sm rounded-xl px-4 py-3 border',
          toast.type === 'success'
            ? 'text-green-700 bg-green-50 border-green-100'
            : 'text-red-600 bg-red-50 border-red-100'
        )}>
          {toast.type === 'success'
            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
            : <AlertCircle className="h-4 w-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-5">
          {/* LinkedIn App Setup — admin only */}
          {isAdmin && <LinkedInAppSetup />}

          {/* My LinkedIn */}
          {loading ? (
            <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
          ) : (
            <LinkedInCard
              connection={linkedInConn}
              onDisconnect={handleDisconnect}
              disconnecting={disconnecting}
            />
          )}

          {/* Facebook — coming soon */}
          <Card className="shadow-sm border-slate-200 opacity-50">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1877F2]/10 flex items-center justify-center">
                  <Facebook className="h-5 w-5 text-[#1877F2]" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Facebook</p>
                  <p className="text-xs text-muted-foreground">Company page publishing</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">Coming soon</Badge>
            </CardContent>
          </Card>

          {/* Twitter — coming soon */}
          <Card className="shadow-sm border-slate-200 opacity-50">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Twitter className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Twitter / X</p>
                  <p className="text-xs text-muted-foreground">Profile publishing</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">Coming soon</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Right panel */}
        <div className="space-y-6">
          {/* Admin: team overview */}
          {isAdmin && (
            <TeamLinkedInPanel adminConnection={linkedInConn} />
          )}

          {/* Permissions info */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <CardTitle className="text-base">Permissions Requested</CardTitle>
              </div>
              <CardDescription>We only request the minimum needed to post on your behalf.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Publish posts', granted: true },
                { label: 'Read basic profile', granted: true },
                { label: 'Send messages', granted: false },
                { label: 'Access contacts', granted: false },
              ].map(p => (
                <div key={p.label} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{p.label}</span>
                  {p.granted
                    ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                    : <Badge variant="outline" className="text-[10px] text-muted-foreground">Off</Badge>}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recruiter tip card */}
          {!isAdmin && (
            <Card className="border-indigo-100 bg-indigo-50/50">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-indigo-800 mb-1">Why connect your LinkedIn?</p>
                <p className="text-xs text-indigo-600 leading-relaxed">
                  Posts published from your personal LinkedIn profile get 5× more reach than company pages. Your account stays under your control — you can disconnect any time.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SocialProfilesPage() {
  return (
    <Suspense fallback={<div className="h-64 bg-slate-50 rounded-xl animate-pulse" />}>
      <SocialProfilesInner />
    </Suspense>
  );
}
