"""
Unit tests for NetSentinel OUI Vendor Resolution Engine.
"""

import unittest
from netsentinel.oui import resolve_oui, is_locally_administered


class TestOuiResolution(unittest.TestCase):
    def test_known_vendors(self):
        # Apple
        self.assertIn("Apple", resolve_oui("00:17:F2:11:22:33"))
        # Raspberry Pi
        self.assertIn("Raspberry Pi", resolve_oui("B8:27:EB:AA:BB:CC"))
        # Espressif (ESP32)
        self.assertIn("Espressif", resolve_oui("24:0A:C4:01:02:03"))
        # Intel
        self.assertIn("Intel", resolve_oui("00:1B:21:44:55:66"))
        # Google
        self.assertIn("Google", resolve_oui("3C:5A:B4:77:88:99"))

    def test_randomized_private_macs(self):
        # Locally administered bit set: first byte hex ending with 2, 6, A, E
        # e.g. DA:A1:19... (D = 1101, A = 1010 -> bit 1 is set)
        self.assertTrue(is_locally_administered("DA:A1:19:33:44:55"))
        self.assertTrue(is_locally_administered("02:00:00:00:00:01"))
        self.assertIn("Randomized", resolve_oui("DA:A1:19:33:44:55"))

    def test_empty_or_unknown(self):
        self.assertEqual(resolve_oui(""), "Unknown")
        self.assertEqual(resolve_oui("00:00:00:00:00:00"), "Unknown")


if __name__ == "__main__":
    unittest.main()
