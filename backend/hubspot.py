import httpx
import uuid
from fastapi import APIRouter, Header, HTTPException
from backend.config import settings

router = APIRouter()

BASE = "https://api.hubapi.com"


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.hubspot_service_key}",
        "Content-Type": "application/json",
    }


async def _post(client: httpx.AsyncClient, path: str, body: dict) -> dict:
    r = await client.post(f"{BASE}{path}", json=body, headers=_headers())
    if r.status_code not in (200, 201):
        raise HTTPException(status_code=r.status_code, detail=r.text)
    return r.json()


@router.post("/run")
async def run_demo(x_demo_key: str = Header(default="")):
    if settings.demo_secret and x_demo_key != settings.demo_secret:
        raise HTTPException(status_code=401, detail="Invalid demo key")
    if not settings.hubspot_service_key:
        raise HTTPException(status_code=503, detail="HUBSPOT_SERVICE_KEY not configured")

    results = []
    run_id = uuid.uuid4().hex[:8]

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Step 1 (Skill 4): Create contact
        contact = await _post(client, "/crm/v3/objects/contacts", {
            "properties": {
                "email": f"demo-{run_id}@example.com",
                "firstname": "Demo",
                "lastname": f"User {run_id}",
                "hs_lead_status": "IN_PROGRESS",
            }
        })
        contact_id = contact["id"]
        results.append({"step": "create_contact", "id": contact_id, "status": "ok"})

        # Step 2 (Skill 6): Create company to associate with
        company = await _post(client, "/crm/v3/objects/companies", {
            "properties": {
                "name": f"Demo Company {run_id}",
                "domain": f"demo-{run_id}.example.com",
            }
        })
        company_id = company["id"]
        results.append({"step": "create_company", "id": company_id, "status": "ok"})

        # Step 3 (Skill 6): Associate contact → company using batch default endpoint
        await _post(
            client,
            "/crm/v4/associations/contacts/companies/batch/associate/default",
            {"inputs": [{"from": {"id": contact_id}, "to": {"id": company_id}}]},
        )
        results.append({
            "step": "associate_contact_company",
            "association": f"contact {contact_id} → company {company_id}",
            "status": "ok",
        })

    return {
        "steps": results,
        "contact_id": contact_id,
        "company_id": company_id,
    }
