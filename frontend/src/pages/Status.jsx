import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import { Brain } from "lucide-react";

const LABEL = { pending:"Pending review", selected:"Selected", next_round:"Moving to next round", not_selected:"Not selected this time" };
const COLOR = { pending:"text-[#F59E0B]", selected:"text-[#10B981]", next_round:"text-[#002FA7]", not_selected:"text-[#FF3B30]" };

export default function Status() {
  const [sp] = useSearchParams();
  const initial = sp.get("code") || "";
  const [code, setCode] = useState(initial);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const lookup = async (c) => {
    setBusy(true);
    try {
      const { data } = await api.get(`/interviews/status/${c}`);
      setData(data);
    } catch (e) { toast.error(e?.response?.data?.detail || "Not found"); }
    finally { setBusy(false); }
  };

  useEffect(() => { if (initial) lookup(initial); /* eslint-disable-next-line */ }, []);

  let feedback = {};
  try { feedback = data?.feedback ? JSON.parse(data.feedback) : {}; } catch {}

  return (
    <div>
      <Navbar/>
      <main className="max-w-3xl mx-auto px-6 py-16" data-testid="status-page">
        <div className="overline text-[#002FA7] mb-2">// CHECK STATUS</div>
        <h1 className="font-display text-4xl font-bold tracking-tighter">Your interview</h1>
        <div className="card-bold p-6 mt-8 flex gap-2">
          <input value={code} onChange={(e)=>setCode(e.target.value.toUpperCase())} className="flex-1 border-2 border-gray-900 px-4 py-3 font-mono text-sm" placeholder="SB-XXXX-XXXX" data-testid="status-input"/>
          <button onClick={()=>code && lookup(code)} disabled={busy} className="btn-primary" data-testid="status-lookup">Check</button>
        </div>

        {data && (
          <div className="card-flat p-8 mt-10 space-y-6" data-testid="status-result">
            <div>
              <div className="overline text-gray-500">Role</div>
              <div className="font-display text-2xl font-bold">{data.role}</div>
            </div>
            <div className="grid grid-cols-2 gap-0 border-t border-l border-gray-200">
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
            <Link to="/" className="text-sm underline">Back home</Link>
          </div>
        )}
      </main>
    </div>
  );
}
