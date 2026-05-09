import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Brain, CheckCircle2, X, Copy, LogOut, ShieldCheck } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Self-contained axios client (independent of /lib/api so we never touch existing flows).
const adminClient = axios.create({
  baseURL: API,
  withCredentials: true,
});

const TOKEN_KEY = "scorebar_admin_token";

export default function AdminPortal() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [me, setMe] = useState(null);
  const [bootChecking, setBootChecking] = useState(true);

  // login state
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  // dashboard state
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [credsModal, setCredsModal] = useState(null);

  const authHeaders = (t) => (t ? { Authorization: `Bearer ${t}` } : {});

  // On mount: if we have a saved token, validate it and ensure user is admin.
  useEffect(() => {
    const checkToken = async () => {
      if (!token) { setBootChecking(false); return; }
      try {
        const { data } = await adminClient.get("/auth/me", { headers: authHeaders(token) });
        // Confirm this is an admin: only admin can read /admin/signups.
        await adminClient.get("/admin/signups?status=pending", { headers: authHeaders(token) });
        setMe(data);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        setMe(null);
      } finally {
        setBootChecking(false);
      }
    };
    checkToken();
    // eslint-disable-next-line
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await adminClient.post("/auth/login", { email: email.trim(), password: pw });
      const t = data.token;
      // Verify admin access by attempting an admin-only endpoint.
      await adminClient.get("/admin/signups?status=pending", { headers: authHeaders(t) });
      localStorage.setItem(TOKEN_KEY, t);
      setToken(t);
      setMe(data.user);
      setEmail(""); setPw("");
      toast.success("Welcome, admin");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(
        err?.response?.status === 403
          ? "This account is not an admin."
          : detail || "Login failed"
      );
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    try { await adminClient.post("/auth/logout", {}, { headers: authHeaders(token) }); } catch { /* ignore */ }
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setMe(null);
  };

  const load = async () => {
    if (!token) return;
    try {
      const url = `/admin/signups${filter !== "all" ? `?status=${filter}` : ""}`;
      const { data } = await adminClient.get(url, { headers: authHeaders(token) });
      setItems(data.signups || []);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to load applications");
    }
  };

  useEffect(() => { if (token) load(); /* eslint-disable-next-line */ }, [filter, token]);

  const approve = async (s) => {
    setBusy(true);
    try {
      const { data } = await adminClient.post(
        `/admin/signups/${s.id}/approve`,
        { plan: "trial", trial_days: 30, interviews_quota: 5 },
        { headers: authHeaders(token) }
      );
      setCredsModal({ ...data, email: s.work_email, company: s.company_name });
      toast.success("Approved & welcome email sent");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Approve failed");
    } finally { setBusy(false); }
  };

  const reject = async (s) => {
    if (!window.confirm(`Reject ${s.company_name}?`)) return;
    try {
      await adminClient.post(`/admin/signups/${s.id}/reject`, {}, { headers: authHeaders(token) });
      toast.success("Rejected");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Reject failed");
    }
  };

  const copy = (t) => { navigator.clipboard.writeText(t); toast.success("Copied"); };

  // ----- UI states -----

  if (bootChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500" data-testid="admin-portal-loading">Loading admin portal…</div>
      </div>
    );
  }

  // LOGIN VIEW
  if (!token || !me) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6" data-testid="admin-portal-login">
        <div className="bg-white border-2 border-gray-900 shadow-[6px_6px_0_0_rgba(17,24,39,1)] p-10 max-w-md w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#FF3B30] flex items-center justify-center"><ShieldCheck className="w-6 h-6 text-white"/></div>
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-[#FF3B30] font-semibold">// Admin only</div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Scorebar Admin Portal</h1>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Sign in with the platform admin account to review, approve or reject pending hiring-team applications.
          </p>
          <form onSubmit={login} className="space-y-4" data-testid="admin-portal-form">
            <div>
              <label className="text-[11px] tracking-[0.2em] uppercase text-gray-500 font-semibold">Admin email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@…"
                className="w-full border-2 border-gray-300 px-4 py-3 mt-1 focus:outline-none focus:border-[#FF3B30]"
                data-testid="admin-portal-email"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-[11px] tracking-[0.2em] uppercase text-gray-500 font-semibold">Password</label>
              <input
                type="password"
                required
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="••••••••"
                className="w-full border-2 border-gray-300 px-4 py-3 mt-1 focus:outline-none focus:border-[#FF3B30]"
                data-testid="admin-portal-password"
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-gray-900 text-white font-semibold py-3 hover:bg-[#FF3B30] transition-colors disabled:opacity-60"
              data-testid="admin-portal-submit"
            >
              {busy ? "Signing in…" : "Sign in to admin portal"}
            </button>
          </form>
          <p className="text-[11px] text-gray-400 mt-6 leading-relaxed">
            This portal is isolated from the public site and HR workspace. Only the configured admin account can sign in here.
          </p>
        </div>
      </div>
    );
  }

  // DASHBOARD VIEW
  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-portal-dashboard">
      <header className="bg-white border-b-2 border-gray-900">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#FF3B30] flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-white"/></div>
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-[#FF3B30] font-semibold">// Admin portal</div>
              <div className="text-lg font-bold tracking-tight text-gray-900">Hiring team applications</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900" data-testid="admin-portal-user">{me?.name || me?.email}</div>
              <div className="text-[11px] text-gray-500">{me?.email}</div>
            </div>
            <button
              onClick={logout}
              className="border-2 border-gray-900 px-3 py-2 text-sm font-semibold hover:bg-gray-900 hover:text-white transition-colors inline-flex items-center gap-2"
              data-testid="admin-portal-logout"
            >
              <LogOut className="w-4 h-4"/> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="inline-flex border-2 border-gray-900 mb-8" data-testid="admin-portal-tabs">
          {["pending", "approved", "rejected", "all"].map((f, i) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 capitalize text-sm font-medium ${filter === f ? "bg-gray-900 text-white" : "bg-white text-gray-900"} ${i > 0 ? "border-l-2 border-gray-900" : ""}`}
              data-testid={`admin-portal-tab-${f}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-4" data-testid="admin-portal-list">
          {items.length === 0 ? (
            <div className="bg-white border-2 border-gray-900 p-8 text-sm text-gray-500" data-testid="admin-portal-empty">
              No {filter === "all" ? "" : filter} applications.
            </div>
          ) : (
            items.map((s) => (
              <div
                key={s.id}
                className="bg-white border-2 border-gray-900 shadow-[4px_4px_0_0_rgba(17,24,39,1)] p-6 grid md:grid-cols-12 gap-4 items-start"
                data-testid={`admin-portal-row-${s.id}`}
              >
                <div className="md:col-span-5">
                  <div className="text-lg font-bold text-gray-900">{s.company_name}</div>
                  <div className="text-xs text-gray-500 mt-1 break-all">{s.company_website || "—"}</div>
                  {s.company_socials && <div className="text-xs text-gray-500 break-all">{s.company_socials}</div>}
                </div>
                <div className="md:col-span-4 text-sm">
                  <div className="font-medium text-gray-900">{s.hr_name}</div>
                  <div className="text-xs text-gray-600 break-all">{s.work_email}</div>
                  <div className="text-xs text-gray-500">{s.phone}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {s.employees_count} employees{s.hiring_volume ? ` · ${s.hiring_volume}` : ""}
                  </div>
                  {s.job_roles && <div className="text-xs text-gray-700 mt-2 line-clamp-2">{s.job_roles}</div>}
                  <div className="text-[10px] text-gray-400 mt-2">
                    Submitted {s.created_at ? new Date(s.created_at).toLocaleString() : "—"}
                  </div>
                </div>
                <div className="md:col-span-3 flex flex-wrap gap-2 justify-end items-center">
                  <span
                    className={`text-[10px] tracking-[0.2em] uppercase font-bold ${
                      s.status === "pending" ? "text-[#F59E0B]" : s.status === "approved" ? "text-[#10B981]" : "text-[#FF3B30]"
                    }`}
                  >
                    {s.status}
                  </span>
                  {s.status === "pending" && (
                    <>
                      <button
                        onClick={() => approve(s)}
                        disabled={busy}
                        className="bg-gray-900 text-white px-3 py-2 text-xs font-semibold inline-flex items-center gap-1 hover:bg-[#10B981] transition-colors disabled:opacity-60"
                        data-testid={`admin-portal-approve-${s.id}`}
                      >
                        <CheckCircle2 className="w-3 h-3"/> Approve
                      </button>
                      <button
                        onClick={() => reject(s)}
                        className="border-2 border-gray-900 px-3 py-2 text-xs font-semibold inline-flex items-center gap-1 hover:bg-gray-900 hover:text-white transition-colors"
                        data-testid={`admin-portal-reject-${s.id}`}
                      >
                        <X className="w-3 h-3"/> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {credsModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6"
          data-testid="admin-portal-creds-modal"
        >
          <div className="bg-white border-2 border-gray-900 shadow-[6px_6px_0_0_rgba(17,24,39,1)] p-8 max-w-md w-full">
            <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[#10B981] font-bold mb-2">
              <CheckCircle2 className="w-4 h-4"/> Approved
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{credsModal.company}</h2>
            <p className="text-xs text-gray-500 mt-2 mb-5">
              Welcome email sent to <span className="font-medium text-gray-700">{credsModal.email}</span>. Share these credentials if needed:
            </p>
            <div className="space-y-3 font-mono text-sm">
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 px-3 py-2">
                <span className="text-[10px] tracking-[0.2em] uppercase text-gray-500 w-16">User</span>
                <span className="flex-1 break-all">{credsModal.username}</span>
                <button onClick={() => copy(credsModal.username)} className="text-gray-500 hover:text-gray-900" aria-label="Copy username"><Copy className="w-4 h-4"/></button>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 px-3 py-2">
                <span className="text-[10px] tracking-[0.2em] uppercase text-gray-500 w-16">Pass</span>
                <span className="flex-1 break-all">{credsModal.password}</span>
                <button onClick={() => copy(credsModal.password)} className="text-gray-500 hover:text-gray-900" aria-label="Copy password"><Copy className="w-4 h-4"/></button>
              </div>
            </div>
            <button
              onClick={() => setCredsModal(null)}
              className="w-full bg-gray-900 text-white font-semibold py-3 mt-6 hover:bg-[#FF3B30] transition-colors"
              data-testid="admin-portal-creds-close"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
