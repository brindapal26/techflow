import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Rocket, 
  Share2, 
  Map as MapIcon, 
  BarChart3, 
  Calendar, 
  Zap, 
  ArrowRight,
  CheckCircle2,
  Navigation,
  Layers,
  Sparkles,
  Globe,
  Layout
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB]">
      {/* Navigation */}
      <header className="px-4 lg:px-6 h-18 flex items-center border-b bg-white/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex items-center mx-auto">
          <Link className="flex items-center justify-center group" href="#">
            <div className="p-2 bg-indigo-600 rounded-lg group-hover:bg-indigo-700 transition-colors">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <span className="ml-3 text-2xl font-bold tracking-tight text-slate-900">TalentFlow</span>
          </Link>
          <nav className="ml-auto hidden md:flex gap-8 items-center">
            <Link className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors" href="#features">
              Features
            </Link>
            <Link className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors" href="#job-maps">
              Job Maps
            </Link>
            <Link className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors" href="#analytics">
              Analytics
            </Link>
          </nav>
          <div className="ml-auto md:ml-8 flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="font-semibold text-slate-600">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 font-semibold px-5">
              <Link href="/onboarding">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section with Ambiance */}
        <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 lg:pt-32 lg:pb-48">
          {/* Ambiance Glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-blue-100/50 rounded-full blur-[100px]"></div>
          </div>

          <div className="container px-4 md:px-6 mx-auto relative">
            <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
              <div className="inline-flex items-center rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10 mb-2">
                <Sparkles className="h-4 w-4 mr-2" />
                Next-Gen Social Recruiting
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1]">
                Scale Your Hiring with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Automated Social Magic</span>
              </h1>
              <p className="text-lg text-slate-600 md:text-xl max-w-2xl leading-relaxed">
                Connect your ATS, automate job posts across all platforms, and showcase your global presence with interactive job maps. The all-in-one social recruiting suite.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="h-14 px-10 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200" asChild>
                  <Link href="/onboarding">
                    Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-14 px-10 text-lg border-2 hover:bg-slate-50">
                  Watch Product Tour
                </Button>
              </div>
              
              {/* Trust Logos */}
              <div className="pt-16 flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                <img src="https://upload.wikimedia.org/wikipedia/commons/0/01/LinkedIn_Logo.svg" alt="LinkedIn" className="h-6" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" alt="Facebook" className="h-6" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" className="h-6" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" alt="Instagram" className="h-6" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-6" />
              </div>
            </div>
          </div>
        </section>

        {/* Feature Split: Social Distribution */}
        <section id="features" className="py-24 bg-white border-y border-slate-100">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-widest text-sm">
                  <Layers className="h-4 w-4" />
                  Effortless Distribution
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">Automate Your Social <br className="hidden md:block" /> Content Lifecycle</h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Stop manual copying and pasting. TalentFlow syncs with your ATS to detect new roles and automatically creates platform-optimized posts that match your brand identity perfectly.
                </p>
                <div className="space-y-4 pt-4">
                  {[
                    "Auto-detect brand colors from your website",
                    "AI-generated captions with platform-specific hashtags",
                    "Custom image templates for LinkedIn, X, and Instagram",
                    "Set-it-and-forget-it automated scheduling"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1 bg-indigo-100 rounded-full p-1">
                        <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                      </div>
                      <span className="text-slate-700 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-6">
                  <Button variant="link" className="p-0 text-indigo-600 font-bold text-lg hover:no-underline group">
                    Explore Social Features <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-3xl blur-2xl opacity-10 group-hover:opacity-20 transition duration-500"></div>
                <div className="relative bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-2xl">
                  <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-slate-200">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="mx-auto text-xs font-medium text-slate-400">talentflow.ai/dashboard</div>
                  </div>
                  <img 
                    src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1974&auto=format&fit=crop" 
                    alt="Platform Dashboard" 
                    className="w-full h-auto"
                  />
                  <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur shadow-2xl rounded-xl border border-slate-200 p-5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-tight">Real-time Performance</div>
                        <div className="text-lg font-bold text-slate-900">+124% Engagement vs Last Month</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Job Maps Section: Dark Ambiance */}
        <section id="job-maps" className="py-24 bg-[#0F172A] text-white relative overflow-hidden">
          {/* Subtle Map Pattern Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/world-map.png')]"></div>
          
          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 relative group">
                <div className="absolute -inset-10 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-900">
                  <img 
                    src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=2033&auto=format&fit=crop" 
                    alt="Job Map Interface" 
                    className="w-full opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                  />
                  <div className="absolute top-6 left-6">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-indigo-400" />
                      <span className="text-sm font-semibold">San Francisco, CA</span>
                    </div>
                  </div>
                  <div className="absolute bottom-6 right-6">
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 rounded-full px-6 font-bold shadow-lg shadow-indigo-600/30">
                      Find Me
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="order-1 lg:order-2 space-y-6">
                <div className="inline-flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-widest text-sm">
                  <Globe className="h-4 w-4" />
                  Interactive Job Maps
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">A Beautiful Way for <br /> Candidates to Explore</h2>
                <p className="text-lg text-slate-300 leading-relaxed">
                  Embed a custom-branded, interactive map directly on your career site. Let candidates discover opportunities based on where they live or want to be.
                </p>
                <div className="grid grid-cols-2 gap-6 pt-4">
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-indigo-400">3,000+</div>
                    <div className="text-sm text-slate-400">Avg. monthly job clicks per map</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-indigo-400">100%</div>
                    <div className="text-sm text-slate-400">Automatic ATS synchronization</div>
                  </div>
                </div>
                <div className="pt-6">
                  <Button className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-8 h-12">
                    Preview Your Map
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid: Modern Style */}
        <section className="py-24 bg-[#F9FAFB]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">The Complete Toolkit</h2>
              <p className="text-lg text-slate-600">
                Everything you need to turn your social media profiles into high-performance recruiting engines.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Sparkles className="h-6 w-6 text-indigo-600" />}
                title="AI Magic Posts"
                description="Our AI analyzes your job URLs to craft compelling, high-conversion captions and visual layouts automatically."
              />
              <FeatureCard 
                icon={<Layout className="h-6 w-6 text-indigo-600" />}
                title="Visual Content Studio"
                description="A powerful browser-based editor to customize job graphics with your own brand assets, stickers, and filters."
              />
              <FeatureCard 
                icon={<Calendar className="h-6 w-6 text-indigo-600" />}
                title="Smart Scheduling"
                description="Optimize post timing based on candidate activity. Set recurring campaigns for evergreen employer brand stories."
              />
              <FeatureCard 
                icon={<Share2 className="h-6 w-6 text-indigo-600" />}
                title="Multi-Network Publishing"
                description="One click to reach LinkedIn, Facebook, Instagram, and X. Maintain a consistent brand voice across every channel."
              />
              <FeatureCard 
                icon={<BarChart3 className="h-6 w-6 text-indigo-600" />}
                title="Actionable Analytics"
                description="Identify which platforms and content types drive the most applicants with our attribution-focused dashboard."
              />
              <FeatureCard 
                icon={<Zap className="h-6 w-6 text-indigo-600" />}
                title="80+ ATS Integrations"
                description="Native support for Workday, Greenhouse, Lever, and every major ATS platform. Setup takes less than 5 minutes."
              />
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 bg-indigo-600 relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[100px] opacity-50"></div>
          <div className="container px-4 md:px-6 mx-auto relative z-10 text-center text-white">
            <div className="max-w-3xl mx-auto space-y-8">
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Ready to transform your social recruiting?</h2>
              <p className="text-xl text-indigo-100 opacity-90 leading-relaxed">
                Join 500+ talent teams who use TalentFlow to save hundreds of hours and find better candidates where they spend their time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" className="h-14 px-10 text-lg bg-white text-indigo-600 hover:bg-indigo-50 font-bold" asChild>
                  <Link href="/onboarding">Get Started Free</Link>
                </Button>
                <Button variant="outline" size="lg" className="h-14 px-10 text-lg border-2 border-indigo-400 text-white hover:bg-indigo-700 font-bold">
                  Book a Demo
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200">
        <div className="container px-4 md:px-6 py-12 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            <div className="col-span-2 lg:col-span-2 space-y-4">
              <Link className="flex items-center group" href="#">
                <div className="p-1.5 bg-indigo-600 rounded-lg">
                  <Rocket className="h-4 w-4 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold tracking-tight text-slate-900">TalentFlow</span>
              </Link>
              <p className="text-slate-500 max-w-xs">
                The world's most advanced social recruiting platform for modern talent teams.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-500 font-medium">
                <li><Link href="#features" className="hover:text-indigo-600">Features</Link></li>
                <li><Link href="#job-maps" className="hover:text-indigo-600">Job Maps</Link></li>
                <li><Link href="#" className="hover:text-indigo-600">Integrations</Link></li>
                <li><Link href="#" className="hover:text-indigo-600">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-500 font-medium">
                <li><Link href="#" className="hover:text-indigo-600">About</Link></li>
                <li><Link href="#" className="hover:text-indigo-600">Blog</Link></li>
                <li><Link href="#" className="hover:text-indigo-600">Careers</Link></li>
                <li><Link href="#" className="hover:text-indigo-600">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-500 font-medium">
                <li><Link href="#" className="hover:text-indigo-600">Privacy</Link></li>
                <li><Link href="#" className="hover:text-indigo-600">Terms</Link></li>
                <li><Link href="#" className="hover:text-indigo-600">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400">© 2026 TalentFlow Inc. All rights reserved.</p>
            <div className="flex gap-6 grayscale opacity-50 hover:grayscale-0 transition-all duration-300">
              <Share2 className="h-5 w-5 cursor-pointer hover:text-indigo-600" />
              <BarChart3 className="h-5 w-5 cursor-pointer hover:text-indigo-600" />
              <Globe className="h-5 w-5 cursor-pointer hover:text-indigo-600" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <CardContent className="p-8 space-y-4">
        <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <p className="text-slate-500 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
