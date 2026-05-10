import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import { RefreshCw } from "lucide-react";

const LABEL = { pending:"Pending review", selected:"Selected", next_round:"Moving to next round", not_selected:"Not selected this time" };
const COLOR = { pending:"text-[#F59E0B]", selected:"text-[#10B981]", next_round:"text-[#002FA7]", not_selected:"text-[#FF3B30]" };

export default function Status() {
  const [sp] = useSearchParams();
  const initial = sp.get("code") || "";
  const [code, setCode] = useState(initial);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);
  const pollRef = useRef(null);

  const lookup = async (c, silent = false) => {
    if (!silent) setBusy(true);
    try {
      // Cache-busting query param so browsers/CDNs don't return a stale response
      const { data } = await api.get(`/interviews/status/${c}?_t=${Date.now()}`, {
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
      setData(data);
      setLastFetched(new Date());
    } catch (e) {
      if (!silent) toast.error(e?.response?.data?.detail || "Not found");
    } finally {
      if (!silent) setBusy(false);
    }
  };

  // Initial lookup + auto-poll every 15s so candidate sees the latest HR decision live.
  useEffect(() => {
    if (initial) lookup(initial);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!data || !code) return;
    // Stop polling once a final decision has been made.
    const finalDecision = ["selected", "not_selected"].includes(data.hr_status);
    if (finalDecision) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      return;
    }
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => lookup(code, true), 15000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line
  }, [data?.hr_status, code]);

  let feedback = {};
  try { feedback = data?.feedback ? JSON.parse(data.feedback) : {}; } catch { /* ignore */ }

  return (
    <div>
      <Navbar/>
      <main className="max-w-3xl mx-auto px-6 py-16" data-testid="status-page">
        <div className="overline text-[#002FA7] mb-2">// CHECK STATUS</div>
        <h1 className="font-display text-4xl font-bold tracking-tighter">Your interview</h1>
        <div className="card-bold p-6 mt-8 flex gap-2">
          <input value={code} onChange={(e)=>setCode(e.target.value.toUpperCase())} className="flex-1 border-2 border-gray-900 px-4 py-3 font-mono text-sm" placeholder="SB-XXXX-XXXX" data-testid="status-input"/>
          <button onClick={()=>code && lookup(code)} disabled={busy} className="btn-primary inline-flex items-center gap-2" data-testid="status-lookup">
            <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`}/> Check
          </button>
        </div>

        {data && (
          <div className="card-flat p-8 mt-10 space-y-6" data-testid="status-result">
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <div>
                <div className="overline text-gray-500">Role</div>
                <div className="font-display text-2xl font-bold">{data.role}</div>
              </div>
              <div className="text-xs text-gray-500" data-testid="status-last-updated">
                {lastFetched ? `Updated ${lastFetched.toLocaleTimeString()}` : ""}
                {pollRef.current ? " · auto-refreshing every 15s" : ""}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border-t border-l border-gray-200">
              <div className="p-6 border-r border-b border-gray-200">
                <div className="overline text-gray-500 mb-2">Interview status</div>
                <div className={`font-display text-lg font-bold ${data.status==="completed"?"text-[#10B981]":"text-[#F59E0B]"}`} data-testid="interview-status">{data.status}</div>
              </div>
              <div className="p-6 border-r border-b border-gray-200">
                <div className="overline text-gray-500 mb-2">HR decision</div>
                <div className={`font-display text-lg font-bold ${COLOR[data.hr_status||"pending"]}`} data-testid="hr-decision">{LABEL[data.hr_status||"pending"]}</div>
              </div>
            </div>
            {data.overall ? (
              <div className="card-bold-dark p-6">
                <div className="overline text-[#FF3B30] mb-1">Your overall score</div>
                <div className="font-display text-5xl font-bold" data-testid="overall">{data.overall}<span className="text-base text-gray-300">/100</span></div>
              </div>
            ) : null}
            {feedback.summary && <div className="text-sm text-gray-700">{feedback.summary}</div>}
            {data.hr_note && <div className="text-sm border-l-4 border-[#002FA7] pl-3">HR note: {data.hr_note}</div>}
            <div className="flex flex-wrap gap-3 pt-2">
              <button onClick={()=>code && lookup(code)} disabled={busy} className="btn-secondary inline-flex items-center gap-2" data-testid="status-refresh">
                <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`}/> Refresh now
              </button>
              <Link to="/" className="text-sm underline self-center">Back home</Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
