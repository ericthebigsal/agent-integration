"""Merge multiple Klaviyo OpenAPI specs into one combined spec."""
import json
from pathlib import Path


def deep_merge(base: dict, override: dict) -> dict:
    """Deep merge two dicts; override wins on conflicts at leaf level."""
    result = dict(base)
    for key, val in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(val, dict):
            result[key] = deep_merge(result[key], val)
        else:
            result[key] = val
    return result


def merge_specs(spec_names: list[str], enriched_dir: Path) -> dict:
    specs = []
    for name in spec_names:
        path = enriched_dir / f"{name}.json"
        if path.exists():
            specs.append(json.loads(path.read_text()))
            print(f"Loaded: {name}.json ({len(json.loads(path.read_text()).get('paths', {}))} paths)")
        else:
            print(f"WARNING: {name}.json not found, skipping")

    if not specs:
        raise ValueError("No specs found")

    # Start with the first spec as the base
    merged = json.loads(json.dumps(specs[0]))
    merged["info"]["title"] = "Klaviyo API — Profiles, Lists, Segments & Data Privacy"
    merged["info"]["description"] = (
        "Enriched Klaviyo API spec covering profile management, list membership, "
        "segment creation, and data-privacy compliance. Behavioral notes added by "
        "backend/enrich.py to surface rate limits, idempotency semantics, and known issues."
    )

    # Merge paths and components from remaining specs
    for spec in specs[1:]:
        # Merge paths
        for path, methods in spec.get("paths", {}).items():
            if path not in merged["paths"]:
                merged["paths"][path] = methods
            else:
                # Merge methods into existing path
                for method, op in methods.items():
                    merged["paths"][path][method] = op

        # Merge components
        for section, items in spec.get("components", {}).items():
            if section not in merged.setdefault("components", {}):
                merged["components"][section] = {}
            for name, schema in items.items():
                if name not in merged["components"][section]:
                    merged["components"][section][name] = schema
                # On conflict: keep existing (first-wins for schemas to avoid collisions)

        # Merge tags (deduplicate by name)
        existing_tag_names = {t["name"] for t in merged.get("tags", [])}
        for tag in spec.get("tags", []):
            if tag["name"] not in existing_tag_names:
                merged.setdefault("tags", []).append(tag)
                existing_tag_names.add(tag["name"])

    return merged


if __name__ == "__main__":
    enriched = Path("klaviyo-openapi/enriched")
    out = Path("klaviyo-openapi/merged")
    out.mkdir(parents=True, exist_ok=True)

    spec_names = ["profiles", "data_privacy", "lists", "segments"]
    merged = merge_specs(spec_names, enriched)

    total_paths = len(merged.get("paths", {}))
    print(f"\nMerged spec: {total_paths} total paths")

    out_file = out / "klaviyo-combined.json"
    out_file.write_text(json.dumps(merged, indent=2))
    print(f"Written: {out_file}")
