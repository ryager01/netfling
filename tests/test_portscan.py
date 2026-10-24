"""
Unit tests for NetSentinel Port Scanner Engine.
"""

import socket
import threading
import unittest
from netsentinel.portscan import PortScanEngine


class TestPortScanner(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Spin up a lightweight local test server on an ephemeral port
        cls.server_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        cls.server_sock.bind(("127.0.0.1", 0))
        cls.test_port = cls.server_sock.getsockname()[1]
        cls.server_sock.listen(5)

        def echo_worker():
            try:
                while True:
                    conn, _ = cls.server_sock.accept()
                    conn.sendall(b"SSH-2.0-NetSentinelTestServer\r\n")
                    conn.close()
            except Exception:
                pass

        cls.thread = threading.Thread(target=echo_worker, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        try:
            cls.server_sock.close()
        except Exception:
            pass

    def test_scan_open_port_and_grab_banner(self):
        engine = PortScanEngine(timeout=1.0)
        finding = engine.scan_single_port("127.0.0.1", self.test_port)
        self.assertIsNotNone(finding)
        self.assertEqual(finding["state"], "open")
        self.assertEqual(finding["port"], self.test_port)
        self.assertIn("NetSentinelTestServer", finding["banner"])

    def test_scan_closed_port(self):
        engine = PortScanEngine(timeout=0.3)
        # Port 65530 is almost certainly closed
        finding = engine.scan_single_port("127.0.0.1", 65530)
        self.assertIsNone(finding)


if __name__ == "__main__":
    unittest.main()
