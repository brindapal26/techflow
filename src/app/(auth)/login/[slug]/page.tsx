'use client';

import { useState, useEffect, use } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Rocket, Mail, Lock, AlertCircle, ArrowLeft, CheckCircle2, User } from 'lucide-react';
import Link from 'next/link';

type Step = 'email' | 'set-password' | 'login';

interface CompanyInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

interface LookupResult {
  status: 'existing_user' | 'employee_found' | 'not_found';
  name?: string;
  title?: string;
  department?: string;
  companyName?: string;
  employeeId?: string;
}

export default function SlugLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companyNotFound, setCompanyNotFound] = useState(false);

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/workspace/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) setCompanyNotFound(true);
        else setCompany(data);
        setCompanyLoading(false);
      });
  }, [slug]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, slug }),
    });

    const data: LookupResult = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError((data as any).error || 'Something went wrong');
      return;
    }

    setLookup(data);

    if (data.status === 'existing_user') {
      setStep('login');
    } else if (data.status === 'employee_found') {
      setStep('set-password');
    } else {
      setError('Your email was not found in this workspace. Contact your admin.');
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      setError('Incorrect password. Please try again.');
    } else {
      router.push('/dashboard');
    }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/register-employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, slug, password, employeeId: lookup?.employeeId }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Failed to create account');
      setLoading(false);
      return;
    }

    // Auto sign in
    const result = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      setError('Account created! Please sign in.');
      setStep('login');
    } else {
      router.push('/dashboard');
    }
  }

  if (companyLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (companyNotFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Workspace not found</h1>
          <p className="text-slate-500">The workspace <code className="bg-slate-100 px-2 py-0.5 rounded">{slug}</code> doesn't exist.</p>
          <Link href="/login" className="text-indigo-600 font-semibold hover:underline text-sm block">
            Back to main login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo + Company */}
        <div className="flex flex-col items-center gap-3 mb-10">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Rocket className="h-5 w-5 text-white" />
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Powered by TalentFlow</p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">{company?.name}</h2>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border p-8">

          {/* Step: Email */}
          {step === 'email' && (
            <>
              <div className="mb-8">
                <h1 className="text-xl font-bold text-slate-900">Sign in to your workspace</h1>
                <p className="text-slate-500 text-sm mt-1">Enter your work email to get started</p>
              </div>
              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Work Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      className="pl-10 h-11"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                    <AlertCircle className="h-4 w-4 shrink-0" />{error}
                  </div>
                )}
                <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                  {loading ? 'Looking up...' : 'Continue'}
                </Button>
              </form>
            </>
          )}

          {/* Step: Employee found — set password */}
          {step === 'set-password' && lookup && (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center font-bold text-indigo-700">
                    {lookup.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{lookup.name}</p>
                    {lookup.title && <p className="text-xs text-slate-500">{lookup.title}{lookup.department ? ` · ${lookup.department}` : ''}</p>}
                  </div>
                </div>
                <h1 className="text-xl font-bold text-slate-900">Welcome to {company?.name}!</h1>
                <p className="text-slate-500 text-sm mt-1">We found your profile. Create a password to activate your account.</p>
              </div>
              <form onSubmit={handleSetPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password">Create Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min. 8 characters"
                      className="pl-10 h-11"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                    {password.length >= 8 && (
                      <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                    <AlertCircle className="h-4 w-4 shrink-0" />{error}
                  </div>
                )}
                <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                  {loading ? 'Activating account...' : 'Activate Account & Sign In'}
                </Button>
                <button type="button" onClick={() => { setStep('email'); setError(''); setPassword(''); }}
                  className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mx-auto">
                  <ArrowLeft className="h-3 w-3" /> Use a different email
                </button>
              </form>
            </>
          )}

          {/* Step: Existing user — login */}
          {step === 'login' && lookup && (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700">
                    {lookup.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{lookup.name}</p>
                    <p className="text-xs text-slate-500">{email}</p>
                  </div>
                </div>
                <h1 className="text-xl font-bold text-slate-900">Welcome back!</h1>
                <p className="text-slate-500 text-sm mt-1">Enter your password to sign in.</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 h-11"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                    <AlertCircle className="h-4 w-4 shrink-0" />{error}
                  </div>
                )}
                <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
                <button type="button" onClick={() => { setStep('email'); setError(''); setPassword(''); }}
                  className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mx-auto">
                  <ArrowLeft className="h-3 w-3" /> Use a different email
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Wrong workspace?{' '}
          <Link href="/login" className="text-indigo-500 hover:underline">Find your workspace</Link>
        </p>
      </div>
    </div>
  );
}
