# Scorebar.AI — Deployment Guide

Domain: **scorebar.bar**
Backend host: **Render** (free tier OK to start)
Frontend host: **Vercel**
Database: **MongoDB Atlas** (free M0 cluster)
File storage: **Supabase Storage** (free tier, 1 GB)
Payments: **Razorpay** (live keys after deploy)
Email: **Mailtrap Email Sending** (live keys after deploy)

> Order matters. Do steps in sequence — each one produces credentials needed in the next.

---

## STEP 1 — Create MongoDB Atlas free cluster (~5 min)

1. Go to https://www.mongodb.com/cloud/atlas/register and sign up (use your scorebar.bar email).
2. Create an organization → create a project named **`Scorebar`**.
3. Click **Create** → choose **M0 FREE**:
   - Provider: **AWS**
   - Region: pick the one closest to your users (e.g. `Mumbai ap-south-1` for India)
   - Cluster name: `scorebar-prod`
   - Click **Create Deployment**.
4. **Database Access** (left sidebar) → **Add New Database User**:
   - Auth Method: **Password**
   - Username: `scorebar_app`
   - Password: click **Autogenerate** → **COPY IT NOW** (you won't see it again)
   - Built-in role: **Read and write to any database**
   - Add User
5. **Network Access** → **Add IP Address** → click **Allow Access from Anywhere** (`0.0.0.0/0`)
   - Render uses dynamic IPs, so this is required. (Atlas data is still protected by username/password + TLS.)
6. **Database** (left sidebar) → click **Connect** on your cluster → **Drivers** → choose **Python 3.12 or later**
   - Copy the connection string. It looks like:
     ```
     mongodb+srv://scorebar_app:<password>@scorebar-prod.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=scorebar-prod
     ```
   - Replace `<password>` with the password from step 4.
   - Append your DB name before the `?`:
     ```
     mongodb+srv://scorebar_app:YOUR_PASS@scorebar-prod.xxxxx.mongodb.net/scorebar_db?retryWrites=true&w=majority&appName=scorebar-prod
     ```
7. **Save this string** — it goes into Render env var `MONGO_URL` later.

✅ Test it locally first (paste in `/app/backend/.env` temporarily, restart backend, confirm `/api/plans` still works) before pasting into Render.

---

## STEP 2 — Create Supabase project + Storage bucket (~10 min)

1. Go to https://supabase.com → **Start your project** → sign in with GitHub.
2. **New Project**:
   - Org: create new (name it `Scorebar`)
   - Project name: `scorebar`
   - Database password: click generate → **COPY** (you won't need it for storage, but save it)
   - Region: same as your Atlas (e.g. `ap-south-1 Mumbai`)
   - Plan: **Free**
   - Click **Create new project**, wait ~90s.
3. Once provisioned, go to **Project Settings** (gear icon, bottom left) → **API**:
   - Copy **Project URL** → this is `SUPABASE_URL`
   - Copy **service_role** secret (under "Project API keys" → reveal) → this is `SUPABASE_SERVICE_KEY`
   - ⚠️ **NEVER** commit service_role to git. Backend only.
4. **Storage** (left sidebar) → **Create a new bucket**:
   - Name: `interview-recordings`
   - Public bucket: **OFF** (keep private)
   - Allowed MIME types: leave blank for now (we'll restrict later)
   - File size limit: `500 MB`
   - Click **Save**
5. Click the bucket → **Policies** tab → **New Policy** → **For full customization**:
   - Policy name: `service_role full access`
   - Allowed operation: select **all 4** (SELECT, INSERT, UPDATE, DELETE)
   - Target roles: leave at `service_role`
   - USING expression: `true`
   - WITH CHECK expression: `true`
   - Click **Save policy**.
   - (Why: backend uses service_role key which already bypasses RLS, but Supabase requires at least one policy on private buckets.)

✅ Save these 3 values for Render:
- `SUPABASE_URL=https://xxxxx.supabase.co`
- `SUPABASE_SERVICE_KEY=eyJhbGc...` (long string)
- `SUPABASE_BUCKET=interview-recordings`

---

## STEP 3 — Push code to GitHub `1farespoir/aimain`

Use the **"Save to GitHub"** button in the Emergent chat input. This pushes everything in `/app` to your repo.

> ⚠️ Before pushing, the existing `backend/uploads/*.webm` files are now in `.gitignore`. They'll stay in git history but won't grow further. If you want to purge them from history, run locally after pushing:
> ```bash
> git rm -r --cached backend/uploads/*.webm
> git commit -m "remove tracked interview recordings"
> git push
> ```

---

## STEP 4 — Deploy backend to Render (~5 min)

1. Go to https://render.com → sign up with GitHub → connect to `1farespoir/aimain`.
2. Click **New +** → **Blueprint** (Render reads `render.yaml` automatically).
3. Select repo `1farespoir/aimain` → Render detects `render.yaml` → click **Apply**.
4. Render asks you to fill the secret env vars (those marked `sync: false`). Fill in:

| Variable | Value |
|---|---|
| `MONGO_URL` | full Atlas string from STEP 1 |
| `CORS_ORIGINS` | `https://scorebar.bar,https://www.scorebar.bar,https://scorebar.vercel.app` |
| `EMERGENT_LLM_KEY` | `sk-emergent-2C3C4637aC7C419A6E` (from local `.env`) |
| `SUPABASE_URL` | from STEP 2 |
| `SUPABASE_SERVICE_KEY` | from STEP 2 (service_role) |
| `RAZORPAY_KEY_ID` | leave blank — fill after STEP 7 |
| `RAZORPAY_KEY_SECRET` | leave blank — fill after STEP 7 |
| `MAILTRAP_API_TOKEN` | leave blank — fill after STEP 8 |

5. Click **Apply** → Render builds + deploys. Takes ~3–5 min.
6. Once green, copy your Render URL: `https://scorebar-api.onrender.com`
7. Test: open `https://scorebar-api.onrender.com/health` → should return `{"status":"healthy","remote_storage":true}`
   - If `remote_storage:false`, your Supabase env vars are missing — recheck.
8. Test admin login still works:
   ```
   curl -X POST https://scorebar-api.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@scorebar.ai","password":"admin123"}'
   ```
   ⚠️ Note: the seeded admin uses `ADMIN_EMAIL` env var. We changed it to `admin@scorebar.bar` in `render.yaml`. Use that email + password `admin123` after first deploy.

---

## STEP 5 — Deploy frontend to Vercel (~5 min)

1. Go to https://vercel.com → sign up with GitHub.
2. **Add New** → **Project** → Import `1farespoir/aimain`.
3. **Framework Preset**: Create React App.
4. **Root Directory**: click **Edit** → set to `frontend`.
5. **Environment Variables**, add:
   - `REACT_APP_BACKEND_URL` = `https://scorebar-api.onrender.com` (your Render URL from STEP 4)
6. Click **Deploy**. Takes ~2–3 min.
7. Vercel gives you a URL like `https://scorebar.vercel.app`. Open it — should show your landing page.
8. Test login flow end-to-end.

---

## STEP 6 — Connect custom domain `scorebar.bar` (~10 min)

### 6a. Vercel (frontend → root domain)
1. Vercel project → **Settings** → **Domains** → **Add** → enter `scorebar.bar`.
2. Add `www.scorebar.bar` too (Vercel auto-redirects www → root).
3. Vercel shows DNS records to add. Go to your domain registrar's DNS panel:

| Type | Name | Value |
|---|---|---|
| A | `@` | `76.76.21.21` (Vercel's IP) |
| CNAME | `www` | `cname.vercel-dns.com` |

4. Wait 1–10 min for DNS propagation. Vercel auto-issues TLS cert.
5. Open https://scorebar.bar → should load the app over HTTPS.

### 6b. Render (backend → api subdomain)
1. Render service → **Settings** → **Custom Domain** → **Add** → enter `api.scorebar.bar`.
2. Render gives you a CNAME target like `scorebar-api.onrender.com`.
3. In your DNS panel, add:

| Type | Name | Value |
|---|---|---|
| CNAME | `api` | `scorebar-api.onrender.com` |

4. Wait for cert. Then update:
   - **Vercel** env var `REACT_APP_BACKEND_URL` → `https://api.scorebar.bar` → redeploy frontend
   - **Render** env var `CORS_ORIGINS` → `https://scorebar.bar,https://www.scorebar.bar` → redeploy backend

✅ Now everything runs on your domain.

---

## STEP 7 — Activate Razorpay (live mode) (~24h KYC)

1. Go to https://dashboard.razorpay.com → sign up with your business email.
2. Complete **KYC**:
   - Business name, type, PAN, GSTIN
   - Bank account
   - **Website URL**: `https://scorebar.bar` ← this is why we deployed first
3. Razorpay reviews in 1–24h. Once live mode is enabled:
4. Go to **Settings** → **API Keys** → **Generate Live Key**.
5. Copy `key_id` (`rzp_live_xxx`) and `key_secret`.
6. Add to Render env vars:
   - `RAZORPAY_KEY_ID=rzp_live_xxx`
   - `RAZORPAY_KEY_SECRET=xxx`
7. The backend's `/api/payments/create-order` and `/api/payments/verify` are currently MOCKED — we'll wire real Razorpay in the next session.

(For testing now, use **Test mode** keys: Razorpay → Settings → API Keys → Generate Test Key. These work without KYC.)

---

## STEP 8 — Activate Mailtrap Email Sending (~30 min + DNS wait)

1. Go to https://mailtrap.io → **Email Sending** product (NOT "Email Testing").
2. **Sending Domains** → **Add Domain** → enter `scorebar.bar`.
3. Mailtrap shows DNS records to add (DKIM, SPF, DMARC). In your DNS panel, add all of them.
4. Wait 5–60 min for DNS verification → green checkmarks.
5. **API Tokens** → **Create token** → name it `scorebar-prod` → copy.
6. Add to Render env vars:
   - `MAILTRAP_API_TOKEN=xxx`
   - `MAILTRAP_SENDER_EMAIL=noreply@scorebar.bar`
7. Backend currently has `/api/contact` and team invite emails MOCKED — we'll wire real Mailtrap in the next session.

---

## STEP 9 — Final smoke tests

After everything is live:

- [ ] `https://scorebar.bar` loads landing page
- [ ] `https://api.scorebar.bar/health` returns `{"status":"healthy","remote_storage":true}`
- [ ] Login as `admin@scorebar.bar` / `admin123` → HR dashboard loads
- [ ] Create a test interview, record video → file should appear in Supabase Storage bucket (not local disk)
- [ ] Pricing page loads, monthly/yearly toggle works
- [ ] FAQ accordions expand/collapse
- [ ] Contact form submits (still MOCKED until STEP 8 wiring)
- [ ] No CORS errors in browser DevTools Network tab

---

## Production env vars summary

### Render (backend)
```
MONGO_URL=mongodb+srv://...
DB_NAME=scorebar_db
CORS_ORIGINS=https://scorebar.bar,https://www.scorebar.bar
EMERGENT_LLM_KEY=sk-emergent-...
ADMIN_EMAIL=admin@scorebar.bar
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
SUPABASE_BUCKET=interview-recordings
RAZORPAY_KEY_ID=rzp_live_...        # after STEP 7
RAZORPAY_KEY_SECRET=...             # after STEP 7
MAILTRAP_API_TOKEN=...              # after STEP 8
MAILTRAP_SENDER_EMAIL=noreply@scorebar.bar
```

### Vercel (frontend)
```
REACT_APP_BACKEND_URL=https://api.scorebar.bar
```

---

## After deploy is live, ping me back with:

- `https://scorebar.bar` confirmed loading
- `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` (test mode is fine for now)
- `MAILTRAP_API_TOKEN`

Then I'll wire real Razorpay + Mailtrap into the backend (replace MOCKs in `/api/payments/*`, `/api/contact`, team-invite emails).
