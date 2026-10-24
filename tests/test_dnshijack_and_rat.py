"""
Unit Tests for DNS Hijack Detector and RAT Detector Engine.
"""

import unittest
from netsentinel.dnshijack import DnsHijackDetector
from netsentinel.rat_detector import RatDetectorEngine, KNOWN_RAT_REGISTRY
from netsentinel.db import DatabaseEngine


class TestDnsHijackDetector(unittest.TestCase):
    def test_dns_query_packet_builder(self):
        packet, tx_id = DnsHijackDetector._build_dns_query_packet("google.com", 1)
        self.assertGreater(len(packet), 12)
        self.assertGreaterEqual(tx_id, 1000)

    def test_nxdomain_probe_structure(self):
        result = DnsHijackDetector.check_nxdomain_hijacking()
        self.assertIn("probe_name", result)
        self.assertIn("is_hijacked", result)
        self.assertIn("status", result)

    def test_full_hijack_audit_structure(self):
        audit = DnsHijackDetector.run_full_hijack_audit()
        self.assertIn("health_score", audit)
        self.assertIn("health_status", audit)
        self.assertIn("probes", audit)
        self.assertIn("recommendations", audit)
        self.assertIn("nxdomain", audit["probes"])
        self.assertIn("canary", audit["probes"])
        self.assertIn("transparent_proxy", audit["probes"])


class TestRatDetectorEngine(unittest.TestCase):
    def setUp(self):
        self.db = DatabaseEngine(":memory:")
        self.engine = RatDetectorEngine(db=self.db, timeout=0.2)

    def test_known_rat_registry(self):
        self.assertGreaterEqual(len(KNOWN_RAT_REGISTRY), 15)
        ports = [r["port"] for r in KNOWN_RAT_REGISTRY]
        self.assertIn(1604, ports)  # DarkComet
        self.assertIn(5552, ports)  # njRAT
        self.assertIn(4444, ports)  # Metasploit

    def test_audit_host_loopback(self):
        res = self.engine.audit_host("127.0.0.1")
        self.assertIn("threat_level", res)
        self.assertIn("risk_grade", res)
        self.assertIn("findings", res)
        self.assertEqual(res["ip"], "127.0.0.1")

    def test_audit_entire_network_empty_db(self):
        res = self.engine.audit_entire_network()
        self.assertIn("total_devices_audited", res)
        self.assertIn("overall_status", res)


if __name__ == "__main__":
    unittest.main()
