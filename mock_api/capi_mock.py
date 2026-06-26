"""
FastAPI mock of the Meta Conversions API.

Mirrors real CAPI behavior relevant to connector testing:
- POST /{pixel_id}/events with access_token query param
- Validates required event fields
- All-or-nothing batch rejection (any invalid event → entire batch fails)
- Realistic error response shapes

Run with: uvicorn mock_api.capi_mock:app --reload --port 8001
"""
from __future__ import annotations

import time
import uuid
from typing import Any

from fastapi import FastAPI, HTTPException, Path, Query
from pydantic import BaseModel, Field

app = FastAPI(title="Meta CAPI Mock", version="v21.0")

_VALID_ACTION_SOURCES = {
    "website", "app", "phone_call", "chat", "email",
    "other", "physical_store", "system_generated",
}

_REQUIRED_EVENT_FIELDS = {"event_name", "event_time", "action_source"}


class EventPayload(BaseModel):
    data: list[dict[str, Any]] = Field(min_length=1, max_length=1000)
    test_event_code: str | None = None
    access_token: str | None = None  # can be in body or query param


class EventResponse(BaseModel):
    events_received: int
    fbtrace_id: str


@app.post("/{pixel_id}/events", response_model=EventResponse)
async def send_events(
    pixel_id: str = Path(description="Pixel ID or Dataset ID"),
    access_token: str = Query(description="Meta access token"),
    payload: EventPayload = ...,
) -> EventResponse:
    _validate_access_token(access_token or payload.access_token)

    errors = []
    for i, event in enumerate(payload.data):
        event_errors = _validate_event(event, index=i)
        errors.extend(event_errors)

    if errors:
        # All-or-nothing: any invalid event rejects the whole batch
        raise HTTPException(
            status_code=400,
            detail={
                "error": {
                    "message": f"({len(errors)} errors) " + "; ".join(errors[:3]),
                    "type": "OAuthException",
                    "code": 100,
                    "fbtrace_id": _trace_id(),
                }
            },
        )

    return EventResponse(
        events_received=len(payload.data),
        fbtrace_id=_trace_id(),
    )


def _validate_access_token(token: str | None) -> None:
    if not token:
        raise HTTPException(
            status_code=401,
            detail={
                "error": {
                    "message": "Invalid OAuth access token.",
                    "type": "OAuthException",
                    "code": 190,
                    "fbtrace_id": _trace_id(),
                }
            },
        )


def _validate_event(event: dict[str, Any], index: int) -> list[str]:
    errors: list[str] = []
    prefix = f"event[{index}]"

    for field in _REQUIRED_EVENT_FIELDS:
        if field not in event:
            errors.append(f"{prefix}: missing required field '{field}'")

    if "event_time" in event:
        try:
            ts = int(event["event_time"])
            now = time.time()
            if ts > now + 60:
                errors.append(f"{prefix}: event_time is in the future")
            if ts < now - 7 * 24 * 3600:
                errors.append(f"{prefix}: event_time is older than 7 days")
        except (TypeError, ValueError):
            errors.append(f"{prefix}: event_time must be a Unix timestamp integer")

    if "action_source" in event and event["action_source"] not in _VALID_ACTION_SOURCES:
        errors.append(
            f"{prefix}: invalid action_source '{event['action_source']}'; "
            f"must be one of {sorted(_VALID_ACTION_SOURCES)}"
        )

    if "user_data" not in event or not event["user_data"]:
        errors.append(f"{prefix}: user_data is required and must not be empty")

    return errors


def _trace_id() -> str:
    return uuid.uuid4().hex[:16].upper()
