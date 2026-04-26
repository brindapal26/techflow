'use client';

import { useState } from 'react';
import Link from 'next/link';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Filter, 
  Plus, 
  Calendar as CalendarIcon, 
  Layers, 
  TrendingUp, 
  Share2,
  MoreVertical,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const MOCK_EVENTS = [
  {
    id: '1',
    title: 'Senior Frontend Engineer - LinkedIn',
    start: new Date().toISOString().split('T')[0] + 'T10:00:00',
    backgroundColor: '#0A66C2',
    borderColor: '#0A66C2',
    extendedProps: { platform: 'linkedin', status: 'scheduled' }
  },
  {
    id: '2',
    title: 'Product Designer - Twitter',
    start: new Date().toISOString().split('T')[0] + 'T14:30:00',
    backgroundColor: '#1DA1F2',
    borderColor: '#1DA1F2',
    extendedProps: { platform: 'twitter', status: 'scheduled' }
  },
  {
    id: '3',
    title: 'Marketing Manager - Facebook',
    start: new Date(Date.now() + 86400000).toISOString().split('T')[0] + 'T09:00:00',
    backgroundColor: '#1877F2',
    borderColor: '#1877F2',
    extendedProps: { platform: 'facebook', status: 'draft' }
  }
];

export default function PostsCalendarPage() {
  const [events, setEvents] = useState(MOCK_EVENTS);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Calendar</h1>
          <p className="text-muted-foreground">Manage and schedule your recruitment content across all social channels.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button asChild className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Link href="/dashboard/posts/create">
              <Plus className="h-4 w-4" />
              Create Post
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3">
          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-6 calendar-container">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek'
                }}
                events={events}
                height="auto"
                editable={true}
                selectable={true}
                eventContent={(eventInfo) => (
                  <div className="flex items-center gap-1.5 p-1 overflow-hidden">
                    <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                    <span className="text-[10px] font-bold truncate">{eventInfo.event.title}</span>
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4">Content Tank</h3>
              <p className="text-xs text-muted-foreground mb-6">
                Posts ready to be scheduled. Drag them to the calendar.
              </p>
              
              <div className="space-y-4">
                {[
                  { title: 'Culture Spotlight', platform: 'Instagram', time: '5m read' },
                  { title: 'Benefits Package', platform: 'LinkedIn', time: '2m read' },
                  { title: 'Office Tour Video', platform: 'Facebook', time: '1m video' },
                ].map((post, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-primary transition-colors cursor-grab group">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="bg-white text-[10px] uppercase">{post.platform}</Badge>
                      <MoreVertical className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                    </div>
                    <p className="text-sm font-semibold">{post.title}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {post.time}
                    </div>
                  </div>
                ))}
              </div>
              
              <Button variant="ghost" className="w-full mt-4 text-primary text-xs font-bold uppercase tracking-wider">
                View Content Tank
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            <MiniStatCard 
              title="Posts This Week" 
              value="24" 
              icon={<CalendarIcon className="h-4 w-4 text-blue-600" />} 
            />
            <MiniStatCard 
              title="Avg. Engagement" 
              value="8.4%" 
              icon={<TrendingUp className="h-4 w-4 text-green-600" />} 
            />
          </div>
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
