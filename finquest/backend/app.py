# app.py — PocketYodha Backend (Python / Flask)
# Run: python app.py
# Requires: pip install -r requirements.txt
#
# ── SECURITY REVIEW FIXES (July 2026) ────────────────────────────────────────
# This file was rewritten to close the issues found in the engineering
# review. Summary of what changed vs the original:
#
#   1. AUTH / IDOR (Critical) — every route that reads/writes a specific
#      user's data now requires an `Authorization: Bearer <token>` header
#      that must match a token hash stored for that user_id. Tokens are
#      generated server-side once, at registration, and returned exactly
#      once in the response body. Previously any caller could pass any
#      user_id and read/write/delete that user's data.
#   2. debug=True (Critical) — now gated behind FLASK_DEBUG env var,
#      defaults to off.
#   3. Foreign keys were declared in the schema but never enforced because
#      `PRAGMA foreign_keys = ON` was never set per-connection. Fixed in
#      get_db().
#   4. XP/level math — three different formulas existed across this file,
#      gameEngine.js, and userStore.js. This file now mirrors gameEngine.js's
#      exact curve (xp_for_level = floor(300 * 1.3^(level-1))) and its
#      per-level rollover semantics, instead of the old `1 + xp/100` guess.
#      If you ever change the curve, change it in BOTH gameEngine.js and
#      here — there is no shared package between the two runtimes.
#   5. HP scale — was 500 here vs 100 on the frontend. Now 100 everywhere.
#   6. No indexes on user_id/date columns — added.
#   7. No rate limiting on /api/ocr (unauthenticated, runs Tesseract on
#      arbitrary uploads) — added flask-limiter.
#   8. /api/ocr leaked raw exception text to the client — now logs
#      server-side and returns a generic message.
#   9. No pagination on /api/expenses/<user_id> — added page/page_size.
#  10. Hard deletes on financial records with no audit trail — expenses are
#      now soft-deleted (deleted_at timestamp) instead of removed.
#  11. No input validation beyond "key present" — added basic type/length
#      checks on the fields that matter.
#
# NOT done in this pass (flagged, not fixed — bigger, separate efforts):
#   - Migrating off SQLite to Postgres for real concurrent-write scale.
#   - Full password-based login / session UI. The token model here proves
#     "you are the device that registered this account," which closes the
#     IDOR hole, but it is not a password-reset-capable identity system.
#   - Docker/CI/CD and a real deployment target.

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import sqlite3, json, os, re, base64, io, hashlib, secrets, logging
from datetime import datetime, timezone
from functools import wraps

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv is a convenience, not a hard requirement

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pocketyodha")

app = Flask(__name__)

# ─── CONFIG (env-driven so this can point at something other than localhost) ─
DEBUG = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
PORT = int(os.environ.get("PORT", 5000))
DB_PATH = os.environ.get("DB_PATH", "pocketyodha.db")
ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")

CORS(app, origins=ALLOWED_ORIGINS)

limiter = Limiter(get_remote_address, app=app, default_limits=["200 per hour"])

MAX_HP = 100
MAX_LEVEL = 20

# ─── DB SETUP ────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id          TEXT PRIMARY KEY,
            token_hash  TEXT,
            name        TEXT NOT NULL,
            age         INTEGER,
            gender      TEXT,
            occupation  TEXT,
            income      REAL DEFAULT 0,
            avatar      TEXT,
            hunter_name TEXT,
            xp          REAL DEFAULT 0,
            hp          REAL DEFAULT 100,
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
            deleted_at  TEXT DEFAULT NULL,
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

        CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
        CREATE INDEX IF NOT EXISTS idx_expenses_user_deleted ON expenses(user_id, deleted_at);
        CREATE INDEX IF NOT EXISTS idx_battles_user_played ON battles(user_id, played_at);
        CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
    """)
    # Backfill: if this DB was created before token_hash/deleted_at existed,
    # add the columns so existing rows don't break on upgrade.
    existing_cols = [r["name"] for r in conn.execute("PRAGMA table_info(users)")]
    if "token_hash" not in existing_cols:
        conn.execute("ALTER TABLE users ADD COLUMN token_hash TEXT")
    existing_exp_cols = [r["name"] for r in conn.execute("PRAGMA table_info(expenses)")]
    if "deleted_at" not in existing_exp_cols:
        conn.execute("ALTER TABLE expenses ADD COLUMN deleted_at TEXT DEFAULT NULL")
    conn.commit()
    conn.close()

init_db()

# ─── AUTH HELPERS ─────────────────────────────────────────────────────────────
def hash_token(token: str) -> str:
    # Tokens are high-entropy random strings (secrets.token_urlsafe), so a
    # plain SHA-256 is sufficient here — this isn't a low-entropy password
    # that needs bcrypt/argon2 slow-hashing to resist brute force.
    return hashlib.sha256(token.encode()).hexdigest()

def new_token() -> str:
    return secrets.token_urlsafe(32)

def get_bearer_token():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    return auth[7:].strip()

def require_owner(user_id: str):
    """Returns None if the request's bearer token proves ownership of
    user_id, otherwise returns a (jsonify, status) tuple to return early."""
    if not user_id:
        return jsonify({"error": "user_id required"}), 400
    token = get_bearer_token()
    if not token:
        return jsonify({"error": "authentication required"}), 401
    conn = get_db()
    row = conn.execute("SELECT token_hash FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if not row or not row["token_hash"] or row["token_hash"] != hash_token(token):
        return jsonify({"error": "invalid credentials"}), 403
    return None

# ─── VALIDATION HELPERS ───────────────────────────────────────────────────────
def bad_request(msg):
    return jsonify({"error": msg}), 400

def valid_str(val, max_len=200):
    return isinstance(val, str) and 0 < len(val.strip()) <= max_len

def valid_number(val, min_val=None, max_val=None):
    try:
        n = float(val)
    except (TypeError, ValueError):
        return False
    if min_val is not None and n < min_val:
        return False
    if max_val is not None and n > max_val:
        return False
    return True

# ─── XP / LEVEL CURVE (mirrors gameEngine.js exactly — keep both in sync) ────
def xp_for_level(level: int) -> int:
    return int(300 * (1.3 ** (level - 1)))

def rank_from_level(level: int) -> str:
    if level >= 20: return "S"
    if level >= 15: return "A"
    if level >= 10: return "B"
    if level >= 6:  return "C"
    if level >= 3:  return "D"
    return "E"

def apply_xp(current_level: int, current_xp: float, amount: float):
    """Mirrors userStore.js addXP(): xp is progress *within* the current
    level, not a lifetime total, and rolls over level-by-level."""
    level = max(1, current_level)
    xp = current_xp + amount
    while level < MAX_LEVEL and xp >= xp_for_level(level):
        xp -= xp_for_level(level)
        level += 1
    return level, max(0, xp)

# ─── EXPENSE CLASSIFIER ───────────────────────────────────────────────────────
# NOTE: useExpenses.js on the frontend has its own local copy of this logic
# for offline/instant-feedback use before the server round-trip resolves.
# Keep the keyword lists identical in both places — they were found to have
# drifted in the original review. This backend copy is the source of truth;
# if you change these lists, update useExpenses.js to match.
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
    "ola","uber","rapido","bike","taxi","holiday","vacation"
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

    if amount > 2000 and trap_score == 0 and want_score == 0 and need_score == 0:
        want_score = 1

    if trap_score > 0:
        return "trap", round(min(trap_score / 3, 1.0), 2)
    elif want_score > need_score:
        return "want", round(min(want_score / 5, 1.0), 2)
    elif need_score > 0:
        return "need", round(min(need_score / 5, 1.0), 2)
    else:
        return "need", 0.5

# ─── ROUTES: HEALTH CHECK ────────────────────────────────────────────────────
@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ok", "app": "PocketYodha Backend", "version": "1.1"})

# ─── ROUTES: USER ────────────────────────────────────────────────────────────
@app.route("/api/user", methods=["POST"])
def create_or_update_user():
    """Create a new user (returns a bearer token, once) or update an
    existing one (requires that token in the Authorization header)."""
    data = request.get_json(silent=True)
    if not data or "id" not in data:
        return bad_request("user id required")
    if not valid_str(data.get("name"), 100):
        return bad_request("valid name required")

    conn = get_db()
    existing = conn.execute("SELECT id, token_hash FROM users WHERE id = ?", (data["id"],)).fetchone()
    now = datetime.now(timezone.utc).isoformat()

    if existing:
        # Updating an existing profile requires proof of ownership.
        auth_err = require_owner(data["id"])
        if auth_err:
            conn.close()
            return auth_err
        conn.execute("""
            UPDATE users SET
                name=?, age=?, gender=?, occupation=?, income=?,
                avatar=?, hunter_name=?, xp=?, hp=?, level=?,
                streak=?, save_percent=?, active_goal=?, updated_at=?
            WHERE id=?
        """, (
            data.get("name"), data.get("age"), data.get("gender"),
            data.get("occupation"), data.get("income"),
            data.get("avatarId"), data.get("hunterName"),
            data.get("xp", 0), min(data.get("hp", MAX_HP), MAX_HP), data.get("level", 1),
            data.get("streak", 0), data.get("savePercent", 20),
            json.dumps(data.get("activeGoal")), now, data["id"]
        ))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "updated"})
    else:
        token = new_token()
        conn.execute("""
            INSERT INTO users (id, token_hash, name, age, gender, occupation, income,
                avatar, hunter_name, xp, hp, level, streak, save_percent,
                active_goal, created_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            data["id"], hash_token(token), data.get("name"), data.get("age"), data.get("gender"),
            data.get("occupation"), data.get("income", 0),
            data.get("avatarId"), data.get("hunterName"),
            data.get("xp", 0), min(data.get("hp", MAX_HP), MAX_HP), data.get("level", 1),
            data.get("streak", 0), data.get("savePercent", 20),
            json.dumps(data.get("activeGoal")), now, now
        ))
        conn.commit()
        conn.close()
        # Token is returned exactly once — the client must store it
        # (userStore.js persists it as user.authToken) and send it as
        # `Authorization: Bearer <token>` on every future request.
        return jsonify({"success": True, "message": "created", "token": token})

@app.route("/api/user/<user_id>", methods=["GET"])
def get_user(user_id):
    auth_err = require_owner(user_id)
    if auth_err:
        return auth_err
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "user not found"}), 404

    user = dict(row)
    user.pop("token_hash", None)  # never return this, even to the owner
    user["activeGoal"] = json.loads(user["active_goal"]) if user["active_goal"] else None
    user["hunterName"] = user.pop("hunter_name")
    user["savePercent"] = user.pop("save_percent")
    return jsonify(user)

# ─── ROUTES: EXPENSES ────────────────────────────────────────────────────────
@app.route("/api/expenses", methods=["POST"])
def log_expense():
    data = request.get_json(silent=True)
    if not data:
        return bad_request("request body required")
    if not valid_str(data.get("user_id"), 100):
        return bad_request("user_id required")
    if not valid_number(data.get("amount"), min_val=0, max_val=10_000_000):
        return bad_request("amount must be a positive number")

    auth_err = require_owner(data["user_id"])
    if auth_err:
        return auth_err

    description = (data.get("description") or "")[:500]
    amount = float(data["amount"])

    if not data.get("type"):
        exp_type, confidence = classify_expense(description, amount)
    else:
        exp_type = data["type"] if data["type"] in ("need", "want", "trap") else "need"
        confidence = 1.0

    conn = get_db()
    cursor = conn.execute("""
        INSERT INTO expenses (user_id, amount, description, category, type, date)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        data["user_id"], amount, description,
        (data.get("category") or "other")[:50], exp_type,
        datetime.now(timezone.utc).isoformat()
    ))
    expense_id = cursor.lastrowid

    hp_delta = {"need": 0, "want": -5, "trap": -25}.get(exp_type, 0)
    if hp_delta != 0:
        conn.execute(
            "UPDATE users SET hp = MAX(0, MIN(?, hp + ?)), updated_at = ? WHERE id = ?",
            (MAX_HP, hp_delta, datetime.now(timezone.utc).isoformat(), data["user_id"])
        )

    conn.commit()
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
    """Get expenses for a user. Query params: days, type, page, page_size."""
    auth_err = require_owner(user_id)
    if auth_err:
        return auth_err

    days = max(1, min(request.args.get("days", 30, type=int), 365))
    exp_type = request.args.get("type")
    page = max(1, request.args.get("page", 1, type=int))
    page_size = max(1, min(request.args.get("page_size", 50, type=int), 200))
    offset = (page - 1) * page_size

    conn = get_db()
    query = """
        SELECT * FROM expenses
        WHERE user_id = ? AND deleted_at IS NULL
          AND date >= datetime('now', ? || ' days')
    """
    params = [user_id, f"-{days}"]

    if exp_type in ("need", "want", "trap"):
        query += " AND type = ?"
        params.append(exp_type)

    count_row = conn.execute(f"SELECT COUNT(*) as c FROM ({query})", params).fetchone()
    total = count_row["c"]

    query += " ORDER BY date DESC LIMIT ? OFFSET ?"
    params += [page_size, offset]
    rows = conn.execute(query, params).fetchall()
    conn.close()

    expenses = [dict(r) for r in rows]
    total_amt = sum(e["amount"] for e in expenses)
    by_type = {"need": 0, "want": 0, "trap": 0}
    for e in expenses:
        by_type[e["type"]] = by_type.get(e["type"], 0) + e["amount"]

    return jsonify({
        "expenses": expenses,
        "summary": {"total": round(total_amt, 2), "by_type": by_type, "count": len(expenses), "days": days},
        "pagination": {"page": page, "page_size": page_size, "total": total}
    })

@app.route("/api/expenses/<int:expense_id>", methods=["DELETE"])
def delete_expense(expense_id):
    conn = get_db()
    row = conn.execute("SELECT user_id FROM expenses WHERE id = ? AND deleted_at IS NULL", (expense_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "expense not found"}), 404

    auth_err = require_owner(row["user_id"])
    if auth_err:
        conn.close()
        return auth_err

    # Soft delete — financial records keep an audit trail instead of
    # vanishing outright.
    conn.execute("UPDATE expenses SET deleted_at = ? WHERE id = ?", (datetime.now(timezone.utc).isoformat(), expense_id))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# ─── ROUTES: CLASSIFY (standalone, no user data → no auth needed) ───────────
@app.route("/api/classify", methods=["POST"])
@limiter.limit("60 per minute")
def classify():
    data = request.get_json(silent=True) or {}
    description = data.get("description", "")
    if not valid_str(description, 500):
        return bad_request("description required")
    amount = data.get("amount", 0)
    if not valid_number(amount, min_val=0, max_val=10_000_000):
        amount = 0

    exp_type, confidence = classify_expense(description, float(amount))
    hp_delta = {"need": 0, "want": -5, "trap": -25}[exp_type]
    label = {"need": "✅ Essential Expense", "want": "⚠️ Discretionary Spend", "trap": "🚨 Suspicious / Risky"}[exp_type]

    return jsonify({
        "type": exp_type, "label": label, "confidence": confidence,
        "hp_impact": hp_delta, "trigger_battle": exp_type == "trap"
    })

# ─── ROUTES: OCR ─────────────────────────────────────────────────────────────
MAX_IMAGE_BYTES = 8 * 1024 * 1024  # 8MB — prevents memory-exhaustion via oversized uploads

@app.route("/api/ocr", methods=["POST"])
@limiter.limit("10 per minute")  # Tesseract is CPU-heavy; this was previously unlimited
def ocr_receipt():
    try:
        import pytesseract
        from PIL import Image
    except ImportError:
        return jsonify({
            "error": "pytesseract not installed",
            "install": "pip install pytesseract Pillow && sudo apt install tesseract-ocr"
        }), 500

    data = request.get_json(silent=True) or {}
    image_b64 = data.get("image")
    if not image_b64 or not isinstance(image_b64, str):
        return bad_request("image (base64) required")

    try:
        if "," in image_b64:
            image_b64 = image_b64.split(",")[1]

        img_bytes = base64.b64decode(image_b64, validate=True)
        if len(img_bytes) > MAX_IMAGE_BYTES:
            return jsonify({"error": "image too large (max 8MB)"}), 413

        img = Image.open(io.BytesIO(img_bytes))
        img.verify()  # reject corrupt/malformed images before re-opening to process
        img = Image.open(io.BytesIO(img_bytes))
        text = pytesseract.image_to_string(img)

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

    except Exception:
        # Previously this returned str(e) straight to the client — an
        # information-disclosure risk (stack internals, file paths, etc).
        # Log the real error server-side; tell the client something generic.
        logger.exception("OCR processing failed")
        return jsonify({"error": "could not process image"}), 500

# ─── ROUTES: BATTLES ─────────────────────────────────────────────────────────
@app.route("/api/battle", methods=["POST"])
def log_battle():
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    result = data.get("result")
    demon = (data.get("demon") or "Unknown Demon")[:100]

    if not valid_str(user_id, 100) or result not in ("win", "lose"):
        return bad_request("user_id and result (win/lose) required")

    auth_err = require_owner(user_id)
    if auth_err:
        return auth_err

    xp_change = data.get("xp_change", 60 if result == "win" else 0)
    hp_change = data.get("hp_change", 0 if result == "win" else -25)
    if not valid_number(xp_change, min_val=-1000, max_val=1000):
        xp_change = 0
    if not valid_number(hp_change, min_val=-100, max_val=100):
        hp_change = 0

    conn = get_db()
    conn.execute("""
        INSERT INTO battles (user_id, demon, result, xp_change, hp_change)
        VALUES (?, ?, ?, ?, ?)
    """, (user_id, demon, result, xp_change, hp_change))

    current = conn.execute("SELECT xp, level FROM users WHERE id = ?", (user_id,)).fetchone()
    if current:
        new_level, new_xp = apply_xp(current["level"], current["xp"], xp_change)
        conn.execute("""
            UPDATE users SET xp = ?, level = ?, hp = MAX(0, MIN(?, hp + ?)), updated_at = ?
            WHERE id = ?
        """, (new_xp, new_level, MAX_HP, hp_change, datetime.now(timezone.utc).isoformat(), user_id))

    conn.commit()
    user = conn.execute("SELECT xp, hp, level FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()

    return jsonify({
        "success": True, "result": result, "xp_change": xp_change, "hp_change": hp_change,
        "user_stats": dict(user) if user else {}
    })

# ─── ROUTES: WEEKLY REVIEW ───────────────────────────────────────────────────
@app.route("/api/review/<user_id>", methods=["GET"])
def weekly_review(user_id):
    auth_err = require_owner(user_id)
    if auth_err:
        return auth_err

    conn = get_db()
    expenses = conn.execute("""
        SELECT * FROM expenses
        WHERE user_id = ? AND deleted_at IS NULL AND date >= datetime('now', '-7 days')
        ORDER BY date DESC
    """, (user_id,)).fetchall()

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
            "total_spend": round(total_spend, 2), "needs": round(needs_total, 2),
            "wants": round(wants_total, 2), "traps": round(traps_total, 2),
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
    data = request.get_json(silent=True) or {}
    if not valid_str(data.get("user_id"), 100) or not valid_str(data.get("achievement"), 100):
        return bad_request("user_id and achievement required")

    auth_err = require_owner(data["user_id"])
    if auth_err:
        return auth_err

    conn = get_db()
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
    auth_err = require_owner(user_id)
    if auth_err:
        return auth_err
    conn = get_db()
    rows = conn.execute(
        "SELECT achievement, earned_at FROM achievements WHERE user_id = ? ORDER BY earned_at DESC",
        (user_id,)
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

# ─── RUN ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("🏹 PocketYodha Backend running on http://localhost:%d" % PORT)
    print("📁 Database:", os.path.abspath(DB_PATH))
    print("🔒 Debug mode:", DEBUG, "(set FLASK_DEBUG=true to enable locally)")
    app.run(debug=DEBUG, port=PORT)