import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_run_demo_returns_expected_shape():
    """Integration test — requires real KLAVIYO_PRIVATE_API_KEY in environment."""
    r = client.post("/demo/run")
    assert r.status_code == 200
    body = r.json()
    assert "steps" in body
    assert "segment_id" in body
    assert "profile_id" in body
    assert "verify_url" in body
    step_names = [s["step"] for s in body["steps"]]
    assert "create_segment" in step_names
    assert "upsert_profile" in step_names


def test_run_demo_steps_have_ok_status():
    r = client.post("/demo/run")
    assert r.status_code == 200
    for step in r.json()["steps"]:
        if step.get("status") != "waiting":
            assert step["status"] == "ok", f"Step {step['step']} failed: {step}"
