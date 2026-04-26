'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Lock, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

export default function ProfilePage() {
  const { data: session, update } = useSession();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        setName(data.name ?? '');
        setEmail(data.email ?? '');
        setRole(data.role ?? '');
      });
  }, []);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    setProfileSaving(false);
    if (res.ok) {
      await update({ name }); // refresh NextAuth session
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } else {
      const d = await res.json();
      setProfileMsg({ type: 'error', text: d.error || 'Failed to update profile.' });
    }
    setTimeout(() => setProfileMsg(null), 4000);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordMsg(null);

    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    setPasswordSaving(false);
    const d = await res.json();

    if (res.ok) {
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
    } else {
      setPasswordMsg({ type: 'error', text: d.error || 'Failed to change password.' });
    }
    setTimeout(() => setPasswordMsg(null), 4000);
  }

  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and password.</p>
      </div>

      {/* Avatar + Role */}
      <div className="flex items-center gap-5 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xl">
          {initials}
        </div>
        <div>
          <p className="text-lg font-bold text-slate-900">{name || '—'}</p>
          <p className="text-sm text-slate-500">{email}</p>
          <Badge
            variant="outline"
            className={`mt-1.5 text-xs ${role === 'company_admin' ? 'border-indigo-200 text-indigo-700 bg-indigo-50' : 'border-slate-200'}`}
          >
            <Shield className="h-3 w-3 mr-1" />
            {role === 'company_admin' ? 'Admin' : 'Recruiter'}
          </Badge>
        </div>
      </div>

      {/* Profile Info */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-600" /> Personal Information
          </CardTitle>
          <CardDescription>Update your display name.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                className="h-11 max-w-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center gap-2 h-11 px-3 rounded-md border bg-slate-50 text-sm text-slate-500 max-w-sm">
                <Mail className="h-4 w-4 text-slate-400" />
                {email}
              </div>
              <p className="text-xs text-muted-foreground">Email cannot be changed. Contact support if needed.</p>
            </div>

            {profileMsg && (
              <div className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 ${profileMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                {profileMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {profileMsg.text}
              </div>
            )}

            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={profileSaving}>
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-indigo-600" /> Change Password
          </CardTitle>
          <CardDescription>Use a strong password of at least 8 characters.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="••••••••"
                className="h-11"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Min. 8 characters"
                className="h-11"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>

            {passwordMsg && (
              <div className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 ${passwordMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                {passwordMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {passwordMsg.text}
              </div>
            )}

            <Button type="submit" variant="outline" disabled={passwordSaving}>
              {passwordSaving ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
