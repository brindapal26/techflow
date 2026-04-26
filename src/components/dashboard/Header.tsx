'use client';

import { Bell, Search, Plus, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export function Header() {
  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search jobs, posts, or analytics..." 
            className="pl-10 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2">
          <HelpCircle className="h-4 w-4" />
          Support
        </Button>
        
        <div className="relative">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Bell className="h-5 w-5" />
          </Button>
          <Badge className="absolute top-1.5 right-1.5 w-2 h-2 p-0 bg-red-500 border-2 border-white" />
        </div>

        <div className="h-8 w-px bg-slate-200 mx-2" />

        <Button size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New
        </Button>
      </div>
    </header>
  );
}
