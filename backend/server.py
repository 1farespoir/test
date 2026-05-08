from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File
from fastapi.responses import StreamingResponse, FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, io, json, logging, uuid, random, string, secrets, httpx
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.llm.openai.speech_to_text import OpenAISpeechToText
from emergentintegrations.llm.openai.text_to_speech import OpenAITextToSpeech
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import storage  # noqa: E402  (must be after load_dotenv so env vars are available)
UPLOAD_DIR = storage.UPLOAD_DIR

mongo_client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = mongo_client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@aria.ai')
stt_client = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
tts_client = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)

def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()
def verify_pw(pw: str, h: str) -> bool:
    try: return bcrypt.checkpw(pw.encode(), h.encode())
    except Exception: return False
def gen_password(n: int = 10) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(n))

app = FastAPI()
api = APIRouter(prefix="/api")

# ----------------- Helpers -----------------

def gen_code(prefix: str = "SB", groups: int = 2, group_len: int = 4) -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no confusing chars
    parts = ["".join(random.choice(alphabet) for _ in range(group_len)) for _ in range(groups)]
    return f"{prefix}-" + "-".join(parts)

async def get_session_user(request: Request):
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "): token = auth[7:]
    if not token: return None
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess: return None
    exp = sess["expires_at"]
    if isinstance(exp, str): exp = datetime.fromisoformat(exp)
    if exp.tzinfo is None: exp = exp.replace(tzinfo=timezone.utc)
    if exp < datetime.now(timezone.utc): return None
    user = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0})
    return user

async def require_user(request: Request):
    user = await get_session_user(request)
    if not user: raise HTTPException(401, "Not authenticated")
    return user

async def require_hr(request: Request):
    user = await require_user(request)
    if user.get("role") != "hr":
        raise HTTPException(403, "HR access required")
    return user

async def get_interview_access(request: Request, interview_id: str):
    """Allow access if user is owner HR OR request has matching x-interview-code header/cookie."""
    inter = await db.interviews.find_one({"id": interview_id}, {"_id": 0})
    if not inter: raise HTTPException(404, "Interview not found")
    user = await get_session_user(request)
    if user and (user["role"] == "hr" or user["user_id"] == inter.get("invited_by")):
        return inter, user, "hr"
    code = request.headers.get("x-interview-code") or request.cookies.get("interview_code")
    if code and code == inter.get("code"):
        return inter, None, "candidate"
    raise HTTPException(401, "Access denied")

async def log_email(to: str, subject: str, body: str):
    # MOCKED email log
    doc = {"to": to, "subject": subject, "body": body, "at": datetime.now(timezone.utc).isoformat(), "mocked": True}
    await db.email_log.insert_one(doc)
    logging.info(f"[MOCKED EMAIL] to={to} subject={subject}")

# ----------------- LLM -----------------

INTERVIEW_SYS = """You are an expert AI interviewer named Scorebar. Ask ONE focused question at a time.
Always reply in strict JSON: {"question":"<next question>","is_final":false}.
After 6 answers, set is_final true with a gentle closing question."""

SCORING_SYS = """You are a senior hiring manager. Given a transcript for a {role} role, return strict JSON:
{"technical":0-100,"soft_skills":0-100,"cultural_fit":0-100,"experience":0-100,"personality":0-100,"overall":0-100,"strengths":["..."],"weaknesses":["..."],"recommendation":"Strong Hire|Hire|Lean Hire|No Hire","summary":"..."}
Be rigorous. Base scores only on transcript evidence."""

async def llm(session_id: str, system: str, user_text: str) -> str:
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=session_id, system_message=system).with_model("openai", "gpt-4o")
    return await chat.send_message(UserMessage(text=user_text))

def parse_json_block(raw: str) -> dict:
    try:
        return json.loads(raw[raw.find('{'):raw.rfind('}')+1])
    except Exception:
        return {}

async def generate_questions(role: str, fmt: str, category: Optional[str], n: int) -> List[str]:
    if n <= 0: return []
    cat = category or "general"
    fmt_hint = "voice interview conversation" if fmt == "voice" else f"text {cat} assessment (coding/math/general)"
    prompt = f"Generate {n} concise, progressively harder questions for a {fmt_hint} for role: {role}. Strict JSON: {{\"questions\":[...]}}"
    raw = await llm(f"genq_{uuid.uuid4().hex[:8]}", "You generate interview questions. Output strict JSON only.", prompt)
    data = parse_json_block(raw)
    qs = data.get("questions") or []
    return qs[:n] if qs else [f"{role} question {i+1}" for i in range(n)]

# ----------------- Models -----------------

class GoogleSessionIn(BaseModel):
    session_id: str

class RoleSwitchIn(BaseModel):
    role: Literal["candidate", "hr"]

class CreateInviteIn(BaseModel):
    role: str
    interview_type: Literal["voice", "text"] = "voice"
    category: Optional[str] = None
    candidate_name: str = ""
    candidate_email: str
    custom_questions: List[str] = []

class CreateJobIn(BaseModel):
    role: str
    interview_type: Literal["voice", "text"] = "voice"
    category: Optional[str] = None
    custom_questions: List[str] = []
    description: str = ""

class ApplyToJobIn(BaseModel):
    candidate_name: str
    candidate_email: str

class JoinCodeIn(BaseModel):
    code: str

class AnswerIn(BaseModel):
    answer: str
    audio_url: Optional[str] = ""
    video_url: Optional[str] = ""

class StatusIn(BaseModel):
    hr_status: Literal["pending", "selected", "next_round", "not_selected"]
    note: Optional[str] = ""

class TTSIn(BaseModel):
    text: str
    voice: str = "nova"

# ----------------- AUTH -----------------

@api.post("/auth/google/session")
async def google_session(payload: GoogleSessionIn, response: Response):
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.get("https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                        headers={"X-Session-ID": payload.session_id})
        if r.status_code != 200: raise HTTPException(401, "Invalid session")
        data = r.json()
    email = data["email"]
    # Only approved users may sign in. No auto account creation.
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if not existing or not existing.get("approved"):
        raise HTTPException(403, "Access restricted. Your team must be approved before you can sign in. Apply at /signup.")
    user_id = existing["user_id"]
    await db.users.update_one({"user_id": user_id}, {"$set": {"name": data["name"], "picture": data.get("picture","")}})
    session_token = data["session_token"]
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc)+timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    response.set_cookie("session_token", session_token, max_age=7*24*60*60, path="/", secure=True, httponly=True, samesite="none")
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    user_doc.pop("password_hash", None)
    return {"user": user_doc}

@api.get("/auth/me")
async def auth_me(request: Request):
    user = await get_session_user(request)
    if not user: raise HTTPException(401, "Not authenticated")
    user.pop("password_hash", None)
    return user

@api.post("/auth/logout")
async def logout(request: Request, response: Response):
    t = request.cookies.get("session_token")
    if t: await db.user_sessions.delete_one({"session_token": t})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}

@api.post("/auth/role")
async def set_role(payload: RoleSwitchIn, request: Request):
    user = await require_user(request)
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"role": payload.role}})
    return {"ok": True, "role": payload.role}

# ----------------- SIGNUP / ADMIN APPROVAL / EMAIL+PASSWORD LOGIN -----------------

class SignupIn(BaseModel):
    company_name: str
    company_website: Optional[str] = ""
    company_socials: Optional[str] = ""
    hr_name: str
    work_email: EmailStr
    phone: str
    employees_count: str
    job_roles: Optional[str] = ""
    hiring_volume: Optional[str] = ""

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class ApproveIn(BaseModel):
    username: Optional[str] = ""
    plan: Literal["trial", "pro", "business"] = "trial"
    trial_days: int = 30
    interviews_quota: int = 5

@api.post("/signup")
async def signup(payload: SignupIn):
    existing = await db.signup_requests.find_one({"work_email": payload.work_email})
    if existing: raise HTTPException(409, "Application already submitted for this email")
    if await db.users.find_one({"email": payload.work_email}):
        raise HTTPException(409, "Account already exists for this email")
    doc = {**payload.model_dump(), "id": str(uuid.uuid4()), "status": "pending",
           "created_at": datetime.now(timezone.utc).isoformat()}
    await db.signup_requests.insert_one(dict(doc))
    doc.pop("_id", None)
    await log_email(payload.work_email, "Application received — Scorebar",
                    f"Hi {payload.hr_name},\n\nWe've received your application for {payload.company_name}. We'll review it manually and email you with credentials once approved.\n")
    await log_email(ADMIN_EMAIL, f"New signup: {payload.company_name}",
                    f"New HR signup pending review.\nCompany: {payload.company_name}\nContact: {payload.hr_name} <{payload.work_email}>\nID: {doc['id']}\n")
    return {"ok": True, "id": doc["id"]}

async def require_admin(request: Request):
    user = await require_user(request)
    if user.get("email") != ADMIN_EMAIL:
        raise HTTPException(403, "Admin only")
    return user

@api.get("/admin/signups")
async def list_signups(request: Request, status: Optional[str] = None):
    await require_admin(request)
    q = {"status": status} if status else {}
    items = await db.signup_requests.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"signups": items}

@api.post("/admin/signups/{sid}/approve")
async def approve_signup(sid: str, payload: ApproveIn, request: Request):
    await require_admin(request)
    s = await db.signup_requests.find_one({"id": sid}, {"_id": 0})
    if not s: raise HTTPException(404, "Not found")
    if s["status"] == "approved": raise HTTPException(400, "Already approved")
    username = payload.username or s["work_email"].split("@")[0].lower() + str(random.randint(10, 99))
    plain_pw = gen_password(10)
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    trial_expires = (datetime.now(timezone.utc) + timedelta(days=payload.trial_days)).isoformat()
    user_doc = {
        "user_id": user_id, "email": s["work_email"], "username": username,
        "password_hash": hash_pw(plain_pw), "name": s["hr_name"], "picture": "",
        "role": "hr", "plan": payload.plan, "interviews_used": 0,
        "interviews_quota": payload.interviews_quota,
        "trial_expires_at": trial_expires if payload.plan == "trial" else None,
        "company_name": s["company_name"], "phone": s["phone"],
        "approved": True, "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(dict(user_doc))
    await db.signup_requests.update_one({"id": sid}, {"$set": {
        "status": "approved", "approved_at": datetime.now(timezone.utc).isoformat(),
        "username": username, "user_id": user_id,
    }})
    await log_email(s["work_email"], "Welcome to Scorebar — your access is ready",
                    f"Hi {s['hr_name']},\n\nYour {payload.plan.upper()} account is active.\n\n"
                    f"Username: {username}\nPassword: {plain_pw}\nLogin: /login\n\n"
                    f"You have {payload.interviews_quota} interview credits"
                    f"{' valid for '+str(payload.trial_days)+' days' if payload.plan=='trial' else ''}.\n")
    return {"ok": True, "username": username, "password": plain_pw}

@api.post("/admin/signups/{sid}/reject")
async def reject_signup(sid: str, request: Request):
    await require_admin(request)
    s = await db.signup_requests.find_one({"id": sid}, {"_id": 0})
    if not s: raise HTTPException(404, "Not found")
    await db.signup_requests.update_one({"id": sid}, {"$set": {"status": "rejected",
                "rejected_at": datetime.now(timezone.utc).isoformat()}})
    await log_email(s["work_email"], "Update on your Scorebar application",
                    "Thanks for applying. Unfortunately we can't approve your team at this time.\n")
    return {"ok": True}

@api.post("/auth/login")
async def password_login(payload: LoginIn, response: Response):
    user = await db.users.find_one({"email": payload.email}, {"_id": 0})
    if not user or not user.get("password_hash") or not verify_pw(payload.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    token = secrets.token_urlsafe(32)
    await db.user_sessions.insert_one({
        "user_id": user["user_id"], "session_token": token,
        "expires_at": (datetime.now(timezone.utc)+timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    response.set_cookie("session_token", token, max_age=7*24*60*60, path="/", secure=True, httponly=True, samesite="none")
    user.pop("password_hash", None)
    return {"user": user, "token": token}

# ----------------- PLANS / PAYMENTS (mocked) -----------------

PLANS = [
    {
        "id": "free", "name": "Free", "tagline": "For evaluating Scorebar.",
        "price_usd_monthly": 0, "price_usd_yearly": 0, "price_inr_monthly": 0, "price_inr_yearly": 0,
        "interviews": 5, "team_members": 1, "highlight": False,
        "features": [
            "$0 · 30-day trial or 5 interviews",
            "Basic AI scoring",
            "1 team member",
            "Voice + text formats",
            "Email transcripts",
        ],
    },
    {
        "id": "starter", "name": "Starter", "tagline": "For small hiring teams.",
        "price_usd_monthly": 29.99, "price_usd_yearly": 299.99, "price_inr_monthly": 2499, "price_inr_yearly": 24990,
        "interviews": 20, "team_members": 2, "highlight": True,
        "features": [
            "20 interviews / month",
            "Deep 5-section AI scoring",
            "2 team members",
            "Video recording + storage",
            "Custom question banks",
            "Email support",
        ],
    },
    {
        "id": "professional", "name": "Professional", "tagline": "For growing recruiting teams.",
        "price_usd_monthly": 149.99, "price_usd_yearly": 1499.99, "price_inr_monthly": 12499, "price_inr_yearly": 124990,
        "interviews": 110, "team_members": 5, "highlight": False,
        "features": [
            "110 interviews / month",
            "Advanced AI + voice interviews",
            "5 team members",
            "Cohort analytics dashboard",
            "Priority support",
            "Custom question banks",
        ],
    },
    {
        "id": "enterprise", "name": "Enterprise", "tagline": "For organizations with compliance needs.",
        "price_usd_monthly": -1, "price_usd_yearly": -1, "price_inr_monthly": -1, "price_inr_yearly": -1,
        "interviews": -1, "team_members": -1, "highlight": False,
        "features": [
            "Unlimited interviews",
            "Unlimited team members",
            "White-label option",
            "Dedicated CSM",
            "SSO / SAML · GDPR + DPA",
            "SLA-backed uptime",
        ],
    },
]

def plan_by_id(pid: str):
    # Legacy plan ids from earlier iterations -> map to new plan ids so existing users aren't locked out
    legacy_map = {"trial": "free", "pro": "professional", "business": "enterprise"}
    pid = legacy_map.get(pid, pid)
    return next((p for p in PLANS if p["id"] == pid), None)

@api.get("/plans")
async def get_plans(): return {"plans": PLANS}

@api.post("/payments/create-order")
async def create_order(request: Request):
    body = await request.json()
    plan_id = body.get("plan")
    billing = body.get("billing", "monthly")  # monthly | yearly
    plan = plan_by_id(plan_id)
    if not plan or plan_id in ("free", "enterprise"):
        raise HTTPException(400, "Invalid plan")
    price_inr = plan["price_inr_yearly"] if billing == "yearly" else plan["price_inr_monthly"]
    return {"mocked": True, "order_id": f"order_mock_{uuid.uuid4().hex[:10]}",
            "amount": price_inr * 100, "currency": "INR", "key_id": "rzp_test_MOCKED",
            "plan": plan, "billing": billing}

@api.post("/payments/verify")
async def verify_payment(request: Request):
    user = await require_user(request)
    body = await request.json()
    plan_id = body.get("plan", "starter")
    billing = body.get("billing", "monthly")
    plan = plan_by_id(plan_id)
    if not plan or plan_id in ("free", "enterprise"):
        raise HTTPException(400, "Invalid plan")
    quota = plan["interviews"]
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"plan": plan_id, "billing_cycle": billing, "interviews_used": 0,
                  "interviews_quota": quota, "team_member_limit": plan["team_members"]}}
    )
    return {"mocked": True, "ok": True, "plan": plan_id, "billing": billing}

# ----------------- TEAM MANAGEMENT (premium) -----------------

class InviteTeammateIn(BaseModel):
    name: str
    email: EmailStr

def get_owner_id(user: dict) -> str:
    """If user is invited member, owner is owner_user_id; otherwise themselves."""
    return user.get("owner_user_id") or user["user_id"]

async def get_team_owner(user: dict) -> dict:
    owner_id = get_owner_id(user)
    if owner_id == user["user_id"]:
        return user
    return await db.users.find_one({"user_id": owner_id}, {"_id": 0})

@api.get("/team/members")
async def list_team_members(request: Request):
    user = await require_user(request)
    owner = await get_team_owner(user)
    plan = plan_by_id(owner.get("plan") or "free") or plan_by_id("free")
    members = await db.users.find(
        {"$or": [{"user_id": owner["user_id"]}, {"owner_user_id": owner["user_id"]}]},
        {"_id": 0, "password_hash": 0}
    ).to_list(100)
    return {
        "owner_user_id": owner["user_id"],
        "limit": plan["team_members"],
        "current_user_id": user["user_id"],
        "members": members,
        "plan": plan["id"],
    }

@api.post("/team/invite")
async def invite_teammate(payload: InviteTeammateIn, request: Request):
    user = await require_user(request)
    # only the owner can invite
    if user.get("owner_user_id"):
        raise HTTPException(403, "Only the team owner can invite members.")
    plan = plan_by_id(user.get("plan") or "free") or plan_by_id("free")
    limit = plan["team_members"]
    if limit == 1:
        raise HTTPException(402, "Adding teammates requires the Starter plan or above. Upgrade to invite.")
    # count current team
    current = await db.users.count_documents(
        {"$or": [{"user_id": user["user_id"]}, {"owner_user_id": user["user_id"]}]}
    )
    if limit != -1 and current >= limit:
        raise HTTPException(402, f"Team member limit reached ({limit}). Upgrade your plan to add more.")
    # uniqueness
    if await db.users.find_one({"email": payload.email}):
        raise HTTPException(409, "A user with this email already exists.")
    # create teammate user (active immediately, role=hr, shares quotas via owner_user_id)
    plain_pw = gen_password(10)
    new_user_id = f"user_{uuid.uuid4().hex[:12]}"
    teammate = {
        "user_id": new_user_id, "email": payload.email,
        "username": payload.email.split("@")[0].lower() + str(random.randint(10, 99)),
        "password_hash": hash_pw(plain_pw), "name": payload.name, "picture": "",
        "role": "hr", "plan": user.get("plan") or "free",
        "interviews_used": 0, "interviews_quota": 0,
        "owner_user_id": user["user_id"],
        "company_name": user.get("company_name", ""),
        "approved": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(dict(teammate))
    await log_email(payload.email, f"You're invited to {user.get('company_name') or 'Scorebar'} on Scorebar",
                    f"Hi {payload.name},\n\n{user.get('name', 'Your teammate')} invited you to collaborate on Scorebar.\n\n"
                    f"Username: {teammate['username']}\nPassword: {plain_pw}\nLogin: /login\n\nYou'll share the team's interview workspace and quota.\n")
    teammate.pop("password_hash", None)
    return {"ok": True, "member": teammate, "password": plain_pw}

@api.delete("/team/members/{member_id}")
async def remove_teammate(member_id: str, request: Request):
    user = await require_user(request)
    if user.get("owner_user_id"):
        raise HTTPException(403, "Only the team owner can remove members.")
    if member_id == user["user_id"]:
        raise HTTPException(400, "Owner cannot remove themselves.")
    target = await db.users.find_one({"user_id": member_id, "owner_user_id": user["user_id"]}, {"_id": 0})
    if not target:
        raise HTTPException(404, "Member not found in your team.")
    await db.users.delete_one({"user_id": member_id})
    await db.user_sessions.delete_many({"user_id": member_id})
    return {"ok": True}

# ----------------- JOB POSTINGS (shareable) -----------------

@api.post("/jobs/create")
async def create_job(payload: CreateJobIn, request: Request):
    user = await require_hr(request)
    questions = [q.strip() for q in (payload.custom_questions or []) if q.strip()]
    if not questions:
        raise HTTPException(400, "At least one custom question is required.")
    job_code = gen_code(prefix="JOB")
    doc = {
        "id": str(uuid.uuid4()), "job_code": job_code, "role": payload.role,
        "interview_type": payload.interview_type, "category": payload.category,
        "custom_questions": questions,
        "description": payload.description, "hr_user_id": user["user_id"],
        "hr_email": user["email"], "open": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.job_postings.insert_one(dict(doc))
    doc.pop("_id", None)
    return doc

@api.get("/jobs")
async def list_jobs(request: Request):
    user = await require_hr(request)
    items = await db.job_postings.find({"hr_user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"jobs": items}

@api.get("/jobs/public/{job_code}")
async def public_job(job_code: str):
    j = await db.job_postings.find_one({"job_code": job_code, "open": True},
                                       {"_id": 0, "custom_questions": 0, "ai_question_count": 0})
    if not j: raise HTTPException(404, "Job not found")
    return j

@api.post("/jobs/{job_code}/apply")
async def apply_to_job(job_code: str, payload: ApplyToJobIn, response: Response):
    job = await db.job_postings.find_one({"job_code": job_code, "open": True}, {"_id": 0})
    if not job: raise HTTPException(404, "Job not open")
    questions = [q.strip() for q in (job.get("custom_questions") or []) if q.strip()]
    if not questions:
        raise HTTPException(400, "This job has no questions configured yet.")
    return await _create_interview(
        invited_by=job["hr_user_id"], role=job["role"], fmt=job["interview_type"],
        category=job.get("category"), candidate_name=payload.candidate_name,
        candidate_email=payload.candidate_email, questions=questions,
        job_posting_id=job["id"], response=response)

# ----------------- INTERVIEWS -----------------

async def _create_interview(invited_by, role, fmt, category, candidate_name, candidate_email, questions, job_posting_id, response: Response):
    # Quota check (skip for unlimited / shareable links from open-job already enforced upstream)
    hr = await db.users.find_one({"user_id": invited_by}, {"_id": 0})
    if hr:
        quota = hr.get("interviews_quota")
        if quota is None:
            plan = next((p for p in PLANS if p["id"] == hr.get("plan","starter")), PLANS[0])
            quota = plan["interviews"]
        if quota != -1 and hr.get("interviews_used", 0) >= quota:
            raise HTTPException(402, "Interview quota exceeded — please upgrade your plan.")
        # Trial expiry check
        exp = hr.get("trial_expires_at")
        if exp:
            try:
                expdt = datetime.fromisoformat(exp)
                if expdt.tzinfo is None: expdt = expdt.replace(tzinfo=timezone.utc)
                if expdt < datetime.now(timezone.utc):
                    raise HTTPException(402, "Trial expired — please upgrade.")
            except HTTPException: raise
            except Exception: pass
    code = gen_code()
    interview_id = str(uuid.uuid4())
    q_docs = [{"q": q, "a": "", "audio_url": ""} for q in questions]
    doc = {
        "id": interview_id, "code": code, "invited_by": invited_by,
        "job_posting_id": job_posting_id, "candidate_name": candidate_name,
        "candidate_email": candidate_email, "role": role, "interview_type": fmt,
        "category": category, "status": "invited", "hr_status": "pending",
        "hr_note": "", "questions": q_docs, "video_url": "", "transcript": "",
        "scores": None, "feedback": "", "overall": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.interviews.insert_one(dict(doc))
    doc.pop("_id", None)
    # Increment HR interview usage
    await db.users.update_one({"user_id": invited_by}, {"$inc": {"interviews_used": 1}})
    # Candidate session cookie for this interview
    response.set_cookie("interview_code", code, max_age=60*60*24*30, path="/", secure=True, httponly=True, samesite="none")
    await log_email(candidate_email, f"Your Scorebar interview: {role}",
                    f"Hi {candidate_name or 'there'},\n\nYou have been invited to an AI interview for {role}.\nMeeting code: {code}\nJoin here: /join?code={code}\nCheck status anytime: /status?code={code}\n")
    return doc

@api.post("/interviews/invite")
async def invite_candidate(payload: CreateInviteIn, request: Request, response: Response):
    user = await require_hr(request)
    questions = [q.strip() for q in (payload.custom_questions or []) if q.strip()]
    if not questions:
        raise HTTPException(400, "At least one custom question is required.")
    return await _create_interview(
        invited_by=user["user_id"], role=payload.role, fmt=payload.interview_type,
        category=payload.category, candidate_name=payload.candidate_name,
        candidate_email=payload.candidate_email, questions=questions,
        job_posting_id=None, response=response)

@api.post("/interviews/join")
async def join_interview(payload: JoinCodeIn, response: Response):
    inter = await db.interviews.find_one({"code": payload.code.strip().upper()}, {"_id": 0})
    if not inter: raise HTTPException(404, "Invalid code")
    response.set_cookie("interview_code", inter["code"], max_age=60*60*24*30, path="/", secure=True, httponly=True, samesite="none")
    return inter

@api.get("/interviews/status/{code}")
async def public_status(code: str):
    inter = await db.interviews.find_one({"code": code.strip().upper()}, {"_id": 0})
    if not inter: raise HTTPException(404, "Invalid code")
    return {
        "code": inter["code"], "role": inter["role"], "candidate_name": inter["candidate_name"],
        "status": inter["status"], "hr_status": inter["hr_status"], "hr_note": inter.get("hr_note", ""),
        "overall": inter.get("overall", 0), "scores": inter.get("scores"),
        "feedback": inter.get("feedback", ""), "created_at": inter["created_at"],
    }

@api.get("/interviews/{interview_id}")
async def get_interview(interview_id: str, request: Request):
    inter, _, _ = await get_interview_access(request, interview_id)
    return inter

@api.get("/interviews")
async def list_interviews(request: Request):
    user = await require_hr(request)
    items = await db.interviews.find({"invited_by": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"interviews": items}

@api.post("/interviews/{interview_id}/respond")
async def respond(interview_id: str, payload: AnswerIn, request: Request):
    inter, _, _ = await get_interview_access(request, interview_id)
    qs = inter["questions"]
    last_idx = next((i for i, q in enumerate(qs) if not q["a"]), len(qs) - 1)
    qs[last_idx]["a"] = payload.answer
    qs[last_idx]["audio_url"] = payload.audio_url or ""
    qs[last_idx]["video_url"] = payload.video_url or ""
    # Advance through pre-set questions only (no AI-generated follow-ups)
    is_final = False
    next_q = None
    if last_idx + 1 < len(qs):
        next_q = qs[last_idx + 1]["q"]
    else:
        is_final = True
    await db.interviews.update_one({"id": interview_id}, {"$set": {"questions": qs, "status": "in_progress"}})
    return {"next_question": next_q, "is_final": is_final, "questions": qs}

@api.post("/interviews/{interview_id}/complete")
async def complete(interview_id: str, request: Request):
    inter, _, _ = await get_interview_access(request, interview_id)
    body = {}
    try: body = await request.json()
    except Exception: pass
    video_url = body.get("video_url", "") if isinstance(body, dict) else ""
    transcript = "\n".join([f"Q: {q['q']}\nA: {q['a']}" for q in inter["questions"] if q.get("a")])

    # AI scoring is best-effort. If LLM fails (rate limit, no balance, network), still mark
    # the interview as completed with placeholder scores so HR can review the transcript/video.
    scoring_error = None
    try:
        raw = await llm(f"score_{interview_id}", SCORING_SYS.replace("{role}", inter["role"]),
                        transcript or "No answers given.")
        scored = parse_json_block(raw) or {}
    except Exception as e:
        logging.exception("LLM scoring failed for %s", interview_id)
        scoring_error = str(e)
        scored = {}

    scores = {k: int(scored.get(k, 0) or 0) for k in ["technical","soft_skills","cultural_fit","experience","personality"]}
    overall = int(scored.get("overall", sum(scores.values()) // 5))
    feedback = {
        "strengths": scored.get("strengths", []), "weaknesses": scored.get("weaknesses", []),
        "recommendation": scored.get("recommendation", "Pending AI review" if scoring_error else "Lean Hire"),
        "summary": scored.get("summary", f"AI scoring unavailable: {scoring_error[:100]}" if scoring_error else ""),
    }
    await db.interviews.update_one({"id": interview_id}, {"$set": {
        "status": "completed", "transcript": transcript, "scores": scores,
        "overall": overall, "feedback": json.dumps(feedback),
        "video_url": video_url or inter.get("video_url", ""),
        "scoring_error": scoring_error,
    }})
    await log_email(inter["candidate_email"], f"Interview complete: {inter['role']}",
                    f"Thanks for completing your interview.\nYour meeting code: {inter['code']}\nCheck your status: /status?code={inter['code']}\n")
    return await db.interviews.find_one({"id": interview_id}, {"_id": 0})

@api.post("/interviews/{interview_id}/status")
async def set_status(interview_id: str, payload: StatusIn, request: Request):
    user = await require_hr(request)
    inter = await db.interviews.find_one({"id": interview_id}, {"_id": 0})
    if not inter or inter.get("invited_by") != user["user_id"]:
        raise HTTPException(404, "Not found")
    await db.interviews.update_one({"id": interview_id},
        {"$set": {"hr_status": payload.hr_status, "hr_note": payload.note or ""}})
    pretty = {"pending": "Pending", "selected": "Selected", "next_round": "Moved to next round", "not_selected": "Not selected"}
    await log_email(inter["candidate_email"], f"Update on your interview: {inter['role']}",
                    f"Your application status: {pretty.get(payload.hr_status)}\n\nNote: {payload.note or ''}\n\nCheck anytime: /status?code={inter['code']}\n")
    return {"ok": True}

class BulkStatusIn(BaseModel):
    interview_ids: List[str]
    hr_status: Literal["pending", "selected", "next_round", "not_selected", "archived"]
    note: Optional[str] = ""

@api.post("/interviews/bulk-status")
async def bulk_status(payload: BulkStatusIn, request: Request):
    user = await require_hr(request)
    matched = await db.interviews.find(
        {"id": {"$in": payload.interview_ids}, "invited_by": user["user_id"]},
        {"_id": 0, "id": 1, "candidate_email": 1, "code": 1, "role": 1}
    ).to_list(500)
    ids = [m["id"] for m in matched]
    if not ids:
        raise HTTPException(404, "No matching interviews")
    pretty = {"pending":"Pending", "selected":"Selected", "next_round":"Moved to next round",
              "not_selected":"Not selected", "archived":"Archived"}
    res = await db.interviews.update_many(
        {"id": {"$in": ids}},
        {"$set": {"hr_status": payload.hr_status, "hr_note": payload.note or ""}}
    )
    if payload.hr_status != "archived":
        for m in matched:
            await log_email(m["candidate_email"], f"Update on your interview: {m['role']}",
                            f"Your application status: {pretty.get(payload.hr_status)}\n\nNote: {payload.note or ''}\n\nCheck anytime: /status?code={m['code']}\n")
    return {"ok": True, "updated": res.modified_count}

class BulkMessageIn(BaseModel):
    interview_ids: List[str]
    subject: str
    message: str

@api.post("/interviews/bulk-message")
async def bulk_message(payload: BulkMessageIn, request: Request):
    user = await require_hr(request)
    matched = await db.interviews.find(
        {"id": {"$in": payload.interview_ids}, "invited_by": user["user_id"]},
        {"_id": 0, "candidate_email": 1, "candidate_name": 1, "code": 1}
    ).to_list(500)
    if not matched:
        raise HTTPException(404, "No matching candidates")
    for m in matched:
        await log_email(m["candidate_email"], payload.subject,
                        f"Hi {m.get('candidate_name') or ''},\n\n{payload.message}\n\nReference: {m['code']}\n— Sent from Scorebar.AI")
    return {"ok": True, "sent": len(matched)}

class BulkInviteRow(BaseModel):
    candidate_name: str
    candidate_email: EmailStr

class BulkInviteIn(BaseModel):
    role: str
    interview_type: Literal["text", "voice"] = "text"
    category: Optional[str] = None
    custom_questions: List[str]
    candidates: List[BulkInviteRow]

@api.post("/interviews/bulk-invite")
async def bulk_invite(payload: BulkInviteIn, request: Request, response: Response):
    user = await require_hr(request)
    questions = [q.strip() for q in payload.custom_questions if q.strip()]
    if not questions:
        raise HTTPException(400, "At least one custom question is required.")
    if not payload.candidates:
        raise HTTPException(400, "No candidates provided.")
    if len(payload.candidates) > 200:
        raise HTTPException(400, "Maximum 200 candidates per upload.")
    created = []
    failed = []
    for c in payload.candidates:
        try:
            r = await _create_interview(
                invited_by=user["user_id"], role=payload.role, fmt=payload.interview_type,
                category=payload.category, candidate_name=c.candidate_name,
                candidate_email=c.candidate_email, questions=questions,
                job_posting_id=None, response=response)
            created.append({"email": c.candidate_email, "code": r.get("code"), "id": r.get("id")})
        except Exception as e:
            failed.append({"email": c.candidate_email, "error": str(e)})
    return {"ok": True, "created": created, "failed": failed}

@api.get("/hr/analytics")
async def hr_analytics(request: Request):
    user = await require_hr(request)
    items = await db.interviews.find({"invited_by": user["user_id"]}, {"_id": 0}).to_list(1000)
    total = len(items)
    completed = [i for i in items if i.get("status") == "completed"]
    by_status = {"pending":0,"selected":0,"next_round":0,"not_selected":0,"archived":0}
    score_buckets = {"0-40": 0, "40-60": 0, "60-75": 0, "75-90": 0, "90-100": 0}
    type_counts = {"text": 0, "voice": 0}
    role_counts = {}
    score_sum = 0
    score_count = 0
    for i in items:
        st = i.get("hr_status") or "pending"
        if st in by_status:
            by_status[st] += 1
        if i.get("interview_type") in type_counts:
            type_counts[i["interview_type"]] += 1
        role_counts[i.get("role","Unknown")] = role_counts.get(i.get("role","Unknown"),0) + 1
    for i in completed:
        s = i.get("overall", 0) or 0
        score_sum += s; score_count += 1
        if s < 40: score_buckets["0-40"] += 1
        elif s < 60: score_buckets["40-60"] += 1
        elif s < 75: score_buckets["60-75"] += 1
        elif s < 90: score_buckets["75-90"] += 1
        else: score_buckets["90-100"] += 1
    return {
        "total": total,
        "completed": len(completed),
        "completion_rate": round(len(completed)/total*100, 1) if total else 0,
        "avg_score": round(score_sum/score_count, 1) if score_count else 0,
        "by_status": by_status,
        "score_buckets": score_buckets,
        "type_counts": type_counts,
        "top_roles": sorted([{"role":r,"count":c} for r,c in role_counts.items()], key=lambda x: -x["count"])[:5],
    }

@api.get("/email_log")
async def email_log(request: Request):
    await require_hr(request)
    items = await db.email_log.find({}, {"_id": 0}).sort("at", -1).to_list(50)
    return {"emails": items}

# ----------------- TTS / STT / Files -----------------

@api.post("/tts")
async def tts(payload: TTSIn):
    try:
        audio = await tts_client.generate_speech(text=payload.text, model="tts-1", voice=payload.voice, response_format="mp3")
        return StreamingResponse(io.BytesIO(audio), media_type="audio/mpeg")
    except Exception as e:
        logging.exception("TTS failed"); raise HTTPException(500, f"TTS error: {e}")

@api.post("/stt")
async def stt(file: UploadFile = File(...)):
    try:
        content = await file.read()
        ext = (file.filename or "audio.webm").rsplit(".", 1)[-1].lower()
        if ext not in ["mp3","mp4","mpeg","mpga","m4a","wav","webm"]: ext = "webm"
        tmp = UPLOAD_DIR / f"stt_{uuid.uuid4().hex}.{ext}"
        with open(tmp, "wb") as f: f.write(content)
        try:
            with open(tmp, "rb") as f:
                tr = await stt_client.transcribe(file=f, model="whisper-1", response_format="json")
            text = getattr(tr, "text", None) or (tr.get("text") if isinstance(tr, dict) else str(tr))
            return {"text": text}
        finally:
            try: tmp.unlink()
            except Exception: pass
    except Exception as e:
        logging.exception("STT failed"); raise HTTPException(500, f"STT error: {e}")

@api.post("/upload/video")
async def upload_video(request: Request, file: UploadFile = File(...)):
    # Allow candidate (via interview cookie) OR user session
    ext = (file.filename or "video.webm").rsplit(".", 1)[-1]
    fname = f"int_{uuid.uuid4().hex}.{ext}"
    data = await file.read()
    content_type = file.content_type or "video/webm"
    storage.save_bytes(fname, data, content_type)
    return {"url": f"/api/files/{fname}", "filename": fname}

@api.get("/files/{filename}")
async def serve_file(filename: str):
    # Remote (Supabase): redirect to signed URL
    if storage.is_remote():
        from fastapi.responses import RedirectResponse
        url = storage.get_url(filename, expires_in=3600)
        if not url: raise HTTPException(404, "Not found")
        return RedirectResponse(url=url, status_code=302)
    # Local fallback
    fp = storage.open_local(filename)
    if not fp: raise HTTPException(404, "Not found")
    return FileResponse(fp)

@api.get("/")
async def root(): return {"service": "AI Interviewer", "ok": True}

@app.get("/health")
async def health():
    out = {
        "status": "healthy",
        "remote_storage": storage.is_remote(),
        "llm_key_set": bool(EMERGENT_LLM_KEY),
        "llm_key_prefix": (EMERGENT_LLM_KEY[:12] + "...") if EMERGENT_LLM_KEY else None,
    }
    return out

# ----------------- App wiring -----------------

app.include_router(api)
app.add_middleware(
    CORSMiddleware, allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_origin_regex=r"https?://.*\.emergentagent\.com|https?://.*\.vercel\.app|https?://(www\.)?scorebar\.bar|http://localhost(:\d+)?",
    allow_methods=["*"], allow_headers=["*"],
)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

@app.on_event("startup")
async def startup_seed():
    # Seed admin if missing
    existing = await db.users.find_one({"email": ADMIN_EMAIL}, {"_id": 0})
    if not existing:
        await db.users.insert_one({
            "user_id": f"user_admin_{uuid.uuid4().hex[:8]}",
            "email": ADMIN_EMAIL, "username": "admin", "name": "Scorebar Admin",
            "password_hash": hash_pw("admin123"), "role": "hr", "plan": "business",
            "interviews_used": 0, "interviews_quota": -1, "approved": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logging.info(f"Seeded admin user: {ADMIN_EMAIL} / admin123")

@app.on_event("shutdown")
async def shutdown(): mongo_client.close()
