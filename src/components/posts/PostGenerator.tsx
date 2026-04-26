'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RefreshCw,
  Sparkles,
  Linkedin,
  Twitter,
  Facebook,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  MapPin,
  ChevronLeft,
  Zap,
  Save,
  Send,
  ExternalLink,
  ImageIcon,
  X,
  Upload,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PostEditor } from './PostEditor';
import { PlatformPreviews } from './PlatformPreviews';

interface Job {
  id: string;
  title: string;
  location: string | null;
  department: string | null;
  jobType: string | null;
  status: string;
  applyUrl: string | null;
}

interface Variant {
  id: number;
  caption: string;
  hashtags: string[];
  score: number;
  platform: string;
}

const PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, available: true },
  { id: 'twitter', label: 'Twitter / X', icon: Twitter, available: false },
  { id: 'facebook', label: 'Facebook', icon: Facebook, available: false },
];

const TONES = [
  { id: 'professional', label: 'Professional', desc: 'Polished & formal' },
  { id: 'conversational', label: 'Conversational', desc: 'Friendly & approachable' },
  { id: 'enthusiastic', label: 'Enthusiastic', desc: 'High-energy & exciting' },
];

function PostGeneratorInner() {
  const searchParams = useSearchParams();
  const preselectedJobId = searchParams.get('jobId') ?? '';

  const [phase, setPhase] = useState<'configure' | 'generating' | 'results'>('configure');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState(preselectedJobId);
  const [platform, setPlatform] = useState('linkedin');
  const [tone, setTone] = useState('professional');
  const [highlights, setHighlights] = useState('');
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [applyUrl, setApplyUrl] = useState('');
  const [company, setCompany] = useState<{ name: string; website?: string | null; logoUrl?: string | null } | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageSource, setImageSource] = useState<'scraped' | 'generated' | 'manual' | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const router = useRouter();

  // Ref to track which jobId we've already attempted image resolution for
  const imageAttemptedForJob = useRef<string | null>(null);

  useEffect(() => {
    fetch('/api/jobs?status=open')
      .then(r => r.json())
      .then(data => {
        setJobs(Array.isArray(data) ? data : []);
        setJobsLoading(false);
      });
    fetch('/api/workspace/me')
      .then(r => r.json())
      .then(data => setCompany({ name: data.name, website: data.website, logoUrl: data.logoUrl }));
  }, []);

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  // Full image resolution chain: job applyUrl scrape → AI generation
  // Runs once per selectedJobId, waits for jobs + company to be ready
  useEffect(() => {
    if (!selectedJobId || !jobs.length || !company) return;
    if (imageAttemptedForJob.current === selectedJobId) return; // already ran for this job
    if (imageUrl) { imageAttemptedForJob.current = selectedJobId; return; } // already have an image

    const job = jobs.find(j => j.id === selectedJobId);
    if (!job) return;

    imageAttemptedForJob.current = selectedJobId;

    const tryUrl = (url: string, onFail: () => void) => {
      setImageLoading(true);
      fetch(`/api/posts/scrape-image?url=${encodeURIComponent(url)}`)
        .then(r => r.json())
        .then(d => {
          if (d.imageUrl) {
            setImageUrl(d.imageUrl); setImageInput(d.imageUrl); setImageSource('scraped');
          } else {
            onFail();
          }
        })
        .catch(() => onFail())
        .finally(() => setImageLoading(false));
    };

    // Try: job applyUrl → company website → leave empty (user can generate manually)
    if (job.applyUrl) {
      tryUrl(job.applyUrl, () =>
        company.website ? tryUrl(company.website, () => {}) : undefined
      );
    } else if (company.website) {
      tryUrl(company.website, () => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJobId, jobs.length, !!company]);

  async function handleGenerate() {
    if (!selectedJobId) return;
    setPhase('generating');
    setError('');
    try {
      const res = await fetch('/api/posts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: selectedJobId, platform, tone, highlights }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Generation failed');
        setPhase('configure');
        return;
      }
      setVariants(data.variants ?? []);
      setSelectedVariant(0);
      setApplyUrl(data.job?.applyUrl ?? '');
      setPublishResult(null);
      setPhase('results');
    } catch {
      setError('Something went wrong. Please try again.');
      setPhase('configure');
    }
  }

  // ── Configure / Generating phase ──────────────────────────────────────────
  if (phase === 'configure' || phase === 'generating') {
    const isGenerating = phase === 'generating';
    return (
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Job selector */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-indigo-600" /> Select Job Opening
            </CardTitle>
            <CardDescription>Choose the role you want to create a social post for.</CardDescription>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
            ) : jobs.length === 0 ? (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                No open jobs found. Sync your ATS first.
              </p>
            ) : (
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select a job..." />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {jobs.map(job => (
                    <SelectItem key={job.id} value={job.id}>
                      <div className="flex flex-col py-0.5">
                        <span className="font-medium">{job.title}</span>
                        {job.location && (
                          <span className="text-xs text-muted-foreground">{job.location}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedJob && (
              <div className="mt-3 flex items-center gap-2 text-sm bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                <Briefcase className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <span className="font-medium text-indigo-800">{selectedJob.title}</span>
                {selectedJob.location && (
                  <span className="text-muted-foreground flex items-center gap-1 text-xs">
                    <MapPin className="h-3 w-3" /> {selectedJob.location}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Platform */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Platform</CardTitle>
            <CardDescription>Where will this post be published?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {PLATFORMS.map(p => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    disabled={!p.available}
                    onClick={() => p.available && setPlatform(p.id)}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all text-sm font-semibold',
                      !p.available && 'opacity-40 cursor-not-allowed',
                      platform === p.id && p.available
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {p.label}
                    {!p.available && (
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-normal">
                        Coming soon
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tone */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tone</CardTitle>
            <CardDescription>Set the voice and energy of the post.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {TONES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={cn(
                    'flex-1 py-3 px-3 rounded-xl border-2 transition-all text-left',
                    tone === t.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <p className={cn(
                    'text-sm font-semibold',
                    tone === t.id ? 'text-indigo-700' : 'text-slate-700'
                  )}>
                    {t.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Highlights */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Key Highlights{' '}
              <span className="text-muted-foreground font-normal text-sm">(optional)</span>
            </CardTitle>
            <CardDescription>
              Anything specific to emphasize — perks, tech stack, culture, salary, etc.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="e.g. Remote-friendly, competitive salary, React + Node stack, fast-growing team..."
              value={highlights}
              onChange={e => setHighlights(e.target.value)}
              rows={3}
              className="resize-none"
              disabled={isGenerating}
            />
          </CardContent>
        </Card>

        {/* Image */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-indigo-600" /> Post Image
                <span className="text-muted-foreground font-normal text-sm">(optional)</span>
                {imageSource === 'generated' && (
                  <span className="text-[10px] font-semibold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">AI generated</span>
                )}
                {imageSource === 'scraped' && (
                  <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">From site</span>
                )}
              </CardTitle>
              {selectedJobId && company && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  disabled={imageLoading}
                  onClick={() => {
                    const job = jobs.find(j => j.id === selectedJobId);
                    if (!job || !company) return;
                    setImageUrl('');
                    setImageLoading(true);
                    fetch('/api/posts/generate-image', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ jobTitle: job.title, companyName: company.name }),
                    })
                      .then(r => r.json())
                      .then(d => {
                        if (d.imageUrl) { setImageUrl(d.imageUrl); setImageInput(d.imageUrl); setImageSource('generated'); }
                      })
                      .finally(() => setImageLoading(false));
                  }}
                >
                  {imageLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  {imageSource === 'generated' ? 'Regenerate' : 'Generate with AI'}
                </Button>
              )}
            </div>
            <CardDescription>Auto-scraped from your company site. Paste a URL or generate one with AI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {imageLoading ? (
              <div className="h-36 bg-slate-100 rounded-lg animate-pulse flex items-center justify-center gap-2 text-slate-400 text-sm">
                <Sparkles className="h-4 w-4 animate-pulse" /> Generating image...
              </div>
            ) : imageUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Post image"
                  className="w-full h-40 object-cover"
                  onError={e => {
                    // Retry once after 3s if image not yet ready
                    const img = e.currentTarget;
                    if (!img.dataset.retried) {
                      img.dataset.retried = '1';
                      setTimeout(() => { img.src = imageUrl + '&t=' + Date.now(); }, 3000);
                    }
                  }}
                />
                <button
                  onClick={() => { setImageUrl(''); setImageInput(''); setImageSource(null); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}

            <div className="flex gap-2">
              <Input
                placeholder="Paste image URL or leave blank for no image"
                value={imageInput}
                onChange={e => setImageInput(e.target.value)}
                className="h-9 text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5"
                disabled={!imageInput.trim()}
                onClick={() => { setImageUrl(imageInput.trim()); setImageSource('manual'); }}
              >
                <Upload className="h-3.5 w-3.5" /> Use
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <Button
          size="lg"
          className="w-full h-14 text-base bg-indigo-600 hover:bg-indigo-700 gap-3"
          disabled={!selectedJobId || isGenerating}
          onClick={handleGenerate}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin" />
              Generating posts...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Generate Posts
            </>
          )}
        </Button>
      </div>
    );
  }

  // ── Results phase ──────────────────────────────────────────────────────────
  const current = variants[selectedVariant];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Results header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPhase('configure')}
          className="gap-1 text-muted-foreground -ml-2"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          <span className="font-semibold text-sm">
            Generated for{' '}
            <span className="text-indigo-700">{selectedJob?.title}</span>
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          className="ml-auto gap-2"
        >
          <RefreshCw className="h-4 w-4" /> Regenerate
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* Left: variant cards */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Choose a variant
          </p>
          {variants.map((variant, idx) => (
            <Card
              key={variant.id}
              className={cn(
                'cursor-pointer transition-all border-2',
                selectedVariant === idx
                  ? 'border-indigo-500 shadow-md'
                  : 'border-slate-100 hover:border-slate-200 shadow-sm'
              )}
              onClick={() => setSelectedVariant(idx)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                    selectedVariant === idx ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'
                  )}>
                    {selectedVariant === idx && (
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs font-bold text-amber-600">
                      {Math.round(variant.score * 100)}% match
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed line-clamp-4">
                  {variant.caption}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {variant.hashtags.slice(0, 4).map(tag => (
                    <span key={tag} className="text-[10px] font-semibold text-indigo-600">
                      #{tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right: preview + edit + actions */}
        <div className="space-y-5 lg:sticky lg:top-24">
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="edit">Edit</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="mt-4 animate-in fade-in duration-300">
              <PlatformPreviews
                post={{ ...current, image: imageUrl || undefined }}
                companyName={company?.name}
                companyLogoUrl={company?.logoUrl ?? undefined}
              />
            </TabsContent>
            <TabsContent value="edit" className="mt-4 animate-in fade-in duration-300">
              <PostEditor
                variant={current}
                onChange={updated => {
                  const next = [...variants];
                  next[selectedVariant] = { ...next[selectedVariant], ...updated };
                  setVariants(next);
                }}
                imageUrl={imageUrl}
                onImageChange={url => { setImageUrl(url); setImageInput(url); setImageSource('manual'); }}
                jobTitle={selectedJob?.title}
                companyName={company?.name}
              />
            </TabsContent>
          </Tabs>

          {saveSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> {saveSuccess}
            </div>
          )}

          {publishResult && (
            <div className={`flex items-start gap-2 text-sm rounded-lg px-3 py-2 border ${
              publishResult.type === 'success'
                ? 'text-green-700 bg-green-50 border-green-100'
                : 'text-red-600 bg-red-50 border-red-100'
            }`}>
              {publishResult.type === 'success'
                ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
              <span>
                {publishResult.msg}
                {publishResult.type === 'success' && (
                  <a
                    href="https://www.linkedin.com/feed/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 underline font-semibold inline-flex items-center gap-0.5"
                  >
                    View on LinkedIn <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 h-11 gap-2"
              disabled={saving || publishing}
              onClick={async () => {
                if (!selectedJobId || !current) return;
                setSaving(true);
                setSaveSuccess('');
                const res = await fetch('/api/posts', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    jobId: selectedJobId,
                    platform,
                    caption: current.caption,
                    hashtags: current.hashtags,
                    imageUrl: imageUrl || undefined,
                  }),
                });
                setSaving(false);
                if (res.ok) {
                  setSaveSuccess('Draft saved! Redirecting...');
                  setTimeout(() => router.push('/dashboard/posts'), 1500);
                }
              }}
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save as Draft
            </Button>
            <Button
              className="flex-1 h-11 bg-[#0A66C2] hover:bg-[#004182] gap-2"
              disabled={publishing || saving}
              onClick={async () => {
                if (!selectedJobId || !current) return;
                setPublishing(true);
                setPublishResult(null);
                try {
                  const res = await fetch('/api/posts/publish', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      jobId: selectedJobId,
                      platform,
                      caption: current.caption,
                      hashtags: current.hashtags,
                      imageUrl: imageUrl || undefined,
                    }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    setPublishResult({ type: 'success', msg: 'Post published to LinkedIn!' });
                  } else {
                    setPublishResult({ type: 'error', msg: data.error ?? 'Publish failed.' });
                  }
                } catch {
                  setPublishResult({ type: 'error', msg: 'Network error — please try again.' });
                }
                setPublishing(false);
              }}
            >
              {publishing
                ? <RefreshCw className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />}
              {publishing ? 'Publishing...' : 'Publish to LinkedIn'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PostGenerator() {
  return (
    <Suspense fallback={<div className="h-48 bg-slate-50 rounded-xl animate-pulse" />}>
      <PostGeneratorInner />
    </Suspense>
  );
}
