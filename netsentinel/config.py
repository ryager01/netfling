"""
NetSentinel Configuration and Defaults.
"""

import os
from pathlib import Path

# Base Paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = os.environ.get("NETSENTINEL_DB", str(PROJECT_ROOT / "netsentinel.db"))

# Top Ports for Fast Service Audit (as requested by specification: 21, 22, 23, 80, 443, 445, 8080)
DEFAULT_SCAN_PORTS = [21, 22, 23, 80, 443, 445, 8080]

# Extended standard ports dictionary with service names and risk classifications
KNOWN_SERVICES = {
    21: {"name": "FTP", "desc": "File Transfer Protocol (Cleartext)", "risk": "Medium"},
    22: {"name": "SSH", "desc": "Secure Shell Remote Access", "risk": "Low"},
    23: {"name": "Telnet", "desc": "Unencrypted Remote Terminal", "risk": "High"},
    25: {"name": "SMTP", "desc": "Simple Mail Transfer Protocol", "risk": "Low"},
    53: {"name": "DNS", "desc": "Domain Name System", "risk": "Low"},
    80: {"name": "HTTP", "desc": "World Wide Web (Cleartext)", "risk": "Low"},
    110: {"name": "POP3", "desc": "Post Office Protocol v3", "risk": "Medium"},
    135: {"name": "MSRPC", "desc": "Microsoft Remote Procedure Call", "risk": "Medium"},
    139: {"name": "NetBIOS-SSN", "desc": "NetBIOS Session Service", "risk": "Medium"},
    143: {"name": "IMAP", "desc": "Internet Message Access Protocol", "risk": "Low"},
    443: {"name": "HTTPS", "desc": "Encrypted Web Transport (TLS)", "risk": "Low"},
    445: {"name": "SMB", "desc": "Server Message Block / Windows Sharing", "risk": "Medium"},
    548: {"name": "AFP", "desc": "Apple Filing Protocol", "risk": "Low"},
    631: {"name": "IPP", "desc": "Internet Printing Protocol", "risk": "Low"},
    1433: {"name": "MSSQL", "desc": "Microsoft SQL Server", "risk": "Medium"},
    3306: {"name": "MySQL", "desc": "MySQL Database", "risk": "Medium"},
    3389: {"name": "RDP", "desc": "Microsoft Remote Desktop", "risk": "Medium"},
    5000: {"name": "UPnP / Flask", "desc": "Universal Plug and Play / Web App", "risk": "Low"},
    5353: {"name": "mDNS", "desc": "Multicast DNS (Bonjour/Avahi)", "risk": "Low"},
    8000: {"name": "HTTP-Dev", "desc": "Alternative HTTP / Dev Server", "risk": "Low"},
    8080: {"name": "HTTP-Proxy", "desc": "Alternative HTTP / Web Proxy", "risk": "Low"},
    8443: {"name": "HTTPS-Alt", "desc": "Alternative HTTPS Web Console", "risk": "Low"},
    9000: {"name": "Portainer/Sonar", "desc": "Container Management or Dev Console", "risk": "Low"},
}

# Network Scanners Defaults
DEFAULT_TIMEOUT_SOCKET = 0.8  # Seconds
DEFAULT_DISCOVERY_TIMEOUT = 2.0  # Seconds
DEFAULT_DAEMON_INTERVAL = 30  # Seconds between automated scans

# Fallback Gateway and Subnet if offline/containerized
FALLBACK_GATEWAY = "192.168.1.1"
FALLBACK_SUBNET = "192.168.1.0/24"
