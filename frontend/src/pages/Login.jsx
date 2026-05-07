import React, { useState } from "react";
import { Brain } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const { data } = await api.post("/auth/login", { email, password: pw });
      setUser(data.user);
      navigate(data.user.email === (process.env.REACT_APP_ADMIN_EMAIL || "admin@aria.ai") ? "/admin" : "/hr");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white grid-pattern p-6" data-testid="login-page">
      <div className="card-bold bg-white p-10 max-w-md w-full">
        <div className="w-10 h-10 bg-[#002FA7] flex items-center justify-center mb-6"><Brain className="w-6 h-6 text-white"/></div>
        <h1 className="font-display text-3xl font-bold tracking-tighter">Sign in to Scorebar</h1>
        <p className="text-gray-600 text-sm mt-3">Approved hiring teams only. Use the username + password we emailed you.</p>

        <form onSubmit={submit} className="mt-8 space-y-4" data-testid="password-form">
          <input type="email" required placeholder="Work email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full border-2 border-gray-300 px-4 py-3 focus:outline-none focus:border-[#002FA7]" data-testid="login-email"/>
          <input type="password" required placeholder="Password" value={pw} onChange={(e)=>setPw(e.target.value)} className="w-full border-2 border-gray-300 px-4 py-3 focus:outline-none focus:border-[#002FA7]" data-testid="login-password"/>
          <button disabled={busy} className="btn-primary w-full" data-testid="login-submit">{busy?"Signing in…":"Sign in"}</button>
        </form>

        <div className="mt-8 text-xs text-gray-500 leading-relaxed">
          New team? <Link to="/signup" className="underline font-medium text-gray-900" data-testid="signup-link">Apply for access</Link> · access is granted after manual review.
        </div>
      </div>
    </div>
  );
}
