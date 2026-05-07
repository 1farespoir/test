# Scorebar.AI — Product Requirements Document

## Original Problem Statement
User cloned Scorebar AI interviewer repo (https://github.com/1farespoir/aimain) for a project handover. They want to:
1. Deploy the existing app to production (Vercel + Render + MongoDB Atlas + Supabase + custom domain `scorebar.bar`)
2. Then wire real Razorpay (payments) and Mailtrap (email) once the public website is live (both providers require a verified domain to issue production keys).

## Architecture
- Frontend: React 19 + Tailwind + React Router 7 + Sonner toasts → **Vercel**
- Backend: FastAPI + Motor (MongoDB) + emergentintegrations (LLM / Whisper / TTS) + bcrypt → **Render**
- Storage (text/metadata): **MongoDB Atlas** (free M0)
- Storage (binary files: .webm recordings, .pdf resumes): **Supabase Storage** (free 1GB, private bucket + signed URLs)
- LLM: Emergent Universal Key (GPT-4o for scoring, Whisper for STT, OpenAI TTS)
- Payments: **Razorpay** (live mode after KYC)
- Email: **Mailtrap Email Sending** (after domain verification)
- Domain: **scorebar.bar** (frontend = root, backend = `api.scorebar.bar`)

## User Personas
1. **HR Owner** — primary admin of a workspace. Can invite teammates (premium). Holds the plan + quota.
2. **HR Teammate** — invited member. Shares the owner's workspace. Has own login. Cannot invite or remove.
3. **Candidate** — receives interview code, completes interview. No account.
4. **Admin** — approves HR signups, manages tenants.

## Plans (4-tier)
| Plan | Monthly | Yearly | Interviews | Team seats |
|------|---------|--------|-----------|-----------|
| FREE | $0 | $0 | 5 (30 days) | 1 |
| STARTER ⭐ | $29.99 | $299.99 | 20/mo | 2 |
| PROFESSIONAL | $149.99 | $1,499.99 | 100/mo | 5 |
| ENTERPRISE | Custom | Custom | Unlimited | Unlimited |

## What's Been Implemented

### Pre-handover (per old PRD)
- Landing page redesign + 12 sections
- 4-tier Pricing page with monthly/yearly + INR/USD toggle
- Team workspace (owner + invited teammates, plan-gated)
- HR Dashboard, Interview Session, Interview Report, Bulk Invite, Analytics
- Admin Panel + signup approval
- Auth (bcrypt + session cookies)
- Plan/payment endpoints (Razorpay MOCKED)
- Contact form (MOCKED)
- Team invite emails (MOCKED — written to `db.email_log`)

### 2026-05-07 — Deployment prep (this session)
- Cloned `1farespoir/aimain` into `/app`, restored `EMERGENT_LLM_KEY`, `ADMIN_EMAIL`, `DB_NAME=scorebar_db`, `CORS_ORIGINS` in backend `.env`
- Verified backend (`/api/`, `/api/plans`) + frontend (landing renders cleanly) running in preview
- **NEW** `/app/backend/storage.py` — Supabase Storage abstraction with **graceful local-disk fallback** (uses Supabase if `SUPABASE_URL`+`SUPABASE_SERVICE_KEY` env set, else local `./uploads/`)
- Refactored `/api/upload/video` and `/api/files/{filename}` in `server.py` to use the abstraction (Supabase upload + signed URL redirect in prod)
- Added `/health` endpoint (returns `remote_storage` flag for Render health checks)
- Added `supabase>=2.4.0` + `gunicorn>=21.2.0` to `requirements.txt`
- **NEW** `/app/render.yaml` — Render Blueprint (rootDir=backend, gunicorn+uvicorn workers, healthCheckPath=/health, all env vars stubbed)
- **NEW** `/app/frontend/vercel.json` — Vercel CRA config with SPA rewrites
- Updated `.gitignore` to exclude `backend/uploads/*.webm` (prevents future commits of recordings)
- **NEW** `/app/DEPLOYMENT.md` — full step-by-step guide: MongoDB Atlas → Supabase → GitHub push → Render → Vercel → custom domain → Razorpay KYC → Mailtrap domain verification

## Test Credentials
See `/app/memory/test_credentials.md`.

## Prioritized Backlog
- **P0** — User executes DEPLOYMENT.md (Atlas, Supabase, Render, Vercel, DNS) → website live on scorebar.bar
- **P1** — Wire real Razorpay (`/api/payments/create-order` + `/api/payments/verify`) — needs live KYC
- **P1** — Wire real Mailtrap Email Sending (`/api/contact` + team invites + interview links) — needs verified domain
- **P2** — Owner-side downgrade/cancel plan flow
- **P2** — Polish Login/Signup pages to match new aesthetic
- **P3** — Split server.py (~895 lines) into auth/payments/team/interviews routers
- **P3** — Purge old `backend/uploads/*.webm` from git history

## Next Action Items
1. **User**: Follow `/app/DEPLOYMENT.md` STEP 1 → STEP 6 → ping back with the live URL
2. **Main agent (next session)**: Wire real Razorpay using integration_playbook_expert_v2 → replace MOCK in payments endpoints
3. **Main agent (next session)**: Wire real Mailtrap Sending → replace MOCK in `/api/contact` + `log_email()` for invites
