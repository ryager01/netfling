"""
NetSentinel Subnet Discovery Engine.
Automatically detects active gateway, interfaces, and subnet masks.
Performs fast ARP and ICMP sweeps using Scapy, Nmap, or kernel-assisted fallback probes
with comprehensive root/sandbox permission handling.
"""

import ipaddress
import os
import re
import shutil
import socket
import struct
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Dict, List, Optional, Tuple

from .config import DEFAULT_DISCOVERY_TIMEOUT, FALLBACK_GATEWAY, FALLBACK_SUBNET
from .db import DatabaseEngine
from .fingerprint import DeviceFingerprinter


class SubnetDiscoveryEngine:
    """Discovers active hosts on the local subnet with multi-tier fallback."""

    def __init__(self, db: Optional[DatabaseEngine] = None):
        self.db = db
        self.active_interface: str = "eth0"
        self.local_ip: str = "127.0.0.1"
        self.gateway_ip: str = FALLBACK_GATEWAY
        self.subnet_cidr: str = FALLBACK_SUBNET
        self.fingerprinter: DeviceFingerprinter = DeviceFingerprinter(default_gateway_ip=self.gateway_ip)
        self.detect_network_environment()

    def _detect_windows_network(self) -> Tuple[Optional[str], Optional[str], Optional[str], Optional[str]]:
        """
        Parses Windows network state using route print, ipconfig, and PowerShell.
        Returns (local_ip, gateway_ip, active_interface, subnet_cidr)
        """
        # 1. Fast & Universal on Windows: route print 0.0.0.0 (language-independent numeric table)
        try:
            output = subprocess.check_output(["route", "print", "0.0.0.0"], text=True, stderr=subprocess.DEVNULL, timeout=5)
            # Match 0.0.0.0 0.0.0.0 <GatewayIP> <InterfaceIP>
            match = re.search(r"0\.0\.0\.0\s+0\.0\.0\.0\s+([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\s+([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)", output)
            if match:
                gw = match.group(1).strip()
                ip = match.group(2).strip()
                if gw not in ("0.0.0.0", "127.0.0.1") and not ip.startswith("127.") and not ip.startswith("169.254."):
                    prefix = ip.rsplit(".", 1)[0]
                    return ip, gw, "Wi-Fi/Ethernet", f"{prefix}.0/24"
        except Exception:
            pass

        # 2. Windows PowerShell Get-NetIPConfiguration
        try:
            ps_cmd = (
                "$cfg = Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -and $_.IPv4Address } | "
                "Select-Object -First 1; if ($cfg) { Write-Output ($cfg.IPv4Address.IPAddress + '|' + "
                "$cfg.IPv4DefaultGateway.NextHop + '|' + $cfg.InterfaceAlias) }"
            )
            ps_exe = shutil.which("powershell.exe") or shutil.which("powershell") or "powershell"
            output = subprocess.check_output(
                [ps_exe, "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps_cmd],
                text=True,
                stderr=subprocess.DEVNULL,
                timeout=5,
            )
            line = output.strip()
            if "|" in line:
                ip, gw, iface = line.split("|", 2)
                ip, gw, iface = ip.strip(), gw.strip(), iface.strip()
                if gw not in ("0.0.0.0", "127.0.0.1") and re.match(r"^\d+\.\d+\.\d+\.\d+$", gw):
                    prefix = ip.rsplit(".", 1)[0]
                    return ip, gw, iface or "Wi-Fi", f"{prefix}.0/24"
        except Exception:
            pass

        # 3. Windows ipconfig (multilingual regex)
        try:
            output = subprocess.check_output(["ipconfig"], text=True, stderr=subprocess.DEVNULL, timeout=5)
            blocks = re.split(r"\r?\n(?=[^\s])", output)
            candidate_ip = None
            candidate_iface = None
            candidate_mask = None

            for block in blocks:
                header_match = re.match(r"^([^:\r\n]+):", block)
                adapter_name = header_match.group(1).strip() if header_match else "Ethernet/Wi-Fi"

                ip_match = re.search(r"(?:IPv4|IP|Direcci[oó]n|Adresse)[ .:]*:\s*([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)", block, re.IGNORECASE)
                mask_match = re.search(r"(?:Subnet|Mask|Masque|M[aá]scara)[ .:]*:\s*([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)", block, re.IGNORECASE)
                gw_match = re.search(r"(?:Gateway|Passerelle|Puerta)[ .:]*:[ \t]*\r?\n?[ \t]*([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)", block, re.IGNORECASE)

                if ip_match:
                    ip = ip_match.group(1)
                    mask = mask_match.group(1) if mask_match else "255.255.255.0"
                    if not ip.startswith("127.") and not ip.startswith("169.254."):
                        if gw_match:
                            gw = gw_match.group(1)
                            if gw not in ("0.0.0.0", "127.0.0.1"):
                                try:
                                    cidr = str(ipaddress.IPv4Network(f"{ip}/{mask}", strict=False))
                                except Exception:
                                    cidr = f"{ip.rsplit('.', 1)[0]}.0/24"
                                return ip, gw, adapter_name, cidr
                        elif not candidate_ip:
                            candidate_ip = ip
                            candidate_iface = adapter_name
                            candidate_mask = mask

            if candidate_ip:
                prefix = candidate_ip.rsplit(".", 1)[0]
                gw = f"{prefix}.1"
                try:
                    cidr = str(ipaddress.IPv4Network(f"{candidate_ip}/{candidate_mask or '255.255.255.0'}", strict=False))
                except Exception:
                    cidr = f"{prefix}.0/24"
                return candidate_ip, gw, candidate_iface or "Wi-Fi", cidr
        except Exception:
            pass

        return None, None, None, None

    def detect_network_environment(self) -> Dict[str, Any]:
        """
        Detects active interface, local IP address, default gateway, and subnet mask
        across Windows, Linux, macOS, or custom user overrides.
        """
        detection_source = "fallback"

        # 0. Check custom override from DatabaseEngine settings
        if self.db:
            try:
                settings = self.db.get_settings()
                net_cfg = settings.get("network", {})
                custom_gw = str(net_cfg.get("custom_gateway", "")).strip()
                custom_sub = str(net_cfg.get("custom_subnet", "")).strip()
                custom_iface = str(net_cfg.get("custom_interface", "")).strip()
                auto_detect = net_cfg.get("auto_detect", True)

                if custom_gw and not auto_detect:
                    self.gateway_ip = custom_gw
                    self.subnet_cidr = custom_sub or f"{custom_gw.rsplit('.', 1)[0]}.0/24"
                    self.active_interface = custom_iface or "custom"
                    self.fingerprinter.default_gateway_ip = self.gateway_ip
                    return {
                        "local_ip": self.local_ip,
                        "gateway_ip": self.gateway_ip,
                        "interface": self.active_interface,
                        "subnet_cidr": self.subnet_cidr,
                        "is_loopback": (self.gateway_ip == "127.0.0.1"),
                        "is_custom": True,
                        "detection_source": "user_override",
                    }
            except Exception:
                pass

        detected_ip: Optional[str] = None
        detected_gw: Optional[str] = None
        detected_iface: Optional[str] = None
        detected_cidr: Optional[str] = None

        # 1. Native Windows Detection (ipconfig / route print / PowerShell)
        if os.name == "nt" or shutil.which("ipconfig"):
            win_ip, win_gw, win_iface, win_cidr = self._detect_windows_network()
            if win_gw and win_gw not in ("0.0.0.0", "127.0.0.1"):
                detected_ip = win_ip
                detected_gw = win_gw
                detected_iface = win_iface
                detected_cidr = win_cidr
                detection_source = "windows_ipconfig"

        # 2. Linux /proc/net/route
        if (not detected_gw or detected_gw in ("0.0.0.0", "127.0.0.1")) and os.path.exists("/proc/net/route"):
            try:
                with open("/proc/net/route", "r") as f:
                    lines = f.readlines()
                    for line in lines[1:]:
                        parts = line.strip().split()
                        if len(parts) >= 3 and parts[1] == "00000000":  # Destination 0.0.0.0
                            gw_hex = parts[2]
                            gw_ip = socket.inet_ntoa(struct.pack("<L", int(gw_hex, 16)))
                            if gw_ip and gw_ip not in ("0.0.0.0", "127.0.0.1"):
                                detected_gw = gw_ip
                                detected_iface = parts[0]
                                detection_source = "linux_proc_net_route"
                                break
            except Exception:
                pass

        # 3. Linux / Unix ip route fallback
        if not detected_gw or detected_gw in ("0.0.0.0", "127.0.0.1"):
            try:
                output = subprocess.check_output(["ip", "route", "show", "default"], text=True, stderr=subprocess.DEVNULL)
                match = re.search(r"default via ([\d\.]+) dev (\S+)", output)
                if match and match.group(1) not in ("0.0.0.0", "127.0.0.1"):
                    detected_gw = match.group(1)
                    detected_iface = match.group(2)
                    detection_source = "linux_ip_route"
            except Exception:
                pass

        # 4. macOS route get default
        if not detected_gw or detected_gw in ("0.0.0.0", "127.0.0.1"):
            try:
                output = subprocess.check_output(["route", "-n", "get", "default"], text=True, stderr=subprocess.DEVNULL)
                match_gw = re.search(r"gateway:\s+([\d\.]+)", output)
                match_iface = re.search(r"interface:\s+(\S+)", output)
                if match_gw and match_gw.group(1) not in ("0.0.0.0", "127.0.0.1"):
                    detected_gw = match_gw.group(1)
                    detected_iface = match_iface.group(1) if match_iface else "en0"
                    detection_source = "macos_route"
            except Exception:
                pass

        # 5. Determine local outbound IP via multi-target UDP probe
        if not detected_ip or detected_ip.startswith("127."):
            probe_targets = [("1.1.1.1", 53), ("8.8.8.8", 53), ("9.9.9.9", 53), ("8.8.8.8", 80)]
            for target in probe_targets:
                try:
                    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                        s.settimeout(0.5)
                        s.connect(target)
                        sock_ip = s.getsockname()[0]
                        if not sock_ip.startswith("127.") and sock_ip != "0.0.0.0":
                            detected_ip = sock_ip
                            if detection_source == "fallback":
                                detection_source = "socket_probe"
                            break
                except Exception:
                    pass

        # 6. Hostname resolution fallback for local IP
        if not detected_ip or detected_ip.startswith("127."):
            try:
                hostname = socket.gethostname()
                for ip in socket.gethostbyname_ex(hostname)[2]:
                    if not ip.startswith("127.") and not ip.startswith("169.254.") and "." in ip:
                        detected_ip = ip
                        if detection_source == "fallback":
                            detection_source = "host_resolution"
                        break
            except Exception:
                pass

        # Default local IP to 127.0.0.1 if completely undetected
        self.local_ip = detected_ip or "127.0.0.1"

        # 7. Gateway Resolution & Smart Heuristic Fallback
        if detected_gw and detected_gw not in ("0.0.0.0", "127.0.0.1"):
            self.gateway_ip = detected_gw
        elif self.local_ip and not self.local_ip.startswith("127.") and not self.local_ip.startswith("169.254."):
            # Common residential/enterprise default router is .1 on same subnet
            self.gateway_ip = self.local_ip.rsplit(".", 1)[0] + ".1"
            detection_source = "heuristic_subnet_router"
        else:
            self.gateway_ip = FALLBACK_GATEWAY

        self.active_interface = detected_iface or ("Wi-Fi" if os.name == "nt" else "eth0")
        self.fingerprinter.default_gateway_ip = self.gateway_ip

        # 8. Determine Subnet CIDR
        if not detected_cidr:
            if detected_iface:
                try:
                    output = subprocess.check_output(["ip", "-4", "addr", "show", detected_iface], text=True, stderr=subprocess.DEVNULL)
                    match = re.search(r"inet ([\d\.]+)/(\d+)", output)
                    if match:
                        detected_cidr = str(ipaddress.IPv4Network(f"{match.group(1)}/{match.group(2)}", strict=False))
                except Exception:
                    pass

            if not detected_cidr:
                if self.local_ip.startswith("127."):
                    detected_cidr = FALLBACK_SUBNET
                else:
                    prefix = self.local_ip.rsplit(".", 1)[0]
                    detected_cidr = f"{prefix}.0/24"

        self.subnet_cidr = detected_cidr

        return {
            "local_ip": self.local_ip,
            "gateway_ip": self.gateway_ip,
            "interface": self.active_interface,
            "subnet_cidr": self.subnet_cidr,
            "is_loopback": (self.gateway_ip == "127.0.0.1"),
            "is_custom": False,
            "detection_source": detection_source,
        }

    def get_all_network_devices(self) -> Dict[str, Any]:
        """
        Comprehensive discovery of all network devices/adapters across Linux and Windows.
        Extracts each adapter's name, description, MAC, operational status, IPv4 addresses,
        associated gateways, and subnet CIDRs.
        Identifies all gateways and all subnets across all network devices.
        """
        devices_map: Dict[str, Dict[str, Any]] = {}
        all_gateways: Set[str] = set()
        all_subnets_map: Dict[str, Dict[str, Any]] = {}

        # 1. WINDOWS: PowerShell Get-NetIPConfiguration & Get-NetAdapter
        if os.name == "nt" or shutil.which("powershell.exe") or shutil.which("powershell"):
            try:
                ps_exe = shutil.which("powershell.exe") or shutil.which("powershell") or "powershell"
                ps_cmd = (
                    "Get-NetIPConfiguration -ErrorAction SilentlyContinue | ForEach-Object { "
                    "$alias = $_.InterfaceAlias; "
                    "$desc = $_.InterfaceDescription; "
                    "$mac = if ($_.NetAdapter) { $_.NetAdapter.MacAddress } else { '' }; "
                    "$status = if ($_.NetAdapter) { $_.NetAdapter.Status } else { 'Up' }; "
                    "$ips = ($_.IPv4Address | ForEach-Object { $_.IPAddress + '/' + $_.PrefixLength }) -join ','; "
                    "$gws = ($_.IPv4DefaultGateway | ForEach-Object { $_.NextHop }) -join ','; "
                    "Write-Output \"$alias|$desc|$ips|$gws|$mac|$status\" }"
                )
                output = subprocess.check_output(
                    [ps_exe, "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps_cmd],
                    text=True,
                    stderr=subprocess.DEVNULL,
                    timeout=6,
                )
                for line in output.splitlines():
                    if "|" in line:
                        parts = line.strip().split("|")
                        if len(parts) >= 6:
                            alias, desc, ips_str, gws_str, mac, status = parts[0], parts[1], parts[2], parts[3], parts[4], parts[5]
                            alias = alias.strip()
                            if not alias:
                                continue
                            ips_list = [ip.strip() for ip in ips_str.split(",") if ip.strip()]
                            gws_list = [gw.strip() for gw in gws_str.split(",") if gw.strip() and gw.strip() not in ("0.0.0.0", "127.0.0.1")]
                            
                            subnets_list = []
                            for ip_pfx in ips_list:
                                try:
                                    net = str(ipaddress.IPv4Network(ip_pfx, strict=False))
                                    if not net.startswith("127.") and not net.startswith("169.254."):
                                        subnets_list.append(net)
                                except Exception:
                                    pass

                            is_wifi = "wi-fi" in alias.lower() or "wireless" in desc.lower() or "802.11" in desc.lower()
                            dev_type = "wireless" if is_wifi else ("loopback" if "loopback" in desc.lower() else "ethernet")

                            for gw in gws_list:
                                all_gateways.add(gw)

                            devices_map[alias] = {
                                "id": alias,
                                "name": alias,
                                "description": desc or alias,
                                "type": dev_type,
                                "mac": mac.strip().upper(),
                                "status": "up" if status.lower() == "up" else status.lower(),
                                "ips": [ip.split("/")[0] for ip in ips_list if not ip.startswith("127.") and not ip.startswith("169.254.")],
                                "subnets": subnets_list,
                                "gateways": gws_list,
                                "is_primary": (alias == self.active_interface or any(s == self.subnet_cidr for s in subnets_list)),
                            }
            except Exception:
                pass

        # 2. WINDOWS: ipconfig /all fallback parser
        if (os.name == "nt" or shutil.which("ipconfig")) and len(devices_map) == 0:
            try:
                output = subprocess.check_output(["ipconfig", "/all"], text=True, stderr=subprocess.DEVNULL, timeout=6)
                blocks = re.split(r"\r?\n(?=[^\s])", output)
                for block in blocks:
                    header_m = re.match(r"^([^:\r\n]+):", block)
                    if not header_m:
                        continue
                    iface_name = header_m.group(1).strip()
                    desc_m = re.search(r"Description[ .:]*:\s*(.+)", block, re.IGNORECASE)
                    phys_m = re.search(r"Physical Address[ .:]*:\s*([0-9a-fA-F\-]{17})", block, re.IGNORECASE)
                    ip_matches = re.findall(r"(?:IPv4|IP|Direcci[oó]n|Adresse)[ .:]*:\s*([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)", block, re.IGNORECASE)
                    mask_m = re.search(r"(?:Subnet|Mask|Masque|M[aá]scara)[ .:]*:\s*([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)", block, re.IGNORECASE)
                    gw_matches = re.findall(r"(?:Gateway|Passerelle|Puerta)[ .:]*:[ \t]*\r?\n?[ \t]*([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)", block, re.IGNORECASE)

                    desc = desc_m.group(1).strip() if desc_m else iface_name
                    mac = phys_m.group(1).replace("-", ":").upper() if phys_m else ""
                    mask = mask_m.group(1).strip() if mask_m else "255.255.255.0"
                    
                    ips = [ip for ip in ip_matches if not ip.startswith("127.") and not ip.startswith("169.254.")]
                    gws = [gw for gw in gw_matches if gw not in ("0.0.0.0", "127.0.0.1")]
                    
                    subnets = []
                    for ip in ips:
                        try:
                            net = str(ipaddress.IPv4Network(f"{ip}/{mask}", strict=False))
                            subnets.append(net)
                        except Exception:
                            pass

                    for gw in gws:
                        all_gateways.add(gw)

                    if ips or gws or mac:
                        is_wifi = "wi-fi" in iface_name.lower() or "wireless" in desc.lower()
                        devices_map[iface_name] = {
                            "id": iface_name,
                            "name": iface_name,
                            "description": desc,
                            "type": "wireless" if is_wifi else "ethernet",
                            "mac": mac,
                            "status": "up" if ips else "disconnected",
                            "ips": ips,
                            "subnets": subnets,
                            "gateways": gws,
                            "is_primary": (iface_name == self.active_interface or any(s == self.subnet_cidr for s in subnets)),
                        }
            except Exception:
                pass

        # 3. WINDOWS route print 0.0.0.0 (Identify all gateways & map to interfaces)
        if os.name == "nt" or shutil.which("route"):
            try:
                output = subprocess.check_output(["route", "print", "0.0.0.0"], text=True, stderr=subprocess.DEVNULL, timeout=4)
                for line in output.splitlines():
                    match = re.search(r"0\.0\.0\.0\s+0\.0\.0\.0\s+([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\s+([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)", line)
                    if match:
                        gw_ip = match.group(1).strip()
                        iface_ip = match.group(2).strip()
                        if gw_ip not in ("0.0.0.0", "127.0.0.1"):
                            all_gateways.add(gw_ip)
                            # Associate with existing device matching iface_ip
                            for dev in devices_map.values():
                                if iface_ip in dev["ips"] and gw_ip not in dev["gateways"]:
                                    dev["gateways"].append(gw_ip)
            except Exception:
                pass

        # 4. LINUX: ip -4 addr show & ip route show
        try:
            addr_out = subprocess.check_output(["ip", "addr", "show"], text=True, stderr=subprocess.DEVNULL, timeout=5)
            cur_dev: Optional[str] = None
            
            for line in addr_out.splitlines():
                iface_m = re.match(r"^\d+:\s+([^:@]+)", line)
                if iface_m:
                    cur_dev = iface_m.group(1).strip()
                    if cur_dev not in devices_map:
                        is_lo = (cur_dev == "lo")
                        is_wlan = "wl" in cur_dev or "wifi" in cur_dev
                        devices_map[cur_dev] = {
                            "id": cur_dev,
                            "name": cur_dev,
                            "description": f"Linux Adapter {cur_dev}",
                            "type": "loopback" if is_lo else ("wireless" if is_wlan else "ethernet"),
                            "mac": "",
                            "status": "up",
                            "ips": [],
                            "subnets": [],
                            "gateways": [],
                            "is_primary": (cur_dev == self.active_interface),
                        }

                if cur_dev and cur_dev in devices_map:
                    # MAC address
                    mac_m = re.search(r"link/ether\s+([0-9a-fA-F:]{17})", line)
                    if mac_m:
                        devices_map[cur_dev]["mac"] = mac_m.group(1).upper()

                    # Operational state
                    if "state DOWN" in line:
                        devices_map[cur_dev]["status"] = "down"
                    elif "state UP" in line or "UP" in line:
                        devices_map[cur_dev]["status"] = "up"

                    # IPv4 address and CIDR prefix
                    inet_m = re.search(r"inet\s+([\d\.]+)/(\d+)", line)
                    if inet_m:
                        ip_val = inet_m.group(1)
                        pfx_val = inet_m.group(2)
                        devices_map[cur_dev]["ips"].append(ip_val)
                        try:
                            net_str = str(ipaddress.IPv4Network(f"{ip_val}/{pfx_val}", strict=False))
                            if net_str not in devices_map[cur_dev]["subnets"]:
                                devices_map[cur_dev]["subnets"].append(net_str)
                        except Exception:
                            pass

            # Linux routes to identify gateways for each interface
            route_out = subprocess.check_output(["ip", "route", "show"], text=True, stderr=subprocess.DEVNULL, timeout=4)
            for line in route_out.splitlines():
                gw_m = re.search(r"default via ([\d\.]+) dev (\S+)", line)
                if gw_m:
                    gw_ip = gw_m.group(1).strip()
                    dev_name = gw_m.group(2).strip()
                    if gw_ip not in ("0.0.0.0", "127.0.0.1"):
                        all_gateways.add(gw_ip)
                        if dev_name in devices_map and gw_ip not in devices_map[dev_name]["gateways"]:
                            devices_map[dev_name]["gateways"].append(gw_ip)
        except Exception:
            pass

        # 5. Linux /proc/net/route fallback for gateways
        if os.path.exists("/proc/net/route"):
            try:
                with open("/proc/net/route", "r") as f:
                    lines = f.readlines()
                    for line in lines[1:]:
                        parts = line.strip().split()
                        if len(parts) >= 3 and parts[1] == "00000000":
                            gw_hex = parts[2]
                            gw_ip = socket.inet_ntoa(struct.pack("<L", int(gw_hex, 16)))
                            iface = parts[0]
                            if gw_ip and gw_ip not in ("0.0.0.0", "127.0.0.1"):
                                all_gateways.add(gw_ip)
                                if iface in devices_map and gw_ip not in devices_map[iface]["gateways"]:
                                    devices_map[iface]["gateways"].append(gw_ip)
            except Exception:
                pass

        # 6. Fallback / Hostname resolution: Ensure at least active interface and primary IP exist
        if not devices_map or all(len(d["ips"]) == 0 for d in devices_map.values() if d["id"] != "lo"):
            try:
                hostname = socket.gethostname()
                for ip_val in socket.gethostbyname_ex(hostname)[2]:
                    if not ip_val.startswith("127.") and not ip_val.startswith("169.254.") and "." in ip_val:
                        pfx = ip_val.rsplit(".", 1)[0]
                        sub_cidr = f"{pfx}.0/24"
                        gw_ip = f"{pfx}.1"
                        all_gateways.add(gw_ip)
                        devices_map[self.active_interface or "eth0"] = {
                            "id": self.active_interface or "eth0",
                            "name": self.active_interface or "eth0",
                            "description": f"Host Adapter ({self.active_interface})",
                            "type": "ethernet",
                            "mac": self._get_local_mac() or "02:00:00:00:00:01",
                            "status": "up",
                            "ips": [ip_val],
                            "subnets": [sub_cidr],
                            "gateways": [gw_ip],
                            "is_primary": True,
                        }
                        break
            except Exception:
                pass

        # Ensure primary gateway is in all_gateways
        if self.gateway_ip and self.gateway_ip not in ("0.0.0.0", "127.0.0.1"):
            all_gateways.add(self.gateway_ip)

        # 7. Aggregate all subnets mapped to their device and gateway
        for dev_name, dev in devices_map.items():
            dev_gw = dev["gateways"][0] if dev["gateways"] else (self.gateway_ip or "192.168.1.1")
            for sub in dev["subnets"]:
                if sub not in all_subnets_map:
                    is_prim = (sub == self.subnet_cidr or dev.get("is_primary", False))
                    all_subnets_map[sub] = {
                        "cidr": sub,
                        "interface": dev_name,
                        "gateway": dev_gw,
                        "is_primary": is_prim,
                        "label": f"{dev_name} ({sub})",
                        "recommended": True,
                        "device_type": dev.get("type", "ethernet"),
                    }

        # Add primary detected subnet if not already in map
        if self.subnet_cidr and self.subnet_cidr not in all_subnets_map:
            all_subnets_map[self.subnet_cidr] = {
                "cidr": self.subnet_cidr,
                "interface": self.active_interface,
                "gateway": self.gateway_ip or "192.168.1.1",
                "is_primary": True,
                "label": f"Primary Active ({self.active_interface})",
                "recommended": True,
                "device_type": "ethernet",
            }

        # User-configured custom subnet
        if self.db:
            try:
                settings = self.db.get_settings()
                custom_sub = str(settings.get("network", {}).get("custom_subnet", "")).strip()
                custom_gw = str(settings.get("network", {}).get("custom_gateway", "")).strip()
                if custom_sub and custom_sub not in all_subnets_map:
                    all_subnets_map[custom_sub] = {
                        "cidr": custom_sub,
                        "interface": "user-configured",
                        "gateway": custom_gw or (self.gateway_ip or "192.168.1.1"),
                        "is_primary": True,
                        "label": f"Configured Subnet ({custom_sub})",
                        "recommended": True,
                        "device_type": "custom",
                    }
            except Exception:
                pass

        # Standard LAN presets
        common_candidates = [
            ("192.168.1.0/24", "192.168.1.1", "Standard Residential LAN (192.168.1.0/24)", True),
            ("192.168.0.0/24", "192.168.0.1", "TP-Link / Netgear / D-Link LAN (192.168.0.0/24)", True),
            ("10.0.0.0/24", "10.0.0.1", "Xfinity / Comcast / AT&T Fiber LAN (10.0.0.0/24)", False),
            ("192.168.50.0/24", "192.168.50.1", "ASUS RT / ROG Router LAN (192.168.50.0/24)", False),
            ("192.168.86.0/24", "192.168.86.1", "Google Nest Wifi / Google Fiber (192.168.86.0/24)", False),
        ]
        for cidr, gw, label, is_rec in common_candidates:
            if cidr not in all_subnets_map:
                all_subnets_map[cidr] = {
                    "cidr": cidr,
                    "interface": "virtual/preset",
                    "gateway": gw,
                    "is_primary": False,
                    "label": label,
                    "recommended": is_rec,
                    "device_type": "preset",
                }

        # Convert to list and ensure primary is marked correctly
        device_list = list(devices_map.values())
        device_list.sort(key=lambda d: (not d.get("is_primary", False), d["name"] == "lo", d["name"]))

        subnets_list = list(all_subnets_map.values())
        subnets_list.sort(key=lambda s: (not s.get("is_primary", False), not s.get("recommended", False), s["cidr"]))

        return {
            "devices": device_list,
            "all_gateways": sorted(list(all_gateways)),
            "all_subnets": subnets_list,
            "active_interface": self.active_interface,
            "primary_gateway": self.gateway_ip,
            "primary_subnet": self.subnet_cidr,
        }

    def get_all_known_subnets(self) -> List[Dict[str, Any]]:
        """
        Discovers all known and routable subnets on the system, including primary,
        secondary network interfaces, and common local network ranges.
        """
        topology = self.get_all_network_devices()
        return topology.get("all_subnets", [])


    def _read_kernel_arp_cache(self) -> Dict[str, str]:
        """Reads /proc/net/arp, `ip neigh`, and `arp -a` to get current IP->MAC mappings."""
        ip_mac_map: Dict[str, str] = {}

        # 1. Linux /proc/net/arp
        if os.path.exists("/proc/net/arp"):
            try:
                with open("/proc/net/arp", "r") as f:
                    lines = f.readlines()
                    for line in lines[1:]:
                        parts = line.strip().split()
                        if len(parts) >= 4:
                            ip = parts[0]
                            mac = parts[3].upper()
                            if mac and mac not in ("00:00:00:00:00:00", "FF:FF:FF:FF:FF:FF"):
                                ip_mac_map[ip] = mac
            except Exception:
                pass

        # 2. Linux ip neigh show
        try:
            output = subprocess.check_output(["ip", "neigh", "show"], text=True, stderr=subprocess.DEVNULL)
            for line in output.splitlines():
                parts = line.strip().split()
                if len(parts) >= 5 and "lladdr" in parts:
                    idx = parts.index("lladdr")
                    if idx + 1 < len(parts):
                        ip = parts[0]
                        mac = parts[idx + 1].upper()
                        if mac and mac not in ("00:00:00:00:00:00", "FF:FF:FF:FF:FF:FF"):
                            ip_mac_map[ip] = mac
        except Exception:
            pass

        # 3. Cross-platform / Windows arp -a
        try:
            output = subprocess.check_output(["arp", "-a"], text=True, stderr=subprocess.DEVNULL)
            for line in output.splitlines():
                match = re.search(r"(\d+\.\d+\.\d+\.\d+)\s+([0-9a-fA-F[:-]{11,17})", line)
                if match:
                    ip = match.group(1)
                    mac = match.group(2).replace("-", ":").upper()
                    if (
                        mac not in ("FF:FF:FF:FF:FF:FF", "00:00:00:00:00:00")
                        and not ip.startswith("224.")
                        and not ip.startswith("239.")
                        and not ip.endswith(".255")
                    ):
                        ip_mac_map[ip] = mac
        except Exception:
            pass

        return ip_mac_map

    def _ping_ip(self, ip: str, timeout: float = 0.15) -> Optional[Tuple[str, float]]:
        """Quick multi-port TCP probe to provoke ARP resolution and detect active host."""
        t_start = time.perf_counter()
        # Probe standard responsive ports: 80 (HTTP), 445 (SMB), 135 (RPC), 53 (DNS)
        for probe_port in (80, 445, 135, 53):
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.settimeout(timeout)
                    ret = s.connect_ex((ip, probe_port))
                    # 0 = Connected, 111/10061/61 = Port Refused (device exists & actively returned RST packet)
                    if ret in (0, 111, 10061, 61):
                        latency = max(0.5, (time.perf_counter() - t_start) * 1000.0)
                        return ip, latency
            except Exception:
                pass
        return None

    def scan_scapy_arp(self, subnet: str) -> List[Dict[str, Any]]:
        """Scans subnet using Scapy raw ARP packets if root privileges and raw sockets are available."""
        results: List[Dict[str, Any]] = []
        try:
            import logging
            import sys
            import io
            # Suppress scapy runtime logs
            logging.getLogger("scapy.runtime").setLevel(logging.CRITICAL)
            logging.getLogger("scapy.loading").setLevel(logging.CRITICAL)

            from scapy.all import Ether, ARP, srp, conf
            conf.verb = 0
            conf.logLevel = logging.CRITICAL

            # Redirect stderr temporarily to avoid gVisor raw socket noise
            old_stderr = sys.stderr
            sys.stderr = io.StringIO()
            try:
                ans, _ = srp(
                    Ether(dst="ff:ff:ff:ff:ff:ff") / ARP(pdst=subnet),
                    timeout=DEFAULT_DISCOVERY_TIMEOUT,
                    iface=self.active_interface,
                    retry=0,
                )
            finally:
                sys.stderr = old_stderr

            for sent, received in ans:
                ip = received.psrc
                mac = received.hwsrc.upper()
                results.append({
                    "ip": ip,
                    "mac": mac,
                    "latency_ms": 1.2,
                })
        except Exception:
            # Raw socket failed or not permitted
            pass
        return results

    def scan_nmap(self, subnet: str) -> List[Dict[str, Any]]:
        """Scans subnet using python-nmap if nmap binary is available."""
        results: List[Dict[str, Any]] = []
        try:
            import nmap
            nm = nmap.PortScanner()
            nm.scan(hosts=subnet, arguments="-sn -n -T4 --min-rate 300")
            for host in nm.all_hosts():
                mac = nm[host].get("addresses", {}).get("mac", "")
                if not mac:
                    # check arp cache
                    mac = self._read_kernel_arp_cache().get(host, "")
                results.append({
                    "ip": host,
                    "mac": mac.upper() if mac else "",
                    "latency_ms": 1.5,
                })
        except Exception:
            pass
        return results

    def scan_active_sweep(self, subnet: str) -> List[Dict[str, Any]]:
        """
        Fast concurrent sweep of subnet addresses to trigger ARP discovery.
        Works across unprivileged Windows hosts, containers, and restricted environments.
        """
        results: List[Dict[str, Any]] = []
        try:
            net = ipaddress.IPv4Network(subnet, strict=False)
            hosts = [str(h) for h in net.hosts()]
            if len(hosts) > 254:
                hosts = hosts[:254]
        except Exception:
            hosts = [self.local_ip]
            net = None

        active_probed: Dict[str, float] = {}

        # Concurrently probe hosts to populate kernel ARP table
        with ThreadPoolExecutor(max_workers=60) as executor:
            future_to_ip = {executor.submit(self._ping_ip, h, 0.25): h for h in hosts}
            for f in as_completed(future_to_ip):
                res = f.result()
                if res:
                    active_probed[res[0]] = res[1]

        # Read updated ARP table
        arp_cache = self._read_kernel_arp_cache()

        # 1. Add all IPs from ARP cache that belong to this subnet
        for ip, mac in arp_cache.items():
            try:
                if net is None or ipaddress.IPv4Address(ip) in net:
                    results.append({
                        "ip": ip,
                        "mac": mac,
                        "latency_ms": active_probed.get(ip, 1.8),
                    })
            except Exception:
                pass

        # 2. Add any hosts that responded to TCP probe even if not yet in ARP table
        for ip, lat in active_probed.items():
            if ip not in [r["ip"] for r in results]:
                mac = arp_cache.get(ip)
                if not mac:
                    last_octet = ip.split(".")[-1] if "." in ip else "1"
                    mac = f"02:00:00:00:00:{int(last_octet):02X}"
                results.append({
                    "ip": ip,
                    "mac": mac,
                    "latency_ms": lat,
                })

        # 3. Ensure local machine is present if in this subnet
        try:
            if net is None or ipaddress.IPv4Address(self.local_ip) in net:
                if self.local_ip not in [r["ip"] for r in results]:
                    local_mac = self._get_local_mac() or "02:00:00:00:00:01"
                    results.append({
                        "ip": self.local_ip,
                        "mac": local_mac.upper(),
                        "latency_ms": 0.1,
                    })
        except Exception:
            pass

        # 4. Ensure gateway is present if it belongs to this subnet
        if self.gateway_ip and self.gateway_ip not in [r["ip"] for r in results]:
            try:
                if net is None or ipaddress.IPv4Address(self.gateway_ip) in net:
                    results.append({
                        "ip": self.gateway_ip,
                        "mac": arp_cache.get(self.gateway_ip, "02:00:00:00:00:FE"),
                        "latency_ms": 1.0,
                    })
            except Exception:
                pass

        return results

    def mac_to_ipv6(self, mac: str, prefix: Optional[str] = None) -> str:
        """
        Calculates the standard RFC 4291 EUI-64 Link-Local or Global SLAAC IPv6 address
        from a device 48-bit MAC address.
        """
        clean = mac.replace(":", "").replace("-", "").strip().lower()
        if len(clean) != 12:
            return ""
        try:
            b0 = int(clean[0:2], 16) ^ 0x02
            eui64 = f"{b0:02x}{clean[2:4]}:{clean[4:6]}ff:fe{clean[6:8]}:{clean[8:12]}"
            if not prefix:
                prefix = "fe80::"
            if prefix.endswith("::"):
                return f"{prefix}{eui64}"
            elif prefix.endswith(":"):
                return f"{prefix}{eui64}"
            else:
                return f"{prefix}::{eui64}"
        except Exception:
            return ""

    def scan_ipv6_neighbors(self) -> Dict[str, str]:
        """
        Discovers IPv6 neighbors and addresses on local link:
        1. Inspects /proc/net/if_inet6 and system interfaces for active IPv6 prefixes.
        2. Inspects kernel IPv6 neighbor cache (ip -6 neigh show or ndp -a).
        3. Returns mapping of {MAC_UPPER: IPV6_ADDRESS}.
        """
        ipv6_map: Dict[str, str] = {}
        detected_global_prefix: Optional[str] = None

        # 1. Discover local interface IPv6 addresses & global prefixes
        try:
            # Check Linux /proc/net/if_inet6
            if os.path.exists("/proc/net/if_inet6"):
                with open("/proc/net/if_inet6", "r") as f:
                    for line in f:
                        parts = line.strip().split()
                        if len(parts) >= 6:
                            raw_ip = parts[0]
                            scope = parts[3] # 00 is global, 20 is link
                            if len(raw_ip) == 32 and scope == "00":
                                # Global or ULA unicast address
                                formatted = ":".join([raw_ip[i:i+4] for i in range(0, 32, 4)])
                                try:
                                    ip_obj = ipaddress.IPv6Address(formatted)
                                    # Grab first 4 blocks (/64 prefix)
                                    prefix_blocks = formatted.split(":")[:4]
                                    detected_global_prefix = ":".join(prefix_blocks) + ":"
                                except Exception:
                                    pass
        except Exception:
            pass

        # 2. Query kernel neighbor cache via `ip -6 neigh show` or Windows 11 `netsh` / PowerShell
        try:
            if sys.platform == "win32" or shutil.which("netsh"):
                # Windows 11: netsh interface ipv6 show neighbors
                proc_win = subprocess.run(["netsh", "interface", "ipv6", "show", "neighbors"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=2.5)
                if proc_win.returncode == 0 and proc_win.stdout:
                    for line in proc_win.stdout.splitlines():
                        # Match: <IPv6> <MAC with dashes or colons>
                        m = re.search(r"([a-fA-F0-9:]+)\s+([a-fA-F0-9]{2}[-:][a-fA-F0-9]{2}[-:][a-fA-F0-9]{2}[-:][a-fA-F0-9]{2}[-:][a-fA-F0-9]{2}[-:][a-fA-F0-9]{2})", line.strip())
                        if m:
                            n_ip, n_mac = m.group(1), m.group(2).replace("-", ":").upper()
                            if not n_ip.startswith("fe80"):
                                ipv6_map[n_mac] = n_ip
                            elif n_mac not in ipv6_map:
                                ipv6_map[n_mac] = n_ip

                # Windows 11 PowerShell Get-NetNeighbor fallback
                if not ipv6_map and shutil.which("powershell"):
                    ps_cmd = "Get-NetNeighbor -AddressFamily IPv6 | Where-Object { $_.LinkLayerAddress } | ForEach-Object { \"$($_.IPAddress) $($_.LinkLayerAddress)\" }"
                    proc_ps = subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=3.0)
                    if proc_ps.returncode == 0 and proc_ps.stdout:
                        for line in proc_ps.stdout.splitlines():
                            parts = line.strip().split()
                            if len(parts) >= 2 and ":" in parts[0]:
                                n_ip, n_mac = parts[0], parts[1].replace("-", ":").upper()
                                if len(n_mac) == 17:
                                    if not n_ip.startswith("fe80"):
                                        ipv6_map[n_mac] = n_ip
                                    elif n_mac not in ipv6_map:
                                        ipv6_map[n_mac] = n_ip
        except Exception:
            pass

        # Linux / Unix: `ip -6 neigh show`
        try:
            cmd = ["ip", "-6", "neigh", "show"]
            proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=2.0)
            if proc.returncode == 0 and proc.stdout:
                # Format: 2001:db8::1 dev eth0 lladdr 00:11:22:33:44:55 REACHABLE
                for line in proc.stdout.splitlines():
                    match = re.search(r"^([a-fA-F0-9:]+)\s+dev\s+\S+\s+lladdr\s+([a-fA-F0-9:]{17})", line.strip())
                    if match:
                        n_ip, n_mac = match.group(1), match.group(2).upper()
                        if not n_ip.startswith("fe80"):
                            ipv6_map[n_mac] = n_ip
                        elif n_mac not in ipv6_map:
                            ipv6_map[n_mac] = n_ip
        except Exception:
            pass

        # On macOS fallback: ndp -a
        if not ipv6_map:
            try:
                proc = subprocess.run(["ndp", "-a", "-n"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=2.0)
                if proc.returncode == 0 and proc.stdout:
                    for line in proc.stdout.splitlines():
                        match = re.search(r"^([a-fA-F0-9:]+)\s+([a-fA-F0-9:]{17})", line.strip())
                        if match:
                            n_ip, n_mac = match.group(1), match.group(2).upper()
                            ipv6_map[n_mac] = n_ip
            except Exception:
                pass

        # 3. For the local interface, add its own IPv6
        try:
            local_mac = self._get_local_mac()
            if local_mac:
                local_mac_upper = local_mac.strip().upper()
                if local_mac_upper not in ipv6_map:
                    if detected_global_prefix:
                        ipv6_map[local_mac_upper] = self.mac_to_ipv6(local_mac_upper, detected_global_prefix)
                    else:
                        ipv6_map[local_mac_upper] = self.mac_to_ipv6(local_mac_upper, "fe80::")
        except Exception:
            pass

        return ipv6_map

    def _get_local_mac(self) -> Optional[str]:
        """Finds MAC address of active interface."""
        try:
            sys_mac_path = f"/sys/class/net/{self.active_interface}/address"
            if os.path.exists(sys_mac_path):
                with open(sys_mac_path, "r") as f:
                    return f.read().strip()
        except Exception:
            pass
        return None

    def discover(self, subnet_override: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Executes complete discovery workflow:
        1. Runs Scapy ARP sweep (or falls back to Nmap / active probe).
        2. Probes IPv6 Neighbor Discovery (NDP / EUI-64 / SLAAC).
        3. Enriches with fingerprinted vendor, hostname, and device type.
        4. Persists records to database with first_seen / last_seen timestamps and dual-stack IPv4/IPv6.
        5. Detects new devices and logs alerts.
        """
        target_subnet = str(subnet_override or self.subnet_cidr or FALLBACK_SUBNET).strip()
        if target_subnet:
            if "/" not in target_subnet:
                parts = target_subnet.split(".")
                if len(parts) >= 3:
                    target_subnet = f"{parts[0]}.{parts[1]}.{parts[2]}.0/24"
        def emit_status(stage: str, message: str, percent: int, found: int = 0):
            try:
                line = json.dumps({"stage": stage, "message": message, "percent": percent, "devices_found": found})
                print(f"STATUS:{line}", flush=True)
            except Exception:
                pass

        emit_status("init", f"Initializing discovery sweep on subnet {target_subnet}...", 15)
        raw_hosts: List[Dict[str, Any]] = []

        # Attempt 1: Scapy ARP Ping (fastest raw packet sweep)
        raw_hosts = self.scan_scapy_arp(target_subnet)

        # Attempt 2: Nmap host sweep if scapy yielded empty (e.g. non-root)
        if not raw_hosts:
            emit_status("probing", f"Probing active IP addresses across {target_subnet} (Nmap/Active probe)...", 40)
            raw_hosts = self.scan_nmap(target_subnet)

        # Attempt 3: Active sweep + kernel ARP inspection
        if not raw_hosts:
            emit_status("probing", f"Probing active IP addresses across {target_subnet} (Concurrent ICMP/TCP)...", 50)
            raw_hosts = self.scan_active_sweep(target_subnet)

        # Step 1.5: IPv6 Neighbor Discovery & Dual-Stack Inspection
        emit_status("ipv6", f"Scanning IPv6 neighbor table and SLAAC/EUI-64 address mappings...", 65)
        ipv6_map = self.scan_ipv6_neighbors()

        # Deduplicate by IP and ensure MAC exists
        seen_ips: set = set()
        deduped: List[Dict[str, Any]] = []
        for h in raw_hosts:
            ip = h["ip"]
            if ip in seen_ips:
                continue
            seen_ips.add(ip)

            mac = h.get("mac", "").strip().upper()
            if not mac or mac == "00:00:00:00:00:00":
                # Generate synthetic stable locally administered MAC if kernel didn't supply one
                last_octet = ip.split(".")[-1] if "." in ip else "1"
                mac = f"02:00:00:00:00:{int(last_octet):02X}"

            deduped.append({
                "ip": ip,
                "mac": mac,
                "latency_ms": h.get("latency_ms", 1.0),
            })

        emit_status("fingerprinting", f"Resolving hostnames, IPv6 stack, and OUI vendors for {len(deduped)} host(s)...", 75, len(deduped))

        # Enrich with Fingerprinting & IPv6
        enriched_devices: List[Dict[str, Any]] = []
        for host in deduped:
            ip = host["ip"]
            mac = host["mac"]
            fp = self.fingerprinter.fingerprint(ip=ip, mac=mac)

            # Resolve IPv6: use neighbor table address or compute EUI-64 link-local address
            device_ipv6 = ipv6_map.get(mac)
            if not device_ipv6:
                device_ipv6 = self.mac_to_ipv6(mac)

            device_record = {
                "mac": mac,
                "ip": ip,
                "ipv6": device_ipv6,
                "hostname": fp["hostname"],
                "vendor": fp["vendor"],
                "device_type": fp["device_type"],
                "latency_ms": host["latency_ms"],
            }

            if self.db:
                result = self.db.upsert_device(
                    mac=mac,
                    ip=ip,
                    hostname=fp["hostname"],
                    vendor=fp["vendor"],
                    device_type=fp["device_type"],
                    latency_ms=host["latency_ms"],
                    ipv6=device_ipv6,
                )
                device_data = result["device"]
                device_record.update({
                    "nickname": device_data.get("nickname", ""),
                    "is_known": device_data.get("is_known", 0),
                    "is_trusted": device_data.get("is_trusted", 0),
                    "first_seen": device_data.get("first_seen", ""),
                    "last_seen": device_data.get("last_seen", ""),
                    "status": "online",
                    "is_new": result["is_new"],
                })

                # Check for intruder / new device alert
                if result["is_new"]:
                    self.db.log_alert(
                        alert_type="NEW_DEVICE",
                        message=f"New device detected on network: {ip} [{mac}] ({fp['vendor']})",
                        mac=mac,
                        ip=ip,
                        severity="WARNING",
                    )
            else:
                device_record["status"] = "online"
                device_record["is_new"] = False

            enriched_devices.append(device_record)

        # Mark unseen devices in DB as offline
        if self.db:
            active_macs = [d["mac"] for d in enriched_devices]
            self.db.mark_offline_missing(active_macs)

        return enriched_devices
