'use client';

import { PostGenerator } from '@/components/posts/PostGenerator';

export default function CreatePostPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">AI Post Generator</h1>
        <p className="text-muted-foreground text-lg">Select a job opening to generate high-engagement social posts instantly.</p>
      </div>

      <PostGenerator />
    </div>
  );
}
