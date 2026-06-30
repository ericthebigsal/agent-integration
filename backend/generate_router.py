"""
FastAPI router for MCP server generation and tool execution.

POST /api/generate    — generate a real Python MCP server for a platform/scenario
POST /api/run-tool    — execute a tool against the real API (demo-key gated)
"""
from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.config import settings
from backend.generate import TOOL_LIBRARY, generate_mcp_server
from backend.tools import run_tool

router = APIRouter(prefix="/api")


class GenerateRequest(BaseModel):
    platform: str
    scenario_index: int


class RunToolRequest(BaseModel):
    platform: str
    tool_name: str
    args: dict = {}
    demo_key: str = ""


@router.post("/generate")
async def generate(req: GenerateRequest):
    """
    Generate a real Python MCP server for the given platform and scenario.
    Pass scenario_index=-1 to generate all tools for the platform combined.
    Returns the generated code string, tool metadata, and generation stats.
    """
    key = f"{req.platform}-all" if req.scenario_index == -1 else f"{req.platform}-{req.scenario_index}"
    if key not in TOOL_LIBRARY:
        raise HTTPException(status_code=400, detail=f"Unknown platform/scenario: {key!r}")

    try:
        code, tools = generate_mcp_server(req.platform, req.scenario_index)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    spec = TOOL_LIBRARY[key]
    enriched_count = sum(1 for t in tools if t["enriched"])

    return {
        "code": code,
        "tools": tools,
        "platform_name": spec["platform_name"],
        "scenario_name": spec["scenario_name"],
        "total_ops": len(tools),
        "enriched_count": enriched_count,
        "filename": f"{req.platform}-{spec['scenario_name'].lower().replace(' ', '-')}-mcp.py",
    }


@router.post("/run-tool")
async def run_tool_endpoint(req: RunToolRequest):
    """
    Execute a named tool against the real platform API.
    Requires a valid demo key (same secret as the live demo endpoints).
    """
    if settings.demo_secret and req.demo_key != settings.demo_secret:
        raise HTTPException(status_code=401, detail="Invalid demo key")

    try:
        result = await run_tool(req.platform, req.tool_name, req.args)
    except KeyError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=exc.response.text,
        )
    except TypeError as exc:
        raise HTTPException(status_code=422, detail=f"Bad arguments: {exc}")

    return result
