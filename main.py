from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base, SessionLocal
import models, schemas

app = FastAPI()

# 🌐 Enable CORS (for Flutter connection)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create DB tables
Base.metadata.create_all(bind=engine)


# 🔌 DB connection
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 🏠 Home
@app.get("/")
def home():
    return {
        "success": True,
        "message": "RPG Finance API running 🚀"
    }


# 👤 CREATE USER
@app.post("/create-user")
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):

    new_user = models.User(
        name=user.name,
        balance=user.balance
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "success": True,
        "data": {
            "id": new_user.id,
            "name": new_user.name,
            "balance": new_user.balance,
            "xp": new_user.xp,
            "hp": new_user.hp,
            "level": new_user.level
        },
        "message": "User created successfully"
    }


# 🧠 BATTLE TRIGGER LOGIC
def trigger_battle(expense, user):

    if expense.type == "want" and expense.amount > 500:
        return {
            "type": "IMPULSE_BATTLE",
            "enemy": "Impulse Demon 👹"
        }

    elif user.balance < 1000:
        return {
            "type": "SURVIVAL_BATTLE",
            "enemy": "Debt Monster 💀"
        }

    return None


# 💸 ADD EXPENSE
@app.post("/add-expense")
def add_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):

    user = db.query(models.User).filter(models.User.id == expense.user_id).first()

    if not user:
        return {"success": False, "message": "User not found"}

    # Save expense
    new_expense = models.Expense(
        user_id=expense.user_id,
        amount=expense.amount,
        category=expense.category,
        type=expense.type
    )
    db.add(new_expense)

    # ⚔️ Battle trigger
    battle_data = trigger_battle(expense, user)

    if battle_data:
        db.commit()
        return {
            "success": True,
            "data": {
                "battle": True,
                "type": battle_data["type"],
                "enemy": battle_data["enemy"]
            },
            "message": f"{battle_data['enemy']} has appeared!"
        }

    # Normal flow
    user.balance -= expense.amount
    user.xp += 10

    if user.xp >= user.level * 100:
        user.level += 1
        user.xp = 0

    db.commit()

    return {
        "success": True,
        "data": {
            "battle": False,
            "balance": user.balance,
            "xp": user.xp,
            "level": user.level
        },
        "message": "Expense added"
    }


# ⚔️ BATTLE DECISION
@app.post("/battle-choice")
def battle_choice(choice: schemas.BattleChoice, db: Session = Depends(get_db)):

    user = db.query(models.User).filter(models.User.id == choice.user_id).first()

    if not user:
        return {"success": False, "message": "User not found"}

    if choice.choice == "buy":
        user.balance -= choice.amount
        user.hp -= 20
        user.xp += 5

        xp_change = 5
        hp_change = -20
        message = "💀 Financial damage taken! You gave in."

    elif choice.choice == "skip":
        user.xp += 30
        user.hp += 5

        xp_change = 30
        hp_change = 5
        message = "🧠 Discipline increased! You resisted."

    else:
        return {"success": False, "message": "Invalid choice"}

    if user.xp >= user.level * 100:
        user.level += 1
        user.xp = 0

    # Save battle log
    battle = models.Battle(
        user_id=user.id,
        trigger_reason=choice.trigger_reason,
        choice_made=choice.choice,
        xp_change=xp_change,
        hp_change=hp_change
    )
    db.add(battle)

    db.commit()

    return {
        "success": True,
        "data": {
            "balance": user.balance,
            "xp": user.xp,
            "hp": user.hp,
            "level": user.level
        },
        "message": message
    }


# 📊 USER DATA
@app.get("/user/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):

    user = db.query(models.User).filter(models.User.id == user_id).first()

    if not user:
        return {"success": False, "message": "User not found"}

    return {
        "success": True,
        "data": {
            "id": user.id,
            "name": user.name,
            "balance": user.balance,
            "xp": user.xp,
            "hp": user.hp,
            "level": user.level
        }
    }


# 🏆 WEEKLY REPORT (FINAL ADDITION)
@app.get("/weekly-report")
def weekly_report(db: Session = Depends(get_db)):

    user = db.query(models.User).first()

    if not user:
        return {"success": False, "message": "No user found"}

    # Simple analysis
    if user.balance <= 0:
        status = "You went broke 💀"
    elif user.balance < 1000:
        status = "Careful... low funds ⚠️"
    else:
        status = "You survived this week 🧠"

    return {
        "success": True,
        "data": {
            "balance": user.balance,
            "xp": user.xp,
            "level": user.level,
            "status": status
        }
    }