import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { ArrowRight, Clock } from "lucide-react";

const POSTS = [
  { tag: "Hiring Science", title: "Why 4-round phone screens are the slowest kind of bias", read: "7 min read", date: "Jan 10, 2026", color: "#002FA7" },
  { tag: "Product", title: "Introducing the 5-dimension rubric — evidence baked in", read: "5 min read", date: "Dec 14, 2025", color: "#FF3B30" },
  { tag: "Engineering", title: "How we stream Whisper transcription under 800ms", read: "9 min read", date: "Nov 28, 2025", color: "#111827" },
  { tag: "Playbook", title: "Writing interview questions candidates actually want to answer", read: "6 min read", date: "Nov 02, 2025", color: "#002FA7" },
];

export default function Blog() {
  return (
    <div className="bg-white">
      <Navbar />
      <section className="border-b border-gray-200 py-20 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 grid-pattern opacity-60" />
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="overline text-[#002FA7] mb-4">// Blog</div>
          <h1 className="font-display text-4xl lg:text-6xl font-bold leading-[0.95] tracking-tighter text-[#111827]">
            Insights on <span className="text-[#002FA7]">modern hiring.</span>
          </h1>
          <p className="mt-5 text-gray-600 max-w-2xl leading-relaxed">Playbooks, product updates, and engineering notes from the Scorebar team.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 grid md:grid-cols-2 gap-6">
          {POSTS.map((p, i) => (
            <article key={i} className="card-flat border-2 border-gray-900 p-7 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,47,167,1)] transition-all duration-300 cursor-pointer" data-testid={`post-${i}`}>
              <div className="overline mb-4" style={{ color: p.color }}>{p.tag}</div>
              <h3 className="font-display text-2xl font-bold tracking-tight text-[#111827]">{p.title}</h3>
              <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                <span>{p.date}</span>
                <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{p.read}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 mt-16 text-center">
          <Link to="/contact" className="btn-secondary inline-flex items-center gap-2">
            Subscribe for updates <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
