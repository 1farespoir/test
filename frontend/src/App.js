import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import HRDashboard from "./pages/HRDashboard";
import CreateInvite from "./pages/CreateInvite";
import CreateJob from "./pages/CreateJob";
import InterviewSession from "./pages/InterviewSession";
import InterviewReport from "./pages/InterviewReport";
import InterviewThanks from "./pages/InterviewThanks";
import TextAssessment from "./pages/TextAssessment";
import Pricing from "./pages/Pricing";
import Signup from "./pages/Signup";
import AdminPanel from "./pages/AdminPanel";
import AdminPortal from "./pages/AdminPortal";
import Apply from "./pages/Apply";
import Status from "./pages/Status";
import Careers from "./pages/Careers";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import TeamSettings from "./pages/TeamSettings";
import CandidateResources from "./pages/CandidateResources";
import BulkInvite from "./pages/BulkInvite";
import Analytics from "./pages/Analytics";

function ProtectedHR({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-12 text-sm text-gray-500">Loading…</div>;
  if (!user) return <Navigate to="/login" replace/>;
  return children;
}

function AppRouter() {
  const location = useLocation();

  // Scroll to top on route change (React Router v7 doesn't do this by default).
  // If the location has a hash, skip so anchor links work.
  React.useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname, location.hash]);

  if (location.hash?.includes("session_id=")) return <AuthCallback/>;
  return (
    <Routes>
      <Route path="/" element={<Landing/>}/>
      <Route path="/login" element={<Login/>}/>
      <Route path="/signup" element={<Signup/>}/>
      <Route path="/admin" element={<ProtectedHR><AdminPanel/></ProtectedHR>}/>
      <Route path="/admin-portal" element={<AdminPortal/>}/>
      <Route path="/pricing" element={<Pricing/>}/>
      <Route path="/apply/:job_code" element={<Apply/>}/>
      <Route path="/join" element={<Landing/>}/>
      <Route path="/status" element={<Status/>}/>
      <Route path="/careers" element={<Careers/>}/>
      <Route path="/about" element={<About/>}/>
      <Route path="/contact" element={<Contact/>}/>
      <Route path="/blog" element={<Blog/>}/>
      <Route path="/candidate-resources" element={<CandidateResources/>}/>
      <Route path="/resources" element={<CandidateResources/>}/>
      <Route path="/hr" element={<ProtectedHR><HRDashboard/></ProtectedHR>}/>
      <Route path="/hr/team" element={<ProtectedHR><TeamSettings/></ProtectedHR>}/>
      <Route path="/hr/bulk-invite" element={<ProtectedHR><BulkInvite/></ProtectedHR>}/>
      <Route path="/hr/analytics" element={<ProtectedHR><Analytics/></ProtectedHR>}/>
      <Route path="/dashboard" element={<Navigate to="/hr" replace/>}/>
      <Route path="/hr/create-invite" element={<ProtectedHR><CreateInvite/></ProtectedHR>}/>
      <Route path="/hr/create-job" element={<ProtectedHR><CreateJob/></ProtectedHR>}/>
      <Route path="/interview/:id/session" element={<InterviewSession/>}/>
      <Route path="/interview/:id/text" element={<TextAssessment/>}/>
      <Route path="/interview/:id/thanks" element={<InterviewThanks/>}/>
      <Route path="/interview/:id/report" element={<InterviewReport/>}/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  );
}

export default function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <AppRouter/>
          <Toaster position="top-right" richColors/>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}
