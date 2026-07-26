"""
Tests for the areas the engineering review flagged as highest-risk:
  - classify_expense(): zero test coverage before, and it's the core
    product mechanic.
  - xp_for_level / apply_xp: this exact formula must match
    gameEngine.js's xpForLevel — if someone changes one without the
    other, these tests should start failing.
  - Auth / IDOR: the single most important fix in this pass. These tests
    assert that a request without a valid token for the target user_id
    is rejected, which is the thing that was previously not true at all.

Run with: pytest tests/ -v
"""
import json


# ─── CLASSIFIER ────────────────────────────────────────────────────────────
def test_classify_need():
    from app import classify_expense
    kind, conf = classify_expense("monthly electricity bill", 800)
    assert kind == "need"


def test_classify_want():
    from app import classify_expense
    kind, conf = classify_expense("zomato order for dinner", 350)
    assert kind == "want"


def test_classify_trap():
    from app import classify_expense
    kind, conf = classify_expense("congratulations you won a lottery prize, claim now", 0)
    assert kind == "trap"


def test_classify_trap_wins_over_want_keywords():
    # A message can mention shopping-adjacent words while still being a scam —
    # trap should always take priority over want/need scoring.
    from app import classify_expense
    kind, _ = classify_expense("urgent: verify your amazon account or it will be suspended", 0)
    assert kind == "trap"


def test_classify_unclear_defaults_to_need():
    # Regression guard: useExpenses.js used to default unclear input to
    # 'want' while this backend defaulted to 'need' — a real disagreement
    # found in review. Both must now default the same way.
    from app import classify_expense
    kind, _ = classify_expense("xyz", 0)
    assert kind == "need"


# ─── XP / LEVEL CURVE ──────────────────────────────────────────────────────
def test_xp_for_level_matches_gameengine_formula():
    # gameEngine.js: Math.floor(300 * Math.pow(1.3, level - 1))
    from app import xp_for_level
    assert xp_for_level(1) == 300
    assert xp_for_level(2) == 390
    assert xp_for_level(3) == 507


def test_apply_xp_rolls_over_levels():
    from app import apply_xp
    # Level 1 needs 300 xp to reach level 2.
    level, xp = apply_xp(1, 0, 300)
    assert level == 2
    assert xp == 0


def test_apply_xp_does_not_lose_overflow():
    from app import apply_xp
    level, xp = apply_xp(1, 0, 320)
    assert level == 2
    assert xp == 20  # the 20 leftover xp carries into level 2, not discarded


def test_rank_from_level_thresholds():
    from app import rank_from_level
    assert rank_from_level(1) == "E"
    assert rank_from_level(3) == "D"
    assert rank_from_level(6) == "C"
    assert rank_from_level(10) == "B"
    assert rank_from_level(15) == "A"
    assert rank_from_level(20) == "S"


# ─── AUTH / IDOR ───────────────────────────────────────────────────────────
def _register(client, user_id, name="Test Hunter"):
    res = client.post("/api/user", json={"id": user_id, "name": name})
    body = res.get_json()
    return body["token"]


def test_registration_returns_a_token(client):
    res = client.post("/api/user", json={"id": "user-a", "name": "Alice"})
    assert res.status_code == 200
    assert res.get_json()["token"]


def test_get_user_without_token_is_rejected(client):
    _register(client, "user-a")
    res = client.get("/api/user/user-a")  # no Authorization header at all
    assert res.status_code == 401


def test_get_user_with_wrong_token_is_rejected(client):
    _register(client, "user-a")
    res = client.get("/api/user/user-a", headers={"Authorization": "Bearer not-the-real-token"})
    assert res.status_code == 403


def test_get_user_with_correct_token_succeeds(client):
    token = _register(client, "user-a")
    res = client.get("/api/user/user-a", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.get_json()["name"] == "Test Hunter"


def test_cannot_read_another_users_data_with_your_own_token(client):
    # This is the core IDOR regression test: user-a's valid token must not
    # grant access to user-b's profile.
    token_a = _register(client, "user-a")
    _register(client, "user-b")
    res = client.get("/api/user/user-b", headers={"Authorization": f"Bearer {token_a}"})
    assert res.status_code == 403


def test_cannot_log_expense_for_another_user(client):
    token_a = _register(client, "user-a")
    _register(client, "user-b")
    res = client.post("/api/expenses", json={
        "user_id": "user-b", "amount": 100, "description": "groceries", "category": "food"
    }, headers={"Authorization": f"Bearer {token_a}"})
    assert res.status_code == 403


def test_cannot_delete_another_users_expense(client):
    token_a = _register(client, "user-a")
    token_b = _register(client, "user-b")
    log_res = client.post("/api/expenses", json={
        "user_id": "user-b", "amount": 100, "description": "groceries", "category": "food"
    }, headers={"Authorization": f"Bearer {token_b}"})
    expense_id = log_res.get_json()["expense_id"]

    # user-a tries to delete user-b's expense using their own valid token
    res = client.delete(f"/api/expenses/{expense_id}", headers={"Authorization": f"Bearer {token_a}"})
    assert res.status_code == 403

    # and the expense is still there, provable by user-b successfully reading it
    list_res = client.get("/api/expenses/user-b", headers={"Authorization": f"Bearer {token_b}"})
    assert list_res.get_json()["pagination"]["total"] == 1


def test_deleted_expense_is_soft_deleted_not_gone(client):
    token = _register(client, "user-a")
    log_res = client.post("/api/expenses", json={
        "user_id": "user-a", "amount": 50, "description": "chai", "category": "food"
    }, headers={"Authorization": f"Bearer {token}"})
    expense_id = log_res.get_json()["expense_id"]

    del_res = client.delete(f"/api/expenses/{expense_id}", headers={"Authorization": f"Bearer {token}"})
    assert del_res.status_code == 200

    # the row still exists in the DB (soft delete), just excluded from reads
    import app as app_module
    conn = app_module.get_db()
    row = conn.execute("SELECT deleted_at FROM expenses WHERE id = ?", (expense_id,)).fetchone()
    conn.close()
    assert row["deleted_at"] is not None


def test_hp_never_exceeds_max_via_battle_win(client):
    token = _register(client, "user-a")
    # win a battle with a huge hp_change to try to push hp above the cap
    res = client.post("/api/battle", json={
        "user_id": "user-a", "result": "win", "demon": "Test Demon", "hp_change": 9999
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.get_json()["user_stats"]["hp"] <= 100


def test_classify_endpoint_requires_no_auth_but_validates_input(client):
    res = client.post("/api/classify", json={"description": ""})
    assert res.status_code == 400  # empty description rejected

    res = client.post("/api/classify", json={"description": "swiggy order", "amount": 300})
    assert res.status_code == 200
    assert res.get_json()["type"] == "want"