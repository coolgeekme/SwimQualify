import os

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
_base = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not _base:
    raise RuntimeError("REACT_APP_BACKEND_URL missing from env and /app/frontend/.env")
BASE_URL = _base.rstrip("/")


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="class")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="class")
def created_event_ids():
    return []


@pytest.fixture(scope="class", autouse=True)
def cleanup_events(api_client, created_event_ids):
    yield
    for eid in set(created_event_ids):
        try:
            api_client.delete(f"{BASE_URL}/api/events/{eid}", timeout=30)
        except Exception:
            pass
