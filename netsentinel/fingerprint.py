"""
NetSentinel Device Fingerprinting Engine.
Performs reverse DNS, NetBIOS name queries, vendor resolution, and heuristic device classification.
"""

import socket
import struct
import re
from typing import Dict, Optional, List, Tuple
from .oui import resolve_oui


class DeviceFingerprinter:
    """Extracts device identities, hostnames, and classifies device categories."""

    def __init__(self, default_gateway_ip: Optional[str] = None):
        self.default_gateway_ip = default_gateway_ip

    def resolve_hostname(self, ip: str, timeout: float = 0.35) -> str:
        """Performs non-blocking reverse DNS lookup for an IP address."""
        if not ip or ip.startswith("127."):
            return "localhost"
        old_timeout = socket.getdefaulttimeout()
        try:
            socket.setdefaulttimeout(timeout)
            name, _, _ = socket.gethostbyaddr(ip)
            return name
        except (socket.herror, socket.gaierror, socket.timeout, OSError):
            pass
        finally:
            socket.setdefaulttimeout(old_timeout)

        # Fallback to NetBIOS query for Windows / Samba hosts
        nbns_name = self.query_netbios_name(ip, timeout=timeout)
        if nbns_name:
            return nbns_name

        return "Unknown"

    def query_netbios_name(self, ip: str, timeout: float = 0.5) -> Optional[str]:
        """Sends a NetBIOS Name Service (NBNS) node status request on UDP port 137."""
        if not ip:
            return None
        # NBNS Node Status Query Packet
        # Transaction ID (2 bytes), Flags (2 bytes), Questions: 1, Answer RRs: 0, Authority RRs: 0, Additional RRs: 0
        # Query Name: "*<00...>" encoded, Type: 0x0021 (NBSTAT), Class: 0x0001 (IN)
        packet = (
            b"\x80\x00"  # Transaction ID
            b"\x00\x00"  # Flags
            b"\x00\x01"  # Question Count: 1
            b"\x00\x00\x00\x00\x00\x00"
            b"\x20"  # Length: 32 bytes
            b"CKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"  # Encoded "*" (Wildcard)
            b"\x00"  # Terminator
            b"\x00\x21"  # Type: NBSTAT
            b"\x00\x01"  # Class: IN
        )
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.settimeout(timeout)
        try:
            sock.sendto(packet, (ip, 137))
            data, _ = sock.recvfrom(1024)
            if len(data) > 57:
                # Number of names is at byte offset 56
                num_names = data[56]
                if num_names > 0 and len(data) >= 57 + 18:
                    # First name is 15 bytes ASCII + 1 byte type
                    raw_name = data[57:72].decode("latin-1", errors="ignore").strip()
                    if raw_name:
                        return raw_name
        except Exception:
            pass
        finally:
            sock.close()
        return None

    def classify_device(
        self,
        ip: str,
        mac: str,
        hostname: str,
        vendor: str,
        open_ports: Optional[List[int]] = None,
    ) -> str:
        """
        Classifies the device into:
        'Router / Gateway', 'Smartphone / Tablet', 'Smart Home / IoT',
        'PC / Workstation', 'Server / NAS', 'Printer', 'Gaming Console', or 'General Device'.
        """
        open_ports = open_ports or []
        combined_text = f"{hostname} {vendor}".lower()

        # Check for Gateway / Router
        if self.default_gateway_ip and ip == self.default_gateway_ip:
            return "Router / Gateway"
        if any(w in combined_text for w in ["router", "gateway", "unifi", "openwrt", "fritz", "mesh", "mikrotik"]):
            return "Router / Gateway"
        if ip.endswith(".1") and any(w in combined_text for w in ["cisco", "netgear", "tp-link", "ubiquiti", "asus"]):
            return "Router / Gateway"

        # Check for Printer
        if any(w in combined_text for w in ["printer", "laserjet", "deskjet", "epson", "brother", "xerox", "canon"]):
            return "Printer"
        if 631 in open_ports or 9100 in open_ports:
            return "Printer"

        # Check for Smart Home / IoT
        if any(w in combined_text for w in [
            "espressif", "esp32", "esp8266", "philips", "hue", "sonos", "ring",
            "nest", "echo", "alexa", "tuya", "kasa", "shelly", "smart plug",
            "chromecast", "google home", "roku", "apple tv"
        ]):
            return "Smart Home / IoT"

        # Check for Gaming Consoles
        if any(w in combined_text for w in ["playstation", "ps4", "ps5", "xbox", "nintendo"]):
            return "Gaming Console"

        # Check for Mobile Devices
        if any(w in combined_text for w in ["iphone", "ipad", "galaxy", "pixel", "android", "redmi", "xiaomi", "oneplus"]):
            return "Smartphone / Tablet"
        if "apple" in combined_text and ("randomized" in combined_text or "private" in combined_text):
            return "Smartphone / Tablet"

        # Check for Server / NAS
        if any(w in combined_text for w in ["synology", "qnap", "truenas", "unraid", "proxmox"]):
            return "Server / NAS"
        if (22 in open_ports or 8080 in open_ports) and (80 in open_ports or 443 in open_ports):
            return "Server / NAS"

        # Check for PC / Workstation
        if any(w in combined_text for w in ["macbook", "imac", "thinkpad", "desktop", "laptop", "surface", "dell", "lenovo", "hp inc"]):
            return "PC / Workstation"
        if any(p in open_ports for p in [135, 139, 445, 3389]):
            return "PC / Workstation"

        return "General Device"

    def fingerprint(
        self,
        ip: str,
        mac: str,
        open_ports: Optional[List[int]] = None,
    ) -> Dict[str, str]:
        """Performs complete fingerprint analysis for an IP and MAC."""
        vendor = resolve_oui(mac)
        hostname = self.resolve_hostname(ip)
        device_type = self.classify_device(ip, mac, hostname, vendor, open_ports)

        return {
            "ip": ip,
            "mac": mac.strip().upper(),
            "vendor": vendor,
            "hostname": hostname,
            "device_type": device_type,
        }
