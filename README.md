# NetSentinel — Network Security Intelligence Suite

> **Defense-grade local network discovery, device inventory, Wi-Fi spectrum analysis, port auditing, surveillance detection, and cyber defense exceeding commercial tools like Fing.**

---

## Highlights & Capabilities

- 🔍 **Cross-Platform Multi-Adapter & Dual-Stack IPv6 Discovery**: Interrogates physical and virtual network adapters across both Windows 11 (`Get-NetIPConfiguration`, `netsh interface ipv6 show neighbors`, `Get-NetNeighbor`) and Linux (`ip -d addr show`, `ip -6 neigh show`, `/proc/net/route`), resolving both IPv4 CIDR subnets and deterministic RFC 4291 EUI-64 IPv6 SLAAC neighbor addresses.
- 📊 **Universal Real-Time Progress Meters**: Strict design standard requiring that every operation that takes time—including subnet sweeps, IPv6 neighbor sweeps, multi-threaded port scans, RAT malware audits, database backups, and CLI terminal commands—features an interactive animated progress meter displaying active percentages and execution phases.
- 📷 **Live Wowza Cloud RTSP Surveillance & Zero-Simulator Architecture**: Streams high-definition surveillance video directly from `rtsp://9627b0bf2a7b.entrypoint.cloud.wowza.com:1935/app-p5260J38/66abe4b9_stream1` using low-latency kernel FFmpeg MJPEG pipelines (`image2pipe`). NetSentinel completely eliminates simulated canvases—all feeds are true network video streams.
- 🪟 **Windows 11 Native Camera Viewing & Media Integration**:
  - In-browser hardware-accelerated playback on Microsoft Edge and Chrome (`/api/stream/live` and `/api/cameras/:ip/stream`).
  - One-click `.m3u` playlist downloads (`/api/cameras/:ip/playlist.m3u`) ready for instant opening in Windows Media Player, VLC, PotPlayer, or MPC-HC.
  - Native PowerShell & Windows Terminal launch commands (`Start-Process "vlc" -ArgumentList "rtsp://..."`).
- 📡 **Wi-Fi Multi-Band Spectrum & Saturation Analyzer**: Full multi-band discovery across **2.4 GHz**, **5 GHz**, and **6 GHz (Wi-Fi 6E/7)**. Measures link quality in percentage (%) and absolute dBm, computes co-channel and adjacent-channel interference, calculates spectrum, channel, and SSID saturation %, and provides automated channel migration advice.
- ⚡ **Multi-Threaded Port Scanner & Live Counter**: High-throughput TCP connect prober (up to 500 parallel worker threads) with a real-time **Checked vs. Total Counter** (`1,024 / 1,024 (100.0%)`) across Top 50, Top 100, Well-Known (1–1,024), Extended (1–10,000), Full (1–65,535), and custom ranges.
- 📜 **Real-Time System & Debugging Logs Console**: Dual-layer logging bus combining a fast in-memory ring buffer (up to 2,500 entries) with a persistent SQLite `system_logs` table. Offers live streaming, auto-scroll, severity level filters (`DEBUG`, `INFO`, `WARN`, `ERROR`), category filters, full-text instant search, JSON payload inspector, exception traceback modal, and `.log` / `.json` export.
- 🪟 **Official Windows 11 Automated Installer**:
  - One-click launcher: `install-windows11.bat` with UAC elevation detection.
  - Automated PowerShell provisioning: `install.ps1` silently installs 64-bit Miniconda, creates a dedicated `netsentinel` Conda environment (Python 3.11 + Node.js 20), creates a **Desktop Shortcut ("NetSentinel Security")**, registers a **Start Menu folder**, and configures an inbound **Windows Defender Firewall** rule for Port 3000.
  - Downloadable directly from the UI or executable via modern Windows Terminal one-liner.
- 🌐 **Cross-Platform Ping & Network Diagnostic Suite**: Ultra-fast ICMP and TCP SYN latency prober with IPv4/IPv6 support, microsecond precision, jitter/deviation tracking, parallel hop-by-hop traceroute (15 hops in under 2 seconds), and automatic firewall bypass fallback when ICMP echo is filtered.
- 🛡️ **Advanced Remote Access Trojan (RAT) & Workstation Host Integrity**: Deep defense against 35+ Trojan families (DarkComet, njRAT, Quasar, AsyncRAT, Cobalt Strike, Metasploit, Warzone/Ave Maria, Havoc, PlugX, RedLine, Vidar). Features active behavioral protocol handshakes, network-wide sweep, and local workstation/server forensic audit (detecting unlinked/deleted memory binaries, 0.0.0.0 high-port binds, and autorun persistence).
- 🔒 **Router UPnP & DNS Poisoning Defense**: Verifies DNS integrity against trusted resolvers and audits router UPnP exposure.
- ⚡ **Wake-on-LAN (WoL)**: Sends RFC-compliant 102-byte UDP Magic Packet broadcasts to wake sleep-state machines remotely.
- 🔒 **100% Local & Private**: Operates exclusively on local network interfaces without cloud telemetry or external accounts. All data is persisted locally in `netsentinel.db` (SQLite with WAL mode).

---

## Quick Start: Windows 11

### Option A: One-Click Installer Launcher (Recommended)
1. Download **`install-windows11.bat`** (or download the full **`NetSentinel-Windows11-Setup.zip`** from the web console).
2. Right-click **`install-windows11.bat`** and select **"Run as administrator"**.
3. The installer will automatically:
   - Validate 64-bit Windows 11 architecture.
   - Install 64-bit Miniconda into `%USERPROFILE%\miniconda3`.
   - Provision the `netsentinel` Conda environment (Python 3.11 + Node.js 20).
   - Place a **"NetSentinel Security"** shortcut on your Windows 11 Desktop.
   - Add a Start Menu folder under `Programs > NetSentinel`.
   - Open Port 3000 in Windows Defender Firewall.
   - Compile the frontend production assets.
4. Launch NetSentinel anytime by double-clicking the **"NetSentinel Security"** shortcut on your Desktop or executing `start.bat`.
5. Open your browser at: `http://localhost:3000`

### Option B: Windows Terminal / PowerShell One-Liner
Open **Windows Terminal** (`wt.exe`) or **PowerShell 7+** as Administrator and run:
```powershell
irm http://localhost:3000/api/installer/windows11/script | iex
```

---

## Quick Start: Linux & macOS

### Automated Conda Provisioning & Build
```bash
# 1. Run the automated Conda setup script
chmod +x setup_conda.sh
./setup_conda.sh

# 2. Activate the conda environment
conda activate netsentinel

# 3. Start the application server
npm run dev
```

### Accessing the Web Console
Open your browser at:
```
http://localhost:3000
```

---

## Headless CLI Tool (`cli.py`)

NetSentinel provides an interactive Terminal User Interface (TUI) and headless CLI for automated terminal sweeps:

```bash
# Full subnet discovery sweep with Rich color table
python3 cli.py --scan

# List entire device inventory and quarantine states
python3 cli.py --inventory

# Multi-threaded port scan on a specific target host
python3 cli.py --portscan 192.168.1.1

# Detect hidden surveillance cameras and RTSP feeds
python3 cli.py --cameras

# Audit router UPnP exposure and DNS integrity
python3 cli.py --router-audit

# Run network bandwidth and latency speedtest benchmark
python3 cli.py --speedtest

# Launch background intruder monitoring daemon (checks every 30s)
python3 cli.py --daemon --interval 30
```

---

## REST API Overview

Served on `http://localhost:3000/api`:

- **Network Discovery**: `GET /api/status`, `GET /api/devices`, `POST /api/scan`, `GET /api/scan/status`, `GET /api/network-interfaces`
- **Wi-Fi Spectrum**: `GET /api/wifi/scan`, `POST /api/wifi/rescan`
- **Port Auditing**: `POST /api/portscan`, `GET /api/portscan/status`
- **Security & Cameras**: `GET /api/router-audit`, `GET /api/cameras`, `POST /api/rat-detector/scan`, `GET /api/alerts`
- **Diagnostics & Control**: `POST /api/nettools/ping`, `POST /api/nettools/traceroute`, `POST /api/nettools/dns-lookup`, `POST /api/speedtest`, `POST /api/wol`
- **System & Debug Logs**: `GET /api/logs`, `GET /api/logs/stats`, `POST /api/logs`, `POST /api/logs/test`, `POST /api/logs/debug-mode`, `GET /api/logs/export`, `DELETE /api/logs`
- **Windows 11 Installer**: `GET /api/installer/windows11/zip`, `GET /api/installer/windows11/bat`, `GET /api/installer/windows11/script`, `GET /api/installer/windows11/start`

For full REST API schemas and parameters, see [`docs/API.md`](docs/API.md).

---

## Technical Documentation

- 📖 [`docs/FEATURES_MANUAL.md`](docs/FEATURES_MANUAL.md) — Exhaustive technical engineering manual defining, describing, and explaining operational procedures for every single feature.
- 📐 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Multi-tier discovery architecture, Wi-Fi spectrum algorithms, and logging telemetry bus.
- 📡 [`docs/API.md`](docs/API.md) — Comprehensive Python and Express REST API documentation.
- 🛡️ [`docs/SECURITY.md`](docs/SECURITY.md) — Privilege isolation, safe socket auditing, and ARP cache poisoning defense.
- 📊 [`docs/PAID_FING_COMPARISON.md`](docs/PAID_FING_COMPARISON.md) — Feature matrix comparing NetSentinel against Fing Free, Fing Premium, and Fingbox.
