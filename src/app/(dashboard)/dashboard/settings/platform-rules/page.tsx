'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Linkedin, Twitter, Facebook, CheckCircle2, Loader2, Globe, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: '#0A66C2', available: true },
  { id: 'twitter', label: 'Twitter / X', icon: Twitter, color: '#1DA1F2', available: false },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: '#1877F2', available: false },
];

interface Rule {
  id: string;
  departmentId: string | null;
  role: string | null;
  allowedPlatforms: string[];
}

interface Department {
  id: string;
  name: string;
}

interface Scope {
  departmentId: string | null;
  deptName: string;
  rule: Rule | null;
}

export default function PlatformRulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/platform-rules');
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules ?? []);
        setDepartments(data.departments ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  // Build scopes: company-wide first, then each department
  const scopes: Scope[] = [
    {
      departmentId: null,
      deptName: 'Company-wide (default)',
      rule: rules.find(r => r.departmentId === null && r.role === null) ?? null,
    },
    ...departments.map(d => ({
      departmentId: d.id,
      deptName: d.name,
      rule: rules.find(r => r.departmentId === d.id && r.role === null) ?? null,
    })),
  ];

  async function togglePlatform(scope: Scope, platformId: string) {
    const current = scope.rule?.allowedPlatforms ?? [];
    const next = current.includes(platformId)
      ? current.filter(p => p !== platformId)
      : [...current, platformId];

    const key = scope.departmentId ?? 'company';
    setSaving(key);
    try {
      const res = await fetch('/api/platform-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId: scope.departmentId,
          role: null,
          allowedPlatforms: next,
        }),
      });
      if (res.ok) {
        const updated: Rule = await res.json();
        setRules(prev => {
          const without = prev.filter(r => r.id !== updated.id && !(r.departmentId === scope.departmentId && r.role === null));
          return [...without, updated];
        });
      }
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Rules</h1>
        <p className="text-muted-foreground mt-1">
          Control which social platforms recruiters can post to, per department.
        </p>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-indigo-600" />
            Allowed Platforms
          </CardTitle>
          <CardDescription>
            Toggle platforms on or off for the whole company or specific departments.
            Department settings override the company-wide default.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading rules...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 pr-6 font-semibold text-muted-foreground text-xs uppercase tracking-wider w-48">
                      Scope
                    </th>
                    {PLATFORMS.map(p => {
                      const Icon = p.icon;
                      return (
                        <th key={p.id} className="text-center py-3 px-6 font-semibold text-xs uppercase tracking-wider">
                          <div className="flex flex-col items-center gap-1">
                            <Icon className="h-4 w-4" style={{ color: p.available ? p.color : '#94a3b8' }} />
                            <span className={p.available ? 'text-foreground' : 'text-slate-400'}>{p.label}</span>
                            {!p.available && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 text-slate-400 border-slate-200">
                                Coming soon
                              </Badge>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {scopes.map((scope, idx) => {
                    const key = scope.departmentId ?? 'company';
                    const isSaving = saving === key;
                    const allowed = scope.rule?.allowedPlatforms ?? [];
                    const isCompanyWide = scope.departmentId === null;

                    return (
                      <tr key={key} className={cn('transition-colors', isCompanyWide && 'bg-slate-50/50')}>
                        <td className="py-4 pr-6">
                          <div className="flex items-center gap-2">
                            {isCompanyWide
                              ? <Globe className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                              : <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            }
                            <span className={cn('font-medium', isCompanyWide ? 'text-indigo-700 text-sm' : 'text-slate-700 text-sm')}>
                              {scope.deptName}
                            </span>
                          </div>
                          {idx === 0 && (
                            <p className="text-[10px] text-muted-foreground ml-5 mt-0.5">
                              Applies to all departments unless overridden
                            </p>
                          )}
                        </td>

                        {PLATFORMS.map(p => {
                          const isOn = allowed.includes(p.id);
                          return (
                            <td key={p.id} className="py-4 px-6 text-center">
                              <button
                                disabled={!p.available || isSaving}
                                onClick={() => p.available && togglePlatform(scope, p.id)}
                                className={cn(
                                  'w-8 h-8 rounded-full border-2 flex items-center justify-center mx-auto transition-all',
                                  !p.available && 'opacity-30 cursor-not-allowed',
                                  p.available && isOn && 'border-transparent',
                                  p.available && !isOn && 'border-slate-200 bg-white hover:border-slate-300',
                                  isSaving && 'opacity-50 cursor-wait'
                                )}
                                style={p.available && isOn ? { backgroundColor: p.color } : {}}
                              >
                                {isSaving
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                                  : isOn && p.available
                                    ? <CheckCircle2 className="h-4 w-4 text-white" />
                                    : <span className="w-2 h-2 rounded-full bg-slate-200 block" />
                                }
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {scopes.length <= 1 && (
                <p className="text-xs text-muted-foreground mt-6 text-center">
                  Add departments to set per-department platform rules.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-100 bg-slate-50">
        <CardContent className="p-5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">How rules work:</span>{' '}
            The company-wide default applies to all recruiters. If a department has its own rule,
            it overrides the default for recruiters in that department.
            Twitter and Facebook will be configurable when those integrations are available.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
