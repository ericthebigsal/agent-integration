"""
Human-in-the-loop review step.
Presents each ReviewFlag interactively via CLI and collects decisions.
Progress is saved to disk after each decision so the session is resumable.
"""
from __future__ import annotations

from pathlib import Path

from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.table import Table

from .schemas import ConnectorSpec, ReviewFlag, ReviewStatus
from .spec_proposer import save_draft

console = Console()


def run_review_session(spec: ConnectorSpec, spec_path: Path) -> ConnectorSpec:
    """
    Walk through all pending ReviewFlags interactively.
    Returns the spec with all flags resolved and approved=True if complete.
    """
    flags = spec.pending_flags()
    if not flags:
        console.print("[green]No pending review flags — spec is ready to generate.[/green]")
        spec.approved = True
        save_draft(spec, spec_path)
        return spec

    console.print(f"\n[bold yellow]Human Review Required[/bold yellow]")
    console.print(f"{len(flags)} decision(s) flagged by the agent need your input.\n")

    for i, flag in enumerate(flags, 1):
        _present_flag(flag, i, len(flags))
        decision, notes = _collect_decision(flag)

        flag.human_decision = decision
        flag.human_notes = notes or None
        flag.status = (
            ReviewStatus.APPROVED
            if decision == flag.agent_recommendation
            else ReviewStatus.OVERRIDDEN
        )

        save_draft(spec, spec_path)  # persist after each decision
        console.print(f"[green]Saved.[/green]\n")

    spec.approved = spec.is_review_complete()
    save_draft(spec, spec_path)

    _print_summary(spec)
    return spec


def _present_flag(flag: ReviewFlag, index: int, total: int) -> None:
    body = (
        f"[bold]{flag.decision_point}[/bold]\n\n"
        f"[yellow]Risk:[/yellow] {flag.concern}\n\n"
        f"[cyan]Agent reasoning:[/cyan] {flag.reasoning}"
    )
    if flag.affects:
        body += f"\n\n[dim]Affects: {', '.join(flag.affects)}[/dim]"

    console.print(Panel(body, title=f"[{index}/{total}] {flag.id}", border_style="yellow"))

    table = Table(show_header=False, box=None, padding=(0, 2))
    for i, opt in enumerate(flag.options, 1):
        rec = " [green]← agent recommends[/green]" if opt == flag.agent_recommendation else ""
        table.add_row(f"[bold]{i}.[/bold]", opt + rec)
    console.print(table)


def _collect_decision(flag: ReviewFlag) -> tuple[str, str]:
    while True:
        raw = Prompt.ask("\nYour choice (number or type a value)").strip()
        try:
            idx = int(raw) - 1
            if 0 <= idx < len(flag.options):
                decision = flag.options[idx]
                break
            console.print(f"[red]Enter a number between 1 and {len(flag.options)}.[/red]")
        except ValueError:
            if raw:
                decision = raw
                break
            console.print("[red]Input required.[/red]")

    notes = Prompt.ask("Notes (optional, Enter to skip)", default="").strip()
    return decision, notes


def _print_summary(spec: ConnectorSpec) -> None:
    console.print("\n[bold green]Review complete.[/bold green]")
    table = Table(title="Decision Summary", show_lines=True)
    table.add_column("Flag", style="cyan")
    table.add_column("Decision")
    table.add_column("Status")

    for flag in spec.review_flags:
        status_color = "green" if flag.status == ReviewStatus.APPROVED else "yellow"
        table.add_row(
            flag.id,
            flag.human_decision or "",
            f"[{status_color}]{flag.status.value}[/{status_color}]",
        )
    console.print(table)
