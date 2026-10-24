# NetSentinel Python & REST API Reference

NetSentinel provides both an extensive Python engine API and a high-performance REST API served on port 3000.

---

## 1. Python Module API

### `netsentinel.discovery.SubnetDiscoveryEngine`
- `get_all_network_devices() -> Dict[str, Any]`
  Cross-platform network device discovery across Linux and Windows. Extracts each adapter's name, description, operational status, interface type (Wi-Fi, Ethernet, loopback), MAC address, IPv4 bindings, per-adapter and default gateways, and routable CIDR subnets.
- `get_all_known_subnets() -> List[Dict[str, Any]]`
  Enumerates all routable subnets discovered across all local network interfaces and gateways.
- `detect_network_environment() -> Dict[str, str]`
  Extracts active interface, local IP, gateway IP, and subnet CIDR.
- `discover(subnet_override: Optional[str] = None) -> List[Dict[str, Any]]`
  Runs complete multi-threaded ARP/ICMP discovery sweep across subnet and emits real-time `STATUS:` progress events.

---

### `netsentinel.wifi.WifiAnalyzerEngine`
- `scan() -> Dict[str, Any]`
  Executes multi-band Wi-Fi spectrum analysis across **2.4 GHz**, **5 GHz**, and **6 GHz (Wi-Fi 6E/7)** frequencies on Windows (via `netsh wlan show networks mode=bssid`) and Linux (via `nmcli dev wifi list` or `iw dev scan`).
  Returns:
  - `networks`: Discovered SSIDs with BSSID, frequency, channel, channel width, signal strength (% and dBm), security, and saturation metrics.
  - `frequency_saturation`: Total network density, spectrum load %, and recommended optimal channels per band.
  - `channel_saturation`: AP density, co-channel energy, adjacent-channel interference, and congestion levels per channel.

---

### `netsentinel.db.DatabaseEngine`
Thread-safe SQLite manager (`netsentinel.db` with WAL mode):
- `upsert_device(mac: str, ip: str, hostname: str, vendor: str, device_type: str, latency_ms: float) -> Dict[str, Any]`
  Inserts or updates a device record.
- `get_all_devices() -> List[Dict[str, Any]]`
  Retrieves all tracked devices sorted by IP address.
- `get_device(mac: str) -> Optional[Dict[str, Any]]`
  Queries a single device record by MAC address.
- `update_nickname(mac: str, nickname: str) -> bool`
  Assigns a custom nickname to a device.
- `toggle_trusted(mac: str, is_trusted: bool) -> bool`
  Marks a device as trusted or untrusted.
- `toggle_quarantine(mac: str, quarantined: bool, reason: str = "") -> bool`
  Applies or lifts device quarantine isolation policy.
- `update_custom_metadata(mac: str, metadata: Dict[str, Any]) -> bool`
  Saves user-defined key/value tags on a device.
- `record_port_scans(ip: str, mac: Optional[str], scan_results: List[Dict[str, Any]]) -> None`
  Stores open port findings for an IP/MAC address.
- `record_speed_test(ping_ms: float, download_mbps: float, upload_mbps: float, ...) -> int`
  Persists a speed test execution record.
- `log_alert(alert_type: str, message: str, mac: str, ip: str, severity: str) -> int`
  Records an intruder or security event.
- `log_system_event(level: str, category: str, message: str, module: str, details: Dict, ip: str, mac: str, traceback: str) -> int`
  Records structured DEBUG, INFO, WARN, or ERROR logs into `system_logs`.
- `get_system_logs(level, category, search, limit, since_id) -> List[Dict[str, Any]]`
  Retrieves filtered system and debugging logs.
- `get_system_logs_stats() -> Dict[str, Any]`
  Returns log count breakdown by severity level and category.
- `clear_system_logs(older_than_iso: Optional[str] = None) -> int`
  Purges system logs.
- `create_database_backup(custom_backup_dir: Optional[str] = None) -> Dict[str, Any]`
  Generates an atomic database backup.
- `get_backups_list() -> List[Dict[str, Any]]`
  Lists all available backups with file sizes and timestamps.

---

### `netsentinel.logger.NetSentinelLogger`
Centralized structured telemetry logging engine:
- `debug(category, message, module, details, ip, mac)`
- `info(category, message, module, details, ip, mac)`
- `warning(category, message, module, details, ip, mac)`
- `error(category, message, module, details, ip, mac, traceback_str)`

---

### `netsentinel.portscan.PortScanEngine`
- `scan_host(ip: str, ports: List[int], mac: Optional[str], max_workers: Optional[int]) -> List[Dict[str, Any]]`
  Probes specified ports with service banner grabbing.
- `scan_host_advanced(ip: str, port_mode: str, custom_ports: str, mac: Optional[str], max_workers: Optional[int]) -> Dict[str, Any]`
  Concurrent port scanner emitting real-time `PROGRESS:` events (checked count vs. total to check) across Top 50, Top 100, Well-Known, Extended, Full (65,535), or custom ranges.

---

### `netsentinel.nettools.PingEngine`
- `run_ping(target: str, count: int = 4, timeout: int = 2, mode: str = "auto", port: Optional[int] = None) -> Dict[str, Any]`
  Cross-platform ping diagnostic with microsecond latency precision:
  - Supports Linux (iputils-ping) and Windows 11 (ping.exe) with native IPv4 and IPv6 parsing.
  - Automatic TCP SYN fallback: when ICMP Echo is filtered by host firewall or cloud environment, automatically probes responsive TCP ports (443, 80, 53, 22) to determine exact status and RTT.
  - Returns: `packets_transmitted`, `packets_received`, `packet_loss_pct`, `rtt_min_ms`, `rtt_avg_ms`, `rtt_max_ms`, `rtt_mdev_ms`, individual `packets` stream with seq/bytes/ttl/probe, and remediation guide.

---

### `netsentinel.nettools.TracerouteEngine`
- `run_trace(target: str, max_hops: int = 15, timeout: int = 1) -> Dict[str, Any]`
  Parallel hop-by-hop traceroute prober using `ThreadPoolExecutor` (completes in 1–2s). Cross-platform support for Linux (iputils-ping) and Windows (tracert.exe) with reverse PTR DNS resolution and gateway detection.

---

### `netsentinel.rat_detector.RatDetectorEngine`
- `audit_host(ip: str, mac: Optional[str] = None) -> Dict[str, Any]`
  Audits target IP against 35+ Trojan, Infostealer, and adversary C2 signatures with behavioral handshake probes (njRAT, DarkComet, Gh0st RAT, AsyncRAT TLS certificates).
- `audit_entire_network() -> Dict[str, Any]`
  Audits all active devices in local inventory for active RAT listeners.
- `audit_local_system_integrity() -> Dict[str, Any]`
  Conducts deep workstation forensic audit on the local system (Windows 11 & Linux). Inspects listening sockets on 0.0.0.0, detects unlinked/deleted running binaries (`/proc/*/exe (deleted)`), audits startup and registry autorun persistence, and computes a System Integrity Score (0–100).

---

### `netsentinel.surveillance.SurveillanceDetector`
- `probe_rtsp_stream(ip: str, port: int = 554) -> bool`
  Probes target IP for active RTSP video streaming protocol.
- `scan_network_for_cameras() -> List[Dict[str, Any]]`
  Audits entire local inventory for surveillance cameras, ONVIF endpoints, and RTSP video streams.

---

## 2. Express REST API Endpoints

### Discovery & Network
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/status` | Network routing overview, active counts, and daemon status |
| `GET` | `/api/devices` | Full device inventory with open ports and IPv6 addresses |
| `POST` | `/api/scan` | Triggers active subnet discovery sweep with live status |
| `GET` | `/api/scan/status` | Real-time discovery progress (stage, message, percent, hosts found) |
| `POST` | `/api/discovery/ipv6/sweep` | Dual-stack IPv6 neighbor sweep (NDP cache & RFC 4291 EUI-64 SLAAC) |
| `GET` | `/api/subnets` | Enumerates all known and routable subnets |
| `POST` | `/api/guided-discovery` | First-run guided multi-subnet discovery & initial port audit |
| `GET` | `/api/network-interfaces` | All network devices, gateways, and subnets (Linux & Windows) |
| `POST` | `/api/network-environment` | Updates gateway override and manual network settings |

### Wi-Fi Spectrum & Saturation
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/wifi/scan` | Scans 2.4/5/6 GHz Wi-Fi spectrum, channels, signal & saturation |
| `POST` | `/api/wifi/rescan` | Triggers on-demand Wi-Fi spectrum sweep |

### Surveillance & Camera Streaming (Zero Simulator)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/cameras` | Scans local network for hidden cameras & RTSP streams |
| `GET` | `/api/stream/live` | Ultra-low latency FFmpeg MJPEG proxy of primary Wowza cloud RTSP stream |
| `GET` | `/api/cameras/:ip/stream` | Low-latency FFmpeg MJPEG proxy of camera RTSP feed with cached frame fallback |
| `GET` | `/api/stream/playlist.m3u` | Windows 11 one-click `.m3u` playlist for default Wowza stream |
| `GET` | `/api/cameras/:ip/playlist.m3u` | Windows 11 one-click `.m3u` playlist for camera stream playback in VLC/WMP |
| `POST` | `/api/cameras/:ip/ptz` | Interactive PTZ movement (pan, tilt, zoom, center, speed, presets 1-4) |
| `PATCH` | `/api/cameras/:ip/settings` | Updates camera settings (resolution, FPS, bitrate, IR night vision, sensitivity) |

### Port Audits & Cyber Defense
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/portscan` | Multi-threaded TCP connect prober (up to 500 threads) |
| `GET` | `/api/portscan/status` | Live port scan status (ports checked vs. total, open count, %) |
| `GET` | `/api/router-audit` | Audits router UPnP, DNS integrity, and security score |
| `POST` | `/api/tools/rat-check` | Multi-mode RAT & Trojan auditor (`network`, `single`, or `host_integrity`) |
| `GET` | `/api/tools/rat/host-audit` | Workstation system integrity & local Trojan forensics |
| `ALL` | `/api/tools/dns-hijack` | Full DNS hijacking, spoofing, and poisoning audit |
| `GET` | `/api/alerts` | Fetches intruder and security alerts |
| `POST` | `/api/alerts/clear` | Clears all security alert logs |

### Diagnostics, Network Tools & Terminal
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/tools/ping` | Cross-platform ICMP / TCP SYN ping with jitter and firewall bypass (`target`, `count`, `timeout`, `mode`, `port`) |
| `POST` | `/api/tools/traceroute` | High-speed parallel hop-by-hop traceroute prober |
| `POST` | `/api/tools/dns` | Multi-record DNS lookup (A, AAAA, MX, NS, TXT, SOA, PTR) with custom resolvers |
| `POST` | `/api/tools/email-check` | RFC email deliverability, MX priority, SPF, DMARC, DKIM, and SMTP probe |
| `POST` | `/api/tools/blacklist` | Real-time DNSBL blacklist & reputation check across 8 major spam databases |
| `POST` | `/api/terminal/exec` | Embedded terminal command execution engine (ping, traceroute, scan, rat, cameras, ports, speedtest) |
| `POST` | `/api/speedtest` | Executes network speed & latency benchmark |
| `POST` | `/api/wol` | Sends Wake-on-LAN Magic Packet to target MAC |
| `PATCH` | `/api/devices/:mac` | Updates custom nickname or trusted flag |
| `POST` | `/api/devices/:mac/quarantine` | Toggles device quarantine isolation |
| `POST` | `/api/devices/:mac/pause` | Pauses or resumes simulated Internet access |
| `GET` | `/api/export/:format` | Downloads inventory in JSON or CSV format |

### System & Debugging Logs
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/logs` | Query logs with filters: `level`, `category`, `search`, `limit`, `since_id` |
| `GET` | `/api/logs/stats` | Telemetry counts by level (DEBUG, INFO, WARN, ERROR) and category |
| `POST` | `/api/logs` | Create custom log entry |
| `POST` | `/api/logs/test` | Emits test DEBUG, INFO, WARN, and ERROR telemetry entries |
| `POST` | `/api/logs/debug-mode` | Toggles verbose packet and socket debugging mode |
| `DELETE` | `/api/logs` | Clears all system and debug logs |
| `GET` | `/api/logs/export` | Downloads formatted `.log` or `.json` log export |

### Windows 11 Installer
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/installer/windows11/zip` | Downloads `NetSentinel-Windows11-Setup.zip` package |
| `GET` | `/api/installer/windows11/bat` | Downloads `install-windows11.bat` batch installer |
| `GET` | `/api/installer/windows11/script` | Serves raw `install.ps1` for Windows Terminal one-liner execution |
| `GET` | `/api/installer/windows11/start` | Downloads `start.bat` launcher |
