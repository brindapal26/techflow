'use client';

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

interface MapBuilderProps {
  jobs: any[];
}

export default function MapBuilder({ jobs }: MapBuilderProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-98.5, 39.8], // Center of US
        zoom: 3.5,
        antialias: true
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      jobs.forEach(job => {
        // Create a custom marker element
        const el = document.createElement('div');
        el.className = 'job-marker';
        el.style.width = '32px';
        el.style.height = '32px';
        el.style.backgroundColor = 'var(--primary)';
        el.style.borderRadius = '50%';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 4px 10px rgba(0,0,0,0.15)';
        el.style.cursor = 'pointer';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;

        el.addEventListener('click', () => {
          setSelectedJob(job);
          if (map.current) {
            map.current.flyTo({
              center: [job.longitude, job.latitude],
              zoom: 8,
              essential: true
            });
          }
        });

        if (map.current) {
          new mapboxgl.Marker(el)
            .setLngLat([job.longitude, job.latitude])
            .addTo(map.current);
        }
      });
    } catch (e) {
      console.error('Failed to initialize map:', e);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [jobs]);

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden border border-slate-200 shadow-inner group">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Selection Overlay */}
      {selectedJob && (
        <Card className="absolute bottom-6 left-6 w-72 shadow-2xl border-none animate-in slide-in-from-left-4 duration-300">
          <div className="relative h-24 bg-primary overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400" 
              className="w-full h-full object-cover opacity-30" 
            />
            <button 
              onClick={() => setSelectedJob(null)}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-colors"
            >
              ×
            </button>
          </div>
          <div className="p-5 space-y-3">
            <div>
              <Badge variant="secondary" className="text-[10px] mb-2">{selectedJob.type}</Badge>
              <h4 className="font-bold text-slate-900 leading-tight">{selectedJob.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{selectedJob.location}</p>
            </div>
            <div className="pt-2 flex gap-2">
              <Button size="sm" className="flex-1 text-xs h-8">View Details</Button>
              <Button size="sm" variant="outline" className="flex-1 text-xs h-8">Apply</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Map Controls Feedback */}
      <div className="absolute top-6 left-6 p-3 bg-white/90 backdrop-blur-sm rounded-lg border border-slate-200 shadow-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Map View</p>
        <p className="text-xs font-semibold text-slate-900 mt-0.5">{jobs.length} Opportunities Found</p>
      </div>
    </div>
  );
}
