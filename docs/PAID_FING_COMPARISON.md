# NetSentinel vs. Fing Feature Matrix

Detailed comparison between **NetSentinel**, standard **Fing Free**, and paid commercial tiers (**Fing Desktop Premium** & **Fingbox**).

| Feature Capability | Fing (Free) | Fing Premium / Fingbox ($6.99/mo) | NetSentinel (Open Architecture) |
|---|:---:|:---:|:---:|
| **Fast Subnet ARP Sweep** | Yes | Yes | **Yes** (Scapy, Nmap, Kernel ARP) |
| **Real-Time Network Scan Status HUD** | No | No | **Yes** (Live progress bar, stage & devices found) |
| **Multi-Adapter & Multi-Subnet Discovery** | Basic | Limited | **Yes** (Linux & Windows Native Adapter Map) |
| **Hardware OUI Vendor Lookup** | Basic | Extensive | **Yes** (80+ Vendor Registry + IEEE DB) |
| **Randomized MAC Detection** | Partial | Yes | **Yes** (IEEE LAA Bit Analysis) |
| **Port Scanning & Banner Grabbing** | Basic | Unlimited Ports | **Yes** (Up to 500 parallel worker threads) |
| **Port Scan Checked vs. Total Counter** | No | No | **Yes** (Real-time `checked / total` display) |
| **Wi-Fi Multi-Band Spectrum Analyzer** | Basic 2.4/5G | 2.4/5G List | **Yes** (2.4 GHz, 5 GHz & 6 GHz Wi-Fi 6E/7) |
| **Wi-Fi Saturation & Interference Metrics** | No | No | **Yes** (Band, channel & SSID saturation %) |
| **Bandwidth Speed Test & Ping** | Basic | Historical Timeline | **Yes** (speedtest-cli + CDN RTT) |
| **JSON & RFC CSV Export** | No (Paid) | Yes | **Yes** (Built-in Export Engine) |
| **Intruder Alert Daemon** | Limited | Real-time Push | **Yes** (Background Thread + Web/CLI) |
| **ARP Spoofing / Poisoning Detection** | No | Yes (Fingbox only) | **Yes** (Gateway MAC anomaly tracker) |
| **Router Security & UPnP Exposure** | No | Yes (Premium) | **Yes** (`RouterVulnerabilityEngine`) |
| **DNS Hijacking & Integrity Audit** | No | Yes (Premium) | **Yes** (Cross-resolver validation) |
| **Automated Network Health Score** | No | Yes (Score 0-100) | **Yes** (Grade A-F + risk deductions) |
| **Hidden Camera & RTSP Stream Detection** | No | Yes (Fingbox / Premium) | **Yes** (`SurveillanceDetector`) |
| **Remote Access Trojan (RAT) Detector** | No | No | **Yes** (30+ malware & backdoor signatures) |
| **Remote Wake-on-LAN (WoL)** | Mobile only | Yes | **Yes** (UDP Magic Packet engine) |
| **Device Presence & Timeline History** | Limited | Yes (Timeline & Outages) | **Yes** (`PresenceTimelineEngine`) |
| **Simulated Internet Pause Policy** | No | Yes (Fingbox only) | **Yes** (Access policy controller) |
| **Unified System & Debug Logs Console** | No | No | **Yes** (DEBUG/INFO/WARN/ERROR + tracebacks) |
| **Windows 11 One-Click Installer** | Installer.exe | Installer.exe | **Yes** (`install-windows11.bat` + `.ps1`) |
| **Rich Terminal User Interface (TUI)** | No | No | **Yes** (Interactive `rich` CLI/TUI) |
| **Full-Stack Web Console & REST API** | No | Cloud Dashboard | **Yes** (Local self-hosted on port 3000) |
| **Offline Privacy & Local SQLite** | Cloud-synced | Cloud-synced | **100% Local & Private (`netsentinel.db`)** |
