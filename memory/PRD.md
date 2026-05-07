# Scorebar.AI — Product Requirements Document

## Original Problem Statement
User cloned their Scorebar AI interviewer repo (https://github.com/vchart050-max/AI). They asked to:
1. Make the home page more professional (DONE)
2. Build a new Pricing page inspired by Arcus design (clean light theme + Monthly/Yearly toggle + 4 tiers + FAQ + sky CTA banner)
3. Add a "team member" feature gated behind premium plans — owners can invite teammates that work alongside them in the same workspace.

## Architecture
- Frontend: React 19 + Tailwind + React Router 7 + Sonner toasts
- Backend: FastAPI + Motor (MongoDB) + emergentintegrations (LLM / Whisper / TTS) + bcrypt
- Storage: MongoDB (`scorebar_db`) with collections: users, signup_requests, user_sessions, interviews, jobs, email_log
- LLM: Emergent Universal Key

## User Personas
1. **HR Owner** — primary admin of a workspace. Can invite teammates (premium). Holds the plan + quota.
2. **HR Teammate** — invited member. Shares the owner's workspace. Has own login. Cannot invite or remove.
3. **Candidate** — receives interview code, completes interview. No account.
4. **Admin** — approves HR signups, manages tenants.

## Core Requirements (static)
- Structured AI interviews (voice/video/text) with Whisper transcription
- 5-section GPT scoring rubric with transcript citations
- HR cohort dashboard with status filters
- Team workspace: owners + teammates (gated by plan)
- 4-tier pricing: FREE / STARTER / PROFESSIONAL / ENTERPRISE
- Approved-team-only onboarding

## Plans
| Plan | Monthly | Yearly | Interviews | Team seats | Notes |
|------|---------|--------|-----------|-----------|-------|
| FREE | $0 | $0 | 5 (30 days) | 1 | Basic AI scoring, evaluation only |
| STARTER ⭐ | $29.99 | $299.99 (-20%) | 20/mo | 2 | Most popular, deep AI scoring + custom Q-banks |
| PROFESSIONAL | $149.99 | $1,499.99 (-20%) | 100/mo | 5 | Advanced AI + voice, priority support |
| ENTERPRISE | Custom | Custom | Unlimited | Unlimited | White-label, dedicated CSM, SSO/DPA |

## What's Been Implemented (chronological)

### 2026-01-05 — Home page professional redesign
- Sticky scroll-aware Navbar with Company dropdown + mobile menu
- 12-section Landing page (Hero, Trusted-by, Stats, How It Works, Demo Preview, Capabilities, Testimonials, Pricing preview, FAQ, Candidate strip, CTA, Footer)
- New static pages: /about, /careers, /contact (form MOCKED), /blog
- Dropdown items: About / Careers / Blog / Contact
- 100% frontend test pass

### 2026-01-05 — CORS / preview-URL bugfix
- `/api/plans` was failing on the user's actual preview URL due to credentialed-CORS with `*` origin. Fixed by setting explicit `CORS_ORIGINS` list + `allow_origin_regex` for `*.emergentagent.com`.
- Updated `REACT_APP_BACKEND_URL` to user's preview hostname.
- Wrapped `/plans` axios call in try/catch so a transient network error never crashes the page.
- Added scroll-to-top on every route change in App.js.

### 2026-01-05 — Navbar copy
- "HR sign in" → "Dashboard" (desktop + mobile).
- "Product" anchor link smart-scrolls to Capabilities section; cross-page navigates to home then scrolls.

### 2026-01-05 — New Pricing page + Team management
**Backend (`server.py`):**
- Replaced legacy 3-plan list with new 4-plan structure (free / starter / professional / enterprise) with `price_usd_monthly`, `price_usd_yearly`, `price_inr_monthly`, `price_inr_yearly`, `team_members`, `interviews`, `highlight`.
- Added `plan_by_id()` with **legacy mapping**: `trial→free`, `pro→professional`, `business→enterprise` so existing seeded admin and old accounts aren't locked out.
- Added `/api/payments/create-order` and `/api/payments/verify` to accept `billing` (`monthly`|`yearly`).
- Added Team management endpoints (premium-gated):
  - `GET /api/team/members` — returns owner + teammates + plan limit
  - `POST /api/team/invite` — owner-only, enforces plan seat limit, returns temporary password (MOCKED email)
  - `DELETE /api/team/members/{member_id}` — owner-only
- New user field: `owner_user_id` (null for owners, owner's user_id for invited members).

**Frontend:**
- Rewrote `Pricing.jsx` (Arcus-inspired light theme): hero "Simple pricing. Real interviews." + Monthly/Yearly toggle (-20% badge) + INR/USD currency switch + 4 plan cards (Starter is MOST POPULAR, dark theme, blue CTA) + Trust strip + FAQ accordion + sky-blue gradient CTA banner.
- New `TeamSettings.jsx` page at `/hr/team`: seats panel (plan / used / available), premium-gate with upgrade CTA when plan=free or non-owner, members table with avatar+role+remove, invite modal that surfaces a one-time temporary password with copy-to-clipboard.
- Added "Team" button to HRDashboard CTAs.
- Updated Landing's pricing-preview cards to show Free/Starter/Professional teaser with "team members" copy.

### 2026-01-05 — Testing
- iteration_3.json: **11/11 backend tests pass + frontend flows pass**.
- Two non-blocking findings addressed:
  1. Legacy plan ID mapping added to `plan_by_id()` (FIXED).
  2. FAQ accordion default-open state working as designed (no fix needed).

## Test Credentials
See `/app/memory/test_credentials.md` — admin: `admin@scorebar.ai` / `admin123`.

## Prioritized Backlog
- **P1** — Wire `/api/contact` endpoint + email via Resend/SendGrid (currently MOCKED setTimeout)
- **P1** — Real Razorpay integration (currently MOCKED — `/api/payments/create-order` and `/api/payments/verify` directly mutate user.plan)
- **P2** — Owner-side downgrade/cancel flow (currently no path to revert to FREE without DB poke)
- **P2** — Real email send for team invite (currently `log_email()` writes to db.email_log)
- **P2** — Polish Login/Signup pages to match new aesthetic
- **P3** — Split server.py (~770 lines) into auth/payments/team/interviews routers
- **P3** — Map legacy plan ids on writes too (one-time DB migration)

## Next Action Items
1. Plug real Razorpay key via integration_playbook_expert_v2 → flip MOCK to live.
2. Add `/api/contact` endpoint to capture inbound leads + email notifications.
3. Add a "current plan" highlight on the Pricing page when the logged-in user is viewing.
