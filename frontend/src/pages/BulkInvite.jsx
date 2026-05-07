import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../lib/api";
import { toast } from "sonner";
import { Upload, FileText, Plus, Trash2, ArrowRight, CheckCircle2, AlertCircle, Download } from "lucide-react";

const SAMPLE_CSV = `name,email
Aisha Patel,aisha.patel@example.com
Marcus Lee,marcus.lee@example.com
Priya Menon,priya.menon@example.com
`;

function parseCSV(text) {
  const rows = text.replace(/\r/g, "").split("\n").map((l) => l.trim()).filter(Boolean);
  if (rows.length === 0) return { headers: [], records: [] };
  const headers = rows[0].split(",").map((h) => h.trim().toLowerCase());
  const nameIdx = headers.findIndex((h) => ["name", "candidate_name", "full_name"].includes(h));
  const emailIdx = headers.findIndex((h) => ["email", "candidate_email", "e-mail"].includes(h));
  if (nameIdx === -1 || emailIdx === -1) {
    throw new Error("CSV must contain 'name' and 'email' columns");
  }
  const records = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const name = cells[nameIdx];
    const email = cells[emailIdx];
    if (!name || !email) continue;
    if (!/^\S+@\S+\.\S+$/.test(email)) continue;
    records.push({ candidate_name: name, candidate_email: email });
  }
  return { headers, records };
}

export default function BulkInvite() {
  const fileRef = useRef(null);
  const navigate = useNavigate();
  const [csvText, setCsvText] = useState("");
  const [records, setRecords] = useState([]);
  const [parseError, setParseError] = useState("");
  const [role, setRole] = useState("Software Engineer");
  const [interviewType, setInterviewType] = useState("text");
  const [questions, setQuestions] = useState(["Tell us about yourself and what motivates you to apply.", "Walk us through a project you led end-to-end."]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    setCsvText(text);
    parseInline(text);
  };

  const parseInline = (text) => {
    setParseError("");
    try {
      const { records } = parseCSV(text);
      setRecords(records);
      if (records.length === 0) setParseError("No valid rows found.");
    } catch (e) {
      setParseError(e.message);
      setRecords([]);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "scorebar_sample.csv";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const removeRow = (i) => setRecords(records.filter((_, idx) => idx !== i));

  const updateQ = (i, v) => { const next = [...questions]; next[i] = v; setQuestions(next); };
  const addQ = () => setQuestions([...questions, ""]);
  const rmQ = (i) => setQuestions(questions.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!role.trim()) return toast.error("Role is required");
    const qs = questions.map((q) => q.trim()).filter(Boolean);
    if (qs.length === 0) return toast.error("Add at least one interview question");
    if (records.length === 0) return toast.error("Upload or paste at least one candidate");
    setSubmitting(true);
    try {
      const { data } = await api.post("/interviews/bulk-invite", {
        role: role.trim(), interview_type: interviewType, custom_questions: qs, candidates: records,
      });
      setResult(data);
      toast.success(`Created ${data.created.length} invite${data.created.length !== 1 ? "s" : ""}`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Bulk invite failed");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="bg-white">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-12" data-testid="bulk-invite-page">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div>
            <div className="overline text-[#002FA7] mb-2">// Bulk upload</div>
            <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tighter">Invite multiple candidates.</h1>
            <p className="text-gray-600 mt-3 text-sm max-w-2xl">Upload a CSV with <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5">name,email</span> columns, set the role and questions once, and we'll generate a unique invite for each candidate.</p>
          </div>
          <button onClick={downloadSample} className="btn-secondary inline-flex items-center gap-2 text-sm" data-testid="download-sample">
            <Download className="w-4 h-4"/> Download sample CSV
          </button>
        </div>

        {result ? (
          <section className="border-2 border-gray-900 p-7 bg-white shadow-[6px_6px_0_0_rgba(0,47,167,1)]" data-testid="bulk-result">
            <div className="overline text-[#10B981] mb-2 inline-flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5"/> Done</div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Created {result.created.length} invite{result.created.length !== 1 ? "s" : ""}</h2>
            {result.failed?.length > 0 && (
              <div className="text-xs text-[#FF3B30] mt-1">{result.failed.length} failed — most often duplicate or invalid email.</div>
            )}
            <div className="mt-5 max-h-72 overflow-auto border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 overline text-gray-500"><tr><th className="text-left px-4 py-2">Email</th><th className="text-left px-4 py-2">Code</th></tr></thead>
                <tbody>
                  {result.created.map((r, i) => (
                    <tr key={i} className="border-t border-gray-100"><td className="px-4 py-2">{r.email}</td><td className="px-4 py-2 font-mono text-xs">{r.code}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 flex gap-2">
              <Link to="/hr" className="btn-primary inline-flex items-center gap-2" data-testid="bulk-back">Back to dashboard <ArrowRight className="w-4 h-4"/></Link>
              <button onClick={() => { setResult(null); setRecords([]); setCsvText(""); }} className="btn-secondary text-sm">Send more</button>
            </div>
          </section>
        ) : (
          <>
            {/* Step 1: CSV */}
            <section className="border-2 border-gray-900 p-7 bg-white mb-6" data-testid="step-csv">
              <div className="overline text-[#002FA7] mb-3">// Step 1 · Candidates</div>
              <div className="flex items-center gap-3 mb-4">
                <button onClick={() => fileRef.current?.click()} className="btn-secondary inline-flex items-center gap-2 text-sm" data-testid="upload-file">
                  <Upload className="w-4 h-4"/> Choose CSV file
                </button>
                <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={onFile}/>
                <span className="text-xs text-gray-500">or paste below ↓</span>
              </div>
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => { setCsvText(e.target.value); parseInline(e.target.value); }}
                placeholder="name,email&#10;Aisha Patel,aisha@example.com&#10;Marcus Lee,marcus@example.com"
                className="w-full border-2 border-gray-300 px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#002FA7] resize-none"
                data-testid="csv-textarea"
              />
              {parseError && <div className="mt-3 text-sm text-[#FF3B30] inline-flex items-center gap-1.5"><AlertCircle className="w-4 h-4"/>{parseError}</div>}
              {records.length > 0 && (
                <div className="mt-4">
                  <div className="overline text-[#10B981] mb-2 inline-flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5"/> Parsed {records.length} valid candidate{records.length > 1 ? "s" : ""}</div>
                  <div className="max-h-60 overflow-auto border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 overline text-gray-500 sticky top-0"><tr><th className="text-left px-4 py-2">Name</th><th className="text-left px-4 py-2">Email</th><th className="px-2 w-10"></th></tr></thead>
                      <tbody>
                        {records.map((r, i) => (
                          <tr key={i} className="border-t border-gray-100" data-testid={`csv-row-${i}`}>
                            <td className="px-4 py-2">{r.candidate_name}</td>
                            <td className="px-4 py-2">{r.candidate_email}</td>
                            <td className="px-2"><button onClick={() => removeRow(i)} className="text-gray-400 hover:text-[#FF3B30]"><Trash2 className="w-3.5 h-3.5"/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            {/* Step 2: Role + Questions */}
            <section className="border-2 border-gray-900 p-7 bg-white mb-6" data-testid="step-config">
              <div className="overline text-[#002FA7] mb-3">// Step 2 · Interview setup</div>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="overline block mb-1.5">Role</label>
                  <input value={role} onChange={(e) => setRole(e.target.value)} className="w-full border-2 border-gray-900 px-4 py-3 text-sm focus:outline-none focus:border-[#002FA7]" data-testid="bulk-role"/>
                </div>
                <div>
                  <label className="overline block mb-1.5">Format</label>
                  <select value={interviewType} onChange={(e) => setInterviewType(e.target.value)} className="w-full border-2 border-gray-900 px-4 py-3 text-sm focus:outline-none focus:border-[#002FA7]" data-testid="bulk-format">
                    <option value="text">Text</option>
                    <option value="voice">Voice</option>
                  </select>
                </div>
              </div>

              <label className="overline block mb-2">Interview questions</label>
              <div className="space-y-2">
                {questions.map((q, i) => (
                  <div key={i} className="flex gap-2 items-start" data-testid={`question-${i}`}>
                    <span className="overline text-gray-400 w-6 mt-3">Q{i + 1}</span>
                    <textarea
                      rows={2}
                      value={q}
                      onChange={(e) => updateQ(i, e.target.value)}
                      className="flex-1 border-2 border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#002FA7] resize-none"
                    />
                    <button onClick={() => rmQ(i)} className="mt-2 w-8 h-8 grid place-items-center text-gray-400 hover:text-[#FF3B30]"><Trash2 className="w-4 h-4"/></button>
                  </div>
                ))}
              </div>
              <button onClick={addQ} className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#002FA7] hover:underline" data-testid="add-question">
                <Plus className="w-3.5 h-3.5"/> Add another question
              </button>
            </section>

            {/* Submit */}
            <div className="flex justify-between items-center gap-3 flex-wrap" data-testid="bulk-submit-row">
              <Link to="/hr" className="text-sm text-gray-600 hover:text-[#111827]">← Back to dashboard</Link>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  {records.length} candidate{records.length !== 1 ? "s" : ""} · {questions.filter((q) => q.trim()).length} question{questions.filter((q) => q.trim()).length !== 1 ? "s" : ""}
                </span>
                <button onClick={submit} disabled={submitting || records.length === 0} className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" data-testid="bulk-submit">
                  {submitting ? "Sending invites…" : <>Send {records.length} invite{records.length !== 1 ? "s" : ""} <ArrowRight className="w-4 h-4"/></>}
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
