import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Mic, FileText, ChevronRight, Plus } from "lucide-react";

export default function Dashboard() {
  const { user, checkAuth } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/interviews");
        setInterviews(data.interviews || []);
      } finally { setLoading(false); }
    })();
  }, []);

  const switchRole = async (role) => {
    await api.post("/auth/role", { role });
    await checkAuth();
  };

  if (!user) return <div className="p-12">Loading...</div>;

  return (
    <div>
      <Navbar/>
      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12" data-testid="dashboard">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div>
            <div className="overline text-[#002FA7] mb-3">// WORKSPACE</div>
            <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tighter">Hello, {user.name.split(' ')[0]}.</h1>
            <p className="text-gray-600 mt-3 text-sm">Plan: <span className="font-medium uppercase">{user.plan}</span> · Interviews used: <span className="font-mono">{user.interviews_used}</span></p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => switchRole(user.role === "hr" ? "candidate" : "hr")} className="btn-secondary text-sm" data-testid="toggle-role">
              Switch to {user.role === "hr" ? "Candidate" : "HR"}
            </button>
            <Link to="/interview/new" className="btn-primary inline-flex items-center gap-2" data-testid="new-interview-button"><Plus className="w-4 h-4"/> New interview</Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-0 border-t border-l border-gray-200 mb-12">
          <Link to="/interview/new?type=voice" className="border-r border-b border-gray-200 p-8 hover:bg-gray-50 group" data-testid="card-voice">
            <Mic className="w-7 h-7 text-[#002FA7]"/>
            <h3 className="font-display text-2xl font-bold mt-6">Voice Interview</h3>
            <p className="text-sm text-gray-600 mt-2">AI-driven conversation, video + audio recording, deep scoring.</p>
            <div className="mt-6 inline-flex items-center text-sm text-[#002FA7] group-hover:gap-3 gap-2 transition-all">Start <ChevronRight className="w-4 h-4"/></div>
          </Link>
          <Link to="/interview/new?type=text" className="border-r border-b border-gray-200 p-8 hover:bg-gray-50 group" data-testid="card-text">
            <FileText className="w-7 h-7 text-[#FF3B30]"/>
            <h3 className="font-display text-2xl font-bold mt-6">Text Assessment</h3>
            <p className="text-sm text-gray-600 mt-2">Coding, Math, or General Knowledge. 5 graded questions.</p>
            <div className="mt-6 inline-flex items-center text-sm text-[#FF3B30] group-hover:gap-3 gap-2 transition-all">Start <ChevronRight className="w-4 h-4"/></div>
          </Link>
        </div>

        <div className="overline text-gray-500 mb-4">// History</div>
        <div className="card-flat" data-testid="interviews-list">
          {loading ? <div className="p-8 text-sm text-gray-500">Loading…</div> :
            interviews.length === 0 ? <div className="p-8 text-sm text-gray-500">No interviews yet. Start one above.</div> :
            <div>
              {interviews.map((it) => (
                <Link key={it.id} to={`/interview/${it.id}/report`} className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b border-gray-100 hover:bg-gray-50" data-testid={`interview-row-${it.id}`}>
                  <div className="col-span-4 font-medium">{it.role}</div>
                  <div className="col-span-3 text-sm text-gray-600 capitalize">{it.interview_type}{it.category ? ` · ${it.category}` : ""}</div>
                  <div className="col-span-2 text-sm"><span className={`overline ${it.status === "completed" ? "text-[#10B981]" : "text-[#F59E0B]"}`}>{it.status}</span></div>
                  <div className="col-span-2 font-mono text-sm">{it.overall ? `${it.overall}/100` : "—"}</div>
                  <div className="col-span-1 text-right text-gray-400"><ChevronRight className="w-4 h-4 inline"/></div>
                </Link>
              ))}
            </div>}
        </div>
      </main>
    </div>
  );
}
