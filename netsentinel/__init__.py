"""
NetSentinel - Local Network Discovery, Inventory & Security Suite.
Matching and exceeding Fing's core capabilities.
"""

__version__ = "1.0.0"
__author__ = "NetSentinel Systems Architect"

from .db import DatabaseEngine
from .discovery import SubnetDiscoveryEngine
from .fingerprint import DeviceFingerprinter
from .portscan import PortScanEngine
from .speedtest import SpeedTestEngine
from .daemon import IntruderAlertDaemon
from .export import ExportEngine
from .vulnerability import RouterVulnerabilityEngine
from .surveillance import SurveillanceDetector
from .wol import WakeOnLanEngine
from .timeline import PresenceTimelineEngine

__all__ = [
    "DatabaseEngine",
    "SubnetDiscoveryEngine",
    "DeviceFingerprinter",
    "PortScanEngine",
    "SpeedTestEngine",
    "IntruderAlertDaemon",
    "ExportEngine",
    "RouterVulnerabilityEngine",
    "SurveillanceDetector",
    "WakeOnLanEngine",
    "PresenceTimelineEngine",
]
