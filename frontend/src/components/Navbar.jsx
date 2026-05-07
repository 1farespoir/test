import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Brain, LogOut, ChevronDown, Menu, X } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setCompanyOpen(false); }, [location.pathname]);

  // On home page, smooth-scroll to a section; from other pages, go home first then scroll.
  const goToSection = (id) => (e) => {
    e.preventDefault();
    if (location.pathname === "/") {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate(`/#${id}`);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header
      data-testid="app-navbar"
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-[0_1px_0_0_rgba(17,24,39,0.04)]"
          : "bg-white/70 backdrop-blur-md border-b border-gray-200/40"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-3 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group" data-testid="nav-logo">
          <div className="w-9 h-9 bg-[#002FA7] flex items-center justify-center shadow-[2px_2px_0_0_rgba(17,24,39,1)] group-hover:shadow-[3px_3px_0_0_rgba(17,24,39,1)] group-hover:-translate-x-[1px] group-hover:-translate-y-[1px] transition-all">
            <Brain className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-xl font-bold tracking-tighter text-[#111827]">Scorebar</span>
            <span className="overline text-[#002FA7]">.AI</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 text-sm">
          <Link
            to="/"
            data-testid="nav-home"
            className={`px-4 py-2 font-medium transition-colors ${isActive("/") ? "text-[#002FA7]" : "text-gray-700 hover:text-black"}`}
          >
            Home
          </Link>
          <a
            href="/#product"
            onClick={goToSection("product")}
            data-testid="nav-product"
            className="px-4 py-2 font-medium text-gray-700 hover:text-black transition-colors cursor-pointer"
          >
            Product
          </a>
          <Link
            to="/pricing"
            data-testid="nav-pricing"
            className={`px-4 py-2 font-medium transition-colors ${isActive("/pricing") ? "text-[#002FA7]" : "text-gray-700 hover:text-black"}`}
          >
            Pricing
          </Link>
          <Link
            to="/status"
            data-testid="nav-status"
            className={`px-4 py-2 font-medium transition-colors ${isActive("/status") ? "text-[#002FA7]" : "text-gray-700 hover:text-black"}`}
          >
            Check status
          </Link>

          {/* Company dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setCompanyOpen(true)}
            onMouseLeave={() => setCompanyOpen(false)}
          >
            <button
              onClick={() => setCompanyOpen((v) => !v)}
              data-testid="nav-company-trigger"
              className="px-4 py-2 font-medium text-gray-700 hover:text-black transition-colors inline-flex items-center gap-1"
              aria-expanded={companyOpen}
            >
              Company
              <ChevronDown className={`w-4 h-4 transition-transform ${companyOpen ? "rotate-180" : ""}`} />
            </button>
            {companyOpen && (
              <div
                data-testid="nav-company-menu"
                className="absolute top-full left-0 pt-2 w-64 z-50"
              >
                <div className="bg-white border-2 border-gray-900 shadow-[6px_6px_0_0_rgba(17,24,39,1)]">
                  <Link to="/about" data-testid="menu-about" className="block px-5 py-3 text-sm font-medium text-gray-800 hover:bg-[#F3F4F6] hover:text-[#002FA7] border-b border-gray-200 transition-colors">
                    <div className="flex items-center justify-between">
                      <span>About us</span>
                      <span className="overline text-gray-400">01</span>
                    </div>
                    <div className="text-xs text-gray-500 font-normal mt-0.5">Our mission & story</div>
                  </Link>
                  <Link to="/careers" data-testid="menu-careers" className="block px-5 py-3 text-sm font-medium text-gray-800 hover:bg-[#F3F4F6] hover:text-[#002FA7] border-b border-gray-200 transition-colors">
                    <div className="flex items-center justify-between">
                      <span>Careers</span>
                      <span className="overline text-[#FF3B30]">Hiring</span>
                    </div>
                    <div className="text-xs text-gray-500 font-normal mt-0.5">Join our team</div>
                  </Link>
                  <Link to="/blog" data-testid="menu-blog" className="block px-5 py-3 text-sm font-medium text-gray-800 hover:bg-[#F3F4F6] hover:text-[#002FA7] border-b border-gray-200 transition-colors">
                    <div className="flex items-center justify-between">
                      <span>Blog</span>
                      <span className="overline text-gray-400">03</span>
                    </div>
                    <div className="text-xs text-gray-500 font-normal mt-0.5">Insights on modern hiring</div>
                  </Link>
                  <Link to="/candidate-resources" data-testid="menu-resources" className="block px-5 py-3 text-sm font-medium text-gray-800 hover:bg-[#F3F4F6] hover:text-[#002FA7] border-b border-gray-200 transition-colors">
                    <div className="flex items-center justify-between">
                      <span>Candidate Resources</span>
                      <span className="overline text-[#10B981]">New</span>
                    </div>
                    <div className="text-xs text-gray-500 font-normal mt-0.5">Tips, FAQs & help for candidates</div>
                  </Link>
                  <Link to="/contact" data-testid="menu-contact" className="block px-5 py-3 text-sm font-medium text-gray-800 hover:bg-[#F3F4F6] hover:text-[#002FA7] transition-colors">
                    <div className="flex items-center justify-between">
                      <span>Contact sales</span>
                      <span className="overline text-gray-400">05</span>
                    </div>
                    <div className="text-xs text-gray-500 font-normal mt-0.5">Talk to our team</div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {user && (
            <Link to="/hr" className={`px-4 py-2 font-medium transition-colors ${isActive("/hr") ? "text-[#002FA7]" : "text-gray-700 hover:text-black"}`} data-testid="nav-hr">
              HR Workspace
            </Link>
          )}
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-sm mr-1">
                {user.picture && <img src={user.picture} alt="" className="w-7 h-7"/>}
                <span className="font-medium" data-testid="nav-user-name">{user.name}</span>
                <span className="overline text-[#002FA7]" data-testid="nav-plan">{user.plan}</span>
              </div>
              <button onClick={logout} className="btn-secondary !py-2 !px-3 text-sm" data-testid="logout-button">
                <LogOut className="w-4 h-4"/>
              </button>
            </>
          ) : (
            <div className="hidden sm:flex gap-2 items-center">
              <Link to="/signup" className="text-sm font-medium text-gray-700 hover:text-black px-3 py-2" data-testid="signup-cta">Apply</Link>
              <button onClick={() => navigate("/login")} className="btn-primary !py-2 !px-5 text-sm" data-testid="login-button">
                Dashboard
              </button>
            </div>
          )}
          <button
            data-testid="mobile-menu-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 border-2 border-gray-900"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t-2 border-gray-900 bg-white" data-testid="mobile-menu">
          <div className="max-w-7xl mx-auto px-6 py-4 space-y-1">
            <Link to="/" className="block py-2 font-medium" data-testid="m-nav-home">Home</Link>
            <a href="/#product" className="block py-2 font-medium">Product</a>
            <Link to="/pricing" className="block py-2 font-medium" data-testid="m-nav-pricing">Pricing</Link>
            <Link to="/status" className="block py-2 font-medium" data-testid="m-nav-status">Check status</Link>
            <div className="pt-2 border-t border-gray-200 mt-2">
              <div className="overline text-gray-500 py-2">Company</div>
              <Link to="/about" className="block py-2 pl-3 text-sm" data-testid="m-menu-about">About us</Link>
              <Link to="/careers" className="block py-2 pl-3 text-sm" data-testid="m-menu-careers">Careers <span className="overline text-[#FF3B30] ml-2">Hiring</span></Link>
              <Link to="/blog" className="block py-2 pl-3 text-sm">Blog</Link>
              <Link to="/candidate-resources" className="block py-2 pl-3 text-sm" data-testid="m-menu-resources">Candidate Resources <span className="overline text-[#10B981] ml-2">New</span></Link>
              <Link to="/contact" className="block py-2 pl-3 text-sm" data-testid="m-menu-contact">Contact sales</Link>
            </div>
            {!user && (
              <div className="pt-3 flex gap-2 border-t border-gray-200 mt-2">
                <Link to="/signup" className="btn-secondary flex-1 text-center !py-2 text-sm" data-testid="m-signup-cta">Apply</Link>
                <button onClick={() => navigate("/login")} className="btn-primary flex-1 !py-2 text-sm" data-testid="m-login-button">Dashboard</button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
