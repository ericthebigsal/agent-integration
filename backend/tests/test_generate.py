"""Tests for MCP server code generator and /api/generate + /api/run-tool endpoints."""
import os
import pytest
from fastapi.testclient import TestClient
from backend.generate import TOOL_LIBRARY, generate_mcp_server


# ── Unit tests: generator ─────────────────────────────────────────────────────

@pytest.mark.parametrize("key", list(TOOL_LIBRARY.keys()))
def test_generate_returns_code_and_meta(key):
    platform, scenario = key.split("-", 1)
    code, tools = generate_mcp_server(platform, int(scenario))
    assert isinstance(code, str) and len(code) > 100
    assert isinstance(tools, list) and len(tools) > 0


@pytest.mark.parametrize("key", list(TOOL_LIBRARY.keys()))
def test_generated_code_has_fastmcp_import(key):
    platform, scenario = key.split("-", 1)
    code, _ = generate_mcp_server(platform, int(scenario))
    assert "from mcp.server.fastmcp import FastMCP" in code


@pytest.mark.parametrize("key", list(TOOL_LIBRARY.keys()))
def test_generated_code_has_all_tool_functions(key):
    platform, scenario = key.split("-", 1)
    code, tools = generate_mcp_server(platform, int(scenario))
    for t in tools:
        assert f"async def {t['name']}(" in code, f"Missing function: {t['name']}"


@pytest.mark.parametrize("key", list(TOOL_LIBRARY.keys()))
def test_generated_code_has_mcp_tool_decorator(key):
    platform, scenario = key.split("-", 1)
    code, tools = generate_mcp_server(platform, int(scenario))
    assert code.count("@mcp.tool()") == len(tools)


def test_klaviyo_profiles_enrichment_embedded():
    code, tools = generate_mcp_server("klaviyo", 0)
    # upsert_profile should have the enrichment text in its docstring
    assert "Idempotent upsert" in code
    enriched = [t for t in tools if t["enriched"]]
    assert len(enriched) >= 2  # upsert + delete + list_profiles


def test_klaviyo_profiles_tool_count():
    _, tools = generate_mcp_server("klaviyo", 0)
    assert len(tools) == 5


def test_hubspot_contacts_enrichment_embedded():
    code, tools = generate_mcp_server("hubspot", 0)
    assert "duplicate" in code.lower() or "dedup" in code.lower()
    enriched = [t for t in tools if t["enriched"]]
    assert len(enriched) >= 1


def test_hubspot_contacts_tool_count():
    _, tools = generate_mcp_server("hubspot", 0)
    assert len(tools) == 5


def test_klaviyo_segments_tool_count():
    _, tools = generate_mcp_server("klaviyo", 2)
    assert len(tools) == 2


def test_generated_code_has_base_url():
    code, _ = generate_mcp_server("klaviyo", 0)
    assert "https://a.klaviyo.com" in code


def test_generated_code_has_env_var_reference():
    code, _ = generate_mcp_server("klaviyo", 0)
    assert "KLAVIYO_API_KEY" in code


def test_generated_code_has_httpx_calls():
    code, _ = generate_mcp_server("klaviyo", 0)
    assert "httpx.AsyncClient" in code
    assert "r.raise_for_status()" in code


def test_tool_meta_has_required_fields():
    _, tools = generate_mcp_server("klaviyo", 0)
    for t in tools:
        assert "name" in t
        assert "label" in t
        assert "method" in t
        assert "path" in t
        assert "enriched" in t
        assert "short_desc" in t


def test_unknown_platform_raises():
    with pytest.raises(KeyError):
        generate_mcp_server("salesforce", 0)


def test_unknown_scenario_raises():
    with pytest.raises(KeyError):
        generate_mcp_server("klaviyo", 99)


def test_generated_code_entry_point():
    code, _ = generate_mcp_server("klaviyo", 0)
    assert 'if __name__ == "__main__"' in code
    assert "mcp.run()" in code


# ── API endpoint tests ─────────────────────────────────────────────────────────

def test_generate_endpoint_klaviyo(client):
    r = client.post("/api/generate", json={"platform": "klaviyo", "scenario_index": 0})
    assert r.status_code == 200
    data = r.json()
    assert "code" in data
    assert "tools" in data
    assert data["total_ops"] == 5
    assert data["platform_name"] == "Klaviyo"
    assert data["scenario_name"] == "Manage Profiles"
    assert data["filename"].endswith(".py")


def test_generate_endpoint_hubspot(client):
    r = client.post("/api/generate", json={"platform": "hubspot", "scenario_index": 0})
    assert r.status_code == 200
    data = r.json()
    assert data["total_ops"] == 5
    assert data["platform_name"] == "HubSpot"


def test_generate_endpoint_all_scenarios(client):
    combos = [("klaviyo", 0), ("klaviyo", 1), ("klaviyo", 2),
              ("hubspot", 0), ("hubspot", 1), ("hubspot", 2)]
    for platform, idx in combos:
        r = client.post("/api/generate", json={"platform": platform, "scenario_index": idx})
        assert r.status_code == 200, f"Failed for {platform}-{idx}: {r.text}"


def test_generate_endpoint_unknown_returns_400(client):
    r = client.post("/api/generate", json={"platform": "salesforce", "scenario_index": 0})
    assert r.status_code == 400


def test_run_tool_requires_demo_key(client):
    """If demo_secret is set, calling without a key returns 401."""
    demo_secret = os.getenv("DEMO_SECRET", "")
    if not demo_secret:
        pytest.skip("DEMO_SECRET not set — key gate not active")
    r = client.post("/api/run-tool", json={
        "platform": "klaviyo",
        "tool_name": "list_profiles",
        "args": {"page_size": 1},
        "demo_key": "wrong-key",
    })
    assert r.status_code == 401


def test_run_tool_unknown_platform(client):
    demo_secret = os.getenv("DEMO_SECRET", "")
    r = client.post("/api/run-tool", json={
        "platform": "salesforce",
        "tool_name": "get_contact",
        "args": {},
        "demo_key": demo_secret,
    })
    assert r.status_code == 400


def test_run_tool_unknown_tool_name(client):
    demo_secret = os.getenv("DEMO_SECRET", "")
    r = client.post("/api/run-tool", json={
        "platform": "klaviyo",
        "tool_name": "nonexistent_tool",
        "args": {},
        "demo_key": demo_secret,
    })
    assert r.status_code == 400


@pytest.mark.skipif(not os.getenv("KLAVIYO_PRIVATE_API_KEY"), reason="Live credentials required")
def test_run_tool_list_profiles_live(client):
    demo_secret = os.getenv("DEMO_SECRET", "")
    r = client.post("/api/run-tool", json={
        "platform": "klaviyo",
        "tool_name": "list_profiles",
        "args": {"page_size": 1},
        "demo_key": demo_secret,
    })
    assert r.status_code == 200
    data = r.json()
    assert "data" in data


@pytest.mark.skipif(not os.getenv("HUBSPOT_SERVICE_KEY"), reason="Live credentials required")
def test_run_tool_list_contacts_live(client):
    demo_secret = os.getenv("DEMO_SECRET", "")
    r = client.post("/api/run-tool", json={
        "platform": "hubspot",
        "tool_name": "list_contacts",
        "args": {"limit": 1},
        "demo_key": demo_secret,
    })
    assert r.status_code == 200
    data = r.json()
    assert "results" in data
