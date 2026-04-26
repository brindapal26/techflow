'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Linkedin, 
  Facebook, 
  Twitter, 
  ThumbsUp, 
  MessageCircle, 
    Share2,
    Globe,
    MoreHorizontal,
    Heart,
    BarChart3
  } from 'lucide-react';

import { cn } from '@/lib/utils';

interface PlatformPreviewsProps {
  post: any;
  companyName?: string;
  companyLogoUrl?: string;
}

export function PlatformPreviews({ post, companyName = 'Your Company', companyLogoUrl }: PlatformPreviewsProps) {
  const initials = companyName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <Tabs defaultValue="linkedin" className="w-full">
      <TabsList className="w-full justify-start bg-transparent h-auto p-0 gap-6 border-b rounded-none mb-6">
        {['linkedin', 'facebook', 'twitter'].map((platform) => (
          <TabsTrigger
            key={platform}
            value={platform}
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 py-2 text-xs font-bold uppercase tracking-widest gap-2 transition-all"
          >
            {platform === 'linkedin' && <Linkedin className="h-4 w-4" />}
            {platform === 'facebook' && <Facebook className="h-4 w-4" />}
            {platform === 'twitter' && <Twitter className="h-4 w-4" />}
            {platform}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="linkedin" className="animate-in fade-in duration-300">
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm max-w-md mx-auto">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 rounded-sm">
                {companyLogoUrl && <AvatarImage src={companyLogoUrl} />}
                <AvatarFallback className="bg-primary/10 text-primary font-bold rounded-sm">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{companyName}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  Just now • <Globe className="h-3 w-3" />
                </p>
              </div>
            </div>
            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="px-4 pb-3">
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{post.caption}</p>
          </div>
          {post.image && (
            <div className="aspect-square bg-slate-100 border-y overflow-hidden">
              <img src={post.image} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-3 flex items-center justify-between border-b mx-3">
            <div className="flex items-center -space-x-1">
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center border border-white z-20">
                <ThumbsUp className="h-2 w-2 text-white" />
              </div>
              <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center border border-white z-10">
                <Heart className="h-2 w-2 text-white fill-current" />
              </div>
            </div>
          </div>
          <div className="p-1 flex">
            {['Like', 'Comment', 'Share', 'Send'].map((action) => (
              <button key={action} className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold text-muted-foreground hover:bg-slate-50 transition-colors rounded-lg">
                {action === 'Like' && <ThumbsUp className="h-4 w-4" />}
                {action === 'Comment' && <MessageCircle className="h-4 w-4" />}
                {action === 'Share' && <Share2 className="h-4 w-4" />}
                {action}
              </button>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="facebook" className="animate-in fade-in duration-300">
        <div className="bg-white border rounded-lg overflow-hidden shadow-sm max-w-md mx-auto">
          <div className="p-3 flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {companyLogoUrl && <AvatarImage src={companyLogoUrl} />}
              <AvatarFallback className="bg-blue-600 text-white font-bold">{initials[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-[13px] text-[#050505]">{companyName}</p>
              <p className="text-[11px] text-[#65676b] flex items-center gap-1">
                Just now • <Globe className="h-3 w-3" />
              </p>
            </div>
          </div>
          <div className="px-3 pb-3 text-[14px] leading-tight text-[#050505]">
            <p className="whitespace-pre-wrap break-words">{post.caption}</p>
          </div>
          {post.image && (
            <div className="bg-slate-100 border-y">
              <img src={post.image} className="w-full h-auto object-cover" />
            </div>
          )}
          <div className="p-3 flex items-center justify-between text-[#65676b] border-t mx-3 my-1">
             <div className="flex-1 flex items-center justify-center gap-2 py-1.5 hover:bg-slate-100 rounded-md cursor-pointer transition-colors">
               <ThumbsUp className="h-4 w-4" /> <span className="text-sm font-semibold">Like</span>
             </div>
             <div className="flex-1 flex items-center justify-center gap-2 py-1.5 hover:bg-slate-100 rounded-md cursor-pointer transition-colors">
               <MessageCircle className="h-4 w-4" /> <span className="text-sm font-semibold">Comment</span>
             </div>
             <div className="flex-1 flex items-center justify-center gap-2 py-1.5 hover:bg-slate-100 rounded-md cursor-pointer transition-colors">
               <Share2 className="h-4 w-4" /> <span className="text-sm font-semibold">Share</span>
             </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="twitter" className="animate-in fade-in duration-300">
        <div className="bg-white border rounded-2xl p-4 shadow-sm max-w-md mx-auto flex gap-3 overflow-hidden">
          <Avatar className="h-12 w-12 shrink-0">
            {companyLogoUrl && <AvatarImage src={companyLogoUrl} />}
            <AvatarFallback className="bg-black text-white font-bold">{initials[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 min-w-0 flex-wrap">
                <span className="font-bold text-sm truncate">{companyName}</span>
                <span className="text-muted-foreground text-xs shrink-0">@{companyName.replace(/\s+/g, '')} · Just now</span>
              </div>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
            <p className="text-sm leading-normal whitespace-pre-wrap break-words">{post.caption}</p>
            {post.image && (
              <div className="rounded-2xl border overflow-hidden mt-3">
                <img src={post.image} className="w-full h-auto" />
              </div>
            )}
            <div className="flex items-center justify-between pt-2 text-muted-foreground">
              <button className="flex items-center gap-2 hover:text-blue-400 group transition-colors">
                <MessageCircle className="h-4 w-4 group-hover:bg-blue-400/10 rounded-full" />
              </button>
              <button className="flex items-center gap-2 hover:text-green-400 group transition-colors">
                <Share2 className="h-4 w-4 group-hover:bg-green-400/10 rounded-full" />
              </button>
              <button className="flex items-center gap-2 hover:text-red-400 group transition-colors">
                <Heart className="h-4 w-4 group-hover:bg-red-400/10 rounded-full" />
              </button>
              <button className="flex items-center gap-2 hover:text-blue-400 group transition-colors">
                <BarChart3 className="h-4 w-4 group-hover:bg-blue-400/10 rounded-full" />
              </button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
