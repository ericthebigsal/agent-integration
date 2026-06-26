"""
connector-agent CLI

Usage:
  connector-agent propose --docs docs/capi_docs.md --api-name "Meta CAPI"
  connector-agent review  --spec review/spec_draft.json
  connector-agent generate --spec review/spec_draft.json
  connector-agent run-mock
"""
from __future__ import annotations

import time
from pathlib import Path
from typing import Optional

import typer
from dotenv import load_dotenv
from rich.console import Console

load_dotenv()

app = typer.Typer(
    name="connector-agent",
    help="Agent that reads API docs and generates a working connector with human-in-the-loop review.",
    add_completion=False,
)
console = Console()

_DEFAULT_SPEC_PATH = Path("review/spec_draft.json")
_DEFAULT_OUTPUT_DIR = Path("generated_connector")


@app.command()
def propose(
    docs: Path = typer.Option(..., help="Path to local docs file (Markdown or text)"),
    api_name: str = typer.Option(..., help="Human-readable API name, e.g. 'Meta CAPI'"),
    docs_url: Optional[str] = typer.Option(None, help="Remote docs URL to fetch instead of --docs"),
    spec_out: Path = typer.Option(_DEFAULT_SPEC_PATH, help="Where to write the draft spec JSON"),
    model: Optional[str] = typer.Option(None, help="Claude model to use (overrides env var)"),
) -> None:
    """Step 1: Read API docs and propose a ConnectorSpec with review flags."""
    from agent.doc_ingestion import fetch_docs_page, load_docs_file
    from agent.spec_proposer import propose_spec, save_draft

    console.print(f"[bold]Loading docs...[/bold]")
    t0 = time.time()
    if docs_url:
        docs_text = fetch_docs_page(docs_url)
    else:
        if not docs.exists():
            console.print(f"[red]File not found: {docs}[/red]")
            raise typer.Exit(1)
        docs_text = load_docs_file(docs)

    console.print(f"[bold]Proposing spec (this calls Claude)...[/bold]")
    kwargs: dict = {}
    if model:
        kwargs["model"] = model

    spec = propose_spec(docs_text, api_name=api_name, **kwargs)
    elapsed = time.time() - t0

    save_draft(spec, spec_out)

    n_flags = len(spec.review_flags)
    flag_word = "flag" if n_flags == 1 else "flags"
    console.print(
        f"\n[green]Spec proposed in {elapsed:.1f}s.[/green] "
        f"{n_flags} review {flag_word} need your input.\n"
        f"Draft saved to [bold]{spec_out}[/bold]\n"
        f"Next: [cyan]connector-agent review --spec {spec_out}[/cyan]"
    )


@app.command()
def review(
    spec: Path = typer.Option(_DEFAULT_SPEC_PATH, help="Path to the draft spec JSON"),
) -> None:
    """Step 2: Walk through review flags interactively and record your decisions."""
    from agent.reviewer import run_review_session
    from agent.spec_proposer import load_draft

    if not spec.exists():
        console.print(f"[red]Spec not found: {spec}. Run 'propose' first.[/red]")
        raise typer.Exit(1)

    loaded = load_draft(spec)
    run_review_session(loaded, spec)


@app.command()
def generate(
    spec: Path = typer.Option(_DEFAULT_SPEC_PATH, help="Path to the reviewed spec JSON"),
    output: Path = typer.Option(_DEFAULT_OUTPUT_DIR, help="Output directory for generated code"),
) -> None:
    """Step 3: Generate a working Python connector from the approved spec."""
    from agent.code_generator import generate_connector
    from agent.spec_proposer import load_draft

    if not spec.exists():
        console.print(f"[red]Spec not found: {spec}. Run 'propose' then 'review' first.[/red]")
        raise typer.Exit(1)

    loaded = load_draft(spec)

    if not loaded.approved:
        pending = [f.id for f in loaded.pending_flags()]
        console.print(f"[red]{len(pending)} flag(s) still pending: {pending}[/red]")
        console.print("Run [cyan]connector-agent review[/cyan] to complete the review first.")
        raise typer.Exit(1)

    t0 = time.time()
    out_path = generate_connector(loaded, output)
    elapsed = time.time() - t0

    console.print(
        f"\n[green]Connector generated in {elapsed:.1f}s.[/green]\n"
        f"Output: [bold]{out_path}[/bold]\n"
        f"Next: start the mock API and test end-to-end:\n"
        f"  [cyan]connector-agent run-mock[/cyan]"
    )


@app.command(name="run-mock")
def run_mock(
    host: str = typer.Option("127.0.0.1", help="Host to bind"),
    port: int = typer.Option(8001, help="Port to listen on"),
) -> None:
    """Start the FastAPI mock of the target API for end-to-end testing."""
    import uvicorn
    console.print(f"[bold]Starting CAPI mock at http://{host}:{port}[/bold]")
    console.print("Press Ctrl+C to stop.\n")
    uvicorn.run("mock_api.capi_mock:app", host=host, port=port, reload=False)


if __name__ == "__main__":
    app()
