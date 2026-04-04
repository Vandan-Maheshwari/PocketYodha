# 📥 Request validation schemas

from pydantic import BaseModel

# 👤 Create user
class UserCreate(BaseModel):
    name: str
    balance: int


# 💸 Add expense
class ExpenseCreate(BaseModel):
    user_id: int
    amount: int
    category: str
    type: str  # need / want


# ⚔️ Battle decision
class BattleChoice(BaseModel):
    user_id: int
    choice: str  # buy / skip
    amount: int
    trigger_reason: str