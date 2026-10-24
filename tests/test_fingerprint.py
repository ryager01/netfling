"""
Unit tests for NetSentinel Fingerprinting & Device Classification Engine.
"""

import unittest
from netsentinel.fingerprint import DeviceFingerprinter


class TestDeviceFingerprinter(unittest.TestCase):
    def setUp(self):
        self.fp = DeviceFingerprinter(default_gateway_ip="192.168.1.1")

    def test_classify_gateway(self):
        category = self.fp.classify_device(
            ip="192.168.1.1",
            mac="00:14:6C:11:22:33",
            hostname="router.lan",
            vendor="Netgear Inc.",
        )
        self.assertEqual(category, "Router / Gateway")

    def test_classify_iot(self):
        category = self.fp.classify_device(
            ip="192.168.1.105",
            mac="24:0A:C4:11:22:33",
            hostname="smart-bulb",
            vendor="Espressif Systems (ESP32)",
        )
        self.assertEqual(category, "Smart Home / IoT")

    def test_classify_printer(self):
        category = self.fp.classify_device(
            ip="192.168.1.150",
            mac="00:25:B3:AA:BB:CC",
            hostname="HP-LaserJet-Office",
            vendor="Hewlett Packard",
            open_ports=[631],
        )
        self.assertEqual(category, "Printer")

    def test_classify_workstation(self):
        category = self.fp.classify_device(
            ip="192.168.1.45",
            mac="44:A8:42:11:22:33",
            hostname="DESKTOP-DEV99",
            vendor="Dell Inc.",
            open_ports=[445],
        )
        self.assertEqual(category, "PC / Workstation")

    def test_classify_mobile(self):
        category = self.fp.classify_device(
            ip="192.168.1.80",
            mac="00:17:F2:AA:BB:CC",
            hostname="iPhone-Alex",
            vendor="Apple, Inc.",
        )
        self.assertEqual(category, "Smartphone / Tablet")


if __name__ == "__main__":
    unittest.main()
