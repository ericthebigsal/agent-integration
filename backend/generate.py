"""
MCP Server code generator.

Produces a real, runnable Python MCP server using FastMCP for a given
platform and scenario. The generated server:
  - uses @mcp.tool() decorated async functions
  - embeds enriched behavioral warnings directly in tool docstrings
  - makes real httpx calls to the platform API
  - is ready to run with `pip install mcp httpx` and a valid API key

Also exports TOOL_LIBRARY for the execution layer (tools.py).
"""
from __future__ import annotations

from backend.enrich import ENRICHMENTS

# ── Tool parameter spec ───────────────────────────────────────────────────────

def _p(name: str, type_hint: str, *, default: str | None = None, desc: str = "") -> dict:
    """Convenience builder for a parameter entry."""
    return {"name": name, "type": type_hint, "default": default, "desc": desc}


# ── Platform / scenario / tool definitions ────────────────────────────────────
#
# body_code: lines inserted inside `async with httpx.AsyncClient() as client:`
#   at 8-space indent. The last assignment must be `r = await client.<method>(...)`.
#   BASE_URL and HEADERS are available in the generated file's module scope.
#
# enrichment_key: (method, path) tuple into ENRICHMENTS, or None.

TOOL_LIBRARY: dict[str, list[dict]] = {
    # ── Klaviyo ──────────────────────────────────────────────────────────────
    "klaviyo-0": {
        "platform_name": "Klaviyo",
        "scenario_name": "Manage Profiles",
        "base_url": "https://a.klaviyo.com",
        "env_var": "KLAVIYO_API_KEY",
        "auth_note": "# KLAVIYO_API_KEY: private API key (sk-…), NOT the public site key.",
        "headers": {
            "Authorization": 'f"Klaviyo-API-Key {os.environ[\'KLAVIYO_API_KEY\']}"',
            "revision": '"2024-10-15"',
            "content-type": '"application/json"',
            "accept": '"application/json"',
        },
        "tools": [
            {
                "name": "upsert_profile",
                "label": "Upsert Profile",
                "method": "POST",
                "path": "/api/profiles",
                "enrichment_key": ("post", "/api/profiles"),
                "params": [
                    _p("email", "str", desc="Primary identifier — used for dedup"),
                    _p("first_name", "str | None", default="None"),
                    _p("last_name", "str | None", default="None"),
                    _p("phone_number", "str | None", default="None", desc="E.164 format, e.g. +12065551234"),
                    _p("properties", "dict | None", default="None", desc="Arbitrary key-value pairs. Segment rules reference these keys."),
                ],
                "body_code": (
                    '        body = {"data": {"type": "profile", "attributes": {\n'
                    '            "email": email,\n'
                    '            **({"first_name": first_name} if first_name is not None else {}),\n'
                    '            **({"last_name": last_name} if last_name is not None else {}),\n'
                    '            **({"phone_number": phone_number} if phone_number is not None else {}),\n'
                    '            **({"properties": properties} if properties is not None else {}),\n'
                    '        }}}\n'
                    '        r = await client.post(f"{BASE_URL}/api/profiles", headers=HEADERS, json=body)'
                ),
            },
            {
                "name": "get_profile",
                "label": "Get Profile",
                "method": "GET",
                "path": "/api/profiles/{id}",
                "enrichment_key": None,
                "params": [
                    _p("profile_id", "str", desc="Klaviyo profile ID"),
                ],
                "body_code": '        r = await client.get(f"{BASE_URL}/api/profiles/{profile_id}", headers=HEADERS)',
            },
            {
                "name": "update_profile",
                "label": "Update Profile",
                "method": "PATCH",
                "path": "/api/profiles/{id}",
                "enrichment_key": None,
                "params": [
                    _p("profile_id", "str", desc="Klaviyo profile ID"),
                    _p("first_name", "str | None", default="None"),
                    _p("last_name", "str | None", default="None"),
                    _p("properties", "dict | None", default="None", desc="Properties to merge into the profile"),
                ],
                "body_code": (
                    '        body = {"data": {"type": "profile", "id": profile_id, "attributes": {\n'
                    '            **({"first_name": first_name} if first_name is not None else {}),\n'
                    '            **({"last_name": last_name} if last_name is not None else {}),\n'
                    '            **({"properties": properties} if properties is not None else {}),\n'
                    '        }}}\n'
                    '        r = await client.patch(f"{BASE_URL}/api/profiles/{profile_id}", headers=HEADERS, json=body)'
                ),
            },
            {
                "name": "list_profiles",
                "label": "List Profiles",
                "method": "GET",
                "path": "/api/profiles",
                "enrichment_key": ("get", "/api/profiles"),
                "params": [
                    _p("page_size", "int", default="20", desc="Max 100. Follow links.next for subsequent pages."),
                ],
                "body_code": '        r = await client.get(f"{BASE_URL}/api/profiles", headers=HEADERS, params={"page[size]": page_size})',
            },
            {
                "name": "delete_profile",
                "label": "Delete Profile",
                "method": "POST",
                "path": "/api/data-privacy-deletion-jobs",
                "enrichment_key": ("post", "/api/data-privacy-deletion-jobs"),
                "params": [
                    _p("profile_id", "str", desc="Klaviyo profile ID — deletion is async, irreversible, rate-limited at 60/min"),
                ],
                "body_code": (
                    '        body = {"data": {"type": "data-privacy-deletion-job", "attributes": {\n'
                    '            "profile": {"data": {"type": "profile", "id": profile_id}}\n'
                    '        }}}\n'
                    '        r = await client.post(f"{BASE_URL}/api/data-privacy-deletion-jobs", headers=HEADERS, json=body)'
                ),
            },
        ],
    },

    "klaviyo-1": {
        "platform_name": "Klaviyo",
        "scenario_name": "Manage Lists",
        "base_url": "https://a.klaviyo.com",
        "env_var": "KLAVIYO_API_KEY",
        "auth_note": "# KLAVIYO_API_KEY: private API key (sk-…), NOT the public site key.",
        "headers": {
            "Authorization": 'f"Klaviyo-API-Key {os.environ[\'KLAVIYO_API_KEY\']}"',
            "revision": '"2024-10-15"',
            "content-type": '"application/json"',
            "accept": '"application/json"',
        },
        "tools": [
            {
                "name": "create_list",
                "label": "Create List",
                "method": "POST",
                "path": "/api/lists",
                "enrichment_key": None,
                "params": [
                    _p("name", "str", desc="Display name for the list"),
                ],
                "body_code": (
                    '        body = {"data": {"type": "list", "attributes": {"name": name}}}\n'
                    '        r = await client.post(f"{BASE_URL}/api/lists", headers=HEADERS, json=body)'
                ),
            },
            {
                "name": "add_list_member",
                "label": "Add List Member",
                "method": "POST",
                "path": "/api/lists/{id}/relationships/profiles",
                "enrichment_key": ("post", "/api/lists/{id}/relationships/profiles"),
                "params": [
                    _p("list_id", "str", desc="Klaviyo list ID"),
                    _p("profile_id", "str", desc="Profile ID — not email. Call upsert_profile first to obtain."),
                ],
                "body_code": (
                    '        body = {"data": [{"type": "profile", "id": profile_id}]}\n'
                    '        r = await client.post(f"{BASE_URL}/api/lists/{list_id}/relationships/profiles", headers=HEADERS, json=body)'
                ),
            },
            {
                "name": "remove_list_member",
                "label": "Remove List Member",
                "method": "DELETE",
                "path": "/api/lists/{id}/relationships/profiles",
                "enrichment_key": ("delete", "/api/lists/{id}/relationships/profiles"),
                "params": [
                    _p("list_id", "str", desc="Klaviyo list ID"),
                    _p("profile_id", "str", desc="Profile ID to remove"),
                ],
                "body_code": (
                    '        body = {"data": [{"type": "profile", "id": profile_id}]}\n'
                    '        r = await client.request("DELETE", f"{BASE_URL}/api/lists/{list_id}/relationships/profiles", headers=HEADERS, json=body)'
                ),
            },
            {
                "name": "delete_list",
                "label": "Delete List",
                "method": "DELETE",
                "path": "/api/lists/{id}",
                "enrichment_key": None,
                "params": [
                    _p("list_id", "str", desc="Klaviyo list ID"),
                ],
                "body_code": '        r = await client.delete(f"{BASE_URL}/api/lists/{list_id}", headers=HEADERS)',
            },
        ],
    },

    "klaviyo-2": {
        "platform_name": "Klaviyo",
        "scenario_name": "Manage Segments",
        "base_url": "https://a.klaviyo.com",
        "env_var": "KLAVIYO_API_KEY",
        "auth_note": "# KLAVIYO_API_KEY: private API key (sk-…), NOT the public site key.",
        "headers": {
            "Authorization": 'f"Klaviyo-API-Key {os.environ[\'KLAVIYO_API_KEY\']}"',
            "revision": '"2024-10-15"',
            "content-type": '"application/json"',
            "accept": '"application/json"',
        },
        "tools": [
            {
                "name": "create_segment",
                "label": "Create Segment",
                "method": "POST",
                "path": "/api/segments",
                "enrichment_key": ("post", "/api/segments"),
                "params": [
                    _p("name", "str", desc="Display name for the segment"),
                    _p("property_name", "str", desc="Profile property to filter on, e.g. 'vip_tier'"),
                    _p("property_value", "str", desc="String value to match, e.g. 'gold'"),
                ],
                "body_code": (
                    '        body = {"data": {"type": "segment", "attributes": {\n'
                    '            "name": name,\n'
                    '            "definition": {"condition_groups": [{"conditions": [{\n'
                    '                "type": "profile-property",\n'
                    '                "property": f"properties[\'{property_name}\']",\n'
                    '                "filter": {"type": "string", "operator": "equals", "value": property_value}\n'
                    '            }]}]}\n'
                    '        }}}\n'
                    '        r = await client.post(f"{BASE_URL}/api/segments", headers=HEADERS, json=body)'
                ),
            },
            {
                "name": "get_segment",
                "label": "Get Segment",
                "method": "GET",
                "path": "/api/segments/{id}",
                "enrichment_key": ("get", "/api/segments/{id}"),
                "params": [
                    _p("segment_id", "str", desc="Klaviyo segment ID"),
                    _p("include_profiles", "bool", default="False", desc="If True, fetch current membership (may lag 10–60s after profile data changes)"),
                ],
                "body_code": (
                    '        url = f"{BASE_URL}/api/segments/{segment_id}"\n'
                    '        if include_profiles:\n'
                    '            url += "/profiles"\n'
                    '        r = await client.get(url, headers=HEADERS)'
                ),
            },
        ],
    },

    # ── HubSpot ───────────────────────────────────────────────────────────────

    "hubspot-0": {
        "platform_name": "HubSpot",
        "scenario_name": "Manage Contacts",
        "base_url": "https://api.hubapi.com",
        "env_var": "HUBSPOT_ACCESS_TOKEN",
        "auth_note": "# HUBSPOT_ACCESS_TOKEN: private app access token (not an API key).",
        "headers": {
            "Authorization": 'f"Bearer {os.environ[\'HUBSPOT_ACCESS_TOKEN\']}"',
            "Content-Type": '"application/json"',
        },
        "tools": [
            {
                "name": "create_contact",
                "label": "Create Contact",
                "method": "POST",
                "path": "/crm/v3/objects/contacts",
                "enrichment_key": ("post", "/crm/v3/objects/contacts"),
                "params": [
                    _p("email", "str", desc="WARNING: does NOT dedup — creates a duplicate if this email already exists. Use batch_upsert_contacts for safe dedup."),
                    _p("firstname", "str | None", default="None"),
                    _p("lastname", "str | None", default="None"),
                    _p("extra_properties", "dict | None", default="None", desc="Additional HubSpot contact properties"),
                ],
                "body_code": (
                    '        props: dict = {"email": email}\n'
                    '        if firstname is not None: props["firstname"] = firstname\n'
                    '        if lastname is not None: props["lastname"] = lastname\n'
                    '        if extra_properties: props.update(extra_properties)\n'
                    '        r = await client.post(f"{BASE_URL}/crm/v3/objects/contacts", headers=HEADERS, json={"properties": props})'
                ),
            },
            {
                "name": "batch_upsert_contacts",
                "label": "Batch Upsert Contacts",
                "method": "POST",
                "path": "/crm/v3/objects/contacts/batch/upsert",
                "enrichment_key": ("post", "/crm/v3/objects/contacts/batch/upsert"),
                "params": [
                    _p("contacts", "list[dict]", desc="Each dict must include 'email'. Deduplicates on email — safe to call repeatedly."),
                ],
                "body_code": (
                    '        inputs = [{"idProperty": "email", "properties": c} for c in contacts]\n'
                    '        r = await client.post(f"{BASE_URL}/crm/v3/objects/contacts/batch/upsert", headers=HEADERS, json={"inputs": inputs})'
                ),
            },
            {
                "name": "update_contact",
                "label": "Update Contact",
                "method": "PATCH",
                "path": "/crm/v3/objects/contacts/{contactId}",
                "enrichment_key": None,
                "params": [
                    _p("contact_id", "str", desc="HubSpot contact ID"),
                    _p("properties", "dict", desc="Properties to update, e.g. {'firstname': 'New Name'}"),
                ],
                "body_code": '        r = await client.patch(f"{BASE_URL}/crm/v3/objects/contacts/{contact_id}", headers=HEADERS, json={"properties": properties})',
            },
            {
                "name": "archive_contact",
                "label": "Archive Contact",
                "method": "DELETE",
                "path": "/crm/v3/objects/contacts/{contactId}",
                "enrichment_key": None,
                "params": [
                    _p("contact_id", "str", desc="HubSpot contact ID — archives (soft delete), not permanent removal. Use GDPR delete endpoint for erasure."),
                ],
                "body_code": '        r = await client.delete(f"{BASE_URL}/crm/v3/objects/contacts/{contact_id}", headers=HEADERS)',
            },
            {
                "name": "list_contacts",
                "label": "List Contacts",
                "method": "GET",
                "path": "/crm/v3/objects/contacts",
                "enrichment_key": None,
                "params": [
                    _p("limit", "int", default="10", desc="Max 100 per page"),
                    _p("after", "str | None", default="None", desc="Pagination cursor from previous response paging.next.after"),
                ],
                "body_code": (
                    '        params: dict = {"limit": limit}\n'
                    '        if after is not None: params["after"] = after\n'
                    '        r = await client.get(f"{BASE_URL}/crm/v3/objects/contacts", headers=HEADERS, params=params)'
                ),
            },
        ],
    },

    "hubspot-1": {
        "platform_name": "HubSpot",
        "scenario_name": "Manage Lists",
        "base_url": "https://api.hubapi.com",
        "env_var": "HUBSPOT_ACCESS_TOKEN",
        "auth_note": "# HUBSPOT_ACCESS_TOKEN: private app access token (not an API key).",
        "headers": {
            "Authorization": 'f"Bearer {os.environ[\'HUBSPOT_ACCESS_TOKEN\']}"',
            "Content-Type": '"application/json"',
        },
        "tools": [
            {
                "name": "create_list",
                "label": "Create List",
                "method": "POST",
                "path": "/crm/v3/lists",
                "enrichment_key": ("post", "/crm/v3/lists"),
                "params": [
                    _p("name", "str", desc="List name"),
                    _p("processing_type", "str", default='"MANUAL"', desc="'MANUAL' (writable membership) or 'DYNAMIC' (computed from filter). PERMANENT — cannot change after creation."),
                ],
                "body_code": (
                    '        body = {"name": name, "objectTypeId": "0-1", "processingType": processing_type}\n'
                    '        r = await client.post(f"{BASE_URL}/crm/v3/lists", headers=HEADERS, json=body)'
                ),
            },
            {
                "name": "add_list_members",
                "label": "Add List Members",
                "method": "PUT",
                "path": "/crm/v3/lists/{listId}/memberships/add",
                "enrichment_key": None,
                "params": [
                    _p("list_id", "str", desc="HubSpot list ID"),
                    _p("record_ids", "list[str]", desc="Contact IDs to add. WARNING: silently no-ops on DYNAMIC lists — returns HTTP 200 with no effect."),
                ],
                "body_code": '        r = await client.put(f"{BASE_URL}/crm/v3/lists/{list_id}/memberships/add", headers=HEADERS, json={"recordIdsToAdd": record_ids})',
            },
            {
                "name": "delete_list",
                "label": "Delete List",
                "method": "DELETE",
                "path": "/crm/v3/lists/{listId}",
                "enrichment_key": None,
                "params": [
                    _p("list_id", "str", desc="HubSpot list ID"),
                ],
                "body_code": '        r = await client.delete(f"{BASE_URL}/crm/v3/lists/{list_id}", headers=HEADERS)',
            },
            {
                "name": "update_list_name",
                "label": "Update List Name",
                "method": "PUT",
                "path": "/crm/v3/lists/{listId}/update-list-name",
                "enrichment_key": None,
                "params": [
                    _p("list_id", "str", desc="HubSpot list ID"),
                    _p("name", "str", desc="New display name"),
                ],
                "body_code": '        r = await client.put(f"{BASE_URL}/crm/v3/lists/{list_id}/update-list-name", headers=HEADERS, params={"listName": name})',
            },
        ],
    },

    "hubspot-2": {
        "platform_name": "HubSpot",
        "scenario_name": "Manage Associations",
        "base_url": "https://api.hubapi.com",
        "env_var": "HUBSPOT_ACCESS_TOKEN",
        "auth_note": "# HUBSPOT_ACCESS_TOKEN: private app access token (not an API key).",
        "headers": {
            "Authorization": 'f"Bearer {os.environ[\'HUBSPOT_ACCESS_TOKEN\']}"',
            "Content-Type": '"application/json"',
        },
        "tools": [
            {
                "name": "batch_create_associations",
                "label": "Batch Create Associations",
                "method": "POST",
                "path": "/crm/v4/associations/{fromObjectType}/{toObjectType}/batch/create",
                "enrichment_key": ("put", "/crm/v4/objects/{fromObjectType}/{fromObjectId}/associations/{toObjectType}/{toObjectId}"),
                "params": [
                    _p("from_object_type", "str", desc="e.g. 'contacts'"),
                    _p("to_object_type", "str", desc="e.g. 'companies'"),
                    _p("associations", "list[dict]", desc="Each dict: {from_id, to_id, association_type_id}. contact→company=1, contact→deal=3, contact→ticket=16"),
                ],
                "body_code": (
                    '        inputs = [\n'
                    '            {"from": {"id": a["from_id"]}, "to": {"id": a["to_id"]},\n'
                    '             "types": [{"associationCategory": "HUBSPOT_DEFINED", "associationTypeId": a["association_type_id"]}]}\n'
                    '            for a in associations\n'
                    '        ]\n'
                    '        r = await client.post(\n'
                    '            f"{BASE_URL}/crm/v4/associations/{from_object_type}/{to_object_type}/batch/create",\n'
                    '            headers=HEADERS, json={"inputs": inputs})'
                ),
            },
            {
                "name": "batch_read_associations",
                "label": "Batch Read Associations",
                "method": "POST",
                "path": "/crm/v4/associations/{fromObjectType}/{toObjectType}/batch/read",
                "enrichment_key": None,
                "params": [
                    _p("from_object_type", "str", desc="e.g. 'contacts'"),
                    _p("to_object_type", "str", desc="e.g. 'companies'"),
                    _p("from_ids", "list[str]", desc="IDs of the source objects to read associations for"),
                ],
                "body_code": (
                    '        inputs = [{"id": i} for i in from_ids]\n'
                    '        r = await client.post(\n'
                    '            f"{BASE_URL}/crm/v4/associations/{from_object_type}/{to_object_type}/batch/read",\n'
                    '            headers=HEADERS, json={"inputs": inputs})'
                ),
            },
            {
                "name": "batch_delete_associations",
                "label": "Batch Delete Associations",
                "method": "POST",
                "path": "/crm/v4/associations/{fromObjectType}/{toObjectType}/batch/archive",
                "enrichment_key": None,
                "params": [
                    _p("from_object_type", "str", desc="e.g. 'contacts'"),
                    _p("to_object_type", "str", desc="e.g. 'companies'"),
                    _p("associations", "list[dict]", desc="Each dict: {from_id, to_id, association_type_id}. WARNING: omitting association_type_id removes ALL types between the pair."),
                ],
                "body_code": (
                    '        inputs = [\n'
                    '            {"from": {"id": a["from_id"]},\n'
                    '             "to": [{"id": a["to_id"], "types": [{"associationCategory": "HUBSPOT_DEFINED",\n'
                    '                    "associationTypeId": a["association_type_id"]}]}]}\n'
                    '            for a in associations\n'
                    '        ]\n'
                    '        r = await client.post(\n'
                    '            f"{BASE_URL}/crm/v4/associations/{from_object_type}/{to_object_type}/batch/archive",\n'
                    '            headers=HEADERS, json={"inputs": inputs})'
                ),
            },
        ],
    },
}


# ── Combined "all" entries ─────────────────────────────────────────────────────
# Built after TOOL_LIBRARY is fully populated; merges all per-scenario tools for
# each platform, deduplicating by name and preserving order.

def _make_all_entry(platform: str) -> dict:
    seen: set[str] = set()
    combined: list[dict] = []
    i = 0
    while f"{platform}-{i}" in TOOL_LIBRARY:
        for t in TOOL_LIBRARY[f"{platform}-{i}"]["tools"]:
            if t["name"] not in seen:
                seen.add(t["name"])
                combined.append(t)
        i += 1
    base = TOOL_LIBRARY[f"{platform}-0"]
    return {**base, "scenario_name": "Full Integration Suite", "tools": combined}


TOOL_LIBRARY["klaviyo-all"] = _make_all_entry("klaviyo")
TOOL_LIBRARY["hubspot-all"] = _make_all_entry("hubspot")


# ── Code generator ─────────────────────────────────────────────────────────────

def _render_param_sig(params: list[dict]) -> str:
    parts = []
    for p in params:
        if p["default"] is None:
            parts.append(f"{p['name']}: {p['type']}")
        else:
            parts.append(f"{p['name']}: {p['type']} = {p['default']}")
    return ", ".join(parts)


def _render_headers_block(headers: dict[str, str]) -> str:
    lines = []
    for k, v in headers.items():
        lines.append(f'    "{k}": {v},')
    return "\n".join(lines)


def _get_enrichment(key: tuple | None) -> str:
    if not key:
        return ""
    return ENRICHMENTS.get(key, "")


def generate_mcp_server(platform: str, scenario_index: int | str) -> tuple[str, list[dict]]:
    """
    Generate a real Python MCP server for the given platform and scenario.

    Pass scenario_index=-1 (or "all") to generate a server with every tool for
    the platform combined into one file.

    Returns:
        (python_code, tool_meta_list)

    tool_meta_list entries: {name, label, method, path, enriched, short_desc}
    """
    if scenario_index in (-1, "all"):
        key = f"{platform}-all"
    else:
        key = f"{platform}-{scenario_index}"
    if key not in TOOL_LIBRARY:
        raise KeyError(f"No tool spec for {key!r}. Available: {list(TOOL_LIBRARY)}")

    spec = TOOL_LIBRARY[key]
    tools = spec["tools"]

    # Build tool metadata list
    tool_meta: list[dict] = []
    for t in tools:
        enrichment = _get_enrichment(t.get("enrichment_key"))
        short_desc = enrichment.split("\n")[0] if enrichment else f"{t['method']} {t['path']}"
        tool_meta.append({
            "name": t["name"],
            "label": t["label"],
            "method": t["method"],
            "path": t["path"],
            "enriched": bool(enrichment),
            "short_desc": short_desc,
        })

    enriched_count = sum(1 for m in tool_meta if m["enriched"])
    filename = f"{platform}-{spec['scenario_name'].lower().replace(' ', '-')}-mcp.py"

    # ── File header ────────────────────────────────────────────────────────────
    sections: list[str] = []

    sections.append(f'''\
#!/usr/bin/env python3
"""
{spec["platform_name"]} MCP Server — {spec["scenario_name"]}
Generated by AI-Assisted Martech Integration Builder

Platform  : {spec["platform_name"]}
Scenario  : {spec["scenario_name"]}
Operations: {len(tools)}
Enriched  : {enriched_count}/{len(tools)}  (behavioral warnings embedded in tool descriptions)

Quick start:
  pip install "mcp[cli]" httpx
  {spec["env_var"]}=your_key python {filename}
"""

import os
import asyncio
import httpx
from mcp.server.fastmcp import FastMCP

{spec["auth_note"]}
BASE_URL = "{spec["base_url"]}"
HEADERS = {{
{_render_headers_block(spec["headers"])}
}}

mcp = FastMCP("{platform}-{spec['scenario_name'].lower().replace(' ', '-')}")
''')

    # ── Tool functions ─────────────────────────────────────────────────────────
    for t in tools:
        enrichment = _get_enrichment(t.get("enrichment_key"))

        # Docstring body
        if enrichment:
            doc_body = enrichment.rstrip() + f"\n\n    {t['method']} {t['path']}"
        else:
            doc_body = f"{t['method']} {t['path']}"

        # Indent docstring lines
        doc_lines = doc_body.split("\n")
        doc_indented = "\n".join(f"    {ln}" if ln.strip() else "" for ln in doc_lines)

        sig = _render_param_sig(t["params"])
        body_code = t["body_code"]

        sections.append(f'''\
@mcp.tool()
async def {t["name"]}({sig}) -> dict:
    """
{doc_indented}
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
{body_code}
        if r.status_code == 204:
            return {{"status": "ok", "http_status": 204}}
        r.raise_for_status()
        return r.json() if r.content else {{"status": "ok"}}
''')

    # ── Entry point ────────────────────────────────────────────────────────────
    sections.append('''\
if __name__ == "__main__":
    mcp.run()
''')

    code = "\n".join(sections)
    return code, tool_meta
