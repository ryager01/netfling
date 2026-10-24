# NetSentinel Security & Defense Guidelines

## 1. Network Safety & Privilege Architecture

### A. Raw Socket Isolation & Fallbacks
Raw socket creation (`socket(AF_PACKET, SOCK_RAW)`) in Linux requires `CAP_NET_RAW` capabilities or root UID (`uid=0`).
In containerized environments (such as Docker, Kubernetes with strict seccomp profiles, or gVisor virtualization), raw socket syscalls return `[Errno 95] Operation not supported`.

NetSentinel implements safe non-privileged fallbacks:
- If Scapy's raw packet injection fails, standard `connect_ex` socket probes are launched.
- Kernel-managed ARP queries (`/proc/net/arp` and Netlink socket neighbor table) are parsed without requiring raw packet construction.

### B. Safe Service Auditing
- Port scans operate strictly in connect mode (`TCP SYN -> ACK -> FIN/RST`). No aggressive half-open flooding or fragmented teardrop packets are transmitted.
- Sockets use conservative connect timeouts (0.5s – 1.0s) and close sockets immediately upon banner acquisition to prevent denial-of-service against legacy embedded devices or IoT microcontrollers.

### C. Defense Against ARP Cache Poisoning
The background daemon logs the initial MAC address of the default gateway router. If a gratuitous ARP broadcast or network response claims the gateway IP belongs to a different MAC address, the daemon immediately logs a `CRITICAL: GATEWAY_ARP_MISMATCH` alert, warning the network operator of active Man-in-the-Middle (MitM) ARP poisoning attacks.

### D. Data Privacy
Unlike cloud-dependent scanning utilities, NetSentinel stores all inventory data, IP addresses, MAC addresses, and speed tests exclusively on the local host within `netsentinel.db`. No telemetry or device logs leave the local system.
