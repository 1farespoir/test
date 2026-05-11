import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  Lightbulb, HelpCircle, LifeBuoy, ArrowUpRight, Plus, Minus,
  Mic, Video, Wifi, Clock, Headphones, Camera, ShieldCheck, BookOpen,
  Mail, MessageSquare, ArrowRight, CheckCircle2
} from "lucide-react";

const TIPS = [
  { Icon: Wifi, title: "Find a quiet, well-lit spot", body: "A calm room with stable Wi-Fi (10+ Mbps) makes the biggest difference. Sit facing a window or soft light source so your face is clearly visible." },
  { Icon: Headphones, title: "Use headphones with a mic", body: "Earbuds or a headset eliminate echo and dramatically improve transcription accuracy. Built-in laptop mics are fine, but headsets are best." },
  { Icon: Camera, title: "Run the 30-second device check", body: "Before the interview starts, Scorebar runs a quick mic + webcam test. Allow browser permissions when prompted — it takes seconds." },
  { Icon: Clock, title: "Take your time on each answer", body: "There's no rush. Each question is recorded as a separate clip. Pause, gather your thoughts, and answer when you're ready." },
  { Icon: Mic, title: "Speak clearly, stay yourself", body: "Don't try to game the AI — be authentic. The rubric rewards specific, evidence-based answers, not buzzwords." },
  { Icon: ShieldCheck, title: "Your data is private", body: "Recordings are scoped to your interview code, encrypted in transit and at rest, and only visible to the hiring team that invited you." },
];

const FAQS = [
  { q: "Do I need to create an account or download anything?", a: "No. Interviews run entirely in your browser. You only need the interview code your recruiter sent you. There are no installs and no permanent account is created." },
  { q: "What if I lose connection mid-interview?", a: "Already-submitted answers are saved on the server. Reload the page, re-enter your code, and you'll resume from the next unanswered question. Don't worry — you won't lose progress." },
  { q: "Can I retake the interview?", a: "By default, each code allows one attempt to keep things fair. If you experienced a technical issue, contact your recruiter or our support team and we can issue a fresh code." },
  { q: "How long does the interview take?", a: "Most Scorebar interviews take 12–25 minutes depending on the role. The exact length is set by the recruiter — you'll see the question count on the intro screen." },
  { q: "Can I see my score?", a: "Scores and detailed feedback are shared with the hiring team. Your recruiter chooses what to share with you — most teams send a personalized status email when they make a decision." },
  { q: "Is the AI making the hiring decision?", a: "No. Scorebar generates an evidence-based score and transcript summary; a human recruiter always makes the final call. The AI's job is to give every candidate the same structured stage." },
  { q: "What browsers are supported?", a: "Chrome, Edge, Firefox and Safari (latest 2 versions). For voice and video interviews, please grant microphone and camera permissions when prompted." },
  { q: "I'm in a different time zone — when does my code expire?", a: "Codes are valid for 7 days from the moment your recruiter sends them, regardless of your time zone. The expiry date is shown on the join screen." },
];

const RESOURCES = [
  {
    id: "tips",
    Icon: Lightbulb,
    badge: "01",
    title: "Candidate Interview Tips",
    desc: "Six quick wins that help you put your best self forward — from your setup to your delivery.",
  },
  {
    id: "faqs",
    Icon: HelpCircle,
    badge: "02",
    title: "Candidate FAQs",
    desc: "Quick answers to the most common candidate questions about Scorebar interviews.",
  },
  {
    id: "help",
    Icon: LifeBuoy,
    badge: "03",
    title: "Candidate Help Center",
    desc: "Stuck on something specific? Reach our support team or browse common technical fixes.",
  },
];

export default function CandidateResources() {
  const [active, setActive] = useState("tips");
  const [openFaq, setOpenFaq] = useState(0);
  const contentRef = useRef(null);

  const scrollToContent = () => {
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const onSelect = (id) => {
    setActive(id);
    scrollToContent();
  };

  return (
    <div className="bg-white">
      <Navbar />

      {/* HERO */}
      <section className="pt-20 lg:pt-28 pb-12 relative overflow-hidden" data-testid="resources-hero">
        <div className="absolute inset-0 -z-10 grid-pattern opacity-50" />
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-[#002FA7] bg-[#002FA7]/5 mb-6">
            <BookOpen className="w-3.5 h-3.5 text-[#002FA7]" strokeWidth={2.4} />
            <span className="overline text-[#002FA7]">// Candidate resources</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold leading-[0.95] tracking-tighter text-[#111827]">
            Still have questions?<br />
            Check out more of <br />our <span className="text-[#FF3B30]">candidate resources.</span>
          </h1>
          <p className="mt-7 text-base lg:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Everything you need before, during, and after your Scorebar interview — from setup tips to FAQs to live support.
          </p>
        </div>
      </section>

      {/* 3 CARDS */}
      <section className="pb-12" data-testid="resource-cards">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid md:grid-cols-3 gap-5">
          {RESOURCES.map((r) => {
            const isActive = active === r.id;
            return (
              <button
                key={r.id}
                onClick={() => onSelect(r.id)}
                className={`text-left border-2 p-7 lg:p-8 group transition-all duration-300 ${
                  isActive
                    ? "bg-[#111827] text-white border-[#111827] shadow-[8px_8px_0_0_rgba(0,47,167,1)] -translate-y-1"
                    : "bg-white border-gray-900 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,47,167,1)]"
                }`}
                data-testid={`resource-card-${r.id}`}
                aria-pressed={isActive}
              >
                <div className="flex items-start justify-between mb-6">
                  <div
                    className={`w-12 h-12 flex items-center justify-center border-2 ${
                      isActive ? "bg-[#60A5FA] text-[#111827] border-[#60A5FA]" : "bg-[#002FA7] text-white border-[#002FA7] group-hover:bg-[#111827] group-hover:border-[#111827]"
                    } transition-colors`}
                  >
                    <r.Icon className="w-5 h-5" strokeWidth={1.8} />
                  </div>
                  <span className={`overline ${isActive ? "text-[#60A5FA]" : "text-gray-400"}`}>{r.badge}</span>
                </div>
                <h3 className={`font-display text-2xl font-bold tracking-tight ${isActive ? "text-white" : "text-[#111827]"}`}>{r.title}</h3>
                <p className={`text-sm leading-relaxed mt-3 ${isActive ? "text-gray-300" : "text-gray-600"}`}>{r.desc}</p>
                <div className={`mt-6 inline-flex items-center gap-1.5 text-sm font-medium ${isActive ? "text-[#60A5FA]" : "text-[#002FA7]"}`}>
                  {isActive ? "Showing below" : "Open"} <ArrowUpRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* CONTENT */}
      <section ref={contentRef} className="py-16 lg:py-20 bg-[#F3F4F6] border-y border-gray-200" data-testid="resource-content">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          {active === "tips" && (
            <div data-testid="content-tips">
              <div className="overline text-[#002FA7] mb-3">// Candidate Interview Tips</div>
              <h2 className="font-display text-3xl lg:text-5xl font-bold tracking-tighter text-[#111827] max-w-3xl">
                Six quick wins for a great interview.
              </h2>
              <p className="mt-4 text-gray-600 max-w-2xl leading-relaxed">
                Most strong candidates lose points to setup, not skill. These six tips fix 90% of the issues we see in transcripts.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 mt-12 border-t border-l border-gray-900">
                {TIPS.map((t, i) => (
                  <div key={i} className="border-r border-b border-gray-900 p-7 bg-white hover:bg-[#002FA7]/[0.03] transition-colors group" data-testid={`tip-${i}`}>
                    <div className="w-11 h-11 flex items-center justify-center border-2 border-[#002FA7] text-[#002FA7] group-hover:bg-[#002FA7] group-hover:text-white transition-colors">
                      <t.Icon className="w-5 h-5" strokeWidth={1.8} />
                    </div>
                    <div className="overline text-gray-400 mt-5">Tip {String(i + 1).padStart(2, "0")}</div>
                    <h3 className="font-display text-xl font-bold mt-1 tracking-tight text-[#111827]">{t.title}</h3>
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed">{t.body}</p>
                  </div>
                ))}
              </div>
              <div className="mt-12 bg-[#111827] text-white p-7 lg:p-8 border-2 border-[#111827] shadow-[6px_6px_0_0_rgba(0,47,167,1)] flex flex-wrap items-center justify-between gap-6" data-testid="tips-cta">
                <div className="max-w-lg">
                  <div className="overline text-[#60A5FA] mb-2">Ready when you are</div>
                  <h3 className="font-display text-2xl font-bold tracking-tight">Got an interview code?</h3>
                  <p className="text-gray-300 text-sm mt-2">Head back to the home page and paste your code to join.</p>
                </div>
                <Link to="/" className="bg-[#60A5FA] text-[#111827] px-5 py-3 font-medium inline-flex items-center gap-2 hover:bg-white transition-colors" data-testid="tips-go-home">
                  Join interview <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {active === "faqs" && (
            <div data-testid="content-faqs">
              <div className="overline text-[#FF3B30] mb-3">// Candidate FAQs</div>
              <h2 className="font-display text-3xl lg:text-5xl font-bold tracking-tighter text-[#111827] max-w-3xl">
                Common candidate questions.
              </h2>
              <p className="mt-4 text-gray-600 max-w-2xl leading-relaxed">
                If your question isn't here, the Help Center can route it to a real human within minutes.
              </p>
              <div className="mt-12 border-t-2 border-gray-900 bg-white">
                {FAQS.map((item, i) => (
                  <div key={i} className="border-b-2 border-gray-900" data-testid={`cfaq-item-${i}`}>
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                      className="w-full px-6 py-5 flex items-start justify-between gap-6 text-left group"
                      data-testid={`cfaq-toggle-${i}`}
                      aria-expanded={openFaq === i}
                    >
                      <span className="font-display text-base lg:text-lg font-bold tracking-tight text-[#111827] group-hover:text-[#002FA7] transition-colors">
                        {item.q}
                      </span>
                      <div className="shrink-0 w-8 h-8 flex items-center justify-center border-2 border-gray-900 bg-white group-hover:bg-[#002FA7] group-hover:text-white transition-colors">
                        {openFaq === i ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </div>
                    </button>
                    {openFaq === i && (
                      <div className="px-6 pb-5 pr-14 text-sm text-gray-700 leading-relaxed fade-up" data-testid={`cfaq-answer-${i}`}>
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "help" && (
            <div data-testid="content-help">
              <div className="overline text-[#002FA7] mb-3">// Candidate Help Center</div>
              <h2 className="font-display text-3xl lg:text-5xl font-bold tracking-tighter text-[#111827] max-w-3xl">
                We're here to help.
              </h2>
              <p className="mt-4 text-gray-600 max-w-2xl leading-relaxed">
                Most issues are fixed in under 10 minutes. Pick the channel that suits you.
              </p>
              <div className="grid md:grid-cols-2 gap-6 mt-12">
                {[
                  {
                    Icon: Mail, title: "Email support",
                    desc: "Best for non-urgent questions or when you want a written reply.",
                    cta: "support@scorebar.ai",
                    href: "mailto:support@scorebar.ai",
                    accent: "#002FA7",
                  },
                  {
                    Icon: MessageSquare, title: "Live chat",
                    desc: "Fastest path to a human — Mon–Fri, 9am to 6pm CET.",
                    cta: "Start a chat",
                    href: "/contact",
                    accent: "#FF3B30",
                  },
                ].map((c, i) => (
                  <div key={i} className="card-bold bg-white p-7" data-testid={`help-channel-${i}`}>
                    <div className="w-11 h-11 flex items-center justify-center text-white" style={{ background: c.accent }}>
                      <c.Icon className="w-5 h-5" strokeWidth={1.8} />
                    </div>
                    <h3 className="font-display text-2xl font-bold tracking-tight mt-5 text-[#111827]">{c.title}</h3>
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed">{c.desc}</p>
                    <a href={c.href} className="btn-primary inline-flex items-center gap-2 mt-6" data-testid={`help-cta-${i}`}>
                      {c.cta} <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>

              <div className="mt-10 bg-white border-2 border-gray-900 p-7" data-testid="quick-fixes">
                <div className="overline text-gray-500 mb-4">// Quick fixes</div>
                <ul className="grid md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  {[
                    "Mic not detected? Refresh the page and click 'Allow' on the browser prompt.",
                    "Camera black? Close other apps using the camera (Zoom, Teams, FaceTime).",
                    "Audio echo? Use headphones — laptop speakers create feedback into the mic.",
                    "Code not working? Codes are case-insensitive but must include the dashes.",
                    "Page won't load? Try Chrome or Edge in a non-private window.",
                    "Recording stuck? Reload — answers are saved server-side, you won't lose progress.",
                  ].map((tip, i) => (
                    <li key={i} className="flex gap-2 items-start text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-[#10B981] mt-0.5 shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CONTACT BANNER */}
      <section className="px-6 sm:px-8 lg:px-12 py-20" data-testid="resources-cta-banner">
        <div className="max-w-7xl mx-auto relative overflow-hidden border-2 border-[#002FA7] shadow-[8px_8px_0_0_rgba(17,24,39,1)]">
          <div className="absolute inset-0 bg-gradient-to-b from-[#60A5FA] via-[#3B82F6] to-[#002FA7]" />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 35%), radial-gradient(circle at 75% 65%, rgba(255,255,255,0.35) 0%, transparent 40%)",
            }}
          />
          <div className="relative px-6 sm:px-12 py-16 lg:py-20 text-center text-white">
            <div className="overline text-white/80 mb-3">SCOREBAR AI</div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter">
              Still stuck? We've got you covered.
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/contact" className="bg-white text-[#002FA7] px-6 py-3 font-medium inline-flex items-center gap-2 hover:bg-[#F3F4F6] shadow-[4px_4px_0_0_rgba(17,24,39,0.5)] hover:shadow-[2px_2px_0_0_rgba(17,24,39,0.5)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all" data-testid="banner-contact">
                Talk to support <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/" className="bg-transparent text-white border-2 border-white px-6 py-3 font-medium inline-flex items-center gap-2 hover:bg-white hover:text-[#002FA7] transition-colors" data-testid="banner-home">
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
