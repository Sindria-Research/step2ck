"""FastAPI application entrypoint."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import get_settings
from app.api import health, auth, questions, progress, exams, ai, exam_sessions, notes, flashcards, bookmarks, study_profile, study_plan, billing

logging.basicConfig(
    level=get_settings().LOG_LEVEL,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    if "change-me-in-production" in settings.SECRET_KEY:
        if settings.ENVIRONMENT == "production":
            raise RuntimeError(
                "SECRET_KEY is still the default — refusing to start in production. "
                "Set SECRET_KEY to a strong random value (openssl rand -hex 32)."
            )
        logger.warning("SECRET_KEY is the default. Set SECRET_KEY before deploying.")
    logger.info("Application startup")
    yield
    logger.info("Application shutdown")


app = FastAPI(
    title="step2ck API",
    version="0.1.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error: %s", exc)
    settings = get_settings()
    # Include error message in response when debug or when it's a DB error (e.g. missing table)
    detail = "Internal server error"
    if settings.LOG_LEVEL.upper() == "DEBUG" or "no such table" in str(exc).lower() or "operational" in type(exc).__name__.lower():
        detail = str(exc)
    return JSONResponse(
        status_code=500,
        content={"detail": detail},
    )


app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(questions.router, prefix="/questions", tags=["questions"])
app.include_router(progress.router, prefix="/progress", tags=["progress"])
app.include_router(exams.router, prefix="/exams", tags=["exams"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])
app.include_router(exam_sessions.router, prefix="/exam-sessions", tags=["exam-sessions"])
app.include_router(notes.router, prefix="/notes", tags=["notes"])
app.include_router(flashcards.router, prefix="/flashcards", tags=["flashcards"])
app.include_router(bookmarks.router, prefix="/bookmarks", tags=["bookmarks"])
app.include_router(study_profile.router, prefix="/study-profile", tags=["study-profile"])
app.include_router(study_plan.router, prefix="/study-plan", tags=["study-plan"])
app.include_router(billing.router, prefix="/billing", tags=["billing"])
