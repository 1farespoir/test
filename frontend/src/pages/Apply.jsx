import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, setInterviewCode } from "../lib/api";
import { toast } from "sonner";
import { Brain } from "lucide-react";

export default function Apply() {
  const { job_code } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [form, setForm] = useState({ candidate_name: "", candidate_email: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/jobs/public/${job_code}`);
        setJob(data);
      } catch (e) { setError(e?.response?.data?.detail || "Job not found"); }
    })();
  }, [job_code]);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const { data } = await api.post(`/jobs/${job_code}/apply`, form);
      setInterviewCode(data.code);
      toast.success("Starting interview…");
      navigate(`/interview/${data.id}/${data.interview_type === "voice" ? "session" : "text"}`);
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
    finally { setBusy(false); }
  };

  if (error) return <div className="min-h-screen flex items-center justify-center"><div className="card-flat p-8 text-sm">{error}</div></div>;
  if (!job) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;

  return (
    <div className="min-h-screen bg-white grid-pattern">
      <div className="max-w-3xl mx-auto px-6 py-16" data-testid="apply-page">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-[#002FA7] flex items-center justify-center"><Brain className="w-5 h-5 text-white"/></div>
          <span className="font-display text-xl font-bold tracking-tighter">SCOREBAR</span>
        </div>
        <div className="overline text-[#002FA7] mb-3">// APPLY · {job.job_code}</div>
        <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tighter">{job.role}</h1>
        <p className="mt-4 text-gray-600">{job.description || "You're about to take an AI-powered screening interview."} Duration: ~10 minutes.</p>

        <form onSubmit={submit} className="card-bold p-8 mt-10 space-y-6" data-testid="apply-form">
          <div>
            <label className="overline block mb-2">Your full name</label>
            <input required data-testid="apply-name" value={form.candidate_name} onChange={(e)=>setForm({...form, candidate_name:e.target.value})} className="w-full border-2 border-gray-300 px-4 py-3 focus:outline-none focus:border-[#002FA7]"/>
          </div>
          <div>
            <label className="overline block mb-2">Email (for updates)</label>
            <input required type="email" data-testid="apply-email" value={form.candidate_email} onChange={(e)=>setForm({...form, candidate_email:e.target.value})} className="w-full border-2 border-gray-300 px-4 py-3 focus:outline-none focus:border-[#002FA7]"/>
          </div>
          <div className="text-xs text-gray-500">You'll receive a meeting code to check your status anytime.</div>
          <button disabled={busy} className="btn-primary w-full" data-testid="apply-submit">{busy ? "Starting…" : "Start interview"}</button>
        </form>
      </div>
    </div>
  );
}
