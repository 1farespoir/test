import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import {
  Plus, Link2, Mail, Briefcase, ChevronRight, Users,
  TrendingUp, CheckCircle2, AlertCircle, ArrowUpRight, LifeBuoy, Crown, Calendar, Sparkles,
  ChevronDown, UserPlus, Upload, Share2, BarChart3, X, Download, Archive, Send,
  CheckCheck, XCircle
} from "lucide-react";

const STATUS_LABEL = {
  pending: "Pending", selected: "Selected", next_round: "Next round", not_selected: "Not selected"
};
const STATUS_COLOR = {
  pending: "text-[#F59E0B]", selected: "text-[#10B981]", next_round: "text-[#002FA7]", not_selected: "text-[#FF3B30]"
};

const PLAN_DISPLAY = {
  free: "Free", starter: "Starter", professional: "Professional", enterprise: "Enterprise",
  trial: "Free", pro: "Professional", business: "Enterprise",
};

export default function HRDashboard() {
  const { user, checkAuth } = useAuth();
  const [tab, setTab] = useState("interviews");
  const [interviews, setInterviews] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [team, setTeam] = useState({ members: [], limit: 1, plan: "free" });
  const [loading, setLoading] = useState(true);

  // ---------- Bulk action state (must be declared above any early-return for hooks rule) ----------
  const [selected, setSelected] = useState(new Set());
  const [openCreate, setOpenCreate] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgSubject, setMsgSubject] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const createRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        if (user?.role !== "hr") { await api.post("/auth/role", {role:"hr"}); await checkAuth(); }
        const [a, b, t] = await Promise.all([
          api.get("/interviews"),
          api.get("/jobs"),
          api.get("/team/members").catch(() => ({ data: { members: [], limit: 1, plan: "free" } })),
        ]);
        setInterviews(a.data.interviews || []);
        setJobs(b.data.jobs || []);
        setTeam(t.data || { members: [], limit: 1, plan: "free" });
      } finally { setLoading(false); }
    })();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (createRef.current && !createRef.current.contains(e.target)) setOpenCreate(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return <div className="p-12">Loading…</div>;

  // Plan & quota
  const planKey = user.plan || "free";
  const planLabel = PLAN_DISPLAY[planKey] || planKey.toUpperCase();
  const isUnlimited = planKey === "enterprise" || planKey === "business" || user.interviews_quota === -1;
  const trialExpiry = user.trial_expires_at ? new Date(user.trial_expires_at) : null;
  const daysLeft = trialExpiry ? Math.max(0, Math.ceil((trialExpiry - new Date()) / (1000*60*60*24))) : null;
  const quota = typeof user.interviews_quota === "number" ? user.interviews_quota : null;
  const used = user.interviews_used || 0;
  const remaining = isUnlimited ? "∞" : (quota === null ? null : Math.max(0, quota - used));
  const usagePct = isUnlimited || !quota || quota <= 0 ? 0 : Math.min(100, Math.round((used / quota) * 100));

  // Team
  const seatsUsed = team.members?.length || 1;
  const seatLimit = team.limit ?? 1;
  const seatsLabel = seatLimit === -1 ? "∞" : seatLimit;

  // Interview metrics
  const completed = interviews.filter(i => i.status === "completed").length;
  const pendingReview = interviews.filter(i => i.status === "completed" && (!i.hr_status || i.hr_status === "pending")).length;
  const totalInterviews = interviews.length;

  const isOwner = team.current_user_id && team.current_user_id === team.owner_user_id;

  const toggleRow = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected((prev) => {
      const visibleIds = interviews.map((i) => i.id);
      const allSel = visibleIds.length > 0 && visibleIds.every((id) => prev.has(id));
      return allSel ? new Set() : new Set(visibleIds);
    });
  };
  const clearSel = () => setSelected(new Set());

  const refresh = async () => {
    const a = await api.get("/interviews");
    setInterviews(a.data.interviews || []);
  };

  const bulkStatus = async (hr_status, label) => {
    if (selected.size === 0) return;
    if (!window.confirm(`${label} ${selected.size} candidate${selected.size > 1 ? "s" : ""}? An email will be sent to each.`)) return;
    setBulkBusy(true);
    try {
      const { data } = await api.post("/interviews/bulk-status", {
        interview_ids: Array.from(selected),
        hr_status,
      });
      toast.success(`${label} ${data.updated} candidate${data.updated > 1 ? "s" : ""}`);
      clearSel();
      await refresh();
    } catch (e) { toast.error("Bulk action failed"); }
    finally { setBulkBusy(false); }
  };

  const bulkArchive = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Archive ${selected.size} candidate${selected.size > 1 ? "s" : ""}? They'll be hidden from the active list (no email sent).`)) return;
    setBulkBusy(true);
    try {
      const { data } = await api.post("/interviews/bulk-status", {
        interview_ids: Array.from(selected),
        hr_status: "archived",
      });
      toast.success(`Archived ${data.updated}`);
      clearSel();
      await refresh();
    } catch (e) { toast.error("Archive failed"); }
    finally { setBulkBusy(false); }
  };

  const sendBulkMessage = async () => {
    if (!msgSubject || !msgBody) return toast.error("Subject and message required");
    setBulkBusy(true);
    try {
      const { data } = await api.post("/interviews/bulk-message", {
        interview_ids: Array.from(selected), subject: msgSubject, message: msgBody,
      });
      toast.success(`Message sent to ${data.sent}`);
      setMsgOpen(false); setMsgSubject(""); setMsgBody("");
      clearSel();
    } catch (e) { toast.error("Send failed"); }
    finally { setBulkBusy(false); }
  };

  const exportSelected = () => {
    if (selected.size === 0) return;
    const rows = interviews.filter((i) => selected.has(i.id));
    const headers = ["candidate_name","candidate_email","code","role","interview_type","status","hr_status","overall","created_at"];
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => {
        const v = r[h] ?? "";
        const s = String(v).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
      }).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `scorebar_export_${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(`Exported ${rows.length} row${rows.length > 1 ? "s" : ""}`);
  };

  // Hide archived from main view by default (owner can't unarchive yet, but at least not in the way)
  const visibleInterviews = interviews.filter((i) => i.hr_status !== "archived");
  const allSelected = visibleInterviews.length > 0 && visibleInterviews.every((i) => selected.has(i.id));

  return (
    <div>
      <Navbar/>
      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12" data-testid="hr-dashboard">
        {/* Plan & Usage Banner */}
        <section className="mb-10 bg-[#0B1220] text-white border-2 border-[#0B1220] shadow-[8px_8px_0_0_rgba(0,47,167,1)]" data-testid="trial-banner">
          {/* Top row: plan ribbon + actions */}
          <div className="px-7 py-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="inline-flex items-center gap-2 bg-[#FF3B30] text-white px-3 py-1.5 overline">
                <Crown className="w-3.5 h-3.5" strokeWidth={2.4}/> {planLabel} plan
              </div>
              {trialExpiry && (
                <div className="inline-flex items-center gap-1.5 text-xs text-gray-300">
                  <Calendar className="w-3.5 h-3.5"/> Trial expires in <span className="font-medium text-white">{daysLeft} days</span> · {trialExpiry.toLocaleDateString()}
                </div>
              )}
              {!trialExpiry && user.billing_cycle && (
                <div className="inline-flex items-center gap-1.5 text-xs text-gray-300">
                  <Calendar className="w-3.5 h-3.5"/> Billing: <span className="font-medium text-white capitalize">{user.billing_cycle}</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/contact"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-white/20 text-white hover:bg-white/10 transition-colors"
                data-testid="banner-talk-support"
              >
                <LifeBuoy className="w-3.5 h-3.5"/> Talk to support
              </a>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-white text-[#0B1220] font-medium hover:bg-[#60A5FA] hover:text-white transition-colors"
                data-testid="upgrade-button"
              >
                <Sparkles className="w-3.5 h-3.5"/> {isUnlimited ? "Manage plan" : "Upgrade"} <ArrowUpRight className="w-3.5 h-3.5"/>
              </Link>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-y lg:divide-y-0 divide-white/10">
            {/* Interviews remaining */}
            <div className="p-6 lg:p-7" data-testid="stat-interviews-remaining">
              <div className="flex items-center justify-between mb-3">
                <span className="overline text-[#60A5FA]">Interviews left</span>
                <TrendingUp className="w-4 h-4 text-[#60A5FA]"/>
              </div>
              <div className="font-display text-4xl lg:text-5xl font-bold tracking-tighter">
                {remaining ?? "—"}
                {!isUnlimited && quota !== null && (
                  <span className="text-base text-gray-400 font-mono ml-2">/ {quota}</span>
                )}
              </div>
              {!isUnlimited && quota > 0 && (
                <div className="mt-4">
                  <div className="h-1.5 bg-white/10 overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${100 - usagePct}%`,
                        background: usagePct > 80 ? "#FF3B30" : usagePct > 50 ? "#F59E0B" : "#10B981",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400 mt-1.5">
                    <span>{used} used</span>
                    <span>{usagePct}% consumed</span>
                  </div>
                </div>
              )}
              {isUnlimited && <div className="text-xs text-gray-400 mt-1">Unlimited on your plan</div>}
            </div>

            {/* Team members */}
            <div className="p-6 lg:p-7" data-testid="stat-team-members">
              <div className="flex items-center justify-between mb-3">
                <span className="overline text-[#60A5FA]">Team members</span>
                <Users className="w-4 h-4 text-[#60A5FA]"/>
              </div>
              <div className="font-display text-4xl lg:text-5xl font-bold tracking-tighter">
                {seatsUsed}<span className="text-base text-gray-400 font-mono ml-2">/ {seatsLabel}</span>
              </div>
              <Link
                to="/hr/team"
                className="mt-3 inline-flex items-center gap-1 text-xs text-[#60A5FA] hover:text-white transition-colors"
                data-testid="banner-manage-team"
              >
                {isOwner ? "Manage team" : "View team"} <ChevronRight className="w-3 h-3"/>
              </Link>
            </div>

            {/* Pending reviews */}
            <div className="p-6 lg:p-7" data-testid="stat-pending-reviews">
              <div className="flex items-center justify-between mb-3">
                <span className="overline text-[#60A5FA]">Pending reviews</span>
                <AlertCircle className={`w-4 h-4 ${pendingReview > 0 ? "text-[#F59E0B]" : "text-[#60A5FA]"}`}/>
              </div>
              <div className="font-display text-4xl lg:text-5xl font-bold tracking-tighter">
                {pendingReview}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {pendingReview === 0 ? "All caught up." : "Awaiting your decision."}
              </div>
            </div>

            {/* Completed (lifetime) */}
            <div className="p-6 lg:p-7" data-testid="stat-completed">
              <div className="flex items-center justify-between mb-3">
                <span className="overline text-[#60A5FA]">Completed</span>
                <CheckCircle2 className="w-4 h-4 text-[#10B981]"/>
              </div>
              <div className="font-display text-4xl lg:text-5xl font-bold tracking-tighter">
                {completed}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                of {totalInterviews} total invites
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div>
            <div className="overline text-[#FF3B30] mb-3">// HR CONTROL ROOM</div>
            <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tighter">Hello, {user.name.split(" ")[0]}.</h1>
            <p className="text-gray-600 mt-3 text-sm">Plan: <span className="font-medium">{planLabel}</span> · Interviews used: <span className="font-mono">{used}</span> · Team: <span className="font-mono">{seatsUsed}/{seatsLabel}</span></p>
          </div>
          <div className="flex gap-3 flex-wrap relative">
            {/* New Interview dropdown */}
            <div ref={createRef} className="relative">
              <button
                onClick={() => setOpenCreate((v) => !v)}
                className="btn-primary inline-flex items-center gap-2"
                data-testid="create-invite-button"
                aria-expanded={openCreate}
              >
                <Plus className="w-4 h-4"/> New interview
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openCreate ? "rotate-180" : ""}`}/>
              </button>
              {openCreate && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border-2 border-gray-900 shadow-[6px_6px_0_0_rgba(17,24,39,1)] z-50" data-testid="create-menu">
                  <Link to="/hr/create-invite" className="block px-5 py-3 text-sm hover:bg-gray-50 border-b border-gray-200 group" data-testid="menu-single-candidate">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 flex items-center justify-center bg-[#002FA7] text-white shrink-0">
                        <UserPlus className="w-4 h-4" strokeWidth={2}/>
                      </div>
                      <div>
                        <div className="font-medium text-[#111827] group-hover:text-[#002FA7]">Single candidate</div>
                        <div className="text-xs text-gray-500 mt-0.5">Interview 1 person</div>
                      </div>
                    </div>
                  </Link>
                  <Link to="/hr/bulk-invite" className="block px-5 py-3 text-sm hover:bg-gray-50 border-b border-gray-200 group" data-testid="menu-bulk-upload">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 flex items-center justify-center bg-[#FF3B30] text-white shrink-0">
                        <Upload className="w-4 h-4" strokeWidth={2}/>
                      </div>
                      <div>
                        <div className="font-medium text-[#111827] group-hover:text-[#FF3B30]">Bulk upload <span className="overline text-[#10B981] ml-1">CSV</span></div>
                        <div className="text-xs text-gray-500 mt-0.5">Import multiple candidates at once</div>
                      </div>
                    </div>
                  </Link>
                  <Link to="/hr/create-job" className="block px-5 py-3 text-sm hover:bg-gray-50 group" data-testid="menu-job-posting">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 flex items-center justify-center bg-[#111827] text-white shrink-0">
                        <Share2 className="w-4 h-4" strokeWidth={2}/>
                      </div>
                      <div>
                        <div className="font-medium text-[#111827] group-hover:text-[#111827]">Job posting</div>
                        <div className="text-xs text-gray-500 mt-0.5">Create a public shareable link</div>
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            <Link to="/hr/create-job" className="btn-secondary inline-flex items-center gap-2" data-testid="create-job-button"><Link2 className="w-4 h-4"/> Shareable link</Link>
            <Link to="/hr/team" className="btn-secondary inline-flex items-center gap-2" data-testid="team-settings-button"><Users className="w-4 h-4"/> Team</Link>
            <Link to="/hr/analytics" className="btn-secondary inline-flex items-center gap-2" data-testid="analytics-button"><BarChart3 className="w-4 h-4"/> Analytics</Link>
          </div>
        </div>

        <div className="inline-flex border-2 border-gray-900 mb-8">
          {[{k:"interviews",l:"Interviews"},{k:"jobs",l:"Job postings"}].map((t,i)=>(
            <button key={t.k} onClick={()=>setTab(t.k)} className={`px-5 py-2 text-sm ${tab===t.k?"bg-gray-900 text-white":"bg-white"} ${i>0?"border-l-2 border-gray-900":""}`} data-testid={`tab-${t.k}`}>{t.l}</button>
          ))}
        </div>

        {/* Bulk action bar (sticky when items selected) */}
        {selected.size > 0 && (
          <div className="sticky top-[64px] z-40 mb-4 bg-[#0B1220] text-white border-2 border-[#0B1220] shadow-[6px_6px_0_0_rgba(0,47,167,1)]" data-testid="bulk-action-bar">
            <div className="px-5 py-3 flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
                <button onClick={clearSel} className="w-7 h-7 flex items-center justify-center border border-white/20 hover:bg-white/10 transition-colors" data-testid="bulk-clear" aria-label="Clear selection">
                  <X className="w-3.5 h-3.5"/>
                </button>
                <span className="text-sm">
                  Selected: <span className="font-display font-bold text-[#60A5FA]" data-testid="bulk-count">{selected.size}</span> candidate{selected.size > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => bulkStatus("selected", "Accept")} disabled={bulkBusy} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-[#10B981] text-white hover:bg-[#059669] disabled:opacity-50 transition-colors" data-testid="bulk-accept">
                  <CheckCheck className="w-3.5 h-3.5"/> Accept all
                </button>
                <button onClick={() => bulkStatus("not_selected", "Reject")} disabled={bulkBusy} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-[#FF3B30] text-white hover:bg-[#DC2626] disabled:opacity-50 transition-colors" data-testid="bulk-reject">
                  <XCircle className="w-3.5 h-3.5"/> Reject all
                </button>
                <button onClick={() => bulkStatus("next_round", "Move to next round")} disabled={bulkBusy} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-[#002FA7] text-white hover:bg-[#00227B] disabled:opacity-50 transition-colors" data-testid="bulk-next">
                  Next round
                </button>
                <button onClick={() => setMsgOpen(true)} disabled={bulkBusy} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-white/20 hover:bg-white/10 disabled:opacity-50 transition-colors" data-testid="bulk-message">
                  <Send className="w-3.5 h-3.5"/> Send message
                </button>
                <button onClick={exportSelected} disabled={bulkBusy} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-white/20 hover:bg-white/10 disabled:opacity-50 transition-colors" data-testid="bulk-export">
                  <Download className="w-3.5 h-3.5"/> Export
                </button>
                <button onClick={bulkArchive} disabled={bulkBusy} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-white/20 hover:bg-white/10 disabled:opacity-50 transition-colors" data-testid="bulk-archive">
                  <Archive className="w-3.5 h-3.5"/> Archive
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk message modal */}
        {msgOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" data-testid="bulk-msg-modal" onClick={() => setMsgOpen(false)}>
            <div className="bg-white border-2 border-gray-900 shadow-[8px_8px_0_0_rgba(0,47,167,1)] max-w-lg w-full p-7" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="overline text-[#002FA7]">// Bulk message</div>
                  <h3 className="font-display text-2xl font-bold tracking-tight mt-1">Send to {selected.size} candidate{selected.size > 1 ? "s" : ""}</h3>
                </div>
                <button onClick={() => setMsgOpen(false)} className="w-8 h-8 grid place-items-center border-2 border-gray-900" data-testid="bulk-msg-close"><X className="w-4 h-4"/></button>
              </div>
              <label className="overline block mb-1.5">Subject</label>
              <input value={msgSubject} onChange={(e) => setMsgSubject(e.target.value)} placeholder="A quick update from the hiring team" className="w-full border-2 border-gray-900 px-4 py-3 text-sm focus:outline-none focus:border-[#002FA7] mb-4" data-testid="bulk-msg-subject"/>
              <label className="overline block mb-1.5">Message</label>
              <textarea rows={6} value={msgBody} onChange={(e) => setMsgBody(e.target.value)} placeholder="Write a personalized message that will be emailed to all selected candidates…" className="w-full border-2 border-gray-900 px-4 py-3 text-sm focus:outline-none focus:border-[#002FA7] resize-none" data-testid="bulk-msg-body"/>
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setMsgOpen(false)} className="btn-secondary !py-2 !px-4 text-sm" data-testid="bulk-msg-cancel">Cancel</button>
                <button onClick={sendBulkMessage} disabled={bulkBusy} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60" data-testid="bulk-msg-send">
                  {bulkBusy ? "Sending…" : <>Send <Send className="w-4 h-4"/></>}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "interviews" ? (
          <div className="border border-gray-200" data-testid="interviews-list">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50 overline text-gray-500 items-center">
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="w-4 h-4 accent-[#002FA7] cursor-pointer"
                  aria-label="Select all"
                  data-testid="select-all"
                />
              </div>
              <div className="col-span-3">Candidate</div>
              <div className="col-span-2">Code</div>
              <div className="col-span-1">Role</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">HR Decision</div>
              <div className="col-span-1 text-right">Score</div>
            </div>
            {loading ? <div className="p-8 text-sm text-gray-500">Loading…</div> :
              visibleInterviews.length === 0 ? <div className="p-8 text-sm text-gray-500">No interviews yet. Click <span className="font-medium">New interview</span> above to get started.</div> :
              visibleInterviews.map((it) => {
                const isSel = selected.has(it.id);
                return (
                  <div key={it.id} className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 items-center transition-colors ${isSel ? "bg-[#002FA7]/[0.04]" : "hover:bg-gray-50"}`} data-testid={`hr-row-${it.id}`}>
                    <div className="col-span-1 flex items-center">
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggleRow(it.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 accent-[#002FA7] cursor-pointer"
                        aria-label={`Select ${it.candidate_name}`}
                        data-testid={`select-${it.id}`}
                      />
                    </div>
                    <Link to={`/interview/${it.id}/report`} className="col-span-3 min-w-0">
                      <div className="font-medium text-[#111827] truncate">{it.candidate_name || "—"}</div>
                      <div className="text-xs text-gray-500 inline-flex items-center gap-1 truncate"><Mail className="w-3 h-3 shrink-0"/>{it.candidate_email}</div>
                    </Link>
                    <Link to={`/interview/${it.id}/report`} className="col-span-2 font-mono text-xs">{it.code}</Link>
                    <Link to={`/interview/${it.id}/report`} className="col-span-1 text-sm truncate">{it.role}</Link>
                    <Link to={`/interview/${it.id}/report`} className="col-span-2"><span className={`overline ${it.status==="completed"?"text-[#10B981]":"text-[#F59E0B]"}`}>{it.status}</span></Link>
                    <Link to={`/interview/${it.id}/report`} className="col-span-2"><span className={`overline ${STATUS_COLOR[it.hr_status||"pending"]}`}>{STATUS_LABEL[it.hr_status||"pending"]}</span></Link>
                    <Link to={`/interview/${it.id}/report`} className="col-span-1 text-right font-mono text-sm">{it.overall ? `${it.overall}` : "—"}</Link>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="jobs-list">
            {loading ? <div>Loading…</div> :
              jobs.length === 0 ? <div className="text-sm text-gray-500">No shareable job postings yet.</div> :
              jobs.map((j) => (
                <div key={j.id} className="card-flat p-6" data-testid={`job-card-${j.job_code}`}>
                  <div className="overline text-[#002FA7]">{j.job_code}</div>
                  <div className="flex items-center gap-2 mt-2"><Briefcase className="w-4 h-4"/><h3 className="font-display text-lg font-bold">{j.role}</h3></div>
                  <p className="text-xs text-gray-500 mt-2 capitalize">{j.interview_type}{j.category ? ` · ${j.category}` : ""}</p>
                  <div className="mt-4 font-mono text-xs bg-gray-50 p-3 break-all">/apply/{j.job_code}</div>
                  <a href={`/apply/${j.job_code}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm text-[#002FA7]">Open link <ChevronRight className="w-4 h-4"/></a>
                </div>
              ))}
          </div>
        )}
      </main>
    </div>
  );
}
