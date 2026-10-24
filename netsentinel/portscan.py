"""
NetSentinel High-Performance Multi-Threaded Port Scanning & Service Audit Engine.
Performs concurrent TCP connect scans on target ports with worker thread pool,
banner grabbing, service identification, and security risk classification.
Optimized for high-throughput sweeps across up to 65,535 ports with configurable threads.
"""

import json
import re
import socket
import ssl
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Dict, List, Optional, Set, Tuple

from .config import DEFAULT_SCAN_PORTS, KNOWN_SERVICES, DEFAULT_TIMEOUT_SOCKET
from .db import DatabaseEngine


class PortScanEngine:
    """High-performance multi-threaded port scanner and service auditor."""

    def __init__(self, db: Optional[DatabaseEngine] = None, timeout: float = DEFAULT_TIMEOUT_SOCKET):
        self.db = db
        self.timeout = timeout

    def _get_configured_threads(self, override_threads: Optional[int] = None) -> int:
        """Retrieves user-configured thread setting or returns optimal default."""
        if override_threads and override_threads > 0:
            return min(max(override_threads, 5), 1000)
        if self.db:
            try:
                settings = self.db.get_settings()
                threads = settings.get("threads", {}).get("port_scan_threads")
                if threads:
                    return min(max(int(threads), 5), 1000)
            except Exception:
                pass
        return 100

    def grab_banner(self, ip: str, port: int, timeout: Optional[float] = None) -> str:
        """Attempts to retrieve application banner from open port."""
        banner_timeout = timeout or self.timeout
        banner = ""
        try:
            if port in (443, 8443):
                # TLS / HTTPS banner grabbing
                context = ssl.create_default_context()
                context.check_hostname = False
                context.verify_mode = ssl.CERT_NONE
                with socket.create_connection((ip, port), timeout=banner_timeout) as sock:
                    with context.wrap_socket(sock, server_hostname=ip) as ssock:
                        request = f"HEAD / HTTP/1.0\r\nHost: {ip}\r\nUser-Agent: NetSentinel/2.4\r\n\r\n"
                        ssock.sendall(request.encode("utf-8"))
                        response = ssock.recv(1024).decode("latin-1", errors="ignore")
                        for line in response.splitlines():
                            if line.lower().startswith("server:"):
                                return line.split(":", 1)[1].strip()
                        return response.splitlines()[0] if response else "HTTPS / TLS Service"

            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.settimeout(banner_timeout)
                sock.connect((ip, port))

                # Service-specific probe requests
                if port in (80, 8080, 8000, 8888, 5000):
                    request = f"HEAD / HTTP/1.0\r\nHost: {ip}\r\nUser-Agent: NetSentinel/2.4\r\n\r\n"
                    sock.sendall(request.encode("utf-8"))
                    response = sock.recv(1024).decode("latin-1", errors="ignore")
                    for line in response.splitlines():
                        if line.lower().startswith("server:"):
                            return line.split(":", 1)[1].strip()
                    return response.splitlines()[0] if response else "HTTP Web Service"
                elif port == 554:
                    return "RTSP Surveillance Streaming Daemon"
                elif port == 21:
                    data = sock.recv(512).decode("latin-1", errors="ignore").strip()
                    return data.split("\n")[0] if data else "FTP Service"
                elif port == 22:
                    data = sock.recv(512).decode("latin-1", errors="ignore").strip()
                    return data.split("\n")[0] if data else "SSH Service"
                else:
                    data = sock.recv(512)
                    if data:
                        clean = data.decode("latin-1", errors="ignore").strip()
                        return clean.split("\n")[0].strip()
        except Exception:
            pass

        return banner

    def scan_single_port(self, ip: str, port: int, timeout: Optional[float] = None) -> Optional[Dict[str, Any]]:
        """Probes a single TCP port using connect_ex. Returns finding dict if port is open."""
        t = timeout or self.timeout
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.settimeout(t)
                result = sock.connect_ex((ip, port))
                if result == 0:
                    # Port is open!
                    service_info = KNOWN_SERVICES.get(port, {
                        "name": f"TCP-{port}",
                        "desc": "TCP Network Service",
                        "risk": "Medium" if port < 1024 else "Low",
                    })

                    banner = self.grab_banner(ip, port, timeout=min(t, 1.0))
                    return {
                        "port": port,
                        "state": "open",
                        "service_name": service_info["name"],
                        "description": service_info["desc"],
                        "risk": service_info["risk"],
                        "banner": banner,
                    }
        except Exception:
            pass
        return None

    @staticmethod
    def parse_custom_port_string(port_str: str) -> List[int]:
        """Parses comma-separated and hyphen-range port specifications."""
        ports: Set[int] = set()
        clean = port_str.replace(" ", "")
        for part in clean.split(","):
            if not part:
                continue
            if "-" in part:
                m = re.match(r"^(\d+)-(\d+)$", part)
                if m:
                    start, end = int(m.group(1)), int(m.group(2))
                    start = max(1, min(start, 65535))
                    end = max(1, min(end, 65535))
                    if start <= end:
                        for p in range(start, min(end + 1, start + 10000)):
                            ports.add(p)
            else:
                try:
                    p = int(part)
                    if 1 <= p <= 65535:
                        ports.add(p)
                except ValueError:
                    pass
        return sorted(list(ports))

    def get_ports_for_mode(self, mode: str, custom_ports: str = "") -> List[int]:
        """Returns ordered list of target ports based on scan profile."""
        if mode == "top":
            return DEFAULT_SCAN_PORTS  # Top 50 common ports
        elif mode == "quick":
            # Top 100 common ports
            return sorted(list(set(DEFAULT_SCAN_PORTS + [
                1, 7, 9, 13, 17, 19, 26, 37, 79, 102, 113, 119, 179, 389, 465,
                512, 513, 514, 515, 548, 554, 587, 631, 636, 873, 990, 992,
                1080, 1194, 1433, 1521, 1723, 2049, 3000, 3128, 3306, 3389,
                5000, 5432, 5900, 6379, 8000, 8080, 8443, 8888, 9000, 9200
            ])))
        elif mode == "well_known":
            return list(range(1, 1025))  # Standard 1 to 1024
        elif mode == "extended":
            return list(range(1, 10001))  # 1 to 10,000
        elif mode == "full":
            return list(range(1, 65536))  # 1 to 65,535
        elif mode == "custom":
            parsed = self.parse_custom_port_string(custom_ports)
            return parsed if parsed else DEFAULT_SCAN_PORTS
        return DEFAULT_SCAN_PORTS

    def scan_host_advanced(
        self,
        ip: str,
        port_mode: str = "top",
        custom_ports: str = "",
        mac: Optional[str] = None,
        max_workers: Optional[int] = None,
        timeout: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Executes a high-performance multi-threaded scan across target ports.
        Returns comprehensive performance timing, ports per second, and findings.
        """
        workers = self._get_configured_threads(max_workers)
        sock_timeout = timeout or self.timeout
        target_ports = self.get_ports_for_mode(port_mode, custom_ports)
        total_ports = len(target_ports)

        # For large sweeps (e.g. well_known or extended), adjust timeout slightly for optimal velocity
        if total_ports > 1000 and sock_timeout > 0.35:
            sock_timeout = 0.25

        start_time = time.time()
        open_findings: List[Dict[str, Any]] = []

        # High-concurrency worker execution with real-time progress emission
        completed_count = 0
        last_progress_emit = 0
        emit_interval = max(1, total_ports // 100)

        # Emit initial zero progress
        try:
            init_prog = json.dumps({
                "checked": 0,
                "total": total_ports,
                "port": target_ports[0] if target_ports else 0,
                "open_count": 0,
                "percent": 0.0,
            })
            print(f"PROGRESS:{init_prog}", flush=True)
        except Exception:
            pass

        with ThreadPoolExecutor(max_workers=workers) as executor:
            future_to_port = {
                executor.submit(self.scan_single_port, ip, port, sock_timeout): port
                for port in target_ports
            }
            for future in as_completed(future_to_port):
                completed_count += 1
                cur_port = future_to_port[future]
                res = future.result()
                if res:
                    open_findings.append(res)

                # Emit progress on open port, regular intervals, or final port
                if res or (completed_count - last_progress_emit >= emit_interval) or (completed_count == total_ports):
                    last_progress_emit = completed_count
                    try:
                        prog_line = json.dumps({
                            "checked": completed_count,
                            "total": total_ports,
                            "port": cur_port,
                            "open_count": len(open_findings),
                            "percent": round((completed_count / total_ports) * 100, 1),
                        })
                        print(f"PROGRESS:{prog_line}", flush=True)
                    except Exception:
                        pass

        elapsed = time.time() - start_time
        duration_ms = round(elapsed * 1000, 2)
        duration_sec = max(round(elapsed, 2), 0.001)
        throughput_pps = round(total_ports / duration_sec, 1)

        # Sort findings by port number
        open_findings.sort(key=lambda x: x["port"])

        # Persist to database if connected
        if self.db:
            try:
                self.db.record_port_scans(ip=ip, mac=mac, scan_results=open_findings)
            except Exception:
                pass

        return {
            "ip": ip,
            "mac": mac or "",
            "port_mode": port_mode,
            "total_probed": total_ports,
            "open_count": len(open_findings),
            "duration_ms": duration_ms,
            "duration_seconds": duration_sec,
            "throughput_ports_per_sec": throughput_pps,
            "threads_used": workers,
            "timeout_ms": int(sock_timeout * 1000),
            "findings": open_findings,
        }

    def scan_host(
        self,
        ip: str,
        ports: Optional[List[int]] = None,
        mac: Optional[str] = None,
        max_workers: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Legacy compatible method: Scans target host and returns findings list.
        """
        workers = self._get_configured_threads(max_workers)
        target_ports = ports or DEFAULT_SCAN_PORTS
        open_findings: List[Dict[str, Any]] = []

        with ThreadPoolExecutor(max_workers=workers) as executor:
            future_to_port = {
                executor.submit(self.scan_single_port, ip, port): port
                for port in target_ports
            }
            for future in as_completed(future_to_port):
                res = future.result()
                if res:
                    open_findings.append(res)

        open_findings.sort(key=lambda x: x["port"])

        if self.db:
            try:
                self.db.record_port_scans(ip=ip, mac=mac, scan_results=open_findings)
            except Exception:
                pass

        return open_findings
