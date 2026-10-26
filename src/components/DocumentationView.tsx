import React, { useState, useMemo } from "react";
import {
  Search,
  Wifi,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Camera,
  Cpu,
  HardDrive,
  Database,
  Terminal,
  Activity,
  Gauge,
  Compass,
  Lock,
  Mail,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Layers,
  FileCode,
  Zap,
  Settings,
  Download,
  Radio,
  Bug,
  Server,
  Play,
  RefreshCw,
  AlertTriangle,
  HelpCircle,
  Network,
  BookOpen,
  Sliders,
  Eye,
  Key,
  ShieldX,
  Share2,
} from "lucide-react";

interface DocumentationViewProps {
  showToast: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

interface FeatureSpecification {
  id: string;
  name: string;
  layerBadge: string;
  protocolBadge: string;
  definition: string;
  technicalDescription: {
    overview: string;
    architectureAndFlow: string[];
    technicalParameters: { name: string; type: string; description: string }[];
    algorithmsAndProtocols: string;
    progressMeterBehavior?: string;
  };
  operationalUse: {
    threatModelAndUtility: string;
    stepByStepProcedure: string[];
    practicalUseCases: string[];
    troubleshootingAndRemediation: string;
  };
}

interface DocChapter {
  id: string;
  number: string;
  title: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  summary: string;
  targetDeckTab?: string;
  features: FeatureSpecification[];
}

export const DocumentationView: React.FC<DocumentationViewProps> = ({
  showToast,
  onNavigateTab,
}) => {
  const [activeChapterId, setActiveChapterId] = useState<string>("discovery");
  const [activeFeatureId, setActiveFeatureId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    showToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedText(null), 2200);
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: prev[key] === undefined ? false : !prev[key],
    }));
  };

  // Comprehensive Chapter Specifications with Define, Describe, and Explain/Use for EVERY feature
  const chapters: DocChapter[] = useMemo(
    () => [
      {
        id: "discovery",
        number: "01",
        title: "Subnet Discovery & Dual-Stack Network Intelligence",
        badge: "Layer 2 & Layer 3",
        icon: Compass,
        summary: "Hardware-level discovery engine executing Layer-2 ARP sweeps, ICMP/TCP fallback probes, and RFC 4291 EUI-64 dual-stack IPv6 neighbor cache reconciliation.",
        targetDeckTab: "devices",
        features: [
          {
            id: "feat-arp-sweep",
            name: "Concurrent Layer-2 ARP Broadcast Sweeper",
            layerBadge: "Data Link (L2)",
            protocolBadge: "ARP / RFC 826",
            definition:
              "A high-throughput local network discovery mechanism that broadcasts Layer-2 Address Resolution Protocol (ARP) query frames across the broadcast domain to map IPv4 addresses directly to physical 48-bit Media Access Control (MAC) hardware addresses without relying on Layer-3 IP routing.",
            technicalDescription: {
              overview:
                "Operates via Linux raw packet sockets (AF_PACKET) and Scapy packet crafters. The engine constructs RFC 826 Ethernet broadcast frames (destination ff:ff:ff:ff:ff:ff) with ARP opcode 0x0001 (ARP Request) inquiring 'who-has <Target IP>? Tell <Host IP>'. The socket listener catches all incoming ARP opcode 0x0002 (ARP Reply) unicast packets within a non-blocking poll loop.",
              architectureAndFlow: [
                "Worker Thread Pool parses the active CIDR block (e.g. 192.168.1.0/24 = 254 host addresses) and chunks targets into micro-batches.",
                "Socket prober checks for raw socket privileges (CAP_NET_RAW / root). If granted, it dispatches raw ARP frames with interleaved 10ms micro-pauses to prevent switch buffer exhaustion.",
                "Kernel ARP table is asynchronously polled to cross-validate incoming replies against `/proc/net/arp` and `ip neigh show`.",
                "Each responding host delivers its physical MAC address, response latency in microseconds, and active interface name.",
              ],
              technicalParameters: [
                { name: "Target Subnet CIDR", type: "IPv4 Network (e.g. 192.168.1.0/24)", description: "The IPv4 subnet block to sweep for responsive endpoints." },
                { name: "Socket Timeout", type: "Floating Point Seconds (0.5s - 2.0s)", description: "Maximum wait duration for receiving ARP unicast reply frames." },
                { name: "Inter-packet Delay", type: "Integer Milliseconds (2ms - 15ms)", description: "Transmission spacing to avoid triggering managed switch flood protection." },
              ],
              algorithmsAndProtocols:
                "Implements asynchronous socket polling via `select.select()` over raw packet sockets. For privileged environments, Scapy's `srp()` layer crafter is utilized with filter `arp and arp[7] = 2` to eliminate non-ARP traffic processing.",
              progressMeterBehavior:
                "Displays continuous stage telemetry on the Discovery HUD: 0-20% Socket Binding -> 20-50% Layer-2 Broadcast Transmission -> 50-80% Listener Ingestion -> 80-100% Host Deduplication. Active device counters increment in real time.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Essential for detecting rogue devices, unauthorized laptops, drop boxes, and rogue access points plugged into physical Ethernet ports or associated to Wi-Fi. Because ARP operates below the IP firewall layer, software firewalls on Windows/macOS/Linux that block standard ICMP ping cannot block ARP replies while maintaining network connectivity.",
              stepByStepProcedure: [
                "Navigate to the 'Device Inventory' or 'Subnet Overview' tab in the top navigation bar.",
                "Inspect the automatically detected subnet CIDR displayed in the network header (e.g., 192.168.1.0/24).",
                "Click the blue 'Start Network Scan' button. Observe the animated multi-stage HUD progress bar.",
                "Once the progress bar reaches 100%, review the updated inventory table populated with all responding IP and MAC addresses.",
              ],
              practicalUseCases: [
                "Identifying stealth devices configured with host firewalls that drop all incoming ping packets.",
                "Detecting unauthorized employees or guests plugging personal devices into office wall jacks.",
                "Auditing MAC addresses for hardware vendor identification and inventory reconciliation.",
              ],
              troubleshootingAndRemediation:
                "If no devices are discovered: 1) Verify that your machine has an active IP assignment on the target network; 2) Ensure NetSentinel has raw socket privileges (run under sudo/Administrator if using raw mode); 3) Confirm your network switch does not enforce port security or client isolation.",
            },
          },
          {
            id: "feat-icmp-tcp-fallback",
            name: "Layer-3 ICMP Echo & TCP SYN Fallback Engine",
            layerBadge: "Network (L3) / Transport (L4)",
            protocolBadge: "ICMP / TCP SYN",
            definition:
              "A multi-threaded discovery fallback prober that systematically transmits ICMP Type 8 Echo Requests and TCP SYN connection probes across routed or privilege-restricted networks where raw Layer-2 packet sockets are unavailable or filtered.",
            technicalDescription: {
              overview:
                "When operating in non-root user spaces, containerized environments, or across routed subnets (where ARP broadcasts cannot traverse default gateways), NetSentinel seamlessly falls back to concurrent ICMP Echo Requests and TCP SYN probes directed at standard listener ports (80 HTTP, 443 HTTPS, 22 SSH, 445 SMB).",
              architectureAndFlow: [
                "Target subnet is broken into parallel worker queues managed by Python `ThreadPoolExecutor`.",
                "Worker threads emit standard ICMP Type 8 Code 0 Echo packets with incrementing sequence IDs.",
                "For hosts that do not respond to ICMP (due to host firewall drop rules), worker threads send non-blocking TCP SYN handshakes to port 80 and 443.",
                "A TCP SYN-ACK or RST response proves that an active operating system IP stack exists at that address, registering it as online with high confidence.",
              ],
              technicalParameters: [
                { name: "Target Host IP", type: "IPv4 / IPv6 Address", description: "Individual destination IP to evaluate." },
                { name: "Fallback Ports", type: "Array of Integers [80, 443, 22, 445, 8080]", description: "Ports probed with TCP SYN packets when ICMP echo packets are dropped." },
                { name: "Round-Trip Latency", type: "Milliseconds (Float)", description: "Calculated elapsed time between packet dispatch and response receipt." },
              ],
              algorithmsAndProtocols:
                "Uses POSIX `socket.SOCK_DGRAM` with ICMP protocol or standard non-blocking `connect()` socket calls. Round-trip latency is recorded with microsecond timestamps via `time.perf_counter()`.",
              progressMeterBehavior:
                "Integrated into the Discovery HUD during stages 40% through 75%, showing 'Probing Layer-3 Reachability' with active percentage ticks.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Detects hardened servers, cloud virtual machines, and firewall-protected endpoints that silently drop ping requests but must expose web or management services. Prevents false-negative scan results.",
              stepByStepProcedure: [
                "Open 'Guided Setup' or click 'Start Network Scan' on any multi-hop or containerized interface.",
                "If raw sockets are restricted, the HUD automatically indicates 'Executing Layer-3 Probes'.",
                "Review discovered hosts tagged with 'TCP-Probed' or 'ICMP-Responsive' badges in the inventory table.",
              ],
              practicalUseCases: [
                "Auditing DMZ subnets where routers block broadcast ARP packets.",
                "Scanning cloud subnets (AWS VPC, GCP VPC, Azure VNet) where ARP broadcast is disabled by hypervisors.",
                "Discovering web servers and firewalls with ICMP disabled but web ports open.",
              ],
              troubleshootingAndRemediation:
                "If latency shows high variance: increase socket timeout in 'System Settings' -> 'Thread Tuning' to allow congested Wi-Fi links sufficient time to respond.",
            },
          },
          {
            id: "feat-ipv6-discovery",
            name: "Dual-Stack IPv6 Neighbor Discovery (NDP & RFC 4291 EUI-64 SLAAC)",
            layerBadge: "Dual-Stack Network (L3)",
            protocolBadge: "NDP / RFC 4861 / RFC 4291",
            definition:
              "An advanced dual-stack discovery engine that interrogates kernel Neighbor Discovery Protocol (NDP) neighbor tables and computes deterministic RFC 4291 Modified EUI-64 Stateless Address Autoconfiguration (SLAAC) link-local IPv6 addresses from 48-bit MAC hardware identifiers.",
            technicalDescription: {
              overview:
                "Modern operating systems often communicate over IPv6 link-local (`fe80::/10`) addresses while ignoring IPv4 traffic. NetSentinel bridges the visibility gap by executing native OS NDP queries: on Windows 11, it invokes `netsh interface ipv6 show neighbors` and PowerShell `Get-NetNeighbor`; on Linux, it parses `ip -6 neigh show`. Concurrently, for every discovered device with a known MAC address, it calculates the RFC 4291 EUI-64 link-local address by splitting the MAC into two 24-bit halves, inserting the 16-bit hex `FF:FE` in the middle, and inverting the universal/local bit (bit 7).",
              architectureAndFlow: [
                "Operator triggers 'IPv6 Neighbor Sweep' from the Device Inventory UI or via `POST /api/discovery/ipv6/sweep`.",
                "Engine identifies the active default route interface (e.g. `eth0` or Windows Wi-Fi adapter).",
                "Subprocess worker executes platform-native neighbor cache dumps with strict 3-second timeouts.",
                "RFC 4291 mathematical transformation is applied to all inventory MAC addresses: `MAC: 44:19:B6:81:92:40` -> invert bit 7 -> `46:19:B6` + `FF:FE` + `81:92:40` -> `fe80::4619:b6ff:fe81:9240`.",
                "Dual-stack addresses are atomically upserted into the SQLite `devices.ipv6` column and reconciled.",
              ],
              technicalParameters: [
                { name: "Active Interface", type: "String (e.g. eth0, wlan0)", description: "The physical or virtual adapter binding the IPv6 link-local scope." },
                { name: "NDP Cache Entries", type: "Integer", description: "Number of active, reachable, or stale IPv6 neighbor records extracted from the kernel." },
                { name: "EUI-64 Computed Addresses", type: "Array of IPv6 Strings", description: "Deterministic link-local SLAAC addresses calculated per inventory endpoint." },
              ],
              algorithmsAndProtocols:
                "Implements RFC 4291 Section 2.5.1 interface identifier construction algorithm. Regex pattern matching parses IPv6 addresses and state fields (REACHABLE, STALE, DELAY, PROBE).",
              progressMeterBehavior:
                "Features an animated multi-stage progress meter modal: 15% (Detecting Interface) -> 40% (Interrogating OS NDP Cache) -> 70% (Computing EUI-64 SLAAC Addresses) -> 90% (Updating SQLite Store) -> 100% (Complete).",
            },
            operationalUse: {
              threatModelAndUtility:
                "Counters shadow IT and rogue IPv6 tunneling. Many security appliances only inspect IPv4, allowing malware or unauthorized devices to exfiltrate data undetected over IPv6 link-local or global unicast routes. NetSentinel provides full dual-stack visibility.",
              stepByStepProcedure: [
                "Navigate to the 'Device Inventory' tab.",
                "Click the purple 'IPv6 Neighbor Sweep' button located in the table action header.",
                "Watch the animated progress meter cycle through interface detection, NDP cache querying, and SLAAC computation.",
                "Once complete, review the 'IPv6 Address' column in the inventory table. Click the copy icon next to any IPv6 address to copy it to your clipboard.",
                "Click the 'IPv6 Stack' filter button above the table to view only endpoints with active IPv6 addresses.",
              ],
              practicalUseCases: [
                "Troubleshooting IPv6 local routing and default gateway advertisements.",
                "Discovering mobile devices (iPhones, Android phones) that randomize IPv4 DHCP leases but retain consistent IPv6 SLAAC identifiers.",
                "Auditing smart surveillance cameras and IoT hubs operating on IPv6.",
              ],
              troubleshootingAndRemediation:
                "If IPv6 addresses show as empty: Click 'IPv6 Neighbor Sweep' to force active neighbor reconciliation; ensure IPv6 protocol is checked in your Windows 11 network adapter properties or enabled in `/etc/sysctl.conf` (`net.ipv6.conf.all.disable_ipv6 = 0`).",
            },
          },
        ],
      },
      {
        id: "inventory-metadata",
        number: "02",
        title: "Device Inventory, OUI Profiling & Asset Governance",
        badge: "Asset Management",
        icon: HardDrive,
        summary: "Hardware-level OUI fingerprinting, friendly aliases, persistent key-value metadata tags, factory credential tracking, and baseline authorization governance.",
        targetDeckTab: "devices",
        features: [
          {
            id: "feat-oui-profiling",
            name: "IEEE OUI Hardware Vendor Profiling",
            layerBadge: "Hardware / Physical Layer",
            protocolBadge: "IEEE 802 / OUI Database",
            definition:
              "An automated hardware attribution mechanism that extracts the 24-bit Organizationally Unique Identifier (OUI) from an endpoint's MAC address and resolves it against an offline database of IEEE hardware manufacturer assignments.",
            technicalDescription: {
              overview:
                "A MAC address consists of 48 bits (6 hex octets). The first 3 octets (24 bits) represent the vendor prefix registered with the IEEE Registration Authority (e.g., `00:1A:11` Google, `EC:71:DB` Reolink, `44:19:B6` Hikvision, `B8:27:EB` Raspberry Pi). NetSentinel includes an offline compiled dictionary of over 45,000 OUI entries, executing sub-millisecond dictionary lookups.",
              architectureAndFlow: [
                "Upon packet capture, MAC address string is normalized to uppercase colon-delimited format (`XX:XX:XX:XX:XX:XX`).",
                "The first 8 characters (`XX:XX:XX`) are looked up in `netsentinel/fingerprint.py`.",
                "If matched, the canonical manufacturer brand string is recorded; if unmatched, heuristics test for randomized MAC bit flags (locally administered bit = 1).",
                "Vendor record is saved in SQLite `devices.vendor` column alongside hardware categorization.",
              ],
              technicalParameters: [
                { name: "MAC Address", type: "48-bit Hex String", description: "Unique hardware identifier of the network card." },
                { name: "Vendor String", type: "String (e.g. Apple, Inc., Axis Communications)", description: "Canonical hardware manufacturer registered with IEEE." },
                { name: "Randomized MAC Flag", type: "Boolean", description: "True if bit 1 of the first byte is set to 1 (Locally Administered Address), common in iOS/Android privacy modes." },
              ],
              algorithmsAndProtocols:
                "Fast in-memory Python hash map lookup `O(1)` with fallback to regex parsing of Wireshark/Scapy manufacturer files.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Immediately identifies the physical nature of unknown connected devices. If an unrecognized IP appears on your network with an OUI belonging to 'Espressif Inc.', you instantly know it is an IoT microcontroller or smart home gadget rather than an employee workstation.",
              stepByStepProcedure: [
                "View the 'Device Inventory' deck.",
                "Inspect the 'Vendor / Brand' column displaying hardware brand badges.",
                "Click on any row to open the Device Details modal and view vendor manufacturing details.",
              ],
              practicalUseCases: [
                "Locating unapproved Raspberry Pi single-board computers plugged into corporate Ethernet jacks.",
                "Categorizing enterprise hardware fleets (Dell, HP, Lenovo, Cisco).",
                "Detecting mobile devices using private randomized MAC addresses.",
              ],
              troubleshootingAndRemediation:
                "If vendor displays 'Private / Randomized MAC': The connecting smartphone or laptop has 'Private MAC Address' enabled in Wi-Fi settings. Instruct users to disable MAC randomization on corporate networks to allow inventory tracking.",
            },
          },
          {
            id: "feat-custom-metadata",
            name: "Persistent Custom Metadata Tags & Friendly Aliases",
            layerBadge: "Application (L7)",
            protocolBadge: "JSON Schema / SQLite WAL",
            definition:
              "An asset governance system allowing system administrators to attach arbitrary structured JSON key-value tags, friendly aliases, and physical location descriptors to any MAC address record.",
            technicalDescription: {
              overview:
                "Device hostnames reported via DHCP or DNS are frequently cryptic (e.g. `DESKTOP-8K21A9` or `iPhone`). NetSentinel provides an atomic metadata engine storing user tags inside the `devices.custom_metadata` JSON column in SQLite, surviving network resets and server reboots.",
              architectureAndFlow: [
                "Administrator inputs nickname or tags in the Device Details drawer.",
                "Client submits `PATCH /api/devices/:mac` with payload `{ nickname: 'Reception Printer', custom_metadata: { Location: 'Building B, Floor 2', AssetID: 'AST-9021' } }`.",
                "Server validates JSON structure and executes atomic update with timestamp tracking.",
                "UI updates in real time and provides search indexing across custom tag keys and values.",
              ],
              technicalParameters: [
                { name: "Custom Nickname", type: "String (1-64 chars)", description: "Human-readable label replacing cryptic hostnames." },
                { name: "Key-Value Metadata", type: "JSON Object", description: "Arbitrary organizational attributes (AssetTag, Owner, Department, ExpiryDate)." },
              ],
              algorithmsAndProtocols:
                "SQLite JSON1 extension functions with indexed queries. Transactional ACID updates via WAL mode.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Maintains audit trails and inventory accountability. Prevents confusion during high-stress incident responses by clearly identifying who owns an endpoint and where it is physically located.",
              stepByStepProcedure: [
                "In the Device Inventory table, click on any target device row to open the edit panel.",
                "Type a friendly alias into the 'Custom Nickname' input field (e.g. 'Executive Boardroom Conference Cam').",
                "Add key-value pairs (e.g. Key: 'Room', Value: 'Conf-301').",
                "Click 'Save Changes'. The friendly name will now appear highlighted across all dashboard decks.",
              ],
              practicalUseCases: [
                "Tagging critical servers with high-priority SLA flags (`Tier: Production-Critical`).",
                "Labeling network switches with physical rack locations (`Rack: 04, Unit: 22`).",
                "Tracking device ownership during cybersecurity investigations (`Owner: John Doe, Legal Dept`).",
              ],
              troubleshootingAndRemediation:
                "To reset metadata: Open the device modal, clear the nickname field, delete custom keys, and click Save.",
            },
          },
          {
            id: "feat-factory-credentials",
            name: "Factory Default Credentials Database & Security Profiling",
            layerBadge: "Application Security (L7)",
            protocolBadge: "Credential Vulnerability DB",
            definition:
              "An embedded cybersecurity vulnerability intelligence registry that matches discovered hardware profiles against known vendor factory default administrative credentials.",
            technicalDescription: {
              overview:
                "Surveillance cameras, routers, and managed switches are notoriously compromised by botnets (Mirai, Gafgyt) when deployed with unmanaged factory credentials. NetSentinel automatically correlates detected vendor brands and open management ports with a built-in dictionary of factory defaults.",
              architectureAndFlow: [
                "When a device is fingerprinted as a camera or router (via OUI, HTTP banner, or RTSP port), the engine queries `DEFAULT_CREDENTIALS` in `netsentinel/fingerprint.py`.",
                "Identifies default username (e.g. `admin`), primary password (e.g. `12345`, `admin`, `(blank)`), secondary fallback passwords, default web management port (80, 8080, 443), and administrative login URLs.",
                "Correlated findings are embedded in `custom_metadata.camera_defaults` and surfaced in the device audit card.",
              ],
              technicalParameters: [
                { name: "Vendor Brand", type: "String", description: "Identified hardware make (Hikvision, Dahua, Reolink, TP-Link, Netgear, Cisco)." },
                { name: "Default Username", type: "String", description: "Out-of-the-box factory user identifier." },
                { name: "Default Password", type: "String", description: "Out-of-the-box factory password string." },
                { name: "Admin Portal URL", type: "URL String", description: "Direct HTTP/HTTPS link to the device's web configuration interface." },
              ],
              algorithmsAndProtocols:
                "Exact and fuzzy pattern matching against vendor profile signatures, ONVIF discovery XML response schemas, and RTSP authenticate headers (`WWW-Authenticate: Digest realm=...`).",
            },
            operationalUse: {
              threatModelAndUtility:
                "Hardens networks against brute-force botnets and unauthorized snooping. Enables IT staff to quickly audit newly installed cameras and routers and immediately change factory default passwords.",
              stepByStepProcedure: [
                "Click on any camera or router device card in the 'Hidden Cameras' deck or 'Device Inventory'.",
                "Inspect the 'Factory Defaults & Credentials' panel highlighted in amber.",
                "Note the default username and password displayed.",
                "Click the 'Open Web Console' link to log in to the device and immediately change its administrative password to a strong passphrase.",
              ],
              practicalUseCases: [
                "Penetration testing and security audits of newly commissioned office branches.",
                "Preventing unauthorized occupants from viewing private RTSP camera streams.",
                "Auditing IoT smart bulbs, plugs, and cameras for credential hygiene.",
              ],
              troubleshootingAndRemediation:
                "If the default credentials fail to log in: The device has already been properly secured with a custom password. Mark the device as 'Verified & Password Changed' in custom metadata.",
            },
          },
        ],
      },
      {
        id: "surveillance",
        number: "03",
        title: "Hidden Cameras & Surveillance Management",
        badge: "Video Streaming & ONVIF",
        icon: Camera,
        summary: "Zero-simulator real-time video streaming architecture, Wowza cloud RTSP feeds, Windows 11 hardware decoding, one-click .M3U playlists, PowerShell macros, and PTZ controls.",
        targetDeckTab: "cameras",
        features: [
          {
            id: "feat-live-rtsp",
            name: "Live Wowza Cloud RTSP Streaming Engine (Zero Simulator)",
            layerBadge: "Application / Media (L7)",
            protocolBadge: "RTSP / RTP over TCP / RFC 2326",
            definition:
              "A real-time network video streaming pipeline that connects directly to authentic RTSP surveillance streams over TCP interleaved sockets and transcodes video frames into high-frequency multipart MJPEG (`image2pipe`) web viewports without synthetic mockups or canvas simulators.",
            technicalDescription: {
              overview:
                "NetSentinel enforces a strict Zero-Simulator Standard. All surveillance viewing is anchored to real network streaming pipelines. The default cloud surveillance feed is hosted at `rtsp://9627b0bf2a7b.entrypoint.cloud.wowza.com:1935/app-p5260J38/66abe4b9_stream1`. An asynchronous backend FFmpeg subprocess ingests H.264/H.265 video over TCP (`-rtsp_transport tcp`), converts frames into JPEG image sequences, and pipes them directly to client HTTP response streams with `Content-Type: multipart/x-mixed-replace; boundary=ffserver`. In the event of initial RTSP handshake delays, an authentic preloaded snapshot frame (`live_cctv_frame.jpg`, 1280x720) is served to prevent blank viewports.",
              architectureAndFlow: [
                "Client requests live feed from `/api/stream/live` or `/api/cameras/:ip/stream`.",
                "Express server spawns kernel `/usr/bin/ffmpeg` process with flags: `-rtsp_transport tcp -i <RTSP_URL> -f image2pipe -vcodec mjpeg -q:v 3 -r 15 -`.",
                "Standard output chunks are framed with multipart HTTP boundaries and flushed to browser sockets.",
                "Browser `<img>` or video viewport renders live frames with hardware-accelerated canvas compositing.",
                "Latency, framerate, and connection state are reported to the UI player HUD in real time.",
              ],
              technicalParameters: [
                { name: "Live Stream URI", type: "RTSP URI String", description: "Canonical real-time streaming endpoint (e.g. `rtsp://9627b0bf2a7b.entrypoint.cloud.wowza.com:1935/app-p5260J38/66abe4b9_stream1`)." },
                { name: "Transport Protocol", type: "TCP Interleaved (RFC 2326 Section 10.12)", description: "Prevents UDP packet drop through NAT gateways and corporate firewalls." },
                { name: "Frame Target Rate", type: "Integer (15 - 30 FPS)", description: "Output frame rate delivered to browser viewports." },
              ],
              algorithmsAndProtocols:
                "RFC 2326 Real Time Streaming Protocol, RFC 3550 RTP payload formatting, FFmpeg pipe I/O buffer management.",
              progressMeterBehavior:
                "Surveillance scanning features a multi-stage animated progress bar: 10% (Scanning Port 554/8000) -> 35% (Sending RTSP DESCRIBE) -> 65% (Parsing SDP Codec Manifest) -> 90% (Verifying Transport) -> 100% (Active Streaming).",
            },
            operationalUse: {
              threatModelAndUtility:
                "Identifies rogue, hidden, or unauthorized surveillance cameras in sensitive areas (boardrooms, executive suites, hotels). Provides security teams with immediate visual verification of what any camera is viewing.",
              stepByStepProcedure: [
                "Click on the 'Hidden Cameras' tab in the top navigation bar.",
                "Review the camera deck displaying discovered surveillance feeds (Reolink, Tapo, Hikvision, Dahua).",
                "Click 'Launch Fullscreen Player' on any camera card to view the live video stream.",
                "Observe the live status indicators: 'LIVE RTSP', '1080p', '30 FPS', and latency telemetry.",
              ],
              practicalUseCases: [
                "Auditing office perimeters for unauthorized IP security cameras.",
                "Verifying operational uptime of warehouse and data center security cameras.",
                "Investigating unencrypted video streams accessible without authentication on port 554.",
              ],
              troubleshootingAndRemediation:
                "If the video player indicates 'Negotiating Handshake': The remote RTSP server is completing the initial TCP handshake; the player will automatically transition to live frames within 2-3 seconds.",
            },
          },
          {
            id: "feat-win11-surveillance",
            name: "Windows 11 Native Surveillance Viewing (.M3U & PowerShell)",
            layerBadge: "Operating System Integration",
            protocolBadge: "M3U / PowerShell / Hardware Decoding",
            definition:
              "A comprehensive Windows 11 integration suite providing one-click `.m3u` media playlist generation, native desktop media player launching (Windows Media Player, VLC, PotPlayer), and automated PowerShell command execution.",
            technicalDescription: {
              overview:
                "While browser-based MJPEG is ideal for quick previews, professional video operators require native Windows 11 hardware decoding via GPU (NVIDIA NVDEC, Intel QuickSync, AMD AMF) for full 4K 60FPS video feeds without browser CPU overhead. NetSentinel generates dynamic RFC 8216 Extended M3U playlist files at `/api/cameras/:ip/playlist.m3u` and `/api/stream/playlist.m3u` containing metadata headers (`#EXTM3U`, `#EXTINF:-1 tvg-name=...`). Clicking the download initiates immediate file associations in Windows 11.",
              architectureAndFlow: [
                "User clicks 'Win 11 Play' on any camera card or inside the Camera Management modal.",
                "Server generates an `.m3u` playlist containing the target camera's canonical RTSP stream URL.",
                "Browser downloads the playlist with MIME type `application/x-mpegurl`.",
                "Windows 11 automatically triggers the default media player (VLC, Windows Media Player, or PotPlayer) to launch and play the live RTSP stream with GPU hardware acceleration.",
                "Alternatively, users can click 'Copy PowerShell Command' to launch VLC directly via Windows Terminal.",
              ],
              technicalParameters: [
                { name: "Playlist MIME Type", type: "application/x-mpegurl", description: "Standard HTTP Content-Type header instructing Windows 11 to open media players." },
                { name: "PowerShell Launch Syntax", type: "PowerShell String", description: "`Start-Process \"vlc\" -ArgumentList \"rtsp://9627b0bf2a7b.entrypoint.cloud.wowza.com:1935/app-p5260J38/66abe4b9_stream1\"`" },
              ],
              algorithmsAndProtocols:
                "RFC 8216 M3U playlist specification, Windows Shell file association dispatch, PowerShell Process Execution API.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Enables high-resolution, ultra-low-latency surveillance monitoring on Windows 11 multi-monitor security consoles without browser memory leaks or tab throttling.",
              stepByStepProcedure: [
                "On a Windows 11 workstation, navigate to the 'Hidden Cameras' tab.",
                "Locate any discovered camera card and click the blue 'Win 11 Play' button.",
                "When prompted by Windows 11, select 'Open' or choose your preferred player (VLC Media Player recommended).",
                "To launch via Windows Terminal: Open the camera's settings modal, copy the PowerShell launch command, open PowerShell, paste, and press Enter.",
              ],
              practicalUseCases: [
                "Displaying live camera feeds on dedicated Windows 11 wall monitors in security operations centers.",
                "Leveraging GPU hardware decoding to monitor multiple 4K H.265 camera feeds simultaneously.",
                "Recording or archiving live camera footage directly using VLC's built-in stream capture tools.",
              ],
              troubleshootingAndRemediation:
                "If Windows Media Player displays a codec error: Install VLC Media Player or K-Lite Codec Pack to enable native RTSP/H.264 stream decoding on Windows 11.",
            },
          },
          {
            id: "feat-ptz-controls",
            name: "Motorized Pan-Tilt-Zoom (PTZ) Controller & Optical Presets",
            layerBadge: "Application / Hardware Control (L7)",
            protocolBadge: "ONVIF Profile S / HTTP PTZ",
            definition:
              "An interactive directional control interface sending motorized pan, tilt, optical zoom, and preset positioning commands to compatible ONVIF Profile S and HTTP-controllable IP surveillance cameras.",
            technicalDescription: {
              overview:
                "Connects to camera motorized mechanics via HTTP REST endpoints (`POST /api/cameras/:ip/ptz`). The controller supports continuous and relative coordinate movements: Pan (Left/Right), Tilt (Up/Down), Zoom (Telephoto In / Wide Out), Center Reset, and variable speed scaling (1% to 100%). Furthermore, 4 programmable camera presets allow single-click repositioning to strategic vantage points.",
              architectureAndFlow: [
                "Operator presses directional buttons on the PTZ control pad.",
                "Client issues `POST /api/cameras/:ip/ptz` with payload `{ action: 'pan_left', speed: 60 }`.",
                "Server translates action into ONVIF SOAP `ContinuousMove` or vendor-specific CGI URL (`/cgi-bin/ptz.cgi?action=start&channel=1&code=Left&arg1=0&arg2=60&arg3=0`).",
                "Camera mechanics adjust physical lens orientation.",
                "Preset buttons 1-4 execute `GotoPreset` to instantly aim at configured security sectors.",
              ],
              technicalParameters: [
                { name: "Movement Vector", type: "String (pan_left, pan_right, tilt_up, tilt_down, zoom_in, zoom_out)", description: "Directional axis command sent to the camera." },
                { name: "Speed Slider", type: "Integer (1 - 100)", description: "Velocity of the stepper motor movement." },
                { name: "Preset Slots", type: "Array of 4 Objects", description: "Pre-programmed coordinates (1: Front Entrance, 2: Parking Area, 3: Perimeter Gate, 4: Driveway Approach)." },
              ],
              algorithmsAndProtocols:
                "ONVIF Core Specification Profile S PTZ Service, vendor-specific HTTP CGI protocols (Hikvision ISAPI, Dahua DH-PTZ, Reolink CGI).",
            },
            operationalUse: {
              threatModelAndUtility:
                "Enables security operators to track intruders in real time, zoom in to read vehicle license plates or identify faces, and rapidly cycle between security patrol sectors.",
              stepByStepProcedure: [
                "In the 'Hidden Cameras' deck, click on any PTZ-capable camera card to open its Management Drawer.",
                "Locate the circular 8-way PTZ Control Pad.",
                "Click and hold directional arrows to pan or tilt the camera; use the Zoom +/- buttons to adjust optical magnification.",
                "Click any Preset button (1-4) to immediately swing the camera to a predefined surveillance sector.",
              ],
              practicalUseCases: [
                "Following suspicious individuals moving across a parking lot or warehouse floor.",
                "Zooming in on delivery vehicles at entrance gates to read shipping manifests or plates.",
                "Patrolling sensitive facilities using automated preset rotations.",
              ],
              troubleshootingAndRemediation:
                "If PTZ commands return 'Unsupported': Verify that the camera physically contains motorized pan/tilt gears and that ONVIF user credentials are valid in Camera Settings.",
            },
          },
          {
            id: "feat-camera-settings",
            name: "Camera Hardware Stream Settings Customization",
            layerBadge: "Application Configuration (L7)",
            protocolBadge: "REST / ISAPI / SQLite",
            definition:
              "A centralized camera configuration console enabling remote modification of video encoding parameters, resolution, framerate, bitrate, night vision infrared (IR) modes, and motion detection sensitivity.",
            technicalDescription: {
              overview:
                "Eliminates the need to log into disparate vendor web consoles. The interface dispatches `PATCH /api/cameras/:ip/settings` to update configuration parameters, saving changes persistently to SQLite and dispatching configuration payloads to the camera via ONVIF/REST.",
              architectureAndFlow: [
                "Operator selects resolution (1080p, 2K, 4K), framerate (15 - 60 FPS), or bitrate (1024 - 8192 kbps).",
                "Operator toggles Night Vision IR mode: 'Auto' (light sensor controlled), 'Forced On' (illuminates IR LEDs), or 'Forced Off' (disables IR for stealth).",
                "Operator adjusts Motion Detection Sensitivity slider (1 to 100).",
                "Client submits changes; server applies settings and logs an audit record.",
              ],
              technicalParameters: [
                { name: "Resolution", type: "Enum ('1080p', '2K 1440p', '4K 2160p')", description: "Active sensor resolution." },
                { name: "Night Vision IR", type: "Enum ('Auto', 'On', 'Off')", description: "State of infrared illuminator cut-filter and LED ring." },
                { name: "Bitrate Target", type: "Integer (1024 - 8192 kbps)", description: "Target bandwidth allocation for the video encoder." },
                { name: "Motion Sensitivity", type: "Integer (1 - 100)", description: "Threshold of pixel luminance changes required to trigger motion alerts." },
              ],
              algorithmsAndProtocols:
                "ONVIF Media2 VideoEncoderConfiguration API, REST JSON payloads, SQLite parameter storage.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Allows optimizing surveillance quality during critical incidents or reducing bitrate when network congestion occurs. Enables stealth surveillance by disabling infrared LEDs that could reveal camera locations.",
              stepByStepProcedure: [
                "Open the Camera Management modal from any camera card.",
                "Select the 'Camera Settings' tab.",
                "Modify desired video parameters (e.g., switch Night Vision to 'Auto', set Bitrate to 4096 kbps).",
                "Click 'Save Camera Settings'. A success toast confirms persistent storage.",
              ],
              practicalUseCases: [
                "Increasing resolution and framerate on perimeter cameras during active security alerts.",
                "Lowering video bitrate on remote cellular/Wi-Fi connected cameras to prevent bandwidth saturation.",
                "Configuring motion sensitivity to filter out swaying trees while capturing moving humans.",
              ],
              troubleshootingAndRemediation:
                "If stream stutters after setting 4K: Reduce bitrate to 2048 kbps or framerate to 20 FPS to accommodate Wi-Fi bandwidth limits.",
            },
          },
        ],
      },
      {
        id: "portscanner",
        number: "04",
        title: "Multi-Threaded Port Scanner & Turbo Tuning",
        badge: "Transport Layer Auditing",
        icon: Cpu,
        summary: "High-throughput TCP connect auditing engine with parallel worker thread pool (up to 500 threads), checked-vs-total progress counter, and application banner grabbing.",
        targetDeckTab: "portscan",
        features: [
          {
            id: "feat-turboscan",
            name: "High-Concurrency TCP Connect Prober (Up to 500 Threads)",
            layerBadge: "Transport (L4)",
            protocolBadge: "TCP / POSIX Sockets",
            definition:
              "A high-throughput socket connection auditing engine utilizing a non-blocking thread worker pool capable of auditing up to 500 TCP ports concurrently across target endpoints.",
            technicalDescription: {
              overview:
                "Performs full TCP three-way handshakes (`SYN` -> `SYN-ACK` -> `ACK`) against target destination ports. By utilizing a configurable thread pool (10 to 500 parallel workers in `netsentinel/portscan.py`), the prober eliminates serial blocking. Socket connect timeouts are dynamically calibrated (0.2s to 1.5s), allowing an entire 1,024-port well-known range to be audited in under 2 seconds on local gigabit networks.",
              architectureAndFlow: [
                "User specifies target IP and port range profile (Top 50, Top 100, Well-Known 1-1024, Extended 1-10000, Full 65535, or Custom).",
                "Server initiates port scanning task managed by Python `concurrent.futures.ThreadPoolExecutor`.",
                "Each worker thread constructs a non-blocking POSIX socket (`socket.AF_INET`, `socket.SOCK_STREAM`) and calls `connect_ex((ip, port))`.",
                "Return code 0 signifies an open, listening port; error codes (ECONNREFUSED, ETIMEDOUT, EHOSTUNREACH) classify closed or filtered ports.",
                "Open ports trigger immediate application banner probes and are committed to SQLite `port_scans`.",
              ],
              technicalParameters: [
                { name: "Worker Threads", type: "Integer (10 - 500)", description: "Number of simultaneous socket threads dispatched." },
                { name: "Socket Timeout", type: "Float (0.2s - 2.0s)", description: "Maximum duration to wait for a TCP three-way handshake before marking a port closed." },
                { name: "Port Range Specifier", type: "String (e.g. '1-1024', '80,443,8080')", description: "Ports to audit on the target destination." },
              ],
              algorithmsAndProtocols:
                "POSIX non-blocking socket connect with `select()` polling. Thread-safe synchronization via Python `threading.Lock` and queue batching.",
              progressMeterBehavior:
                "Displays a live 'Checked vs. Total Counter' on the HUD (e.g. `1,024 / 1,024 (100.0%)`) with an animated progress bar, open port counter, and scan throughput rate in ports/second.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Discovers unauthorized backdoors, exposed database listeners, unencrypted management interfaces (Telnet, FTP, HTTP), and accidental firewall misconfigurations before attackers exploit them.",
              stepByStepProcedure: [
                "Navigate to the 'Port Audit' tab.",
                "Select a target host from the Target IP dropdown or enter an IP address manually.",
                "Choose a scan profile: 'Top 50' (quick health check), 'Well-Known (1-1024)' (standard audit), or 'Full (1-65535)' (deep penetration test).",
                "Adjust the Thread Concurrency slider (e.g. set to 250 threads for fast LAN audits).",
                "Click 'Start Port Scan'. Watch the live progress counter and open port list update in real time.",
              ],
              practicalUseCases: [
                "Auditing new servers to verify that only authorized ports (e.g. 443 HTTPS) are exposed to the LAN.",
                "Detecting accidental database exposures (MySQL 3306, PostgreSQL 5432, Redis 6379, MongoDB 27017).",
                "Checking for unencrypted legacy protocols (Telnet 23, FTP 21, rsh 514).",
              ],
              troubleshootingAndRemediation:
                "If the scan reports all ports closed: Verify target host firewall; try running a Ping test first to ensure Layer-3 reachability. On congested Wi-Fi, increase socket timeout to 1.0s to avoid false negatives.",
            },
          },
          {
            id: "feat-banner-grabbing",
            name: "Application Banner Grabbing & Service Version Fingerprinting",
            layerBadge: "Application (L7)",
            protocolBadge: "SSH / HTTP / TLS / FTP",
            definition:
              "An active protocol inspection routine that sends initial protocol probe requests to open TCP ports to capture application service banners, server software versions, and SSL/TLS certificates.",
            technicalDescription: {
              overview:
                "Merely knowing a port is open does not reveal what software is listening. Banner grabbing transmits lightweight protocol handshakes: for port 22, it reads the SSH identification string (`SSH-2.0-OpenSSH_8.9p1`); for port 80/443, it sends `HEAD / HTTP/1.1` to extract `Server:` headers (e.g. `nginx/1.22.0`, `Apache/2.4.52`); for TLS ports, it performs an SSL handshake to inspect certificate Common Names and expiration dates.",
              architectureAndFlow: [
                "Upon identifying an open port, worker socket sends standard protocol preamble.",
                "Receives up to 2,048 bytes of banner response within a strict 1-second timeout.",
                "Regex extractors parse software names, version numbers, and operating system indicators.",
                "Matches extracted version strings against known vulnerability databases (CVEs) and assigns severity risk scores (High, Medium, Low).",
              ],
              technicalParameters: [
                { name: "Service Name", type: "String (e.g. OpenSSH, Nginx, Apache)", description: "Identified software application running on the port." },
                { name: "Service Version", type: "String (e.g. 8.9p1, 2.4.52)", description: "Exact patch version reported by the service banner." },
                { name: "Risk Severity", type: "Enum ('High', 'Medium', 'Low', 'Info')", description: "Vulnerability severity rating based on unencrypted or outdated software." },
              ],
              algorithmsAndProtocols:
                "RFC 4253 SSH Transport Layer, RFC 9110 HTTP Semantics, RFC 8446 TLS 1.3 certificate inspection.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Identifies unpatched, end-of-life, or vulnerable software services exposing known remote code execution (RCE) or denial-of-service vulnerabilities.",
              stepByStepProcedure: [
                "After completing a port scan, review the 'Open Ports & Services' table.",
                "Inspect the 'Service / Banner' column displaying application badges (e.g. 'OpenSSH 8.9p1', 'nginx/1.18.0').",
                "Review the color-coded Risk Severity badge (Red = High Risk, Amber = Medium Risk, Green = Low Risk).",
                "Click on any service row to read hardening recommendations.",
              ],
              practicalUseCases: [
                "Identifying outdated Apache/Nginx web servers vulnerable to known web exploits.",
                "Flagging unencrypted Telnet or FTP services transmitting passwords in plain text.",
                "Verifying SSL/TLS certificate validity dates on internal management portals.",
              ],
              troubleshootingAndRemediation:
                "If a service displays High Risk: Immediately patch the underlying software package, disable legacy protocols, or restrict port access via firewall access control lists (ACLs).",
            },
          },
        ],
      },
      {
        id: "rat-defense",
        number: "05",
        title: "Remote Access Trojan (RAT) & Workstation Host Integrity",
        badge: "Malware & C2 Defense",
        icon: ShieldAlert,
        summary: "Signature prober covering 35+ Trojan families, behavioral protocol delimiters, workstation memory audit for deleted executables, and emergency containment.",
        targetDeckTab: "rat",
        features: [
          {
            id: "feat-rat-signatures",
            name: "35+ Known Trojan & C2 Beacon Signature Prober",
            layerBadge: "Transport / Application (L4-L7)",
            protocolBadge: "C2 Signatures / Protocol Probing",
            definition:
              "An active threat detection prober that transmits specialized protocol handshakes to identify listener sockets and command-and-control (C2) beacons corresponding to 35+ known Remote Access Trojan families.",
            technicalDescription: {
              overview:
                "Malware beacons listen on non-standard high ports or communicate back to internal rogue controllers. NetSentinel probes for signatures across major malware families: DarkComet (1604, 1605), njRAT/Bladabindi (5552, 1177), QuasarRAT (4782), AsyncRAT (6666, 7000), Warzone/Ave Maria (5200, 5201), RedLine Stealer (8085, 9050), Remcos (2404, 37777), Gh0st RAT (2001, 2002), PoisonIvy (3460), Cobalt Strike (50050), Metasploit (4444, 4445), Havoc C2 (40056), Mythic C2 (7443), Sliver/Covenant (8888), PlugX (13579), SubSeven, NetBus, Back Orifice, and Mirai botnets.",
              architectureAndFlow: [
                "Scanner sends protocol-specific probe packets (e.g. njRAT delimiter `|'|'`, Gh0st magic header, DarkComet DCDATA probe).",
                "Listens for characteristic beacon responses, non-standard TLS handshake self-signed certificates, or immediate protocol drops.",
                "Classifies infection severity and generates high-priority entries in `security_alerts`.",
              ],
              technicalParameters: [
                { name: "Target Scope", type: "Enum ('single', 'network', 'host_integrity')", description: "Scope of audit: single host, full subnet, or local workstation." },
                { name: "Matched Trojan Family", type: "String", description: "Identified malware strain (e.g. njRAT, DarkComet, Cobalt Strike)." },
                { name: "Listening Port", type: "Integer", description: "Suspicious port bound by the rogue listener." },
              ],
              algorithmsAndProtocols:
                "Binary magic-byte pattern matching, SSL/TLS certificate subject parsing, protocol framing delimiter inspection.",
              progressMeterBehavior:
                "Animated multi-phase progress bar on the RAT console: Phase 1 (Socket Enumeration) -> Phase 2 (Behavioral Handshakes) -> Phase 3 (C2 Certificate Analysis) -> Phase 4 (Threat Classification).",
            },
            operationalUse: {
              threatModelAndUtility:
                "Identifies stealthy endpoint infections where workstations have been backdoored by cyber criminals, ransomware operators, or advanced persistent threat (APT) groups.",
              stepByStepProcedure: [
                "Navigate to the 'RAT & Backdoors' security deck.",
                "Choose your audit target: select 'Entire Subnet' for fleet audit or pick an individual host.",
                "Click 'Launch RAT Threat Scan'. Observe the multi-phase progress meter.",
                "If a threat is detected, review the red alert card detailing the Trojan strain, listening port, and recommended containment steps.",
              ],
              practicalUseCases: [
                "Sweeping an office network after an employee reports opening a suspicious email attachment.",
                "Verifying that server subnets contain no rogue reverse shells or C2 beacons.",
                "Hunting for living-off-the-land post-exploitation frameworks (Cobalt Strike, Havoc).",
              ],
              troubleshootingAndRemediation:
                "If a Trojan signature is detected: Immediately click the red 'Quarantine Device' button to isolate the machine from peer communications, sever its external network connection, and initiate anti-virus forensic cleanup.",
            },
          },
          {
            id: "feat-host-integrity",
            name: "Workstation Host System Integrity & Memory Audit",
            layerBadge: "Operating System / Kernel",
            protocolBadge: "Procfs / Process Memory / Autoruns",
            definition:
              "A local forensic auditing engine that inspects active listening high-port sockets, detects unlinked or deleted executables running in memory (`(deleted)`), and audits autorun persistence keys on the local operating system.",
            technicalDescription: {
              overview:
                "Advanced malware frequently unlinks its binary from disk immediately after execution to evade file-based antivirus scanners, running purely from volatile memory. On Linux, NetSentinel audits `/proc/*/exe` via `readlink` to identify processes where the executable path contains `(deleted)`. It flags unprivileged 0.0.0.0 high-port listeners and crontab persistence. On Windows 11, it interrogates active TCP/UDP listeners via `netstat -ano`, inspects suspicious binaries executing out of `%APPDATA%` or `%TEMP%`, and audits `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run` persistence registry keys.",
              architectureAndFlow: [
                "Invoked via `GET /api/tools/rat/host-audit` or from the RAT Console 'Audit Local Host' button.",
                "Engine scans all running process identifiers (PIDs) and maps their network socket descriptors.",
                "Identifies any executable binary deleted from disk while remaining active in memory.",
                "Flags processes binding to `0.0.0.0` (all interfaces) rather than `127.0.0.1` (localhost).",
                "Returns a comprehensive integrity health report with actionable risk classifications.",
              ],
              technicalParameters: [
                { name: "Process Identifier (PID)", type: "Integer", description: "Process ID of the suspicious memory-resident binary." },
                { name: "Executable Path", type: "Path String", description: "Original filesystem path of the executable." },
                { name: "Listening Socket", type: "IP:Port String", description: "Socket address bound by the suspicious process." },
              ],
              algorithmsAndProtocols:
                "Linux procfs virtual filesystem traversal, Windows Win32 API process handle enumeration, registry hive inspection.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Detects fileless malware, memory injection attacks, and covert listening backdoors running on the local monitoring host or server.",
              stepByStepProcedure: [
                "In the 'RAT & Backdoors' deck, locate the 'Local Host System Integrity' panel.",
                "Click the blue 'Run Workstation Audit' button.",
                "Inspect the results table for any flagged processes or unlinked memory executables.",
                "Review listening ports and verify that all listening services belong to legitimate software.",
              ],
              practicalUseCases: [
                "Validating host security prior to deploying NetSentinel as a permanent monitoring server.",
                "Investigating high CPU or network usage spikes on local workstations.",
                "Confirming that no hidden remote shells are active on admin machines.",
              ],
              troubleshootingAndRemediation:
                "If a deleted memory executable is identified: Note the PID and terminate the process immediately via terminal (`kill -9 <PID>` on Linux or `taskkill /F /PID <PID>` on Windows 11); investigate how the file was initially introduced.",
            },
          },
        ],
      },
      {
        id: "quarantine-isolation",
        number: "06",
        title: "Zero-Trust Quarantine & Endpoint Isolation Deck",
        badge: "Zero-Trust Containment",
        icon: ShieldAlert,
        summary: "Zero-trust containment architecture, active online vs dormant offline tracking, immutable forensic audit trails, and instant release workflows.",
        targetDeckTab: "quarantine",
        features: [
          {
            id: "feat-quarantine-state",
            name: "Active vs. Dormant Quarantine Isolation Engine",
            layerBadge: "Zero-Trust Access Control",
            protocolBadge: "State Machine / ARP Suppression",
            definition:
              "A state-machine containment system that isolates untrusted or compromised endpoints, distinctly partitioning them into active online endpoints (currently transmitting packets) and dormant offline endpoints to guarantee containment across reconnects.",
            technicalDescription: {
              overview:
                "When an endpoint is quarantined, its status is recorded in SQLite (`is_quarantined = 1`). NetSentinel maintains a continuous heartbeat: active isolated endpoints transmitting traffic are displayed with flashing red containment indicators. If a quarantined device disconnects, it is moved to the 'Dormant Quarantined' register, ensuring that the instant it reconnects, it remains strictly isolated without escaping containment.",
              architectureAndFlow: [
                "Device is moved to quarantine via `POST /api/devices/:mac/quarantine` with `quarantined: true` and an explicit reason.",
                "Daemon sets `is_quarantined = 1` and records timestamp in `quarantined_at`.",
                "Periodic background discovery tracks whether the quarantined MAC address responds to ARP/ping.",
                "Active isolated devices are segregated in the UI with live latency and last-seen telemetry; dormant endpoints remain indexed.",
                "The sidebar navigation badge displays the exact count of quarantined endpoints in red.",
              ],
              technicalParameters: [
                { name: "Quarantine Flag", type: "Boolean (0 or 1)", description: "Binary isolation state in the database." },
                { name: "Isolation Reason", type: "String", description: "Mandatory incident descriptor (e.g. 'Suspected RAT Trojan C2 Beacon')." },
                { name: "Quarantine Timestamp", type: "ISO-8601 UTC String", description: "Exact moment containment was initiated." },
              ],
              algorithmsAndProtocols:
                "Zero-Trust Network Access (ZTNA) policy enforcement, persistent database state reconciliation.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Prevents compromised machines from moving laterally across the network, infecting peer workstations with ransomware, or exfiltrating data.",
              stepByStepProcedure: [
                "Navigate to the 'Quarantine Deck' in the top navigation bar.",
                "Review the two partitioned views: 'Active Quarantined Devices' (online) and 'Dormant Quarantined Devices' (offline).",
                "Inspect the containment card detailing the MAC address, IP, vendor, isolation reason, and quarantine duration.",
                "To release a remediated device, click the green 'Release from Quarantine' button.",
              ],
              practicalUseCases: [
                "Isolating infected workstations during active malware outbreaks.",
                "Containing unknown guest devices that failed authorization checks.",
                "Preventing rogue hardware from accessing internal intranet portals.",
              ],
              troubleshootingAndRemediation:
                "Ensure network switches support 802.1X or dynamic VLAN assignment to enforce physical port isolation alongside NetSentinel software isolation.",
            },
          },
        ],
      },
      {
        id: "diagnostics-dns",
        number: "07",
        title: "Network Diagnostics & DNS Testing Suite",
        badge: "Diagnostic Tooling",
        icon: Activity,
        summary: "7-in-1 network diagnostic suite: dual-mode ping with firewall bypass, parallel hop traceroute, multi-record RFC DNS resolver, email SPF/DMARC validator, and DNSBL checks.",
        targetDeckTab: "tools",
        features: [
          {
            id: "feat-dual-ping",
            name: "Dual-Mode Ping Engine (ICMP Echo + TCP SYN Firewall Bypass)",
            layerBadge: "Network (L3) / Transport (L4)",
            protocolBadge: "ICMP / TCP SYN",
            definition:
              "A precision round-trip latency and jitter prober executing standard ICMP Echo Requests with automatic, transparent fallback to TCP SYN handshakes when ICMP echo packets are blocked by host firewalls.",
            technicalDescription: {
              overview:
                "Many modern endpoints (especially Windows workstations with Windows Defender Firewall enabled) drop incoming ICMP ping packets by default, causing standard ping tools to report false downtime. NetSentinel's dual-mode engine measures latency using microsecond-resolution clocks (`time.perf_counter()`). If ICMP echo requests time out, it immediately dispatches TCP SYN packets to port 80 or 443. The round-trip time of the received TCP SYN-ACK or RST response provides true latency, jitter, and packet loss metrics.",
              architectureAndFlow: [
                "Client triggers `POST /api/tools/ping` with target IP/hostname, packet count, and mode ('auto', 'icmp', or 'tcp_syn').",
                "Engine dispatches sequential probes, tracking min, avg, max latency, and jitter deviation.",
                "Outputs real-time terminal telemetry and visual summary cards with color-coded latency status.",
              ],
              technicalParameters: [
                { name: "Target Address", type: "IPv4, IPv6, or Hostname String", description: "Destination host to measure." },
                { name: "Probe Count", type: "Integer (1 - 20 packets)", description: "Number of ping probes to dispatch." },
                { name: "Timeout per Probe", type: "Float Seconds (0.5s - 5.0s)", description: "Maximum wait time for each echo or SYN response." },
              ],
              algorithmsAndProtocols:
                "RFC 792 ICMP Echo Protocol, microsecond clock measurement, jitter standard deviation calculation.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Accurately diagnoses server reachability and network latency bottlenecks even when endpoints are hardened behind strict firewalls.",
              stepByStepProcedure: [
                "Navigate to the 'Network Tools' deck and select the 'Ping' tab.",
                "Select a target from the 'Discovered Devices' dropdown or enter any custom IP/domain (e.g. `1.1.1.1`).",
                "Choose packet count (default: 4 packets).",
                "Click 'Run Ping Test'. Review the latency graph, min/avg/max metrics, and packet loss percentage.",
              ],
              practicalUseCases: [
                "Verifying network link stability and packet jitter for VoIP and video conferencing.",
                "Confirming whether a server is genuinely offline or merely blocking ICMP echo packets.",
                "Measuring peering latency to internal gateways and public DNS resolvers.",
              ],
              troubleshootingAndRemediation:
                "If packet loss exceeds 5%: Inspect Wi-Fi signal quality in the Wi-Fi Spectrum deck or check for bad Ethernet cables.",
            },
          },
          {
            id: "feat-traceroute",
            name: "Parallel Hop-by-Hop Traceroute Engine",
            layerBadge: "Network Layer (L3)",
            protocolBadge: "ICMP Time Exceeded / TTL",
            definition:
              "A high-speed route trace prober that measures routing pathways, intermediate router hops, and hop latency by transmitting multi-threaded packets with incrementing Time-To-Live (TTL) values simultaneously.",
            technicalDescription: {
              overview:
                "Legacy traceroute tools probe hops sequentially, often requiring 30 to 60 seconds to complete. NetSentinel dispatches probes with TTL values from 1 to 30 in parallel worker threads. It catches ICMP Type 11 Code 0 (Time Exceeded in Transit) messages returned by intermediate routers, resolves reverse PTR DNS hostnames, and reconstructs the complete routing topology in under 2 seconds.",
              architectureAndFlow: [
                "Client calls `POST /api/tools/traceroute` with destination target.",
                "Worker threads emit TTL-sequenced UDP/ICMP probes simultaneously.",
                "Intermediate gateway IP addresses and round-trip times are captured.",
                "Reverse DNS lookups resolve carrier peering router hostnames (e.g. `ae1-100.bb01.ord01.network.net`).",
              ],
              technicalParameters: [
                { name: "Max Hops", type: "Integer (1 - 30 hops)", description: "Maximum router hop threshold." },
                { name: "Probe Timeout", type: "Float (1.0s - 3.0s)", description: "Wait limit per hop probe." },
              ],
              algorithmsAndProtocols:
                "RFC 792 ICMP Time Exceeded mechanics, parallel socket polling, asynchronous PTR resolver.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Identifies ISP routing loops, packet drops at upstream transit providers, and unauthorized man-in-the-middle gateway diversions.",
              stepByStepProcedure: [
                "In 'Network Tools', select the 'Traceroute' tab.",
                "Enter target IP or hostname (e.g. `8.8.8.8`).",
                "Click 'Run Traceroute'. View the interactive hop table showing hop number, IP, hostname, and latency.",
              ],
              practicalUseCases: [
                "Identifying which specific upstream ISP router is dropping packets during outages.",
                "Verifying whether VPN traffic is properly routing through encrypted tunnels.",
                "Comparing latency across dual-WAN internet connections.",
              ],
              troubleshootingAndRemediation:
                "If intermediate hops display '* * * (Request Timed Out)': Many carrier core routers prioritize traffic forwarding over ICMP reply generation; this is normal unless all subsequent hops also fail.",
            },
          },
        ],
      },
      {
        id: "dns-defense",
        number: "08",
        title: "DNS Hijacking & Poisoning Defense",
        badge: "DNS Integrity",
        icon: Shield,
        summary: "Proactive defense against NXDOMAIN redirection tampering, canary domain spoofing, transparent port 53 gateway interception, and DNSSEC validation.",
        targetDeckTab: "tools",
        features: [
          {
            id: "feat-nxdomain-hijack",
            name: "NXDOMAIN Wildcard Redirection Detection",
            layerBadge: "Application (L7) / DNS",
            protocolBadge: "DNS / RFC 1035 / RCODE 3",
            definition:
              "A security probe that tests whether the local DNS resolver correctly returns RFC 1035 RCODE 3 (NXDOMAIN Non-Existent Domain) or fraudulently resolves non-existent domains to monetization or surveillance IP addresses.",
            technicalDescription: {
              overview:
                "When a user mistypes a domain, compliant DNS resolvers must return NXDOMAIN. Intrusive ISPs, malicious routers, and rogue DNS proxies frequently intercept failed lookups and return the IP address of an advertising portal, search affiliate, or traffic-logging proxy. NetSentinel generates cryptographically random non-existent domain strings (e.g. `nx-8273941a7b.invalid`) and queries the resolver. If an IP address is returned, the resolver is marked as hijacked.",
              architectureAndFlow: [
                "Invoked via `POST /api/tools/dns-hijack`.",
                "Engine constructs queries for multiple pseudo-random domains guaranteed not to exist.",
                "Parses DNS response flags and answer sections.",
                "Flags hijacking if RCODE is 0 (NOERROR) and answers contain IPv4/IPv6 records.",
              ],
              technicalParameters: [
                { name: "Query Domain", type: "Randomized FQDN String", description: "Generated non-existent domain tested." },
                { name: "Observed RCODE", type: "Integer (0 = NOERROR, 3 = NXDOMAIN)", description: "Response code returned by the tested resolver." },
              ],
              algorithmsAndProtocols:
                "RFC 1035 Domain Names - Implementation and Specification, UDP socket packet parser.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Protects against intrusive ISP tracking, adware redirection, and rogue gateway DNS manipulation.",
              stepByStepProcedure: [
                "Navigate to 'Network Tools' -> 'DNS Hijack Audit'.",
                "Click 'Execute DNS Security Audit'.",
                "Review the 'NXDOMAIN Redirection' check card.",
                "A green check indicates strict RFC compliance; a red warning highlights the spoofed IP address returned by the rogue resolver.",
              ],
              practicalUseCases: [
                "Testing public hotel and coffee shop Wi-Fi networks for captive portal or ISP DNS hijacking.",
                "Verifying that corporate DNS servers adhere to zero-redirection compliance standards.",
                "Auditing home routers for malicious DNS settings injected by malware.",
              ],
              troubleshootingAndRemediation:
                "If NXDOMAIN hijacking is detected: Configure your network adapter to use encrypted DNS-over-HTTPS (DoH) or switch to trusted DNS providers (Cloudflare 1.1.1.1 or Quad9 9.9.9.9).",
            },
          },
          {
            id: "feat-port53-intercept",
            name: "Transparent Port 53 Gateway Interception Probe",
            layerBadge: "Transport / Network Security",
            protocolBadge: "UDP Port 53 / NAT Hijacking",
            definition:
              "A diagnostic prober detecting whether local gateway firewalls or ISPs perform transparent NAT redirection of outbound UDP port 53 traffic, forcibly hijacking queries destined for third-party nameservers.",
            technicalDescription: {
              overview:
                "Even if an administrator configures custom DNS servers (e.g. 1.1.1.1) on their workstations, aggressive router firewalls can employ Destination NAT (DNAT) rules (`iptables -t nat -A PREROUTING -p udp --dport 53 -j REDIRECT`) to silently redirect all outbound port 53 traffic into their own internal resolvers. NetSentinel detects this by sending a valid DNS query to an unassigned, non-existent public IP address. If a reply is received, a gateway is intercepting all port 53 traffic regardless of destination.",
              architectureAndFlow: [
                "Engine transmits a DNS query packet to an unrouted bogon IP address on port 53.",
                "If a valid DNS response returns, transparent port 53 interception is confirmed.",
                "Engine warns the operator that custom DNS settings on local machines are being silently overridden.",
              ],
              technicalParameters: [
                { name: "Probe Destination", type: "Non-routable IP String", description: "Dummy IP address used to test for transparent gateway interception." },
                { name: "Interception Detected", type: "Boolean", description: "True if response received from dummy IP." },
              ],
              algorithmsAndProtocols:
                "Raw UDP socket socket injection, DNAT detection heuristics.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Exposes covert corporate monitoring, parental control appliances, and ISP censorship mechanisms that silently subvert user-configured DNS privacy settings.",
              stepByStepProcedure: [
                "In 'Network Tools', run the 'DNS Hijack Audit'.",
                "Review the 'Transparent Port 53 Interception' finding.",
                "If marked 'Interception Active', all standard unencrypted DNS queries on your network are being forcibly redirected by the gateway.",
              ],
              practicalUseCases: [
                "Auditing enterprise networks for transparent proxy appliances.",
                "Verifying that security-hardened machines cannot have their DNS silently redirected.",
                "Confirming whether an ISP enforces government DNS censorship blocks.",
              ],
              troubleshootingAndRemediation:
                "If transparent port 53 interception is active: Standard unencrypted DNS is unsafe on your network. Transition immediately to DNS-over-HTTPS (DoH), DNS-over-TLS (DoT), or an encrypted WireGuard/OpenVPN tunnel.",
            },
          },
        ],
      },
      {
        id: "wifi-spectrum",
        number: "09",
        title: "Wi-Fi Multi-Band Spectrum & Saturation Analyzer",
        badge: "Wireless Spectrum Analysis",
        icon: Radio,
        summary: "Tri-band 802.11 spectrum discovery across 2.4 GHz, 5 GHz, and 6 GHz (Wi-Fi 6E/7), dual dBm/% signal metering, co-channel interference algorithms, and automated migration advice.",
        targetDeckTab: "wifi",
        features: [
          {
            id: "feat-triband-wifi",
            name: "Tri-Band 802.11 Spectrum Discovery (2.4, 5, and 6 GHz Wi-Fi 6E/7)",
            layerBadge: "Physical / Data Link (L1/L2)",
            protocolBadge: "802.11ax / 802.11be / Wi-Fi 6E/7",
            definition:
              "A comprehensive wireless spectrum discovery engine that enumerates all surrounding access points and client networks across 2.4 GHz (channels 1–14), 5 GHz (channels 36–165), and next-generation 6 GHz Wi-Fi 6E / Wi-Fi 7 (channels 1–233) frequency spectrums.",
            technicalDescription: {
              overview:
                "Interrogates host wireless interfaces via native OS APIs. On Windows 11, it invokes `netsh wlan show networks mode=bssid` to extract BSSIDs, SSIDs, signal percentages, authentication ciphers (WPA2-Personal, WPA3-SAE, OWE), physical layer types (802.11ax, 802.11be), channels, and channel widths (20 MHz to 160 MHz). On Linux, it leverages `nmcli dev wifi list` or `iw dev <iface> scan`. Data is parsed into structured JSON representations and mapped to frequency spectrum bands.",
              architectureAndFlow: [
                "Operator triggers Wi-Fi sweep from the 'Wi-Fi Spectrum' tab or via `POST /api/wifi/rescan`.",
                "Subprocess executes wireless interface scan.",
                "Discovered BSSIDs are categorized into 2.4 GHz, 5 GHz, and 6 GHz bins based on primary channel number.",
                "Computes signal strength in percentage (0-100%) and absolute dBm (-30 dBm to -95 dBm).",
                "Renders interactive visual spectrum channel maps with frequency band filtering.",
              ],
              technicalParameters: [
                { name: "Frequency Band", type: "Enum ('2.4 GHz', '5 GHz', '6 GHz')", description: "Wireless spectrum band." },
                { name: "Channel Width", type: "Integer (20, 40, 80, 160, 320 MHz)", description: "Channel bonding bandwidth." },
                { name: "Signal Power", type: "Decibels Relative to 1 mW (-30 to -95 dBm)", description: "Exact radio frequency received signal strength indicator (RSSI)." },
              ],
              algorithmsAndProtocols:
                "IEEE 802.11-2020 wireless MAC/PHY standards, RSSI-to-percentage mathematical conversions.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Detects rogue access points, evil twin phishing APs, unapproved Wi-Fi hotspots, and overlapping channel interference degrading corporate wireless performance.",
              stepByStepProcedure: [
                "Navigate to the 'Wi-Fi Spectrum' tab in the top navigation bar.",
                "Use the band selector buttons ('All', '2.4 GHz', '5 GHz', '6 GHz') to isolate specific spectrum bands.",
                "Review the interactive channel map showing neighboring APs plotted across channel frequencies.",
                "Click on any network card to inspect BSSID MAC address, encryption cipher, and signal stability.",
              ],
              practicalUseCases: [
                "Performing wireless site surveys to eliminate dead zones in homes or multi-story offices.",
                "Hunting for rogue 'Evil Twin' access points broadcasting authorized SSIDs with unencrypted security.",
                "Identifying Wi-Fi 6E/7 6 GHz capabilities for high-bandwidth workstation deployment.",
              ],
              troubleshootingAndRemediation:
                "If Wi-Fi scan returns empty: Verify that your machine's Wi-Fi adapter is turned on and not in airplane mode; on Linux, verify that `NetworkManager` or `wpa_supplicant` is active.",
            },
          },
          {
            id: "feat-channel-interference",
            name: "Channel Saturation & Inter-AP Interference Algorithms",
            layerBadge: "RF Engineering / Optimization",
            protocolBadge: "Interference Weighting Math",
            definition:
              "A mathematical radio frequency interference model that computes aggregate channel congestion by weighting overlapping co-channel transmitters and adjacent-channel bleed.",
            technicalDescription: {
              overview:
                "Wi-Fi channels overlap significantly (especially in 2.4 GHz where only channels 1, 6, and 11 do not overlap). NetSentinel applies a rigorous weighting algorithm: access points transmitting on the exact same primary channel produce co-channel interference with an exact 1.0x penalty factor (forcing CSMA/CA backoff pauses). Access points transmitting on adjacent overlapping channels produce spectral bleed with a 0.35x penalty factor. The resulting score generates an objective Saturation Rating (Low, Moderate, Congested) for every channel.",
              architectureAndFlow: [
                "Algorithm iterates through all discovered BSSIDs and their channel bandwidth envelopes.",
                "Calculates Co-Channel Interference: `Score_co = Sum(RSSI_weight * 1.0)` for all APs on channel `C`.",
                "Calculates Adjacent-Channel Bleed: `Score_adj = Sum(RSSI_weight * 0.35)` for APs on `C - 2` through `C + 2`.",
                "Total Congestion Index = `Score_co + Score_adj`.",
                "Advisory engine evaluates your connected AP's channel score and recommends cleaner alternatives.",
              ],
              technicalParameters: [
                { name: "Co-Channel Weight", type: "Float (1.0x)", description: "Penalty multiplier for transmitters sharing the same channel." },
                { name: "Adjacent Bleed Weight", type: "Float (0.35x)", description: "Penalty multiplier for sideband spectral bleed." },
                { name: "Saturation Rating", type: "Enum ('Low', 'Moderate', 'Congested')", description: "Overall radio interference classification." },
              ],
              algorithmsAndProtocols:
                "RF spectral mask overlap modeling, CSMA/CA contention probability scoring.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Eliminates packet drops, high ping latency spikes, and degraded throughput caused by competing neighbor Wi-Fi routers sharing the same frequency.",
              stepByStepProcedure: [
                "Open the 'Wi-Fi Spectrum' tab.",
                "Inspect the 'Spectrum Saturation' summary cards at the top.",
                "Review the 'Optimization Advice' banner recommending optimal channels (e.g. 'Migrate from Channel 6 to Channel 11 for 48% less interference').",
                "Log into your Wi-Fi router's administrative portal and change its broadcast channel to the recommended clean channel.",
              ],
              practicalUseCases: [
                "Eliminating lag and packet loss during competitive gaming or real-time Zoom/Teams video conferences.",
                "Optimizing high-density apartment or office Wi-Fi installations where dozens of APs compete.",
                "Selecting the cleanest 80 MHz channel in the 5 GHz band for high-speed file transfers.",
              ],
              troubleshootingAndRemediation:
                "In 2.4 GHz, strictly configure routers to channels 1, 6, or 11. Never set routers to in-between channels (2, 3, 4, 5) as this causes severe adjacent bleed interference with both channel 1 and channel 6.",
            },
          },
        ],
      },
      {
        id: "terminal-cli",
        number: "10",
        title: "Embedded Terminal Shell & Rich Headless CLI",
        badge: "Interactive Command Line",
        icon: Terminal,
        summary: "Browser pseudo-terminal emulator with live execution progress meters, dual-stack IPv6 commands, retro CRT green phosphor scanlines, and headless Python Rich CLI daemon.",
        targetDeckTab: "terminal",
        features: [
          {
            id: "feat-terminal-shell",
            name: "Embedded Interactive Terminal & Execution Progress Meter",
            layerBadge: "CLI / System Administration",
            protocolBadge: "Pseudo-Shell / SSE Telemetry",
            definition:
              "An interactive web terminal emulator communicating directly with backend execution handlers over `/api/terminal/exec` featuring an animated real-time progress meter positioned above the command prompt.",
            technicalDescription: {
              overview:
                "Provides a full command-line environment inside the web browser. The shell supports commands: `help`, `devices`, `scan`, `ipv6`, `portscan <ip>`, `cameras`, `dnshijack`, `rat-check`, `speedtest`, `status`, and `clear`. When a command executes, an animated progress meter bar appears directly above the `NetSentinel $ ` prompt, displaying real-time execution percentages and stage descriptions.",
              architectureAndFlow: [
                "Operator enters a command at the `NetSentinel $ ` prompt and presses Enter.",
                "Terminal dispatches command to `/api/terminal/exec`.",
                "Progress meter bar activates, streaming phase telemetry (e.g. 'Initializing worker threads...', 'Executing socket sweep...', 'Formatting table output...').",
                "Terminal viewport renders output with ANSI color highlighting and command history buffer (Up/Down arrows).",
              ],
              technicalParameters: [
                { name: "Command Input", type: "String", description: "Command string entered by the operator." },
                { name: "Execution Progress", type: "Integer (0 - 100%)", description: "Active completion percentage displayed on the meter bar." },
                { name: "CRT Scanline Mode", type: "Boolean", description: "Toggles retro phosphor green CRT visual styling." },
              ],
              algorithmsAndProtocols:
                "ANSI terminal parsing, micro-task queue scheduling, history buffer indexing.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Empowers keyboard-driven security analysts to rapidly run diagnostics, trigger scans, and inspect device inventories without clicking through multiple menus.",
              stepByStepProcedure: [
                "Click the 'Terminal' tab in the top navigation bar.",
                "Type `help` and press Enter to list all available terminal commands.",
                "Type `ipv6 sweep` to trigger a dual-stack neighbor discovery sweep; observe the progress meter above the prompt.",
                "Use the Up and Down arrow keys to cycle through previous command history.",
                "Click the 'CRT Mode' toggle in the terminal header to switch to retro green phosphor styling.",
              ],
              practicalUseCases: [
                "Executing rapid scripted sweeps during live penetration testing exercises.",
                "Inspecting raw JSON or tabular output for command-line parsing.",
                "Running dual-stack IPv6 diagnostic checks via `ipv6 list` and `neigh`.",
              ],
              troubleshootingAndRemediation:
                "Type `clear` to reset the terminal buffer if screen output becomes cluttered.",
            },
          },
          {
            id: "feat-rich-cli-daemon",
            name: "Python Rich CLI & Autonomous Intruder Monitoring Daemon",
            layerBadge: "Automation / Daemon",
            protocolBadge: "Python Rich TUI / Daemon Loop",
            definition:
              "A headless command-line interface and background system daemon leveraging the Python `rich` library to render color-coded tables and autonomously monitor local networks 24/7 for unauthorized intruders.",
            technicalDescription: {
              overview:
                "NetSentinel can run entirely without a web browser via `python3 cli.py`. Commands include `--scan` (subnet sweep), `--inventory` (device table), `--portscan <ip>` (port audit), and `--daemon --interval <seconds>`. In daemon mode, NetSentinel runs a perpetual background loop, executing silent discovery sweeps, comparing discovered MACs against trusted records, recording intruder alerts, and dispatching SMTP emails.",
              architectureAndFlow: [
                "Operator executes `python3 cli.py --daemon --interval 30`.",
                "Daemon sleeps for configured interval, then fires silent ARP/ICMP sweep.",
                "Reconciles discovered devices against SQLite `devices` table.",
                "If an untrusted MAC is identified, logs high-priority alert in `security_alerts` and dispatches SMTP incident email.",
              ],
              technicalParameters: [
                { name: "Daemon Interval", type: "Integer Seconds (default: 30s)", description: "Time interval between automated discovery sweeps." },
                { name: "Output Format", type: "Rich Monospace Table", description: "Color-coded CLI rendering formatted for standard Linux/Windows terminals." },
              ],
              algorithmsAndProtocols:
                "POSIX daemonization, signal handling (`SIGINT`, `SIGTERM`), Python `rich.table.Table` formatting.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Provides continuous 24/7 perimeter protection. Alerts administrators instantly when an unknown device connects to the network, preventing silent rogue intrusions.",
              stepByStepProcedure: [
                "Open a terminal window or SSH session on your server/Raspberry Pi.",
                "Run `python3 cli.py --scan` to perform an immediate terminal sweep.",
                "To launch continuous background defense: Run `python3 cli.py --daemon --interval 30`.",
                "To run as a systemd service: Configure a systemd unit file pointing to `cli.py --daemon`.",
              ],
              practicalUseCases: [
                "Deploying NetSentinel as a permanent headless network sentry on a Raspberry Pi plugged into a server rack.",
                "Scheduling automated cron jobs to run nightly port scans and generate audit reports.",
                "Integrating network discovery outputs into DevOps CI/CD pipelines via CLI stdout.",
              ],
              troubleshootingAndRemediation:
                "Press `Ctrl+C` to gracefully terminate the daemon. To adjust sweep frequency, change the `--interval` argument.",
            },
          },
        ],
      },
      {
        id: "settings-backup",
        number: "11",
        title: "System Settings, SMTP Alerts & Disaster Recovery",
        badge: "System Administration",
        icon: Settings,
        summary: "Automated SMTP email incident alerts, engine thread concurrency tuning, atomic SQLite backup snapshots with animated progress meters, and retention rotation.",
        targetDeckTab: "settings",
        features: [
          {
            id: "feat-smtp-alerts",
            name: "Automated SMTP Email Incident Dispatcher",
            layerBadge: "Application / Alerting (L7)",
            protocolBadge: "SMTP / STARTTLS / SSL",
            definition:
              "An automated notification subsystem that dispatches formatted HTML incident alerts via configured SMTP mail relays upon the occurrence of critical security events.",
            technicalDescription: {
              overview:
                "Connects to corporate or personal SMTP mail relays (Gmail, Outlook 365, Amazon SES, SendGrid, custom Postfix). Supports Port 587 with STARTTLS encryption or Port 465 with direct SSL. Administrators select specific event triggers: 'New Unknown Device Joined', 'Device Quarantined', 'RAT Trojan Detected', or 'Port Scan Alert'. Includes a live 'Test Connection' diagnostic button.",
              architectureAndFlow: [
                "Security event occurs (e.g. unknown device connects).",
                "Alert dispatcher checks if email alerting is enabled in `system_settings`.",
                "Constructs MIME multipart HTML email with device details, IP, MAC, vendor, and timestamp.",
                "Establishes encrypted SMTP session, authenticates, and dispatches to recipient addresses.",
              ],
              technicalParameters: [
                { name: "SMTP Host & Port", type: "Hostname String & Integer (587 / 465)", description: "Mail relay server endpoint." },
                { name: "Encryption Mode", type: "Enum ('STARTTLS', 'SSL/TLS', 'Plain')", description: "Transport security cipher protocol." },
                { name: "Recipient List", type: "Comma-delimited Email Strings", description: "Destination inbox addresses." },
              ],
              algorithmsAndProtocols:
                "RFC 5321 Simple Mail Transfer Protocol, RFC 3207 SMTP over TLS, MIME multipart formatting.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Guarantees that security officers receive immediate notifications on their mobile devices when an intrusion or malware beacon is detected, eliminating response delays.",
              stepByStepProcedure: [
                "Navigate to the 'Settings' tab in the top navigation bar.",
                "Scroll to the 'Email Alerting Configuration' section.",
                "Enter your SMTP Relay Host, Port (587), Username, and Password.",
                "Enter Sender Email and Recipient Email addresses.",
                "Click 'Test SMTP Connection' to verify credentials.",
                "Click 'Save Alert Settings'.",
              ],
              practicalUseCases: [
                "Receiving immediate email alerts when an unknown device connects to home or office Wi-Fi.",
                "Notifying security teams when a workstation triggers a RAT signature alert.",
                "Logging periodic automated network health summaries to management inboxes.",
              ],
              troubleshootingAndRemediation:
                "If SMTP connection fails with 'Authentication Failed': For Gmail/Outlook, generate a dedicated 'App Password' rather than your standard account password; verify port 587 is not blocked by your ISP.",
            },
          },
          {
            id: "feat-backup-recovery",
            name: "Atomic SQLite Backup Snapshots & Retention Rotation",
            layerBadge: "Database / Disaster Recovery",
            protocolBadge: "SQLite Online Backup API / WAL",
            definition:
              "A zero-downtime database snapshot engine that generates timestamped, point-in-time `.db` archives of the operational database with animated progress meters and automated retention rotation.",
            technicalDescription: {
              overview:
                "Traditional file copies of active SQLite databases during write transactions risk file corruption. NetSentinel utilizes the SQLite Online Backup API (`sqlite3_backup` / `VACUUM INTO`) to generate lock-free, atomic snapshots of `netsentinel.db`. Each archive is timestamped (`netsentinel_backup_YYYYMMDD_HHMMSS.db`). An automated retention scheduler retains the last 5, 10, or 30 archives, purging older snapshots to conserve disk space.",
              architectureAndFlow: [
                "Operator clicks 'Create Backup Now' in the Settings console.",
                "Animated progress meter bar activates: 10% (Checking WAL Lock) -> 45% (Executing VACUUM INTO) -> 80% (Compressing Snapshot) -> 100% (Complete).",
                "Archive is saved into `./backups/` directory.",
                "Retention policy checks total backup count; oldest archives exceeding the retention threshold are safely pruned.",
                "Backup archive list updates with download and restore actions.",
              ],
              technicalParameters: [
                { name: "Backup Filename", type: "String", description: "Generated timestamped database archive file." },
                { name: "Retention Limit", type: "Integer (5, 10, 30 snapshots)", description: "Maximum archives preserved before automatic rotation." },
                { name: "Backup Size", type: "Megabytes (Float)", description: "Filesize of the generated SQLite snapshot." },
              ],
              algorithmsAndProtocols:
                "SQLite Online Backup API, transactional copy semantics, automated FIFO rotation.",
              progressMeterBehavior:
                "Features an animated progress meter bar with real-time percentage ticks (10% to 100%) and stage descriptions during snapshot generation.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Protects against data loss, operating system reinstallations, disk failures, or database corruption during power outages.",
              stepByStepProcedure: [
                "In 'Settings', scroll to the 'Backup & Disaster Recovery' section.",
                "Click the blue 'Create Backup Now' button; observe the progress meter bar.",
                "Once complete, review the backup entry in the archive table.",
                "Click the download icon next to any backup to save a copy to an external USB drive or secure cloud storage.",
              ],
              practicalUseCases: [
                "Creating snapshots prior to running major network migrations or software updates.",
                "Archiving network inventory baselines for quarterly compliance audits.",
                "Migrating NetSentinel configurations between servers with a single file transfer.",
              ],
              troubleshootingAndRemediation:
                "To restore a backup: Stop the dev server, replace `netsentinel.db` with the chosen archive, and restart the server.",
            },
          },
        ],
      },
      {
        id: "logs-telemetry",
        number: "12",
        title: "Real-Time System & Debugging Logs Console",
        badge: "Observability & Audit",
        icon: Bug,
        summary: "Dual-layer in-memory ring buffer (2,500 entries) + SQLite WAL persistence store, severity filtering (DEBUG, INFO, WARN, ERROR), JSON payload inspector, and stack tracebacks.",
        targetDeckTab: "logs",
        features: [
          {
            id: "feat-telemetry-bus",
            name: "Dual-Layer Telemetry Bus (In-Memory Ring Buffer + SQLite WAL)",
            layerBadge: "Observability / Storage",
            protocolBadge: "Circular Ring Buffer / SQLite WAL",
            definition:
              "A hybrid logging architecture that unifies a high-throughput in-memory circular ring buffer (up to 2,500 active events) with persistent SQLite `system_logs` storage to enable real-time live streaming with zero disk I/O bottlenecks.",
            technicalDescription: {
              overview:
                "Network monitoring engines generate thousands of rapid socket and packet events. Writing every debug packet synchronously to disk causes severe latency. NetSentinel implements a dual-layer logging bus: Node.js buffers recent events in an in-memory ring buffer for millisecond streaming to browser viewports. Concurrently, events are committed asynchronously in micro-batches to the indexed `system_logs` SQLite table with millisecond UTC timestamps, severity levels, subsystem categories, and stack tracebacks.",
              architectureAndFlow: [
                "Subsystems emit log entries via `logger.py` or Express logging middleware.",
                "Ring buffer ingests event; pushes update to connected client Server-Sent Events (SSE) streams.",
                "SQLite commits event with indexed fields: `timestamp`, `level`, `category`, `message`, `details` (JSON), and `traceback`.",
                "Console UI provides auto-scrolling, live stream pause/resume, and real-time level counters.",
              ],
              technicalParameters: [
                { name: "Ring Buffer Capacity", type: "Integer (2,500 entries)", description: "Maximum in-memory events retained for zero-latency live streaming." },
                { name: "Severity Levels", type: "Enum ('DEBUG', 'INFO', 'WARN', 'ERROR')", description: "Event classification hierarchy." },
                { name: "Subsystem Categories", type: "Enum (Network Scan, Port Scan, Wi-Fi, Surveillance, Security, Daemon, System)", description: "Modular subsystem source." },
              ],
              algorithmsAndProtocols:
                "Circular array ring buffer with FIFO eviction, indexed SQLite WAL logging.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Provides security and network engineers with complete forensic transparency into every internal socket operation, packet drop, and authentication handshake.",
              stepByStepProcedure: [
                "Click on the 'System & Debug Logs' tab in the navigation bar.",
                "Observe the live event stream rendering in real time.",
                "Use the severity filter buttons (`DEBUG`, `INFO`, `WARN`, `ERROR`) to isolate specific event types.",
                "Click any log entry to open the Deep Inspector Drawer and inspect raw JSON payloads, target IPs, and execution arguments.",
              ],
              practicalUseCases: [
                "Debugging dropped socket connections or port scan timeouts.",
                "Investigating RTSP handshake errors when connecting to surveillance cameras.",
                "Exporting formatted `.log` or structured `.json` audit trails for compliance verification.",
              ],
              troubleshootingAndRemediation:
                "If log volume is overwhelming: Click the 'Pause Stream' toggle in the log header to freeze auto-scrolling while analyzing a specific event.",
            },
          },
        ],
      },
      {
        id: "installers-devops",
        number: "13",
        title: "Cross-Platform Conda & Windows 11 Automated Installer",
        badge: "Deployment & Packaging",
        icon: Download,
        summary: "Automated Windows 11 one-click installer (.bat + .ps1), desktop shortcut and firewall configuration, POSIX setup_conda.sh, and full application compilation.",
        targetDeckTab: "docs",
        features: [
          {
            id: "feat-win11-installer-suite",
            name: "Windows 11 Automated Installer & UAC-Elevating Launcher",
            layerBadge: "Operating System Deployment",
            protocolBadge: "Batch / PowerShell / Windows Defender",
            definition:
              "An automated, self-contained deployment suite that validates 64-bit Windows 11 architecture, silently installs Miniconda into user profiles, provisions an isolated Conda environment (Python 3.11 + Node.js 20), creates Desktop and Start Menu shortcuts, and opens port 3000 in Windows Defender Firewall.",
            technicalDescription: {
              overview:
                "Packaging distributed as `NetSentinel-Windows11-Setup.zip` containing `install-windows11.bat`, `install.ps1`, `start.bat`, and `environment.yml`. The batch launcher interrogates `net session` to detect UAC administrative rights, automatically prompting for elevation if needed. `install.ps1` executes non-interactive Miniconda installation, registers the conda hook in PowerShell, creates the `netsentinel` environment, builds the Vite production bundle, creates a WScript Desktop shortcut named 'NetSentinel Security', and registers an inbound Windows Defender Firewall rule (`netsh advfirewall firewall add rule name=\"NetSentinel Port 3000\" dir=in action=allow protocol=TCP localport=3000`).",
              architectureAndFlow: [
                "Operator downloads `NetSentinel-Windows11-Setup.zip` from `/api/installer/windows11/zip` or launches via PowerShell one-liner.",
                "`install-windows11.bat` verifies administrative privileges and delegates to `install.ps1`.",
                "Miniconda installer is verified, downloaded, and silently executed (`/InstallationType=JustMe /RegisterPython=0 /S /D=%USERPROFILE%\\miniconda3`).",
                "Conda environment `netsentinel` is provisioned with Python 3.11, Scapy, Rich, and Node.js.",
                "Firewall rule and Windows Desktop shortcuts are registered.",
                "Operator launches `start.bat` to boot both Python backend and Node.js frontend on port 3000.",
              ],
              technicalParameters: [
                { name: "Target Platform", type: "Microsoft Windows 11 64-bit", description: "Supported host operating system." },
                { name: "Conda Environment", type: "Isolated Environment ('netsentinel')", description: "Independent Python 3.11 + Node.js 20 runtime." },
                { name: "Firewall Rule", type: "TCP Port 3000 Inbound", description: "Windows Defender inbound rule allowing LAN access." },
              ],
              algorithmsAndProtocols:
                "Windows Script Host (WScript.Shell) shortcut automation, Windows Defender Advanced Firewall netsh API, PowerShell 7 ExecutionPolicy bypass.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Eliminates dependency conflicts, missing C++ compilers, and manual firewall configurations on Windows 11 enterprise endpoints.",
              stepByStepProcedure: [
                "In the web console, click 'Guided Setup' or 'Download Windows 11 Setup.zip'.",
                "Extract the zip file to your preferred directory (e.g. `C:\\Tools\\NetSentinel`).",
                "Right-click `install-windows11.bat` and select 'Run as administrator'.",
                "Allow the installer to complete silent provisioning (approximately 2 minutes).",
                "Double-click the new 'NetSentinel Security' shortcut on your Desktop to launch.",
              ],
              practicalUseCases: [
                "Deploying NetSentinel to corporate Windows 11 security laptops for field audits.",
                "Automating non-interactive installations via Microsoft Intune or Group Policy Objects (GPO).",
                "Executing instant terminal installations using the PowerShell one-liner: `irm http://<host>:3000/api/installer/windows11/script | iex`.",
              ],
              troubleshootingAndRemediation:
                "If PowerShell blocks script execution: The batch launcher automatically passes `-ExecutionPolicy Bypass`; if running manually, open PowerShell as Administrator and run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`.",
            },
          },
          {
            id: "feat-posix-compile-scripts",
            name: "POSIX Conda Provisioner & Full Application Compiler",
            layerBadge: "Linux / macOS Build Systems",
            protocolBadge: "Bash / Conda / Vite",
            definition:
              "Cross-platform POSIX automation scripts (`setup_conda.sh` and `compile_app.sh`) that bootstrap Miniconda, install native Linux/macOS socket dependencies, initialize database schemas, and compile strict TypeScript/Vite production bundles.",
            technicalDescription: {
              overview:
                "`setup_conda.sh` inspects the host kernel (`uname -s`) and CPU architecture (`x86_64` vs `arm64`/`aarch64`), downloads the appropriate Miniconda shell installer, initializes the conda base environment, and resolves all system libraries (libpcap-dev, python3-dev). `compile_app.sh` executes a 4-point verification pipeline: 1) Python module compilation check via `python3 -m py_compile`; 2) SQLite database schema initialization; 3) TypeScript strict compiler check (`tsc --noEmit`); 4) Production frontend minification and bundling via Vite into `./dist`.",
              architectureAndFlow: [
                "User runs `./setup_conda.sh` to initialize the environment.",
                "User runs `./compile_app.sh` to verify compilation integrity.",
                "Compiler outputs color-coded terminal confirmation indicating 100% build pass.",
              ],
              technicalParameters: [
                { name: "Supported Architectures", type: "x86_64, aarch64 (Apple Silicon M1-M4 & ARM Linux)", description: "Hardware CPU target architectures." },
                { name: "Build Output", type: "Optimized SPA in `./dist`", description: "Static HTML, JS, and CSS bundles." },
              ],
              algorithmsAndProtocols:
                "POSIX shell scripting, Conda environment resolution, Vite Rollup bundling.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Ensures software supply chain reproducibility and builds guaranteed, zero-warning production releases on Linux servers and macOS workstations.",
              stepByStepProcedure: [
                "Clone or copy NetSentinel repository to Linux/macOS host.",
                "Make scripts executable: `chmod +x setup_conda.sh compile_app.sh`.",
                "Run `./setup_conda.sh` to configure the environment.",
                "Run `./compile_app.sh` to compile production assets.",
                "Launch the app using `npm run dev` or `python3 cli.py`.",
              ],
              practicalUseCases: [
                "Deploying NetSentinel to Ubuntu/Debian/Arch Linux network monitoring servers.",
                "Running audits from Apple Silicon MacBooks.",
                "Validating CI/CD build pipelines before releasing new features.",
              ],
              troubleshootingAndRemediation:
                "If `tsc --noEmit` fails: Review the specific TypeScript line errors printed to stdout; ensure all imports have corresponding `@types` packages.",
            },
          },
        ],
      },
      {
        id: "wol-power",
        number: "14",
        title: "Wake-on-LAN (WoL) Remote Power Management",
        badge: "Hardware Power Control",
        icon: Zap,
        summary: "RFC-compliant 102-byte UDP Magic Packet broadcast engine waking sleep-state machines across local broadcast domains.",
        targetDeckTab: "devices",
        features: [
          {
            id: "feat-wol-magic-packet",
            name: "Wake-on-LAN (WoL) Magic Packet Broadcast Engine",
            layerBadge: "Data Link / Transport (L2/L4)",
            protocolBadge: "WoL / UDP Port 7/9 / Magic Packet",
            definition:
              "A remote hardware power management utility that constructs and broadcasts an RFC-compliant 102-byte UDP Magic Packet containing a synchronization preamble and 16 repetitions of a target machine's 48-bit MAC address to power on sleeping endpoints.",
            technicalDescription: {
              overview:
                "When a computer enters sleep or hibernation (ACPI states S3, S4, or S5 with WoL enabled), its network interface controller (NIC) remains in low-power standby mode listening for specific broadcast frames. NetSentinel constructs an exact 102-byte Magic Packet: 6 bytes of synchronization sequence (`0xFF 0xFF 0xFF 0xFF 0xFF 0xFF`) followed immediately by 16 repetitions of the target's 6-byte MAC address (`16 x 6 = 96 bytes`; `6 + 96 = 102 bytes`). The packet is broadcast via UDP socket to destination port 9 (Discard) and port 7 (Echo) across the local broadcast domain (`255.255.255.255`).",
              architectureAndFlow: [
                "Operator selects an offline device in the inventory and clicks 'Wake on LAN'.",
                "Client triggers `POST /api/wol` with `{ mac: '44:19:B6:81:92:40' }`.",
                "Python socket constructs 102-byte payload via `b'\\xff' * 6 + (binascii.unhexlify(clean_mac)) * 16`.",
                "Enables socket broadcast flag (`SO_BROADCAST = 1`) and sends packet to `<broadcast_ip>:9` and `<broadcast_ip>:7`.",
                "Target NIC recognizes its MAC signature and triggers motherboards ACPI power-on signal.",
              ],
              technicalParameters: [
                { name: "Target MAC Address", type: "48-bit MAC Hex String", description: "Hardware address of the sleeping machine." },
                { name: "Broadcast Destination", type: "Subnet Broadcast (e.g. 192.168.1.255:9)", description: "Layer-3 broadcast address for frame delivery." },
                { name: "Magic Packet Size", type: "Exactly 102 Bytes", description: "Standard RFC WoL binary frame payload." },
              ],
              algorithmsAndProtocols:
                "AMD / HP Wake-on-LAN standard specification, raw binary packing, UDP broadcast socket protocol.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Permits system administrators to remotely power on dormant backup servers, workstations, and laboratory machines without physically visiting server rooms or desks.",
              stepByStepProcedure: [
                "Navigate to the 'Device Inventory' deck.",
                "Locate an offline workstation or server you wish to wake up.",
                "Click on the device row to open the Device Details modal.",
                "Click the orange 'Send Wake-on-LAN Packet' button.",
                "A confirmation toast confirms Magic Packet dispatch; observe the target machine booting within 10-30 seconds.",
              ],
              practicalUseCases: [
                "Powering on offline backup storage servers before scheduled nightly replication jobs.",
                "Waking employee office workstations remotely for after-hours software patching.",
                "Conserving facility electricity by keeping lab computers asleep until remotely triggered.",
              ],
              troubleshootingAndRemediation:
                "If the target does not wake: 1) Verify that 'Wake-on-LAN' or 'Power On By PCI-E Device' is enabled in the target motherboard's BIOS/UEFI settings; 2) Ensure the operating system network card driver properties have 'Allow this device to wake the computer' checked; 3) Confirm the target is connected via wired Ethernet (Wi-Fi WoL requires specialized Wake-on-WLAN hardware).",
            },
          },
        ],
      },
      {
        id: "speedtest-quality",
        number: "15",
        title: "Network Bandwidth & Quality Benchmarking",
        badge: "Throughput & Latency",
        icon: Gauge,
        summary: "Multi-stream TCP/HTTP speedtest engine measuring downlink bandwidth, uplink throughput, unloaded ping latency, and bufferbloat jitter.",
        targetDeckTab: "tools",
        features: [
          {
            id: "feat-speedtest-engine",
            name: "Multi-Stream Network Quality & Bandwidth Benchmark",
            layerBadge: "Transport / Application (L4/L7)",
            protocolBadge: "HTTP Chunking / TCP Socket Benchmark",
            definition:
              "A high-precision network benchmarking engine measuring downlink bandwidth (Mbps), uplink throughput (Mbps), idle round-trip latency (ms), and loaded bufferbloat jitter by executing chunked multi-stream data transfers against calibrated endpoints.",
            technicalDescription: {
              overview:
                "Wraps `speedtest-cli` with fallback to native chunked HTTP/socket benchmark sockets. The engine executes three distinct phases: 1) Latency & Jitter phase (sending rapid ICMP/HTTP ping bursts to calculate unloaded base latency); 2) Downlink Throughput phase (initiating parallel TCP socket streams fetching multi-megabyte binary chunks over 10 seconds to saturate download bandwidth); 3) Uplink Throughput phase (streaming random byte streams outbound to evaluate upload speed). Results are stored in SQLite `speed_tests` with ISP name, client public IP, and server geolocation.",
              architectureAndFlow: [
                "Client issues `POST /api/speedtest`.",
                "Backend selects nearest high-bandwidth test node.",
                "Measures ping latency (ms) and jitter standard deviation.",
                "Streams download chunks; calculates `Megabits / second = (Bytes_received * 8) / (Elapsed_seconds * 1,000,000)`.",
                "Streams upload chunks; calculates uplink Mbps.",
                "Persists record into `speed_tests` and returns complete JSON metrics.",
              ],
              technicalParameters: [
                { name: "Download Throughput", type: "Megabits per Second (Float)", description: "Peak sustained downlink bandwidth." },
                { name: "Upload Throughput", type: "Megabits per Second (Float)", description: "Peak sustained uplink bandwidth." },
                { name: "Base Latency", type: "Milliseconds (Float)", description: "Unloaded round-trip transit time to test server." },
                { name: "ISP & Public IP", type: "String", description: "Resolved carrier provider name and public WAN address." },
              ],
              algorithmsAndProtocols:
                "Multi-stream parallel TCP socket streaming, chunked HTTP transfer encoding, rolling bandwidth moving average calculation.",
              progressMeterBehavior:
                "HUD progress bar cycles through: 0-25% (Latency Probing) -> 25-60% (Download Saturation) -> 60-95% (Upload Saturation) -> 100% (Metric Persistence).",
            },
            operationalUse: {
              threatModelAndUtility:
                "Validates ISP service level agreements (SLAs), detects bandwidth throttling, and diagnoses bufferbloat latency spikes causing VoIP drops.",
              stepByStepProcedure: [
                "Navigate to 'Network Tools' and select the 'Speed Test' tab.",
                "Click the blue 'Run Speed Benchmark' button.",
                "Observe the animated speedometer gauges displaying live download and upload transfer rates.",
                "Review the final report showing Download Mbps, Upload Mbps, Ping ms, Client Public IP, and ISP Name.",
              ],
              practicalUseCases: [
                "Verifying whether your internet service provider delivers the advertised gigabit or fiber speeds.",
                "Testing Wi-Fi throughput degradation at various physical distances from the access point.",
                "Auditing WAN uplink bandwidth before streaming high-definition surveillance video off-site.",
              ],
              troubleshootingAndRemediation:
                "If speeds are significantly lower than expected: 1) Check the Wi-Fi Spectrum tab for co-channel interference; 2) Ensure no background file downloads or torrent clients are running on peer machines; 3) Test directly over a Cat6 Ethernet cable to rule out Wi-Fi attenuation.",
            },
          },
        ],
      },
      {
        id: "nrc-canvas",
        number: "16",
        title: "Network Relationship Canvas (NRC) & Zero Trust Intent Engine",
        badge: "Zero Trust Architecture (ZTA)",
        icon: Share2,
        summary: "Visual diagram-driven network security subsystem where the topology diagram itself is the authoritative source of truth, enforcing strict Default Deny and translating intent directly into native firewall rules across Windows, Linux, and BSD/macOS.",
        targetDeckTab: "canvas",
        features: [
          {
            id: "feat-nrc-diagram-engine",
            name: "Visual Network Relationship Intent Engine & Authoritative Graph",
            layerBadge: "Zero Trust Intent / Layer 3-7",
            protocolBadge: "NRC Graph / Default Deny",
            definition:
              "A diagram-centric network policy subsystem that exposes Network Intent rather than low-level implementation details (ACLs, NAT, rule chains). The diagram itself is the authoritative source of truth: any communication not explicitly represented by an edge on the canvas is denied by default.",
            technicalDescription: {
              overview:
                "Unlike traditional firewalls that expose complex rule tables and ACL orders, the Network Relationship Canvas renders nodes (Managed Devices 🟢, Unmanaged Devices 🔴, Warnings 🟡, Offline ⚪, Threat Detected 🚨) and directional relationship edges. Relationships dictate policy: One-Way (A ──443──> B), One-Way Multi-Port (A ──80,443──> B), Bidirectional Trust (A <====80====> B), and Reverse (A <──21──── B). Dynamic transport negotiation is documented using property brackets [1024-65535] without adding confusing line styles.",
              architectureAndFlow: [
                "Operator drags managed devices, unmanaged devices, groups, subnets, internet, external services, or applications onto the canvas viewport.",
                "Connections drawn between nodes create first-class relationship entities stored in SQLite table `canvas_relationships`.",
                "Properties drawer permits configuring Allowed Ports, Protocol (TCP/UDP/ICMP/ANY), Stateful inspection, Logging, IDS/IPS, and Schedules.",
                "Absence of an edge triggers automatic Default Deny across all managed endpoints.",
                "Real-time animation particles visualize traffic states: Green (Expected), Yellow (High Traffic), Orange (New Communication), Red (Threat Detected), Gray (Inactive).",
              ],
              technicalParameters: [
                { name: "Source & Target Node ID", type: "UUID String", description: "The origin and destination endpoints governed by the relationship." },
                { name: "Direction Mode", type: "Enum ('one_way', 'bidirectional', 'reverse')", description: "Traffic initiation allowance." },
                { name: "Allowed Ports", type: "Array of Strings/Integers", description: "Target ports explicitly opened (e.g. 443, 80, 22)." },
                { name: "Triggered Ports Notation", type: "String Bracket Range (e.g. [1024-65535])", description: "Informational documentation of dynamic/ephemeral negotiation." },
                { name: "Security Controls", type: "Boolean Flags (Stateful, Logging, IDS)", description: "State tracking, security auditing, and intrusion detection enforcement." },
              ],
              algorithmsAndProtocols:
                "Graph-based policy compiler evaluating transitive group memberships, CIDR overlaps, and stateful rule generation. Directed graph traversal checks topological reachability.",
              progressMeterBehavior:
                "Displays real-time compilation and dispatch meters during policy enforcement and compliance reconciliation.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Eliminates misconfigurations, hidden shadow rules, and privilege creep by making the entire security posture readable in 10 seconds by non-network engineers and CISOs alike.",
              stepByStepProcedure: [
                "Open the 'Relationship Canvas (NRC)' tab from the Command Center sidebar.",
                "Drag endpoints or groups from the Asset Catalog onto the interactive grid.",
                "Hover over a node and drag the connection handle to a destination node to establish a relationship.",
                "Click the relationship badge to open the Properties Panel and adjust ports, protocol, or stateful toggles.",
                "Click 'Apply Intent' to commit changes to the authoritative topology database.",
              ],
              practicalUseCases: [
                "Enforcing microsegmentation between employee workstations and production database clusters.",
                "Isolating rogue or unmanaged IoT cameras so they cannot initiate traffic into internal subnets.",
                "Auditing compliance before regulatory SOC2, PCI-DSS, or ISO 27001 inspections.",
              ],
              troubleshootingAndRemediation:
                "If an authorized flow is blocked: Verify that a directional edge exists connecting the source to the destination node. Remember that absence of an edge defaults to strict DENY.",
            },
          },
          {
            id: "feat-nrc-agent-fleet",
            name: "Outbound-Only NetSentinel Managed Endpoint Daemon",
            layerBadge: "Endpoint Security / L3-L7",
            protocolBadge: "Python Daemon / WebSocket / HTTP REST",
            definition:
              "A lightweight background daemon (`netsentinel-agent.py`) installed on Windows, Linux, and macOS endpoints that communicates outbound only to the NetSentinel server, queries local socket listeners, applies compiled firewall directives, and reports compliance telemetry.",
            technicalDescription: {
              overview:
                "Functions 100% behind NAT and corporate firewalls without requiring inbound ports. The agent polls `/api/agent/telemetry` or maintains an outbound WebSocket session, reporting active socket listeners (`netstat`/`ss`/`lsof`), active firewall state, OS version, and compliance posture. When policy updates occur, the agent receives native commands and enforces them locally.",
              architectureAndFlow: [
                "Agent starts as a Windows Service, systemd daemon, or launchd job.",
                "Dispatches outbound POST heartbeat with hostname, local IP, OS, active listening ports, and running process names.",
                "Compares local listening sockets against authoritative canvas policies to detect rogue open ports.",
                "Receives compiled firewall directives from the server translation layer and invokes native OS commands.",
                "Reports execution status and compliance score back to the NetSentinel server.",
              ],
              technicalParameters: [
                { name: "Heartbeat Interval", type: "Seconds (Default: 10s)", description: "Outbound polling frequency for health and policy updates." },
                { name: "Platform Drivers", type: "Windows Defender, nftables, iptables, ufw, pf", description: "Native firewall subsystem invoked by the daemon." },
                { name: "NAT Traversal Mode", type: "Outbound-Only TCP/TLS", description: "Guarantees operation behind symmetric or full-cone NAT." },
              ],
              algorithmsAndProtocols:
                "Cross-platform socket enumeration using `psutil` or `ss -tulpn` / `netstat -ano`, platform detection via `platform.system()`, secure outbound REST transport.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Prevents endpoint compromise from persisting unnoticed by continuously reporting listening sockets and enforcing authoritative canvas rules locally on the endpoint.",
              stepByStepProcedure: [
                "Click 'Agents' in the Canvas header to open the Agent Deployment modal.",
                "Select target OS (Windows 11, Linux, or macOS).",
                "Copy the one-line installation command and execute it in PowerShell (Admin) or bash (sudo).",
                "Observe the endpoint appear as Managed (🟢 Green) on the canvas with active listening ports tracked.",
              ],
              practicalUseCases: [
                "Managing developer laptops running Windows 11, Ubuntu, and macOS in hybrid enterprise environments.",
                "Ensuring remote workers behind home NAT routers comply with zero trust network policies.",
                "Detecting unauthorized listening ports opened by developers or rogue background services.",
              ],
              troubleshootingAndRemediation:
                "If an agent shows offline: 1) Verify the endpoint has outbound HTTP/HTTPS access to the NetSentinel server; 2) Check agent logs for socket permission errors; 3) Re-run the install command to restart the service.",
            },
          },
          {
            id: "feat-nrc-translation-layer",
            name: "Multi-Platform Firewall Translation Layer (IFirewallProvider)",
            layerBadge: "Firewall Abstraction / L3-L4",
            protocolBadge: "TypeScript IFirewallProvider / netsh / nftables / iptables / ufw / pf",
            definition:
              "An abstracted firewall translation subsystem that compiles high-level canvas relationships and Zero Trust intent into syntactically valid, native firewall rules for Windows Defender Firewall (`netsh`), Linux `nftables`, `iptables`, `ufw`, and BSD/macOS `pf`.",
            technicalDescription: {
              overview:
                "Abstracted via TypeScript `IFirewallProvider` interface with methods `getRules()`, `addRule()`, `removeRule()`, `enableRule()`, and `disableRule()`. Translates high-level visual graph relationships into exact native firewall syntax. Handles stateful packet returns (`ct state established,related accept`), multiport bundling, and bidirectional trust rule generation (2 native rules per trust edge).",
              architectureAndFlow: [
                "Canvas compiler traverses active relationships in the database.",
                "Instantiates target provider (e.g. `WindowsFirewallProvider`, `NftablesProvider`, `PfProvider`).",
                "Applies Default Deny baseline: drops all unrepresented inbound and outbound traffic.",
                "Iterates over canvas edges: generates allow rules matching source IP, destination IP, protocol, and ports.",
                "Exports production-ready `.bat`, `.sh`, or `.conf` scripts or dispatches directives directly to agents.",
              ],
              technicalParameters: [
                { name: "Target Driver", type: "Enum ('windows_firewall', 'nftables', 'iptables', 'ufw', 'pf')", description: "Underlying firewall engine." },
                { name: "Stateful Tracking", type: "Boolean (Default: true)", description: "Permits established/related return packets automatically." },
                { name: "Logging Level", type: "Boolean (Default: true)", description: "Logs dropped and permitted packets to system security log." },
              ],
              algorithmsAndProtocols:
                "Template-driven AST translation converting graph edges (source, destination, ports, protocol) into platform-specific configuration commands.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Eliminates vendor lock-in and syntax errors when managing heterogeneous multi-OS environments. Administrators manage one diagram; the translation layer generates the exact firewall code for every host.",
              stepByStepProcedure: [
                "Click 'Export Rules' in the Canvas header.",
                "Select desired platform (Windows Firewall, nftables, iptables, UFW, pf).",
                "Review the compiled script with syntax highlighting.",
                "Click 'Copy Script' or 'Download File' to deploy to firewalls or routers.",
              ],
              practicalUseCases: [
                "Generating Windows Defender Firewall Group Policy batch scripts for Windows 11 fleets.",
                "Deploying `/etc/nftables.conf` configurations to Debian/Ubuntu edge servers.",
                "Configuring pfSense / OPNsense / macOS `pf.conf` packet filters.",
              ],
              troubleshootingAndRemediation:
                "If rule fails to apply on Linux: Ensure `nftables` service is installed and enabled (`sudo systemctl enable --now nftables`).",
            },
          },
          {
            id: "feat-nrc-ai-policy",
            name: "AI-Assisted Natural Language Policy Synthesis Engine",
            layerBadge: "AI Intent Engine / L7",
            protocolBadge: "NLP Intent Parsing / Semantic Rule Mapping",
            definition:
              "An intelligent natural-language policy creation assistant that parses conversational administrator commands (e.g., 'Allow workstations to access web servers on HTTPS only') and automatically synthesizes authoritative canvas relationships with confidence ratings.",
            technicalDescription: {
              overview:
                "Analyzes user natural language intent queries against active canvas node labels and group inventories. Maps colloquial terms (e.g., 'HTTPS' -> 443 TCP, 'SSH' -> 22 TCP, 'DNS' -> 53 UDP, 'Web servers' -> matching target nodes) and proposes validated relationships with confidence ratings and reasoning notes.",
              architectureAndFlow: [
                "Administrator enters a command in the AI Intent bar: 'Developers need SSH access to all Linux servers'.",
                "Client issues `POST /api/canvas/ai-policy` with query and current node/group context.",
                "Backend `AIPolicyAssistant` extracts source intent ('Developers'), destination intent ('Linux servers'), protocol ('TCP'), and port ('22').",
                "Generates explanation notes, confidence score, and proposal object.",
                "Canvas automatically places or highlights the relationship edge with dynamic bracket notation if requested.",
              ],
              technicalParameters: [
                { name: "Intent Prompt", type: "Natural Language String", description: "Conversational security policy requirement." },
                { name: "Node Context", type: "Array of Canvas Nodes & Groups", description: "Active entities available on the canvas for semantic binding." },
                { name: "Confidence Score", type: "Float (0.0 to 1.0)", description: "Semantic alignment certainty." },
              ],
              algorithmsAndProtocols:
                "Regex semantic entity extractors, well-known port mapping dictionaries, and AI grounding against current network topology.",
            },
            operationalUse: {
              threatModelAndUtility:
                "Drastically speeds up policy authoring while preventing port mistakes or typos that could leave sensitive ports exposed.",
              stepByStepProcedure: [
                "Click the purple 'AI Intent' button in the Canvas header.",
                "Type your policy requirement (or click one of the quick example chips).",
                "Click 'Synthesize'.",
                "Review the generated proposal, confidence score, and AI notes in the Properties Drawer.",
                "Click 'Apply Intent' to commit to the canvas.",
              ],
              practicalUseCases: [
                "Rapidly configuring new environment access rules during incident response.",
                "Allowing junior sysadmins to describe security intent without having to memorize port numbers.",
                "Validating complex multi-tier application connection requirements.",
              ],
              troubleshootingAndRemediation:
                "If AI reports matching nodes missing: Ensure that the referenced devices or groups exist on the canvas with matching names or group tags.",
            },
          },
        ],
      },
    ],
    []
  );

  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return chapters;
    const query = searchQuery.toLowerCase();
    return chapters.filter(
      (ch) =>
        ch.title.toLowerCase().includes(query) ||
        ch.summary.toLowerCase().includes(query) ||
        ch.badge.toLowerCase().includes(query) ||
        ch.features.some(
          (f) =>
            f.name.toLowerCase().includes(query) ||
            f.definition.toLowerCase().includes(query) ||
            f.technicalDescription.overview.toLowerCase().includes(query) ||
            f.operationalUse.threatModelAndUtility.toLowerCase().includes(query)
        )
    );
  }, [chapters, searchQuery]);

  const activeChapter = useMemo(
    () => chapters.find((c) => c.id === activeChapterId) || chapters[0],
    [chapters, activeChapterId]
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-500/30">
                Official Carrier-Grade User Manual & Engineering Specifications
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-500/30 font-bold">
                Exhaustive Technical Reference
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1.5 flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-cyan-400" />
              NetSentinel System Documentation
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Every system capability, protocol, and diagnostic tool is formally <strong className="text-cyan-300">Defined</strong>, deeply <strong className="text-purple-300">Described</strong> with architectural schemas, and exhaustively <strong className="text-emerald-300">Explained</strong> with step-by-step procedures for operational use.
            </p>
          </div>

          <div className="relative w-full lg:w-80 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search features, RFCs, protocols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* 2-Column Documentation Deck: Chapter Navigator + Detailed Manual Reader */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chapter Table of Contents Navigator */}
          <div className="lg:col-span-4 space-y-1.5 max-h-[820px] overflow-y-auto pr-1 custom-scrollbar">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block px-2 mb-2">
              System Chapters ({filteredChapters.length})
            </span>

            {filteredChapters.map((ch) => {
              const IconComp = ch.icon;
              const isActive = ch.id === activeChapter.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    setActiveChapterId(ch.id);
                    setActiveFeatureId(null);
                  }}
                  className={`w-full text-left p-3 rounded-lg text-xs transition-all flex items-start gap-3 border ${
                    isActive
                      ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-100 shadow-sm ring-1 ring-cyan-500/20"
                      : "bg-slate-900/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <span className="font-mono text-[10px] text-cyan-400 font-bold mt-0.5 shrink-0 px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800">
                    {ch.number}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold truncate">{ch.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {ch.summary}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-mono">
                      <span>{ch.features.length} Features Documented</span>
                      <span>•</span>
                      <span className="text-cyan-300">{ch.badge}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Chapter Content Viewer */}
          <div className="lg:col-span-8 bg-slate-950/80 border border-slate-800 rounded-xl p-6 min-h-[600px] space-y-6">
            {/* Chapter Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <activeChapter.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    Chapter {activeChapter.number} • {activeChapter.badge}
                  </div>
                  <h2 className="text-lg font-bold text-white mt-0.5">{activeChapter.title}</h2>
                </div>
              </div>

              {activeChapter.targetDeckTab && onNavigateTab && (
                <button
                  onClick={() => onNavigateTab(activeChapter.targetDeckTab!)}
                  className="text-xs font-bold font-mono text-cyan-300 hover:text-white bg-slate-900 hover:bg-cyan-950/50 px-3 py-1.5 rounded-lg border border-cyan-500/30 flex items-center gap-1.5 self-start sm:self-auto transition-colors"
                >
                  <span>Open Interactive Deck</span>
                  <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3.5 rounded-lg border border-slate-800/80">
              {activeChapter.summary}
            </p>

            {/* Render Every Feature in Chapter with Define, Describe, and Explain/Use */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Detailed Feature Specifications ({activeChapter.features.length})
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  Format: [Define] • [Describe] • [Explain & Use]
                </span>
              </div>

              {activeChapter.features.map((feature, fIdx) => {
                const isExpanded =
                  expandedSections[feature.id] === undefined
                    ? true
                    : expandedSections[feature.id];

                return (
                  <div
                    key={feature.id}
                    id={feature.id}
                    className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-sm hover:border-slate-700 transition-all"
                  >
                    {/* Feature Card Header */}
                    <div
                      onClick={() => toggleSection(feature.id)}
                      className="p-4 bg-slate-900/80 flex items-center justify-between gap-3 cursor-pointer select-none border-b border-slate-800/60"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30">
                          {activeChapter.number}.{fIdx + 1}
                        </span>
                        <h3 className="text-sm font-bold text-white truncate">{feature.name}</h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-purple-300 border border-purple-500/30 hidden sm:inline-block">
                          {feature.protocolBadge}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-cyan-500/30 hidden md:inline-block">
                          {feature.layerBadge}
                        </span>
                        <button className="text-slate-400 hover:text-white p-1">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-5 space-y-5 text-xs leading-relaxed">
                        {/* 1. DEFINE */}
                        <div className="space-y-1.5 bg-cyan-950/15 border border-cyan-500/25 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-[11px] uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                            1. Define (Formal Technical Definition)
                          </div>
                          <p className="text-slate-200 text-xs leading-relaxed font-sans pl-3 border-l-2 border-cyan-400">
                            {feature.definition}
                          </p>
                        </div>

                        {/* 2. DESCRIBE */}
                        <div className="space-y-3 bg-purple-950/15 border border-purple-500/25 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-purple-400 font-mono font-bold text-[11px] uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                            2. Describe (Architecture, Mechanics & Parameters)
                          </div>
                          <p className="text-slate-300 text-xs leading-relaxed pl-3 border-l-2 border-purple-400">
                            {feature.technicalDescription.overview}
                          </p>

                          {feature.technicalDescription.architectureAndFlow.length > 0 && (
                            <div className="space-y-1.5 pt-2 pl-3">
                              <span className="text-[11px] font-semibold text-purple-300 font-mono block">
                                Architectural Data Flow & State Mechanics:
                              </span>
                              <ul className="list-disc pl-5 space-y-1 text-slate-300 text-[11px]">
                                {feature.technicalDescription.architectureAndFlow.map((step, sIdx) => (
                                  <li key={sIdx}>{step}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {feature.technicalDescription.technicalParameters.length > 0 && (
                            <div className="pt-2 pl-3">
                              <span className="text-[11px] font-semibold text-purple-300 font-mono block mb-1.5">
                                Technical Parameters & Schema Attributes:
                              </span>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-[11px] border-collapse">
                                  <thead>
                                    <tr className="border-b border-purple-500/20 text-purple-300 font-mono text-[10px]">
                                      <th className="py-1 px-2">Parameter</th>
                                      <th className="py-1 px-2">Data Type</th>
                                      <th className="py-1 px-2">Specification</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/60 font-mono">
                                    {feature.technicalDescription.technicalParameters.map((param, pIdx) => (
                                      <tr key={pIdx} className="hover:bg-purple-950/20">
                                        <td className="py-1 px-2 text-white font-bold">{param.name}</td>
                                        <td className="py-1 px-2 text-cyan-300">{param.type}</td>
                                        <td className="py-1 px-2 text-slate-300 font-sans">{param.description}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {feature.technicalDescription.progressMeterBehavior && (
                            <div className="pt-2 pl-3 bg-slate-950/60 p-2.5 rounded border border-purple-500/20">
                              <span className="text-[10px] font-bold text-amber-400 font-mono flex items-center gap-1.5 uppercase">
                                <Gauge className="w-3.5 h-3.5 text-amber-400" /> Real-Time Progress Meter Telemetry:
                              </span>
                              <p className="text-[11px] text-slate-300 mt-0.5">
                                {feature.technicalDescription.progressMeterBehavior}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* 3. EXPLAIN & USE */}
                        <div className="space-y-3 bg-emerald-950/15 border border-emerald-500/25 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-[11px] uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            3. Explain & Use (Threat Models, Workflow & Remediation)
                          </div>
                          
                          <div className="pl-3 border-l-2 border-emerald-400 space-y-1.5">
                            <span className="text-[11px] font-semibold text-emerald-300 font-mono block">
                              Why This Feature Exists & Threat Model Addressed:
                            </span>
                            <p className="text-slate-300 text-xs leading-relaxed">
                              {feature.operationalUse.threatModelAndUtility}
                            </p>
                          </div>

                          <div className="pt-2 pl-3">
                            <span className="text-[11px] font-semibold text-emerald-300 font-mono block mb-1">
                              Step-by-Step Operational Procedure:
                            </span>
                            <ol className="list-decimal pl-5 space-y-1 text-slate-300 text-[11px]">
                              {feature.operationalUse.stepByStepProcedure.map((step, oIdx) => (
                                <li key={oIdx}>{step}</li>
                              ))}
                            </ol>
                          </div>

                          <div className="pt-2 pl-3">
                            <span className="text-[11px] font-semibold text-emerald-300 font-mono block mb-1">
                              Real-World Practical Scenarios:
                            </span>
                            <ul className="list-disc pl-5 space-y-1 text-slate-300 text-[11px]">
                              {feature.operationalUse.practicalUseCases.map((useCase, uIdx) => (
                                <li key={uIdx}>{useCase}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="pt-2 pl-3 bg-slate-950/60 p-2.5 rounded border border-emerald-500/20">
                            <span className="text-[10px] font-bold text-cyan-400 font-mono flex items-center gap-1.5 uppercase">
                              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" /> Troubleshooting & Hardening Advice:
                            </span>
                            <p className="text-[11px] text-slate-300 mt-0.5">
                              {feature.operationalUse.troubleshootingAndRemediation}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
