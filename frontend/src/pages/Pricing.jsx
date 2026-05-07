import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../lib/api";
import { Check, Plus, Minus, ArrowRight, Sparkles, Shield, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

const INDIA_CC = ["IN", "in"];

const FAQS = [
  { q: "Can I start with the Free plan?", a: "Yes — the Free plan gives you 5 interviews over 30 days with basic AI scoring and 1 team seat. No credit card required." },
  { q: "What's the difference between Starter, Professional and Enterprise?", a: "Starter is for small teams (20 interviews/mo, 2 seats). Professional adds advanced AI + voice interviews, 100 interviews/mo and 5 seats. Enterprise removes all limits, adds white-label, SSO and a dedicated CSM." },
  { q: "Can I add team members?", a: "Yes. Team seats are included in every paid plan: 2 on Starter, 5 on Professional, unlimited on Enterprise. Each teammate gets their own login but shares the workspace and interview quota." },
  { q: "Is there a discount for paying yearly?", a: "Yes — yearly billing saves you 20% on Starter and Professional plans. You can switch from monthly to yearly anytime." },
  { q: "Can I cancel my plan anytime?", a: "Absolutely. Cancel from the dashboard at any time; you keep access until the end of the current billing period and we won't charge again." },
  { q: "Do candidates need to pay or sign up?", a: "Never. Candidates only need an interview code. No accounts, no installs — just a 30-second device check before the interview begins." },
];

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [currency, setCurrency] = useState("USD");
  const [billing, setBilling] = useState("yearly");
  const [openFaq, setOpenFaq] = useState(0);
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
        if (tz.startsWith("Asia/Kolkata") || tz.startsWith("Asia/Calcutta") || INDIA_CC.includes(navigator.language?.slice(-2))) setCurrency("INR");
      } catch {}
      try {
        const { data } = await api.get("/plans");
        setPlans(data.plans || []);
      } catch (e) {
        toast.error("Couldn't load pricing. Please refresh.");
        setPlans([]);
      }
    })();
  }, []);

  const upgrade = async (plan) => {
    if (plan.id === "free") { navigate("/signup"); return; }
    if (plan.id === "enterprise") { navigate("/contact"); return; }
    if (!user) { navigate("/login"); return; }
    try {
      const { data } = await api.post("/payments/create-order", { plan: plan.id, billing });
      toast("Mocked payment success — Razorpay keys not yet configured");
      await api.post("/payments/verify", { plan: plan.id, billing });
      await checkAuth();
      toast.success(`Upgraded to ${plan.name}`);
    } catch (e) {
      toast.error("Payment failed");
    }
  };

  const fmtPrice = (p) => {
    if (p.id === "enterprise") return "Custom";
    if (p.id === "free") return currency === "INR" ? "₹0" : "$0";
    const usd = billing === "yearly" ? p.price_usd_yearly : p.price_usd_monthly;
    const inr = billing === "yearly" ? p.price_inr_yearly : p.price_inr_monthly;
    return currency === "INR" ? `₹${inr.toLocaleString("en-IN")}` : `$${usd.toFixed(2)}`;
  };

  const fmtPeriod = (p) => {
    if (p.id === "enterprise") return "billed annually";
    if (p.id === "free") return "30-day trial";
    return billing === "yearly" ? "/year" : "/month";
  };

  const ctaLabel = (p) => {
    if (p.id === "free") return "Start free";
    if (p.id === "enterprise") return "Contact sales";
    return user?.plan === p.id ? "Current plan" : `Get ${p.name}`;
  };

  return (
    <div className="bg-white">
      <Navbar />

      {/* HERO */}
      <section className="pt-20 lg:pt-28 pb-12 relative overflow-hidden" data-testid="pricing-hero">
        <div className="absolute inset-0 -z-10 grid-pattern opacity-50" />
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-[#002FA7] bg-[#002FA7]/5 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#002FA7]" strokeWidth={2.4} />
            <span className="overline text-[#002FA7]">// Pricing</span>
          </div>
          <h1 className="font-display tracking-tighter">
            <span className="block text-[#002FA7] text-4xl sm:text-5xl lg:text-7xl font-bold leading-[0.95]">Simple pricing.</span>
            <span className="block text-[#111827] text-4xl sm:text-5xl lg:text-7xl font-bold leading-[0.95] mt-1">Real interviews.</span>
          </h1>
          <p className="mt-6 text-base lg:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Start free, scale with your team. Every paid plan includes team seats, evidence-based AI scoring, and unlimited candidates.
          </p>

          {/* Billing toggle */}
          <div className="mt-10 inline-flex items-center bg-white border-2 border-gray-900 p-1 shadow-[4px_4px_0_0_rgba(17,24,39,1)]" data-testid="billing-toggle">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2 text-sm font-medium transition-colors ${billing === "monthly" ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-50"}`}
              data-testid="billing-monthly"
            >Monthly</button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-5 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${billing === "yearly" ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-50"}`}
              data-testid="billing-yearly"
            >
              Yearly
              <span className={`overline px-2 py-0.5 ${billing === "yearly" ? "bg-[#FF3B30] text-white" : "bg-[#FF3B30]/10 text-[#FF3B30]"}`}>−20%</span>
            </button>
          </div>

          <div className="mt-5 text-xs text-gray-500">
            <button data-testid="currency-toggle" onClick={() => setCurrency(currency === "USD" ? "INR" : "USD")} className="underline hover:text-gray-900">
              Switch to {currency === "USD" ? "INR" : "USD"}
            </button>
          </div>
        </div>
      </section>

      {/* PLAN CARDS */}
      <section className="py-12" data-testid="plan-cards">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((p) => {
              const featured = p.highlight;
              return (
                <article
                  key={p.id}
                  className={`relative border-2 p-6 lg:p-7 flex flex-col transition-all duration-300 ${
                    featured
                      ? "bg-[#111827] text-white border-[#111827] shadow-[8px_8px_0_0_rgba(0,47,167,1)] lg:-translate-y-2"
                      : "bg-white border-gray-900 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(17,24,39,1)]"
                  }`}
                  data-testid={`plan-card-${p.id}`}
                >
                  {featured && (
                    <div className="absolute -top-3 left-6 bg-[#FF3B30] text-white overline px-3 py-1" data-testid="popular-badge">★ Most Popular</div>
                  )}
                  <div className={`overline mb-2 ${featured ? "text-[#60A5FA]" : "text-[#002FA7]"}`}>{p.name}</div>
                  <p className={`text-xs mb-5 ${featured ? "text-gray-300" : "text-gray-500"}`}>{p.tagline}</p>

                  <div className="flex items-baseline gap-1">
                    <span className={`font-display font-bold tracking-tighter ${p.id === "enterprise" ? "text-3xl lg:text-4xl" : "text-4xl lg:text-5xl"} ${featured ? "text-white" : "text-[#111827]"}`}>
                      {fmtPrice(p)}
                    </span>
                    {p.id !== "enterprise" && p.id !== "free" && (
                      <span className={`text-sm ${featured ? "text-gray-400" : "text-gray-500"}`}>{fmtPeriod(p)}</span>
                    )}
                    {p.id === "free" && (
                      <span className={`text-sm ${featured ? "text-gray-400" : "text-gray-500"}`}>/{fmtPeriod(p)}</span>
                    )}
                  </div>
                  {p.id !== "enterprise" && p.id !== "free" && billing === "yearly" && (
                    <div className={`text-xs mt-1 ${featured ? "text-[#60A5FA]" : "text-[#10B981]"}`}>Save 20% with yearly billing</div>
                  )}
                  {p.id === "enterprise" && (
                    <div className={`text-xs mt-1 ${featured ? "text-gray-400" : "text-gray-500"}`}>Tailored to your scale</div>
                  )}

                  <ul className="mt-6 space-y-2.5 flex-1">
                    {p.features.map((f, i) => (
                      <li key={i} className={`flex items-start gap-2 text-sm ${featured ? "text-gray-200" : "text-gray-700"}`}>
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${featured ? "text-[#60A5FA]" : "text-[#10B981]"}`} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => upgrade(p)}
                    disabled={user?.plan === p.id && p.id !== "enterprise" && p.id !== "free"}
                    className={`mt-7 inline-flex items-center justify-center gap-2 py-3 px-5 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      featured
                        ? "bg-[#60A5FA] text-[#111827] hover:bg-white shadow-[4px_4px_0_0_rgba(255,255,255,0.15)] hover:shadow-[2px_2px_0_0_rgba(255,255,255,0.2)] hover:translate-x-[2px] hover:translate-y-[2px]"
                        : "btn-primary"
                    }`}
                    data-testid={`select-plan-${p.id}`}
                  >
                    {ctaLabel(p)} <ArrowRight className="w-4 h-4" />
                  </button>
                </article>
              );
            })}
          </div>
          <p className="mt-10 text-center text-xs text-gray-500" data-testid="payment-note">
            Razorpay (INR) and international card payments — currently in <span className="font-medium">MOCK</span> mode. Production keys can be plugged in later.
          </p>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="py-14 bg-[#F3F4F6] border-y border-gray-200" data-testid="trust-strip">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 grid md:grid-cols-3 gap-0 border-l border-t border-gray-300">
          {[
            { Icon: Shield, title: "Secure & private", desc: "GDPR-ready, SOC 2 aligned. Candidate data encrypted in transit and at rest." },
            { Icon: Users, title: "Team seats included", desc: "Invite teammates on every paid plan. Shared workspace, separate logins." },
            { Icon: Zap, title: "Cancel anytime", desc: "Switch tiers, change billing, or cancel — all from your dashboard." },
          ].map((t, i) => (
            <div key={i} className="border-r border-b border-gray-300 p-7 bg-white" data-testid={`trust-${i}`}>
              <t.Icon className="w-6 h-6 text-[#002FA7]" strokeWidth={1.6} />
              <h3 className="font-display text-lg font-bold mt-3 tracking-tight text-[#111827]">{t.title}</h3>
              <p className="text-sm text-gray-600 mt-2">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-24" data-testid="pricing-faq">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <div className="overline text-[#002FA7] mb-3">// Frequently asked</div>
            <h2 className="font-display text-3xl lg:text-5xl font-bold tracking-tighter text-[#111827]">
              Got questions?<br />We've got answers.
            </h2>
            <p className="mt-5 text-gray-600 text-sm leading-relaxed">
              Can't find what you need? <Link to="/contact" className="text-[#002FA7] font-medium hover:underline">Talk to our team →</Link>
            </p>
          </div>
          <div className="lg:col-span-8 border-t-2 border-gray-900">
            {FAQS.map((item, i) => (
              <div key={i} className="border-b-2 border-gray-900" data-testid={`pfaq-item-${i}`}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  className="w-full py-5 flex items-start justify-between gap-6 text-left group"
                  data-testid={`pfaq-toggle-${i}`}
                  aria-expanded={openFaq === i}
                >
                  <span className="font-display text-lg font-bold tracking-tight text-[#111827] group-hover:text-[#002FA7] transition-colors">
                    {item.q}
                  </span>
                  <div className="shrink-0 w-8 h-8 flex items-center justify-center border-2 border-gray-900 bg-white group-hover:bg-[#002FA7] group-hover:text-white transition-colors">
                    {openFaq === i ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>
                {openFaq === i && (
                  <div className="pb-5 pr-12 text-sm text-gray-600 leading-relaxed fade-up" data-testid={`pfaq-answer-${i}`}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="px-6 sm:px-8 lg:px-12 pb-20" data-testid="pricing-cta-banner">
        <div className="max-w-7xl mx-auto relative overflow-hidden border-2 border-[#002FA7] shadow-[8px_8px_0_0_rgba(17,24,39,1)]">
          {/* gradient sky */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#60A5FA] via-[#3B82F6] to-[#002FA7]" />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 35%), radial-gradient(circle at 75% 65%, rgba(255,255,255,0.35) 0%, transparent 40%), radial-gradient(circle at 50% 90%, rgba(255,255,255,0.25) 0%, transparent 30%)",
            }}
          />
          <div className="relative px-6 sm:px-12 py-20 lg:py-28 text-center text-white">
            <div className="overline text-white/80 mb-3">SCOREBAR.AI</div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter">
              Your next great hire<br />starts with Scorebar.
            </h2>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                to="/signup"
                className="bg-white text-[#002FA7] px-6 py-3 font-medium inline-flex items-center gap-2 hover:bg-[#F3F4F6] shadow-[4px_4px_0_0_rgba(17,24,39,0.5)] hover:shadow-[2px_2px_0_0_rgba(17,24,39,0.5)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                data-testid="cta-banner-start"
              >
                Get started for free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="bg-transparent text-white border-2 border-white px-6 py-3 font-medium inline-flex items-center gap-2 hover:bg-white hover:text-[#002FA7] transition-colors"
                data-testid="cta-banner-contact"
              >
                See how it works
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
