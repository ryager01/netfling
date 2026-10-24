import React, { useState } from "react";
import {
  BookOpen,
  Search,
  Wifi,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Camera,
  Cpu,
  HardDrive,
  Database,
  Terminal,
  Activity,
  Gauge,
  Clock,
  Compass,
  Lock,
  Mail,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Code,
  Layers,
  FileCode,
  Zap,
  Sparkles,
  Settings,
  Download,
  Radio,
  Bug,
} from "lucide-react";

interface DocumentationViewProps {
  showToast: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

interface DocSection {
  id: string;
  title: string;
  badge: string;
  icon: any;
  summary: string;
  content: React.ReactNode;
}

export const DocumentationView: React.FC<DocumentationViewProps> = ({
  showToast,
  onNavigateTab,
}) => {
  const [activeSectionId, setActiveSectionId] = useState<string>("overview");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    showToast("Command copied to clipboard!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sections: DocSection[] = [
    {
      id: "overview",
      title: "1. System Overview & Architecture",
      badge: "Core Architecture",
      icon: Layers,
      summary: "High-level architectural design, Fing-exceeding engine, and Linux kernel integration.",
      content: (
        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <p>
            <strong className="text-white">NetSentinel</strong> is a carrier-grade network intelligence, hardware profiling, and cyber defense system designed to surpass enterprise solutions like Fing Desktop. It runs a synchronized dual-tier architecture:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-1.5">
              <span className="font-mono text-cyan-400 font-bold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> Backend Engine (Python 3.11 + SQLite WAL)
              </span>
              <p className="text-[11px] text-slate-400">
                Direct kernel socket programming, ARP/ICMP raw packet injection, RFC 1035 UDP DNS resolvers, multi-threaded worker pools, and automated presence daemons.
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-1.5">
              <span className="font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Frontend Command Center (React 19 + Tailwind)
              </span>
              <p className="text-[11px] text-slate-400">
                Ultra-responsive, collapsible multi-deck dashboard with real-time error number badges, embedded interactive terminal, live RTSP stream viewer, and PTZ camera pad.
              </p>
            </div>
          </div>
          <p>
            The system operates purely on local network interfaces without requiring external telemetry or third-party cloud subscriptions, preserving total data confidentiality.
          </p>
        </div>
      ),
    },
    {
      id: "guided-config",
      title: "2. First-Run Guided Discovery & Subnet Sweeper",
      badge: "Discovery",
      icon: Compass,
      summary: "Multi-subnet detection, CIDR sweep automation, and optional initial port audits.",
      content: (
        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <p>
            When NetSentinel boots for the first time, or whenever the user clicks <strong className="text-cyan-400">Guided Setup</strong> in the header, the Guided Configuration Wizard initiates:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong className="text-white">Subnet Auto-Detection:</strong> Queries the operating system network interfaces (<code className="text-cyan-300">/sys/class/net</code>, <code className="text-cyan-300">ip route</code>, <code className="text-cyan-300">getifaddrs</code>) to list all local IP ranges, standard LAN defaults (e.g. <code className="text-slate-200">192.168.1.0/24</code>, <code className="text-slate-200">10.0.0.0/24</code>), and custom user-provided CIDRs.
            </li>
            <li>
              <strong className="text-white">Concurrent Discovery Sweep:</strong> Broadcasts ARP requests and ICMP echo probes in parallel worker threads, resolving IP, MAC hardware addresses, and measuring ping round-trip latency.
            </li>
            <li>
              <strong className="text-white">Dual-Stack IPv6 Neighbor Discovery (NDP / EUI-64):</strong> Discovers IPv6 link-local and global unicast addresses across Windows 11 and Linux using <code className="text-purple-300">netsh interface ipv6 show neighbors</code>, PowerShell <code className="text-purple-300">Get-NetNeighbor</code>, <code className="text-purple-300">ip -6 neigh show</code>, and RFC 4291 EUI-64 deterministic SLAAC generation.
            </li>
            <li>
              <strong className="text-white">Optional Initial Port Scan:</strong> Users can toggle automated top-TCP service scans during the initial sweep. Discovered open ports are immediately stored in the SQLite inventory database with each device.
            </li>
            <li>
              <strong className="text-white">Surveillance Auto-Probe:</strong> Automatically flags any RTSP (<code className="text-purple-300">port 554</code>) or ONVIF feeds found during discovery for instant review in the Hidden Cameras deck.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "inventory",
      title: "3. Device Inventory & Custom Metadata",
      badge: "Asset Management",
      icon: HardDrive,
      summary: "Hardware OUI fingerprinting, custom key-value tags, and factory credential tracking.",
      content: (
        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <p>
            Every discovered endpoint is assigned a persistent inventory record in <code className="text-slate-200">devices</code>.
          </p>
          <div className="space-y-2">
            <h4 className="font-semibold text-white">Key Capabilities:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-white">Hardware OUI Fingerprinting:</strong> Automatically matches IEEE MAC prefixes to hardware manufacturers (Apple, Samsung, Intel, Axis, Hikvision, Raspberry Pi, etc.).</li>
              <li><strong className="text-white">Custom Metadata Tags:</strong> Operators can attach arbitrary key-value pairs (e.g., <code className="text-cyan-300">Location: Server Room 2</code>, <code className="text-cyan-300">AssetTag: #9201</code>, <code className="text-cyan-300">Owner: DevOps</code>) that persist across restarts.</li>
              <li><strong className="text-white">Custom Nicknames:</strong> Assign friendly names (e.g. "Main Office Printer") to replace obscure hostnames.</li>
              <li><strong className="text-white">Default Credentials Section:</strong> When devices (especially cameras and routers) match known vendor profiles, default factory usernames and passwords are automatically associated.</li>
              <li><strong className="text-white">Pause Internet Policy:</strong> Enforce software-level internet connectivity blocks per MAC address.</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "quarantine",
      title: "4. Zero-Trust Quarantine Isolation Deck",
      badge: "Zero-Trust",
      icon: ShieldAlert,
      summary: "Isolation mechanics, active/dormant endpoint tracking, and instant release actions.",
      content: (
        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <p>
            The <strong className="text-red-400">Quarantine Deck</strong> provides unified containment of suspicious, untrusted, or unverified network endpoints:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong className="text-white">Online vs. Offline Tracking:</strong> Quarantined devices are distinctly partitioned into active online endpoints and dormant offline endpoints, ensuring no isolated device slips under the radar when it reconnects.
            </li>
            <li>
              <strong className="text-white">Isolation Reason & Audit Trail:</strong> Every quarantine entry records the precise reason, quarantine timestamp, and MAC identifier.
            </li>
            <li>
              <strong className="text-white">Instant Release / Re-admit Action:</strong> Administrators can release endpoints back into trusted inventory with a single click, or enforce permanent traffic drops.
            </li>
            <li>
              <strong className="text-white">Sidebar Red Badge:</strong> The sidebar navigation displays an active red count badge reflecting the number of isolated endpoints.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "nettools",
      title: "5. Network Diagnostics & DNS Testing Suite",
      badge: "Diagnostics",
      icon: Activity,
      summary: "High-resolution Ping, hop-by-hop Traceroute, RFC DNS resolver, Email delivery & Blacklists.",
      content: (
        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <p>
            A 7-in-1 professional diagnostic suite designed for rapid troubleshooting and target evaluation:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <span className="font-semibold text-cyan-400 font-mono">1. Dual-Mode Ping Engine (ICMP + TCP SYN)</span>
              <p className="text-[11px] text-slate-400 mt-1">Cross-platform (Linux & Windows 11) with microsecond latency, deviation jitter, and automatic TCP SYN firewall bypass fallback when ICMP echo is filtered.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <span className="font-semibold text-emerald-400 font-mono">2. Parallel Hop Traceroute</span>
              <p className="text-[11px] text-slate-400 mt-1">High-speed multi-threaded hop-by-hop traceroute prober (15 hops in 1-2s) with reverse PTR DNS resolution and gateway detection.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <span className="font-semibold text-purple-400 font-mono">3. RFC DNS Resolution</span>
              <p className="text-[11px] text-slate-400 mt-1">Direct query of specific record types (A, AAAA, MX, TXT, NS, CNAME, SOA, PTR) against chosen nameservers.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <span className="font-semibold text-amber-400 font-mono">4. Email Deliverability</span>
              <p className="text-[11px] text-slate-400 mt-1">Verifies domain MX exchanges, SPF policy records, DMARC alignment, and DKIM public selector records.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <span className="font-semibold text-red-400 font-mono">5. DNSBL Blacklist Check</span>
              <p className="text-[11px] text-slate-400 mt-1">Checks target IP or domain against 8+ major anti-spam DNSBL databases (Spamhaus, Barracuda, etc.).</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <span className="font-semibold text-blue-400 font-mono">6. Target IP Selector</span>
              <p className="text-[11px] text-slate-400 mt-1">Quick-picker dropdown populated with all discovered inventory endpoints or manual IP/domain entry.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "dnshijack",
      title: "6. DNS Hijacking & Poisoning Detection",
      badge: "Tamper Detection",
      icon: Shield,
      summary: "NXDOMAIN tampering, canary domain spoofing, transparent port 53 interception, and DNSSEC.",
      content: (
        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <p>
            The <strong className="text-white">DNS Hijack Detector</strong> (<code className="text-cyan-300">/api/tools/dns-hijack</code>) probes whether your local router, ISP, or a rogue device is intercepting and tampering with DNS traffic:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong className="text-white">NXDOMAIN Hijacking:</strong> Generates randomized non-existent domain queries (e.g., <code className="text-slate-400">nx-83910.invalid</code>). If the resolver returns an IP address rather than NXDOMAIN (RCODE 3), the resolver is redirecting unresolvable traffic (often to ad portals or tracking proxies).
            </li>
            <li>
              <strong className="text-white">Canary Benchmark Domain Spoofing:</strong> Simultaneously resolves benchmark domains (Google, Cloudflare, Quad9) across local resolvers and compares the returned IP addresses with authoritative root upstream nameservers.
            </li>
            <li>
              <strong className="text-white">Transparent Port 53 Interception:</strong> Sends raw UDP queries to dummy non-DNS IP addresses on port 53. If a response is received, a rogue gateway or firewall is intercepting and proxying all port 53 traffic.
            </li>
            <li>
              <strong className="text-white">DNSSEC Validation:</strong> Verifies whether the local resolver supports Authenticated Data (AD) flags and validates cryptographically signed RRSIG records.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "cameras",
      title: "7. Hidden Cameras & Surveillance Management",
      badge: "Surveillance",
      icon: Camera,
      summary: "Real Wowza RTSP streaming, Windows 11 native playback, zero-simulator policy, PTZ controls, and live progress meters.",
      content: (
        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <p>
            Matches and exceeds Fing's Hidden Camera Detection feature by providing a real-time surveillance console connected directly to live network cameras:
          </p>

          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-2">
            <span className="font-mono text-cyan-400 font-bold flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-cyan-400" /> Live Cloud & Local RTSP Architecture (Zero Simulator)
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              NetSentinel implements a strict <strong className="text-white">Zero Simulator Policy</strong>. Video players stream directly from active RTSP feeds without synthetic canvas mockups. The default high-definition test feed is anchored to:
            </p>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-[11px] text-emerald-300 flex items-center justify-between gap-2 overflow-x-auto">
              <span className="truncate">rtsp://9627b0bf2a7b.entrypoint.cloud.wowza.com:1935/app-p5260J38/66abe4b9_stream1</span>
              <button
                onClick={() => copyCode("rtsp://9627b0bf2a7b.entrypoint.cloud.wowza.com:1935/app-p5260J38/66abe4b9_stream1", "wowza_rtsp")}
                className="text-cyan-400 hover:text-white shrink-0 px-2 py-0.5 rounded bg-slate-800 text-[10px]"
              >
                {copiedCode === "wowza_rtsp" ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Low-latency transport runs over TCP interleaved sockets (<code className="text-slate-200">-rtsp_transport tcp</code>) via kernel FFmpeg pipelines, outputting continuous multipart MJPEG streams (<code className="text-cyan-300">image2pipe</code>) directly to client browser viewports.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-2">
            <span className="font-mono text-blue-400 font-bold flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-blue-400" /> Windows 11 Native Stream Playback
            </span>
            <p className="text-[11px] text-slate-300">
              Surveillance streams can be viewed seamlessly across Windows 11 through multiple high-performance methods:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-400">
              <li>
                <strong className="text-white">In-Browser Direct Viewing:</strong> Hardware-accelerated decoding via Microsoft Edge, Google Chrome, and Firefox on Windows 11 at <code className="text-cyan-300">/api/cameras/:ip/stream</code> and <code className="text-cyan-300">/api/stream/live</code>.
              </li>
              <li>
                <strong className="text-white">One-Click .M3U Playlist Download:</strong> Click the <strong className="text-blue-300">Win 11 Play</strong> button on any camera card to instantly download a ready-to-open playlist file (<code className="text-cyan-300">/api/cameras/:ip/playlist.m3u</code>) associated with Windows Media Player, VLC, PotPlayer, or MPC-HC.
              </li>
              <li>
                <strong className="text-white">PowerShell & Windows Terminal Launch:</strong> Execute high-priority launch macros directly from PowerShell:
                <pre className="bg-slate-950 p-2 rounded border border-slate-800 text-[10px] font-mono text-cyan-300 mt-1">
Start-Process "vlc" -ArgumentList "rtsp://9627b0bf2a7b.entrypoint.cloud.wowza.com:1935/app-p5260J38/66abe4b9_stream1"
                </pre>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-white">Full Feature Checklist:</h4>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-white">Real-Time Progress Metering:</strong> All long-running scans, RTSP probe handshakes, and subnet camera sweeps feature real-time animated percentage bars and stage descriptors.
              </li>
              <li>
                <strong className="text-white">Vendor Profiling & OUI Detection:</strong> Identifies Axis, Hikvision, Dahua, Reolink, Amcrest, Foscam, Wyze, Tapo, Ubiquiti, and Bosch cameras from MAC prefixes and HTTP/RTSP server headers.
              </li>
              <li>
                <strong className="text-white">Factory Defaults Registry:</strong> Displays factory default credentials for discovered camera makes.
              </li>
              <li>
                <strong className="text-white">Motorized PTZ Movement Control:</strong> Interactive Pan (left/right), Tilt (up/down), Zoom (in/out), Center Reset, speed slider, and 1–4 preset positions.
              </li>
              <li>
                <strong className="text-white">Settings Customization:</strong> Adjust resolution (1080p, 2K, 4K), framerate, bitrate, night vision IR (auto/on/off), motion sensitivity, audio mic, and OSD overlay.
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "portscan",
      title: "8. Multi-Threaded Port Scanner & Turbo Tuning",
      badge: "Port Audit",
      icon: Cpu,
      summary: "Parallel worker thread pool (up to 500 threads), range profiles (1-1024, 1-65535), and banner grabbing.",
      content: (
        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <p>
            NetSentinel features a high-performance multi-threaded TCP connect port scanner optimized for high-throughput scanning:
          </p>
          <div className="space-y-2">
            <h4 className="font-semibold text-white">Scan Profiles:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-white">Top 50 Common Services:</strong> High-speed sweep of standard service ports (~100 ms).</li>
              <li><strong className="text-white">Top 100 Extended:</strong> Expanded set of database, management, and surveillance ports.</li>
              <li><strong className="text-white">Well-Known Ports (1–1,024):</strong> Complete RFC sweep of privileged system ports.</li>
              <li><strong className="text-white">Extended Range (1–10,000):</strong> Thorough audit covering developer web servers and proxies.</li>
              <li><strong className="text-white">Full Port Range (1–65,535):</strong> Complete 65k port sweep powered by concurrent worker threads.</li>
              <li><strong className="text-white">Custom Port Range / List:</strong> Enter specific ports or ranges (e.g. <code className="text-cyan-300">80, 443, 8000-8080</code>).</li>
            </ul>
          </div>
          <div className="space-y-2 pt-2">
            <h4 className="font-semibold text-white">Thread Pool Concurrency:</h4>
            <p>
              Users can select worker concurrency from 10 to 500 threads. On local gigabit LAN networks, scanning 1,024 ports executes in under 2 seconds. The scanner retrieves application banners (SSH, HTTP headers, TLS certificates) and classifies risk severity (High / Medium / Low).
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "rat",
      title: "9. RAT (Remote Access Trojan) & Backdoor Detection",
      badge: "Malware Defense",
      icon: ShieldAlert,
      summary: "Signature matching for DarkComet, njRAT, PoisonIvy, Remcos, Gh0st, SubSeven, and C2 beacons.",
      content: (
        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <p>
            The <strong className="text-red-400">RAT & Trojan Detection Suite</strong> (<code className="text-cyan-300">/api/tools/rat-check</code>) audits individual targets, sweeps the subnet, or performs a deep workstation host system integrity audit:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong className="text-white">35+ Known Trojan & C2 Signatures:</strong> Scans for DarkComet (1604, 1605), njRAT/Bladabindi (5552, 1177), QuasarRAT (4782), AsyncRAT (6666, 7000), Warzone/Ave Maria (5200, 5201), RedLine Stealer (8085, 9050), Remcos (2404, 37777), Gh0st RAT (2001, 2002), PoisonIvy (3460), Cobalt Strike (50050), Metasploit (4444, 4445), Havoc C2 (40056), Mythic C2 (7443), Sliver/Covenant (8888), PlugX (13579), SubSeven, NetBus, Back Orifice, and Mirai botnets.
            </li>
            <li>
              <strong className="text-white">Behavioral Handshake & Certificate Probes:</strong> Sends protocol-specific payloads (njRAT delimiter <code className="text-slate-200">|'|'</code>, Gh0st magic header, DarkComet DCDATA probe, AsyncRAT/Quasar TLS certificate subject analysis).
            </li>
            <li>
              <strong className="text-white">Workstation Host System Integrity Audit:</strong> Audits the local operating system (Windows 11 & Linux) for active 0.0.0.0 listening binds, deleted memory executables (<code className="text-cyan-300">/proc/*/exe (deleted)</code>), and unauthorized autorun/registry persistence.
            </li>
            <li>
              <strong className="text-white">One-Click Quarantine Containment:</strong> Instantly isolate compromised devices to terminate external C2 command and control communications.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "terminal",
      title: "10. Embedded Terminal Console & Shell",
      badge: "Interactive Shell",
      icon: Terminal,
      summary: "Live interactive execution shell, macro buttons, execution progress meter, IPv6 diagnostics, and CRT scanlines.",
      content: (
        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <p>
            An authentic interactive terminal emulator embedded directly into the web UI (<code className="text-cyan-300">/api/terminal/exec</code>):
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong className="text-white">Interactive Command Line:</strong> Type commands directly at the <code className="text-cyan-300">NetSentinel $ </code> prompt and execute with Enter.</li>
            <li><strong className="text-white">Real-Time Progress Meter:</strong> Any executing command or sweep displays a dynamic animated percentage bar with active stage telemetry (e.g. "Probing host", "Analyzing headers", "Parsing output") above the prompt.</li>
            <li><strong className="text-white">Dual-Stack IPv6 Commands:</strong> Execute <code className="text-cyan-300">ipv6 sweep</code>, <code className="text-cyan-300">ipv6 list</code>, <code className="text-cyan-300">neigh</code>, and <code className="text-cyan-300">ip -6 neigh show</code> to audit neighboring IPv6 interfaces and link-local SLAAC addresses on Windows 11 and Linux.</li>
            <li><strong className="text-white">Surveillance & Camera Commands:</strong> Probe camera networks via <code className="text-cyan-300">cameras</code>, inspect Wowza cloud RTSP feeds, or generate native Windows 11 stream URLs.</li>
            <li><strong className="text-white">Command History Buffer:</strong> Navigate previous commands using Up/Down arrow keys.</li>
            <li><strong className="text-white">Preset Macro Buttons:</strong> Single-click shortcuts for <code className="text-cyan-300">help</code>, <code className="text-cyan-300">devices</code>, <code className="text-cyan-300">dnshijack</code>, <code className="text-cyan-300">rat-check</code>, <code className="text-cyan-300">cameras</code>, <code className="text-cyan-300">scan</code>, <code className="text-cyan-300">speedtest</code>, and <code className="text-cyan-300">status</code>.</li>
            <li><strong className="text-white">Visual Customization:</strong> Toggle CRT retro green scanline phosphor glow, fullscreen mode, and clear screen.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "settings",
      title: "11. System Settings & Backup Disaster Recovery",
      badge: "Configuration",
      icon: Settings,
      summary: "SMTP email alerts, thread pool tuning, storage paths, and atomic SQLite backup rotation.",
      content: (
        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <p>
            Centralized control panel for application behavior, alerting, and operational maintenance:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong className="text-white">Email Alert Dispatcher:</strong> Configure SMTP relay host, port (587 STARTTLS / 465 SSL), authentication credentials, and select which incident events trigger email notifications. Includes a live test connection diagnostic.</li>
            <li><strong className="text-white">Thread Concurrency Optimizer:</strong> Sliders for port scan threads (10–500), subnet discovery threads, RAT scan threads, and socket timeouts.</li>
            <li><strong className="text-white">Storage Locations:</strong> Customize paths for the primary SQLite database, system logs, camera snapshots, and export files.</li>
            <li><strong className="text-white">Backup & Disaster Recovery:</strong> Generate timestamped <code className="text-slate-200">.db</code> snapshots with one click, configure automated daily rotation schedules, set retention counts, and browse stored backup archives.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "conda-scripts",
      title: "12. Conda Installation, Setup & Compilation Scripts",
      badge: "DevOps & Scripts",
      icon: FileCode,
      summary: "Automated Miniconda bootstrap, conda environment provisioning, and complete app compilation.",
      content: (
        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <p>
            NetSentinel includes automated scripts for Windows 11, Linux, and macOS to download Miniconda, configure isolated environments, and compile the full application from source:
          </p>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-1">
                <span className="flex items-center gap-1.5 text-blue-300">
                  <span>1. Official Windows 11 Automated Installer & Launcher</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    WIN 11 64-BIT
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href="/api/installer/windows11/zip"
                    download="NetSentinel-Windows11-Setup.zip"
                    className="text-xs font-bold text-slate-950 bg-blue-400 hover:bg-blue-300 px-2.5 py-1 rounded flex items-center gap-1 shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Setup.zip</span>
                  </a>
                  <a
                    href="/api/installer/windows11/bat"
                    download="install-windows11.bat"
                    className="text-xs font-mono text-emerald-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-emerald-500/40 flex items-center gap-1 transition-colors"
                  >
                    <span>.bat</span>
                  </a>
                </div>
              </div>
              <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto">
rem Option A: Quick One-Liner in Windows Terminal / PowerShell (Windows 11):
irm {window.location.origin}/api/installer/windows11/script | iex

rem Option B: Download & double-click install-windows11.bat:
.\install-windows11.bat

rem Option C: Direct PowerShell execution with Windows 11 integration:
powershell -ExecutionPolicy Bypass -File .\install.ps1 -CreateShortcuts -ConfigureFirewall
              </pre>
              <p className="text-[11px] text-slate-400 mt-1">
                Engineered for Windows 11: Validates 64-bit architecture, silently downloads and installs 64-bit Miniconda into <code className="text-slate-200">%USERPROFILE%\miniconda3</code>, bootstraps the Conda hook, provisions the isolated <code className="text-slate-200">netsentinel</code> environment (Python 3.11 + Node.js 20), creates a <strong>Desktop Shortcut ("NetSentinel Security")</strong>, creates a <strong>Start Menu folder</strong>, configures <strong>Windows Defender Firewall (Port 3000 Inbound)</strong>, and compiles the application.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-1">
                <span>2. setup_conda.sh (Linux & macOS Automated Conda Setup & Build)</span>
                <button
                  onClick={() => copyCode("./setup_conda.sh", "conda_sh")}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono text-[11px]"
                >
                  {copiedCode === "conda_sh" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === "conda_sh" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                chmod +x setup_conda.sh && ./setup_conda.sh
              </pre>
              <p className="text-[11px] text-slate-400 mt-1">
                Automatically detects Linux/macOS and x86_64/arm64 architectures, downloads Miniconda if missing, creates the <code className="text-slate-200">netsentinel</code> conda environment with Python 3.11 and Node.js 20, installs all dependencies, and compiles the app.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-1">
                <span>3. compile_app.sh (Compile Complete Application)</span>
                <button
                  onClick={() => copyCode("./compile_app.sh", "compile_sh")}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono text-[11px]"
                >
                  {copiedCode === "compile_sh" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === "compile_sh" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-amber-300 overflow-x-auto">
                chmod +x compile_app.sh && ./compile_app.sh
              </pre>
              <p className="text-[11px] text-slate-400 mt-1">
                Validates Python module syntax, initializes the SQLite database schema, executes TypeScript strict typecheck, and compiles production Vite bundles into <code className="text-slate-200">./dist</code>.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-1">
                <span>4. environment.yml (Declarative Conda Environment Spec)</span>
                <button
                  onClick={() => copyCode("conda env create -f environment.yml", "env_yml")}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono text-[11px]"
                >
                  {copiedCode === "env_yml" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === "env_yml" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-purple-300 overflow-x-auto">
                conda env create -f environment.yml && conda activate netsentinel
              </pre>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "cli",
      title: "13. Python Rich CLI & Headless Daemon",
      badge: "CLI Reference",
      icon: Terminal,
      summary: "Terminal Rich TUI commands, scheduled cron scans, and intruder monitoring daemon.",
      content: (
        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <p>
            In addition to the web GUI, NetSentinel can be run completely headless from the command line using <code className="text-cyan-300">cli.py</code>:
          </p>
          <div className="space-y-2">
            {[
              { cmd: "python3 cli.py --scan", desc: "Execute single subnet discovery sweep and display Rich color table." },
              { cmd: "python3 cli.py --inventory", desc: "List all remembered devices with MAC, IP, vendor, and quarantine status." },
              { cmd: "python3 cli.py --portscan 192.168.1.1", desc: "Run multi-threaded port audit on specific host." },
              { cmd: "python3 cli.py --cameras", desc: "Detect unencrypted RTSP surveillance feeds on local subnet." },
              { cmd: "python3 cli.py --router-audit", desc: "Run UPnP and DNS security audit on local gateway." },
              { cmd: "python3 cli.py --speedtest", desc: "Measure download, upload, and latency ping benchmark." },
              { cmd: "python3 cli.py --daemon --interval 15", desc: "Start background intruder monitoring daemon checking every 15s." },
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <code className="text-cyan-300 font-mono text-xs">{item.cmd}</code>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => copyCode(item.cmd, `cli_${idx}`)}
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 shrink-0 self-end sm:self-center"
                >
                  {copiedCode === `cli_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "wifi",
      title: "14. Wi-Fi Multi-Band Spectrum & Saturation Analyzer",
      badge: "Wireless Spectrum",
      icon: Radio,
      summary: "Multi-band discovery across 2.4 GHz, 5 GHz, and 6 GHz (Wi-Fi 6E/7), dual dBm/% signal metering, and spectrum/channel/SSID saturation calculations.",
      content: (
        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <p>
            NetSentinel includes an advanced 802.11 wireless spectrum and congestion engine that analyzes all surrounding wireless access points and client networks:
          </p>
          <div className="space-y-2">
            <h4 className="font-semibold text-white">Core Capabilities:</h4>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-white">Tri-Band Frequency Coverage:</strong> Full discovery across <strong className="text-cyan-300">2.4 GHz</strong> (channels 1–14), <strong className="text-cyan-300">5 GHz</strong> (channels 36–165), and next-generation <strong className="text-cyan-300">6 GHz (Wi-Fi 6E / Wi-Fi 7)</strong> (channels 1–233).
              </li>
              <li>
                <strong className="text-white">Dual Signal Strength Metering:</strong> Measures wireless link quality simultaneously in percentage (<code className="text-emerald-400">0%–100%</code>) and absolute decibels relative to 1 milliwatt (<code className="text-emerald-400">-30 dBm to -95 dBm</code>).
              </li>
              <li>
                <strong className="text-white">Frequency Band Saturation:</strong> Calculates the aggregate spectrum load, AP density, and saturation rating (Low, Moderate, Congested) for each band.
              </li>
              <li>
                <strong className="text-white">Channel Saturation & Inter-AP Interference:</strong> Computes exact co-channel interference (<code className="text-slate-200">1.0x weight</code>) and adjacent overlapping channel bleed (<code className="text-slate-200">0.35x weight</code>).
              </li>
              <li>
                <strong className="text-white">SSID Congestion & Health Rating:</strong> Evaluates individual BSSID signal-to-interference ratios, identifying competing access points and generating automated channel migration advice.
              </li>
            </ul>
          </div>
          <p>
            Accessible via the <strong className="text-cyan-300">Wi-Fi Spectrum</strong> tab with auto-refresh, frequency filtering, search, and CSV/JSON export.
          </p>
        </div>
      ),
    },
    {
      id: "logs",
      title: "15. Real-Time System & Debugging Logs Console",
      badge: "Diagnostics & Telemetry",
      icon: Bug,
      summary: "Dual-layer in-memory ring buffer + SQLite WAL audit store, real-time live streaming, severity filtering (DEBUG, INFO, WARN, ERROR), and stack trace inspection.",
      content: (
        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <p>
            NetSentinel features an enterprise-grade live telemetry and logging console capturing every internal operation, packet socket event, and subprocess execution:
          </p>
          <div className="space-y-2">
            <h4 className="font-semibold text-white">Telemetry Architecture:</h4>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-white">Dual-Layer Storage:</strong> Fast in-memory ring buffer (up to 2,500 active events) merged with the persistent SQLite <code className="text-purple-300">system_logs</code> table.
              </li>
              <li>
                <strong className="text-white">Multi-Level Event Filtering:</strong> Instant buttons to filter by <code className="text-purple-300 font-mono">DEBUG</code> (raw packets, socket timeouts, subprocess timings), <code className="text-cyan-300 font-mono">INFO</code> (discovery completions, device additions), <code className="text-amber-300 font-mono">WARN</code> (high latency, channel congestion), and <code className="text-rose-300 font-mono">ERROR</code> (socket failures, dropped handshakes).
              </li>
              <li>
                <strong className="text-white">Categorized Subsystems:</strong> Filter logs by Network Scan, Port Scan, Wi-Fi Spectrum, API Gateway, Surveillance, Security, Daemon, Database, or System.
              </li>
              <li>
                <strong className="text-white">Payload & Traceback Inspector:</strong> Click any log line to inspect complete JSON execution arguments, target IPs, and formatted Python/Node.js stack traces.
              </li>
              <li>
                <strong className="text-white">Live Controls & Export:</strong> Live stream pause/play toggle, full-text instant search, on-demand test log generation, verbose packet debug mode switch, and one-click download in formatted <code className="text-slate-200">.log</code> or structured <code className="text-slate-200">.json</code> format.
              </li>
            </ul>
          </div>
          <p>
            Accessible anytime from the <strong className="text-purple-300">System & Debug Logs</strong> navigation tab or the top header status bar.
          </p>
        </div>
      ),
    },
  ];

  const filteredSections = sections.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.badge.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSection = sections.find((s) => s.id === activeSectionId) || sections[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
              User Manual, Architecture & Technical Reference
            </div>
            <h1 className="text-xl font-bold text-white mt-1">Application Documentation</h1>
            <p className="text-xs text-slate-400 mt-1">
              Comprehensive reference guide explaining every operational feature, security probe, engine algorithm, and deployment script.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* 2-Column Documentation Deck: Sidebar Navigator + Content Reader */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Table of Contents Navigator */}
          <div className="lg:col-span-4 space-y-1.5 max-h-[750px] overflow-y-auto pr-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono block px-2 mb-2">
              Sections ({filteredSections.length})
            </span>

            {filteredSections.map((sec) => {
              const IconComp = sec.icon;
              const isActive = sec.id === activeSection.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`w-full text-left p-3 rounded-lg text-xs transition-all flex items-start gap-3 border ${
                    isActive
                      ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-200 shadow-sm"
                      : "bg-slate-900/30 border-slate-800/80 text-slate-300 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  <IconComp
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      isActive ? "text-cyan-400" : "text-slate-400"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold truncate">{sec.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {sec.summary}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Section Content Reader */}
          <div className="lg:col-span-8 bg-slate-950/70 border border-slate-800/80 rounded-xl p-6 min-h-[500px]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-2.5">
                <activeSection.icon className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white">{activeSection.title}</h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-bold">
                {activeSection.badge}
              </span>
            </div>

            {/* Rendered Body */}
            <div>{activeSection.content}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
