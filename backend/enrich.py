import json
from pathlib import Path

ENRICHMENTS: dict[tuple[str, str], str] = {
    ("post", "/api/data-privacy-deletion-jobs"): (
        "Async + irreversible compliance job. Profile is not deleted immediately — "
        "deletion is queued and processed asynchronously. No soft-delete, no undo. "
        "Rate limit: burst 3/s, steady 60/min. "
        "KNOWN ISSUE: Intermittent 401 errors occur immediately after a Klaviyo API "
        "revision bump with a valid key — wait and retry before rotating keys "
        "(confirmed April 2026 community thread)."
    ),
    ("post", "/api/profiles"): (
        "Idempotent upsert: re-sending the same email/phone/external_id silently "
        "overwrites all provided fields — no error, no duplicate. "
        "Setting a value in properties may silently update segment membership for any "
        "segment rule referencing that property key."
    ),
    ("get", "/api/profiles"): (
        "No bulk export endpoint exists. Follow the cursor: each response includes "
        "links.next — loop until links.next is null."
    ),
    ("post", "/api/lists/{id}/subscribe"): (
        "Consent-aware add-member path. If double opt-in is enabled (Klaviyo's default), "
        "returns HTTP 200 with empty response body and adds NO ONE until the contact "
        "confirms via email. Disable double opt-in on test lists before demoing."
    ),
    ("post", "/api/lists/{id}/relationships/profiles"): (
        "Adds profile to list immediately without granting marketing consent. "
        "Requires profile ID — not email. "
        "For net-new contacts, call POST /api/profiles first to obtain an ID."
    ),
    ("delete", "/api/lists/{id}/relationships/profiles"): (
        "Removes from list only. Does NOT affect subscription or consent status. "
        "Use the Profiles Unsubscribe endpoint to stop marketing communications."
    ),
    ("post", "/api/segments"): (
        "Daily cap: 100 segments/day (burst 1/s, steady 15/min). "
        "Segment membership is computed — there is no add-member endpoint. "
        "An empty segment after creation means profiles lack the expected property "
        "values, not a configuration error. "
        "Membership updates 10–60 seconds after profile data changes."
    ),
    ("get", "/api/segments/{id}"): (
        "Membership updates 10–60 seconds after profile data changes. "
        "Zero members = data quality issue (profiles missing the property values the "
        "rule references), not a config error. Wait 60s before diagnosing."
    ),
}


def enrich_spec(spec: dict) -> dict:
    """Inject behavioral descriptions into OpenAPI spec operations. Non-mutating."""
    spec = json.loads(json.dumps(spec))
    for path, methods in spec.get("paths", {}).items():
        for method, operation in methods.items():
            if not isinstance(operation, dict):
                continue
            key = (method.lower(), path)
            if key not in ENRICHMENTS:
                continue
            existing = operation.get("description", "")
            prefix = ENRICHMENTS[key]
            operation["description"] = f"{prefix}\n\n{existing}".strip()
    return spec


def enrich_file(input_path: Path, output_path: Path) -> None:
    spec = json.loads(input_path.read_text())
    enriched = enrich_spec(spec)
    output_path.write_text(json.dumps(enriched, indent=2))
    print(f"Enriched: {input_path.name} → {output_path.name}")


if __name__ == "__main__":
    raw = Path("klaviyo-openapi/json")
    out = Path("klaviyo-openapi/enriched")
    out.mkdir(parents=True, exist_ok=True)
    for name in ["profiles", "data_privacy", "lists", "segments"]:
        src = raw / f"{name}.json"
        if src.exists():
            enrich_file(src, out / f"{name}.json")
        else:
            print(f"Skipping {name}.json — not found in {raw}")
