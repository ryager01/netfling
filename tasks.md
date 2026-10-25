# NetSentinel (NetFling) Development Tasks

## Phase 1: Environment & Dependency Verification
- [x] 1.1 Verify Python 3 runtime and core packages installation
  - [x] 1.1.1 Verify pip, scapy, python-nmap, rich, and speedtest-cli availability
  - [x] 1.1.2 Verify network interface, gateway, and routing inspection tools
  - [x] 1.1.3 Verify SQLite3 database support in Python
- [x] 1.2 Create `requirements.txt` with verified dependencies
  - [x] 1.2.1 Include scapy, python-nmap, rich, speedtest-cli, and optional utilities
- [x] 1.3 Initialize project metadata and configuration
  - [x] 1.3.1 Update `metadata.json` with app title and description
  - [x] 1.3.2 Update `index.html` with app title and SEO meta tags

## Phase 2: Core Architecture & Database Engine (`netsentinel/db.py`)
- [x] 2.1 Design and implement SQLite database schema (`netsentinel.db`)
  - [x] 2.1.1 Create `devices` table with IP, MAC, hostname, vendor, first_seen, last_seen, custom nickname, is_known, is_trusted
  - [x] 2.1.2 Create `port_scans` table for open ports and services per device
  - [x] 2.1.3 Create `speed_tests` table for download, upload, ping, and server metrics
  - [x] 2.1.4 Create `security_alerts` table for intruder/unknown device events
- [x] 2.2 Implement CRUD and query operations with connection safety
  - [x] 2.2.1 Implement `upsert_device` with timestamp tracking and status reconciliation
  - [x] 2.2.2 Implement nickname customization and device trust toggling
  - [x] 2.2.3 Implement history retrieval for devices, port scans, and alerts
  - [x] 2.2.4 Verify database operations via automated unit tests

## Phase 3: Subnet Discovery Engine (`netsentinel/discovery.py`)
- [x] 3.1 Network Interface & Route Detection
  - [x] 3.1.1 Detect default gateway IP and subnet CIDR automatically
  - [x] 3.1.2 Support custom subnet override (e.g., `192.168.1.0/24`)
  - [x] 3.1.3 Implement fallback subnet detection via socket routing and `/proc/net/route`
- [x] 3.2 Multi-Method Discovery Strategy
  - [x] 3.2.1 Implement fast ARP sweep using Scapy with raw socket privilege checks
  - [x] 3.2.2 Implement concurrent ICMP echo / TCP SYN fallback for non-raw socket environments
  - [x] 3.2.3 Read and parse local kernel ARP cache (`/proc/net/arp` and `ip neigh`)
  - [x] 3.2.4 Merge and deduplicate discovered hosts into unified inventory items

## Phase 4: Device Fingerprinting & OUI Vendor Resolution (`netsentinel/fingerprint.py`)
- [x] 4.1 OUI Vendor Resolution
  - [x] 4.1.1 Implement built-in offline OUI prefix database (covering Apple, Google, Intel, Espressif, Raspberry Pi, Cisco, Netgear, TP-Link, Samsung, Amazon, etc.)
  - [x] 4.1.2 Fallback to Scapy/Wireshark manuf DB or generic vendor lookup
- [x] 4.2 Hostname & Device Type Identification
  - [x] 4.2.1 Reverse DNS (PTR) lookup with non-blocking timeouts
  - [x] 4.2.2 NetBIOS Name Service (NBNS) query fallback
  - [x] 4.2.3 mDNS probe heuristics for smart home and Apple devices
  - [x] 4.2.4 Device category classification heuristics (Router, Mobile, PC, IoT, Printer, Server)

## Phase 5: Port Scanning & Service Audit Engine (`netsentinel/portscan.py`)
- [x] 5.1 Quick Port Scanner
  - [x] 5.1.1 Scan common critical ports: 21, 22, 23, 80, 443, 445, 8080
  - [x] 5.1.2 Configurable custom port ranges and top-100 port presets
- [x] 5.2 Banner Grabbing & Service Detection
  - [x] 5.2.1 Socket connect with strict timeouts (0.5s - 1.5s)
  - [x] 5.2.2 Extract protocol banners (SSH server version, HTTP Server header, FTP welcome)
  - [x] 5.2.3 Classify security risk levels (e.g. unencrypted Telnet/FTP, exposed SMB)
  - [x] 5.2.4 Persist audit results to SQLite

## Phase 6: Speed Test & Network Quality Engine (`netsentinel/speedtest.py`)
- [x] 6.1 Speedtest Execution
  - [x] 6.1.1 Wrap `speedtest-cli` with programmatic JSON/metric capture
  - [x] 6.1.2 Fallback to socket/HTTP chunked benchmark if speedtest-cli servers are unreachable or rate-limited
  - [x] 6.1.3 Capture ping latency, jitter, download Mbps, upload Mbps, and client ISP/IP
  - [x] 6.1.4 Persist speedtest records to SQLite

## Phase 7: Intruder / New Device Alert Daemon (`netsentinel/daemon.py`)
- [x] 7.1 Background Monitoring Daemon
  - [x] 7.1.1 Configurable background sweep interval (default 30s - 60s)
  - [x] 7.1.2 Detect new, previously unseen MAC addresses
  - [x] 7.1.3 Detect IP conflicts or gateway ARP anomalies (spoofing detection)
  - [x] 7.1.4 Log alert events to `security_alerts` table and trigger notification callbacks
  - [x] 7.1.5 Graceful thread termination and signal handling (SIGINT, SIGTERM)

## Phase 8: Data Export Engine (`netsentinel/export.py`)
- [x] 8.1 Inventory & Audit Export
  - [x] 8.1.1 Export devices and port scans to standardized JSON
  - [x] 8.1.2 Export devices and port scans to CSV with RFC 4180 escaping
  - [x] 8.1.3 Export security audit report with summary statistics

## Phase 9: Terminal User Interface (TUI) & CLI (`netsentinel/tui.py`, `netsentinel/cli.py`)
- [x] 9.1 Rich Terminal User Interface
  - [x] 9.1.1 Interactive Live table display with colors, status glyphs, and device counters
  - [x] 9.1.2 Device detail inspector panel with open ports and latency
  - [x] 9.1.3 Interactive CLI menus for Discover, Port Scan, Speed Test, Alert Monitor, and Export
  - [x] 9.1.4 Support both interactive TUI (`rich`) and scriptable non-interactive CLI flags (`--scan`, `--export`, `--json`)

## Phase 10: Full-Stack Web Dashboard & API Bridge (`server.ts`, React UI)
- [x] 10.1 Express REST API Bridge
  - [x] 10.1.1 Expose endpoints: GET `/api/status`, GET `/api/devices`, POST `/api/scan`, POST `/api/portscan`, POST `/api/speedtest`
  - [x] 10.1.2 Expose endpoints: PATCH `/api/devices/:mac` (nickname/trusted), GET `/api/alerts`, GET `/api/export/:format`
  - [x] 10.1.3 Spawn and communicate with Python backend modules reliably
- [x] 10.2 React Frontend Operations Console
  - [x] 10.2.1 High-density device inventory grid with live filtering, search, sorting
  - [x] 10.2.2 Network topology & gateway overview card
  - [x] 10.2.3 Port scanner inspection modal/panel
  - [x] 10.2.4 Speed test runner & latency gauge
  - [x] 10.2.5 Real-time intruder alert activity log with badge counts
  - [x] 10.2.6 CSV and JSON export action triggers
  - [x] 10.2.7 Embedded CLI/TUI runner console to view Rich TUI output

## Phase 11: Verification, Testing & Validation
- [x] 11.1 Run comprehensive Python test suite (`tests/`) - 31/31 Unit Tests Passing
- [x] 11.2 Verify `compile_applet` and build pass
- [x] 11.3 Verify non-root and root privilege resilience with graceful fallback

## Phase 12: Advanced Paid Fing Capabilities
- [x] 12.1 Automated Router Security & Vulnerability Check (`netsentinel/vulnerability.py`)
  - [x] 12.1.1 UPnP / NAT-PMP WAN port exposure audit
  - [x] 12.1.2 DNS hijacking & DNS server integrity verification (against Cloudflare/Google/Quad9)
  - [x] 12.1.3 Automated Network Security Score Calculation (0-100 with A/B/C/F grade)
- [x] 12.2 Hidden Surveillance & IP Camera Detector (`netsentinel/surveillance.py`)
  - [x] 12.2.1 Probing RTSP port 554, ONVIF ports 8000/8080/8899, WebRTC cameras
  - [x] 12.2.2 Camera vendor signature correlation (Hikvision, Dahua, Wyze, Ring, Reolink, Axis, Arlo, Amcrest, Nest)
- [x] 12.3 Remote Wake-on-LAN (WoL) Engine (`netsentinel/wol.py`)
  - [x] 12.3.1 Magic Packet transmission via UDP broadcast to wake sleeping hosts
  - [x] 12.3.2 Strict MAC address validation and broadcast IP resolution
- [x] 12.4 Device Digital Presence & Outage Tracker (`netsentinel/timeline.py`)
  - [x] 12.4.1 Device timeline transition recording (joined, left, status change)
  - [x] 12.4.2 Simulated Internet Pause / Access Policy state control

## Phase 13: Comprehensive Internal Documentation
- [x] 13.1 Create `docs/ARCHITECTURE.md` (System design, multi-tier fallback, and modular data flow)
- [x] 13.2 Create `docs/API.md` (Detailed Python class & function reference with signatures and REST endpoints)
- [x] 13.3 Create `docs/PAID_FING_COMPARISON.md` (Feature matrix comparing NetSentinel to Fing Premium/Fingbox)
- [x] 13.4 Create `docs/SECURITY.md` (Threat models, socket privileges, and defensive network posture)

## Phase 14: Function-by-Function Automated Testing Suite
- [x] 14.1 Create `tests/test_comprehensive.py` verifying every function in the suite
- [x] 14.2 Execute all test suites and verify 100% test pass rate (31/31 tests passing)
- [x] 14.3 Update Web Console and CLI to expose all paid Fing features

## Phase 15: Central Navigation Interface & Contextual Error Remediation Popups
- [x] 15.1 Build Central Command Hub (Unified launcher for all 10+ core and paid Fing functions)
  - [x] 15.1.1 Add Command Center overview dashboard with live telemetry status for each module
  - [x] 15.1.2 Ensure every function has immediate 1-click access from the central navigation bar and hub
- [x] 15.2 Red Accent Error System & Contextual Hover Popups
  - [x] 15.2.1 Create reusable `ErrorPopover` component with technical explanation, cause analysis, and step-by-step resolution
  - [x] 15.2.2 Accent high-risk ports, untrusted devices, UPnP exposure, DNS warnings, and intruder alerts in red
  - [x] 15.2.3 Provide one-click action triggers directly within or beside error condition popups
- [x] 15.3 Build Verification & Integration Testing
  - [x] 15.3.1 Verify clean compilation with `compile_applet` and `lint_applet`
  - [x] 15.3.2 Test interactive hover states and error condition rendering

## Phase 16: Collapsible Command Center Sidebar, Report Views, Custom Metadata, Quarantine & Default Credentials
- [x] 16.1 Collapsible Sidebar Command Center
  - [x] 16.1.1 Build responsive collapsible sidebar with expanded (260px) and compact (72px) states
  - [x] 16.1.2 Display red error count badges on each section indicating active errors and threats
- [x] 16.2 Executive Report View Architecture
  - [x] 16.2.1 Render main areas as executive audit reports with timestamps, scope stamps, and KPI strips
  - [x] 16.2.2 Support print/export report affordances across all modules
- [x] 16.3 Custom Metadata & Visibility History Engine
  - [x] 16.3.1 Store arbitrary user-defined metadata (Owner, Department, Location, Notes) in SQLite
  - [x] 16.3.2 Expose REST API endpoint `PATCH /api/devices/:mac/metadata`
  - [x] 16.3.3 Provide interactive modal/panel for viewing and editing custom metadata
- [x] 16.4 Unknown Device Quarantine Engine
  - [x] 16.4.1 Allow placing any unknown or rogue device into Quarantine with reason logging
  - [x] 16.4.2 Provide release from quarantine and whitelist controls
- [x] 16.5 Vendor Default Credentials & Web Admin Directory (`netsentinel/credentials.py`)
  - [x] 16.5.1 Build registry of default usernames, passwords, and admin URLs for major vendors
  - [x] 16.5.2 Integrate default credential hints into device reports and metadata
- [x] 16.6 Full Verification & Build Testing
  - [x] 16.6.1 Run unit tests for credentials and metadata (33/33 tests passing)
  - [x] 16.6.2 Verify clean compilation with `compile_applet` and `lint_applet`

## Phase 17: Seen Device Target IP Selector, Dedicated Quarantine Section & Network Diagnostic Tools
- [x] 17.1 Universal Seen Device Target IP Selector (`TargetIpSelector`)
  - [x] 17.1.1 Reusable selector component allowing manual IP/hostname input or picking from seen network devices
  - [x] 17.1.2 Integrated device search, online/offline filters, vendor badges, and IP/MAC displays
  - [x] 17.1.3 Deployed across Port Scanner, Ping, Traceroute, DNS, Email Check, Blacklist Check, and Quarantine modal
- [x] 17.2 Dedicated Quarantine Command Deck (`QuarantineView`)
  - [x] 17.2.1 Separate section in sidebar command center and main report deck for quarantined devices
  - [x] 17.2.2 View both online and offline quarantined endpoints with live state indicators
  - [x] 17.2.3 Inline editable quarantine isolation reasons and timestamps
  - [x] 17.2.4 Actions: Release from quarantine, cut/resume internet traffic, inspect port scan, and custom metadata
  - [x] 17.2.5 Modal to place any network device into quarantine with incident notes
- [x] 17.3 Comprehensive Network Diagnostics & Testing Suite (`netsentinel/nettools.py` & `NetworkDiagnosticsView`)
  - [x] 17.3.1 ICMP Ping Diagnostic Engine: latency min/avg/max/mdev, packet loss, sequence logs, and remediation guide
  - [x] 17.3.2 Hop-by-Hop Traceroute Engine: hop latency, reverse PTR hostname resolution, gateway detection, and status
  - [x] 17.3.3 RFC-Compliant DNS Resolution: A, AAAA, MX, TXT, NS, CNAME, SOA, PTR records with custom resolver selection (System, Cloudflare, Google, Quad9, OpenDNS)
  - [x] 17.3.4 Email & Delivery Checks: RFC 5322 syntax validation, MX host resolution, SPF mechanisms breakdown, DMARC policy parser, DKIM probe, SMTP ports 25/587/465 connectivity & banner grab, and Deliverability Score (0-100)
  - [x] 17.3.5 Blacklist & DNSBL Reputation Engine: Real-time queries against Spamhaus ZEN, SpamCop, Barracuda, SORBS, CBL, PSBL, UCEPROTECT, SURBL, SEM URI, Reverse DNS (PTR) alignment, and direct delist links
- [x] 17.4 Verification & Testing
  - [x] 17.4.1 Comprehensive unit tests in `tests/test_nettools.py` (40/40 tests passing across suite)
  - [x] 17.4.2 Zero compilation and lint errors verified with `compile_applet` and `lint_applet`

## Phase 18: Cross-Platform Network Device & Adapter Identification, Live Scan HUD, and Port Count Tracker
- [x] 18.1 Cross-Platform Network Device & Adapter Enumeration (`netsentinel/discovery.py`)
  - [x] 18.1.1 Linux: Parse `ip -d addr show`, `ip -4 route show`, `/proc/net/route`, and `/sys/class/net`
  - [x] 18.1.2 Windows: Parse PowerShell `Get-NetIPConfiguration`, `Get-NetAdapter`, `Get-NetRoute`, and `ipconfig /all`
  - [x] 18.1.3 Return unified topology with all adapters, MACs, IPs, per-adapter and default gateways, and routable subnets
  - [x] 18.1.4 Expose REST API endpoint `GET /api/network-interfaces`
- [x] 18.2 Real-Time Network Scan Status Display
  - [x] 18.2.1 Real-time HUD banner displaying scan state (`ACTIVE` / `COMPLETED`), target subnet, active stage, and live device count
  - [x] 18.2.2 REST status endpoint `GET /api/scan/status` with `STATUS:` event stream parsing
- [x] 18.3 Port Scan Checked vs. Total Counter Display
  - [x] 18.3.1 Real-time counter displaying ports checked vs total to check (e.g. `1,024 / 1,024 (100.0%)`)
  - [x] 18.3.2 Support across Top 50, Top 100, Well-Known (1-1024), Extended (1-10000), Full (1-65535), and custom ranges
  - [x] 18.3.3 Live progress bar, open port counter, and worker thread concurrency slider (up to 500 threads)
  - [x] 18.3.4 REST status endpoint `GET /api/portscan/status` with `PROGRESS:` event stream parsing

## Phase 19: Wi-Fi Multi-Band Spectrum & Saturation Analyzer (`netsentinel/wifi.py` & `WifiAnalyzerView.tsx`)
- [x] 19.1 Multi-Band 802.11 Wireless Discovery Engine
  - [x] 19.1.1 Multi-band coverage across 2.4 GHz, 5 GHz, and 6 GHz (Wi-Fi 6E / Wi-Fi 7) frequencies
  - [x] 19.1.2 Native Windows scanning via `netsh wlan show networks mode=bssid` and Linux via `nmcli` / `iw`
  - [x] 19.1.3 Dual link quality measurement in percentage (%) and decibels relative to 1 milliwatt (dBm)
- [x] 19.2 Spectrum, Channel & SSID Saturation Algorithms
  - [x] 19.2.1 Frequency Band Saturation: Spectrum load %, AP density, and saturation rating (Low, Moderate, Congested)
  - [x] 19.2.2 Channel Saturation: Co-channel interference (1.0x) and adjacent-channel bleed (0.35x)
  - [x] 19.2.3 SSID Health & Optimization: Signal-to-interference ratio and automated channel migration recommendations
- [x] 19.3 Dedicated Wi-Fi Analyzer Command Deck
  - [x] 19.3.1 Interactive spectrum view with channel map, frequency band filtering, and instant search
  - [x] 19.3.2 Auto-refresh polling, on-demand sweep trigger, and CSV/JSON export

## Phase 20: Real-Time System & Debugging Logs Console & Windows 11 Automated Installer
- [x] 20.1 Dual-Layer Telemetry & Logging Architecture (`netsentinel/logger.py`, `netsentinel/db.py`, `server.ts`)
  - [x] 20.1.1 Persistent SQLite `system_logs` table with indexed timestamp, level, category, and traceback
  - [x] 20.1.2 High-throughput in-memory ring buffer (up to 2,500 entries) in Node.js for zero-latency live streaming
  - [x] 20.1.3 Automatic child process execution telemetry logging duration (ms), exit codes, and stderr at `DEBUG`/`ERROR`
  - [x] 20.1.4 HTTP API request telemetry middleware capturing duration, status code, and method
- [x] 20.2 System & Debug Logs Console UI (`LogsView.tsx`)
  - [x] 20.2.1 Severity level filters (`ALL`, `DEBUG`, `INFO`, `WARN`, `ERROR`) with real-time counters
  - [x] 20.2.2 Category filtering (Network Scan, Port Scan, Wi-Fi Spectrum, API Gateway, Surveillance, Security, Daemon, System)
  - [x] 20.2.3 Full-text instant search and Table View vs. Raw Monospace Terminal View toggle
  - [x] 20.2.4 Inspector modal for complete unclipped messages, JSON argument payloads, and stack tracebacks
  - [x] 20.2.5 On-demand test log generator, verbose packet debug mode switch, and `.log` / `.json` export
- [x] 20.3 Windows 11 Automated Installer Suite
  - [x] 20.3.1 `install-windows11.bat`: Automated one-click launcher with UAC elevation detection and auto-launch prompt
  - [x] 20.3.2 `install.ps1`: Miniconda silent install, `netsentinel` Conda environment (Python 3.11 + Node 20), Desktop shortcut ("NetSentinel Security"), Start Menu folder, and Windows Defender Firewall rule for port 3000
  - [x] 20.3.3 `make_win11_installer.py`: Packages self-contained `NetSentinel-Windows11-Setup.zip`
  - [x] 20.3.4 UI Modal (`Windows11InstallerModal.tsx`) with direct download buttons and Windows Terminal one-liner

## Phase 21: Wowza Live RTSP Streaming, Windows 11 Video Playback, Dual-Stack IPv6 & Universal Progress Meters
- [x] 21.1 Live Wowza Cloud RTSP Video Engine & Zero Simulator Elimination
  - [x] 21.1.1 Configured live feed URL: `rtsp://9627b0bf2a7b.entrypoint.cloud.wowza.com:1935/app-p5260J38/66abe4b9_stream1` across `surveillance.py`, `server.ts`, and UI components
  - [x] 21.1.2 Completely removed simulator canvas fallbacks; implemented native FFmpeg low-latency MJPEG proxy (`image2pipe`) over TCP transport
  - [x] 21.1.3 Cached authentic 1280x720 video snapshot fallback (`./live_cctv_frame.jpg`) during RTSP connection negotiation
- [x] 21.2 Windows 11 Native Surveillance Viewing & Integration
  - [x] 21.2.1 In-browser hardware-accelerated playback on Edge / Chrome (`/api/stream/live` and `/api/cameras/:ip/stream`)
  - [x] 21.2.2 One-click `.m3u` playlist export endpoints (`/api/cameras/:ip/playlist.m3u` and `/api/stream/playlist.m3u`) for Windows Media Player, VLC, PotPlayer, MPC-HC
  - [x] 21.2.3 One-click PowerShell launch command generator (`Start-Process "vlc" -ArgumentList "..."`) in Camera Management modal
- [x] 21.3 Dual-Stack IPv6 Discovery (NDP / EUI-64)
  - [x] 21.3.1 Windows 11 neighbor discovery via `netsh interface ipv6 show neighbors` and PowerShell `Get-NetNeighbor`
  - [x] 21.3.2 Linux neighbor cache inspection via `ip -6 neigh show`
  - [x] 21.3.3 RFC 4291 EUI-64 deterministic MAC-to-IPv6 link-local address generation
  - [x] 21.3.4 Dual-stack persistence in SQLite database schema (`ipv6` column in `devices`)
  - [x] 21.3.5 UI controls: IPv6 Neighbor Sweep button, IPv6 stack filter badge, and clipboard copy in Device Inventory
- [x] 21.4 Universal Real-Time Progress Meters
  - [x] 21.4.1 Subnet discovery sweep real-time multi-stage HUD banner and progress percentage
  - [x] 21.4.2 IPv6 neighbor sweep multi-stage progress meter (15% -> 40% -> 70% -> 90% -> 100%)
  - [x] 21.4.3 Multi-threaded port scan checked vs total counter (`1,024 / 1,024 (100.0%)`)
  - [x] 21.4.4 RAT / Trojan security sweep animated phase progress indicator
  - [x] 21.4.5 SQLite backup rotation and snapshot creation animated progress bar
  - [x] 21.4.6 Interactive terminal CLI command execution stage and percentage meter above prompt

## Phase 22: Comprehensive Feature Documentation (Define, Describe, Explain & Use)
- [x] 22.1 Complete Architectural & Feature Manual Overhaul (`DocumentationView.tsx`)
  - [x] 22.1.1 Implemented `FeatureDocCard` component providing structured triplets: Define, Describe, Explain & Use
  - [x] 22.1.2 Applied structured Define, Describe, Explain & Use documentation across all 15 system sections:
    - Section 1: System Overview & Architecture (Dual-Tier, 100% Local Privacy, SQLite WAL)
    - Section 2: First-Run Guided Discovery & Subnet Sweeper (Multi-Subnet, ARP/ICMP Sweeper, IPv6 NDP/EUI-64, Progress HUD)
    - Section 3: Device Inventory & Custom Metadata (OUI Fingerprinting, Key-Value Tags, Factory Credentials, Trust Toggle)
    - Section 4: Zero-Trust Quarantine Isolation Deck (Active/Dormant Partitioning, Forensic Audit Trail, Instant Release)
    - Section 5: Network Diagnostics & DNS Testing Suite (Dual-Mode Ping, Hop Traceroute, RFC DNS, Email SPF/DMARC, DNSBL)
    - Section 6: DNS Hijacking & Poisoning Detection (NXDOMAIN Tampering, Canary Benchmark Spoofing, Port 53 Interception, DNSSEC)
    - Section 7: Hidden Cameras & Surveillance Management (Live Wowza RTSP, Windows 11 Native M3U/PowerShell, PTZ Controls, Settings)
    - Section 8: Multi-Threaded Port Scanner & Turbo Tuning (500 Worker Threads, Range Profiles, Checked/Total Counter, Banner Grabbing)
    - Section 9: RAT & Backdoor Detection (35+ Trojan Signatures, Workstation Memory Audit, One-Click Containment)
    - Section 10: Embedded Terminal Console & Shell (Interactive CLI, Command Execution Progress Meter, IPv6 Diagnostics, CRT Filter)
    - Section 11: System Settings & Backup Disaster Recovery (SMTP Email Alerts, Thread Tuning, Atomic Backup Progress Meter)
    - Section 12: Conda Installation & Setup Scripts (Windows 11 Installer, setup_conda.sh, compile_app.sh, environment.yml)
    - Section 13: Python Rich CLI & Headless Daemon (Rich Color TUI, Background Intruder Daemon)
    - Section 14: Wi-Fi Multi-Band Spectrum & Saturation Analyzer (Tri-Band 2.4/5/6 GHz, Dual %/dBm Metering, Interference Bleed, Migration)
    - Section 15: Real-Time System & Debugging Logs Console (Dual-Layer Store, Severity Filters, JSON Tracebacks, Streaming Controls)
