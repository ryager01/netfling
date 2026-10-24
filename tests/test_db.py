"""
Unit tests for NetSentinel SQLite Database Engine.
"""

import os
import tempfile
import unittest
from netsentinel.db import DatabaseEngine


class TestDatabaseEngine(unittest.TestCase):
    def setUp(self):
        self.temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        self.temp_db.close()
        self.db = DatabaseEngine(db_path=self.temp_db.name)

    def tearDown(self):
        if os.path.exists(self.temp_db.name):
            os.remove(self.temp_db.name)

    def test_upsert_and_retrieve_device(self):
        res1 = self.db.upsert_device(
            mac="AA:BB:CC:DD:EE:01",
            ip="192.168.1.50",
            hostname="test-host.lan",
            vendor="Apple, Inc.",
            device_type="Smartphone / Tablet",
            latency_ms=4.5,
        )
        self.assertTrue(res1["is_new"])
        self.assertEqual(res1["device"]["mac"], "AA:BB:CC:DD:EE:01")

        # Second upsert (update existing)
        res2 = self.db.upsert_device(
            mac="AA:BB:CC:DD:EE:01",
            ip="192.168.1.50",
            hostname="test-host.lan",
            vendor="Apple, Inc.",
            device_type="Smartphone / Tablet",
            latency_ms=2.1,
        )
        self.assertFalse(res2["is_new"])
        self.assertEqual(res2["device"]["latency_ms"], 2.1)

        # Retrieve device
        dev = self.db.get_device("AA:BB:CC:DD:EE:01")
        self.assertIsNotNone(dev)
        self.assertEqual(dev["ip"], "192.168.1.50")

    def test_nickname_and_trust(self):
        self.db.upsert_device(mac="11:22:33:44:55:66", ip="192.168.1.20")
        self.assertTrue(self.db.update_nickname("11:22:33:44:55:66", "My MacBook Pro"))
        self.assertTrue(self.db.toggle_trusted("11:22:33:44:55:66", True))

        dev = self.db.get_device("11:22:33:44:55:66")
        self.assertEqual(dev["nickname"], "My MacBook Pro")
        self.assertEqual(dev["is_trusted"], 1)
        self.assertEqual(dev["is_known"], 1)

    def test_port_scans(self):
        findings = [
            {"port": 22, "service_name": "SSH", "banner": "OpenSSH 8.9", "risk": "Low"},
            {"port": 80, "service_name": "HTTP", "banner": "Apache/2.4", "risk": "Low"},
        ]
        self.db.record_port_scans(ip="192.168.1.10", mac="AA:BB:CC:11:22:33", scan_results=findings)
        scans = self.db.get_port_scans(ip="192.168.1.10")
        self.assertEqual(len(scans), 2)
        self.assertEqual(scans[0]["port"], 22)
        self.assertEqual(scans[1]["port"], 80)

    def test_speed_test_storage(self):
        row_id = self.db.record_speed_test(
            ping_ms=12.5,
            download_mbps=185.4,
            upload_mbps=42.1,
            server_name="SpeedTest Node",
        )
        self.assertGreater(row_id, 0)
        latest = self.db.get_latest_speed_test()
        self.assertIsNotNone(latest)
        self.assertEqual(latest["download_mbps"], 185.4)

    def test_alerts_logging_and_resolving(self):
        alert_id = self.db.log_alert(
            alert_type="NEW_DEVICE",
            message="Rogue device connected",
            mac="99:88:77:66:55:44",
            ip="192.168.1.99",
            severity="WARNING",
        )
        alerts = self.db.get_alerts()
        self.assertEqual(len(alerts), 1)
        self.assertEqual(alerts[0]["alert_type"], "NEW_DEVICE")

        self.assertTrue(self.db.resolve_alert(alert_id))
        unresolved = self.db.get_alerts(unresolved_only=True)
        self.assertEqual(len(unresolved), 0)


if __name__ == "__main__":
    unittest.main()
