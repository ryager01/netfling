"""
NetSentinel Command-Line Interface (CLI).
Unified entry point for Subnet Discovery, Device Inventory, Port Scanning,
Speed Test, Intruder Alert Daemon, and Exporting.
"""

import argparse
import sys
import time
from typing import Optional

from rich.console import Console
from rich.prompt import Prompt, Confirm

from .config import DEFAULT_SCAN_PORTS, DEFAULT_DAEMON_INTERVAL
from .db import DatabaseEngine
from .discovery import SubnetDiscoveryEngine
from .portscan import PortScanEngine
from .speedtest import SpeedTestEngine
from .daemon import IntruderAlertDaemon
from .export import ExportEngine
from .tui import TerminalUI


def run_interactive_tui(db: DatabaseEngine, console: Console, tui: TerminalUI) -> None:
    """Launches interactive terminal menu session."""
    discovery = SubnetDiscoveryEngine(db=db)
    portscanner = PortScanEngine(db=db)
    speedtester = SpeedTestEngine(db=db)
    exporter = ExportEngine(db=db)

    while True:
        console.clear()
        tui.print_banner()

        net_info = discovery.detect_network_environment()
        console.print(
            f"[dim]Gateway: [bold cyan]{net_info['gateway_ip']}[/bold cyan] | "
            f"Subnet: [bold cyan]{net_info['subnet_cidr']}[/bold cyan] | "
            f"Interface: [bold cyan]{net_info['interface']}[/bold cyan] | "
            f"Local IP: [bold cyan]{net_info['local_ip']}[/bold cyan][/dim]\n"
        )

        devices = db.get_all_devices()
        if devices:
            tui.render_devices_table(devices, title="Current Network Inventory")

        console.print("[bold cyan]Commands:[/bold cyan]")
        console.print("  [bold]1[/bold]  Run Subnet Discovery Sweep")
        console.print("  [bold]2[/bold]  Port Scan & Audit Host")
        console.print("  [bold]3[/bold]  Run Speed & Latency Test")
        console.print("  [bold]4[/bold]  View Intruder & Security Alerts")
        console.print("  [bold]5[/bold]  Edit Device Nickname / Trust")
        console.print("  [bold]6[/bold]  Export Inventory (JSON / CSV)")
        console.print("  [bold]7[/bold]  Run Live Intruder Alert Daemon")
        console.print("  [bold]q[/bold]  Quit\n")

        choice = Prompt.ask("Select option", default="1")

        if choice == "1":
            with console.status("[bold cyan]Scanning local subnet...[/bold cyan]", spinner="dots"):
                discovered = discovery.discover()
            console.print(f"[bold green]Discovery complete![/bold green] Found {len(discovered)} active devices.")
            Prompt.ask("\nPress Enter to continue")

        elif choice == "2":
            target_ip = Prompt.ask("Enter target IP to audit", default=net_info["gateway_ip"])
            ports_input = Prompt.ask("Ports to scan (comma-separated or empty for top ports)", default="")
            if ports_input.strip():
                try:
                    ports = [int(p.strip()) for p in ports_input.split(",") if p.strip()]
                except ValueError:
                    ports = DEFAULT_SCAN_PORTS
            else:
                ports = DEFAULT_SCAN_PORTS

            with console.status(f"[bold cyan]Auditing ports on {target_ip}...[/bold cyan]", spinner="dots"):
                findings = portscanner.scan_host(ip=target_ip, ports=ports)

            tui.render_port_scan_table(target_ip, findings)
            Prompt.ask("\nPress Enter to continue")

        elif choice == "3":
            with console.status("[bold cyan]Running network speed and latency test...[/bold cyan]", spinner="bouncingBall"):
                results = speedtester.run()
            tui.render_speed_test_results(results)
            Prompt.ask("\nPress Enter to continue")

        elif choice == "4":
            alerts = db.get_alerts(limit=50)
            tui.render_alerts_table(alerts)
            if alerts and Confirm.ask("Clear all security alerts?", default=False):
                db.clear_all_alerts()
                console.print("[green]Alerts cleared.[/green]")
            Prompt.ask("\nPress Enter to continue")

        elif choice == "5":
            mac = Prompt.ask("Enter MAC address of device")
            dev = db.get_device(mac)
            if not dev:
                console.print(f"[red]Device with MAC {mac} not found in database.[/red]")
            else:
                current_nick = dev.get("nickname", "")
                new_nick = Prompt.ask("Enter new nickname", default=current_nick)
                db.update_nickname(mac, new_nick)
                is_trusted = Confirm.ask("Mark device as trusted?", default=bool(dev.get("is_trusted")))
                db.toggle_trusted(mac, is_trusted)
                console.print(f"[green]Updated device {mac} successfully.[/green]")
            Prompt.ask("\nPress Enter to continue")

        elif choice == "6":
            fmt = Prompt.ask("Export format (json/csv)", choices=["json", "csv"], default="json")
            out_file = Prompt.ask("Output file path", default=f"netsentinel_export.{fmt}")
            if fmt == "json":
                exporter.export_to_json(out_file)
            else:
                exporter.export_to_csv(out_file)
            console.print(f"[green]Inventory exported successfully to [bold]{out_file}[/bold][/green]")
            Prompt.ask("\nPress Enter to continue")

        elif choice == "7":
            console.print("[cyan]Starting Intruder Alert Daemon. Press Ctrl+C to halt monitoring...[/cyan]")
            daemon = IntruderAlertDaemon(
                db=db,
                discovery_engine=discovery,
                interval_seconds=15,
                on_alert_callback=lambda a: console.print(
                    f"\n[bold red][ALERT][/bold red] {a['message']} ({a['timestamp']})"
                ),
            )
            daemon.start()
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                console.print("\n[yellow]Stopping daemon...[/yellow]")
                daemon.stop()
                console.print("[green]Daemon stopped.[/green]")
                time.sleep(1)

        elif choice.lower() in ("q", "quit", "exit"):
            console.print("[bold cyan]Exiting NetSentinel. Stay secure.[/bold cyan]")
            break


def main() -> None:
    """CLI Entry Point."""
    parser = argparse.ArgumentParser(
        prog="netsentinel",
        description="NetSentinel - Local Network Discovery, Inventory & Security Suite exceeding Fing.",
    )
    parser.add_argument("--scan", action="store_true", help="Perform active subnet discovery sweep.")
    parser.add_argument("--subnet", type=str, default=None, help="Custom subnet CIDR override (e.g. 192.168.1.0/24).")
    parser.add_argument("--inventory", action="store_true", help="Print current device inventory table.")
    parser.add_argument("--portscan", type=str, metavar="IP", help="Audit open ports on target IP.")
    parser.add_argument("--ports", type=str, default=None, help="Comma-separated port numbers for portscan.")
    parser.add_argument("--speedtest", action="store_true", help="Run bandwidth speed and latency test.")
    parser.add_argument("--daemon", action="store_true", help="Run background intruder alert monitoring loop.")
    parser.add_argument("--interval", type=int, default=DEFAULT_DAEMON_INTERVAL, help="Daemon sweep interval (seconds).")
    parser.add_argument("--router-audit", action="store_true", help="Perform router vulnerability, UPnP, and DNS security check.")
    parser.add_argument("--cameras", action="store_true", help="Scan local network for hidden cameras and RTSP streams.")
    parser.add_argument("--wol", type=str, metavar="MAC", help="Transmit Wake-on-LAN Magic Packet to target MAC.")
    parser.add_argument("--timeline", action="store_true", help="Display network connection and presence timeline.")
    parser.add_argument("--pause", type=str, metavar="MAC", help="Pause Internet access policy for target MAC.")
    parser.add_argument("--resume", type=str, metavar="MAC", help="Resume Internet access policy for target MAC.")
    parser.add_argument("--export-json", type=str, metavar="FILE", help="Export inventory to JSON file.")
    parser.add_argument("--export-csv", type=str, metavar="FILE", help="Export inventory to CSV file.")
    parser.add_argument("--alerts", action="store_true", help="Display security and intruder alert log.")
    parser.add_argument("--set-nickname", nargs=2, metavar=("MAC", "NICK"), help="Set custom nickname for device.")
    parser.add_argument("--trust", type=str, metavar="MAC", help="Mark MAC as trusted.")
    parser.add_argument("--untrust", type=str, metavar="MAC", help="Mark MAC as untrusted.")
    parser.add_argument("--tui", action="store_true", help="Launch interactive Rich Terminal UI menu.")

    args = parser.parse_args()

    console = Console()
    tui = TerminalUI(console=console)
    db = DatabaseEngine()

    # If no flags provided or --tui, enter interactive menu if stdin is a tty
    if len(sys.argv) == 1 or args.tui:
        if sys.stdin.isatty() or args.tui:
            run_interactive_tui(db=db, console=console, tui=tui)
            return
        else:
            # Default non-interactive action
            args.scan = True

    tui.print_banner()

    if args.set_nickname:
        mac, nick = args.set_nickname
        if db.update_nickname(mac, nick):
            console.print(f"[green]Updated nickname for {mac} to '{nick}'.[/green]")
        else:
            console.print(f"[red]Device {mac} not found.[/red]")

    if args.trust:
        if db.toggle_trusted(args.trust, True):
            console.print(f"[green]Device {args.trust} is now marked TRUSTED.[/green]")
        else:
            console.print(f"[red]Device {args.trust} not found.[/red]")

    if args.untrust:
        if db.toggle_trusted(args.untrust, False):
            console.print(f"[yellow]Device {args.untrust} is now marked UNTRUSTED.[/yellow]")
        else:
            console.print(f"[red]Device {args.untrust} not found.[/red]")

    if args.scan:
        discovery = SubnetDiscoveryEngine(db=db)
        with console.status("[bold cyan]Sweeping subnet for active hosts...[/bold cyan]", spinner="dots"):
            devices = discovery.discover(subnet_override=args.subnet)
        tui.render_devices_table(devices, title=f"Discovered Subnet Devices ({discovery.subnet_cidr})")

    elif args.inventory:
        devices = db.get_all_devices()
        tui.render_devices_table(devices, title="Stored Network Inventory")

    if args.portscan:
        target_ip = args.portscan
        if args.ports:
            ports = [int(p.strip()) for p in args.ports.split(",") if p.strip()]
        else:
            ports = DEFAULT_SCAN_PORTS
        portscanner = PortScanEngine(db=db)
        with console.status(f"[bold cyan]Auditing ports on {target_ip}...[/bold cyan]", spinner="dots"):
            findings = portscanner.scan_host(ip=target_ip, ports=ports)
        tui.render_port_scan_table(target_ip, findings)

    if args.speedtest:
        speedtester = SpeedTestEngine(db=db)
        with console.status("[bold cyan]Measuring network speed & latency...[/bold cyan]", spinner="bouncingBall"):
            res = speedtester.run()
        tui.render_speed_test_results(res)

    if args.alerts:
        alerts = db.get_alerts(limit=50)
        tui.render_alerts_table(alerts)

    if args.router_audit:
        from .vulnerability import RouterVulnerabilityEngine
        discovery = SubnetDiscoveryEngine(db=db)
        gw = discovery.detect_network_environment()["gateway_ip"]
        router_engine = RouterVulnerabilityEngine(db=db, gateway_ip=gw)
        with console.status("[bold cyan]Auditing router security, UPnP, and DNS integrity...[/bold cyan]", spinner="dots"):
            audit_res = router_engine.run_full_vulnerability_audit()
        score_info = audit_res["security_score"]
        console.print(f"\n[bold cyan]Router Security Health:[/bold cyan] Grade [bold green]{score_info['grade']}[/bold green] (Score: {score_info['score']}/100 - {score_info['health']})")
        console.print(f"  Gateway: [bold]{audit_res['gateway_ip']}[/bold]")
        console.print(f"  DNS Status: [bold]{audit_res['dns_audit']['status']}[/bold]")
        console.print(f"  UPnP Exposure: [bold]{'Vulnerable (Ports open)' if audit_res['upnp_audit']['upnp_exposed'] else 'Protected / Filtered'}[/bold]")
        if score_info["deductions"]:
            console.print("  [yellow]Risk Factors Detected:[/yellow]")
            for d in score_info["deductions"]:
                console.print(f"    • {d}")
        console.print("")

    if args.cameras:
        from .surveillance import SurveillanceDetector
        detector = SurveillanceDetector(db=db)
        with console.status("[bold cyan]Scanning for hidden cameras & surveillance streams...[/bold cyan]", spinner="dots"):
            cams = detector.scan_network_for_cameras()
        if cams:
            console.print(f"\n[bold red]Surveillance Devices Found:[/bold red] {len(cams)} camera(s) detected!")
            for c in cams:
                console.print(f"  • [bold]{c['ip']}[/bold] ({c['vendor']}) - Confidence: {c['confidence']}")
                for ind in c['indicators']:
                    console.print(f"      - {ind}")
        else:
            console.print("\n[bold green]No hidden surveillance cameras or RTSP video streams detected on LAN.[/bold green]\n")

    if args.wol:
        from .wol import WakeOnLanEngine
        wol = WakeOnLanEngine()
        res = wol.wake(args.wol)
        if res["success"]:
            console.print(f"[bold green]Wake-on-LAN Magic Packet sent to {args.wol}[/bold green]")
        else:
            console.print(f"[bold red]WoL Failed:[/bold red] {res.get('error')}")

    if args.timeline:
        from .timeline import PresenceTimelineEngine
        tl = PresenceTimelineEngine(db=db)
        events = tl.get_recent_timeline(limit=30)
        if events:
            console.print("\n[bold cyan]Network Presence & Connection Timeline:[/bold cyan]")
            for e in events:
                console.print(f"  [{e['timestamp'][:19]}] [bold]{e['event_type']}[/bold] - {e['mac']} ({e.get('hostname') or e.get('vendor') or 'Device'}) {e.get('details', '')}")
        else:
            console.print("\n[dim]No presence transition events logged yet.[/dim]\n")

    if args.pause:
        from .timeline import PresenceTimelineEngine
        tl = PresenceTimelineEngine(db=db)
        res = tl.set_pause_internet(args.pause, pause=True)
        console.print(f"[bold yellow]Internet Access PAUSED for device {args.pause}[/bold yellow]")

    if args.resume:
        from .timeline import PresenceTimelineEngine
        tl = PresenceTimelineEngine(db=db)
        res = tl.set_pause_internet(args.resume, pause=False)
        console.print(f"[bold green]Internet Access RESUMED for device {args.resume}[/bold green]")

    if args.export_json:
        exporter = ExportEngine(db=db)
        exporter.export_to_json(args.export_json)
        console.print(f"[green]Exported JSON inventory to {args.export_json}[/green]")

    if args.export_csv:
        exporter = ExportEngine(db=db)
        exporter.export_to_csv(args.export_csv)
        console.print(f"[green]Exported CSV inventory to {args.export_csv}[/green]")

    if args.daemon:
        console.print(f"[cyan]Starting Intruder Alert Daemon (interval: {args.interval}s). Press Ctrl+C to stop...[/cyan]")
        discovery = SubnetDiscoveryEngine(db=db)
        daemon = IntruderAlertDaemon(
            db=db,
            discovery_engine=discovery,
            interval_seconds=args.interval,
            on_alert_callback=lambda a: console.print(
                f"[bold red][ALERT][/bold red] {a['message']} ({a['timestamp']})"
            ),
        )
        daemon.start()
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            console.print("\n[yellow]Halting monitoring daemon...[/yellow]")
            daemon.stop()
            console.print("[green]Daemon stopped.[/green]")


if __name__ == "__main__":
    main()
