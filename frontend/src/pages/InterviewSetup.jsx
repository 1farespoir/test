import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../lib/api";
import { toast } from "sonner";

export default function InterviewSetup() {
  const [params] = useSearchParams();
  const initialType = params.get("type") || "voice";
  const [type, setType] = useState(initialType);
  const [role, setRole] = useState("Software Engineer");
  const [category, setCategory] = useState("coding");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const start = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/interviews/start", { role, interview_type: type, category: type === "text" ? category : null });
      navigate(`/interview/${data.id}/${type === "voice" ? "session" : "text"}`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to start");
    } finally { setLoading(false); }
  };

  return (
    <div>
      <Navbar/>
      <main className="max-w-3xl mx-auto px-6 sm:px-8 py-16" data-testid="setup-page">
        <div className="overline text-[#002FA7] mb-3">// NEW SESSION</div>
        <h1 className="font-display text-4xl font-bold tracking-tighter">Configure interview</h1>

        <div className="mt-12 space-y-8 card-bold p-8">
          <div>
            <label className="overline block mb-3">Format</label>
            <div className="grid grid-cols-2 gap-0 border-2 border-gray-900">
              <button onClick={() => setType("voice")} className={`p-4 text-left ${type==="voice" ? "bg-gray-900 text-white" : "bg-white"}`} data-testid="format-voice">
                <div className="font-display text-lg font-bold">Voice</div>
                <div className="text-sm opacity-80">Adaptive AI conversation with video.</div>
              </button>
              <button onClick={() => setType("text")} className={`p-4 text-left border-l-2 border-gray-900 ${type==="text" ? "bg-gray-900 text-white" : "bg-white"}`} data-testid="format-text">
                <div className="font-display text-lg font-bold">Text</div>
                <div className="text-sm opacity-80">5 typed questions. Auto-graded.</div>
              </button>
            </div>
          </div>

          <div>
            <label className="overline block mb-3">Role / Topic</label>
            <input data-testid="role-input" className="w-full border-2 border-gray-300 px-4 py-3 focus:border-[#002FA7] focus:outline-none bg-white" value={role} onChange={(e)=>setRole(e.target.value)} placeholder="e.g. Senior Backend Engineer"/>
          </div>

          {type === "text" && (
            <div>
              <label className="overline block mb-3">Category</label>
              <div className="grid grid-cols-3 gap-0 border-2 border-gray-900">
                {["coding","math","general"].map((c, i) => (
                  <button key={c} onClick={() => setCategory(c)} className={`p-3 capitalize ${category===c?"bg-[#002FA7] text-white":"bg-white"} ${i>0?"border-l-2 border-gray-900":""}`} data-testid={`category-${c}`}>{c==="general" ? "General Knowledge" : c}</button>
                ))}
              </div>
            </div>
          )}

          <button onClick={start} disabled={loading} className="btn-primary w-full" data-testid="start-interview-button">
            {loading ? "Preparing..." : "Begin interview"}
          </button>
        </div>
      </main>
    </div>
  );
}
