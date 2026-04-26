'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, RefreshCw, Database, AlertCircle, Plus, X, Settings2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ATS_PROVIDERS = [
  { id: 'ceipal', name: 'Ceipal', description: 'API Key', color: 'bg-orange-50 text-orange-700' },
  { id: 'greenhouse', name: 'Greenhouse', description: 'API Key', color: 'bg-green-50 text-green-700' },
  { id: 'lever', name: 'Lever', description: 'API Key', color: 'bg-indigo-50 text-indigo-700' },
  { id: 'workday', name: 'Workday', description: 'API Key', color: 'bg-blue-50 text-blue-700' },
  { id: 'smartrecruiters', name: 'SmartRecruiters', description: 'API Key', color: 'bg-purple-50 text-purple-700' },
  { id: 'bamboohr', name: 'BambooHR', description: 'API Key', color: 'bg-teal-50 text-teal-700' },
  { id: 'custom_url', name: 'Career Site URL', description: 'Web Scraper', color: 'bg-slate-50 text-slate-700' },
];

const API_KEY_HINTS: Record<string, string> = {
  ceipal: 'Find your API key in Ceipal → Settings → API Configuration',
  greenhouse: 'Greenhouse → Configure → Dev Center → API Credential Management',
  lever: 'Lever → Settings → Integrations & API',
  workday: 'Contact your Workday admin for the integration API key',
  smartrecruiters: 'SmartRecruiters → Settings → API',
  bamboohr: 'BambooHR → Account → API Keys',
  custom_url: '',
};

interface AtsConnection {
  id: string;
  provider: string;
  status: string;
  lastSyncedAt: string | null;
  customUrl: string | null;
  config: { customJobEndpoint: string | null } | null;
}

export default function ATSConnectionPage() {
  const [connected, setConnected] = useState<AtsConnection[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customEndpointUrl, setCustomEndpointUrl] = useState('');
  const [syncing, setSyncing] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Configure endpoint state
  const [configuringId, setConfiguringId] = useState<string | null>(null);
  const [configEndpoint, setConfigEndpoint] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchConnections(); }, []);

  async function fetchConnections() {
    const res = await fetch('/api/ats');
    if (res.ok) setConnected(await res.json());
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setConnecting(true);
    const res = await fetch('/api/ats/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: selectedProvider, apiKey, email, password, customUrl, customEndpointUrl }),
    });
    const data = await res.json();
    setConnecting(false);
    if (!res.ok) { setError(data.error || 'Failed to connect'); return; }
    const name = ATS_PROVIDERS.find(p => p.id === selectedProvider)?.name;
    const jobMsg = data.syncedJobCount != null ? ` Initial sync: ${data.syncedJobCount} jobs loaded. Click "Sync Now" to pull all jobs.` : '';
    setSuccess(`${name} connected!${jobMsg}`);
    setShowForm(false);
    setSelectedProvider(''); setApiKey(''); setEmail(''); setPassword(''); setCustomUrl(''); setCustomEndpointUrl('');
    fetchConnections();
    setTimeout(() => setSuccess(''), 8000);
  }

  async function handleSync(id: string) {
    setSyncing(id);
    const res = await fetch(`/api/ats/sync/${id}`, { method: 'POST' });
    const data = res.ok ? await res.json() : null;
    setSyncing(null);
    if (data?.syncedJobCount != null) {
      setSuccess(`Sync complete — ${data.syncedJobCount} jobs, ${data.syncedEmployeeCount} new employees.`);
      setTimeout(() => setSuccess(''), 6000);
    }
    fetchConnections();
  }

  async function handleDisconnect(id: string) {
    await fetch(`/api/ats/${id}`, { method: 'DELETE' });
    fetchConnections();
  }

  function openConfigure(conn: any) {
    setConfiguringId(conn.id);
    setConfigEndpoint(conn.config?.customJobEndpoint ?? '');
  }

  async function handleSaveEndpoint(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/ats/${configuringId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customJobEndpoint: configEndpoint }),
    });
    setSaving(false);
    if (res.ok) {
      setSuccess('Custom job endpoint saved. ATS Browser is now available.');
      setConfiguringId(null);
      fetchConnections();
      setTimeout(() => setSuccess(''), 6000);
    }
  }

  const availableProviders = ATS_PROVIDERS.filter(p => !connected.find(c => c.provider === p.id));
  const providerMeta = ATS_PROVIDERS.find(p => p.id === selectedProvider);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ATS Connection</h1>
          <p className="text-muted-foreground">Connect one or more ATS systems to auto-sync job openings.</p>
        </div>
        {!showForm && (
          <Button onClick={() => { setShowForm(true); setError(''); }} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" /> Connect ATS
          </Button>
        )}
      </div>

      {success && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {success}
        </div>
      )}

      {/* Connect Form */}
      {showForm && (
        <Card className="shadow-sm border-indigo-100 animate-in fade-in slide-in-from-top-2 duration-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Connect a New ATS</CardTitle>
              <CardDescription>Select your system and enter credentials to start syncing jobs.</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setError(''); setSelectedProvider(''); }}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleConnect} className="space-y-6">
              <div>
                <Label className="mb-3 block">Select ATS</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {availableProviders.map((p) => (
                    <button key={p.id} type="button" onClick={() => setSelectedProvider(p.id)}
                      className={cn('p-4 rounded-xl border-2 text-left transition-all',
                        selectedProvider === p.id ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
                      )}>
                      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm mb-2', p.color)}>
                        {p.name[0]}
                      </div>
                      <p className="font-semibold text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {selectedProvider && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {selectedProvider === 'custom_url' ? (
                    <div className="space-y-2">
                      <Label htmlFor="customUrl">Career Site URL</Label>
                      <Input id="customUrl" placeholder="https://careers.yourcompany.com"
                        value={customUrl} onChange={e => setCustomUrl(e.target.value)} className="h-11" required />
                      <p className="text-xs text-muted-foreground">We'll crawl this page to find and sync job openings.</p>
                    </div>
                  ) : selectedProvider === 'ceipal' ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="ceipalEmail">Ceipal Login Email</Label>
                        <Input id="ceipalEmail" type="email" placeholder="you@company.com"
                          value={email} onChange={e => setEmail(e.target.value)} className="h-11" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ceipalPassword">Ceipal Password</Label>
                        <Input id="ceipalPassword" type="password" placeholder="Your Ceipal account password"
                          value={password} onChange={e => setPassword(e.target.value)} className="h-11" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apiKey">Ceipal API Key</Label>
                        <Input id="apiKey" type="password" placeholder="Enter your API key..."
                          value={apiKey} onChange={e => setApiKey(e.target.value)} className="h-11" required />
                        <p className="text-xs text-muted-foreground">{API_KEY_HINTS['ceipal']}</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customEndpointUrl">Custom Job Posting URL (optional)</Label>
                        <Input id="customEndpointUrl" type="url" placeholder="https://api.ceipal.com/getCustomJobPostingDetails/..."
                          value={customEndpointUrl} onChange={e => setCustomEndpointUrl(e.target.value)} className="h-11" />
                        <p className="text-xs text-muted-foreground">Your company's custom job endpoint for the ATS Browser feature.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">{providerMeta?.name} API Key</Label>
                      <Input id="apiKey" type="password" placeholder="Enter your API key..."
                        value={apiKey} onChange={e => setApiKey(e.target.value)} className="h-11" required />
                      <p className="text-xs text-muted-foreground">{API_KEY_HINTS[selectedProvider]}</p>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                      <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={connecting}>
                      {connecting ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Connecting...</> : `Connect ${providerMeta?.name}`}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { setShowForm(false); setError(''); setSelectedProvider(''); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Connected Systems */}
      {connected.length > 0 ? (
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Connected Systems</CardTitle>
            <CardDescription>Manage your active ATS integrations.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {connected.map((conn) => {
                const meta = ATS_PROVIDERS.find(p => p.id === conn.provider);
                const hasEndpoint = !!(conn.config?.customJobEndpoint);
                const isConfiguring = configuringId === conn.id;
                return (
                  <div key={conn.id} className="rounded-xl border border-slate-100 bg-slate-50/50 overflow-hidden">
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg', meta?.color ?? 'bg-slate-100 text-slate-500')}>
                          {meta?.name[0] ?? '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900">{meta?.name}</h4>
                            <Badge className={cn('border-none text-[10px]', conn.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                              {conn.status === 'active' ? 'Active' : conn.status}
                            </Badge>
                            {conn.provider === 'ceipal' && (
                              <Badge className={cn('border-none text-[10px]', hasEndpoint ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700')}>
                                {hasEndpoint ? 'Browser Ready' : 'Browser Not Configured'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {conn.lastSyncedAt ? `Last synced ${new Date(conn.lastSyncedAt).toLocaleString()}` : 'Sync pending...'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {conn.provider === 'ceipal' && (
                          <Button variant="outline" size="sm" onClick={() => isConfiguring ? setConfiguringId(null) : openConfigure(conn)}>
                            <Settings2 className="h-4 w-4 mr-2" /> Configure
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleSync(conn.id)} disabled={syncing === conn.id}>
                          <RefreshCw className={cn('h-4 w-4 mr-2', syncing === conn.id && 'animate-spin')} /> Sync Now
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDisconnect(conn.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Inline configure panel */}
                    {isConfiguring && (
                      <div className="border-t border-slate-100 bg-white px-5 py-4 animate-in fade-in duration-200">
                        <form onSubmit={handleSaveEndpoint} className="space-y-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="configEndpoint" className="text-sm">Custom Job Posting URL</Label>
                            <Input
                              id="configEndpoint"
                              type="url"
                              placeholder="https://api.ceipal.com/getCustomJobPostingDetails/..."
                              value={configEndpoint}
                              onChange={e => setConfigEndpoint(e.target.value)}
                              className="h-10 font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                              Required to use the ATS Browser. Found in Ceipal → Jobs → Custom Job Portal link.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700" disabled={saving}>
                              {saving ? <><RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />Saving...</> : 'Save Endpoint'}
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => setConfiguringId(null)}>Cancel</Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : !showForm && (
        <Card className="shadow-sm border-dashed border-slate-300 bg-slate-50/50">
          <CardContent className="py-16 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
              <Database className="h-7 w-7 text-slate-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">No ATS connected yet</p>
              <p className="text-sm text-muted-foreground mt-1">Connect your ATS to automatically sync job openings.</p>
            </div>
            <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" /> Connect Your First ATS
            </Button>
          </CardContent>
        </Card>
      )}

      {connected.length > 0 && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader><CardTitle className="text-base">Sync Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Auto-sync</span>
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-green-600 bg-green-50 border-green-100">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sync Frequency</span>
              <span className="font-medium">Every 6 hours</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Duplicate Detection</span>
              <span className="font-medium">AI-Powered</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
