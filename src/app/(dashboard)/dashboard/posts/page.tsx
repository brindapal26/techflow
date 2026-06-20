'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventDropArg, EventInput } from '@fullcalendar/core';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Calendar as CalendarIcon,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: '#0A66C2',
  twitter: '#1DA1F2',
  facebook: '#1877F2',
};

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Scheduled' },
  { id: 'posted', label: 'Posted' },
  { id: 'failed', label: 'Failed' },
];

interface Schedule {
  id: string;
  scheduledAt: string;
  status: string;
  platform: string;
  postId: string;
  jobTitle: string;
  postVersionId: string;
}

export default function PostsCalendarPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [rescheduling, setRescheduling] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/posts/schedules');
      if (res.ok) {
        const data = await res.json();
        setSchedules(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const filtered = statusFilter === 'all'
    ? schedules
    : schedules.filter(s => s.status === statusFilter);

  const events: EventInput[] = filtered.map(s => ({
    id: s.id,
    title: s.jobTitle,
    start: s.scheduledAt,
    backgroundColor: PLATFORM_COLORS[s.platform] ?? '#6366f1',
    borderColor: PLATFORM_COLORS[s.platform] ?? '#6366f1',
    opacity: s.status === 'failed' ? 0.5 : 1,
    extendedProps: { platform: s.platform, status: s.status },
  }));

  async function handleEventDrop(info: EventDropArg) {
    const scheduleId = info.event.id;
    const newStart = info.event.start;
    if (!newStart) { info.revert(); return; }

    setRescheduling(scheduleId);
    try {
      const res = await fetch(`/api/posts/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt: newStart.toISOString() }),
      });
      if (!res.ok) {
        info.revert();
      } else {
        setSchedules(prev =>
          prev.map(s => s.id === scheduleId ? { ...s, scheduledAt: newStart.toISOString() } : s)
        );
      }
    } catch {
      info.revert();
    } finally {
      setRescheduling(null);
    }
  }

  const pending = schedules.filter(s => s.status === 'pending').length;
  const posted = schedules.filter(s => s.status === 'posted').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Calendar</h1>
          <p className="text-muted-foreground">Manage and schedule your recruitment posts. Drag to reschedule.</p>
        </div>
        <Button asChild className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Link href="/dashboard/posts/create">
            <Plus className="h-4 w-4" />
            Create Post
          </Link>
        </Button>
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all',
              statusFilter === f.id
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            )}
          >
            {f.label}
          </button>
        ))}
        {rescheduling && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground ml-2">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving...
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3">
          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-6 calendar-container">
              {loading ? (
                <div className="h-96 flex items-center justify-center text-muted-foreground gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading calendar...
                </div>
              ) : (
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek',
                  }}
                  events={events}
                  height="auto"
                  editable={true}
                  selectable={true}
                  eventDrop={handleEventDrop}
                  eventContent={(eventInfo) => (
                    <div className="flex items-center gap-1.5 p-1 overflow-hidden">
                      <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                      <span className="text-[10px] font-bold truncate">{eventInfo.event.title}</span>
                    </div>
                  )}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <MiniStatCard
              title="Scheduled"
              value={String(pending)}
              icon={<Clock className="h-4 w-4 text-indigo-600" />}
            />
            <MiniStatCard
              title="Posted"
              value={String(posted)}
              icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
            />
            <MiniStatCard
              title="Total"
              value={String(schedules.length)}
              icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
            />
          </div>

          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-5">
              <h3 className="font-bold text-sm mb-3">Upcoming</h3>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filtered.filter(s => s.status === 'pending').length === 0 ? (
                <p className="text-xs text-muted-foreground">No scheduled posts.</p>
              ) : (
                <div className="space-y-3">
                  {filtered
                    .filter(s => s.status === 'pending')
                    .slice(0, 5)
                    .map(s => (
                      <div key={s.id} className="flex flex-col gap-1 p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold truncate">{s.jobTitle}</p>
                          <Badge
                            variant="outline"
                            className="text-[9px] uppercase shrink-0"
                            style={{ borderColor: PLATFORM_COLORS[s.platform], color: PLATFORM_COLORS[s.platform] }}
                          >
                            {s.platform}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <CalendarIcon className="h-3 w-3" />
                          {new Date(s.scheduledAt).toLocaleString(undefined, {
                            month: 'short', day: 'numeric',
                            hour: 'numeric', minute: '2-digit',
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {filtered.some(s => s.status === 'failed') && (
            <Card className="shadow-sm border-red-100 bg-red-50">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <h3 className="font-bold text-sm text-red-700">Failed Posts</h3>
                </div>
                <div className="space-y-2">
                  {filtered.filter(s => s.status === 'failed').map(s => (
                    <div key={s.id} className="text-xs text-red-600 font-medium truncate">
                      {s.jobTitle}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <style jsx global>{`
        .fc {
          --fc-border-color: #f1f5f9;
          --fc-button-bg-color: #ffffff;
          --fc-button-border-color: #e2e8f0;
          --fc-button-text-color: #0f172a;
          --fc-button-hover-bg-color: #f8fafc;
          --fc-button-active-bg-color: #f1f5f9;
          font-family: inherit;
        }
        .fc .fc-toolbar-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
        }
        .fc .fc-button {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: capitalize;
          border-radius: 0.5rem;
        }
        .fc .fc-button-primary:not(:disabled).fc-button-active,
        .fc .fc-button-primary:not(:disabled):active {
          background-color: #f1f5f9;
          border-color: #e2e8f0;
          color: #0f172a;
        }
        .fc th {
          padding: 12px 0;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.05em;
        }
        .fc-theme-standard td, .fc-theme-standard th {
          border-color: #f1f5f9;
        }
        .fc .fc-daygrid-day-number {
          padding: 8px;
          font-size: 0.875rem;
          color: #64748b;
        }
        .fc .fc-daygrid-day.fc-day-today {
          background-color: #f8fafc;
        }
      `}</style>
    </div>
  );
}

function MiniStatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="shadow-sm border-slate-200">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-xl font-bold mt-1">{value}</p>
        </div>
        <div className="p-2 rounded-lg bg-slate-50">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
