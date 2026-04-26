'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  PenTool,
  Calendar,
  Share2,
  Map as MapIcon,
  BarChart3,
  Settings,
  Users,
  Megaphone,
  Link as LinkIcon,
  LogOut,
  ChevronRight,
  Briefcase,
  UserCircle,
  Database,
  Building2,
} from 'lucide-react';

const ALL_MENU_ITEMS = [
  { icon: LayoutDashboard, label: 'Overview', href: '/dashboard', roles: ['company_admin', 'recruiter'] },
  { icon: Briefcase, label: 'Jobs', href: '/dashboard/jobs', roles: ['company_admin', 'recruiter'] },
  { icon: PenTool, label: 'AI Post Generator', href: '/dashboard/posts/create', roles: ['company_admin', 'recruiter'] },
  { icon: Calendar, label: 'Content Calendar', href: '/dashboard/posts', roles: ['company_admin', 'recruiter'] },
  { icon: Megaphone, label: 'Campaigns', href: '/dashboard/campaigns', roles: ['company_admin'] },
  { icon: MapIcon, label: 'Job Maps', href: '/dashboard/job-maps', roles: ['company_admin'] },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics', roles: ['company_admin', 'recruiter'] },
  { icon: Building2, label: 'Departments', href: '/dashboard/departments', roles: ['company_admin'] },
  { icon: LinkIcon, label: 'ATS Connection', href: '/dashboard/ats-connection', roles: ['company_admin'] },
  { icon: Database, label: 'ATS Browser', href: '/dashboard/ats-browser', roles: ['company_admin'] },
  { icon: Share2, label: 'Social Profiles', href: '/dashboard/social-profiles', roles: ['company_admin', 'recruiter'] },
];

const SECONDARY_ITEMS = [
  { icon: Users, label: 'Team', href: '/dashboard/settings/team', roles: ['company_admin'] },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings/workspace', roles: ['company_admin'] },
  { icon: UserCircle, label: 'My Profile', href: '/dashboard/settings/profile', roles: ['company_admin', 'recruiter'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<{ name: string | null }>({ name: null });

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => setProfile({ name: data.name }));
  }, []);

  const role = (session?.user as any)?.role ?? 'recruiter';
  const userName = profile.name ?? session?.user?.name ?? '';
  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const menuItems = ALL_MENU_ITEMS.filter((item) => item.roles.includes(role));
  const secondaryItems = SECONDARY_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <div className="w-64 border-r bg-white h-screen flex flex-col sticky top-0">
      <div className="p-6 border-b flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <PenTool className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold tracking-tight">TalentFlow</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        <div>
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Platform
          </p>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-slate-50 hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {secondaryItems.length > 0 && (
          <div>
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Management
            </p>
            <nav className="space-y-1">
              {secondaryItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-slate-50 hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>

      <div className="p-4 border-t space-y-4">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50 border border-slate-100 group cursor-pointer hover:border-slate-200 transition-colors">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xs">
            {initials || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate capitalize">
              {role === 'company_admin' ? 'Admin' : 'Recruiter'}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
