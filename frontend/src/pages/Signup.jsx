import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Brain, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const FIELDS = [
  { k: "company_name", l: "Company name", req: true, ph: "Acme Inc." },
  { k: "company_website", l: "Company website", ph: "https://acme.com" },
  { k: "company_socials", l: "Company socials (LinkedIn / Crunchbase URLs)", ph: "https://linkedin.com/company/acme" },
  { k: "hr_name", l: "HR / Hiring manager name", req: true },
  { k: "work_email", l: "Work email", req: true, type: "email", ph: "you@acme.com" },
  { k: "phone", l: "Phone number", req: true, ph: "+1 555 123 4567" },
];

const EMPLOYEE_OPTIONS = ["1-10","11-50","51-200","201-500","500+"];

export default function Signup() {
  const [form, setForm] = useState({
    company_name:"", company_website:"", company_socials:"",
    hr_name:"", work_email:"", phone:"", employees_count:"1-10",
    job_roles:"", hiring_volume:""
  });
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      await api.post("/signup", form);
      setSubmitted(true);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Submission failed");
    } finally { setBusy(false); }
  };

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center grid-pattern p-6">
      <div className="card-bold p-10 max-w-lg w-full bg-white" data-testid="signup-success">
        <CheckCircle2 className="w-10 h-10 text-[#10B981] mb-4"/>
        <h1 className="font-display text-3xl font-bold tracking-tighter">Application received.</h1>
        <p className="text-gray-600 text-sm mt-3">Thanks {form.hr_name.split(" ")[0]}. We manually review every team. You'll get an email with your username, password, and a 30-day free trial when approved.</p>
        <Link to="/" className="btn-secondary mt-8 inline-block">Back home</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white grid-pattern py-12 px-6">
      <div className="max-w-2xl mx-auto" data-testid="signup-page">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-[#002FA7] flex items-center justify-center"><Brain className="w-5 h-5 text-white"/></div>
          <span className="font-display text-xl font-bold tracking-tighter">SCOREBAR</span>
        </Link>
        <div className="overline text-[#002FA7] mb-2">// HIRING TEAM SIGNUP</div>
        <h1 className="font-display text-4xl font-bold tracking-tighter">Apply to interview with Scorebar.</h1>
        <p className="text-gray-600 text-sm mt-3">Manual review. Once approved, you get a 5-interview free trial for 30 days.</p>

        <form onSubmit={submit} className="card-bold p-8 mt-10 space-y-5">
          {FIELDS.map((f) => (
            <div key={f.k}>
              <label className="overline block mb-2">{f.l}{f.req && <span className="text-[#FF3B30]"> *</span>}</label>
              <input required={f.req} type={f.type||"text"} placeholder={f.ph||""} value={form[f.k]} onChange={(e)=>set(f.k, e.target.value)} className="w-full border-2 border-gray-300 px-4 py-3 focus:outline-none focus:border-[#002FA7]" data-testid={`signup-${f.k}`}/>
            </div>
          ))}
          <div>
            <label className="overline block mb-2">Number of employees<span className="text-[#FF3B30]"> *</span></label>
            <div className="grid grid-cols-5 gap-0 border-2 border-gray-900">
              {EMPLOYEE_OPTIONS.map((o,i)=>(
                <button type="button" key={o} onClick={()=>set("employees_count",o)} className={`p-2 text-xs ${form.employees_count===o?"bg-gray-900 text-white":"bg-white"} ${i>0?"border-l-2 border-gray-900":""}`} data-testid={`emp-${o}`}>{o}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="overline block mb-2">Job roles you're hiring for</label>
            <textarea rows={3} value={form.job_roles} onChange={(e)=>set("job_roles", e.target.value)} placeholder="e.g. Senior Frontend Engineer, Product Designer, Data Scientist" className="w-full border-2 border-gray-300 px-4 py-3 focus:outline-none focus:border-[#002FA7]" data-testid="signup-roles"/>
          </div>
          <div>
            <label className="overline block mb-2">Current hiring volume (interviews / month)</label>
            <input value={form.hiring_volume} onChange={(e)=>set("hiring_volume", e.target.value)} placeholder="e.g. 30 / month" className="w-full border-2 border-gray-300 px-4 py-3 focus:outline-none focus:border-[#002FA7]" data-testid="signup-volume"/>
          </div>
          <button disabled={busy} className="btn-primary w-full" data-testid="signup-submit">{busy?"Submitting…":"Submit application"}</button>
          <p className="text-xs text-gray-500 text-center">Already approved? <Link to="/login" className="underline">Log in</Link></p>
        </form>
      </div>
    </div>
  );
}
