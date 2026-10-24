"""
NetSentinel Rich Terminal User Interface (TUI).
Renders color-coded tables, status panels, real-time live displays,
and interactive menus using the `rich` library.
"""

import sys
import time
from typing import Any, Dict, List, Optional

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.prompt import Prompt, Confirm
from rich.layout import Layout
from rich import box

from .config import KNOWN_SERVICES
from .db import DatabaseEngine
from .discovery import SubnetDiscoveryEngine
from .portscan import PortScanEngine
from .speedtest import SpeedTestEngine
from .daemon import IntruderAlertDaemon
from .export import ExportEngine


class TerminalUI:
    """Rich console interface for NetSentinel."""

    def __init__(self, console: Optional[Console] = None):
        self.console = console or Console()

    def print_banner(self) -> None:
        """Renders the NetSentinel header banner."""
        banner_text = Text()
        banner_text.append("NET", style="bold cyan")
        banner_text.append("SENTINEL", style="bold white")
        banner_text.append(" // ", style="dim")
        banner_text.append("Local Network Discovery, Inventory & Security Suite\n", style="italic")
        banner_text.append("Engineered to match and exceed Fing core capabilities | Defense-Grade Architecture", style="dim text-slate-400")

        self.console.print(Panel(
            banner_text,
            box=box.ROUNDED,
            border_style="cyan",
            padding=(1, 2),
        ))

    def render_devices_table(self, devices: List[Dict[str, Any]], title: str = "Discovered Network Inventory") -> None:
        """Renders a color-coded table of devices."""
        table = Table(
            title=title,
            box=box.HEAVY_EDGE,
            header_style="bold cyan",
            row_styles=["none", "dim"],
            show_lines=False,
        )

        table.add_column("Status", justify="center", width=10)
        table.add_column("IP Address", style="bold white", width=16)
        table.add_column("MAC Address", style="magenta", width=18)
        table.add_column("Hostname", style="yellow", width=22)
        table.add_column("Hardware Vendor", style="cyan", width=24)
        table.add_column("Device Type", style="blue", width=18)
        table.add_column("Nickname", style="green", width=16)
        table.add_column("Trusted", justify="center", width=8)
        table.add_column("Latency", justify="right", width=10)

        for d in devices:
            is_online = d.get("status") == "online"
            status_badge = "[bold green]ONLINE[/bold green]" if is_online else "[dim red]OFFLINE[/dim red]"

            latency = d.get("latency_ms", 0.0)
            if latency < 10.0:
                lat_str = f"[cyan]{latency:.1f} ms[/cyan]"
            elif latency < 50.0:
                lat_str = f"[yellow]{latency:.1f} ms[/yellow]"
            else:
                lat_str = f"[red]{latency:.1f} ms[/red]"

            is_trusted = d.get("is_trusted", 0) == 1
            trusted_str = "[bold green]YES[/bold green]" if is_trusted else "[dim]No[/dim]"

            nickname = d.get("nickname") or "-"
            hostname = d.get("hostname") or "Unknown"
            vendor = d.get("vendor") or "Generic"
            dev_type = d.get("device_type") or "General"

            table.add_row(
                status_badge,
                d.get("ip", ""),
                d.get("mac", ""),
                hostname[:22],
                vendor[:24],
                dev_type[:18],
                nickname[:16],
                trusted_str,
                lat_str,
            )

        self.console.print(table)
        self.console.print(
            f" [dim]Total Tracked Devices: [bold cyan]{len(devices)}[/bold cyan] | "
            f"Active: [bold green]{sum(1 for d in devices if d.get('status') == 'online')}[/bold green] | "
            f"Trusted: [bold green]{sum(1 for d in devices if d.get('is_trusted') == 1)}[/bold green][/dim]\n"
        )

    def render_port_scan_table(self, ip: str, findings: List[Dict[str, Any]]) -> None:
        """Renders open port audit results for an IP."""
        if not findings:
            self.console.print(Panel(
                f"[yellow]No open top ports detected on host [bold]{ip}[/bold].[/yellow]\n"
                "[dim]Host may have a local firewall active or drop unsolicited TCP SYN packets.[/dim]",
                title=f"Port Audit: {ip}",
                border_style="yellow",
            ))
            return

        table = Table(
            title=f"Port & Service Security Audit: {ip}",
            box=box.ROUNDED,
            header_style="bold cyan",
        )

        table.add_column("Port", justify="right", style="bold white", width=8)
        table.add_column("Service", style="yellow", width=14)
        table.add_column("Description", style="white", width=28)
        table.add_column("Risk Level", justify="center", width=12)
        table.add_column("Banner / Server Header", style="cyan", width=36)

        for f in findings:
            risk = f.get("risk", "Low")
            if risk == "High":
                risk_styled = "[bold red]HIGH[/bold red]"
            elif risk == "Medium":
                risk_styled = "[bold yellow]MEDIUM[/bold yellow]"
            else:
                risk_styled = "[bold green]LOW[/bold green]"

            banner = f.get("banner", "") or "[dim]No banner response[/dim]"

            table.add_row(
                str(f.get("port")),
                f.get("service_name", ""),
                f.get("description", ""),
                risk_styled,
                banner[:36],
            )

        self.console.print(table)

    def render_speed_test_results(self, metrics: Dict[str, Any]) -> None:
        """Renders network performance metrics panel."""
        grid = Table.grid(expand=True)
        grid.add_column(ratio=1)
        grid.add_column(ratio=1)

        dl = metrics.get("download_mbps", 0.0)
        ul = metrics.get("upload_mbps", 0.0)
        ping = metrics.get("ping_ms", 0.0)
        server = metrics.get("server_name", "Unknown")
        isp = metrics.get("isp", "Unknown")

        summary_text = (
            f"[bold cyan]Download Speed:[/bold cyan] [bold green]{dl:.2f} Mbps[/bold green]\n"
            f"[bold cyan]Upload Speed:[/bold cyan]   [bold green]{ul:.2f} Mbps[/bold green]\n"
            f"[bold cyan]Round-Trip Ping:[/bold cyan] [bold yellow]{ping:.2f} ms[/bold yellow]\n\n"
            f"[dim]Endpoint Server: {server}[/dim]\n"
            f"[dim]Service Provider: {isp}[/dim]"
        )

        self.console.print(Panel(
            summary_text,
            title="[bold cyan]Network Bandwidth & Latency Benchmark[/bold cyan]",
            box=box.ROUNDED,
            border_style="green",
            padding=(1, 2),
        ))

    def render_alerts_table(self, alerts: List[Dict[str, Any]]) -> None:
        """Renders security and intruder alerts."""
        if not alerts:
            self.console.print(Panel(
                "[bold green]No security alerts or intruders detected.[/bold green]\n"
                "[dim]All detected network devices are verified or marked trusted.[/dim]",
                title="Security Status",
                border_style="green",
            ))
            return

        table = Table(
            title="Intruder & Security Event Log",
            box=box.ROUNDED,
            header_style="bold red",
        )

        table.add_column("Time (UTC)", style="dim", width=22)
        table.add_column("Severity", justify="center", width=10)
        table.add_column("Alert Type", style="yellow", width=18)
        table.add_column("Target IP", style="white", width=16)
        table.add_column("MAC Address", style="magenta", width=18)
        table.add_column("Message", style="bold white")

        for a in alerts:
            sev = a.get("severity", "WARNING")
            sev_badge = "[bold red]CRITICAL[/bold red]" if sev == "CRITICAL" else "[bold yellow]WARNING[/bold yellow]"
            table.add_row(
                a.get("timestamp", "")[:19],
                sev_badge,
                a.get("alert_type", ""),
                a.get("ip", ""),
                a.get("mac", ""),
                a.get("message", ""),
            )

        self.console.print(table)
