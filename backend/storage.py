"""
Storage abstraction:
- If SUPABASE_URL + SUPABASE_SERVICE_KEY env vars are set => use Supabase Storage (production).
- Otherwise => fall back to local filesystem (./uploads) so local dev keeps working.

Public functions:
    save_bytes(filename, data, content_type) -> {"key": str, "is_remote": bool}
    get_url(key, expires_in=3600) -> str  # signed URL when remote, /api/files/<name> when local
    open_local(key) -> Path | None        # returns path if local, else None
"""
import os
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").strip()
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "").strip()
SUPABASE_BUCKET = os.environ.get("SUPABASE_BUCKET", "interview-recordings").strip()

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

_supabase_client = None


def is_remote() -> bool:
    return bool(SUPABASE_URL and SUPABASE_SERVICE_KEY)


def _client():
    global _supabase_client
    if _supabase_client is None:
        from supabase import create_client
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _supabase_client


def save_bytes(filename: str, data: bytes, content_type: str = "application/octet-stream") -> dict:
    """Save bytes to remote (Supabase) or local disk. Returns {key, is_remote}."""
    if is_remote():
        try:
            _client().storage.from_(SUPABASE_BUCKET).upload(
                path=filename,
                file=data,
                file_options={"content-type": content_type, "upsert": "false"},
            )
            return {"key": filename, "is_remote": True}
        except Exception as e:
            logger.exception("Supabase upload failed, falling back to local: %s", e)

    # Local fallback
    fpath = UPLOAD_DIR / filename
    with open(fpath, "wb") as f:
        f.write(data)
    return {"key": filename, "is_remote": False}


def get_url(key: str, expires_in: int = 3600) -> Optional[str]:
    """Return signed URL (remote) or local /api/files/{key} path."""
    if is_remote():
        try:
            res = _client().storage.from_(SUPABASE_BUCKET).create_signed_url(key, expires_in)
            return res.get("signedURL") or res.get("signed_url")
        except Exception as e:
            logger.exception("Supabase signed URL failed: %s", e)
            return None
    return f"/api/files/{key}"


def open_local(key: str) -> Optional[Path]:
    """Return local path if file exists locally; None otherwise."""
    fp = UPLOAD_DIR / key
    return fp if fp.exists() else None
