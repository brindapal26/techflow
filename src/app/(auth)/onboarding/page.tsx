'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Building2, 
  Link as LinkIcon, 
  Share2, 
  CheckCircle2, 
  ArrowRight, 
  Upload,
  Globe,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  const steps = [
    { id: 1, title: 'Company Info', icon: <Building2 className="h-4 w-4" /> },
    { id: 2, title: 'Connect ATS', icon: <LinkIcon className="h-4 w-4" /> },
    { id: 3, title: 'Social Profiles', icon: <Share2 className="h-4 w-4" /> },
  ];

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="container max-w-4xl mx-auto py-12 px-4 flex-1 flex flex-col justify-center">
        {/* Progress Bar & Steps */}
        <div className="mb-12">
          <div className="flex justify-between mb-4">
            {steps.map((s) => (
              <div 
                key={s.id} 
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors",
                  step >= s.id ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                  step >= s.id ? "border-primary bg-primary text-primary-foreground" : "border-muted bg-white"
                )}>
                  {step > s.id ? <CheckCircle2 className="h-5 w-5" /> : s.id}
                </div>
                <span className="hidden sm:inline">{s.title}</span>
              </div>
            ))}
          </div>
          <Progress value={(step / 3) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border p-8 md:p-12 min-h-[500px] flex flex-col">
          {step === 1 && <CompanyInfoStep />}
          {step === 2 && <ATSConnectionStep />}
          {step === 3 && <SocialProfilesStep />}

          <div className="mt-auto pt-12 flex justify-between items-center border-t">
            <Button 
              onClick={prevStep} 
              variant="ghost" 
              disabled={step === 1}
              className="text-muted-foreground hover:text-foreground"
            >
              Back
            </Button>
            
            {step < 3 ? (
              <Button onClick={nextStep} className="px-8">
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={() => router.push('/dashboard')} 
                className="px-8 bg-green-600 hover:bg-green-700"
              >
                Complete Setup ✨
              </Button>
            )}
          </div>
        </div>
        
        <p className="text-center text-sm text-muted-foreground mt-8">
          Trusted by 500+ talent acquisition teams worldwide.
        </p>
      </div>
    </div>
  );
}

function CompanyInfoStep() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Tell us about your company</h2>
        <p className="text-muted-foreground text-lg">We&apos;ll use this to customize your social recruitment experience.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input id="companyName" placeholder="Acme Inc." className="pl-10 h-11" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Company Website</Label>
          <div className="relative">
            <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input id="website" placeholder="https://acme.com" className="pl-10 h-11" />
          </div>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="industry">Industry</Label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <select id="industry" className="w-full h-11 pl-10 pr-4 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none">
              <option value="">Select Industry</option>
              <option value="tech">Technology</option>
              <option value="finance">Finance</option>
              <option value="healthcare">Healthcare</option>
              <option value="retail">Retail</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center space-y-4 hover:bg-slate-50 transition-colors cursor-pointer group">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Upload className="h-6 w-6 text-slate-500" />
        </div>
        <div className="text-center">
          <p className="font-medium">Upload Company Logo</p>
          <p className="text-xs text-muted-foreground">PNG, JPG or SVG up to 2MB</p>
        </div>
      </div>
    </div>
  );
}

function ATSConnectionStep() {
  const [selected, setSelected] = useState<string | null>(null);

  const providers = [
    { id: 'ceipal', name: 'Ceipal', color: 'bg-orange-50' },
    { id: 'greenhouse', name: 'Greenhouse', color: 'bg-green-50' },
    { id: 'workday', name: 'Workday', color: 'bg-blue-50' },
    { id: 'lever', name: 'Lever', color: 'bg-indigo-50' },
    { id: 'smartrecruiters', name: 'SmartRecruiters', color: 'bg-purple-50' },
    { id: 'bamboohr', name: 'BambooHR', color: 'bg-teal-50' },
    { id: 'custom', name: 'Other / Custom', color: 'bg-slate-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Connect your ATS</h2>
        <p className="text-muted-foreground text-lg">We&apos;ll automatically sync your job openings and create posts.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {providers.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p.id)}
            className={cn(
              "p-6 rounded-xl border-2 transition-all flex flex-col items-center justify-center space-y-3",
              selected === p.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-slate-100 hover:border-slate-200 bg-white"
            )}
          >
            <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg", p.color)}>
              {p.name[0]}
            </div>
            <span className="font-semibold text-sm">{p.name}</span>
          </button>
        ))}
      </div>

      {selected === 'custom' && (
        <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
          <Label htmlFor="careerUrl">Career Site URL</Label>
          <Input id="careerUrl" placeholder="https://careers.acme.com" className="h-11" />
          <p className="text-xs text-muted-foreground">We&apos;ll crawl your site to find job openings.</p>
        </div>
      )}

      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <LinkIcon className="h-5 w-5 text-blue-600" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-blue-900">Why connect an ATS?</p>
          <p className="text-sm text-blue-700 leading-relaxed">
            By connecting your ATS, TalentFlow can automatically generate social media posts whenever you publish a new job opening, saving you hours of manual work.
          </p>
        </div>
      </div>
    </div>
  );
}

function SocialProfilesStep() {
  const [connected, setConnected] = useState<string[]>([]);

  const toggleConnect = (id: string) => {
    if (connected.includes(id)) {
      setConnected(connected.filter((p) => p !== id));
    } else {
      setConnected([...connected, id]);
    }
  };

  const platforms = [
    { id: 'linkedin', name: 'LinkedIn', icon: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png' },
    { id: 'facebook', name: 'Facebook', icon: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg' },
    { id: 'twitter', name: 'Twitter (X)', icon: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg' },
    { id: 'instagram', name: 'Instagram', icon: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Connect social profiles</h2>
        <p className="text-muted-foreground text-lg">Where should we publish your job posts?</p>
      </div>

      <div className="space-y-4">
        {platforms.map((p) => (
          <Card key={p.id} className={cn(
            "border transition-all",
            connected.includes(p.id) ? "border-primary bg-primary/5" : "border-slate-200"
          )}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src={p.icon} alt={p.name} className="w-8 h-8 object-contain" />
                <span className="font-semibold">{p.name}</span>
              </div>
              <Button 
                variant={connected.includes(p.id) ? "outline" : "default"} 
                size="sm"
                onClick={() => toggleConnect(p.id)}
              >
                {connected.includes(p.id) ? "Connected" : "Connect"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
        <Share2 className="h-5 w-5 text-amber-600" />
        <p className="text-sm text-amber-800">
          <strong>Tip:</strong> You can add employee and recruiter profiles after you finish setup to boost reach.
        </p>
      </div>
    </div>
  );
}
