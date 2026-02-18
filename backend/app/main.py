"""FastAPI application entrypoint."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.api import health, auth, questions, progress, exams, ai, exam_sessions, notes, flashcards, bookmarks

logging.basicConfig(
    level=get_settings().LOG_LEVEL,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    if "change-me-in-production" in settings.SECRET_KEY and "sqlite" not in settings.DATABASE_URL:
        logger.warning(
            "SECRET_KEY appears to be the default while using non-SQLite DB. "
            "Set SECRET_KEY in production (e.g. openssl rand -hex 32)."
        )
    logger.info("Application startup")
    yield
    logger.info("Application shutdown")


app = FastAPI(
    title="step2ck API",
    version="0.1.0",
    lifespan=lifespan,
)

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
