# NetSentinel Enterprise Engineering Manual & Feature Specifications

> **Carrier-Grade Local Network Discovery, Hardware Profiling, Surveillance Intelligence, and Cyber Defense Platform**  
> Every feature in this manual is systematically **Defined**, **Described** in its internal architecture and technical parameters, and **Explained** with practical step-by-step procedures for operational use.

---

## Table of Contents
1. [Subnet Discovery & Dual-Stack Network Intelligence](#1-subnet-discovery--dual-stack-network-intelligence)
2. [Device Inventory, OUI Profiling & Asset Governance](#2-device-inventory-oui-profiling--asset-governance)
3. [Hidden Cameras & Surveillance Management](#3-hidden-cameras--surveillance-management)
4. [Multi-Threaded Port Scanner & Turbo Tuning](#4-multi-threaded-port-scanner--turbo-tuning)
5. [Remote Access Trojan (RAT) & Workstation Host Integrity](#5-remote-access-trojan-rat--workstation-host-integrity)
6. [Zero-Trust Quarantine & Endpoint Isolation Deck](#6-zero-trust-quarantine--endpoint-isolation-deck)
7. [Network Diagnostics & DNS Testing Suite](#7-network-diagnostics--dns-testing-suite)
8. [DNS Hijacking & Poisoning Defense](#8-dns-hijacking--poisoning-defense)
9. [Wi-Fi Multi-Band Spectrum & Saturation Analyzer](#9-wi-fi-multi-band-spectrum--saturation-analyzer)
10. [Embedded Terminal Shell & Rich Headless CLI](#10-embedded-terminal-shell--rich-headless-cli)
11. [System Settings, SMTP Alerts & Disaster Recovery](#11-system-settings-smtp-alerts--disaster-recovery)
12. [Real-Time System & Debugging Logs Console](#12-real-time-system--debugging-logs-console)
13. [Cross-Platform Conda & Windows 11 Automated Installer](#13-cross-platform-conda--windows-11-automated-installer)
14. [Wake-on-LAN (WoL) Remote Power Management](#14-wake-on-lan-wol-remote-power-management)
15. [Network Bandwidth & Quality Benchmarking](#15-network-bandwidth--quality-benchmarking)

---

## 1. Subnet Discovery & Dual-Stack Network Intelligence

### 1.1 Concurrent Layer-2 ARP Broadcast Sweeper
- **Define**: A high-throughput local network discovery mechanism that broadcasts Layer-2 Address Resolution Protocol (ARP) query frames across the broadcast domain to map IPv4 addresses directly to physical 48-bit Media Access Control (MAC) hardware addresses without relying on Layer-3 IP routing.
- **Describe**:
  - *Architecture & Flow*: Evaluates the local network CIDR (e.g. `192.168.1.0/24`) and dispatches ARP `who-has` frames to the Ethernet broadcast address `ff:ff:ff:ff:ff:ff`. When hosts reply with unicast ARP replies, the engine parses hardware addresses and records microsecond round-trip latency.
  - *Parameters*: Target Subnet CIDR (`192.168.1.0/24`), Socket Timeout (`0.5s - 2.0s`), Inter-packet delay (`2ms - 15ms`).
  - *Algorithms*: Employs Linux `AF_PACKET` raw sockets and Scapy Layer-2 framing with asynchronous `select()` event loops.
  - *Progress Meter*: Real-time HUD progress bar cycles through: 0-20% Socket Binding -> 20-50% Broadcast Dispatch -> 50-80% Ingestion -> 80-100% Host Reconciliation.
- **Explain & Use**:
  - *Threat Model*: Discovers stealth devices configured with local host firewalls that drop all Layer-3 ICMP ping packets. Since ARP is required for network communication, host firewalls cannot block ARP replies while remaining connected.
  - *Procedure*: Navigate to 'Device Inventory', confirm target CIDR, click 'Start Network Scan', and monitor the animated HUD progress bar until completion.
  - *Use Cases*: Detecting unauthorized laptops, drop boxes, and rogue wireless bridges.

### 1.2 Dual-Stack IPv6 Neighbor Discovery (NDP & RFC 4291 EUI-64 SLAAC)
- **Define**: An advanced dual-stack discovery engine that interrogates kernel Neighbor Discovery Protocol (NDP) neighbor tables and computes deterministic RFC 4291 Modified EUI-64 Stateless Address Autoconfiguration (SLAAC) link-local IPv6 addresses from 48-bit MAC hardware identifiers.
- **Describe**:
  - *Architecture & Flow*: Interrogates OS neighbor tables (`netsh interface ipv6 show neighbors` on Windows 11, `ip -6 neigh show` on Linux). Applies RFC 4291 EUI-64 mathematical transformation: inverts the universal/local bit (bit 7) of the MAC and inserts `FF:FE` in the center to construct the `fe80::...` link-local address.
  - *Parameters*: Active Interface (`eth0`, `wlan0`), NDP Entries (`Integer`), EUI-64 Computed Addresses (`IPv6 Array`).
  - *Progress Meter*: Animated modal progress meter: 15% (Interface Detection) -> 40% (Kernel NDP Query) -> 70% (EUI-64 SLAAC Computation) -> 90% (SQLite Persistence) -> 100% (Complete).
- **Explain & Use**:
  - *Threat Model*: Counters shadow IT and rogue IPv6 tunneling where devices bypass IPv4-only perimeter firewalls by communicating over IPv6 link-local addresses.
  - *Procedure*: In 'Device Inventory', click 'IPv6 Neighbor Sweep'. View discovered IPv6 addresses in the inventory table and filter by 'IPv6 Stack'.

---

## 2. Device Inventory, OUI Profiling & Asset Governance

### 2.1 IEEE OUI Hardware Vendor Profiling
- **Define**: An automated hardware attribution mechanism that extracts the 24-bit Organizationally Unique Identifier (OUI) from an endpoint's MAC address and resolves it against an offline database of IEEE hardware manufacturer assignments.
- **Describe**:
  - *Architecture*: Takes the first 3 octets (`XX:XX:XX`) of a MAC address and queries an embedded dictionary of 45,000+ IEEE allocations in `netsentinel/fingerprint.py`. Detects locally administered randomized MAC bit flags (common in modern iOS and Android privacy modes).
- **Explain & Use**:
  - *Threat Model*: Instantly reveals the physical nature of connected devices. Unrecognized endpoints displaying 'Espressif Inc.' are identified as smart plugs or IoT microcontrollers rather than employee laptops.
  - *Procedure*: Inspect the 'Vendor / Brand' column in Device Inventory; click on any row to open the Device Details modal.

### 2.2 Factory Default Credentials Database & Security Profiling
- **Define**: An embedded cybersecurity vulnerability intelligence registry that matches discovered hardware profiles against known vendor factory default administrative credentials.
- **Describe**:
  - *Architecture*: Correlates recognized vendor OUIs, HTTP headers, and open RTSP/ONVIF ports with factory credentials (e.g. `admin` / `12345`, `admin` / `admin`, `(blank)`). Populates default login URLs and credential pairings.
- **Explain & Use**:
  - *Threat Model*: Defends against automated IoT botnets (Mirai, Gafgyt) that scan local networks for unpatched devices running default factory passwords.
  - *Procedure*: Open any camera or router device card; inspect the amber 'Factory Defaults & Credentials' panel; click 'Open Web Console' to change default passwords immediately.

---

## 3. Hidden Cameras & Surveillance Management

### 3.1 Live Wowza Cloud RTSP Streaming Engine (Zero Simulator)
- **Define**: A real-time network video streaming pipeline that connects directly to authentic RTSP surveillance streams over TCP interleaved sockets and transcodes video frames into high-frequency multipart MJPEG (`image2pipe`) web viewports without synthetic mockups or canvas simulators.
- **Describe**:
  - *Architecture*: NetSentinel strictly enforces a Zero-Simulator Standard. Streams originate from the primary Wowza entrypoint (`rtsp://9627b0bf2a7b.entrypoint.cloud.wowza.com:1935/app-p5260J38/66abe4b9_stream1`) or discovered local IP cameras on port 554. An asynchronous FFmpeg kernel process ingests video over TCP (`-rtsp_transport tcp`) and pipes multipart MJPEG directly to browser viewports. A cached authentic snapshot (`live_cctv_frame.jpg`, 1280x720) prevents blank viewports during RTSP connection negotiation.
  - *Parameters*: Live Stream URI, Transport Protocol (TCP Interleaved RFC 2326), Target Rate (15-30 FPS).
  - *Progress Meter*: 10% (Port 554 Scan) -> 35% (RTSP DESCRIBE) -> 65% (SDP Codec Parse) -> 90% (Transport Verify) -> 100% (Active Stream).
- **Explain & Use**:
  - *Threat Model*: Discovers unauthorized, covert, or unencrypted surveillance cameras operating inside sensitive enterprise facilities.
  - *Procedure*: Click 'Hidden Cameras' in the navigation bar; click 'Launch Fullscreen Player' on any camera card to view real-time latency and video frames.

### 3.2 Windows 11 Native Surveillance Viewing (.M3U & PowerShell)
- **Define**: A cross-platform integration suite enabling native, hardware-accelerated video decoding on Windows 11 desktop media players (VLC, Windows Media Player, PotPlayer) and browser hardware decoding.
- **Describe**:
  - *Architecture*: Dynamically generates RFC 8216 Extended M3U playlist files at `/api/cameras/:ip/playlist.m3u` and `/api/stream/playlist.m3u` with MIME type `application/x-mpegurl`. Provides copyable PowerShell launch macros (`Start-Process "vlc" -ArgumentList "rtsp://..."`).
- **Explain & Use**:
  - *Threat Model*: Eliminates browser CPU bottlenecks when monitoring multiple high-definition 4K streams by leveraging Windows 11 GPU hardware decoding (NVIDIA NVDEC, Intel QuickSync).
  - *Procedure*: Click the blue 'Win 11 Play' button on any camera card to launch your desktop media player.

### 3.3 Motorized Pan-Tilt-Zoom (PTZ) Controller & Optical Presets
- **Define**: An interactive directional control interface sending motorized pan, tilt, optical zoom, and preset positioning commands to compatible ONVIF Profile S and HTTP-controllable IP surveillance cameras.
- **Describe**:
  - *Architecture*: Dispatches `POST /api/cameras/:ip/ptz` payloads to translate operator button presses into ONVIF SOAP `ContinuousMove` or vendor CGI commands. Includes 8-way directional movement, optical zoom, center reset, speed slider (1-100%), and 4 programmable security sector presets.
- **Explain & Use**:
  - *Threat Model*: Enables security teams to track moving intruders across facility grounds and zoom in on license plates or faces in real time.
  - *Procedure*: Open any camera's Management Drawer, navigate to the PTZ Control Pad, and click directional arrows or Preset buttons 1-4.

---

## 4. Multi-Threaded Port Scanner & Turbo Tuning

### 4.1 High-Concurrency TCP Connect Prober (Up to 500 Threads)
- **Define**: A high-throughput socket auditing engine utilizing a non-blocking thread worker pool capable of auditing up to 500 TCP ports concurrently across target endpoints.
- **Describe**:
  - *Architecture*: Dispatches parallel POSIX socket connections (`socket.SOCK_STREAM`) with configurable timeouts (0.2s to 1.5s). Executes full TCP three-way handshakes (`SYN` -> `SYN-ACK` -> `ACK`), scanning all 1,024 well-known ports in under 2 seconds.
  - *Progress Meter*: Live HUD counter displaying `Checked / Total (100.0%)`, active open ports, and scanning throughput in ports/second.
- **Explain & Use**:
  - *Threat Model*: Exposes open backdoors, database listeners, and unencrypted management interfaces before malicious threat actors exploit them.
  - *Procedure*: Navigate to 'Port Audit', select a target IP, pick a range profile (Top 50, Well-Known, Full 65535), adjust the thread slider, and click 'Start Port Scan'.

### 4.2 Application Banner Grabbing & Service Version Fingerprinting
- **Define**: An active protocol inspection routine that sends initial protocol probe requests to open TCP ports to capture application service banners, server software versions, and SSL/TLS certificates.
- **Describe*:
  - *Architecture*: Sends protocol handshakes (SSH preamble, HTTP HEAD request, TLS ClientHello) upon port connection. Parses software names (Nginx, OpenSSH, Apache) and matches versions against known CVE risk databases to assign High, Medium, or Low severity scores.
- **Explain & Use**:
  - *Threat Model*: Identifies unpatched and end-of-life software services vulnerable to remote code execution (RCE).
  - *Procedure*: Review the 'Open Ports & Services' table; examine service version badges and follow provided hardening advice.

---

## 5. Remote Access Trojan (RAT) & Workstation Host Integrity

### 5.1 35+ Known Trojan & C2 Beacon Signature Prober
- **Define**: An active threat detection prober that transmits specialized protocol handshakes to identify listener sockets and command-and-control (C2) beacons corresponding to 35+ known Remote Access Trojan families.
- **Describe**:
  - *Architecture*: Probes for DarkComet (1604), njRAT/Bladabindi (5552, 1177), QuasarRAT (4782), AsyncRAT (6666, 7000), Warzone/Ave Maria (5200), RedLine Stealer (8085), Remcos (2404), Gh0st RAT (2001), Cobalt Strike (50050), Metasploit (4444), Havoc C2 (40056), Mythic C2 (7443), PlugX, SubSeven, and Mirai botnets.
  - *Progress Meter*: Multi-phase progress bar: Socket Enumeration -> Behavioral Handshakes -> C2 Certificate Analysis -> Threat Classification.
- **Explain & Use**:
  - *Threat Model*: Detects compromised workstations acting as command-and-control beacons for ransomware or espionage actors.
  - *Procedure*: Open 'RAT & Backdoors', choose target scope (Subnet or Single Host), and click 'Launch RAT Threat Scan'. Click 'Quarantine Device' immediately if a signature is confirmed.

### 5.2 Workstation Host System Integrity & Memory Audit
- **Define**: A local forensic auditing engine that inspects active listening high-port sockets, detects unlinked or deleted executables running in memory (`(deleted)`), and audits autorun persistence keys on the local operating system.
- **Describe**:
  - *Architecture*: On Linux, inspects `/proc/*/exe` via `readlink` to identify processes where the on-disk binary was deleted while continuing to execute in RAM. Flags 0.0.0.0 high-port listeners. On Windows 11, audits `netstat -ano`, suspicious `%APPDATA%` executables, and Run registry persistence keys.
- **Explain & Use**:
  - *Threat Model*: Detects fileless malware, process hollowing, and memory-injection backdoors.
  - *Procedure*: In the RAT Console, click 'Run Workstation Audit' to inspect memory-resident processes.

---

## 6. Zero-Trust Quarantine & Endpoint Isolation Deck

### 6.1 Active vs. Dormant Quarantine Isolation Engine
- **Define**: A state-machine containment system that isolates untrusted or compromised endpoints, distinctly partitioning them into active online endpoints (currently transmitting packets) and dormant offline endpoints to guarantee containment across reconnects.
- **Describe**:
  - *Architecture*: Updates `devices.is_quarantined = 1` in SQLite with timestamp and mandatory reason. Active quarantined devices transmitting traffic display pulsing red indicators. Dormant endpoints remain isolated in database memory so they cannot bypass isolation upon reconnecting.
- **Explain & Use**:
  - *Threat Model*: Prevents compromised machines from moving laterally across internal subnets or exfiltrating data.
  - *Procedure*: Open 'Quarantine Deck'; view partitioned active vs. dormant devices; click 'Release from Quarantine' once a machine has been disinfected.

---

## 7. Network Diagnostics & DNS Testing Suite

### 7.1 Dual-Mode Ping Engine (ICMP Echo + TCP SYN Firewall Bypass)
- **Define**: A precision round-trip latency and jitter prober executing standard ICMP Echo Requests with automatic, transparent fallback to TCP SYN handshakes when ICMP echo packets are blocked by host firewalls.
- **Describe**:
  - *Architecture*: Measures latency with microsecond clocks (`time.perf_counter()`). If ICMP echo requests time out due to Windows Defender or corporate firewall drop rules, it immediately dispatches TCP SYN packets to port 80 or 443, capturing true latency from SYN-ACK or RST replies.
- **Explain & Use**:
  - *Threat Model*: Diagnoses reachability for hardened servers that deliberately ignore ICMP ping.
  - *Procedure*: Open 'Network Tools' -> 'Ping', select a target IP, set packet count, and click 'Run Ping Test'.

### 7.2 Parallel Hop-by-Hop Traceroute Engine
- **Define**: A high-speed route trace prober that measures routing pathways, intermediate router hops, and hop latency by transmitting multi-threaded packets with incrementing Time-To-Live (TTL) values simultaneously.
- **Describe**:
  - *Architecture*: Emits probes with TTL values 1 to 30 simultaneously across worker threads. Captures ICMP Time Exceeded (Type 11 Code 0) packets from intermediate routers and resolves reverse PTR DNS hostnames in under 2 seconds.
- **Explain & Use**:
  - *Threat Model*: Pinpoints upstream ISP bottlenecks, routing loops, and packet loss hops.
  - *Procedure*: In 'Network Tools', select 'Traceroute', enter destination IP/domain, and click 'Run Traceroute'.

---

## 8. DNS Hijacking & Poisoning Defense

### 8.1 NXDOMAIN Wildcard Redirection Detection
- **Define**: A security probe that tests whether the local DNS resolver correctly returns RFC 1035 RCODE 3 (NXDOMAIN Non-Existent Domain) or fraudulently resolves non-existent domains to monetization or surveillance IP addresses.
- **Describe**:
  - *Architecture*: Dispatches DNS queries for pseudo-random non-existent domains (e.g. `nx-9821734.invalid`). If the resolver answers with an IP address (RCODE 0), NXDOMAIN hijacking is confirmed.
- **Explain & Use**:
  - *Threat Model*: Protects against intrusive ISP adware injection and malicious router DNS poisoning.
  - *Procedure*: Open 'Network Tools' -> 'DNS Hijack Audit' and click 'Execute DNS Security Audit'.

### 8.2 Transparent Port 53 Gateway Interception Probe
- **Define**: A diagnostic prober detecting whether local gateway firewalls or ISPs perform transparent NAT redirection of outbound UDP port 53 traffic, forcibly hijacking queries destined for third-party nameservers.
- **Describe**:
  - *Architecture*: Sends a DNS query to an unallocated bogon public IP on port 53. If a response is received, the gateway firewall is transparently intercepting all port 53 traffic.
- **Explain & Use**:
  - *Threat Model*: Exposes silent ISP or government censorship proxies overriding user DNS settings.
  - *Procedure*: Run the DNS Hijack Audit; if port 53 interception is flagged, switch immediately to DNS-over-HTTPS (DoH).

---

## 9. Wi-Fi Multi-Band Spectrum & Saturation Analyzer

### 9.1 Tri-Band 802.11 Spectrum Discovery (2.4, 5, and 6 GHz Wi-Fi 6E/7)
- **Define**: A comprehensive wireless spectrum discovery engine that enumerates all surrounding access points and client networks across 2.4 GHz (channels 1–14), 5 GHz (channels 36–165), and next-generation 6 GHz Wi-Fi 6E / Wi-Fi 7 (channels 1–233) frequency spectrums.
- **Describe**:
  - *Architecture*: Queries wireless interfaces via `netsh wlan show networks mode=bssid` on Windows 11 and `nmcli dev wifi list` on Linux. Measures link quality in percentage (%) and absolute decibels (-30 dBm to -95 dBm).
- **Explain & Use**:
  - *Threat Model*: Uncovers rogue access points, evil twin phishing portals, and unapproved wireless hotspots.
  - *Procedure*: Open 'Wi-Fi Spectrum', use frequency band filters (All, 2.4 GHz, 5 GHz, 6 GHz), and inspect channel distributions.

### 9.2 Channel Saturation & Inter-AP Interference Algorithms
- **Define**: A mathematical radio frequency interference model that computes aggregate channel congestion by weighting overlapping co-channel transmitters and adjacent-channel bleed.
- **Describe**:
  - *Architecture*: Applies a 1.0x penalty factor to competing BSSIDs sharing the same primary channel (forcing CSMA/CA backoff delays), and a 0.35x penalty to access points on overlapping adjacent channels (sideband bleed). Computes an objective Saturation Rating (Low, Moderate, Congested).
- **Explain & Use**:
  - *Threat Model*: Eliminates packet drops and latency jitter during video conferencing and real-time streaming.
  - *Procedure*: Review the 'Optimization Advice' banner in the Wi-Fi Spectrum tab and reconfigure your router to the recommended clean channel.

---

## 10. Embedded Terminal Shell & Rich Headless CLI

### 10.1 Embedded Interactive Terminal & Execution Progress Meter
- **Define**: An interactive web terminal emulator communicating directly with backend execution handlers over `/api/terminal/exec` featuring an animated real-time progress meter positioned above the command prompt.
- **Describe**:
  - *Architecture*: Provides a `NetSentinel $ ` browser pseudo-shell supporting commands: `help`, `devices`, `scan`, `ipv6`, `portscan <ip>`, `cameras`, `dnshijack`, `rat-check`, `speedtest`, and `status`. An animated progress meter bar above the prompt provides active percentage and phase telemetry during command execution. Supports CRT phosphor green scanline mode.
- **Explain & Use**:
  - *Threat Model*: Empowers keyboard-driven security operators to trigger scripted sweeps without menu navigation.
  - *Procedure*: Open 'Terminal', type `ipv6 sweep` or `portscan 192.168.1.1`, and press Enter.

### 10.2 Python Rich CLI & Autonomous Intruder Monitoring Daemon
- **Define**: A headless command-line interface and background system daemon leveraging the Python `rich` library to render color-coded tables and autonomously monitor local networks 24/7 for unauthorized intruders.
- **Describe**:
  - *Architecture*: Executed via `python3 cli.py --daemon --interval <seconds>`. The daemon runs periodic silent discovery sweeps, compares discovered MACs against trusted database records, records intruder alerts, and dispatches SMTP incident emails.
- **Explain & Use**:
  - *Threat Model*: Provides perpetual 24/7 boundary defense on headless servers and Raspberry Pis.
  - *Procedure*: Run `python3 cli.py --daemon --interval 30` in an SSH session or register as a systemd service.

---

## 11. System Settings, SMTP Alerts & Disaster Recovery

### 11.1 Automated SMTP Email Incident Dispatcher
- **Define**: An automated notification subsystem that dispatches formatted HTML incident alerts via configured SMTP mail relays upon the occurrence of critical security events.
- **Describe**:
  - *Architecture*: Connects to SMTP relays (Port 587 STARTTLS / Port 465 SSL). Dispatches automated alerts on event triggers: 'New Unknown Device Joined', 'Device Quarantined', 'RAT Trojan Detected', or 'Port Scan Alert'. Includes a live 'Test SMTP Connection' diagnostic.
- **Explain & Use**:
  - *Threat Model*: Notifies security officers immediately on mobile devices when network breaches occur.
  - *Procedure*: In 'Settings', enter SMTP relay credentials, configure recipient inboxes, and click 'Test SMTP Connection'.

### 11.2 Atomic SQLite Backup Snapshots & Retention Rotation
- **Define**: A zero-downtime database snapshot engine that generates timestamped, point-in-time `.db` archives of the operational database with animated progress meters and automated retention rotation.
- **Describe**:
  - *Architecture*: Uses the SQLite Online Backup API (`VACUUM INTO`) to generate lock-free atomic snapshots (`netsentinel_backup_YYYYMMDD_HHMMSS.db`). Features an animated progress bar during snapshot creation and enforces automated retention (retaining the last 5, 10, or 30 archives).
- **Explain & Use**:
  - *Threat Model*: Protects against database corruption, accidental deletion, or host hardware failures.
  - *Procedure*: In 'Settings' -> 'Backup & Disaster Recovery', click 'Create Backup Now'.

---

## 12. Real-Time System & Debugging Logs Console

### 12.1 Dual-Layer Telemetry Bus (In-Memory Ring Buffer + SQLite WAL)
- **Define**: A hybrid logging architecture that unifies a high-throughput in-memory circular ring buffer (up to 2,500 active events) with persistent SQLite `system_logs` storage to enable real-time live streaming with zero disk I/O bottlenecks.
- **Describe**:
  - *Architecture*: Retains recent events in Node.js circular memory for real-time Server-Sent Events (SSE) browser streaming. Asynchronously commits entries to SQLite with UTC timestamps, severity levels (DEBUG, INFO, WARN, ERROR), subsystem categories, JSON argument payloads, and full multi-line stack tracebacks.
- **Explain & Use**:
  - *Threat Model*: Provides complete forensic auditability into all socket connections and authentication handshakes.
  - *Procedure*: Navigate to 'System & Debug Logs', use severity filter buttons, and click any log entry to open the Deep Inspector modal.

---

## 13. Cross-Platform Conda & Windows 11 Automated Installer

### 13.1 Windows 11 Automated Installer & UAC-Elevating Launcher
- **Define**: An automated, self-contained deployment suite that validates 64-bit Windows 11 architecture, silently installs Miniconda into user profiles, provisions an isolated Conda environment (Python 3.11 + Node.js 20), creates Desktop and Start Menu shortcuts, and opens port 3000 in Windows Defender Firewall.
- **Describe**:
  - *Architecture*: Distributed as `NetSentinel-Windows11-Setup.zip`. `install-windows11.bat` checks for UAC elevation; `install.ps1` executes silent Miniconda installation, provisions `netsentinel` Conda environment, builds the Vite production frontend, creates a Desktop shortcut ('NetSentinel Security'), and configures an inbound firewall rule for Port 3000.
- **Explain & Use**:
  - *Threat Model*: Streamlines rapid, error-free deployment on Windows 11 security laptops and workstations.
  - *Procedure*: Download `NetSentinel-Windows11-Setup.zip`, extract, right-click `install-windows11.bat`, and select 'Run as administrator'.

---

## 14. Wake-on-LAN (WoL) Remote Power Management

### 14.1 Wake-on-LAN (WoL) Magic Packet Broadcast Engine
- **Define**: A remote hardware power management utility that constructs and broadcasts an RFC-compliant 102-byte UDP Magic Packet containing a synchronization preamble and 16 repetitions of a target machine's 48-bit MAC address to power on sleeping endpoints.
- **Describe**:
  - *Architecture*: Constructs a 102-byte binary payload: 6 bytes of `0xFF` synchronization sequence followed by 16 repetitions of the target's 6-byte MAC address. Broadcasts via UDP socket to ports 7 and 9 across the subnet broadcast address (`255.255.255.255`).
- **Explain & Use**:
  - *Threat Model*: Wakes remote backup servers and workstations for emergency patching without physical site visits.
  - *Procedure*: In 'Device Inventory', select an offline device and click 'Send Wake-on-LAN Packet'.

---

## 15. Network Bandwidth & Quality Benchmarking

### 15.1 Multi-Stream Network Quality & Bandwidth Benchmark
- **Define**: A high-precision network benchmarking engine measuring downlink bandwidth (Mbps), uplink throughput (Mbps), idle round-trip latency (ms), and loaded bufferbloat jitter by executing chunked multi-stream data transfers against calibrated endpoints.
- **Describe**:
  - *Architecture*: Executes three phases: 1) Latency/Jitter burst phase; 2) Parallel chunked HTTP download saturation; 3) Outbound upload streaming. Results are stored in SQLite `speed_tests` with client public IP, ISP name, and server geolocation.
  - *Progress Meter*: HUD progress bar cycles through Latency Probing (25%) -> Download Saturation (60%) -> Upload Saturation (95%) -> Completion (100%).
- **Explain & Use**:
  - *Threat Model*: Validates carrier SLAs, detects ISP bandwidth throttling, and diagnoses bufferbloat latency spikes.
  - *Procedure*: In 'Network Tools' -> 'Speed Test', click 'Run Speed Benchmark'.
