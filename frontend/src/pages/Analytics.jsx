import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../lib/api";
import { BarChart3, TrendingUp, CheckCircle2, Clock, ArrowLeft } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const STATUS_COLORS = {
  pending: "#F59E0B", selected: "#10B981", next_round: "#002FA7", not_selected: "#FF3B30", archived: "#9CA3AF"
};

const STATUS_LABELS = {
  pending: "Pending", selected: "Selected", next_round: "Next round", not_selected: "Rejected", archived: "Archived"
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/hr/analytics");
        setData(data);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="p-12 text-sm text-gray-500">Loading…</div>;
  if (!data) return null;

  const statusPie = Object.entries(data.by_status || {})
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: STATUS_LABELS[k] || k, value: v, color: STATUS_COLORS[k] || "#9CA3AF" }));

  const scoreBuckets = Object.entries(data.score_buckets || {}).map(([range, count]) => ({ range, count }));

  return (
    <div className="bg-white">
      <Navbar/>
      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12" data-testid="analytics-page">
        <Link to="/hr" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#002FA7] mb-6"><ArrowLeft className="w-4 h-4"/> Back to dashboard</Link>
        <div className="overline text-[#002FA7] mb-2">// Analytics</div>
        <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tighter">Hiring at a glance.</h1>
        <p className="text-gray-600 mt-3 text-sm">Cohort metrics, score distribution and pipeline health for your workspace.</p>

        {/* KPI cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l border-gray-900 mt-10" data-testid="kpi-grid">
          {[
            { label: "Total invites", value: data.total, icon: BarChart3, color: "#002FA7" },
            { label: "Completed", value: data.completed, icon: CheckCircle2, color: "#10B981" },
            { label: "Completion rate", value: `${data.completion_rate}%`, icon: TrendingUp, color: "#FF3B30" },
            { label: "Avg score", value: data.avg_score || "—", icon: Clock, color: "#F59E0B" },
          ].map((k, i) => (
            <div key={i} className="border-r border-b border-gray-900 p-7 bg-white" data-testid={`kpi-${i}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="overline text-gray-500">{k.label}</span>
                <k.icon className="w-4 h-4" style={{ color: k.color }}/>
              </div>
              <div className="font-display text-4xl lg:text-5xl font-bold tracking-tighter" style={{ color: k.color }}>{k.value}</div>
            </div>
          ))}
        </section>

        {/* Status distribution + Score distribution */}
        <section className="grid lg:grid-cols-2 gap-6 mt-10">
          <div className="border border-gray-200 bg-white" data-testid="status-pie-card">
            <div className="border-b border-gray-200 px-6 py-3 overline text-[#002FA7]">Pipeline status</div>
            <div className="p-6 grid sm:grid-cols-2 gap-6 items-center">
              <div className="h-56">
                {statusPie.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusPie} dataKey="value" nameKey="name" innerRadius={48} outerRadius={88} stroke="#fff" strokeWidth={2}>
                        {statusPie.map((s, i) => <Cell key={i} fill={s.color}/>)}
                      </Pie>
                      <Tooltip contentStyle={{border:"1px solid #111827", borderRadius:0, fontSize:12}}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-full grid place-items-center text-sm text-gray-500">No data</div>}
              </div>
              <ul className="space-y-2.5">
                {statusPie.map((s, i) => (
                  <li key={i} className="flex items-center justify-between text-sm" data-testid={`status-row-${i}`}>
                    <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }}/>{s.name}</span>
                    <span className="font-mono text-[#111827]">{s.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border border-gray-200 bg-white" data-testid="score-bar-card">
            <div className="border-b border-gray-200 px-6 py-3 overline text-[#002FA7]">Score distribution</div>
            <div className="p-6 h-64">
              {scoreBuckets.some((b) => b.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreBuckets}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB"/>
                    <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={{ stroke: "#111827" }}/>
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={{ stroke: "#111827" }}/>
                    <Tooltip contentStyle={{border:"1px solid #111827", borderRadius:0, fontSize:12}}/>
                    <Bar dataKey="count" fill="#002FA7" radius={[2, 2, 0, 0]}/>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-full grid place-items-center text-sm text-gray-500">No completed scores yet</div>}
            </div>
          </div>
        </section>

        {/* Top roles + Format split */}
        <section className="grid lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 border border-gray-200 bg-white" data-testid="roles-card">
            <div className="border-b border-gray-200 px-6 py-3 overline text-[#002FA7]">Top roles by invite volume</div>
            {data.top_roles?.length > 0 ? (
              <div className="p-6 space-y-3">
                {data.top_roles.map((r, i) => {
                  const max = data.top_roles[0].count || 1;
                  const pct = (r.count / max) * 100;
                  return (
                    <div key={i} data-testid={`role-row-${i}`}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#111827] font-medium">{r.role}</span>
                        <span className="font-mono text-gray-600">{r.count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 overflow-hidden">
                        <div className="h-full bg-[#002FA7] transition-all duration-500" style={{ width: `${pct}%` }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <div className="p-6 text-sm text-gray-500">No data yet</div>}
          </div>
          <div className="border border-gray-200 bg-white" data-testid="format-card">
            <div className="border-b border-gray-200 px-6 py-3 overline text-[#002FA7]">Format split</div>
            <div className="p-6 space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-[#111827] font-medium">Text</span>
                  <span className="font-mono">{data.type_counts?.text || 0}</span>
                </div>
                <div className="h-2 bg-gray-100"><div className="h-full bg-[#60A5FA]" style={{ width: `${data.total ? ((data.type_counts?.text||0)/data.total)*100 : 0}%` }}/></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-[#111827] font-medium">Voice</span>
                  <span className="font-mono">{data.type_counts?.voice || 0}</span>
                </div>
                <div className="h-2 bg-gray-100"><div className="h-full bg-[#002FA7]" style={{ width: `${data.total ? ((data.type_counts?.voice||0)/data.total)*100 : 0}%` }}/></div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
