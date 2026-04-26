'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Rocket, Building2, Globe, User, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Retail', 'Hospitality',
  'Manufacturing', 'Education', 'Consulting', 'Staffing', 'Other',
];

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    companyName: '',
    website: '',
    industry: '',
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [workspaceUrl, setWorkspaceUrl] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Something went wrong');
      setLoading(false);
      return;
    }

    // Store workspace URL to show to admin
    const slug = data.slug;
    setWorkspaceUrl(`${window.location.origin}/login/${slug}`);

    // Auto sign in after registration
    await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    router.push('/onboarding');
  }

  const passwordStrong = form.password.length >= 8;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Rocket className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">TalentFlow</span>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create your workspace</h1>
            <p className="text-slate-500 mt-1">Set up your company and admin account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Company section */}
            <div className="space-y-1 pb-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Company</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="companyName"
                    name="companyName"
                    placeholder="Acme Staffing Inc."
                    className="pl-10 h-11"
                    value={form.companyName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="website"
                    name="website"
                    placeholder="https://acme.com"
                    className="pl-10 h-11"
                    value={form.website}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

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
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i.toLowerCase()}>{i}</option>
                ))}
              </select>
            </div>

            {/* Admin section */}
            <div className="space-y-1 pt-2 pb-1 border-t">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-2">Your Admin Account</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="name"
                  name="name"
                  placeholder="Jane Smith"
                  className="pl-10 h-11"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="jane@acme.com"
                  className="pl-10 h-11"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  className="pl-10 h-11"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                {form.password.length > 0 && (
                  <div className={`absolute right-3 top-3 ${passwordStrong ? 'text-green-500' : 'text-slate-300'}`}>
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700"
              disabled={loading}
            >
              {loading ? 'Creating workspace...' : 'Create Workspace'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
