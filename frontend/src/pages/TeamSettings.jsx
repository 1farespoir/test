import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Users, UserPlus, Trash2, Crown, Lock, ArrowRight, Mail, Copy } from "lucide-react";
import { toast } from "sonner";

const PLAN_LIMITS = { free: 1, starter: 2, professional: 5, enterprise: -1 };

export default function TeamSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ members: [], limit: 1, plan: "free", owner_user_id: "" });
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/team/members");
      setData(data);
    } catch (e) {
      toast.error("Couldn't load team");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const isOwner = data.current_user_id && data.current_user_id === data.owner_user_id;
  const planLimit = data.limit ?? PLAN_LIMITS[data.plan] ?? 1;
  const canInvite = isOwner && planLimit !== 1;
  const seatsUsed = data.members.length;
  const seatsLeft = planLimit === -1 ? "∞" : Math.max(0, planLimit - seatsUsed);

  const submit = async (e) => {
    e.preventDefault();
    if (!name || !email) return toast.error("Fill all fields");
    setSubmitting(true);
    try {
      const res = await api.post("/team/invite", { name, email });
      setTempPassword(res.data.password);
      setName(""); setEmail("");
      toast.success(`${res.data.member.name} added to your team`);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Invite failed");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (member_id, name) => {
    if (!window.confirm(`Remove ${name} from your team? They will lose access immediately.`)) return;
    try {
      await api.delete(`/team/members/${member_id}`);
      toast.success("Member removed");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to remove");
    }
  };

  const copyPw = () => {
    navigator.clipboard.writeText(tempPassword);
    toast.success("Password copied");
  };

  if (!user) return <div className="p-12 text-sm text-gray-500">Loading…</div>;

  return (
    <div className="bg-white">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-12" data-testid="team-page">
        <div className="overline text-[#002FA7] mb-3">// Team settings</div>
        <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tighter text-[#111827]">Your team.</h1>
        <p className="text-gray-600 mt-3">Invite teammates to collaborate inside your Scorebar workspace. Each member gets their own login but shares your interview quota.</p>

        {/* Seats panel */}
        <div className="mt-10 grid sm:grid-cols-3 gap-0 border-t border-l border-gray-900" data-testid="seats-panel">
          <div className="border-r border-b border-gray-900 p-6 bg-white">
            <div className="overline text-gray-500 mb-1">Current plan</div>
            <div className="font-display text-2xl font-bold tracking-tight text-[#111827] flex items-center gap-2">
              <Crown className="w-5 h-5 text-[#FF3B30]" /> {(data.plan || "free").toUpperCase()}
            </div>
          </div>
          <div className="border-r border-b border-gray-900 p-6 bg-white">
            <div className="overline text-gray-500 mb-1">Seats used</div>
            <div className="font-display text-2xl font-bold tracking-tight text-[#111827]">
              {seatsUsed}<span className="text-gray-400 text-base font-mono"> / {planLimit === -1 ? "∞" : planLimit}</span>
            </div>
          </div>
          <div className="border-r border-b border-gray-900 p-6 bg-white">
            <div className="overline text-gray-500 mb-1">Available</div>
            <div className={`font-display text-2xl font-bold tracking-tight ${seatsLeft === 0 ? "text-[#FF3B30]" : "text-[#10B981]"}`}>
              {seatsLeft}
            </div>
          </div>
        </div>

        {/* Premium gate */}
        {!canInvite && (
          <div className="mt-10 border-2 border-gray-900 bg-[#111827] text-white p-7 lg:p-9 shadow-[8px_8px_0_0_rgba(0,47,167,1)]" data-testid="premium-gate">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 flex items-center justify-center bg-[#60A5FA] text-[#111827] shrink-0">
                <Lock className="w-5 h-5" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="overline text-[#FF3B30] mb-1">Premium feature</div>
                <h3 className="font-display text-2xl font-bold tracking-tight">
                  {!isOwner ? "Only the team owner can manage seats" : "Inviting teammates is part of paid plans"}
                </h3>
                <p className="text-gray-300 text-sm mt-3 max-w-xl">
                  {!isOwner
                    ? "Ask your account owner to invite or remove members."
                    : "Upgrade to Starter (2 seats), Professional (5 seats), or Enterprise (unlimited) to invite teammates that work alongside you in the same workspace."}
                </p>
                {isOwner && (
                  <Link to="/pricing" className="mt-5 inline-flex items-center gap-2 bg-[#60A5FA] text-[#111827] px-5 py-3 font-medium hover:bg-white transition-colors" data-testid="upgrade-from-team">
                    See plans <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Invite */}
        {canInvite && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl font-bold tracking-tight text-[#111827]">Members</h2>
              <button
                onClick={() => { setShowInvite(true); setTempPassword(null); }}
                disabled={planLimit !== -1 && seatsUsed >= planLimit}
                className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="open-invite-modal"
              >
                <UserPlus className="w-4 h-4" /> Invite teammate
              </button>
            </div>

            {showInvite && (
              <div className="card-bold bg-white p-6 mb-6" data-testid="invite-form">
                <div className="overline text-[#002FA7] mb-4">// New teammate</div>
                {tempPassword ? (
                  <div className="border-2 border-[#10B981] bg-[#10B981]/5 p-5" data-testid="invite-success">
                    <div className="overline text-[#10B981] mb-2">Member added — share their login</div>
                    <div className="text-sm text-gray-700 mb-3">An email was sent. Their temporary password:</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-gray-900 text-white font-mono text-sm px-4 py-3 select-all">{tempPassword}</code>
                      <button onClick={copyPw} className="btn-secondary !py-2 !px-3 text-sm" data-testid="copy-temp-pw"><Copy className="w-4 h-4" /></button>
                    </div>
                    <button onClick={() => { setShowInvite(false); setTempPassword(null); }} className="mt-4 text-sm text-gray-600 underline" data-testid="close-invite-success">Done</button>
                  </div>
                ) : (
                  <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="overline block mb-2">Name</label>
                      <input data-testid="invite-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full border-2 border-gray-900 px-4 py-3 text-sm focus:outline-none focus:border-[#002FA7]" />
                    </div>
                    <div>
                      <label className="overline block mb-2">Work email</label>
                      <input data-testid="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border-2 border-gray-900 px-4 py-3 text-sm focus:outline-none focus:border-[#002FA7]" />
                    </div>
                    <div className="sm:col-span-2 flex justify-end gap-2">
                      <button type="button" onClick={() => setShowInvite(false)} className="btn-secondary !py-2 !px-4 text-sm" data-testid="cancel-invite">Cancel</button>
                      <button type="submit" disabled={submitting} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60" data-testid="submit-invite">
                        {submitting ? "Sending..." : <>Send invite <ArrowRight className="w-4 h-4" /></>}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* Members list */}
        <div className="mt-6 border-2 border-gray-900 bg-white" data-testid="members-list">
          <div className="grid grid-cols-12 px-6 py-3 border-b-2 border-gray-900 bg-[#F3F4F6] overline text-gray-700">
            <div className="col-span-5">Name</div>
            <div className="col-span-4">Email</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-1 text-right">{canInvite ? "Action" : ""}</div>
          </div>
          {loading && <div className="p-6 text-sm text-gray-500">Loading…</div>}
          {!loading && data.members.length === 0 && <div className="p-6 text-sm text-gray-500">No members yet.</div>}
          {data.members.map((m) => {
            const owner = m.user_id === data.owner_user_id;
            const me = m.user_id === data.current_user_id;
            return (
              <div key={m.user_id} className="grid grid-cols-12 px-6 py-4 border-b border-gray-200 items-center" data-testid={`member-row-${m.user_id}`}>
                <div className="col-span-5 flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#002FA7] text-white flex items-center justify-center font-display font-bold text-sm">
                    {(m.name || m.email).slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-[#111827]">{m.name || "—"} {me && <span className="text-xs text-gray-400">(you)</span>}</div>
                    <div className="text-xs text-gray-500">{m.username}</div>
                  </div>
                </div>
                <div className="col-span-4 text-sm text-gray-700 inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" />{m.email}</div>
                <div className="col-span-2">
                  {owner
                    ? <span className="overline text-[#FF3B30] inline-flex items-center gap-1"><Crown className="w-3.5 h-3.5" />Owner</span>
                    : <span className="overline text-[#002FA7]">Member</span>}
                </div>
                <div className="col-span-1 text-right">
                  {canInvite && !owner && (
                    <button onClick={() => remove(m.user_id, m.name)} className="text-gray-400 hover:text-[#FF3B30] transition-colors" data-testid={`remove-${m.user_id}`} title="Remove member">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
