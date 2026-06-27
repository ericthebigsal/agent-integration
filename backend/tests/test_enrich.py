import json
import pytest
from backend.enrich import enrich_spec


def _spec(path: str, method: str, description: str = "") -> dict:
    return {"paths": {path: {method: {"summary": "test", "description": description}}}}


def test_enriches_profile_upsert():
    result = enrich_spec(_spec("/api/profiles", "post"))
    desc = result["paths"]["/api/profiles"]["post"]["description"]
    assert "Idempotent upsert" in desc


def test_enriches_delete_job():
    result = enrich_spec(_spec("/api/data-privacy-deletion-jobs", "post"))
    desc = result["paths"]["/api/data-privacy-deletion-jobs"]["post"]["description"]
    assert "Async + irreversible" in desc
    assert "401" in desc


def test_enriches_list_subscribe():
    result = enrich_spec(_spec("/api/lists/{id}/subscribe", "post"))
    desc = result["paths"]["/api/lists/{id}/subscribe"]["post"]["description"]
    assert "double opt-in" in desc.lower()
    assert "adds NO ONE" in desc


def test_enriches_segment_create():
    result = enrich_spec(_spec("/api/segments", "post"))
    desc = result["paths"]["/api/segments"]["post"]["description"]
    assert "100" in desc  # daily cap
    assert "computed" in desc.lower()


def test_preserves_existing_description():
    result = enrich_spec(_spec("/api/profiles", "post", "Original text."))
    desc = result["paths"]["/api/profiles"]["post"]["description"]
    assert "Idempotent upsert" in desc
    assert "Original text." in desc


def test_skips_unmatched_paths():
    result = enrich_spec(_spec("/api/accounts", "get", "Original"))
    assert result["paths"]["/api/accounts"]["get"]["description"] == "Original"


def test_does_not_mutate_input():
    spec = _spec("/api/profiles", "post", "Original")
    enrich_spec(spec)
    assert spec["paths"]["/api/profiles"]["post"]["description"] == "Original"


def test_handles_missing_description_key():
    spec = {"paths": {"/api/profiles": {"post": {"summary": "no description key"}}}}
    result = enrich_spec(spec)
    desc = result["paths"]["/api/profiles"]["post"]["description"]
    assert "Idempotent upsert" in desc
