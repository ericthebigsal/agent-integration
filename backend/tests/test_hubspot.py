import os
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

_DEMO_KEY = os.getenv("DEMO_SECRET", "")


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


@pytest.mark.skipif(
    not os.getenv("HUBSPOT_SERVICE_KEY"),
    reason="HUBSPOT_SERVICE_KEY not set in environment"
)
def test_hubspot_run_returns_expected_shape():
    r = client.post("/demo/hubspot/run", headers={"X-Demo-Key": _DEMO_KEY})
    assert r.status_code == 200
    data = r.json()
    assert "steps" in data
    assert "contact_id" in data
    assert "company_id" in data


@pytest.mark.skipif(
    not os.getenv("HUBSPOT_SERVICE_KEY"),
    reason="HUBSPOT_SERVICE_KEY not set in environment"
)
def test_hubspot_run_steps_have_ok_status():
    r = client.post("/demo/hubspot/run", headers={"X-Demo-Key": _DEMO_KEY})
    assert r.status_code == 200
    steps = r.json()["steps"]
    assert all(s["status"] == "ok" for s in steps)
    assert len(steps) == 3
