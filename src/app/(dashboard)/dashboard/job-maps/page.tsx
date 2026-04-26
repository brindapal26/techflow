'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Map as MapIcon, 
  Search, 
  Crosshair, 
  Copy, 
  ExternalLink,
  Code,
  MapPin,
  Briefcase,
  Layers
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MapBuilder = dynamic(() => import('@/components/job-maps/MapBuilder'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-slate-100 rounded-xl animate-pulse flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <MapIcon className="h-12 w-12 text-slate-300" />
        <p className="text-slate-400 font-medium">Initializing Map Engine...</p>
      </div>
    </div>
  )
});

const MOCK_JOBS = [
  { id: 1, title: 'Senior Frontend Engineer', location: 'San Francisco, CA', latitude: 37.7749, longitude: -122.4194, type: 'Full-Time' },
  { id: 2, title: 'Product Designer', location: 'New York, NY', latitude: 40.7128, longitude: -74.0060, type: 'Remote' },
  { id: 3, title: 'Marketing Manager', location: 'Austin, TX', latitude: 30.2672, longitude: -97.7431, type: 'Full-Time' },
  { id: 4, title: 'DevOps Specialist', location: 'Seattle, WA', latitude: 47.6062, longitude: -122.3321, type: 'Contract' },
  { id: 5, title: 'Sales Executive', location: 'Chicago, IL', latitude: 41.8781, longitude: -87.6298, type: 'Full-Time' },
];

export default function JobMapsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Job Maps</h1>
          <p className="text-muted-foreground">Interactive geographic visualizations for your career site.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            View Live
          </Button>
          <Button className="gap-2">
            <Code className="h-4 w-4" />
            Embed Code
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Map Customization</CardTitle>
              <CardDescription>Configure how your map looks and feels.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Map Theme</label>
                <Select defaultValue="light">
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Modern Light</SelectItem>
                    <SelectItem value="dark">Pro Dark</SelectItem>
                    <SelectItem value="satellite">Satellite View</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Marker Style</label>
                <div className="grid grid-cols-3 gap-2">
                  <button className="h-10 rounded-lg border-2 border-primary bg-primary/5 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </button>
                  <button className="h-10 rounded-lg border-2 border-slate-100 hover:border-slate-200 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                  </button>
                  <button className="h-10 rounded-lg border-2 border-slate-100 hover:border-slate-200 flex items-center justify-center">
                    <img src="/logo.png" className="w-5 h-5 opacity-40" alt="Logo" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Embed Settings</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Show Search Bar</span>
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-primary focus:ring-primary" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Enable Clustering</span>
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-primary focus:ring-primary" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Show Radius Filter</span>
                    <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white shadow-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4 text-indigo-400">
                <Layers className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-widest">Global Reach</span>
              </div>
              <h4 className="text-2xl font-bold mb-2">1,240</h4>
              <p className="text-slate-400 text-sm">Total job map impressions this month across 45 career sites.</p>
            </CardContent>
          </Card>
        </div>

        {/* Map Builder Area */}
        <div className="xl:col-span-3 space-y-6">
           <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
             <div className="relative flex-1 w-full sm:max-w-md">
               <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input placeholder="Search job locations..." className="pl-10 h-10 border-slate-100 focus-visible:ring-primary" />
             </div>
             <div className="flex items-center gap-3 w-full sm:w-auto">
               <Select defaultValue="all">
                 <SelectTrigger className="w-full sm:w-40 h-10">
                   <SelectValue placeholder="Job Type" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Types</SelectItem>
                   <SelectItem value="full-time">Full-Time</SelectItem>
                   <SelectItem value="remote">Remote</SelectItem>
                   <SelectItem value="contract">Contract</SelectItem>
                 </SelectContent>
               </Select>
               <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
                 <Crosshair className="h-4 w-4" />
               </Button>
             </div>
           </div>

           <MapBuilder jobs={MOCK_JOBS} />

           <Card className="shadow-sm border-slate-200 overflow-hidden">
             <CardHeader className="bg-slate-50 border-b">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <Code className="h-4 w-4 text-primary" />
                   <CardTitle className="text-sm font-bold uppercase tracking-widest">Map Embed Code</CardTitle>
                 </div>
                 <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-primary">
                   <Copy className="h-3.5 w-3.5 mr-1.5" />
                   Copy Code
                 </Button>
               </div>
             </CardHeader>
             <CardContent className="p-0">
               <pre className="p-6 text-[13px] text-slate-600 overflow-x-auto font-mono bg-white">
{`<iframe
  src="https://app.hiresocial.com/embed/map/map_83hd2kL0s"
  width="100%"
  height="600"
  frameborder="0"
  style="border-radius: 12px; border: 1px solid #e2e8f0;"
></iframe>`}
               </pre>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
