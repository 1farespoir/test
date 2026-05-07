import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../lib/api";
import { toast } from "sonner";
import { Copy, CheckCircle2 } from "lucide-react";

export default function CreateInvite() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    role: "Software Engineer", interview_type: "voice", category: "coding",
    candidate_name: "", candidate_email: "",
    custom_questions_text: ""
  });
  const [created, setCreated] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.candidate_email) return toast.error("Candidate email required");
    setBusy(true);
    try {
      const custom = form.custom_questions_text.split("\n").map(s => s.trim()).filter(Boolean);
      if (custom.length === 0) { toast.error("Add at least one question"); setBusy(false); return; }
      const { data } = await api.post("/interviews/invite", {
        role: form.role, interview_type: form.interview_type,
        category: form.interview_type === "text" ? form.category : null,
        candidate_name: form.candidate_name, candidate_email: form.candidate_email,
        custom_questions: custom,
      });
      setCreated(data);
      toast.success("Invite created — email sent (mocked).");
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
    finally { setBusy(false); }
  };

  const copy = (t) => { navigator.clipboard.writeText(t); toast.success("Copied"); };

  if (created) {
    const joinLink = `${window.location.origin}/join?code=${created.code}`;
    return (
      <div>
        <Navbar/>
        <main className="max-w-3xl mx-auto px-6 py-16" data-testid="invite-success">
          <div className="overline text-[#10B981] mb-3">// INVITE READY</div>
          <h1 className="font-display text-4xl font-bold tracking-tighter">Candidate invited.</h1>
          <p className="text-gray-600 mt-3 text-sm">Email has been sent (mocked). You can also share the link directly.</p>
          <div className="card-bold p-8 mt-10 space-y-6">
            <div>
              <div className="overline mb-2">Meeting code</div>
              <div className="flex items-center gap-2">
                <div className="font-mono text-3xl font-bold" data-testid="generated-code">{created.code}</div>
                <button onClick={()=>copy(created.code)} className="btn-secondary !py-2 !px-3"><Copy className="w-4 h-4"/></button>
              </div>
            </div>
            <div>
              <div className="overline mb-2">Join link</div>
              <div className="flex items-center gap-2">
                <div className="font-mono text-sm break-all flex-1 border-2 border-gray-300 p-3" data-testid="join-link">{joinLink}</div>
                <button onClick={()=>copy(joinLink)} className="btn-secondary !py-2 !px-3"><Copy className="w-4 h-4"/></button>
              </div>
            </div>
            <div className="text-sm text-gray-600 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#10B981]"/> {created.candidate_email}</div>
            <div className="flex gap-3">
              <button onClick={()=>navigate("/hr")} className="btn-primary">Back to dashboard</button>
              <button onClick={()=>setCreated(null)} className="btn-secondary">Send another</button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Navbar/>
      <main className="max-w-3xl mx-auto px-6 py-12" data-testid="create-invite">
        <div className="overline text-[#002FA7] mb-2">// NEW INVITE</div>
        <h1 className="font-display text-4xl font-bold tracking-tighter">Invite a candidate</h1>

        <form onSubmit={submit} className="card-bold p-8 mt-10 space-y-6">
          <div>
            <label className="overline block mb-2">Job role</label>
            <input data-testid="role-input" value={form.role} onChange={(e)=>set("role", e.target.value)} className="w-full border-2 border-gray-300 px-4 py-3 focus:border-[#002FA7] focus:outline-none"/>
          </div>

          <div>
            <label className="overline block mb-2">Format</label>
            <div className="grid grid-cols-2 gap-0 border-2 border-gray-900">
              {["voice","text"].map((t,i)=> (
                <button key={t} type="button" onClick={()=>set("interview_type", t)} className={`p-4 text-left ${form.interview_type===t?"bg-gray-900 text-white":"bg-white"} ${i>0?"border-l-2 border-gray-900":""}`} data-testid={`format-${t}`}>
                  <div className="font-display text-lg font-bold capitalize">{t}</div>
                  <div className="text-sm opacity-80">{t==="voice"?"Video + audio AI conversation":"Typed answers, auto-graded"}</div>
                </button>
              ))}
            </div>
          </div>

          {form.interview_type === "text" && (
            <div>
              <label className="overline block mb-2">Category</label>
              <div className="grid grid-cols-3 gap-0 border-2 border-gray-900">
                {["coding","math","general"].map((c,i)=>(
                  <button key={c} type="button" onClick={()=>set("category",c)} className={`p-3 capitalize ${form.category===c?"bg-[#002FA7] text-white":"bg-white"} ${i>0?"border-l-2 border-gray-900":""}`} data-testid={`cat-${c}`}>{c==="general"?"General Knowledge":c}</button>
                ))}
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="overline block mb-2">Candidate name</label>
              <input data-testid="candidate-name" value={form.candidate_name} onChange={(e)=>set("candidate_name", e.target.value)} className="w-full border-2 border-gray-300 px-4 py-3 focus:border-[#002FA7] focus:outline-none"/>
            </div>
            <div>
              <label className="overline block mb-2">Candidate email *</label>
              <input required type="email" data-testid="candidate-email" value={form.candidate_email} onChange={(e)=>set("candidate_email", e.target.value)} className="w-full border-2 border-gray-300 px-4 py-3 focus:border-[#002FA7] focus:outline-none"/>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 space-y-4">
            <div>
              <label className="overline block mb-2">Questions (one per line) <span className="text-[#FF3B30]">*</span></label>
              <textarea required rows={6} value={form.custom_questions_text} onChange={(e)=>set("custom_questions_text", e.target.value)} placeholder="Tell me about a time you resolved conflict...&#10;What's the difference between X and Y?&#10;How would you design a caching layer?" className="w-full border-2 border-gray-300 px-4 py-3 focus:border-[#002FA7] focus:outline-none font-mono text-sm" data-testid="custom-questions"/>
              <p className="text-xs text-gray-500 mt-1">Scorebar will ask these exact questions in order.</p>
            </div>
          </div>

          <button disabled={busy} className="btn-primary w-full" data-testid="submit-invite">{busy?"Creating…":"Create invite & email candidate"}</button>
        </form>
      </main>
    </div>
  );
}
