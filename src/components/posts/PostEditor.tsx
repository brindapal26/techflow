'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, ImageIcon, X, Upload, RefreshCw } from 'lucide-react';

interface PostEditorProps {
  variant: any;
  onChange: (updated: any) => void;
  imageUrl: string;
  onImageChange: (url: string) => void;
  jobTitle?: string;
  companyName?: string;
}

export function PostEditor({ variant, onChange, imageUrl, onImageChange, jobTitle, companyName }: PostEditorProps) {
  const [imageInput, setImageInput] = useState(imageUrl);
  const [regenerating, setRegenerating] = useState(false);

  async function handleRegenerateImage() {
    if (!jobTitle || !companyName) return;
    setRegenerating(true);
    try {
      const res = await fetch('/api/posts/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, companyName }),
      });
      const data = await res.json();
      if (data.imageUrl) { onImageChange(data.imageUrl); setImageInput(data.imageUrl); }
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <Label className="text-sm font-semibold">Caption</Label>
          <Button variant="ghost" size="sm" className="h-8 text-primary gap-1.5 text-xs">
            <Sparkles className="h-3 w-3" />
            AI Polish
          </Button>
        </div>
        <Textarea
          value={variant.caption}
          onChange={(e) => onChange({ caption: e.target.value })}
          rows={8}
          className="resize-none focus-visible:ring-primary leading-relaxed"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
          <span>{variant.caption.length} characters</span>
          <span className={variant.caption.length > 280 ? "text-red-500" : ""}>
            Twitter Limit: 280
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5" /> Image
          </Label>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            disabled={regenerating || !jobTitle}
            onClick={handleRegenerateImage}
          >
            {regenerating ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {regenerating ? 'Generating...' : 'Generate with AI'}
          </Button>
        </div>

        {imageUrl && (
          <div className="relative rounded-lg overflow-hidden border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Post image" className="w-full h-36 object-cover" />
            <button
              onClick={() => { onImageChange(''); setImageInput(''); }}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Paste image URL"
            value={imageInput}
            onChange={e => setImageInput(e.target.value)}
            className="h-9 text-sm"
          />
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            disabled={!imageInput.trim()}
            onClick={() => onImageChange(imageInput.trim())}
          >
            <Upload className="h-3.5 w-3.5" /> Use
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-semibold">Hashtags</Label>
        <div className="flex flex-wrap gap-2">
          {variant.hashtags.map((tag: string, i: number) => (
            <div key={i} className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700">
              #{tag}
              <button className="hover:text-red-500 ml-1">×</button>
            </div>
          ))}
          <Button variant="ghost" size="sm" className="h-7 rounded-full text-xs border border-dashed border-slate-300">
            + Add tag
          </Button>
        </div>
      </div>
    </div>
  );
}
