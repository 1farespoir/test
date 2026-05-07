import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { Mail, MessageSquare, Phone, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [sending, setSending] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return toast.error("Please fill in all required fields");
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success("Thanks! Our team will reach out within 1 business day.");
      setForm({ name: "", email: "", company: "", message: "" });
    }, 900);
  };

  return (
    <div className="bg-white">
      <Navbar />
      <section className="border-b border-gray-200 py-20 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 grid-pattern opacity-60" />
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 grid lg:grid-cols-2 gap-16">
          <div>
            <div className="overline text-[#FF3B30] mb-4">// Contact</div>
            <h1 className="font-display text-4xl lg:text-6xl font-bold leading-[0.95] tracking-tighter text-[#111827]">
              Let's talk <span className="text-[#002FA7]">hiring.</span>
            </h1>
            <p className="mt-6 text-gray-600 leading-relaxed max-w-lg">
              Tell us about your team and we'll show you how Scorebar fits in. Most sales calls take 20 minutes.
            </p>
            <div className="mt-10 space-y-5">
              {[
                { Icon: Mail, label: "Email", value: "hello@scorebar.ai", href: "mailto:hello@scorebar.ai" },
                { Icon: MessageSquare, label: "Sales", value: "sales@scorebar.ai", href: "mailto:sales@scorebar.ai" },
                { Icon: Phone, label: "Support hours", value: "Mon–Fri · 9am–6pm CET", href: null },
              ].map((c, i) => (
                <div key={i} className="flex items-start gap-4" data-testid={`contact-method-${i}`}>
                  <div className="w-10 h-10 flex items-center justify-center border-2 border-gray-900 bg-white">
                    <c.Icon className="w-4 h-4 text-[#002FA7]" strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="overline text-gray-500 mb-0.5">{c.label}</div>
                    {c.href
                      ? <a href={c.href} className="font-medium text-[#111827] hover:text-[#002FA7]">{c.value}</a>
                      : <div className="font-medium text-[#111827]">{c.value}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={submit} className="card-bold bg-white p-7 lg:p-9" data-testid="contact-form">
            <div className="overline text-[#002FA7] mb-6">// Send us a note</div>
            <div className="space-y-4">
              <div>
                <label className="overline block mb-2">Name *</label>
                <input data-testid="contact-name" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} className="w-full border-2 border-gray-900 px-4 py-3 text-sm focus:outline-none focus:border-[#002FA7]" />
              </div>
              <div>
                <label className="overline block mb-2">Work email *</label>
                <input data-testid="contact-email" type="email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} className="w-full border-2 border-gray-900 px-4 py-3 text-sm focus:outline-none focus:border-[#002FA7]" />
              </div>
              <div>
                <label className="overline block mb-2">Company</label>
                <input data-testid="contact-company" value={form.company} onChange={(e)=>setForm({...form, company:e.target.value})} className="w-full border-2 border-gray-900 px-4 py-3 text-sm focus:outline-none focus:border-[#002FA7]" />
              </div>
              <div>
                <label className="overline block mb-2">How can we help? *</label>
                <textarea data-testid="contact-message" rows={5} value={form.message} onChange={(e)=>setForm({...form, message:e.target.value})} className="w-full border-2 border-gray-900 px-4 py-3 text-sm focus:outline-none focus:border-[#002FA7] resize-none" />
              </div>
              <button disabled={sending} className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-60" data-testid="contact-submit">
                {sending ? "Sending..." : <>Send message <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
