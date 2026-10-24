# NetSentinel Architecture Documentation

## 1. System Overview

**NetSentinel** is a modular, defense-grade local network intelligence, hardware inventory, multi-band spectrum analysis, and cyber intrusion detection suite. Engineered with a multi-threaded Python 3.11 backend and a full-stack Express + React 19 web console, it exceeds enterprise scanners like Fing Desktop.

```
+-----------------------------------------------------------------------------------------+
|                                    User Interfaces                                      |
|   +--------------------------+   +--------------------------+   +-------------------+   |
|   |   React 19 Web Console   |   |  Real-Time Logs Console  |   | Terminal TUI (CLI)|   |
|   +-------------+------------+   +-------------+------------+   +---------+---------+   |
+-----------------|------------------------------|--------------------------|-------------+
                  |                              |                          |
                  v                              v                          v
+-----------------------------------------------------------------------------------------+
|                        NetSentinel Express API Gateway & Telemetry Bus                  |
|                                                                                         |
|  +------------------------+  +------------------------+  +---------------------------+  |
|  | Subnet & Adapter Engine|  | Wi-Fi Spectrum Engine  |  | Multi-Thread Port Prober  |  |
|  | - Linux (ip, sysfs)    |  | - 2.4 / 5 / 6 GHz Bands|  | - Up to 500 workers       |  |
|  | - Windows (PowerShell) |  | - Signal (%) and (dBm) |  | - Real-time checked/total |  |
|  | - Gateway & CIDR map   |  | - Saturation metrics   |  | - Banner grabbing         |  |
|  +-----------+------------+  +-----------+------------+  +-------------+-------------+  |
|              |                           |                             |                |
|  +-----------v------------+  +-----------v------------+  +-------------v-------------+  |
|  | Security & Surveillance|  | Diagnostic Suite       |  | System & Debug Logger     |  |
|  | - RAT Trojan Signatures|  | - ICMP ping & jitter   |  | - In-memory ring buffer   |  |
|  | - RTSP Camera Probes   |  | - Traceroute & DNS     |  | - SQLite system_logs      |  |
|  | - Router UPnP / DNS    |  | - Speedtest benchmark  |  | - DEBUG/INFO/WARN/ERROR   |  |
|  +-----------+------------+  +-----------+------------+  +-------------+-------------+  |
+--------------|---------------------------|-----------------------------|----------------+
               v                           v                             v
+-----------------------------------------------------------------------------------------+
|                              Data Persistence & Storage                                 |
|                SQLite3 Database (`netsentinel.db` with WAL & Thread Safety)             |
|   Tables: devices, port_scans, speed_tests, security_alerts, system_logs, app_settings  |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Multi-Platform Network Device & Adapter Identification

To achieve parity across Windows and Linux, `netsentinel.discovery.SubnetDiscoveryEngine` implements native host commands:

- **Windows 11 / 10**:
  Executes PowerShell `Get-NetIPConfiguration`, `Get-NetAdapter`, and `Get-NetRoute`, with fallback to `ipconfig /all`.
  Resolves:
  - Adapter friendly name & hardware description (e.g., `Intel(R) Wi-Fi 6E AX211 160MHz`)
  - Operational status (`up`/`down`) and link speed
  - MAC hardware addresses and IPv4 bindings
  - Default gateways and per-adapter routing gateways
  - All routable CIDR subnets

- **Linux**:
  Parses `ip -d addr show`, `ip -4 route show`, `/proc/net/route`, and `/sys/class/net/*`.
  Maps loopback, Ethernet, and wireless interfaces with operational states (`operstate`), hardware MACs (`address`), and default route metrics.

---

## 3. Wi-Fi Spectrum & Saturation Architecture

The Wi-Fi Analyzer Engine (`netsentinel.wifi.WifiAnalyzerEngine`) interrogates local 802.11 wireless hardware across three frequency bands:
- **2.4 GHz Band**: Channels 1–14 (802.11b/g/n/ax)
- **5 GHz Band**: Channels 36–165 (802.11a/n/ac/ax)
- **6 GHz Band**: Channels 1–233 (Wi-Fi 6E / Wi-Fi 7 / 802.11axe/be)

### Saturation Calculation Algorithms:
1. **Frequency Spectrum Saturation**:
   $$\text{Saturation}_{\text{band}} = \min\left(100, \frac{\sum \text{APs} \times 12\% + \sum \text{Co-Channel Weights}}{\text{Channel Count}}\right)$$
2. **Channel Saturation**:
   Accounts for co-channel interference ($1.0\times$) and adjacent channel energy bleed ($0.35\times$ on overlapping $\pm 1$ channels).
3. **SSID Congestion & Health Rating**:
   Evaluates received signal strength indicator (RSSI in dBm) relative to the local noise floor and competing APs on the same channel to compute an optimal channel recommendation.

---

## 4. Real-Time Logging & Telemetry Bus

NetSentinel implements a dual-layer logging bus:
1. **High-Speed In-Memory Ring Buffer**:
   Retains the last 2,500 system and debugging entries in Node.js memory for zero-latency UI polling and live streaming.
2. **Persistent SQLite Store (`system_logs`)**:
   Maintains historical audit trails with fields: `id`, `timestamp`, `level`, `category`, `module`, `message`, `details` (JSON), `ip`, `mac`, and `traceback`.
3. **Process Telemetry**:
   Every Python process spawned via `spawnPythonProcess` records runtime duration, exit code, arguments, and standard error lines at `DEBUG` or `ERROR` levels.
4. **Real-Time Event Streams**:
   - `STATUS:{"stage": ..., "message": ..., "percent": ...}` streams network discovery progress.
   - `PROGRESS:{"checked": ..., "total": ..., "port": ..., "open_count": ...}` streams real-time port audit counters.

---

## 5. Windows 11 Automated Installer & OS Integration

NetSentinel includes an automated Windows 11 installation system:
- **`install-windows11.bat`**: Elevated launcher with UAC elevation detection, architecture check, and auto-launch prompts.
- **`install.ps1`**:
  - Silent download and deployment of 64-bit Miniconda to `%USERPROFILE%\miniconda3`.
  - Provisioning of the dedicated `netsentinel` Conda environment (Python 3.11 + Node.js 20).
  - Creation of a **Windows 11 Desktop Shortcut** (`NetSentinel Security.lnk`).
  - Creation of a **Start Menu Programs Folder** (`Programs > NetSentinel`).
  - Configuration of a **Windows Defender Firewall** inbound rule for Port 3000.
  - Driver verification for Npcap / WinPcap packet sniffer libraries.
- **`make_win11_installer.py`**: Packages a self-contained `.zip` archive containing all batch scripts, backend modules, and compiled web assets.
