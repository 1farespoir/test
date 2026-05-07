import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    (async () => {
      const hash = window.location.hash;
      const sessionId = new URLSearchParams(hash.slice(1)).get("session_id");
      if (!sessionId) { navigate("/login"); return; }
      try {
        const { data } = await api.post("/auth/google/session", { session_id: sessionId });
        setUser(data.user);
        window.history.replaceState({}, "", "/hr");
        navigate("/hr", { state: { user: data.user } });
      } catch {
        navigate("/login");
      }
    })();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center" data-testid="auth-callback">
      <div className="font-mono text-sm text-gray-500">Establishing session...</div>
    </div>
  );
}
