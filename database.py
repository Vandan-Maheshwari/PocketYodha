# 📦 Database setup and connection

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLite DB file
DATABASE_URL = "sqlite:///./rpg.db"

# Create engine (connection)
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

# Session for DB operations
SessionLocal = sessionmaker(bind=engine)

# Base class for models
Base = declarative_base()