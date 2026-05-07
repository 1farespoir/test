import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { api } from "../lib/api";
import { toast } from "sonner";
import { CheckCircle2, X, Copy } from "lucide-react";

export default function AdminPanel() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [credsModal, setCredsModal] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/admin/signups${filter!=="all"?`?status=${filter}`:""}`);
      setItems(data.signups);
    } catch (e) { toast.error(e?.response?.data?.detail || "Forbidden"); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const approve = async (s) => {
    setBusy(true);
    try {
      const { data } = await api.post(`/admin/signups/${s.id}/approve`, { plan:"trial", trial_days:30, interviews_quota:5 });
      setCredsModal({ ...data, email: s.work_email, company: s.company_name });
      toast.success("Approved & welcome email sent (mocked)");
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
    finally { setBusy(false); }
  };
  const reject = async (s) => {
    if (!window.confirm(`Reject ${s.company_name}?`)) return;
    try { await api.post(`/admin/signups/${s.id}/reject`); toast.success("Rejected"); load(); }
    catch (e) { toast.error("Failed"); }
  };

  const copy = (t) => { navigator.clipboard.writeText(t); toast.success("Copied"); };

  return (
    <div>
      <Navbar/>
      <main className="max-w-7xl mx-auto px-6 py-12" data-testid="admin-panel">
        <div className="overline text-[#FF3B30] mb-2">// ADMIN</div>
        <h1 className="font-display text-4xl font-bold tracking-tighter">Hiring team applications</h1>
        <div className="inline-flex border-2 border-gray-900 mt-8">
          {["pending","approved","rejected","all"].map((f,i)=>(
            <button key={f} onClick={()=>setFilter(f)} className={`px-4 py-2 capitalize text-sm ${filter===f?"bg-gray-900 text-white":"bg-white"} ${i>0?"border-l-2 border-gray-900":""}`} data-testid={`admin-tab-${f}`}>{f}</button>
          ))}
        </div>
        <div className="mt-8 space-y-4" data-testid="signups-list">
          {items.length === 0 ? <div className="card-flat p-8 text-sm text-gray-500">No applications.</div> :
            items.map((s) => (
              <div key={s.id} className="card-flat p-6 grid md:grid-cols-12 gap-4 items-start" data-testid={`signup-${s.id}`}>
                <div className="md:col-span-5">
                  <div className="font-display text-lg font-bold">{s.company_name}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.company_website || "—"}</div>
                  <div className="text-xs text-gray-500 break-all">{s.company_socials || ""}</div>
                </div>
                <div className="md:col-span-4 text-sm">
                  <div>{s.hr_name}</div>
                  <div className="text-xs text-gray-500">{s.work_email} · {s.phone}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.employees_count} employees · {s.hiring_volume || "—"}</div>
                  {s.job_roles && <div className="text-xs text-gray-700 mt-2 line-clamp-2">{s.job_roles}</div>}
                </div>
                <div className="md:col-span-3 flex flex-wrap gap-2 justify-end">
                  <span className={`overline ${s.status==="pending"?"text-[#F59E0B]":s.status==="approved"?"text-[#10B981]":"text-[#FF3B30]"}`}>{s.status}</span>
                  {s.status === "pending" && <>
                    <button onClick={()=>approve(s)} disabled={busy} className="btn-primary !py-2 !px-3 text-xs inline-flex items-center gap-1" data-testid={`approve-${s.id}`}><CheckCircle2 className="w-3 h-3"/> Approve</button>
                    <button onClick={()=>reject(s)} className="btn-secondary !py-2 !px-3 text-xs inline-flex items-center gap-1" data-testid={`reject-${s.id}`}><X className="w-3 h-3"/> Reject</button>
                  </>}
                </div>
              </div>
            ))}
        </div>
      </main>
      {credsModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6" data-testid="creds-modal">
          <div className="card-bold bg-white p-8 max-w-md w-full">
            <div className="overline text-[#10B981] mb-2">// APPROVED</div>
            <h2 className="font-display text-2xl font-bold mb-4">{credsModal.company}</h2>
            <p className="text-xs text-gray-500 mb-4">Welcome email sent to {credsModal.email} (mocked). Share these creds if needed:</p>
            <div className="space-y-3 font-mono text-sm">
              <div className="flex items-center gap-2"><span className="overline w-20">User</span><span className="flex-1 break-all">{credsModal.username}</span><button onClick={()=>copy(credsModal.username)}><Copy className="w-4 h-4"/></button></div>
              <div className="flex items-center gap-2"><span className="overline w-20">Pass</span><span className="flex-1 break-all">{credsModal.password}</span><button onClick={()=>copy(credsModal.password)}><Copy className="w-4 h-4"/></button></div>
            </div>
            <button onClick={()=>setCredsModal(null)} className="btn-primary w-full mt-6">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
