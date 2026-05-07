import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../lib/api";
import { CheckCircle2, Copy, Mail, ClipboardList } from "lucide-react";
import { toast } from "sonner";

export default function InterviewThanks() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/interviews/${id}`);
        setInterview(data);
      } catch { navigate("/"); }
    })();
  }, [id, navigate]);

  if (!interview) return <div className="p-12">Loading…</div>;
  const code = interview.code;

  const copy = () => { navigator.clipboard.writeText(code); toast.success("Code copied"); };

  return (
    <div>
      <Navbar/>
      <main className="max-w-2xl mx-auto px-6 py-16" data-testid="thanks-page">
        <CheckCircle2 className="w-12 h-12 text-[#10B981] mb-5"/>
        <div className="overline text-[#002FA7] mb-2">// INTERVIEW COMPLETE</div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter">Thanks, {interview.candidate_name?.split(" ")[0] || "there"}.</h1>
        <p className="mt-5 text-gray-700 leading-relaxed">
          Your interview for <span className="font-medium">{interview.role}</span> has been submitted. A decision will be shared by the hiring team shortly.
        </p>

        <div className="card-bold p-8 mt-10 space-y-6" data-testid="meeting-code-card">
          <div>
            <div className="overline mb-2">Your meeting code</div>
            <div className="flex items-center gap-3">
              <div className="font-mono text-3xl font-bold tracking-widest" data-testid="meeting-code">{code}</div>
              <button onClick={copy} className="btn-secondary !py-2 !px-3" data-testid="copy-code"><Copy className="w-4 h-4"/></button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Keep this code safe — you'll need it to check your status.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-0 border-t border-l border-gray-200">
            <div className="border-r border-b border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2"><ClipboardList className="w-4 h-4 text-[#002FA7]"/><span className="overline">Check status anytime</span></div>
              <p className="text-sm text-gray-600">Visit the status page and enter your code to see updates.</p>
            </div>
            <div className="border-r border-b border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2"><Mail className="w-4 h-4 text-[#002FA7]"/><span className="overline">You'll get an email</span></div>
              <p className="text-sm text-gray-600 break-all">We'll notify <span className="font-medium">{interview.candidate_email}</span> when the team decides.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link to={`/status?code=${code}`} className="btn-primary" data-testid="thanks-check-status">Check status</Link>
            <Link to="/" className="btn-secondary">Back home</Link>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-10">Decisions usually arrive within a few business days. Thanks for interviewing with Scorebar.</p>
      </main>
    </div>
  );
}
