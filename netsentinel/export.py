"""
NetSentinel Data Export Engine.
Exports network device inventories, port audits, and alerts to JSON or CSV formats.
"""

import csv
import io
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from .db import DatabaseEngine


class ExportEngine:
    """Exports inventory data to structured JSON and CSV formats."""

    def __init__(self, db: DatabaseEngine):
        self.db = db

    def get_full_inventory_data(self) -> Dict[str, Any]:
        """Gathers enriched inventory data including open ports and alerts."""
        devices = self.db.get_all_devices()
        port_scans = self.db.get_port_scans()
        alerts = self.db.get_alerts(limit=100)
        latest_speedtest = self.db.get_latest_speed_test()

        # Map ports by IP
        ports_by_ip: Dict[str, List[Dict[str, Any]]] = {}
        for p in port_scans:
            ip = p["ip"]
            if ip not in ports_by_ip:
                ports_by_ip[ip] = []
            ports_by_ip[ip].append({
                "port": p["port"],
                "service": p.get("service_name", ""),
                "banner": p.get("banner", ""),
                "risk": p.get("risk", "Low"),
                "scanned_at": p.get("scanned_at", ""),
            })

        enriched_devices = []
        for d in devices:
            d_copy = dict(d)
            d_copy["open_ports"] = ports_by_ip.get(d["ip"], [])
            enriched_devices.append(d_copy)

        return {
            "metadata": {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "tool": "NetSentinel Network Suite",
                "device_count": len(devices),
                "online_count": sum(1 for d in devices if d.get("status") == "online"),
                "trusted_count": sum(1 for d in devices if d.get("is_trusted") == 1),
                "alert_count": len(alerts),
            },
            "latest_speed_test": latest_speedtest,
            "devices": enriched_devices,
            "alerts": alerts,
        }

    def export_to_json(self, filepath: Optional[str] = None, indent: int = 2) -> str:
        """Serializes inventory to JSON string and writes to file if path provided."""
        data = self.get_full_inventory_data()
        json_str = json.dumps(data, indent=indent, default=str)

        if filepath:
            Path(filepath).parent.mkdir(parents=True, exist_ok=True)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(json_str)

        return json_str

    def export_to_csv(self, filepath: Optional[str] = None) -> str:
        """Serializes inventory to CSV string with RFC 4180 escaping and writes to file if path provided."""
        data = self.get_full_inventory_data()
        output = io.StringIO()
        fieldnames = [
            "IP Address",
            "MAC Address",
            "Hostname",
            "Hardware Vendor",
            "Device Type",
            "Custom Nickname",
            "Status",
            "Trusted",
            "Known",
            "First Seen",
            "Last Seen",
            "Latency (ms)",
            "Open Ports Count",
            "Open Ports List",
        ]

        writer = csv.DictWriter(output, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()

        for d in data["devices"]:
            ports_list = [f"{p['port']}/{p['service']}" for p in d.get("open_ports", [])]
            writer.writerow({
                "IP Address": d.get("ip", ""),
                "MAC Address": d.get("mac", ""),
                "Hostname": d.get("hostname", ""),
                "Hardware Vendor": d.get("vendor", ""),
                "Device Type": d.get("device_type", ""),
                "Custom Nickname": d.get("nickname", ""),
                "Status": d.get("status", "online"),
                "Trusted": "Yes" if d.get("is_trusted") == 1 else "No",
                "Known": "Yes" if d.get("is_known") == 1 else "No",
                "First Seen": d.get("first_seen", ""),
                "Last Seen": d.get("last_seen", ""),
                "Latency (ms)": f"{d.get('latency_ms', 0.0):.2f}",
                "Open Ports Count": len(ports_list),
                "Open Ports List": "; ".join(ports_list) if ports_list else "None",
            })

        csv_str = output.getvalue()
        if filepath:
            Path(filepath).parent.mkdir(parents=True, exist_ok=True)
            with open(filepath, "w", encoding="utf-8", newline="") as f:
                f.write(csv_str)

        return csv_str
