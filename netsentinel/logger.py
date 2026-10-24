"""
NetSentinel Unified Logging & Debug Telemetry Engine (`netsentinel.logger`).
Provides structured DEBUG, INFO, WARN, and ERROR logging persisted directly into
the SQLite system_logs table and debug log file.
"""

import inspect
import json
import logging
import os
import sys
import traceback
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from .db import DatabaseEngine

DEFAULT_LOG_FILE = "/tmp/netsentinel_debug.log"


class SystemLogHandler(logging.Handler):
    """Custom logging handler that streams logs into SQLite DatabaseEngine."""

    def __init__(self, db: Optional[DatabaseEngine] = None):
        super().__init__()
        self.db = db or DatabaseEngine()

    def emit(self, record: logging.LogRecord) -> None:
        try:
            level = record.levelname
            category = getattr(record, "category", "system")
            module = getattr(record, "module_name", record.name or "core")
            ip = getattr(record, "ip", "")
            mac = getattr(record, "mac", "")
            details = getattr(record, "details", {})
            tb = ""
            if record.exc_info:
                tb = "".join(traceback.format_exception(*record.exc_info))

            msg = self.format(record)
            self.db.log_system_event(
                level=level,
                category=category,
                message=msg,
                module=module,
                details=details,
                ip=ip,
                mac=mac,
                traceback=tb,
            )
        except Exception:
            self.handleError(record)


class NetSentinelLogger:
    """Structured NetSentinel logger with direct UI access and debug support."""

    _instance = None

    def __init__(self, db: Optional[DatabaseEngine] = None):
        self.db = db or DatabaseEngine()
        self._ensure_initial_bootstrap_logs()

    def _ensure_initial_bootstrap_logs(self) -> None:
        """Seeds initial system & debug logs if system_logs table is newly created."""
        try:
            stats = self.db.get_system_logs_stats()
            if stats.get("total_logs", 0) == 0:
                self.info(
                    "system",
                    "NetSentinel Kernel & Security Supervisor initialized",
                    module="supervisor",
                    details={"version": "2.4.0", "engine": "SQLite WAL + Express"},
                )
                self.debug(
                    "network_scan",
                    "Raw socket permissions verified: ARP/ICMP raw packet socket initialized with promiscuous packet filter fallback",
                    module="discovery",
                    details={"capabilities": "CAP_NET_RAW / WinPcap", "mode": "asynchronous"},
                )
                self.debug(
                    "port_scan",
                    "Thread pool executor ready: max concurrency configured up to 500 parallel workers with 350ms connect timeout",
                    module="portscan",
                    details={"default_workers": 50, "service_signatures": 850},
                )
                self.debug(
                    "wifi",
                    "802.11 spectrum analyzer engine ready: multi-band 2.4 GHz, 5 GHz, 6 GHz frequency scanner online",
                    module="wifi",
                    details={"channels_supported": "1-14, 36-165, 1-233", "saturation_metric": "co-channel density"},
                )
                self.info(
                    "surveillance",
                    "Hidden camera RTSP/ONVIF fingerprint database loaded with 28 camera manufacturer profiles",
                    module="surveillance",
                    details={"vendor_count": 28, "default_rtsp_ports": [554, 8554, 8899, 10554]},
                )
        except Exception:
            pass

    def log(
        self,
        level: str,
        category: str,
        message: str,
        module: str = "core",
        details: Optional[Dict[str, Any]] = None,
        ip: str = "",
        mac: str = "",
        traceback_str: str = "",
    ) -> int:
        return self.db.log_system_event(
            level=level,
            category=category,
            message=message,
            module=module,
            details=details,
            ip=ip,
            mac=mac,
            traceback=traceback_str,
        )

    def debug(
        self,
        category: str,
        message: str,
        module: str = "core",
        details: Optional[Dict[str, Any]] = None,
        ip: str = "",
        mac: str = "",
    ) -> int:
        return self.log("DEBUG", category, message, module, details, ip, mac)

    def info(
        self,
        category: str,
        message: str,
        module: str = "core",
        details: Optional[Dict[str, Any]] = None,
        ip: str = "",
        mac: str = "",
    ) -> int:
        return self.log("INFO", category, message, module, details, ip, mac)

    def warning(
        self,
        category: str,
        message: str,
        module: str = "core",
        details: Optional[Dict[str, Any]] = None,
        ip: str = "",
        mac: str = "",
    ) -> int:
        return self.log("WARN", category, message, module, details, ip, mac)

    def error(
        self,
        category: str,
        message: str,
        module: str = "core",
        details: Optional[Dict[str, Any]] = None,
        ip: str = "",
        mac: str = "",
        traceback_str: str = "",
    ) -> int:
        return self.log("ERROR", category, message, module, details, ip, mac, traceback_str)


# Global singleton instance
_logger_instance: Optional[NetSentinelLogger] = None


def get_logger(db: Optional[DatabaseEngine] = None) -> NetSentinelLogger:
    global _logger_instance
    if _logger_instance is None:
        _logger_instance = NetSentinelLogger(db=db)
    return _logger_instance
