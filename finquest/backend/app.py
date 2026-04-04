# app.py — PocketYodha Backend (Python / Flask)
# Run: python app.py
# Requires: pip install flask flask-cors pytesseract Pillow

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3, json, os, re, base64, io
from datetime import datetime

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])

DB_PATH = "pocketyodha.db"

# ─── DB SETUP ────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            age         INTEGER,
            gender      TEXT,
            occupation  TEXT,
            income      REAL DEFAULT 0,
            avatar      TEXT,
            hunter_name TEXT,
            xp          REAL DEFAULT 0,
            hp          REAL DEFAULT 500,
            level       INTEGER DEFAULT 1,
            streak      INTEGER DEFAULT 0,
            save_percent REAL DEFAULT 20,
            active_goal TEXT,
            created_at  TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at  TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS expenses (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     TEXT NOT NULL,
            amount      REAL NOT NULL,
            description TEXT,
            category    TEXT,
            type        TEXT CHECK(type IN ('need','want','trap')) DEFAULT 'need',
            date        TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS battles (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     TEXT NOT NULL,
            demon       TEXT,
            result      TEXT CHECK(result IN ('win','lose')),
            xp_change   REAL DEFAULT 0,
            hp_change   REAL DEFAULT 0,
            played_at   TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS achievements (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     TEXT NOT NULL,
            achievement TEXT NOT NULL,
            earned_at   TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    """)
    conn.commit()
    conn.close()

init_db()

# ─── EXPENSE CLASSIFIER ───────────────────────────────────────────────────────
NEED_KEYWORDS = [
    "rent","electricity","bill","bus","auto","metro","train","medicine","medical",
    "hospital","doctor","tuition","fee","grocery","groceries","dal","rice","roti",
    "sabzi","vegetables","milk","water","petrol","fuel","school","college","book",
    "stationery","internet","mobile","recharge","uniform","repair","maintenance"
]
WANT_KEYWORDS = [
    "swiggy","zomato","blinkit","instamart","amazon","flipkart","meesho","myntra",
    "ajio","nykaa","movie","cinema","pvr","inox","cafe","coffee","starbucks","ccd",
    "restaurant","hotel","dining","mall","shopping","clothes","fashion","shoe",
    "gaming","game","netflix","hotstar","spotify","youtube","premium","subscription",
    "party","celebration","gift","salon","spa","gym","fitness","travel","trip","tour",
    "hotel","ola","uber","rapido","bike","taxi","holiday","vacation"
]
TRAP_KEYWORDS = [
    "lottery","prize","winner","won","congratulations","free money","claim",
    "invest now","guaranteed return","double money","crypto tips","forex",
    "mlm","network marketing","join now","limited offer","urgent","act fast",
    "otp","share otp","verify account","kyc expire","block","suspended",
    "phishing","unknown","suspicious","fraud","scam","hack"
]

def classify_expense(description: str, amount: float = 0):
    text = description.lower().strip()
    text = re.sub(r'[^\w\s]', ' ', text)

    trap_score = sum(1 for kw in TRAP_KEYWORDS if kw in text)
    want_score = sum(1 for kw in WANT_KEYWORDS if kw in text)
    need_score = sum(1 for kw in NEED_KEYWORDS if kw in text)

    # High-amount unknown = likely want
    if amount > 2000 and trap_score == 0 and want_score == 0 and need_score == 0:
        want_score = 1

    if trap_score > 0:
        return "trap", round(min(trap_score / 3, 1.0), 2)
    elif want_score > need_score:
        return "want", round(min(want_score / 5, 1.0), 2)
    elif need_score > 0:
        return "need", round(min(need_score / 5, 1.0), 2)
    else:
        return "need", 0.5  # default to need with low confidence

# ─── ROUTES: HEALTH CHECK ────────────────────────────────────────────────────
@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ok", "app": "PocketYodha Backend", "version": "1.0"})

# ─── ROUTES: USER ────────────────────────────────────────────────────────────
@app.route("/api/user", methods=["POST"])
def create_or_update_user():
    """Create new user or update existing. Frontend sends full user object."""
    data = request.get_json()
    if not data or "id" not in data:
        return jsonify({"error": "user id required"}), 400

    conn = get_db()
    existing = conn.execute("SELECT id FROM users WHERE id = ?", (data["id"],)).fetchone()

    now = datetime.utcnow().isoformat()

    if existing:
        conn.execute("""
            UPDATE users SET
                name=?, age=?, gender=?, occupation=?, income=?,
                avatar=?, hunter_name=?, xp=?, hp=?, level=?,
                streak=?, save_percent=?, active_goal=?, updated_at=?
            WHERE id=?
        """, (
            data.get("name"), data.get("age"), data.get("gender"),
            data.get("occupation"), data.get("income"),
            data.get("avatar"), data.get("hunterName"),
            data.get("xp", 0), data.get("hp", 500), data.get("level", 1),
            data.get("streak", 0), data.get("savePercent", 20),
            json.dumps(data.get("activeGoal")), now, data["id"]
        ))
        msg = "updated"
    else:
        conn.execute("""
            INSERT INTO users (id, name, age, gender, occupation, income,
                avatar, hunter_name, xp, hp, level, streak, save_percent,
                active_goal, created_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            data["id"], data.get("name"), data.get("age"), data.get("gender"),
            data.get("occupation"), data.get("income", 0),
            data.get("avatar"), data.get("hunterName"),
            data.get("xp", 0), data.get("hp", 500), data.get("level", 1),
            data.get("streak", 0), data.get("savePercent", 20),
            json.dumps(data.get("activeGoal")), now, now
        ))
        msg = "created"

    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": msg})

@app.route("/api/user/<user_id>", methods=["GET"])
def get_user(user_id):
    """Load user profile from DB."""
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "user not found"}), 404

    user = dict(row)
    user["activeGoal"] = json.loads(user["active_goal"]) if user["active_goal"] else None
    user["hunterName"] = user.pop("hunter_name")
    user["savePercent"] = user.pop("save_percent")
    return jsonify(user)

# ─── ROUTES: EXPENSES ────────────────────────────────────────────────────────
@app.route("/api/expenses", methods=["POST"])
def log_expense():
    """Log a new expense. Auto-classifies if type not provided."""
    data = request.get_json()
    required = ["user_id", "amount"]
    if not all(k in data for k in required):
        return jsonify({"error": f"required fields: {required}"}), 400

    description = data.get("description", "")
    amount = float(data.get("amount", 0))

    # Auto-classify if type not provided by frontend
    if "type" not in data or not data["type"]:
        exp_type, confidence = classify_expense(description, amount)
    else:
        exp_type = data["type"]
        confidence = 1.0

    conn = get_db()
    cursor = conn.execute("""
        INSERT INTO expenses (user_id, amount, description, category, type, date)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        data["user_id"], amount, description,
        data.get("category", "other"), exp_type,
        data.get("date", datetime.utcnow().isoformat())
    ))
    expense_id = cursor.lastrowid

    # Update user HP based on type
    hp_delta = {"need": 0, "want": -5, "trap": -25}.get(exp_type, 0)
    if hp_delta != 0:
        conn.execute(
            "UPDATE users SET hp = MAX(0, MIN(500, hp + ?)), updated_at = ? WHERE id = ?",
            (hp_delta, datetime.utcnow().isoformat(), data["user_id"])
        )

    conn.commit()

    # Return updated user stats + classification result
    user = conn.execute(
        "SELECT xp, hp, level FROM users WHERE id = ?", (data["user_id"],)
    ).fetchone()
    conn.close()

    return jsonify({
        "success": True,
        "expense_id": expense_id,
        "classified_as": exp_type,
        "confidence": confidence,
        "hp_delta": hp_delta,
        "trigger_battle": exp_type == "trap",
        "user_stats": dict(user) if user else {}
    })

@app.route("/api/expenses/<user_id>", methods=["GET"])
def get_expenses(user_id):
    """Get all expenses for a user. Optional query params: days, type"""
    days = request.args.get("days", 30, type=int)
    exp_type = request.args.get("type")

    conn = get_db()
    query = """
        SELECT * FROM expenses
        WHERE user_id = ?
          AND date >= datetime('now', ? || ' days')
    """
    params = [user_id, f"-{days}"]

    if exp_type:
        query += " AND type = ?"
        params.append(exp_type)

    query += " ORDER BY date DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()

    expenses = [dict(r) for r in rows]

    # Summary stats
    total = sum(e["amount"] for e in expenses)
    by_type = {"need": 0, "want": 0, "trap": 0}
    for e in expenses:
        by_type[e["type"]] = by_type.get(e["type"], 0) + e["amount"]

    return jsonify({
        "expenses": expenses,
        "summary": {
            "total": round(total, 2),
            "by_type": by_type,
            "count": len(expenses),
            "days": days
        }
    })

@app.route("/api/expenses/<int:expense_id>", methods=["DELETE"])
def delete_expense(expense_id):
    conn = get_db()
    conn.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# ─── ROUTES: CLASSIFY (standalone) ───────────────────────────────────────────
@app.route("/api/classify", methods=["POST"])
def classify():
    """Classify an expense description without saving it."""
    data = request.get_json()
    description = data.get("description", "")
    amount = float(data.get("amount", 0))

    if not description:
        return jsonify({"error": "description required"}), 400

    exp_type, confidence = classify_expense(description, amount)

    hp_delta = {"need": 0, "want": -5, "trap": -25}[exp_type]
    label = {"need": "✅ Essential Expense", "want": "⚠️ Discretionary Spend", "trap": "🚨 Suspicious / Risky"}[exp_type]

    return jsonify({
        "type": exp_type,
        "label": label,
        "confidence": confidence,
        "hp_impact": hp_delta,
        "trigger_battle": exp_type == "trap"
    })

# ─── ROUTES: OCR ─────────────────────────────────────────────────────────────
@app.route("/api/ocr", methods=["POST"])
def ocr_receipt():
    """Extract text from receipt image (base64) and classify."""
    try:
        import pytesseract
        from PIL import Image
    except ImportError:
        return jsonify({
            "error": "pytesseract not installed",
            "install": "pip install pytesseract Pillow && sudo apt install tesseract-ocr"
        }), 500

    data = request.get_json()
    image_b64 = data.get("image")
    if not image_b64:
        return jsonify({"error": "image (base64) required"}), 400

    try:
        # Strip data URL prefix if present
        if "," in image_b64:
            image_b64 = image_b64.split(",")[1]

        img_bytes = base64.b64decode(image_b64)
        img = Image.open(io.BytesIO(img_bytes))
        text = pytesseract.image_to_string(img)

        # Extract amount from text (₹ or Rs or numbers)
        amount = 0
        amount_match = re.search(r'(?:₹|Rs\.?|INR)\s*(\d+(?:\.\d{1,2})?)', text, re.IGNORECASE)
        if not amount_match:
            amount_match = re.search(r'Total\s*:?\s*(\d+(?:\.\d{1,2})?)', text, re.IGNORECASE)
        if amount_match:
            amount = float(amount_match.group(1))

        exp_type, confidence = classify_expense(text, amount)

        return jsonify({
            "success": True,
            "raw_text": text.strip(),
            "extracted_amount": amount,
            "classified_as": exp_type,
            "confidence": confidence,
            "trigger_battle": exp_type == "trap"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ─── ROUTES: BATTLES ─────────────────────────────────────────────────────────
@app.route("/api/battle", methods=["POST"])
def log_battle():
    """Log battle result and update user XP/HP."""
    data = request.get_json()
    user_id = data.get("user_id")
    result = data.get("result")  # 'win' or 'lose'
    demon = data.get("demon", "Unknown Demon")

    if not user_id or result not in ("win", "lose"):
        return jsonify({"error": "user_id and result (win/lose) required"}), 400

    xp_change = data.get("xp_change", 60 if result == "win" else 0)
    hp_change = data.get("hp_change", 0 if result == "win" else -25)

    conn = get_db()
    conn.execute("""
        INSERT INTO battles (user_id, demon, result, xp_change, hp_change)
        VALUES (?, ?, ?, ?, ?)
    """, (user_id, demon, result, xp_change, hp_change))

    # Update user stats
    conn.execute("""
        UPDATE users SET
            xp = xp + ?,
            hp = MAX(0, MIN(500, hp + ?)),
            level = MAX(1, MIN(20, 1 + CAST(xp / 100 AS INTEGER))),
            updated_at = ?
        WHERE id = ?
    """, (xp_change, hp_change, datetime.utcnow().isoformat(), user_id))

    conn.commit()
    user = conn.execute(
        "SELECT xp, hp, level FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    conn.close()

    return jsonify({
        "success": True,
        "result": result,
        "xp_change": xp_change,
        "hp_change": hp_change,
        "user_stats": dict(user) if user else {}
    })

# ─── ROUTES: WEEKLY REVIEW ───────────────────────────────────────────────────
@app.route("/api/review/<user_id>", methods=["GET"])
def weekly_review(user_id):
    """Generate weekly review data for a user."""
    conn = get_db()

    # Last 7 days expenses
    expenses = conn.execute("""
        SELECT * FROM expenses
        WHERE user_id = ? AND date >= datetime('now', '-7 days')
        ORDER BY date DESC
    """, (user_id,)).fetchall()

    # Battle stats
    battles = conn.execute("""
        SELECT result, COUNT(*) as count FROM battles
        WHERE user_id = ? AND played_at >= datetime('now', '-7 days')
        GROUP BY result
    """, (user_id,)).fetchall()

    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()

    expenses_list = [dict(e) for e in expenses]
    total_spend = sum(e["amount"] for e in expenses_list)
    needs_total = sum(e["amount"] for e in expenses_list if e["type"] == "need")
    wants_total = sum(e["amount"] for e in expenses_list if e["type"] == "want")
    traps_total = sum(e["amount"] for e in expenses_list if e["type"] == "trap")

    battle_stats = {b["result"]: b["count"] for b in battles}
    wins = battle_stats.get("win", 0)
    losses = battle_stats.get("lose", 0)

    # Habit score (0–100)
    income = user["income"] if user else 0
    save_percent = user["save_percent"] if user else 20
    expected_max_spend = income * (1 - save_percent / 100) if income > 0 else 10000

    score = 100
    if total_spend > expected_max_spend:
        score -= min(40, int((total_spend - expected_max_spend) / expected_max_spend * 40))
    if traps_total > 0:
        score -= 20
    if wants_total > needs_total:
        score -= 15
    if losses > wins:
        score -= 10
    score = max(0, score)

    verdict = (
        "Shadow Monarch Mode" if score >= 90 else
        "Strong Hunter" if score >= 75 else
        "Average Warrior" if score >= 55 else
        "Under Pressure" if score >= 35 else
        "Goblin Ate Your Budget"
    )

    return jsonify({
        "week_summary": {
            "total_spend": round(total_spend, 2),
            "needs": round(needs_total, 2),
            "wants": round(wants_total, 2),
            "traps": round(traps_total, 2),
            "expense_count": len(expenses_list)
        },
        "battles": {"wins": wins, "losses": losses},
        "habit_score": score,
        "verdict": verdict,
        "expenses": expenses_list
    })

# ─── ROUTES: ACHIEVEMENTS ────────────────────────────────────────────────────
@app.route("/api/achievements", methods=["POST"])
def save_achievement():
    data = request.get_json()
    conn = get_db()
    # Check if already earned
    existing = conn.execute(
        "SELECT id FROM achievements WHERE user_id = ? AND achievement = ?",
        (data["user_id"], data["achievement"])
    ).fetchone()
    if not existing:
        conn.execute(
            "INSERT INTO achievements (user_id, achievement) VALUES (?, ?)",
            (data["user_id"], data["achievement"])
        )
        conn.commit()
    conn.close()
    return jsonify({"success": True, "new": not existing})

@app.route("/api/achievements/<user_id>", methods=["GET"])
def get_achievements(user_id):
    conn = get_db()
    rows = conn.execute(
        "SELECT achievement, earned_at FROM achievements WHERE user_id = ? ORDER BY earned_at DESC",
        (user_id,)
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

# ─── RUN ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("🏹 PocketYodha Backend running on http://localhost:5000")
    print("📁 Database:", os.path.abspath(DB_PATH))
    app.run(debug=True, port=5000)