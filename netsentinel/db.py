"""
NetSentinel SQLite Database Engine (`netsentinel.db`).
Persistent storage for network inventory, port audits, speed tests, and intruder alerts.
"""

import json
import os
import shutil
import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from .config import DEFAULT_DB_PATH


class DatabaseEngine:
    """Thread-safe SQLite database manager for NetSentinel."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or DEFAULT_DB_PATH
        self._local = threading.local()
        # Ensure directory exists
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        self.init_db()

    def _get_connection(self) -> sqlite3.Connection:
        """Returns a thread-local SQLite connection with Row factory."""
        if not hasattr(self._local, "conn") or self._local.conn is None:
            conn = sqlite3.connect(self.db_path, timeout=10.0, check_same_thread=False)
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA journal_mode=WAL;")
            self._local.conn = conn
        return self._local.conn

    def init_db(self) -> None:
        """Initializes database tables and indexes."""
        conn = self._get_connection()
        with conn:
            conn.executescript("""
            CREATE TABLE IF NOT EXISTS devices (
                mac TEXT PRIMARY KEY,
                ip TEXT NOT NULL,
                hostname TEXT DEFAULT 'Unknown',
                vendor TEXT DEFAULT 'Generic / Unknown',
                device_type TEXT DEFAULT 'General Device',
                nickname TEXT DEFAULT '',
                is_known INTEGER DEFAULT 0,
                is_trusted INTEGER DEFAULT 0,
                is_quarantined INTEGER DEFAULT 0,
                quarantine_reason TEXT DEFAULT '',
                quarantined_at TEXT DEFAULT '',
                custom_metadata TEXT DEFAULT '{}',
                first_seen TEXT NOT NULL,
                last_seen TEXT NOT NULL,
                latency_ms REAL DEFAULT 0.0,
                status TEXT DEFAULT 'online'
            );

            CREATE TABLE IF NOT EXISTS port_scans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mac TEXT,
                ip TEXT NOT NULL,
                port INTEGER NOT NULL,
                service_name TEXT DEFAULT '',
                banner TEXT DEFAULT '',
                risk TEXT DEFAULT 'Low',
                scanned_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS speed_tests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                ping_ms REAL NOT NULL,
                download_mbps REAL NOT NULL,
                upload_mbps REAL NOT NULL,
                server_name TEXT DEFAULT 'Local / Fast Benchmark',
                server_country TEXT DEFAULT '',
                client_ip TEXT DEFAULT '',
                isp TEXT DEFAULT ''
            );

            CREATE TABLE IF NOT EXISTS security_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                alert_type TEXT NOT NULL,
                mac TEXT DEFAULT '',
                ip TEXT DEFAULT '',
                message TEXT NOT NULL,
                severity TEXT DEFAULT 'WARNING',
                resolved INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS system_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                level TEXT NOT NULL,
                category TEXT NOT NULL,
                module TEXT DEFAULT 'core',
                message TEXT NOT NULL,
                details TEXT DEFAULT '{}',
                ip TEXT DEFAULT '',
                mac TEXT DEFAULT '',
                traceback TEXT DEFAULT ''
            );

            CREATE INDEX IF NOT EXISTS idx_devices_ip ON devices(ip);
            CREATE INDEX IF NOT EXISTS idx_port_scans_ip ON port_scans(ip);
            CREATE INDEX IF NOT EXISTS idx_port_scans_mac ON port_scans(mac);
            CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON security_alerts(timestamp);
            CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp);
            CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
            CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category);
            """)

            # Safe database migration for existing netsentinel.db instances
            for col_name, col_sql in [
                ("custom_metadata", "TEXT DEFAULT '{}'"),
                ("is_quarantined", "INTEGER DEFAULT 0"),
                ("quarantine_reason", "TEXT DEFAULT ''"),
                ("quarantined_at", "TEXT DEFAULT ''"),
                ("ipv6", "TEXT DEFAULT ''"),
            ]:
                try:
                    conn.execute(f"ALTER TABLE devices ADD COLUMN {col_name} {col_sql};")
                except sqlite3.OperationalError:
                    pass

    def upsert_device(
        self,
        mac: str,
        ip: str,
        hostname: Optional[str] = None,
        vendor: Optional[str] = None,
        device_type: Optional[str] = None,
        latency_ms: float = 0.0,
        ipv6: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Inserts or updates a device record.
        Returns a dict indicating {'is_new': bool, 'device': dict}.
        """
        mac = mac.strip().upper()
        now_iso = datetime.now(timezone.utc).isoformat()
        conn = self._get_connection()

        with conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM devices WHERE mac = ?", (mac,))
            existing = cursor.fetchone()

            is_new = False
            if existing is None:
                is_new = True
                cursor.execute("""
                    INSERT INTO devices (
                        mac, ip, ipv6, hostname, vendor, device_type, nickname,
                        is_known, is_trusted, first_seen, last_seen, latency_ms, status
                    ) VALUES (?, ?, ?, ?, ?, ?, '', 0, 0, ?, ?, ?, 'online')
                """, (
                    mac,
                    ip,
                    ipv6 or "",
                    hostname or "Unknown",
                    vendor or "Generic / Unknown",
                    device_type or "General Device",
                    now_iso,
                    now_iso,
                    latency_ms,
                ))
            else:
                up_hostname = hostname if hostname and hostname != "Unknown" else existing["hostname"]
                up_vendor = vendor if vendor and vendor != "Generic / Unknown" else existing["vendor"]
                up_device_type = device_type if device_type and device_type != "General Device" else existing["device_type"]
                up_ipv6 = ipv6 if ipv6 else (existing["ipv6"] if "ipv6" in existing.keys() else "")

                cursor.execute("""
                    UPDATE devices SET
                        ip = ?,
                        ipv6 = ?,
                        hostname = ?,
                        vendor = ?,
                        device_type = ?,
                        last_seen = ?,
                        latency_ms = ?,
                        status = 'online'
                    WHERE mac = ?
                """, (
                    ip,
                    up_ipv6,
                    up_hostname,
                    up_vendor,
                    up_device_type,
                    now_iso,
                    latency_ms,
                    mac,
                ))

            cursor.execute("SELECT * FROM devices WHERE mac = ?", (mac,))
            row = cursor.fetchone()
            device_dict = dict(row) if row else {}

        return {"is_new": is_new, "device": device_dict}

    def _enrich_device_row(self, row_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Parses custom_metadata and attaches default credentials to device record."""
        import json
        from .credentials import lookup_default_credentials

        raw_meta = row_dict.get("custom_metadata") or "{}"
        if isinstance(raw_meta, str):
            try:
                row_dict["custom_metadata"] = json.loads(raw_meta)
            except Exception:
                row_dict["custom_metadata"] = {}
        elif not isinstance(raw_meta, dict):
            row_dict["custom_metadata"] = {}

        # Look up default credentials and admin web pages
        defaults = lookup_default_credentials(
            vendor=row_dict.get("vendor", ""),
            hostname=row_dict.get("hostname", ""),
            device_type=row_dict.get("device_type", ""),
            ip=row_dict.get("ip", "192.168.1.1"),
        )
        row_dict["default_credentials"] = defaults
        return row_dict

    def get_all_devices(self) -> List[Dict[str, Any]]:
        """Retrieves all tracked devices sorted by IP address."""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM devices ORDER BY ip ASC")
        rows = cursor.fetchall()
        return [self._enrich_device_row(dict(r)) for r in rows]

    def get_device(self, mac: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single device by MAC address."""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM devices WHERE mac = ?", (mac.strip().upper(),))
        row = cursor.fetchone()
        return self._enrich_device_row(dict(row)) if row else None

    def update_custom_metadata(self, mac: str, metadata: Dict[str, Any]) -> bool:
        """Saves user-defined custom metadata key-value dictionary for a device."""
        import json
        conn = self._get_connection()
        with conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE devices SET custom_metadata = ? WHERE mac = ?",
                (json.dumps(metadata), mac.strip().upper()),
            )
            return cursor.rowcount > 0

    def set_quarantine(self, mac: str, quarantined: bool, reason: str = "") -> bool:
        """Places or releases a device from Quarantine."""
        now_iso = datetime.now(timezone.utc).isoformat() if quarantined else ""
        conn = self._get_connection()
        with conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE devices SET
                    is_quarantined = ?,
                    quarantine_reason = ?,
                    quarantined_at = ?
                WHERE mac = ?
            """, (1 if quarantined else 0, reason if quarantined else "", now_iso, mac.strip().upper()))
            return cursor.rowcount > 0

    def update_nickname(self, mac: str, nickname: str) -> bool:
        """Sets a custom nickname for a device."""
        conn = self._get_connection()
        with conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE devices SET nickname = ? WHERE mac = ?",
                (nickname.strip(), mac.strip().upper()),
            )
            return cursor.rowcount > 0

    def toggle_trusted(self, mac: str, is_trusted: bool) -> bool:
        """Toggles the trusted state and marks device as known."""
        conn = self._get_connection()
        with conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE devices SET is_trusted = ?, is_known = 1 WHERE mac = ?",
                (1 if is_trusted else 0, mac.strip().upper()),
            )
            return cursor.rowcount > 0

    def mark_offline_missing(self, current_macs: List[str]) -> int:
        """Marks devices not present in the current scan as offline."""
        conn = self._get_connection()
        current_macs = [m.strip().upper() for m in current_macs]
        with conn:
            if not current_macs:
                cursor = conn.cursor()
                cursor.execute("UPDATE devices SET status = 'offline'")
                return cursor.rowcount
            placeholders = ",".join(["?"] * len(current_macs))
            cursor = conn.cursor()
            cursor.execute(
                f"UPDATE devices SET status = 'offline' WHERE mac NOT IN ({placeholders})",
                current_macs,
            )
            return cursor.rowcount

    def record_port_scans(self, ip: str, mac: Optional[str], scan_results: List[Dict[str, Any]]) -> None:
        """Stores open port findings for an IP/MAC."""
        now_iso = datetime.now(timezone.utc).isoformat()
        conn = self._get_connection()
        with conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM port_scans WHERE ip = ?", (ip,))
            for r in scan_results:
                cursor.execute("""
                    INSERT INTO port_scans (mac, ip, port, service_name, banner, risk, scanned_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    mac.strip().upper() if mac else None,
                    ip,
                    r.get("port"),
                    r.get("service_name", ""),
                    r.get("banner", ""),
                    r.get("risk", "Low"),
                    now_iso,
                ))

    def get_port_scans(self, ip: Optional[str] = None, mac: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetches port scan results for an IP or MAC address."""
        conn = self._get_connection()
        cursor = conn.cursor()
        if ip:
            cursor.execute("SELECT * FROM port_scans WHERE ip = ? ORDER BY port ASC", (ip,))
        elif mac:
            cursor.execute("SELECT * FROM port_scans WHERE mac = ? ORDER BY port ASC", (mac.strip().upper(),))
        else:
            cursor.execute("SELECT * FROM port_scans ORDER BY ip, port ASC")
        return [dict(r) for r in cursor.fetchall()]

    def record_speed_test(
        self,
        ping_ms: float,
        download_mbps: float,
        upload_mbps: float,
        server_name: str = "Local / Fast Benchmark",
        server_country: str = "",
        client_ip: str = "",
        isp: str = "",
    ) -> int:
        """Stores a speed test result."""
        now_iso = datetime.now(timezone.utc).isoformat()
        conn = self._get_connection()
        with conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO speed_tests (
                    timestamp, ping_ms, download_mbps, upload_mbps,
                    server_name, server_country, client_ip, isp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                now_iso,
                ping_ms,
                download_mbps,
                upload_mbps,
                server_name,
                server_country,
                client_ip,
                isp,
            ))
            return cursor.lastrowid or 0

    def get_latest_speed_test(self) -> Optional[Dict[str, Any]]:
        """Retrieves the most recent speed test."""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM speed_tests ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        return dict(row) if row else None

    def get_speed_tests(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Retrieves past speed test history."""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM speed_tests ORDER BY id DESC LIMIT ?", (limit,))
        return [dict(r) for r in cursor.fetchall()]

    def log_alert(
        self,
        alert_type: str,
        message: str,
        mac: str = "",
        ip: str = "",
        severity: str = "WARNING",
    ) -> int:
        """Logs a security / intruder alert."""
        now_iso = datetime.now(timezone.utc).isoformat()
        conn = self._get_connection()
        with conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO security_alerts (
                    timestamp, alert_type, mac, ip, message, severity, resolved
                ) VALUES (?, ?, ?, ?, ?, ?, 0)
            """, (
                now_iso,
                alert_type,
                mac.strip().upper(),
                ip.strip(),
                message,
                severity,
            ))
            return cursor.lastrowid or 0

    def get_alerts(self, limit: int = 50, unresolved_only: bool = False) -> List[Dict[str, Any]]:
        """Retrieves security alerts."""
        conn = self._get_connection()
        cursor = conn.cursor()
        if unresolved_only:
            cursor.execute(
                "SELECT * FROM security_alerts WHERE resolved = 0 ORDER BY id DESC LIMIT ?",
                (limit,),
            )
        else:
            cursor.execute("SELECT * FROM security_alerts ORDER BY id DESC LIMIT ?", (limit,))
        return [dict(r) for r in cursor.fetchall()]

    def resolve_alert(self, alert_id: int) -> bool:
        """Marks an alert as resolved."""
        conn = self._get_connection()
        with conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE security_alerts SET resolved = 1 WHERE id = ?", (alert_id,))
            return cursor.rowcount > 0

    def clear_all_alerts(self) -> int:
        """Deletes all security alerts."""
        conn = self._get_connection()
        with conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM security_alerts")
            return cursor.rowcount

    # -------------------------------------------------------------
    # Application Configuration & Settings (Email, Threads, Storage, Backup)
    # -------------------------------------------------------------
    def get_settings(self) -> Dict[str, Any]:
        """Retrieves complete settings hierarchy, populated with defaults."""
        default_settings = {
            "email": {
                "enabled": False,
                "smtp_host": "smtp.gmail.com",
                "smtp_port": 587,
                "encryption": "tls",
                "smtp_user": "ssitablet123@gmail.com",
                "smtp_password": "",
                "sender_address": "alerts@netsentinel.local",
                "recipient_addresses": "ssitablet123@gmail.com",
                "notify_on_intruder": True,
                "notify_on_high_risk_port": True,
                "notify_on_dns_hijack": True,
                "notify_on_rat": True,
                "notify_on_new_camera": True,
                "notify_on_outage": False,
            },
            "threads": {
                "discovery_threads": 40,
                "port_scan_threads": 100,
                "rat_scan_threads": 50,
                "dns_threads": 10,
                "socket_timeout_ms": 300,
                "inter_packet_delay_ms": 0,
                "max_concurrent_connections": 256,
            },
            "storage": {
                "db_path": str(self.db_path),
                "log_dir": "/var/log/netsentinel",
                "snapshot_dir": "/var/log/netsentinel/captures",
                "export_dir": "/var/log/netsentinel/exports",
                "auto_purge_days": 30,
            },
            "backup": {
                "backup_dir": "/var/backups/netsentinel",
                "auto_backup_enabled": True,
                "backup_schedule": "daily",
                "retention_count": 7,
                "cloud_target": "sftp://backup.internal.lan/netsentinel",
            },
            "network": {
                "custom_gateway": "",
                "custom_subnet": "",
                "custom_interface": "",
                "auto_detect": True,
            },
        }

        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM app_settings")
        rows = cursor.fetchall()

        for row in rows:
            section_key = row["key"]
            try:
                parsed_val = json.loads(row["value"])
                if section_key in default_settings and isinstance(parsed_val, dict):
                    default_settings[section_key].update(parsed_val)
                else:
                    default_settings[section_key] = parsed_val
            except Exception:
                pass

        return default_settings

    def save_settings(self, settings_update: Dict[str, Any]) -> Dict[str, Any]:
        """Saves or merges application settings."""
        conn = self._get_connection()
        now_iso = datetime.now(timezone.utc).isoformat()
        with conn:
            cursor = conn.cursor()
            for key, val in settings_update.items():
                val_json = json.dumps(val)
                cursor.execute("""
                    INSERT INTO app_settings (key, value, updated_at)
                    VALUES (?, ?, ?)
                    ON CONFLICT(key) DO UPDATE SET
                        value = excluded.value,
                        updated_at = excluded.updated_at
                """, (key, val_json, now_iso))

        return self.get_settings()

    def create_database_backup(self, custom_backup_dir: Optional[str] = None) -> Dict[str, Any]:
        """Creates an instant timestamped backup of the database and settings."""
        settings = self.get_settings()
        backup_dir = custom_backup_dir or settings.get("backup", {}).get("backup_dir", "/tmp/netsentinel_backups")
        
        try:
            os.makedirs(backup_dir, exist_ok=True)
        except Exception:
            backup_dir = "/tmp/netsentinel_backups"
            os.makedirs(backup_dir, exist_ok=True)

        now_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        backup_filename = f"netsentinel_backup_{now_str}.db"
        backup_path = os.path.join(backup_dir, backup_filename)

        conn = self._get_connection()
        try:
            conn.execute(f"VACUUM INTO '{backup_path}';")
        except Exception:
            shutil.copy2(self.db_path, backup_path)

        file_size = os.path.getsize(backup_path) if os.path.exists(backup_path) else 0
        device_count = len(self.get_all_devices())

        retention = int(settings.get("backup", {}).get("retention_count", 7))
        self._prune_backups(backup_dir, retention)

        return {
            "success": True,
            "filename": backup_filename,
            "path": backup_path,
            "size_bytes": file_size,
            "size_kb": round(file_size / 1024, 2),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "device_count": device_count,
            "backup_dir": backup_dir,
        }

    def _prune_backups(self, backup_dir: str, retention_count: int = 7) -> None:
        """Keeps only the most recent N backups in the backup folder."""
        try:
            if not os.path.isdir(backup_dir):
                return
            backups = []
            for fname in os.listdir(backup_dir):
                if fname.startswith("netsentinel_backup_") and fname.endswith(".db"):
                    fpath = os.path.join(backup_dir, fname)
                    backups.append((os.path.getmtime(fpath), fpath))
            backups.sort(reverse=True)
            for _, old_path in backups[retention_count:]:
                try:
                    os.remove(old_path)
                except Exception:
                    pass
        except Exception:
            pass

    def get_backups_list(self, custom_backup_dir: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns all existing backups in backup location."""
        settings = self.get_settings()
        backup_dir = custom_backup_dir or settings.get("backup", {}).get("backup_dir", "/tmp/netsentinel_backups")
        result = []
        if not os.path.isdir(backup_dir):
            # Also check fallback
            if os.path.isdir("/tmp/netsentinel_backups"):
                backup_dir = "/tmp/netsentinel_backups"
            else:
                return result
        try:
            for fname in sorted(os.listdir(backup_dir), reverse=True):
                if fname.startswith("netsentinel_backup_") and fname.endswith(".db"):
                    fpath = os.path.join(backup_dir, fname)
                    stat = os.stat(fpath)
                    result.append({
                        "filename": fname,
                        "path": fpath,
                        "size_bytes": stat.st_size,
                        "size_kb": round(stat.st_size / 1024, 2),
                        "created_at": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
                    })
        except Exception:
            pass
        return result

    def log_system_event(
        self,
        level: str,
        category: str,
        message: str,
        module: str = "core",
        details: Optional[Dict[str, Any]] = None,
        ip: str = "",
        mac: str = "",
        traceback: str = "",
    ) -> int:
        """
        Logs a system or debug event to the SQLite database.
        level: DEBUG, INFO, WARN, ERROR, CRITICAL
        category: network_scan, port_scan, wifi, security, surveillance, api, database, daemon, system
        """
        now_iso = datetime.now(timezone.utc).isoformat()
        details_json = json.dumps(details or {})
        conn = self._get_connection()
        with conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO system_logs (
                    timestamp, level, category, module, message, details, ip, mac, traceback
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                now_iso,
                level.upper(),
                category.lower(),
                module,
                message,
                details_json,
                ip.strip(),
                mac.strip().upper(),
                traceback or "",
            ))
            return cursor.lastrowid or 0

    def get_system_logs(
        self,
        level: Optional[str] = None,
        category: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 200,
        since_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Retrieves system and debug logs with optional filtering."""
        conn = self._get_connection()
        cursor = conn.cursor()

        query = "SELECT * FROM system_logs WHERE 1=1"
        params: List[Any] = []

        if since_id is not None and int(since_id) > 0:
            query += " AND id > ?"
            params.append(int(since_id))

        if level and level.upper() != "ALL":
            query += " AND level = ?"
            params.append(level.upper())

        if category and category.lower() != "all":
            query += " AND category = ?"
            params.append(category.lower())

        if search and search.strip():
            s = f"%{search.strip()}%"
            query += " AND (message LIKE ? OR module LIKE ? OR ip LIKE ? OR details LIKE ?)"
            params.extend([s, s, s, s])

        query += " ORDER BY id DESC LIMIT ?"
        params.append(max(1, min(int(limit), 2000)))

        cursor.execute(query, tuple(params))
        rows = [dict(r) for r in cursor.fetchall()]
        # Parse details JSON safely
        for r in rows:
            try:
                r["details"] = json.loads(r["details"]) if r.get("details") else {}
            except Exception:
                pass
        return rows

    def get_system_logs_stats(self) -> Dict[str, Any]:
        """Returns statistics breakdown of system logs by level and category."""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) AS total FROM system_logs")
        total = (cursor.fetchone() or {})["total"] if cursor.description else 0

        cursor.execute("SELECT level, COUNT(*) AS cnt FROM system_logs GROUP BY level")
        by_level = {str(r["level"]).upper(): r["cnt"] for r in cursor.fetchall()}

        cursor.execute("SELECT category, COUNT(*) AS cnt FROM system_logs GROUP BY category")
        by_category = {str(r["category"]).lower(): r["cnt"] for r in cursor.fetchall()}

        cursor.execute("SELECT timestamp FROM system_logs ORDER BY id DESC LIMIT 1")
        last_row = cursor.fetchone()
        last_timestamp = last_row["timestamp"] if last_row else None

        return {
            "total_logs": total,
            "debug_count": by_level.get("DEBUG", 0),
            "info_count": by_level.get("INFO", 0),
            "warn_count": by_level.get("WARN", 0) + by_level.get("WARNING", 0),
            "error_count": by_level.get("ERROR", 0) + by_level.get("CRITICAL", 0),
            "by_level": by_level,
            "by_category": by_category,
            "last_log_timestamp": last_timestamp,
        }

    def clear_system_logs(self, older_than_iso: Optional[str] = None) -> int:
        """Clears all logs or logs older than a given ISO timestamp."""
        conn = self._get_connection()
        with conn:
            cursor = conn.cursor()
            if older_than_iso:
                cursor.execute("DELETE FROM system_logs WHERE timestamp < ?", (older_than_iso,))
            else:
                cursor.execute("DELETE FROM system_logs")
            return cursor.rowcount or 0

