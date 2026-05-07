import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../lib/api";
import { toast } from "sonner";

export default function TextAssessment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await api.get(`/interviews/${id}`);
      setInterview(data);
      const next = data.questions.findIndex(q => !q.a);
      setIdx(next === -1 ? data.questions.length - 1 : next);
    })();
  }, [id]);

  if (!interview) return <div className="p-12">Loading…</div>;
  const q = interview.questions[idx];

  const submit = async () => {
    if (!answer.trim()) return toast.error("Please type an answer.");
    setBusy(true);
    try {
      const { data } = await api.post(`/interviews/${id}/respond`, { answer });
      setAnswer("");
      const updatedQs = data.questions || interview.questions;
      const ni = updatedQs.findIndex(qq => !qq.a);
      if (data.is_final || ni === -1) {
        await api.post(`/interviews/${id}/complete`, {});
        navigate(`/interview/${id}/thanks`);
      } else {
        setIdx(ni);
        setInterview({ ...interview, questions: updatedQs });
      }
    } catch (e) { toast.error("Submit failed"); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <Navbar/>
      <main className="max-w-3xl mx-auto px-6 sm:px-8 py-12" data-testid="text-assessment">
        <div className="overline text-[#FF3B30] mb-2">// {interview.category?.toUpperCase()} ASSESSMENT</div>
        <div className="flex items-baseline justify-between">
          <h1 className="font-display text-3xl font-bold tracking-tighter">{interview.role}</h1>
          <div className="font-mono text-sm text-gray-500">{idx + 1} / {interview.questions.length}</div>
        </div>
        <div className="mt-10 card-bold p-8">
          <div className="overline text-[#002FA7] mb-3">Question {idx + 1}</div>
          <p className="font-display text-xl tracking-tight" data-testid="text-question">{q.q}</p>
          <textarea
            data-testid="answer-textarea"
            value={answer} onChange={(e) => setAnswer(e.target.value)}
            rows={8}
            placeholder="Type your answer here..."
            className="mt-6 w-full border-2 border-gray-300 px-4 py-3 focus:border-[#002FA7] focus:outline-none font-mono text-sm bg-white"
          />
          <button onClick={submit} disabled={busy} className="btn-primary mt-6" data-testid="submit-answer-button">
            {busy ? "Submitting…" : (idx + 1 === interview.questions.length ? "Submit & finish" : "Next question")}
          </button>
        </div>
      </main>
    </div>
  );
}
