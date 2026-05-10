import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  ArrowRight, Mic, Video, BrainCircuit, BarChart3, FileText, Shield,
  KeyRound, Search, Zap, CheckCircle2, Quote, Star, Plus, Minus,
  PlayCircle, Sparkles, Users, Clock, Target, Lock, Check,
  Linkedin, Twitter, Github, Mail
} from "lucide-react";
import { api } from "../lib/api";
import { setInterviewCode } from "../lib/api";
import { toast } from "sonner";

const HERO_AI = "https://static.prod-images.emergentagent.com/jobs/8b2c19c4-8421-4225-b01f-82c5e4a0c9f1/images/5b34011c78c266fc6e627ec3e6480443e6951e3f34741101aa9ceb495b414767.png";
const CAND = "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200";
const HR = "https://images.unsplash.com/photo-1551836022-d5d88e9218df?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200";
const ANALYTICS = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200";
const DASH = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?crop=entropy&cs=srgb&fm=jpg&q=80&w=1600";

export default function Landing() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [statusCode, setStatusCode] = useState("");
  const [mode, setMode] = useState("join");
  const [openFaq, setOpenFaq] = useState(0);

  const submit = async (e) => {
    e.preventDefault();
    const code = (mode === "join" ? joinCode : statusCode).trim().toUpperCase();
    if (!code) return toast.error("Enter an interview code");
    if (mode === "status") { navigate(`/status?code=${code}`); return; }
    try {
      const { data } = await api.post("/interviews/join", { code });
      setInterviewCode(data.code || code);
      if (data.status === "completed") navigate(`/status?code=${code}`);
      else navigate(`/interview/${data.id}/${data.interview_type === "voice" ? "session" : "text"}`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Invalid code");
    }
  };

  return (
    <div className="App bg-white">
      <Navbar/>

      {/* ---- HERO ---- */}
      <section className="relative overflow-hidden border-b border-gray-200" data-testid="hero-section">
        <div className="absolute inset-0 -z-10 grid-pattern opacity-60"/>
        <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-[#002FA7] opacity-[0.03] rounded-full blur-3xl"/>

        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-16 pb-20 lg:pt-24 lg:pb-28 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-[#002FA7] bg-[#002FA7]/5 mb-7" data-testid="hero-badge">
              <Sparkles className="w-3.5 h-3.5 text-[#002FA7]" strokeWidth={2.4}/>
              <span className="overline text-[#002FA7]">The New Science of Hiring</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[5.5rem] font-bold leading-[0.95] tracking-tighter text-[#111827]">
              Hire smarter.<br/>
              <span className="text-[#002FA7]">Faster.</span> <span className="italic">Fairer.</span>
            </h1>
            <p className="mt-7 text-base lg:text-lg text-gray-600 max-w-xl leading-relaxed">
              Scorebar runs structured AI interviews — voice, video, and text — and delivers an evidence-based score across five hiring dimensions. Cut your screening time by <strong className="text-[#111827]">80%</strong> without sacrificing depth or fairness.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link to="/signup" className="btn-primary inline-flex items-center gap-2" data-testid="hero-apply-cta">Start free trial <ArrowRight className="w-4 h-4"/></Link>
              <a href="#how-it-works" className="btn-secondary inline-flex items-center gap-2" data-testid="hero-learn-cta">
                <PlayCircle className="w-4 h-4"/> See how it works
              </a>
            </div>
            <div className="mt-10 pt-8 border-t border-gray-200 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#10B981]"/>No credit card required</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#10B981]"/>5-interview free trial</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#10B981]"/>GDPR & SOC2 ready</div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="card-bold p-2 bg-white"><img src={HERO_AI} alt="Scorebar AI" className="w-full"/></div>
            <div className="absolute -bottom-6 -left-6 card-bold-dark p-4 max-w-[230px] text-sm" data-testid="hero-live-score">
              <div className="overline text-[#FF3B30] mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#FF3B30] rounded-full animate-pulse"/>
                Live score
              </div>
              <div className="font-display text-3xl font-bold">87/100</div>
              <div className="text-gray-300 text-xs mt-1">Strong Hire · Senior PM</div>
            </div>
            <div className="absolute -top-4 -right-4 card-bold p-3 bg-white max-w-[200px] text-xs" data-testid="hero-time-saved">
              <div className="overline text-[#002FA7] mb-1">Time saved</div>
              <div className="font-display text-2xl font-bold">8.4h</div>
              <div className="text-gray-500">vs. live phone screens</div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- TRUSTED BY ---- */}
      <section className="border-b border-gray-200 py-10 bg-white" data-testid="trusted-by">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex flex-wrap items-center justify-between gap-6">
          <span className="overline text-gray-500">Trusted by hiring teams at</span>
          <div className="flex flex-wrap gap-x-10 gap-y-3 items-center text-gray-400 font-display text-lg">
            <span className="hover:text-gray-800 transition-colors cursor-default">Northwind</span>
            <span className="hover:text-gray-800 transition-colors cursor-default">Helix</span>
            <span className="hover:text-gray-800 transition-colors cursor-default">Kintsu Labs</span>
            <span className="hover:text-gray-800 transition-colors cursor-default">Foundry</span>
            <span className="hover:text-gray-800 transition-colors cursor-default">Echo &amp; Co</span>
            <span className="hover:text-gray-800 transition-colors cursor-default">Vellum</span>
          </div>
        </div>
      </section>

      {/* ---- STATS ---- */}
      <section className="py-20 bg-[#F3F4F6] border-b border-gray-200" data-testid="stats-section">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l border-gray-300">
            {[
              {n:"80%", l:"Less time-to-shortlist"},
              {n:"5", l:"Hiring dimensions scored"},
              {n:"30s", l:"Device-check before session"},
              {n:"100%", l:"Audit-ready structured rubric"},
            ].map((s,i)=>(
              <div key={i} className="border-r border-b border-gray-300 p-8 bg-white hover:bg-[#002FA7]/[0.02] transition-colors" data-testid={`stat-${i}`}>
                <div className="font-display text-5xl lg:text-6xl font-bold tracking-tighter text-[#002FA7]">{s.n}</div>
                <div className="text-sm text-gray-600 mt-3">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- HOW IT WORKS ---- */}
      <section id="how-it-works" className="py-24 lg:py-32" data-testid="how-it-works">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-3xl">
            <div className="overline text-[#FF3B30] mb-4">// How it works</div>
            <h2 className="font-display text-3xl lg:text-5xl font-bold tracking-tighter text-[#111827]">
              From job post to signed offer — in <span className="text-[#002FA7]">3 steps.</span>
            </h2>
            <p className="mt-5 text-gray-600 text-base lg:text-lg leading-relaxed">
              Scorebar replaces four phone screens with one structured AI interview. You keep full control; we give you the evidence to decide faster.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mt-16">
            {[
              {num:"01", title:"Invite", badge:"Send codes", img:CAND, desc:"HR drafts an interview with custom questions and either emails a private code or shares one URL with hundreds of applicants."},
              {num:"02", title:"Interview", badge:"Voice · Video · Text", img:HR, desc:"Candidates do a quick 30s device check, then answer at their own pace. Each response is recorded as a separate clip and transcribed live."},
              {num:"03", title:"Decide", badge:"Score & shortlist", img:ANALYTICS, desc:"GPT-grade rubric across 5 dimensions. One click sends Selected / Next round / Not selected emails to the entire cohort."},
            ].map((step, i) => (
              <article key={i} className="card-flat overflow-hidden border-2 border-gray-900 group hover:-translate-y-1 hover:shadow-[8px_8px_0_0_rgba(0,47,167,1)] transition-all duration-300" data-testid={`step-card-${i}`}>
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img src={step.img} alt={step.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                  <div className="absolute top-0 left-0 bg-[#002FA7] text-white font-display font-bold text-3xl px-4 py-2 tracking-tighter">
                    {step.num}
                  </div>
                </div>
                <div className="p-6 sm:p-8">
                  <div className="overline text-[#002FA7] mb-3">{step.badge}</div>
                  <h3 className="font-display text-2xl font-bold tracking-tight text-[#111827]">{step.title}</h3>
                  <p className="text-sm text-gray-600 mt-4 leading-relaxed">{step.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---- DEMO PREVIEW ---- */}
      <section className="py-24 bg-[#111827] text-white border-y border-gray-900 relative overflow-hidden" data-testid="demo-preview">
        <div className="absolute inset-0 grid-pattern-dark opacity-30"/>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative">
          <div className="grid lg:grid-cols-12 gap-10 items-end mb-12">
            <div className="lg:col-span-7">
              <div className="overline text-[#FF3B30] mb-4">// Product preview</div>
              <h2 className="font-display text-3xl lg:text-5xl font-bold tracking-tighter">
                A workspace built for <span className="text-[#60A5FA]">evidence-based decisions.</span>
              </h2>
            </div>
            <p className="lg:col-span-5 text-gray-300 text-sm leading-relaxed">
              Every transcript. Every score. Every rubric dimension — grouped by role, searchable, and exportable. No more candidate-ranking spreadsheets.
            </p>
          </div>

          <div className="relative card-bold bg-white p-2 mb-8">
            <img src={DASH} alt="Scorebar HR dashboard preview" className="w-full"/>
            <div className="absolute -bottom-4 -right-4 hidden md:block bg-[#002FA7] text-white p-4 border-2 border-white shadow-[4px_4px_0_0_rgba(255,255,255,0.2)] max-w-[240px]">
              <div className="overline mb-1">Auto-score</div>
              <div className="text-sm">Every answer graded on a 5-section rubric within minutes of submission.</div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mt-12">
            {[
              {icon:Target, title:"5-dimension rubric", desc:"Technical · Soft · Cultural · Experience · Personality"},
              {icon:Clock, title:"Under 10-minute review", desc:"Transcripts, clips and scores in one pane"},
              {icon:Users, title:"Cohort filters", desc:"Status · Role · Rank · Shortlist"},
            ].map((f,i)=>(
              <div key={i} className="border-2 border-white/10 p-5 bg-white/5 hover:bg-white/10 transition-colors" data-testid={`demo-feature-${i}`}>
                <f.icon className="w-6 h-6 text-[#60A5FA]" strokeWidth={1.6}/>
                <div className="font-display font-bold mt-3">{f.title}</div>
                <div className="text-xs text-gray-400 mt-1">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- CAPABILITIES GRID ---- */}
      <section id="product" className="py-20 lg:py-24 bg-[#F3F4F6] border-b border-gray-200" data-testid="capabilities-section">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-10 items-end mb-12">
            <div className="lg:col-span-7">
              <div className="overline text-[#002FA7] mb-3">// Capabilities</div>
              <h2 className="font-display text-3xl lg:text-5xl font-bold tracking-tighter text-[#111827]">Built to remove bias — not human judgement.</h2>
            </div>
            <p className="lg:col-span-5 text-gray-600 text-sm leading-relaxed">Every score is grounded in transcript evidence. HR keeps the final call. Scorebar simply gives every candidate the same structured stage.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-l border-gray-900">
            {[
              {icon:Mic, title:"Voice Interview", body:"Natural one-question-at-a-time format with adaptive pacing. Live Whisper transcription."},
              {icon:Video, title:"HD Video Recording", body:"Browser-recorded HD video, one clip per question, served back to HR for review."},
              {icon:BrainCircuit, title:"GPT-Powered Scoring", body:"Five-section evaluation: Technical, Soft Skills, Cultural Fit, Experience, Personality."},
              {icon:FileText, title:"Custom Question Banks", body:"Bring your own questions per role. No AI shortcut — your standards, your hire."},
              {icon:BarChart3, title:"HR Workspace", body:"Cohort dashboard, status tags, filters, candidate-level audit trail."},
              {icon:Shield, title:"Approved Teams Only", body:"Manual onboarding for every employer. Candidate identities scoped to a code, not an account."},
            ].map((f,i)=>(
              <div key={i} className="border-r border-b border-gray-900 p-7 bg-white hover:bg-[#002FA7]/[0.03] transition-colors group" data-testid={`cap-card-${i}`}>
                <div className="w-11 h-11 flex items-center justify-center border-2 border-[#002FA7] group-hover:bg-[#002FA7] group-hover:text-white transition-colors text-[#002FA7]">
                  <f.icon className="w-5 h-5" strokeWidth={1.8}/>
                </div>
                <h3 className="font-display text-xl font-bold mt-5 tracking-tight text-[#111827]">{f.title}</h3>
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- TESTIMONIALS ---- */}
      <section className="py-24 lg:py-28 bg-white" data-testid="testimonials">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-3xl mb-14">
            <div className="overline text-[#FF3B30] mb-4">// What teams say</div>
            <h2 className="font-display text-3xl lg:text-5xl font-bold tracking-tighter text-[#111827]">
              Hiring teams ship hires, not spreadsheets.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote:"We replaced four phone-screen rounds with a single Scorebar voice interview. Time-to-offer dropped from 21 days to 6.",
                name:"Priya Menon", role:"Head of Talent", co:"Northwind", init:"PM", accent:"#002FA7"
              },
              {
                quote:"The rubric is the calmest recruiter I've ever worked with. It scores the same way at 9am and 9pm. Our hires stuck around 2x longer.",
                name:"Marcus Lee", role:"VP People", co:"Helix", init:"ML", accent:"#FF3B30"
              },
              {
                quote:"Candidates tell us the device-check feels modern. HRs tell us the dashboard is the first one they actually check twice a day.",
                name:"Sana Qureshi", role:"Recruiting Lead", co:"Kintsu Labs", init:"SQ", accent:"#111827"
              },
            ].map((t,i)=>(
              <article key={i} className="card-flat border-2 border-gray-900 p-7 bg-white hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,47,167,1)] transition-all duration-300 flex flex-col" data-testid={`testimonial-${i}`}>
                <Quote className="w-7 h-7 text-[#002FA7] mb-4" strokeWidth={1.6}/>
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_,s)=>(
                    <Star key={s} className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]"/>
                  ))}
                </div>
                <p className="font-display text-lg tracking-tight leading-snug text-[#111827] flex-1">"{t.quote}"</p>
                <div className="mt-6 pt-5 border-t border-gray-200 flex items-center gap-3">
                  <div
                    className="w-10 h-10 flex items-center justify-center text-white font-display font-bold text-sm"
                    style={{background:t.accent}}
                  >{t.init}</div>
                  <div>
                    <div className="font-medium text-[#111827] text-sm">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role} · {t.co}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---- PRICING PREVIEW ---- */}
      <section className="py-24 bg-[#F3F4F6] border-y border-gray-200" data-testid="pricing-preview">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-8 mb-12">
            <div className="max-w-2xl">
              <div className="overline text-[#002FA7] mb-3">// Pricing</div>
              <h2 className="font-display text-3xl lg:text-5xl font-bold tracking-tighter text-[#111827]">
                Simple pricing. Real interviews.
              </h2>
              <p className="mt-4 text-gray-600 text-base leading-relaxed">Start free, grow with the team. No per-seat tricks, no hidden AI costs.</p>
            </div>
            <Link to="/pricing" className="btn-secondary inline-flex items-center gap-2 self-start" data-testid="see-full-pricing">
              Compare all plans <ArrowRight className="w-4 h-4"/>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {name:"Free", price:"$0", period:"30-day trial", desc:"For teams evaluating Scorebar.",
                feats:["5 interviews","1 team member","Basic AI scoring","Voice + text formats","Email support"],
                cta:"Start free", link:"/signup", highlight:false, testid:"plan-starter"},
              {name:"Starter", price:"$29.99", period:"per month", desc:"For small hiring teams.",
                feats:["20 interviews / month","2 team members","Deep 5-section scoring","Video recording","Custom question banks"],
                cta:"Get Starter", link:"/signup", highlight:true, testid:"plan-team"},
              {name:"Professional", price:"$149.99", period:"per month", desc:"For growing recruiting teams.",
                feats:["110 interviews / month","5 team members","Advanced AI + voice","Priority support","Cohort analytics"],
                cta:"Go Pro", link:"/signup", highlight:false, testid:"plan-scale"},
            ].map((p,i)=>(
              <article
                key={i}
                className={`border-2 p-7 flex flex-col transition-all duration-300 ${
                  p.highlight
                    ? "bg-[#111827] text-white border-[#111827] shadow-[8px_8px_0_0_rgba(0,47,167,1)] lg:-translate-y-2"
                    : "bg-white border-gray-900 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(17,24,39,1)]"
                }`}
                data-testid={p.testid}
              >
                {p.highlight && (
                  <div className="overline text-[#FF3B30] mb-3">★ Most popular</div>
                )}
                <div className={`font-display text-2xl font-bold tracking-tight ${p.highlight ? "text-white" : "text-[#111827]"}`}>{p.name}</div>
                <div className="mt-3 flex items-baseline gap-2">
                  <div className={`font-display text-4xl lg:text-5xl font-bold tracking-tighter ${p.highlight ? "text-[#60A5FA]" : "text-[#002FA7]"}`}>{p.price}</div>
                  <div className={`text-xs ${p.highlight ? "text-gray-400" : "text-gray-500"}`}>{p.period}</div>
                </div>
                <p className={`text-sm mt-3 ${p.highlight ? "text-gray-300" : "text-gray-600"}`}>{p.desc}</p>
                <ul className="mt-6 space-y-2.5 flex-1">
                  {p.feats.map((f,fi)=>(
                    <li key={fi} className={`flex items-start gap-2 text-sm ${p.highlight ? "text-gray-200" : "text-gray-700"}`}>
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${p.highlight ? "text-[#60A5FA]" : "text-[#10B981]"}`}/>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={p.link}
                  className={`mt-7 inline-flex items-center justify-center gap-2 py-3 px-5 font-medium transition-all ${
                    p.highlight
                      ? "bg-[#60A5FA] text-[#111827] hover:bg-white shadow-[4px_4px_0_0_rgba(255,255,255,0.15)] hover:shadow-[2px_2px_0_0_rgba(255,255,255,0.2)] hover:translate-x-[2px] hover:translate-y-[2px]"
                      : "btn-primary"
                  }`}
                  data-testid={`${p.testid}-cta`}
                >
                  {p.cta} <ArrowRight className="w-4 h-4"/>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section className="py-24 lg:py-28" data-testid="faq-section">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-14">
            <div className="overline text-[#FF3B30] mb-4">// FAQ</div>
            <h2 className="font-display text-3xl lg:text-5xl font-bold tracking-tighter text-[#111827]">
              Questions, answered.
            </h2>
            <p className="mt-4 text-gray-600 text-base">Can't find what you're looking for? <Link to="/contact" className="text-[#002FA7] font-medium hover:underline">Talk to our team</Link>.</p>
          </div>

          <div className="border-t-2 border-gray-900">
            {[
              {q:"How does Scorebar's AI scoring actually work?",
                a:"Every answer is transcribed (Whisper), then evaluated by an LLM against a 5-section rubric: Technical, Soft Skills, Cultural Fit, Experience, and Personality. Every score cites transcript evidence so your team can audit decisions."},
              {q:"Do candidates need to install anything?",
                a:"No. Interviews run entirely in the browser. Candidates get a 30-second device check (mic + webcam) before the interview starts. No downloads, no accounts."},
              {q:"Can I use my own interview questions?",
                a:"Yes. Every plan includes custom question banks per role. You write the questions — Scorebar handles structure, recording, transcription and scoring."},
              {q:"Is candidate data private and GDPR compliant?",
                a:"Yes. We're GDPR-ready, SOC 2 aligned, and sign DPAs on Team and Scale plans. Candidates are scoped to an interview code, not a permanent account. Recordings auto-delete on your retention schedule."},
              {q:"How long does it take to set up?",
                a:"About 10 minutes. Sign up, create a job, paste your questions, send the code or link. Your first interview can run today."},
              {q:"Does Scorebar replace human recruiters?",
                a:"Absolutely not. Scorebar gives every candidate the same structured stage and hands your HR team the evidence they need. You keep the final call, always."},
            ].map((item, i) => (
              <div key={i} className="border-b-2 border-gray-900" data-testid={`faq-item-${i}`}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  className="w-full py-6 flex items-start justify-between gap-6 text-left group"
                  data-testid={`faq-toggle-${i}`}
                  aria-expanded={openFaq === i}
                >
                  <span className="font-display text-lg lg:text-xl font-bold tracking-tight text-[#111827] group-hover:text-[#002FA7] transition-colors">
                    {item.q}
                  </span>
                  <div className="shrink-0 w-8 h-8 flex items-center justify-center border-2 border-gray-900 bg-white group-hover:bg-[#002FA7] group-hover:text-white transition-colors">
                    {openFaq === i ? <Minus className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
                  </div>
                </button>
                {openFaq === i && (
                  <div className="pb-6 pr-14 text-gray-600 leading-relaxed fade-up" data-testid={`faq-answer-${i}`}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- FOR CANDIDATES ---- */}
      <section className="py-20 bg-[#111827] text-white border-y border-gray-900 relative overflow-hidden" data-testid="candidate-strip">
        <div className="absolute inset-0 grid-pattern-dark opacity-20"/>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid lg:grid-cols-12 gap-10 items-center relative">
          <div className="lg:col-span-6">
            <div className="overline text-[#FF3B30] mb-4">// For candidates</div>
            <h2 className="font-display text-3xl lg:text-5xl font-bold tracking-tighter">Got an interview code?</h2>
            <p className="mt-5 text-gray-300 max-w-md text-sm leading-relaxed">If a recruiter has invited you, paste your code below to join your interview or check the latest decision from the hiring team.</p>
            <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
              <Lock className="w-3.5 h-3.5"/>
              Your responses are encrypted end-to-end.
            </div>
            <Link to="/candidate-resources" className="mt-5 inline-flex items-center gap-1.5 text-sm text-[#60A5FA] hover:text-white transition-colors" data-testid="candidate-resources-link">
              First time? See candidate tips, FAQs & help <ArrowRight className="w-3.5 h-3.5"/>
            </Link>
          </div>
          <form onSubmit={submit} className="lg:col-span-6 bg-white text-black p-7 border-2 border-white shadow-[8px_8px_0_0_rgba(0,47,167,0.6)]" data-testid="candidate-action-bar">
            <div className="flex gap-2 mb-4">
              <button type="button" onClick={()=>setMode("join")} className={`overline px-3 py-1.5 border-2 border-gray-900 transition-colors ${mode==="join"?"bg-gray-900 text-white":"bg-white hover:bg-gray-100"}`} data-testid="tab-join">Join interview</button>
              <button type="button" onClick={()=>setMode("status")} className={`overline px-3 py-1.5 border-2 border-gray-900 transition-colors ${mode==="status"?"bg-gray-900 text-white":"bg-white hover:bg-gray-100"}`} data-testid="tab-status">Check status</button>
            </div>
            {mode === "join" ? (
              <>
                <label className="overline block mb-2">Meeting code</label>
                <div className="flex gap-2">
                  <input data-testid="join-code-input" value={joinCode} onChange={(e)=>setJoinCode(e.target.value.toUpperCase())} placeholder="SB-XXXX-XXXX" className="flex-1 border-2 border-gray-900 px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#002FA7]"/>
                  <button className="btn-primary inline-flex items-center gap-2" data-testid="join-submit"><KeyRound className="w-4 h-4"/> Join</button>
                </div>
              </>
            ) : (
              <>
                <label className="overline block mb-2">Status check</label>
                <div className="flex gap-2">
                  <input data-testid="status-code-input" value={statusCode} onChange={(e)=>setStatusCode(e.target.value.toUpperCase())} placeholder="SB-XXXX-XXXX" className="flex-1 border-2 border-gray-900 px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#002FA7]"/>
                  <button className="btn-secondary inline-flex items-center gap-2" data-testid="status-submit"><Search className="w-4 h-4"/> Check</button>
                </div>
              </>
            )}
          </form>
        </div>
      </section>

      {/* ---- BIG CTA ---- */}
      <section className="py-24 lg:py-32 bg-white" data-testid="bottom-cta">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#FF3B30] text-white mb-6 shadow-[4px_4px_0_0_rgba(17,24,39,1)]">
            <Zap className="w-7 h-7" strokeWidth={1.8}/>
          </div>
          <h2 className="font-display text-4xl lg:text-6xl font-bold tracking-tighter text-[#111827]">Ready to interview better?</h2>
          <p className="mt-6 text-gray-600 max-w-2xl mx-auto leading-relaxed">Apply once, get a 30-day free trial with 5 interviews and a full HR workspace. No credit card. No commitment. Cancel anytime.</p>
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Link to="/signup" className="btn-primary inline-flex items-center gap-2" data-testid="bottom-apply-cta">Start free trial <ArrowRight className="w-4 h-4"/></Link>
            <Link to="/pricing" className="btn-secondary" data-testid="bottom-pricing-cta">See pricing</Link>
          </div>
        </div>
      </section>

      {/* ---- FOOTER ---- */}
      <footer className="border-t-2 border-gray-900 bg-[#F3F4F6]" data-testid="site-footer">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 grid sm:grid-cols-2 lg:grid-cols-6 gap-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-[#002FA7] flex items-center justify-center shadow-[2px_2px_0_0_rgba(17,24,39,1)]">
                <BrainCircuit className="w-5 h-5 text-white" strokeWidth={2.2}/>
              </div>
              <span className="font-display text-2xl font-bold tracking-tighter">SCOREBAR<span className="text-[#002FA7]">.AI</span></span>
            </div>
            <p className="text-sm text-gray-600 mt-4 max-w-xs leading-relaxed">Structured AI interviews and evidence-based scoring for modern hiring teams.</p>
            <div className="flex gap-3 mt-6">
              {[
                {Icon:Twitter, href:"https://twitter.com", label:"Twitter"},
                {Icon:Linkedin, href:"https://linkedin.com", label:"LinkedIn"},
                {Icon:Github, href:"https://github.com", label:"GitHub"},
                {Icon:Mail, href:"mailto:hello@scorebar.ai", label:"Email"},
              ].map(({Icon, href, label}, i) => (
                <a
                  key={i} href={href} aria-label={label} target="_blank" rel="noreferrer"
                  className="w-9 h-9 flex items-center justify-center border-2 border-gray-900 bg-white hover:bg-[#002FA7] hover:text-white transition-colors"
                  data-testid={`social-${label.toLowerCase()}`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.8}/>
                </a>
              ))}
            </div>
          </div>
          {[
            {h:"Product", links:[["Features","/#how-it-works"],["Pricing","/pricing"],["Check status","/status"],["For HR","/login"]]},
            {h:"Company", links:[["About","/about"],["Careers","/careers"],["Blog","/blog"],["Contact","/contact"]]},
            {h:"Resources", links:[["Documentation",""],["API reference",""],["Security",""],["Changelog",""]]},
            {h:"Legal", links:[["Privacy","/privacy"],["Terms","/terms"],["DPA",""],["Cookies",""]]},
          ].map((col,i)=>(
            <div key={i}>
              <div className="overline text-gray-500 mb-4">{col.h}</div>
              <ul className="space-y-2.5 text-sm">
                {col.links.map(([t,h], j)=>(
                  <li key={j}>{h ? <Link to={h} className="text-gray-700 hover:text-[#002FA7] transition-colors">{t}</Link> : <span className="text-gray-400">{t}</span>}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-300">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-500">
            <div>© 2026 Scorebar.AI — built for hiring teams.</div>
            <div className="flex gap-5 items-center">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse"/>All systems operational</span>
              <span>Made with care</span>
              <span>v1.2</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
