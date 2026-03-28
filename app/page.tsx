import Link from 'next/link';
import { ArrowRight, Brain, Activity, ShieldCheck, HeartPulse } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Dynamic Background Blobs */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-purple-400/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob pointer-events-none z-0"></div>
      <div className="absolute top-0 -right-40 w-96 h-96 bg-indigo-400/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 pointer-events-none z-0"></div>
      <div className="absolute -bottom-40 left-20 w-96 h-96 bg-pink-400/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 pointer-events-none z-0"></div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b-0 backdrop-blur-md bg-white/40 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">Mindful<span className="text-indigo-600">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-semibold text-sm text-slate-600">
            <Link href="#features" className="hover:text-indigo-600 transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-indigo-600 transition-colors">How it Works</Link>
            <Link href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden md:block text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors">
              Log in
            </Link>
            <Link href="/register" className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center pt-40 pb-20 px-4 relative z-10 w-full max-w-7xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-indigo-200/50 text-xs font-bold text-indigo-700 mb-8 animate-fade-in shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          Next-Gen Employee Wellbeing
        </div>

        <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-center leading-[1.1] text-slate-900 mb-8 animate-fade-in [animation-delay:100ms] max-w-5xl">
          Transform your team's <br className="hidden md:block" />
          <span className="text-gradient">mental resilience.</span>
        </h1>

        <p className="text-xl md:text-2xl text-slate-600 text-center max-w-3xl mb-12 font-medium leading-relaxed animate-fade-in [animation-delay:200ms]">
          The premier B2B SaaS platform that combines AI-driven cognitive support with actionable organizational health insights.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in [animation-delay:300ms]">
          <Link href="/register" className="h-14 px-8 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-1 text-lg">
            Start Free Trial <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="#demo" className="h-14 px-8 rounded-2xl glass-card text-slate-800 font-bold flex items-center justify-center hover:bg-white/90 transition-all shadow-sm text-lg border border-slate-200">
            Book a Demo
          </Link>
        </div>

        {/* Dashboard Mockup Preview */}
        <div className="mt-24 w-full max-w-5xl relative animate-fade-in [animation-delay:500ms] group perspective-1000">
          <div className="absolute inset-0 bg-gradient-to-t from-[#f8fafc] via-transparent to-transparent z-10 bottom-0 h-40 mt-auto pointer-events-none border-b border-transparent"></div>
          <div className="glass-card p-2 md:p-4 border-white/40 shadow-2xl relative overflow-hidden transition-transform duration-700 group-hover:-translate-y-2 group-hover:shadow-[0_40px_80px_-20px_rgba(79,70,229,0.3)] bg-white/40">
            {/* Top Bar Mock */}
            <div className="flex items-center gap-2 mb-4 px-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            {/* Mock Content */}
            <div className="bg-slate-50/70 rounded-2xl border border-slate-100 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 backdrop-blur-md shadow-inner">
              <div className="col-span-2 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-8 w-48 bg-slate-200/80 rounded-lg animate-pulse"></div>
                  <div className="h-8 w-24 bg-indigo-100 rounded-lg"></div>
                </div>
                <div className="h-48 bg-white/80 rounded-xl shadow-sm border border-slate-100 p-6 flex items-end gap-3 justify-between">
                  {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
                    <div key={i} className="flex-1 bg-indigo-50 rounded-t-lg relative group/bar overflow-hidden h-full flex items-end">
                      <div className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg transition-all duration-1000 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]" style={{ height: `${h}%` }}></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-full bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden flex flex-col justify-center border border-indigo-400/50">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
                  <Activity className="w-8 h-8 mb-4 opacity-90" />
                  <h3 className="text-xl font-bold mb-2 text-indigo-100">Team Vitality</h3>
                  <p className="text-5xl font-black">94%</p>
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-green-300 bg-white/10 w-fit px-2 py-1 rounded-md">
                    +12% vs last week
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bento Grid Features */}
      <section id="features" className="py-24 relative z-10 px-4 w-full max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Everything your organization needs.</h2>
          <p className="text-xl text-slate-500 font-medium">Built for scale, designed for humans.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
          {/* Feature 1 */}
          <div className="md:col-span-2 glass-card-hover p-8 group border border-slate-200/60 bg-white/60 backdrop-blur-xl rounded-[2rem] overflow-hidden relative shadow-sm">
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-100/50 rounded-full filter blur-3xl group-hover:bg-indigo-200/50 transition-colors z-0 duration-700"></div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 shadow-sm border border-indigo-100/50 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                  <Activity className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Real-time Analytics Dashboard</h3>
                <p className="text-slate-600 font-medium text-lg max-w-md leading-relaxed">Aggregated, strictly anonymous insights into your organization's burnout risk and overall vitality scores.</p>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="glass-card-hover p-8 group border border-slate-200/60 bg-white/60 backdrop-blur-xl rounded-[2rem] overflow-hidden relative shadow-sm bg-gradient-to-br hover:from-white hover:to-purple-50/50">
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 shadow-sm border border-purple-100/50 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                  <Brain className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">AI Companion</h3>
                <p className="text-slate-600 font-medium text-lg leading-relaxed">24/7 personalized cognitive behavioral support for every employee.</p>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="glass-card-hover p-8 group border border-slate-200/60 bg-white/60 backdrop-blur-xl rounded-[2rem] overflow-hidden relative shadow-sm">
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center mb-6 shadow-sm border border-pink-100/50 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                  <HeartPulse className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Habit Tracking</h3>
                <p className="text-slate-600 font-medium text-lg leading-relaxed">Build resilience with daily micro-habits and gamified rewards.</p>
              </div>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="md:col-span-2 glass-card-hover p-8 group border border-slate-200/60 bg-white/60 backdrop-blur-xl rounded-[2rem] overflow-hidden relative shadow-sm">
            <div className="absolute -left-20 top-20 w-64 h-64 bg-teal-100/40 rounded-full filter blur-3xl group-hover:bg-teal-200/40 transition-colors z-0 duration-700"></div>
            <div className="relative z-10 h-full flex flex-col justify-between items-end md:flex-row text-right md:text-left text-center">
              <div className="flex-1">
                <div className="w-14 h-14 mx-auto md:mx-0 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-6 shadow-sm border border-teal-100/50 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Enterprise-Grade Security</h3>
                <p className="text-slate-600 font-medium text-lg max-w-lg leading-relaxed">SOC-2 Type II compliant. Complete data isolation, HIPAA-ready architecture, and rigorous privacy controls natively built-in.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 glass border-t-white/80 bg-white/40 backdrop-blur-xl py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-black text-slate-900 tracking-tight">Mindful<span className="text-indigo-600">AI</span></span>
          </div>
          <p className="text-slate-500 text-sm font-semibold">© 2026 MindfulAI, Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
