from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
import os
from app.db.optimization import QueryOptimizer

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

# Configure engine with connection pooling and query optimization
if "sqlite" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo_pool=False
    )
else:
    engine = create_engine(
        DATABASE_URL,
        poolclass=QueuePool,
        pool_size=20,
        max_overflow=40,
        pool_pre_ping=True,
        echo_pool=False
    )

# Enable query logging and optimization
QueryOptimizer.enable_query_logging(engine)
QueryOptimizer.enable_connection_pooling(engine, pool_size=20, max_overflow=40)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

__all__ = ["engine", "SessionLocal", "Base", "get_db"]
