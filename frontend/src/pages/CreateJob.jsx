import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../lib/api";
import { toast } from "sonner";
import { Copy } from "lucide-react";

export default function CreateJob() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    role: "Senior Backend Engineer", interview_type: "voice", category: "coding",
    description: "", custom_questions_text: ""
  });
  const [created, setCreated] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const custom = form.custom_questions_text.split("\n").map(s=>s.trim()).filter(Boolean);
      if (custom.length === 0) { toast.error("Add at least one question"); setBusy(false); return; }
      const { data } = await api.post("/jobs/create", {
        role: form.role, interview_type: form.interview_type,
        category: form.interview_type==="text" ? form.category : null,
        description: form.description, custom_questions: custom,
      });
      setCreated(data); toast.success("Shareable link created.");
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
    finally { setBusy(false); }
  };

  const copy = (t) => { navigator.clipboard.writeText(t); toast.success("Copied"); };

  if (created) {
    const link = `${window.location.origin}/apply/${created.job_code}`;
    return (
      <div>
        <Navbar/>
        <main className="max-w-3xl mx-auto px-6 py-16" data-testid="job-success">
          <div className="overline text-[#10B981] mb-3">// LINK READY</div>
          <h1 className="font-display text-4xl font-bold tracking-tighter">Your shareable job link is live.</h1>
          <div className="card-bold p-8 mt-10 space-y-6">
            <div>
              <div className="overline mb-2">Job code</div>
              <div className="font-mono text-3xl font-bold" data-testid="job-code">{created.job_code}</div>
            </div>
            <div>
              <div className="overline mb-2">Shareable apply link</div>
              <div className="flex items-center gap-2">
                <div className="font-mono text-sm break-all flex-1 border-2 border-gray-300 p-3" data-testid="apply-link">{link}</div>
                <button onClick={()=>copy(link)} className="btn-secondary !py-2 !px-3"><Copy className="w-4 h-4"/></button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Share this link with candidates. Each applicant gets their own meeting code after they start.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={()=>navigate("/hr")} className="btn-primary">Back to dashboard</button>
              <button onClick={()=>setCreated(null)} className="btn-secondary">Create another</button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Navbar/>
      <main className="max-w-3xl mx-auto px-6 py-12" data-testid="create-job">
        <div className="overline text-[#FF3B30] mb-2">// SHAREABLE JOB POSTING</div>
        <h1 className="font-display text-4xl font-bold tracking-tighter">Post a role for many candidates</h1>
        <p className="text-gray-600 mt-3 text-sm">Generate one link. Every candidate who opens it submits their name + email and takes the interview.</p>

        <form onSubmit={submit} className="card-bold p-8 mt-10 space-y-6">
          <div>
            <label className="overline block mb-2">Role</label>
            <input data-testid="job-role" value={form.role} onChange={(e)=>set("role", e.target.value)} className="w-full border-2 border-gray-300 px-4 py-3 focus:border-[#002FA7] focus:outline-none"/>
          </div>
          <div>
            <label className="overline block mb-2">Description (optional)</label>
            <textarea rows={3} data-testid="job-desc" value={form.description} onChange={(e)=>set("description", e.target.value)} className="w-full border-2 border-gray-300 px-4 py-3 focus:outline-none focus:border-[#002FA7]"/>
          </div>
          <div>
            <label className="overline block mb-2">Format</label>
            <div className="grid grid-cols-2 gap-0 border-2 border-gray-900">
              {["voice","text"].map((t,i)=>(
                <button key={t} type="button" onClick={()=>set("interview_type",t)} className={`p-4 text-left ${form.interview_type===t?"bg-gray-900 text-white":"bg-white"} ${i>0?"border-l-2 border-gray-900":""}`} data-testid={`job-format-${t}`}>
                  <div className="font-display text-lg font-bold capitalize">{t}</div>
                </button>
              ))}
            </div>
          </div>
          {form.interview_type === "text" && (
            <div>
              <label className="overline block mb-2">Category</label>
              <div className="grid grid-cols-3 gap-0 border-2 border-gray-900">
                {["coding","math","general"].map((c,i)=>(
                  <button key={c} type="button" onClick={()=>set("category",c)} className={`p-3 capitalize ${form.category===c?"bg-[#002FA7] text-white":"bg-white"} ${i>0?"border-l-2 border-gray-900":""}`}>{c==="general"?"General Knowledge":c}</button>
                ))}
              </div>
            </div>
          )}
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <div>
              <label className="overline block mb-2">Questions (one per line) <span className="text-[#FF3B30]">*</span></label>
              <textarea required rows={6} value={form.custom_questions_text} onChange={(e)=>set("custom_questions_text",e.target.value)} placeholder="One question per line..." className="w-full border-2 border-gray-300 px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#002FA7]" data-testid="job-custom-q"/>
              <p className="text-xs text-gray-500 mt-1">Every applicant will be asked these exact questions.</p>
            </div>
          </div>
          <button disabled={busy} className="btn-primary w-full" data-testid="submit-job">{busy?"Creating…":"Generate shareable link"}</button>
        </form>
      </main>
    </div>
  );
}
