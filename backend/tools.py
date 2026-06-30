"""
Tool execution layer.

Each function mirrors what the generated MCP server does — same HTTP calls,
same request structure — but runs server-side using the backend's credentials.
The generated .py file is the downloadable artifact; this module is what
powers the /run-tool demo endpoint.
"""
from __future__ import annotations

import httpx
from backend.config import settings

# ── Auth helpers ───────────────────────────────────────────────────────────────

def _klaviyo_headers() -> dict:
    return {
        "Authorization": f"Klaviyo-API-Key {settings.klaviyo_api_key}",
        "revision": settings.klaviyo_revision,
        "content-type": "application/json",
        "accept": "application/json",
    }


def _hubspot_headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.hubspot_service_key}",
        "Content-Type": "application/json",
    }


KLAVIYO_BASE = settings.klaviyo_base_url
HUBSPOT_BASE = "https://api.hubapi.com"


async def _ok(r: httpx.Response) -> dict:
    """Raise on error, return parsed JSON or status dict."""
    if r.status_code == 204:
        return {"status": "ok", "http_status": 204}
    r.raise_for_status()
    return r.json() if r.content else {"status": "ok"}


# ── Klaviyo — Manage Profiles ─────────────────────────────────────────────────

async def _kl_upsert_profile(
    email: str,
    first_name: str | None = None,
    last_name: str | None = None,
    phone_number: str | None = None,
    properties: dict | None = None,
) -> dict:
    attrs: dict = {"email": email}
    if first_name is not None:
        attrs["first_name"] = first_name
    if last_name is not None:
        attrs["last_name"] = last_name
    if phone_number is not None:
        attrs["phone_number"] = phone_number
    if properties is not None:
        attrs["properties"] = properties
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{KLAVIYO_BASE}/api/profiles",
            headers=_klaviyo_headers(),
            json={"data": {"type": "profile", "attributes": attrs}},
        )
        return await _ok(r)


async def _kl_get_profile(profile_id: str) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(f"{KLAVIYO_BASE}/api/profiles/{profile_id}", headers=_klaviyo_headers())
        return await _ok(r)


async def _kl_update_profile(
    profile_id: str,
    first_name: str | None = None,
    last_name: str | None = None,
    properties: dict | None = None,
) -> dict:
    attrs: dict = {}
    if first_name is not None:
        attrs["first_name"] = first_name
    if last_name is not None:
        attrs["last_name"] = last_name
    if properties is not None:
        attrs["properties"] = properties
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.patch(
            f"{KLAVIYO_BASE}/api/profiles/{profile_id}",
            headers=_klaviyo_headers(),
            json={"data": {"type": "profile", "id": profile_id, "attributes": attrs}},
        )
        return await _ok(r)


async def _kl_list_profiles(page_size: int = 20) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(
            f"{KLAVIYO_BASE}/api/profiles",
            headers=_klaviyo_headers(),
            params={"page[size]": page_size},
        )
        return await _ok(r)


async def _kl_delete_profile(profile_id: str) -> dict:
    body = {"data": {"type": "data-privacy-deletion-job", "attributes": {
        "profile": {"data": {"type": "profile", "id": profile_id}}
    }}}
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{KLAVIYO_BASE}/api/data-privacy-deletion-jobs",
            headers=_klaviyo_headers(),
            json=body,
        )
        return await _ok(r)


# ── Klaviyo — Manage Lists ────────────────────────────────────────────────────

async def _kl_create_list(name: str) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{KLAVIYO_BASE}/api/lists",
            headers=_klaviyo_headers(),
            json={"data": {"type": "list", "attributes": {"name": name}}},
        )
        return await _ok(r)


async def _kl_add_list_member(list_id: str, profile_id: str) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{KLAVIYO_BASE}/api/lists/{list_id}/relationships/profiles",
            headers=_klaviyo_headers(),
            json={"data": [{"type": "profile", "id": profile_id}]},
        )
        return await _ok(r)


async def _kl_remove_list_member(list_id: str, profile_id: str) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.request(
            "DELETE",
            f"{KLAVIYO_BASE}/api/lists/{list_id}/relationships/profiles",
            headers=_klaviyo_headers(),
            json={"data": [{"type": "profile", "id": profile_id}]},
        )
        return await _ok(r)


async def _kl_delete_list(list_id: str) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.delete(f"{KLAVIYO_BASE}/api/lists/{list_id}", headers=_klaviyo_headers())
        return await _ok(r)


# ── Klaviyo — Manage Segments ─────────────────────────────────────────────────

async def _kl_create_segment(name: str, property_name: str, property_value: str) -> dict:
    body = {"data": {"type": "segment", "attributes": {
        "name": name,
        "definition": {"condition_groups": [{"conditions": [{
            "type": "profile-property",
            "property": f"properties['{property_name}']",
            "filter": {"type": "string", "operator": "equals", "value": property_value},
        }]}]},
    }}}
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(f"{KLAVIYO_BASE}/api/segments", headers=_klaviyo_headers(), json=body)
        return await _ok(r)


async def _kl_get_segment(segment_id: str, include_profiles: bool = False) -> dict:
    url = f"{KLAVIYO_BASE}/api/segments/{segment_id}"
    if include_profiles:
        url += "/profiles"
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(url, headers=_klaviyo_headers())
        return await _ok(r)


# ── HubSpot — Manage Contacts ─────────────────────────────────────────────────

async def _hs_create_contact(
    email: str,
    firstname: str | None = None,
    lastname: str | None = None,
    extra_properties: dict | None = None,
) -> dict:
    props: dict = {"email": email}
    if firstname is not None:
        props["firstname"] = firstname
    if lastname is not None:
        props["lastname"] = lastname
    if extra_properties:
        props.update(extra_properties)
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(f"{HUBSPOT_BASE}/crm/v3/objects/contacts", headers=_hubspot_headers(), json={"properties": props})
        return await _ok(r)


async def _hs_batch_upsert_contacts(contacts: list[dict]) -> dict:
    inputs = [{"idProperty": "email", "properties": c} for c in contacts]
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{HUBSPOT_BASE}/crm/v3/objects/contacts/batch/upsert",
            headers=_hubspot_headers(),
            json={"inputs": inputs},
        )
        return await _ok(r)


async def _hs_update_contact(contact_id: str, properties: dict) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.patch(
            f"{HUBSPOT_BASE}/crm/v3/objects/contacts/{contact_id}",
            headers=_hubspot_headers(),
            json={"properties": properties},
        )
        return await _ok(r)


async def _hs_archive_contact(contact_id: str) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.delete(f"{HUBSPOT_BASE}/crm/v3/objects/contacts/{contact_id}", headers=_hubspot_headers())
        return await _ok(r)


async def _hs_list_contacts(limit: int = 10, after: str | None = None) -> dict:
    params: dict = {"limit": limit}
    if after is not None:
        params["after"] = after
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(f"{HUBSPOT_BASE}/crm/v3/objects/contacts", headers=_hubspot_headers(), params=params)
        return await _ok(r)


# ── HubSpot — Manage Lists ────────────────────────────────────────────────────

async def _hs_create_list(name: str, processing_type: str = "MANUAL") -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{HUBSPOT_BASE}/crm/v3/lists",
            headers=_hubspot_headers(),
            json={"name": name, "objectTypeId": "0-1", "processingType": processing_type},
        )
        return await _ok(r)


async def _hs_add_list_members(list_id: str, record_ids: list[str]) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.put(
            f"{HUBSPOT_BASE}/crm/v3/lists/{list_id}/memberships/add",
            headers=_hubspot_headers(),
            json={"recordIdsToAdd": record_ids},
        )
        return await _ok(r)


async def _hs_delete_list(list_id: str) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.delete(f"{HUBSPOT_BASE}/crm/v3/lists/{list_id}", headers=_hubspot_headers())
        return await _ok(r)


async def _hs_update_list_name(list_id: str, name: str) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.put(
            f"{HUBSPOT_BASE}/crm/v3/lists/{list_id}/update-list-name",
            headers=_hubspot_headers(),
            params={"listName": name},
        )
        return await _ok(r)


# ── HubSpot — Manage Associations ─────────────────────────────────────────────

async def _hs_batch_create_associations(
    from_object_type: str,
    to_object_type: str,
    associations: list[dict],
) -> dict:
    inputs = [
        {
            "from": {"id": a["from_id"]},
            "to": {"id": a["to_id"]},
            "types": [{"associationCategory": "HUBSPOT_DEFINED", "associationTypeId": a["association_type_id"]}],
        }
        for a in associations
    ]
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{HUBSPOT_BASE}/crm/v4/associations/{from_object_type}/{to_object_type}/batch/create",
            headers=_hubspot_headers(),
            json={"inputs": inputs},
        )
        return await _ok(r)


async def _hs_batch_read_associations(
    from_object_type: str,
    to_object_type: str,
    from_ids: list[str],
) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{HUBSPOT_BASE}/crm/v4/associations/{from_object_type}/{to_object_type}/batch/read",
            headers=_hubspot_headers(),
            json={"inputs": [{"id": i} for i in from_ids]},
        )
        return await _ok(r)


async def _hs_batch_delete_associations(
    from_object_type: str,
    to_object_type: str,
    associations: list[dict],
) -> dict:
    inputs = [
        {
            "from": {"id": a["from_id"]},
            "to": [{
                "id": a["to_id"],
                "types": [{"associationCategory": "HUBSPOT_DEFINED", "associationTypeId": a["association_type_id"]}],
            }],
        }
        for a in associations
    ]
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{HUBSPOT_BASE}/crm/v4/associations/{from_object_type}/{to_object_type}/batch/archive",
            headers=_hubspot_headers(),
            json={"inputs": inputs},
        )
        return await _ok(r)


# ── Dispatch table ─────────────────────────────────────────────────────────────

_REGISTRY: dict[str, dict[str, object]] = {
    "klaviyo": {
        "upsert_profile":      _kl_upsert_profile,
        "get_profile":         _kl_get_profile,
        "update_profile":      _kl_update_profile,
        "list_profiles":       _kl_list_profiles,
        "delete_profile":      _kl_delete_profile,
        "create_list":         _kl_create_list,
        "add_list_member":     _kl_add_list_member,
        "remove_list_member":  _kl_remove_list_member,
        "delete_list":         _kl_delete_list,
        "create_segment":      _kl_create_segment,
        "get_segment":         _kl_get_segment,
    },
    "hubspot": {
        "create_contact":              _hs_create_contact,
        "batch_upsert_contacts":       _hs_batch_upsert_contacts,
        "update_contact":              _hs_update_contact,
        "archive_contact":             _hs_archive_contact,
        "list_contacts":               _hs_list_contacts,
        "create_list":                 _hs_create_list,
        "add_list_members":            _hs_add_list_members,
        "delete_list":                 _hs_delete_list,
        "update_list_name":            _hs_update_list_name,
        "batch_create_associations":   _hs_batch_create_associations,
        "batch_read_associations":     _hs_batch_read_associations,
        "batch_delete_associations":   _hs_batch_delete_associations,
    },
}


async def run_tool(platform: str, tool_name: str, args: dict) -> dict:
    """Execute a named tool for the given platform. Raises KeyError if unknown."""
    platform_tools = _REGISTRY.get(platform)
    if platform_tools is None:
        raise KeyError(f"Unknown platform: {platform!r}")
    fn = platform_tools.get(tool_name)
    if fn is None:
        raise KeyError(f"Unknown tool {tool_name!r} for platform {platform!r}")
    return await fn(**args)  # type: ignore[operator]
