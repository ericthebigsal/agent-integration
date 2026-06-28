import httpx
import uuid
from fastapi import APIRouter, Header, HTTPException
from backend.config import settings

router = APIRouter()

HEADERS = {
    "Authorization": f"Klaviyo-API-Key {settings.klaviyo_api_key}",
    "revision": settings.klaviyo_revision,
    "content-type": "application/json",
    "accept": "application/json",
}
BASE = settings.klaviyo_base_url


async def _post(client: httpx.AsyncClient, path: str, body: dict) -> dict:
    r = await client.post(f"{BASE}{path}", json=body, headers=HEADERS)
    if r.status_code not in (200, 201, 202):
        raise HTTPException(status_code=r.status_code, detail=r.text)
    return r.json() if r.content else {}


async def _get(client: httpx.AsyncClient, path: str) -> dict:
    r = await client.get(f"{BASE}{path}", headers=HEADERS)
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=r.text)
    return r.json()


@router.post("/run")
async def run_demo(x_demo_key: str = Header(default="")):
    """Execute the cross-skill causation sequence. Returns step results immediately;
    caller should poll /demo/segment/{id}/members after ~30–60 seconds."""
    if settings.demo_secret and x_demo_key != settings.demo_secret:
        raise HTTPException(status_code=401, detail="Invalid demo key")
    results = []
    run_id = uuid.uuid4().hex[:8]

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Step 1 (Skill 3): Create segment with profile property rule
        seg = await _post(client, "/api/segments/", {
            "data": {
                "type": "segment",
                "attributes": {
                    "name": f"Demo VIP Gold Members {run_id}",
                    "definition": {
                        "condition_groups": [{
                            "conditions": [{
                                "type": "profile-property",
                                "property": "properties['vip_tier']",
                                "filter": {
                                    "type": "string",
                                    "operator": "equals",
                                    "value": "gold"
                                }
                            }]
                        }]
                    }
                }
            }
        })

        segment_id = seg["data"]["id"]
        results.append({"step": "create_segment", "id": segment_id, "status": "ok"})

        # Step 2 (Skill 1): Upsert profile with matching property
        prof = await _post(client, "/api/profiles/", {
            "data": {
                "type": "profile",
                "attributes": {
                    "email": f"demo-vip-gold-{run_id}@example.com",
                    "properties": {"vip_tier": "gold"}
                }
            }
        })
        profile_id = prof["data"]["id"]
        results.append({"step": "upsert_profile", "id": profile_id, "status": "ok"})

        # Step 3: Signal to caller that computation is in progress
        results.append({
            "step": "wait_for_segment",
            "message": "Klaviyo computing segment membership (~30–60s)",
            "status": "waiting"
        })

    return {
        "steps": results,
        "segment_id": segment_id,
        "profile_id": profile_id,
        "verify_url": f"{BASE}/api/segments/{segment_id}/profiles/",
    }


@router.get("/segment/{segment_id}/members")
async def get_segment_members(segment_id: str):
    """Poll segment membership after the computation window (~30–60s)."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        data = await _get(client, f"/api/segments/{segment_id}/profiles/")
    members = data.get("data", [])
    has_next = bool(data.get("links", {}).get("next"))
    return {
        "segment_id": segment_id,
        "member_count": len(members),
        "members": members,
        "truncated": has_next,
        "note": "member_count reflects first page only — paginate via links.next for full count" if has_next else None,
    }
