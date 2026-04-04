# 🧱 Database models (tables)

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from database import Base
import datetime

# 👤 USER TABLE
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    level = Column(Integer, default=1)
    xp = Column(Integer, default=0)
    hp = Column(Integer, default=100)
    balance = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# 💸 EXPENSE TABLE
class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Integer)
    category = Column(String)
    type = Column(String)  # need / want
    date = Column(DateTime, default=datetime.datetime.utcnow)


# ⚔️ BATTLE TABLE
class Battle(Base):
    __tablename__ = "battles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    trigger_reason = Column(String)
    choice_made = Column(String)
    xp_change = Column(Integer)
    hp_change = Column(Integer)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)