"""
Unit tests for NetSentinel Export Engine.
"""

import json
import os
import tempfile
import unittest
from netsentinel.db import DatabaseEngine
from netsentinel.export import ExportEngine


class TestExportEngine(unittest.TestCase):
    def setUp(self):
        self.temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        self.temp_db.close()
        self.db = DatabaseEngine(db_path=self.temp_db.name)
        self.exporter = ExportEngine(db=self.db)

        # Seed sample data
        self.db.upsert_device(
            mac="00:14:6C:AA:BB:CC",
            ip="192.168.1.1",
            hostname="router.lan",
            vendor="Netgear Inc.",
            device_type="Router / Gateway",
        )
        self.db.record_port_scans(
            ip="192.168.1.1",
            mac="00:14:6C:AA:BB:CC",
            scan_results=[{"port": 80, "service_name": "HTTP", "risk": "Low"}],
        )

    def tearDown(self):
        if os.path.exists(self.temp_db.name):
            os.remove(self.temp_db.name)

    def test_export_json_validity(self):
        json_output = self.exporter.export_to_json()
        parsed = json.loads(json_output)
        self.assertIn("metadata", parsed)
        self.assertIn("devices", parsed)
        self.assertEqual(len(parsed["devices"]), 1)
        self.assertEqual(parsed["devices"][0]["mac"], "00:14:6C:AA:BB:CC")

    def test_export_csv_validity(self):
        csv_output = self.exporter.export_to_csv()
        lines = csv_output.strip().splitlines()
        self.assertGreaterEqual(len(lines), 2)
        # Verify header columns
        self.assertIn("IP Address", lines[0])
        self.assertIn("MAC Address", lines[0])
        # Verify row content
        self.assertIn("192.168.1.1", lines[1])
        self.assertIn("Netgear Inc.", lines[1])


if __name__ == "__main__":
    unittest.main()
