import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { ArrowRight, Target, Shield, Users, Sparkles } from "lucide-react";

export default function About() {
  return (
    <div className="bg-white">
      <Navbar />
      <section className="border-b border-gray-200 py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 grid-pattern opacity-60" />
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="overline text-[#002FA7] mb-4">// About us</div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold leading-[0.95] tracking-tighter text-[#111827]">
            Interviews that<br /><span className="text-[#002FA7]">respect everyone's time.</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl leading-relaxed">
            Scorebar started because hiring felt broken on both sides — candidates were waiting weeks for feedback, HR teams were drowning in unstructured phone screens. We built a tool that gives both sides what they want: structure, speed, and fairness.
          </p>
        </div>
      </section>

      <section className="py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 grid md:grid-cols-3 gap-0 border-t border-l border-gray-900">
          {[
            { icon: Target, title: "Evidence over intuition", body: "Every score we generate cites transcript evidence. Gut-feel hiring is the slowest kind of bias." },
            { icon: Shield, title: "Candidate-first", body: "Interviews run in-browser, with clear device checks and fast decisions. No spam, no ghosting, no account traps." },
            { icon: Users, title: "Humans decide", body: "Scorebar prepares the case. HR makes the call. We will never ship auto-reject." },
          ].map((v, i) => (
            <div key={i} className="border-r border-b border-gray-900 p-8 hover:bg-[#002FA7]/[0.03] transition-colors" data-testid={`value-${i}`}>
              <v.icon className="w-7 h-7 text-[#002FA7]" strokeWidth={1.6} />
              <h3 className="font-display text-xl font-bold mt-4 tracking-tight">{v.title}</h3>
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 bg-[#F3F4F6] border-y border-gray-200">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <Sparkles className="w-10 h-10 text-[#FF3B30] mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="font-display text-3xl lg:text-5xl font-bold tracking-tighter">Want the short version?</h2>
          <p className="mt-5 text-gray-600 max-w-xl mx-auto leading-relaxed">Try Scorebar for 30 days. Run five real interviews. Decide for yourself.</p>
          <Link to="/signup" className="btn-primary inline-flex items-center gap-2 mt-8" data-testid="about-cta">Start free trial <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </section>
    </div>
  );
}
