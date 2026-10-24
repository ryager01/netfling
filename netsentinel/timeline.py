"""
NetSentinel Device Presence, Outage & Digital Timeline Engine.
Matches and exceeds Fingbox / Fing Desktop Premium presence tracking and Pause Internet controls.
Tracks connection state transitions, network outages, and access policies.
"""

import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from .db import DatabaseEngine


class PresenceTimelineEngine:
    """Tracks device presence timelines, connection durations, and access policies."""

    def __init__(self, db: DatabaseEngine):
        self.db = db
        self._init_timeline_table()

    def _init_timeline_table(self) -> None:
        """Creates presence_events and access_rules tables if they don't exist."""
        conn = self.db._get_connection()
        with conn:
            conn.executescript("""
            CREATE TABLE IF NOT EXISTS presence_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mac TEXT NOT NULL,
                ip TEXT NOT NULL,
                event_type TEXT NOT NULL, -- 'CONNECTED', 'DISCONNECTED', 'OUTAGE'
                timestamp TEXT NOT NULL,
                details TEXT DEFAULT ''
            );

            CREATE TABLE IF NOT EXISTS access_policies (
                mac TEXT PRIMARY KEY,
                is_paused INTEGER DEFAULT 0, -- 1 = Internet Paused, 0 = Active
                paused_at TEXT DEFAULT '',
                notes TEXT DEFAULT ''
            );

            CREATE INDEX IF NOT EXISTS idx_presence_mac ON presence_events(mac);
            CREATE INDEX IF NOT EXISTS idx_presence_time ON presence_events(timestamp);
            """)

    def record_presence_event(self, mac: str, ip: str, event_type: str, details: str = "") -> int:
        """Records a connection or disconnection event."""
        now_iso = datetime.now(timezone.utc).isoformat()
        conn = self.db._get_connection()
        with conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO presence_events (mac, ip, event_type, timestamp, details)
                VALUES (?, ?, ?, ?, ?)
            """, (mac.strip().upper(), ip.strip(), event_type.upper(), now_iso, details))
            return cursor.lastrowid or 0

    def get_device_history(self, mac: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieves presence history for a specific MAC address."""
        conn = self.db._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM presence_events WHERE mac = ? ORDER BY id DESC LIMIT ?
        """, (mac.strip().upper(), limit))
        return [dict(r) for r in cursor.fetchall()]

    def get_recent_timeline(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Retrieves global network presence timeline."""
        conn = self.db._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT pe.*, d.hostname, d.vendor, d.nickname
            FROM presence_events pe
            LEFT JOIN devices d ON pe.mac = d.mac
            ORDER BY pe.id DESC LIMIT ?
        """, (limit,))
        return [dict(r) for r in cursor.fetchall()]

    def set_pause_internet(self, mac: str, pause: bool, notes: str = "") -> Dict[str, Any]:
        """Toggles 'Pause Internet' access policy for a device."""
        mac = mac.strip().upper()
        now_iso = datetime.now(timezone.utc).isoformat() if pause else ""
        conn = self.db._get_connection()
        with conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO access_policies (mac, is_paused, paused_at, notes)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(mac) DO UPDATE SET
                    is_paused = excluded.is_paused,
                    paused_at = excluded.paused_at,
                    notes = excluded.notes
            """, (mac, 1 if pause else 0, now_iso, notes))

            # Record event in timeline
            event_type = "INTERNET_PAUSED" if pause else "INTERNET_RESUMED"
            self.record_presence_event(
                mac=mac,
                ip="",
                event_type=event_type,
                details=f"Access policy set to {'PAUSED' if pause else 'ACTIVE'}",
            )

        return {
            "mac": mac,
            "is_paused": pause,
            "paused_at": now_iso,
        }

    def get_access_policy(self, mac: str) -> Dict[str, Any]:
        """Retrieves the current access policy for a device."""
        conn = self.db._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM access_policies WHERE mac = ?", (mac.strip().upper(),))
        row = cursor.fetchone()
        if row:
            return dict(row)
        return {"mac": mac.strip().upper(), "is_paused": 0, "paused_at": "", "notes": ""}
