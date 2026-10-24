"""
NetSentinel Intruder & New Device Alert Daemon.
Runs a background monitoring loop to detect unknown MAC addresses,
rogue devices, and ARP spoofing anomalies.
"""

import threading
import time
from typing import Callable, List, Optional, Set

from .config import DEFAULT_DAEMON_INTERVAL
from .db import DatabaseEngine
from .discovery import SubnetDiscoveryEngine


class IntruderAlertDaemon:
    """Monitors local subnet for unknown devices and ARP anomalies."""

    def __init__(
        self,
        db: DatabaseEngine,
        discovery_engine: Optional[SubnetDiscoveryEngine] = None,
        interval_seconds: int = DEFAULT_DAEMON_INTERVAL,
        on_alert_callback: Optional[Callable[[dict], None]] = None,
    ):
        self.db = db
        self.discovery_engine = discovery_engine or SubnetDiscoveryEngine(db=self.db)
        self.interval_seconds = interval_seconds
        self.on_alert_callback = on_alert_callback

        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._last_gateway_mac: Optional[str] = None
        self._known_macs: Set[str] = set()

    def _sync_known_macs(self) -> None:
        """Loads known and trusted MAC addresses from database."""
        devices = self.db.get_all_devices()
        for d in devices:
            if d.get("is_known") or d.get("is_trusted"):
                self._known_macs.add(d["mac"].upper())

    def _monitor_loop(self) -> None:
        """Periodic background scanner loop."""
        self._sync_known_macs()

        while not self._stop_event.is_set():
            try:
                discovered = self.discovery_engine.discover()
                current_time = time.strftime("%Y-%m-%d %H:%M:%S")

                for dev in discovered:
                    mac = dev["mac"].upper()
                    ip = dev["ip"]
                    vendor = dev.get("vendor", "Unknown")

                    # 1. Check for Unknown / Intruder Device
                    if mac not in self._known_macs and not dev.get("is_trusted"):
                        alert_msg = f"Intruder Alert: Unknown device detected at {ip} [{mac}] ({vendor})"
                        alert_id = self.db.log_alert(
                            alert_type="NEW_DEVICE",
                            message=alert_msg,
                            mac=mac,
                            ip=ip,
                            severity="WARNING",
                        )
                        alert_payload = {
                            "id": alert_id,
                            "type": "NEW_DEVICE",
                            "message": alert_msg,
                            "mac": mac,
                            "ip": ip,
                            "vendor": vendor,
                            "timestamp": current_time,
                        }
                        if self.on_alert_callback:
                            try:
                                self.on_alert_callback(alert_payload)
                            except Exception:
                                pass

                    # 2. Check for ARP Spoofing / Gateway MAC changes
                    if ip == self.discovery_engine.gateway_ip:
                        if self._last_gateway_mac and self._last_gateway_mac != mac:
                            spoof_msg = (
                                f"CRITICAL SECURITY: Gateway {ip} MAC address altered from "
                                f"{self._last_gateway_mac} to {mac}! Possible ARP Poisoning Attack."
                            )
                            self.db.log_alert(
                                alert_type="GATEWAY_ARP_MISMATCH",
                                message=spoof_msg,
                                mac=mac,
                                ip=ip,
                                severity="CRITICAL",
                            )
                        self._last_gateway_mac = mac

            except Exception:
                pass

            # Sleep in 1-second increments so stop_event is responsive
            for _ in range(self.interval_seconds):
                if self._stop_event.is_set():
                    break
                time.sleep(1)

    def start(self) -> None:
        """Starts the background monitor thread."""
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._monitor_loop, name="NetSentinel-Daemon", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        """Gracefully halts the background monitor."""
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=3.0)
            self._thread = None

    def is_running(self) -> bool:
        """Checks if daemon thread is active."""
        return bool(self._thread and self._thread.is_alive())
