import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { ArrowRight, Briefcase, MapPin, Clock, Sparkles } from "lucide-react";

const ROLES = [
  { title: "Senior Full-Stack Engineer", team: "Engineering", location: "Remote · EU/US", type: "Full-time" },
  { title: "ML Engineer — LLM Scoring", team: "AI", location: "Remote · Global", type: "Full-time" },
  { title: "Product Designer", team: "Design", location: "Remote · Europe", type: "Full-time" },
  { title: "Enterprise Account Executive", team: "GTM", location: "London / NYC", type: "Full-time" },
  { title: "Customer Success Manager", team: "Customer", location: "Remote · Americas", type: "Full-time" },
  { title: "Content Lead", team: "Marketing", location: "Remote · EU", type: "Contract" },
];

export default function Careers() {
  return (
    <div className="bg-white">
      <Navbar />
      <section className="border-b border-gray-200 py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 grid-pattern opacity-60" />
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-[#FF3B30] bg-[#FF3B30]/5 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#FF3B30]" strokeWidth={2.4} />
            <span className="overline text-[#FF3B30]">We're hiring — {ROLES.length} open roles</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold leading-[0.95] tracking-tighter text-[#111827]">
            Build the future of<br /><span className="text-[#002FA7]">fair hiring.</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl leading-relaxed">
            Scorebar is a small, remote-first team building the interview layer of modern hiring. We ship weekly, we write a lot, and we care deeply about building tools humans trust.
          </p>
        </div>
      </section>

      <section className="py-20 lg:py-24">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="overline text-[#002FA7] mb-3">// Open positions</div>
          <h2 className="font-display text-3xl lg:text-4xl font-bold tracking-tighter text-[#111827] mb-10">Join our team.</h2>
          <div className="border-t-2 border-gray-900" data-testid="roles-list">
            {ROLES.map((r, i) => (
              <div key={i} className="border-b-2 border-gray-900 py-6 flex flex-wrap items-center justify-between gap-4 group hover:bg-[#F3F4F6] px-4 -mx-4 transition-colors" data-testid={`role-${i}`}>
                <div>
                  <div className="overline text-[#002FA7] mb-1">{r.team}</div>
                  <h3 className="font-display text-xl lg:text-2xl font-bold tracking-tight text-[#111827] group-hover:text-[#002FA7] transition-colors">{r.title}</h3>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{r.location}</span>
                    <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{r.type}</span>
                  </div>
                </div>
                <a href={`mailto:careers@scorebar.ai?subject=Application: ${r.title}`} className="btn-secondary inline-flex items-center gap-2 text-sm" data-testid={`apply-${i}`}>
                  Apply <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>

          <div className="mt-16 border-2 border-gray-900 p-8 bg-[#111827] text-white shadow-[8px_8px_0_0_rgba(0,47,167,1)]" data-testid="no-match-cta">
            <Briefcase className="w-7 h-7 text-[#60A5FA]" strokeWidth={1.6} />
            <h3 className="font-display text-2xl font-bold tracking-tight mt-4">Don't see your role?</h3>
            <p className="text-gray-300 mt-3 max-w-xl">We're always open to exceptional people. Send us a note — tell us what you'd like to build.</p>
            <a href="mailto:careers@scorebar.ai" className="mt-5 inline-flex items-center gap-2 bg-[#60A5FA] text-[#111827] px-5 py-3 font-medium hover:bg-white transition-colors">
              Email careers@scorebar.ai <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
