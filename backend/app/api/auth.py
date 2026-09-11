"""
NWIS Engineer Authentication Module
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
"""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Response, Cookie, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import logging

from app.db.database import get_db
from app.models.models import Engineer

try:
    from passlib.context import CryptContext
    from jose import JWTError, jwt
    PASSLIB_AVAILABLE = True
except ImportError:
    PASSLIB_AVAILABLE = False

# Try direct bcrypt as fallback for passlib compat issues
try:
    import bcrypt as _bcrypt_lib
    BCRYPT_DIRECT = True
except ImportError:
    BCRYPT_DIRECT = False

logger = logging.getLogger(__name__)

router = APIRouter()

# ── Security config ──────────────────────────────────────────────────────────
SECRET_KEY = "nwis-dev-secret-key-change-in-production-2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

if PASSLIB_AVAILABLE:
    try:
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        # Test it works
        _test = pwd_context.hash("test")
        PASSLIB_OK = True
    except Exception:
        PASSLIB_OK = False
else:
    PASSLIB_OK = False


def verify_password(plain: str, hashed: str) -> bool:
    if PASSLIB_OK:
        return pwd_context.verify(plain, hashed)
    if BCRYPT_DIRECT:
        return _bcrypt_lib.checkpw(plain.encode(), hashed.encode())
    return plain == hashed  # dev-only fallback


def hash_password(plain: str) -> str:
    if PASSLIB_OK:
        return pwd_context.hash(plain)
    if BCRYPT_DIRECT:
        salt = _bcrypt_lib.gensalt()
        return _bcrypt_lib.hashpw(plain.encode(), salt).decode()
    return plain  # dev-only fallback


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    if not PASSLIB_AVAILABLE:
        # crude fallback — not for production
        return f"dev-token:{data.get('sub','')}"
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    if not PASSLIB_AVAILABLE or token.startswith("dev-token:"):
        sub = token.replace("dev-token:", "")
        return {"sub": sub} if sub else None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


COOKIE_NAME = "nwis_token"


def get_current_engineer(
    db: Session = Depends(get_db),
    token: Optional[str] = Cookie(default=None, alias=COOKIE_NAME),
) -> Engineer:
    """Dependency — resolves the authenticated engineer from cookie."""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    email = payload.get("sub")
    eng = db.query(Engineer).filter(Engineer.email == email).first()
    if not eng:
        raise HTTPException(status_code=401, detail="Engineer not found")
    return eng


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    email: str  # using str to avoid EmailStr dependency
    password: str
    confirm_password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class EngineerOut(BaseModel):
    id: int
    username: str
    email: str
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/register", status_code=201)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    logger.info("[AUTH] registration request")

    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    if len(req.username.strip()) == 0:
        raise HTTPException(status_code=400, detail="Username is required")
    if "@" not in req.email:
        raise HTTPException(status_code=400, detail="Invalid email address")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    # Check duplicates
    if db.query(Engineer).filter(Engineer.email == req.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    if db.query(Engineer).filter(Engineer.username == req.username).first():
        raise HTTPException(status_code=409, detail="Username already exists")

    eng = Engineer(
        username=req.username.strip(),
        email=req.email.strip().lower(),
        password_hash=hash_password(req.password),
    )
    try:
        db.add(eng)
        db.commit()
        db.refresh(eng)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email or username already registered")

    logger.info("[AUTH] registration success")
    return {"message": "Registration successful. Please log in.", "username": eng.username}


@router.post("/login")
def login(req: LoginRequest, response: Response, db: Session = Depends(get_db)):
    logger.info("[AUTH] login request")
    eng = db.query(Engineer).filter(Engineer.email == req.email.strip().lower()).first()
    if not eng or not verify_password(req.password, eng.password_hash):
        logger.warning(f"[AUTH] login failed — bad credentials for {req.email}")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": eng.email})
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24,  # 1 day
        secure=False,          # set True behind HTTPS in production
    )
    logger.info(f"[AUTH] login success user={eng.username}")
    return {"message": "Login successful", "user": {"id": eng.id, "username": eng.username, "email": eng.email}}


@router.get("/me")
def get_me(eng: Engineer = Depends(get_current_engineer)):
    return {"id": eng.id, "username": eng.username, "email": eng.email, "role": "ENGINEER"}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME)
    logger.info("[AUTH] session cleared")
    return {"message": "Logged out"}
