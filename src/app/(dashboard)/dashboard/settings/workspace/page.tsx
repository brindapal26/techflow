'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Building2, Globe, Copy, Check, CheckCircle2, AlertCircle,
  Link as LinkIcon, ImageIcon, Palette, Upload, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Retail', 'Hospitality',
  'Manufacturing', 'Education', 'Consulting', 'Staffing', 'Other',
];

const BRAND_COLORS = [
  '#6366f1', '#0A66C2', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
  '#f97316', '#64748b',
];

export default function WorkspaceSettingsPage() {
  const [form, setForm] = useState({ name: '', website: '', industry: '', logoUrl: '', brandColor: '', careerPageUrl: '' });
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [logoPreviewError, setLogoPreviewError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/workspace/me')
      .then(r => r.json())
      .then(data => {
        setForm({
          name: data.name ?? '',
          website: data.website ?? '',
          industry: data.industry ?? '',
          logoUrl: data.logoUrl ?? '',
          brandColor: data.brandColor ?? '',
          careerPageUrl: data.careerPageUrl ?? '',
        });
        setSlug(data.slug ?? '');
      });
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (e.target.name === 'logoUrl') setLogoPreviewError(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side: convert to data URL for preview (production would upload to Vercel Blob / S3)
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setForm(f => ({ ...f, logoUrl: dataUrl }));
      setLogoPreviewError(false);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const res = await fetch('/api/workspace/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    setSaving(false);
    if (res.ok) {
      setMsg({ type: 'success', text: 'Workspace settings saved.' });
    } else {
      const d = await res.json();
      setMsg({ type: 'error', text: d.error || 'Failed to save.' });
    }
    setTimeout(() => setMsg(null), 4000);
  }

  const workspaceUrl = typeof window !== 'undefined' ? `${window.location.origin}/login/${slug}` : '';
  const hasLogo = form.logoUrl && !logoPreviewError;

  function copyUrl() {
    navigator.clipboard.writeText(workspaceUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workspace Settings</h1>
        <p className="text-muted-foreground">Manage your company information and workspace URL.</p>
      </div>

      {/* Workspace Login URL */}
      <Card className="shadow-sm border-indigo-100 bg-indigo-50/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LinkIcon className="h-4 w-4 text-indigo-600" />
            Your Workspace Login URL
          </CardTitle>
          <CardDescription>Share this URL with your recruiters so they can access your workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm bg-white border border-indigo-100 rounded-lg px-4 py-3 text-indigo-700 font-medium truncate">
              {workspaceUrl}
            </code>
            <Button size="sm" variant="outline" onClick={copyUrl} className="shrink-0">
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Workspace slug:</span>
            <Badge variant="outline" className="text-xs font-mono">{slug}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Company Info */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" />
            Company Profile
          </CardTitle>
          <CardDescription>Used in AI-generated posts — company name, logo and brand colour appear in recruiter content.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">

            {/* Logo */}
            <div className="space-y-3">
              <Label className="flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-slate-400" /> Company Logo
              </Label>
              <div className="flex items-start gap-4">
                {/* Preview */}
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                  {hasLogo ? (
                    <img
                      src={form.logoUrl}
                      alt="Company logo"
                      className="w-full h-full object-contain p-1"
                      onError={() => setLogoPreviewError(true)}
                    />
                  ) : (
                    <Building2 className="h-8 w-8 text-slate-300" />
                  )}
                </div>

                {/* Upload + URL */}
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {uploading ? 'Loading...' : 'Upload file'}
                    </Button>
                    {form.logoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => { setForm(f => ({ ...f, logoUrl: '' })); setLogoPreviewError(false); }}
                      >
                        <X className="h-3.5 w-3.5" /> Remove
                      </Button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Input
                    name="logoUrl"
                    placeholder="Or paste image URL: https://..."
                    value={form.logoUrl.startsWith('data:') ? '' : form.logoUrl}
                    onChange={handleChange}
                    className="h-9 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">PNG, JPG or SVG. Recommended: 200×200px square.</p>
                </div>
              </div>
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="name"
                  name="name"
                  placeholder="Smart IT Frame"
                  className="pl-10 h-11"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="website"
                  name="website"
                  placeholder="https://smartitframe.com"
                  className="pl-10 h-11"
                  value={form.website}
                  onChange={handleChange}
                />
              </div>
              <p className="text-xs text-muted-foreground">Used as fallback apply link in posts when a job has no direct apply URL.</p>
            </div>

            {/* Career Page URL */}
            <div className="space-y-2">
              <Label htmlFor="careerPageUrl">Career Portal URL</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="careerPageUrl"
                  name="careerPageUrl"
                  placeholder="https://smartitframe.com/careers/us-portal"
                  className="pl-10 h-11"
                  value={form.careerPageUrl}
                  onChange={handleChange}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Job apply links in posts are built as <code className="bg-slate-100 px-1 rounded text-[11px]">[Career Portal URL]?job_id=[ATS ID]</code>
              </p>
            </div>

            {/* Industry */}
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <select
                id="industry"
                name="industry"
                className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.industry}
                onChange={handleChange}
              >
                <option value="">Select industry...</option>
                {INDUSTRIES.map(i => (
                  <option key={i} value={i.toLowerCase()}>{i}</option>
                ))}
              </select>
            </div>

            {/* Brand Color */}
            <div className="space-y-3">
              <Label className="flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-slate-400" /> Brand Colour
                <span className="text-xs font-normal text-muted-foreground">(used in post previews)</span>
              </Label>
              <div className="flex items-center gap-3 flex-wrap">
                {BRAND_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, brandColor: color }))}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-all',
                      form.brandColor === color ? 'border-slate-900 scale-110' : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                {/* Custom hex input */}
                <div className="flex items-center gap-2 ml-1">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-slate-200 shrink-0"
                    style={{ backgroundColor: form.brandColor || '#e2e8f0' }}
                  />
                  <Input
                    name="brandColor"
                    placeholder="#6366f1"
                    value={form.brandColor}
                    onChange={handleChange}
                    className="h-8 w-28 font-mono text-xs"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            {msg && (
              <div className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                {msg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {msg.text}
              </div>
            )}

            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
