"""
NetSentinel Wake-on-LAN (WoL) Engine.
Matches and exceeds Fing's Wake-on-LAN remote wake capability.
Constructs and broadcasts IEEE 802.3 Magic Packets over UDP to wake sleeping devices.
"""

import re
import socket
from typing import Dict, Any, Optional


class WakeOnLanEngine:
    """Sends Wake-on-LAN Magic Packets to wake sleeping network endpoints."""

    @staticmethod
    def validate_mac(mac: str) -> Optional[bytes]:
        """Validates MAC address string and returns raw 6 bytes."""
        clean_mac = re.sub(r"[^0-9A-Fa-f]", "", mac)
        if len(clean_mac) != 12:
            return None
        try:
            return bytes.fromhex(clean_mac)
        except ValueError:
            return None

    @staticmethod
    def create_magic_packet(mac_bytes: bytes) -> bytes:
        """
        Creates standard Magic Packet payload:
        6 bytes of 0xFF followed by 16 repetitions of the target MAC address (102 bytes total).
        """
        return (b"\xFF" * 6) + (mac_bytes * 16)

    def wake(
        self,
        mac: str,
        broadcast_ip: str = "255.255.255.255",
        port: int = 9,
    ) -> Dict[str, Any]:
        """
        Transmits a Wake-on-LAN Magic Packet via UDP broadcast.
        """
        mac_bytes = self.validate_mac(mac)
        if not mac_bytes:
            return {
                "success": False,
                "error": f"Invalid MAC address format: '{mac}'",
                "mac": mac,
            }

        packet = self.create_magic_packet(mac_bytes)

        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
                sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
                sock.settimeout(2.0)
                sock.sendto(packet, (broadcast_ip, port))

            return {
                "success": True,
                "mac": mac.upper(),
                "broadcast_ip": broadcast_ip,
                "port": port,
                "bytes_sent": len(packet),
                "message": f"Magic Packet transmitted successfully to {mac.upper()} via {broadcast_ip}:{port}",
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "mac": mac,
            }
