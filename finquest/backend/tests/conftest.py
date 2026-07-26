import os
import sys
import tempfile
import importlib
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture
def client():
    """Fresh temp SQLite DB + Flask test client per test, so tests never
    touch the real pocketyodha.db and don't leak state between tests."""
    db_fd, db_path = tempfile.mkstemp(suffix=".db")
    os.environ["DB_PATH"] = db_path
    os.environ["FLASK_DEBUG"] = "false"

    import app as app_module
    importlib.reload(app_module)  # re-run init_db() against the temp DB

    app_module.app.config["TESTING"] = True
    with app_module.app.test_client() as c:
        yield c

    os.close(db_fd)
    os.unlink(db_path)