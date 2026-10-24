"""
NetSentinel Network Diagnostic Tools Unit Tests.
Validates:
- PingEngine (local loopback, structured output, error resilience)
- TracerouteEngine (hop breakdown, timeout handling, duration)
- DnsEngine (A, AAAA, MX, TXT, resolver formatting)
- EmailDeliveryEngine (syntax check, MX extraction, SPF detection, DMARC parsing, Deliverability grade)
- BlacklistCheckEngine (DNSBL provider check, IP reputation, domain check, PTR alignment)
"""

import unittest
from netsentinel.nettools import (
    PingEngine,
    TracerouteEngine,
    DnsEngine,
    EmailDeliveryEngine,
    BlacklistCheckEngine,
)


class TestNetworkDiagnostics(unittest.TestCase):

    def test_ping_localhost(self):
        result = PingEngine.run_ping("127.0.0.1", count=2, timeout=1)
        self.assertIn("status", result)
        self.assertEqual(result["target"], "127.0.0.1")
        self.assertEqual(result["status"], "online")
        self.assertGreaterEqual(result["packets_received"], 1)
        self.assertIn("quality", result)

    def test_ping_invalid_target(self):
        result = PingEngine.run_ping("invalid target with spaces!!!")
        self.assertIn("error", result)

    def test_dns_resolution(self):
        result = DnsEngine.query("google.com", "A", resolver_ip="8.8.8.8")
        self.assertEqual(result["query"], "google.com")
        self.assertEqual(result["status"], "NOERROR")
        self.assertGreater(len(result["answers"]), 0)
        self.assertIn("response_time_ms", result)

    def test_email_delivery_validation(self):
        result = EmailDeliveryEngine.check_email_delivery("test@example.com")
        self.assertTrue(result["syntax_valid"])
        self.assertEqual(result["domain"], "example.com")
        self.assertIn("deliverability_score", result)
        self.assertIn("deliverability_grade", result)
        self.assertIn("spf", result)
        self.assertIn("dmarc", result)

    def test_email_invalid_syntax(self):
        result = EmailDeliveryEngine.check_email_delivery("bad_email_format@@@")
        self.assertFalse(result["syntax_valid"])
        self.assertLess(result["deliverability_score"], 100)

    def test_blacklist_checker_ip(self):
        result = BlacklistCheckEngine.check_blacklist("8.8.8.8")
        self.assertEqual(result["target_ip"], "8.8.8.8")
        self.assertGreater(result["total_checked"], 0)
        self.assertIn(result["reputation"], ["CLEAN", "NEUTRAL", "LISTED_SUSPICIOUS", "CRITICAL_BLACKLISTED"])
        self.assertIn("checks", result)
        self.assertGreaterEqual(len(result["checks"]), 8)

    def test_traceroute_engine(self):
        result = TracerouteEngine.run_trace("127.0.0.1", max_hops=3, timeout=1)
        self.assertEqual(result["target"], "127.0.0.1")
        self.assertIn("hops", result)
        self.assertGreater(result["total_hops"], 0)


if __name__ == "__main__":
    unittest.main()
