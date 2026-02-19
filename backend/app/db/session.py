"""Database engine and session factory."""
import logging
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings
from app.db.base import Base

logger = logging.getLogger(__name__)


def get_engine():
    settings = get_settings()
    connect_args = {}
    is_sqlite = settings.DATABASE_URL.startswith("sqlite")

    if is_sqlite:
        connect_args["check_same_thread"] = False

    pool_kwargs = {}
    if not is_sqlite:
        pool_kwargs = {
            "pool_size": 10,
            "max_overflow": 20,
            "pool_recycle": 1800,
            "pool_pre_ping": True,
        }

    engine = create_engine(
        settings.DATABASE_URL,
        connect_args=connect_args,
        echo=settings.LOG_LEVEL.upper() == "DEBUG",
        **pool_kwargs,
    )
    return engine


engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """Context manager for non-FastAPI use (e.g. scripts)."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: yield session and commit/rollback on exit."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
