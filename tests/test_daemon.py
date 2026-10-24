"""
Unit tests for NetSentinel Intruder Alert Daemon.
"""

import os
import tempfile
import time
import unittest
from netsentinel.db import DatabaseEngine
from netsentinel.daemon import IntruderAlertDaemon


class TestIntruderDaemon(unittest.TestCase):
    def setUp(self):
        self.temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        self.temp_db.close()
        self.db = DatabaseEngine(db_path=self.temp_db.name)

    def tearDown(self):
        if os.path.exists(self.temp_db.name):
            os.remove(self.temp_db.name)

    def test_daemon_lifecycle(self):
        alerts_received = []

        def on_alert(a):
            alerts_received.append(a)

        daemon = IntruderAlertDaemon(
            db=self.db,
            interval_seconds=1,
            on_alert_callback=on_alert,
        )

        self.assertFalse(daemon.is_running())
        daemon.start()
        self.assertTrue(daemon.is_running())
        time.sleep(1.5)
        daemon.stop()
        self.assertFalse(daemon.is_running())


if __name__ == "__main__":
    unittest.main()
