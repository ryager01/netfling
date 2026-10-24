"""
NetSentinel Remote Access Trojan (RAT), Infostealer & Backdoor Detection Engine.
Provides comprehensive network-wide detection and local host system integrity auditing for:
- Prevalent Commercial & State-Sponsored RATs (DarkComet, njRAT, Quasar, AsyncRAT, Remcos, PoisonIvy, GhostRAT, PlugX, Warzone/AveMaria, NanoCore, Orcus, Bifrost, Turla)
- Infostealers & C2 Loaders (RedLine, Vidar, Raccoon, Agent Tesla, Lumma Stealer, Qakbot, TrickBot, Emotet)
- Adversary C2 Frameworks (Cobalt Strike TeamServer/Beacons, Metasploit/Meterpreter, Mythic, Covenant, Havoc, Sliver, Empire)
- Interactive Backdoors & Sockets (Netcat bind shells, Back Orifice, NetBus, SubSeven, Socat, Tor proxies)
- Local Workstation / Server Host Integrity & Process Forensics (Windows 11 & Linux)
"""

import json
import os
import re
import socket
import ssl
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from .db import DatabaseEngine

KNOWN_RAT_REGISTRY = [
    {
        "port": 1604,
        "name": "DarkComet RAT",
        "category": "Remote Access Trojan",
        "severity": "CRITICAL",
        "mitre_id": "T1219",
        "notes": "DarkComet Trojan C2 listener. Allows keystroke logging, webcam capture, and full system control.",
        "handshake_hint": "dc_v5",
    },
    {
        "port": 1605,
        "name": "DarkComet RAT (Secondary)",
        "category": "Remote Access Trojan",
        "severity": "CRITICAL",
        "mitre_id": "T1219",
        "notes": "Alternate port for DarkComet Trojan C2 communications.",
    },
    {
        "port": 5552,
        "name": "njRAT / Bladabindi",
        "category": "Stealth Infostealer RAT",
        "severity": "CRITICAL",
        "mitre_id": "T1059.001",
        "notes": "njRAT .NET command listener. Highly active in credential theft, keylogging, and surveillance.",
        "handshake_hint": "|'|'",
    },
    {
        "port": 1177,
        "name": "njRAT Alternate",
        "category": "Stealth Infostealer RAT",
        "severity": "CRITICAL",
        "mitre_id": "T1059.001",
        "notes": "Secondary default communication port for Bladabindi / njRAT malware variants.",
        "handshake_hint": "|'|'",
    },
    {
        "port": 4444,
        "name": "Metasploit / Meterpreter Reverse Shell",
        "category": "Exploitation Framework Shell",
        "severity": "CRITICAL",
        "mitre_id": "T1059",
        "notes": "Default reverse TCP shell payload listener. Indicates active host intrusion or exploitation.",
        "handshake_hint": "meterpreter",
    },
    {
        "port": 4445,
        "name": "Metasploit Stage Listener",
        "category": "Exploitation Framework Shell",
        "severity": "CRITICAL",
        "mitre_id": "T1059",
        "notes": "Secondary handler port for staged Meterpreter reverse payloads.",
    },
    {
        "port": 50050,
        "name": "Cobalt Strike TeamServer",
        "category": "Advanced Adversary C2",
        "severity": "CRITICAL",
        "mitre_id": "T1071",
        "notes": "Cobalt Strike Command & Control TeamServer default listener. Advanced adversary tradecraft.",
        "handshake_hint": "cobaltstrike",
    },
    {
        "port": 4782,
        "name": "QuasarRAT C2",
        "category": "Open-Source C# RAT",
        "severity": "CRITICAL",
        "mitre_id": "T1219",
        "notes": "QuasarRAT client control endpoint. Executes shell commands and file exfiltration.",
        "handshake_hint": "quasar",
    },
    {
        "port": 6666,
        "name": "AsyncRAT / Quasar C2",
        "category": "Open-Source C# RAT",
        "severity": "CRITICAL",
        "mitre_id": "T1219",
        "notes": "AsyncRAT encrypted TCP C2 channel for persistence and remote management.",
        "handshake_hint": "asyncrat",
    },
    {
        "port": 7000,
        "name": "AsyncRAT Alternate",
        "category": "Remote Access Trojan",
        "severity": "CRITICAL",
        "mitre_id": "T1219",
        "notes": "Common AsyncRAT server listener port for surveillance and data staging.",
    },
    {
        "port": 5200,
        "name": "Warzone RAT / Ave Maria",
        "category": "Commercial Surveillance RAT",
        "severity": "CRITICAL",
        "mitre_id": "T1056.001",
        "notes": "Warzone RAT (Ave Maria) stealth backdoor listener. Bypasses UAC and extracts browser passwords.",
    },
    {
        "port": 5201,
        "name": "Warzone RAT (Secondary)",
        "category": "Commercial Surveillance RAT",
        "severity": "CRITICAL",
        "mitre_id": "T1056.001",
        "notes": "Alternate port for Warzone RAT payload execution.",
    },
    {
        "port": 8085,
        "name": "RedLine Stealer C2",
        "category": "Credential & Crypto Infostealer",
        "severity": "CRITICAL",
        "mitre_id": "T1555",
        "notes": "RedLine Stealer command & control channel. Steals cryptocurrency wallets, browser cookies, and VPN keys.",
    },
    {
        "port": 9050,
        "name": "RedLine / Tor Proxy Gateway",
        "category": "Anonymized Exfiltration",
        "severity": "HIGH",
        "mitre_id": "T1090.003",
        "notes": "Suspicious Tor SOCKS5 proxy port frequently abused by RedLine/Vidar for beaconing.",
    },
    {
        "port": 2404,
        "name": "Remcos Professional RAT",
        "category": "Commercial Surveillance Tool",
        "severity": "CRITICAL",
        "mitre_id": "T1219",
        "notes": "Remcos surveillance Trojan frequently abused by cybercrime syndicates for persistent network footholds.",
    },
    {
        "port": 37777,
        "name": "Remcos Alternate C2",
        "category": "Commercial Surveillance Tool",
        "severity": "CRITICAL",
        "mitre_id": "T1219",
        "notes": "Alternate default port for Remcos remote surveillance server.",
    },
    {
        "port": 2001,
        "name": "Ghost RAT",
        "category": "State-Sponsored Espionage",
        "severity": "CRITICAL",
        "mitre_id": "T1219",
        "notes": "Ghost RAT APT cyber espionage backdoor signature.",
        "handshake_hint": "Gh0st",
    },
    {
        "port": 2002,
        "name": "Ghost RAT Secondary",
        "category": "State-Sponsored Espionage",
        "severity": "CRITICAL",
        "mitre_id": "T1219",
        "notes": "Alternate Ghost RAT channel port.",
        "handshake_hint": "Gh0st",
    },
    {
        "port": 3460,
        "name": "Poison Ivy RAT",
        "category": "Espionage Trojan",
        "severity": "CRITICAL",
        "mitre_id": "T1219",
        "notes": "Poison Ivy remote access backdoor listener.",
    },
    {
        "port": 6514,
        "name": "NanoCore RAT",
        "category": "Modular Remote Access Trojan",
        "severity": "CRITICAL",
        "mitre_id": "T1219",
        "notes": "NanoCore modular plugin Trojan communication port.",
    },
    {
        "port": 10014,
        "name": "Orcus RAT",
        "category": "Administration & Keylogger RAT",
        "severity": "CRITICAL",
        "mitre_id": "T1056",
        "notes": "Orcus administration Trojan and DDoS bot listener.",
    },
    {
        "port": 3560,
        "name": "XtremeRAT",
        "category": "Advanced Infostealer RAT",
        "severity": "CRITICAL",
        "mitre_id": "T1219",
        "notes": "XtremeRAT default communication port for audio/video spying.",
    },
    {
        "port": 3360,
        "name": "NetWire RAT",
        "category": "Cross-Platform Keylogger & RAT",
        "severity": "CRITICAL",
        "mitre_id": "T1056.001",
        "notes": "NetWire multi-platform RAT channel targeting banking and enterprise systems.",
    },
    {
        "port": 2160,
        "name": "Blackshades RAT",
        "category": "Ransomware & Botnet Trojan",
        "severity": "CRITICAL",
        "mitre_id": "T1219",
        "notes": "Blackshades Trojan listener for webcam hijacks and ransomware deployment.",
    },
    {
        "port": 1980,
        "name": "Bifrost Trojan",
        "category": "Legacy Stealth Backdoor",
        "severity": "HIGH",
        "mitre_id": "T1219",
        "notes": "Bifrost rootkit backdoor listener.",
    },
    {
        "port": 40056,
        "name": "Havoc C2 Demon Listener",
        "category": "Post-Exploitation Framework",
        "severity": "CRITICAL",
        "mitre_id": "T1071",
        "notes": "Havoc C2 modern post-exploitation framework demon handler port.",
    },
    {
        "port": 7443,
        "name": "Mythic C2 Agent Endpoint",
        "category": "Cross-Platform Adversary C2",
        "severity": "CRITICAL",
        "mitre_id": "T1071.001",
        "notes": "Mythic multi-platform C2 server HTTPS communication handler.",
    },
    {
        "port": 8888,
        "name": "Covenant / Sliver C2 Channel",
        "category": "Adversary Simulation Framework",
        "severity": "CRITICAL",
        "mitre_id": "T1071",
        "notes": "Covenant .NET / Sliver Go backdoor implant listener.",
    },
    {
        "port": 13579,
        "name": "PlugX / Korplug C2",
        "category": "Targeted APT Backdoor",
        "severity": "CRITICAL",
        "mitre_id": "T1573",
        "notes": "PlugX encrypted P2P backdoor listener widely used in targeted attacks.",
    },
    {
        "port": 12345,
        "name": "NetBus Legacy Backdoor",
        "category": "Trojan Horse",
        "severity": "HIGH",
        "mitre_id": "T1219",
        "notes": "NetBus legacy Trojan backdoor port.",
    },
    {
        "port": 27374,
        "name": "SubSeven Backdoor",
        "category": "Trojan Horse",
        "severity": "HIGH",
        "mitre_id": "T1219",
        "notes": "SubSeven Sub7 backdoor server port.",
    },
    {
        "port": 1337,
        "name": "Rogue Root Shell (Port 1337)",
        "category": "Unauthorized Bind Shell",
        "severity": "HIGH",
        "mitre_id": "T1059.004",
        "notes": "Common 'leet' bind shell / Netcat listener backdoor.",
    },
    {
        "port": 31337,
        "name": "Elite / Back Orifice Shell",
        "category": "Unauthorized Bind Shell",
        "severity": "HIGH",
        "mitre_id": "T1059.004",
        "notes": "Back Orifice / Netcat interactive command prompt.",
    },
    {
        "port": 9001,
        "name": "Reverse Shell Tunnel (Port 9001)",
        "category": "Proxy / Reverse Shell",
        "severity": "HIGH",
        "mitre_id": "T1090",
        "notes": "Frequent reverse shell listener port.",
    },
    {
        "port": 9999,
        "name": "Urgent Root Daemon Shell",
        "category": "Unauthorized Sockets",
        "severity": "HIGH",
        "mitre_id": "T1059.004",
        "notes": "Suspicious raw socket listener.",
    },
    {
        "port": 48101,
        "name": "Mirai IoT Botnet C2",
        "category": "IoT Malware / DDoS Bot",
        "severity": "CRITICAL",
        "mitre_id": "T1584",
        "notes": "Mirai botnet high-port infection loader and command receiver.",
    },
    {
        "port": 8088,
        "name": "Lumma Stealer C2",
        "category": "Infostealer & Credential Harvester",
        "severity": "CRITICAL",
        "mitre_id": "T1555",
        "notes": "Lumma Stealer C2 beacon port. Extracts Chromium/Gecko passwords, 2FA browser extensions, and crypto wallets.",
    },
    {
        "port": 2082,
        "name": "Lumma Stealer Alternate Gate",
        "category": "Infostealer & Credential Harvester",
        "severity": "CRITICAL",
        "mitre_id": "T1555",
        "notes": "Alternate HTTP/HTTPS exfiltration port for Lumma Stealer loader.",
    },
    {
        "port": 4000,
        "name": "Vidar / Arkei Stealer C2",
        "category": "Infostealer Trojan",
        "severity": "CRITICAL",
        "mitre_id": "T1555",
        "notes": "Vidar / Arkei infostealer remote command gate and credential drop listener.",
    },
    {
        "port": 8443,
        "name": "Raccoon Stealer v2 / BlackCat C2",
        "category": "Modular Infostealer",
        "severity": "CRITICAL",
        "mitre_id": "T1071.001",
        "notes": "Raccoon Stealer v2 / BlackCat ransomware encrypted SSL/TLS C2 exfiltration channel.",
    },
    {
        "port": 65534,
        "name": "Raccoon Stealer High-Port Gate",
        "category": "Modular Infostealer",
        "severity": "CRITICAL",
        "mitre_id": "T1573",
        "notes": "High-port beaconing channel for Raccoon Stealer C2 infrastructure.",
    },
    {
        "port": 2525,
        "name": "Agent Tesla Exfiltration Channel",
        "category": "Keylogger & Spyware",
        "severity": "CRITICAL",
        "mitre_id": "T1056.001",
        "notes": "Agent Tesla remote keystroke, clipboard, and credential exfiltration channel.",
    },
    {
        "port": 2121,
        "name": "Agent Tesla FTP Exfil Server",
        "category": "Keylogger & Spyware",
        "severity": "CRITICAL",
        "mitre_id": "T1048.003",
        "notes": "Agent Tesla stealth FTP data drop server.",
    },
    {
        "port": 8008,
        "name": "Stealc Infostealer Gate",
        "category": "Infostealer Trojan",
        "severity": "CRITICAL",
        "mitre_id": "T1555",
        "notes": "Stealc C2 administration web gate. Harvests browser session cookies and credentials.",
    },
    {
        "port": 9090,
        "name": "IcedID (BokBot) / Stealc C2",
        "category": "Banking Trojan & Backdoor",
        "severity": "CRITICAL",
        "mitre_id": "T1071",
        "notes": "IcedID / Stealc high-throughput C2 communication listener.",
    },
    {
        "port": 5005,
        "name": "Meduza Stealer C2",
        "category": "Infostealer Trojan",
        "severity": "CRITICAL",
        "mitre_id": "T1555",
        "notes": "Meduza infostealer administration gate and exfiltration portal.",
    },
    {
        "port": 7070,
        "name": "WhiteSnake Stealer C2",
        "category": "Multi-Platform Infostealer",
        "severity": "CRITICAL",
        "mitre_id": "T1555",
        "notes": "WhiteSnake Stealer command and control endpoint targeting Windows and Linux.",
    },
    {
        "port": 19088,
        "name": "RedLine Stealer Secondary TCP",
        "category": "Infostealer Trojan",
        "severity": "CRITICAL",
        "mitre_id": "T1555",
        "notes": "Secondary TCP exfiltration channel used by modern RedLine malware campaigns.",
    },
    {
        "port": 2080,
        "name": "Qakbot (QBot) Tier-1 Proxy",
        "category": "Banking Trojan & Loader",
        "severity": "CRITICAL",
        "mitre_id": "T1090.002",
        "notes": "Qakbot Tier-1 infected proxy bot node for C2 relay.",
    },
    {
        "port": 2078,
        "name": "Qakbot Botnet Command Port",
        "category": "Banking Trojan & Loader",
        "severity": "CRITICAL",
        "mitre_id": "T1090.002",
        "notes": "Alternate botnet communication channel for Qakbot banking Trojan.",
    },
    {
        "port": 447,
        "name": "TrickBot Anchor C2",
        "category": "Modular Trojan & Loader",
        "severity": "CRITICAL",
        "mitre_id": "T1071.001",
        "notes": "TrickBot Anchor DNS/HTTPS C2 infrastructure listener.",
    },
    {
        "port": 449,
        "name": "TrickBot High-Security C2",
        "category": "Modular Trojan & Loader",
        "severity": "CRITICAL",
        "mitre_id": "T1071.001",
        "notes": "Secondary HTTPS C2 channel for TrickBot reconnaissance modules.",
    },
    {
        "port": 7080,
        "name": "Emotet / Geodo C2 Proxy",
        "category": "Polymorphic Botnet Loader",
        "severity": "CRITICAL",
        "mitre_id": "T1573",
        "notes": "Emotet epoch C2 communication proxy port.",
    },
    {
        "port": 2967,
        "name": "PikaBot C2 Loader Gate",
        "category": "Malware Loader & Backdoor",
        "severity": "CRITICAL",
        "mitre_id": "T1059",
        "notes": "PikaBot modern modular loader C2 listener.",
    },
    {
        "port": 13783,
        "name": "PikaBot High-Port C2",
        "category": "Malware Loader & Backdoor",
        "severity": "CRITICAL",
        "mitre_id": "T1059",
        "notes": "Alternate communication port for PikaBot staging payload.",
    },
    {
        "port": 2355,
        "name": "DarkGate Loader / RAT",
        "category": "Commodity Loader & RAT",
        "severity": "CRITICAL",
        "mitre_id": "T1055",
        "notes": "DarkGate advanced malware loader command endpoint. Employs process hollowing and credential theft.",
    },
    {
        "port": 50000,
        "name": "Brute Ratel C4 (BRc4) / Emotet C2",
        "category": "Advanced Adversary C2",
        "severity": "CRITICAL",
        "mitre_id": "T1071",
        "notes": "Brute Ratel C4 Badger listener port. Advanced adversary simulation tool frequently weaponized by APTs.",
    },
    {
        "port": 8848,
        "name": "DcRat (DCRat) C2 Server",
        "category": "Modular Remote Access Trojan",
        "severity": "CRITICAL",
        "mitre_id": "T1219",
        "notes": "DCRat .NET backdoor controller listener. Features reverse proxy, webcam recorder, and ransomware plugins.",
    },
    {
        "port": 7001,
        "name": "XWorm RAT v3/v4",
        "category": "Modular Surveillance RAT",
        "severity": "CRITICAL",
        "mitre_id": "T1219",
        "notes": "XWorm RAT encrypted C2 listener. Performs keylogging, DDoS flooding, and clipper wallet hijacks.",
    },
    {
        "port": 8086,
        "name": "Viper RAT / SparkRAT C2",
        "category": "Cross-Platform Go Backdoor",
        "severity": "CRITICAL",
        "mitre_id": "T1219",
        "notes": "SparkRAT / Viper Go-based cross-platform surveillance server.",
    },
    {
        "port": 4449,
        "name": "Venom Software RAT",
        "category": "Rootkit & Remote Trojan",
        "severity": "CRITICAL",
        "mitre_id": "T1219",
        "notes": "Venom RAT rootkit backdoor command port.",
    },
    {
        "port": 999,
        "name": "CyberGate RAT",
        "category": "Remote Access Trojan",
        "severity": "CRITICAL",
        "mitre_id": "T1219",
        "notes": "CyberGate legacy espionage Trojan port.",
    },
    {
        "port": 1200,
        "name": "Pandora RAT / SpyGate",
        "category": "Stealth Surveillance Backdoor",
        "severity": "CRITICAL",
        "mitre_id": "T1056",
        "notes": "Pandora RAT remote audio/video wiretapping listener.",
    },
    {
        "port": 3333,
        "name": "Revenge RAT / Stratum Miner",
        "category": "Trojan & Cryptominer Gate",
        "severity": "HIGH",
        "mitre_id": "T1496",
        "notes": "Revenge RAT control port or unauthorized Stratum cryptomining pool connection.",
    },
    {
        "port": 2828,
        "name": "Bandook Trojan Backdoor",
        "category": "Advanced Espionage Trojan",
        "severity": "CRITICAL",
        "mitre_id": "T1219",
        "notes": "Bandook Trojan remote backdoor socket listener.",
    },
    {
        "port": 37215,
        "name": "Gafgyt / BASHLITE IoT Botnet",
        "category": "IoT Malware / DDoS Bot",
        "severity": "CRITICAL",
        "mitre_id": "T1584",
        "notes": "Gafgyt / BASHLITE router & IoT botnet exploitation port.",
    },
    {
        "port": 34567,
        "name": "Mozi P2P Botnet DHT",
        "category": "IoT P2P Botnet",
        "severity": "CRITICAL",
        "mitre_id": "T1584.002",
        "notes": "Mozi P2P DHT botnet communication channel.",
    },
    {
        "port": 1985,
        "name": "Chaos Ransomware / RAT",
        "category": "Ransomware & Backdoor",
        "severity": "CRITICAL",
        "mitre_id": "T1486",
        "notes": "Chaos ransomware builder & C2 listener port.",
    },
    {
        "port": 4433,
        "name": "Hive / Black Basta C2 Proxy",
        "category": "Ransomware Staging Infrastructure",
        "severity": "CRITICAL",
        "mitre_id": "T1486",
        "notes": "Ransomware syndicate proxy listener for staging payload payloads.",
    },
    {
        "port": 4040,
        "name": "Ngrok Client Tunnel Console",
        "category": "Unauthorized Ingress Proxy",
        "severity": "HIGH",
        "mitre_id": "T1572",
        "notes": "Active local Ngrok tunnel web interface. Frequently abused to bypass firewalls and expose internal services.",
    },
    {
        "port": 2048,
        "name": "LocalXpose / Cloudflare Reverse Tunnel",
        "category": "Unauthorized Ingress Proxy",
        "severity": "HIGH",
        "mitre_id": "T1572",
        "notes": "Unauthorized reverse proxy tunnel listener.",
    },
    {
        "port": 22222,
        "name": "Rogue Dropbear / OpenSSH Tunnel",
        "category": "Covert Shell Backdoor",
        "severity": "CRITICAL",
        "mitre_id": "T1021.004",
        "notes": "Rogue high-port SSH daemon commonly deployed by backdoors.",
    },
    {
        "port": 14444,
        "name": "Monero (XMR) Stratum Mining Pool",
        "category": "Unauthorized Cryptominer",
        "severity": "HIGH",
        "mitre_id": "T1496",
        "notes": "Direct Stratum mining pool connection port for unauthorized cryptomining.",
    },
    {
        "port": 2179,
        "name": "Turla APT Snake P2P C2",
        "category": "State-Sponsored Cyber Espionage",
        "severity": "CRITICAL",
        "mitre_id": "T1071",
        "notes": "Turla (Snake/Uroburos) advanced threat actor P2P beaconing port.",
    },
    {
        "port": 5555,
        "name": "SysJoker / Meterpreter Alternate",
        "category": "Multi-Platform Backdoor",
        "severity": "CRITICAL",
        "mitre_id": "T1059",
        "notes": "SysJoker multi-platform backdoor (Windows/macOS/Linux) or Android ADB exploitation listener.",
    },
    {
        "port": 8000,
        "name": "FormBook / Lokibot Web Drop Gate",
        "category": "Infostealer & Keylogger",
        "severity": "HIGH",
        "mitre_id": "T1555",
        "notes": "Suspicious HTTP gate for FormBook, XLoader, or Lokibot infostealer panels.",
    },
    {
        "port": 1433,
        "name": "MS-SQL Worm / Lokibot Harvester",
        "category": "Database Worm / Harvester",
        "severity": "HIGH",
        "mitre_id": "T1110",
        "notes": "Exposed MS-SQL port frequently brute-forced by database worms and ransomware loaders.",
    },
    {
        "port": 2405,
        "name": "Remcos Professional (Tertiary)",
        "category": "Commercial Surveillance Tool",
        "severity": "CRITICAL",
        "mitre_id": "T1219",
        "notes": "Tertiary communication channel for Remcos surveillance software.",
    },
    {
        "port": 4783,
        "name": "QuasarRAT Alternate C2",
        "category": "Open-Source C# RAT",
        "severity": "CRITICAL",
        "mitre_id": "T1219",
        "notes": "Alternate port for Quasar remote administration Trojan.",
    },
    {
        "port": 8089,
        "name": "Warzone RAT / Meduza Alternate",
        "category": "Commercial Surveillance RAT",
        "severity": "CRITICAL",
        "mitre_id": "T1056.001",
        "notes": "Alternate C2 port for Warzone RAT and Meduza infostealer.",
    },
    {
        "port": 54320,
        "name": "Back Orifice 2000 (BO2K)",
        "category": "Legacy Stealth Backdoor",
        "severity": "HIGH",
        "mitre_id": "T1219",
        "notes": "Back Orifice 2000 default stealth communication port.",
    },
    {
        "port": 6667,
        "name": "IRC Botnet C2 Listener",
        "category": "Botnet Command & Control",
        "severity": "HIGH",
        "mitre_id": "T1071.001",
        "notes": "Classic IRC botnet communication channel for automated distributed attacks.",
    },
    {
        "port": 9150,
        "name": "Tor Browser SOCKS5 Proxy",
        "category": "Anonymized Exfiltration",
        "severity": "HIGH",
        "mitre_id": "T1090.003",
        "notes": "Tor Browser SOCKS5 communication port. Flags potential anonymized exfiltration.",
    },
    {
        "port": 4001,
        "name": "BitRAT Modular Surveillance C2",
        "category": "Remote Access Trojan",
        "severity": "CRITICAL",
        "mitre_id": "T1219",
        "notes": "BitRAT commercial surveillance Trojan with hVNC, XMR miner, webcam surveillance, and SOCKS5 proxy.",
        "handshake_hint": "bitrat",
    },
    {
        "port": 4002,
        "name": "BitRAT Alternate Gateway",
        "category": "Remote Access Trojan",
        "severity": "CRITICAL",
        "mitre_id": "T1219",
        "notes": "Secondary BitRAT communication port for data exfiltration and Tor routing.",
    },
    {
        "port": 1443,
        "name": "STRRAT Infostealer & Ransomware RAT",
        "category": "Infostealer & Ransomware RAT",
        "severity": "CRITICAL",
        "mitre_id": "T1056.001",
        "notes": "STRRAT Java-based infostealer that steals browser credentials, logs keystrokes, and fakes ransomware encryption.",
    },
    {
        "port": 8090,
        "name": "STRRAT Alternate C2 Gate",
        "category": "Infostealer & Ransomware RAT",
        "severity": "CRITICAL",
        "mitre_id": "T1056.001",
        "notes": "Secondary STRRAT communication port for credential staging and command reception.",
    },
    {
        "port": 9443,
        "name": "Nighthawk C2 Listener",
        "category": "Advanced Adversary C2",
        "severity": "CRITICAL",
        "mitre_id": "T1071",
        "notes": "MDSec Nighthawk highly evasive C2 framework handler with sleep obfuscation and thread call stack spoofing.",
    },
    {
        "port": 9990,
        "name": "Koadic C3 COM-Based C2",
        "category": "Post-Exploitation Framework",
        "severity": "CRITICAL",
        "mitre_id": "T1059.005",
        "notes": "Koadic JScript/VBScript COM-based adversary command and control server port.",
    },
    {
        "port": 20443,
        "name": "WellMess APT29 CozyBear C2",
        "category": "State-Sponsored Espionage",
        "severity": "CRITICAL",
        "mitre_id": "T1071.001",
        "notes": "WellMess multi-platform (Golang/.NET) Trojan used by APT29 (Cozy Bear) for health/vaccine/government espionage.",
    },
    {
        "port": 7777,
        "name": "AlienSpy / Adwind / Frutas RAT",
        "category": "Cross-Platform Java Trojan",
        "severity": "CRITICAL",
        "mitre_id": "T1219",
        "notes": "AlienSpy / Adwind cross-platform surveillance RAT targeting Windows, macOS, and Linux workstations.",
    },
    {
        "port": 9898,
        "name": "Adwind RAT Alternate",
        "category": "Cross-Platform Java Trojan",
        "severity": "CRITICAL",
        "mitre_id": "T1219",
        "notes": "Secondary communication port for Adwind / jRat espionage campaigns.",
    },
    {
        "port": 8081,
        "name": "Babuk / Medusa Ransomware Builder C2",
        "category": "Ransomware Staging Infrastructure",
        "severity": "CRITICAL",
        "mitre_id": "T1486",
        "notes": "Babuk locker and Medusa ransomware builder coordination port.",
    },
    {
        "port": 9002,
        "name": "LockBit 3.0 (Black) Command Relay",
        "category": "Ransomware Staging Infrastructure",
        "severity": "CRITICAL",
        "mitre_id": "T1486",
        "notes": "LockBit 3.0 Black affiliate infrastructure exfiltration and key distribution relay.",
    },
    {
        "port": 5050,
        "name": "RisePro Infostealer Gate",
        "category": "Infostealer Trojan",
        "severity": "CRITICAL",
        "mitre_id": "T1555",
        "notes": "RisePro infostealer payload receiver and browser credential drop server.",
    },
    {
        "port": 5051,
        "name": "RisePro Alternate Gate",
        "category": "Infostealer Trojan",
        "severity": "CRITICAL",
        "mitre_id": "T1555",
        "notes": "Secondary RisePro exfiltration port for harvested Discord tokens, crypto wallets, and cookies.",
    },
    {
        "port": 444,
        "name": "Bumblebee Loader C2",
        "category": "Malware Loader & C2",
        "severity": "CRITICAL",
        "mitre_id": "T1059",
        "notes": "Bumblebee loader communicating with cybercrime threat actor infrastructure to deliver Cobalt Strike / ransomware.",
    },
    {
        "port": 1194,
        "name": "Danabot Banking Trojan C2",
        "category": "Banking Trojan & Infostealer",
        "severity": "CRITICAL",
        "mitre_id": "T1071",
        "notes": "Danabot modular banking Trojan command port and web injection proxy.",
    },
    {
        "port": 46336,
        "name": "Hajime P2P Botnet Node",
        "category": "IoT P2P Botnet",
        "severity": "HIGH",
        "mitre_id": "T1584.002",
        "notes": "Hajime advanced decentralized IoT botnet peer port.",
    },
    {
        "port": 2323,
        "name": "Mirai / Gafgyt Telnet Exploitation",
        "category": "IoT Malware / Telnet Worm",
        "severity": "CRITICAL",
        "mitre_id": "T1110.001",
        "notes": "Common alternate Telnet port actively scanned and brute-forced by Mirai, Gafgyt, and Mozi botnets.",
    },
    {
        "port": 7547,
        "name": "TR-069 CWMP Mirai / IoT Exploit Port",
        "category": "IoT Exploitation Port",
        "severity": "CRITICAL",
        "mitre_id": "T1190",
        "notes": "Broadband DSL/FTTH router TR-069 port target of automated Mirai zero-day RCE worms.",
    },
    {
        "port": 3334,
        "name": "Stratum Proxy Cryptominer Gate",
        "category": "Unauthorized Cryptominer",
        "severity": "HIGH",
        "mitre_id": "T1496",
        "notes": "Stratum mining proxy daemon redirecting compromised hashpower to remote mining pools.",
    },
    {
        "port": 5556,
        "name": "SysJoker / Meterpreter Stage 3",
        "category": "Multi-Platform Backdoor",
        "severity": "CRITICAL",
        "mitre_id": "T1059",
        "notes": "SysJoker cross-platform backdoor stage 3 command channel.",
    },
    {
        "port": 8889,
        "name": "Sliver Go Backdoor C2 (Secondary)",
        "category": "Adversary Simulation Framework",
        "severity": "CRITICAL",
        "mitre_id": "T1071",
        "notes": "Sliver Go post-exploitation C2 server listener.",
    },
    {
        "port": 8001,
        "name": "XLoader / FormBook Exfiltration Gate",
        "category": "Infostealer & Keylogger",
        "severity": "HIGH",
        "mitre_id": "T1555",
        "notes": "XLoader encrypted HTTP exfiltration gate for stolen banking and system credentials.",
    },
    {
        "port": 1338,
        "name": "Root Shell / Netcat Listener (Secondary)",
        "category": "Unauthorized Bind Shell",
        "severity": "HIGH",
        "mitre_id": "T1059.004",
        "notes": "Secondary root shell / Netcat interactive backdoor socket.",
    },
    {
        "port": 9002,
        "name": "Reverse Shell Tunnel (Secondary)",
        "category": "Proxy / Reverse Shell",
        "severity": "HIGH",
        "mitre_id": "T1090",
        "notes": "Secondary reverse TCP tunnel listener.",
    },
    {
        "port": 2222,
        "name": "PoshC2 / Rogue SSH Shell",
        "category": "Covert Shell Backdoor",
        "severity": "CRITICAL",
        "mitre_id": "T1021.004",
        "notes": "PoshC2 default SSH beacon handler or unauthorized non-standard SSH daemon.",
    },
    {
        "port": 8099,
        "name": "China Chopper / Godzilla WebShell Agent",
        "category": "WebShell Backdoor Listener",
        "severity": "CRITICAL",
        "mitre_id": "T1505.003",
        "notes": "Godzilla / Behinder encrypted dynamic classloader webshell manager connection endpoint.",
    },
    {
        "port": 9091,
        "name": "b374k / WSO WebShell Handler",
        "category": "WebShell Backdoor Listener",
        "severity": "CRITICAL",
        "mitre_id": "T1505.003",
        "notes": "b374k / WSO PHP webshell proxy and file manager handler.",
    },
    {
        "port": 10000,
        "name": "Webmin / Rogue Admin Backdoor",
        "category": "Administration & Backdoor Risk",
        "severity": "HIGH",
        "mitre_id": "T1078",
        "notes": "Webmin remote administration interface often targeted for unauthenticated root RCE (e.g., CVE-2019-15107).",
    },
    {
        "port": 28017,
        "name": "Unauthenticated MongoDB Data Exfil",
        "category": "Database Exfiltration Port",
        "severity": "HIGH",
        "mitre_id": "T1530",
        "notes": "Exposed MongoDB web status interface allowing unauthenticated database enumeration.",
    },
    {
        "port": 50001,
        "name": "Brute Ratel C4 Shadow Gate",
        "category": "Advanced Adversary C2",
        "severity": "CRITICAL",
        "mitre_id": "T1071",
        "notes": "Secondary Badger listener for Brute Ratel C4 operations.",
    },
    {
        "port": 8082,
        "name": "SmokeLoader Payload Drop Gate",
        "category": "Malware Loader & Dropper",
        "severity": "CRITICAL",
        "mitre_id": "T1059",
        "notes": "SmokeLoader modular botnet command and intermediate payload distribution gate.",
    },
    {
        "port": 8083,
        "name": "GuLoader CloudEyE Gateway",
        "category": "Malware Loader & Dropper",
        "severity": "CRITICAL",
        "mitre_id": "T1059",
        "notes": "GuLoader encrypted shellcode delivery port fetching second-stage malware.",
    },
    {
        "port": 9051,
        "name": "Tor Control Port (Backdoor Beaconing)",
        "category": "Anonymized Exfiltration",
        "severity": "HIGH",
        "mitre_id": "T1090.003",
        "notes": "Tor daemon control port; unauthorized binding indicates malware automating onion-routing hidden services.",
    },
    {
        "port": 6668,
        "name": "IRC Botnet Secondary C2",
        "category": "Botnet Command & Control",
        "severity": "HIGH",
        "mitre_id": "T1071.001",
        "notes": "Secondary IRC channel port used by automated botnet swarms.",
    },
]


class RatDetectorEngine:
    """Fast concurrent scanner and behavioral auditor for Remote Access Trojans and backdoors."""

    def __init__(self, db: Optional[DatabaseEngine] = None, timeout: float = 0.5):
        self.db = db
        self.timeout = timeout

    def probe_single_rat_port(self, ip: str, rat_meta: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Probes a specific target port for RAT listener activity and grabs banners/signatures."""
        port = rat_meta["port"]
        hint = rat_meta.get("handshake_hint")

        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.settimeout(self.timeout)
                if sock.connect_ex((ip, port)) == 0:
                    banner = ""
                    matched_handshake = False

                    # Active Behavioral Probe depending on RAT hint
                    try:
                        sock.settimeout(0.6)
                        if hint == "|'|'":
                            # njRAT handshake trigger
                            sock.sendall(b"ll|'|'|ll\r\n")
                            data = sock.recv(256)
                            if data:
                                banner = data.decode("latin-1", errors="ignore").strip()[:100]
                                if "|'|'" in banner or "njrat" in banner.lower():
                                    matched_handshake = True
                        elif hint == "Gh0st":
                            # Ghost RAT magic probe
                            sock.sendall(b"Gh0st\x00\x00\x00\x00")
                            data = sock.recv(256)
                            if data:
                                banner = data.decode("latin-1", errors="ignore").strip()[:100]
                                if "Gh0st" in banner:
                                    matched_handshake = True
                        elif hint == "dc_v5":
                            # DarkComet trigger
                            sock.sendall(b"DCDATA\r\n\r\n")
                            data = sock.recv(256)
                            if data:
                                banner = data.decode("latin-1", errors="ignore").strip()[:100]
                                if "dc" in banner.lower() or "dark" in banner.lower():
                                    matched_handshake = True
                        elif hint in ("asyncrat", "quasar"):
                            # Check TLS handshake and inspect server certificate subject
                            try:
                                ctx = ssl.create_default_context()
                                ctx.check_hostname = False
                                ctx.verify_mode = ssl.CERT_NONE
                                with ctx.wrap_socket(sock, server_hostname=ip) as ssl_sock:
                                    cert = ssl_sock.getpeercert(binary_form=False) or {}
                                    subj = str(cert.get("subject", ""))
                                    if "asyncrat" in subj.lower() or "quasar" in subj.lower():
                                        matched_handshake = True
                                        banner = f"TLS Cert: {subj[:80]}"
                            except Exception:
                                pass
                        else:
                            # Standard banner grab
                            sock.sendall(b"\r\n\r\n")
                            data = sock.recv(256)
                            if data:
                                banner = data.decode("latin-1", errors="ignore").strip()[:80]
                    except Exception:
                        pass

                    return {
                        "port": port,
                        "trojan_name": rat_meta["name"],
                        "category": rat_meta["category"],
                        "severity": rat_meta["severity"],
                        "mitre_id": rat_meta.get("mitre_id", "T1219"),
                        "notes": rat_meta["notes"],
                        "banner": banner or "(Open listening socket - No plaintext banner)",
                        "matched_signature": True,
                        "matched_handshake": matched_handshake,
                    }
        except Exception:
            pass
        return None

    def audit_host(self, ip: str, mac: Optional[str] = None) -> Dict[str, Any]:
        """
        Audits a single host against the complete RAT registry.
        Returns threat classification and list of compromised ports.
        """
        st = time.time()
        findings: List[Dict[str, Any]] = []

        with ThreadPoolExecutor(max_workers=25) as executor:
            future_to_rat = {
                executor.submit(self.probe_single_rat_port, ip, item): item
                for item in KNOWN_RAT_REGISTRY
            }
            for future in as_completed(future_to_rat):
                res = future.result()
                if res:
                    findings.append(res)

        findings.sort(key=lambda x: x["port"])

        # Determine overall Threat Status
        if any(f["severity"] == "CRITICAL" for f in findings):
            threat_level = "CRITICAL COMPROMISE DETECTED"
            risk_grade = "CRITICAL"
        elif findings:
            threat_level = "SUSPICIOUS BACKDOOR PORTS OPEN"
            risk_grade = "HIGH"
        else:
            threat_level = "CLEAN (No RAT ports open)"
            risk_grade = "CLEAN"

        duration_ms = round((time.time() - st) * 1000, 2)

        result = {
            "ip": ip,
            "mac": mac or "Unknown",
            "threat_level": threat_level,
            "risk_grade": risk_grade,
            "is_infected": len(findings) > 0,
            "rat_findings_count": len(findings),
            "findings": findings,
            "total_ports_probed": len(KNOWN_RAT_REGISTRY),
            "duration_ms": duration_ms,
            "scanned_at": datetime.now(timezone.utc).isoformat(),
        }

        # If compromised and database engine is connected, log an alert
        if self.db and findings:
            self.db.log_alert(
                alert_type="RAT_TROJAN_DETECTED",
                message=f"Trojan listener detected on {ip} [{mac or ''}]: {findings[0]['trojan_name']} on port {findings[0]['port']}",
                mac=mac or "",
                ip=ip,
                severity="CRITICAL",
            )

        return result

    def audit_entire_network(self) -> Dict[str, Any]:
        """Runs RAT detection across all discovered devices in the inventory."""
        st = time.time()
        devices = self.db.get_all_devices() if self.db else []

        compromised_devices = []
        clean_devices = []

        for d in devices:
            ip = d.get("ip")
            mac = d.get("mac")
            if ip and d.get("status") == "online":
                host_res = self.audit_host(ip, mac=mac)
                host_res["vendor"] = d.get("vendor", "Unknown")
                host_res["hostname"] = d.get("hostname", "Unknown")
                host_res["nickname"] = d.get("nickname", "")
                if host_res["is_infected"]:
                    compromised_devices.append(host_res)
                else:
                    clean_devices.append(host_res)

        duration_ms = round((time.time() - st) * 1000, 2)

        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total_devices_audited": len(compromised_devices) + len(clean_devices),
            "compromised_count": len(compromised_devices),
            "clean_count": len(clean_devices),
            "compromised_devices": compromised_devices,
            "clean_devices": clean_devices,
            "overall_status": "CRITICAL THREATS FOUND" if compromised_devices else "NETWORK CLEAN",
            "duration_ms": duration_ms,
        }

    def check_malware_processes(self) -> List[Dict[str, Any]]:
        """
        Deep Process Forensics & Cryptominer Check:
        Scans all running processes for known malware signatures, cryptominers,
        memory evasion (unlinked/deleted binaries), and suspicious parent-child trees.
        """
        findings = []
        is_windows = (sys.platform == "win32") or (os.name == "nt")

        malware_signatures = [
            {"re": re.compile(r"(xmrig|xmr-stak|minergate|cpuminer|pwnrig|kworkerds|kinsing|c3pool)", re.I), "name": "Unauthorized Cryptominer", "severity": "HIGH", "category": "Cryptomining Malware", "mitre_id": "T1496"},
            {"re": re.compile(r"(darkcomet|njrat|quasar|asyncrat|agenttesla|lumma|remcos|warzone|avemaria|redline|vidar|raccoon|stealc)", re.I), "name": "Known RAT / Infostealer Binary", "severity": "CRITICAL", "category": "Trojan / Infostealer", "mitre_id": "T1219"},
            {"re": re.compile(r"(mimikatz|lazagne|pwdump|gsecdump|nanodump|safetykatz)", re.I), "name": "Credential Dumper Tool", "severity": "CRITICAL", "category": "Credential Access", "mitre_id": "T1003"},
            {"re": re.compile(r"(cobaltstrike|teamserver|sliver-server|sliver-client|havoc.*server|brc4)", re.I), "name": "Adversary C2 Framework Executable", "severity": "CRITICAL", "category": "Adversary C2", "mitre_id": "T1071"},
            {"re": re.compile(r"(chisel.*client|chisel.*server|ngrok.*start|frpc|frps)", re.I), "name": "Unauthorized Ingress Reverse Tunnel", "severity": "HIGH", "category": "Proxy / Tunnel", "mitre_id": "T1572"},
        ]

        if is_windows:
            try:
                cmd = ["powershell", "-NoProfile", "-Command", "Get-Process | Select-Object Id,ProcessName,Path,CommandLine | ConvertTo-Json -Depth 2"]
                proc = subprocess.run(cmd, capture_output=True, text=True, timeout=6)
                if proc.returncode == 0 and proc.stdout.strip():
                    procs = json.loads(proc.stdout)
                    if isinstance(procs, dict):
                        procs = [procs]
                    for p in procs:
                        name = p.get("ProcessName", "") or ""
                        path = p.get("Path", "") or ""
                        cmdline = p.get("CommandLine", "") or ""
                        pid = p.get("Id")
                        combined = f"{name} {path} {cmdline}"

                        for sig in malware_signatures:
                            if sig["re"].search(combined):
                                findings.append({
                                    "severity": sig["severity"],
                                    "category": sig["category"],
                                    "indicator": f"Process PID {pid} [{name}] matches {sig['name']}",
                                    "process_id": pid,
                                    "process_name": name,
                                    "path": path,
                                    "mitre_id": sig["mitre_id"],
                                    "remediation": f"Terminate PID {pid} immediately using Task Manager or `Stop-Process -Id {pid}` and quarantine file.",
                                })

                        # Masquerading: system binaries running from temp or user directories
                        if name.lower() in ("svchost", "lsass", "csrss", "explorer") and any(d in path.lower() for d in ["appdata", "temp", "downloads"]):
                            findings.append({
                                "severity": "CRITICAL",
                                "category": "Process Masquerading",
                                "indicator": f"Critical system binary '{name}' executing from abnormal path: {path}",
                                "process_id": pid,
                                "path": path,
                                "mitre_id": "T1036.005",
                                "remediation": f"High probability of malicious disguise. Inspect PID {pid} and quarantine file.",
                            })
            except Exception:
                pass
        else:
            # Linux process audit via /proc
            if os.path.exists("/proc"):
                for entry in os.listdir("/proc"):
                    if entry.isdigit():
                        pid = int(entry)
                        cmdline_path = f"/proc/{pid}/cmdline"
                        exe_path = f"/proc/{pid}/exe"

                        cmdline = ""
                        try:
                            with open(cmdline_path, "rb") as f:
                                raw = f.read(512)
                                cmdline = raw.replace(b"\x00", b" ").decode("latin-1", errors="ignore").strip()
                        except Exception:
                            pass

                        target = ""
                        try:
                            target = os.readlink(exe_path)
                        except Exception:
                            pass

                        combined = f"{cmdline} {target}"

                        # Check 1: Deleted memory executable evasion
                        if "(deleted)" in target and not any(wh in target for wh in ["node", "python", "tsx", "npm"]):
                            findings.append({
                                "severity": "CRITICAL",
                                "category": "Hidden Memory Process Evasion",
                                "indicator": f"Process PID {pid} is executing an image unlinked/deleted from disk: {target}",
                                "process_id": pid,
                                "path": target,
                                "mitre_id": "T1059.004",
                                "remediation": f"Terminate PID {pid} (`kill -9 {pid}`) and inspect memory mappings in `/proc/{pid}/maps`.",
                            })

                        # Check 2: Malware signature regex match
                        for sig in malware_signatures:
                            if sig["re"].search(combined):
                                findings.append({
                                    "severity": sig["severity"],
                                    "category": sig["category"],
                                    "indicator": f"Process PID {pid} matches {sig['name']}: {cmdline[:80]}",
                                    "process_id": pid,
                                    "cmdline": cmdline[:100],
                                    "path": target,
                                    "mitre_id": sig["mitre_id"],
                                    "remediation": f"Terminate PID {pid} immediately (`kill -9 {pid}`) and audit `/proc/{pid}/cwd`.",
                                })

                        # Check 3: Masquerading: system daemon names running from /tmp or /dev/shm
                        if any(w in cmdline.lower() for w in ["systemd", "sshd", "crond", "kworker"]) and any(tmp in target for tmp in ["/tmp", "/var/tmp", "/dev/shm"]):
                            findings.append({
                                "severity": "CRITICAL",
                                "category": "Process Masquerading",
                                "indicator": f"Process PID {pid} disguises as kernel/system daemon but runs from temporary storage: {target}",
                                "process_id": pid,
                                "path": target,
                                "mitre_id": "T1036.005",
                                "remediation": f"Malware dropper detected. Terminate PID {pid} and remove binary `{target}`.",
                            })

        return findings

    def check_malware_persistence(self) -> List[Dict[str, Any]]:
        """
        Persistence & Startup Mechanisms Check:
        Audits autorun keys, scheduled tasks, cron jobs, systemd services, and rogue preloaders.
        """
        findings = []
        is_windows = (sys.platform == "win32") or (os.name == "nt")

        if is_windows:
            # 1. Registry Run keys
            run_keys = [
                "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
            ]
            for rk in run_keys:
                try:
                    proc = subprocess.run(["reg", "query", rk], capture_output=True, text=True, timeout=3)
                    if proc.returncode == 0:
                        for line in proc.stdout.splitlines():
                            line_low = line.lower()
                            if any(susp in line_low for susp in ["powershell", "cmd.exe", "temp", "wscript", "cscript", "mshta", "rundll32.*http", "-enc"]):
                                findings.append({
                                    "severity": "HIGH",
                                    "category": "Suspicious Registry Persistence",
                                    "indicator": f"Suspicious autorun in {rk}: {line.strip()[:100]}",
                                    "mitre_id": "T1547.001",
                                    "remediation": f"Inspect and remove unauthorized key from `{rk}` using regedit.exe.",
                                })
                except Exception:
                    pass

            # 2. Scheduled Tasks with encoded or script execution
            try:
                proc = subprocess.run(["schtasks", "/query", "/fo", "LIST", "/v"], capture_output=True, text=True, timeout=4)
                if proc.returncode == 0:
                    for line in proc.stdout.splitlines():
                        if "Task To Run:" in line:
                            t_run = line.lower()
                            if any(flag in t_run for flag in ["-enc", "-encodedcommand", "-w hidden", "temp\\", "appdata\\local\\temp"]):
                                findings.append({
                                    "severity": "HIGH",
                                    "category": "Scheduled Task Backdoor",
                                    "indicator": f"Hidden/encoded scheduled task action found: {line.strip()[:100]}",
                                    "mitre_id": "T1053.005",
                                    "remediation": "Delete suspicious scheduled task via `schtasks /delete` or Task Scheduler.",
                                })
            except Exception:
                pass
        else:
            # 1. Linux Crontabs
            cron_targets = ["/etc/crontab", "/etc/cron.d", "/var/spool/cron/crontabs"]
            for target in cron_targets:
                if os.path.exists(target):
                    try:
                        if os.path.isdir(target):
                            for cf in os.listdir(target):
                                cpath = os.path.join(target, cf)
                                if os.path.isfile(cpath):
                                    with open(cpath, "r", errors="ignore") as f:
                                        content = f.read()
                                        if any(susp in content.lower() for susp in ["curl.*|.*sh", "wget.*|.*sh", "nc -e", "/dev/tcp/", "pastebin", "base64 -d", "/tmp/"]):
                                            findings.append({
                                                "severity": "CRITICAL",
                                                "category": "Rogue Cron Persistence",
                                                "indicator": f"Suspicious automated cron job in {cpath}",
                                                "mitre_id": "T1053.003",
                                                "remediation": f"Audit and clean cron file `{cpath}`.",
                                            })
                        elif os.path.isfile(target):
                            with open(target, "r", errors="ignore") as f:
                                content = f.read()
                                if any(susp in content.lower() for susp in ["curl.*|.*sh", "wget.*|.*sh", "nc -e", "/dev/tcp/", "base64 -d"]):
                                    findings.append({
                                        "severity": "CRITICAL",
                                        "category": "Rogue Cron Persistence",
                                        "indicator": f"Suspicious automated cron job in {target}",
                                        "mitre_id": "T1053.003",
                                        "remediation": f"Audit and clean cron file `{target}`.",
                                    })
                    except Exception:
                        pass

            # 2. Rogue systemd units in temporary paths
            systemd_dir = "/etc/systemd/system"
            if os.path.exists(systemd_dir):
                try:
                    for sfile in os.listdir(systemd_dir):
                        if sfile.endswith(".service"):
                            spath = os.path.join(systemd_dir, sfile)
                            if os.path.isfile(spath):
                                with open(spath, "r", errors="ignore") as f:
                                    scontent = f.read()
                                    if any(susp in scontent.lower() for susp in ["/tmp/", "/dev/shm", "nc -e", "base64", "curl -s http"]):
                                        findings.append({
                                            "severity": "CRITICAL",
                                            "category": "Rogue Systemd Service Persistence",
                                            "indicator": f"Suspicious systemd service definition in {spath}",
                                            "mitre_id": "T1543.002",
                                            "remediation": f"Disable service (`systemctl disable {sfile}`) and delete `{spath}`.",
                                        })
                except Exception:
                    pass

            # 3. LD_PRELOAD Rootkit check
            if os.path.exists("/etc/ld.so.preload"):
                try:
                    with open("/etc/ld.so.preload", "r") as f:
                        preload_lines = [l.strip() for l in f.readlines() if l.strip() and not l.startswith("#")]
                        if preload_lines:
                            findings.append({
                                "severity": "CRITICAL",
                                "category": "Shared Library Rootkit Hook",
                                "indicator": f"Active library preload hook found in /etc/ld.so.preload: {', '.join(preload_lines)}",
                                "mitre_id": "T1574.006",
                                "remediation": "Immediate rootkit warning: Inspect and clear `/etc/ld.so.preload`.",
                            })
                except Exception:
                    pass

        return findings

    def check_reverse_shells_and_sockets(self) -> List[Dict[str, Any]]:
        """
        Rogue Network Sockets & Reverse Shell Check:
        Detects processes bound to suspicious ports, interactive shells with network sockets,
        and established C2 beacons.
        """
        findings = []
        is_windows = (sys.platform == "win32") or (os.name == "nt")

        if is_windows:
            try:
                cmd = ["powershell", "-NoProfile", "-Command", "Get-NetTCPConnection | Select-Object LocalAddress,LocalPort,RemoteAddress,RemotePort,State,OwningProcess | ConvertTo-Json"]
                proc = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
                if proc.returncode == 0 and proc.stdout.strip():
                    conns = json.loads(proc.stdout)
                    if isinstance(conns, dict):
                        conns = [conns]
                    for conn in conns:
                        loc_port = conn.get("LocalPort")
                        rem_port = conn.get("RemotePort")
                        rem_ip = conn.get("RemoteAddress")
                        pid = conn.get("OwningProcess")
                        state = conn.get("State")

                        # Match listening or remote port against registry
                        for rat in KNOWN_RAT_REGISTRY:
                            if (state == "Listen" and rat["port"] == loc_port) or (rat["port"] == rem_port):
                                findings.append({
                                    "severity": rat["severity"],
                                    "category": "Trojan C2 Socket Connected",
                                    "indicator": f"Socket connection matching {rat['name']} (Port {rat['port']}) on PID {pid} [Remote: {rem_ip}:{rem_port}]",
                                    "process_id": pid,
                                    "port": rat["port"],
                                    "mitre_id": rat.get("mitre_id", "T1071"),
                                    "remediation": f"Active C2 socket detected. Terminate PID {pid} and block destination {rem_ip} at network firewall.",
                                })
            except Exception:
                pass
        else:
            # Linux: Check /proc/net/tcp and /proc/net/tcp6
            for net_file in ["/proc/net/tcp", "/proc/net/tcp6"]:
                if os.path.exists(net_file):
                    try:
                        with open(net_file, "r") as f:
                            lines = f.readlines()[1:]
                        for line in lines:
                            parts = line.strip().split()
                            if len(parts) >= 4:
                                state_hex = parts[3]
                                loc_parts = parts[1].split(":")
                                rem_parts = parts[2].split(":")

                                loc_port = int(loc_parts[1], 16) if len(loc_parts) > 1 else 0
                                rem_port = int(rem_parts[1], 16) if len(rem_parts) > 1 else 0

                                # Check listening ports (0A) or established (01)
                                for rat in KNOWN_RAT_REGISTRY:
                                    if (state_hex == "0A" and rat["port"] == loc_port) or (state_hex == "01" and rat["port"] == rem_port):
                                        findings.append({
                                            "severity": rat["severity"],
                                            "category": "Trojan C2 Socket Bound",
                                            "indicator": f"Socket {net_file} matched {rat['name']} (Port {rat['port']}) [State: {state_hex}]",
                                            "port": rat["port"],
                                            "mitre_id": rat.get("mitre_id", "T1071"),
                                            "remediation": f"Identify owning PID with `ss -tulpn | grep :{rat['port']}` or `lsof -i :{rat['port']}`.",
                                        })
                    except Exception:
                        pass

        return findings

    def check_sensitive_directories_for_artifacts(self) -> List[Dict[str, Any]]:
        """
        File & Staging Directory Malware Check:
        Scans temporary and world-writable directories (/tmp, /var/tmp, /dev/shm, %TEMP%)
        for hidden scripts, webshells, base64 payloads, and ransomware notes.
        """
        findings = []
        is_windows = (sys.platform == "win32") or (os.name == "nt")

        scan_dirs = []
        if is_windows:
            temp_dir = os.environ.get("TEMP", "C:\\Windows\\Temp")
            appdata = os.environ.get("APPDATA", "")
            if os.path.exists(temp_dir):
                scan_dirs.append(temp_dir)
            if appdata and os.path.exists(appdata):
                scan_dirs.append(appdata)
        else:
            for d in ["/tmp", "/var/tmp", "/dev/shm"]:
                if os.path.exists(d):
                    scan_dirs.append(d)

        suspicious_extensions = {".sh", ".py", ".pl", ".php", ".ps1", ".vbs", ".bat", ".elf", ".bin"}
        webshell_triggers = ["eval(base64_decode", "system($_GET", "passthru($_POST", "shell_exec($_REQUEST", "cmd.exe /c", "/bin/sh -i"]
        ransom_triggers = ["how_to_decrypt", "readme_restore", "decrypt_files", "your_files_are_encrypted"]

        for sdir in scan_dirs:
            try:
                entries = os.listdir(sdir)[:80]  # Limit scan depth for safety and performance
                for entry in entries:
                    full_path = os.path.join(sdir, entry)

                    # Hidden executable file (starts with dot)
                    if entry.startswith(".") and any(entry.endswith(ext) for ext in suspicious_extensions):
                        findings.append({
                            "severity": "HIGH",
                            "category": "Hidden Script Dropper",
                            "indicator": f"Hidden executable script in temporary directory: {full_path}",
                            "path": full_path,
                            "mitre_id": "T1027",
                            "remediation": f"Quarantine and remove hidden script `{full_path}`.",
                        })

                    # Check for ransom notes
                    if any(rt in entry.lower() for rt in ransom_triggers):
                        findings.append({
                            "severity": "CRITICAL",
                            "category": "Ransomware Note Detected",
                            "indicator": f"Potential ransomware instruction artifact: {full_path}",
                            "path": full_path,
                            "mitre_id": "T1486",
                            "remediation": "URGENT: Isolate host from network immediately. Review active processes for file encryptors.",
                        })

                    # Small file content check for webshell / raw payload
                    if os.path.isfile(full_path) and os.path.getsize(full_path) < 100000:
                        try:
                            with open(full_path, "r", errors="ignore") as f:
                                sample = f.read(2048)
                                for ws in webshell_triggers:
                                    if ws in sample:
                                        findings.append({
                                            "severity": "CRITICAL",
                                            "category": "Webshell / Code Injection Payload",
                                            "indicator": f"Webshell execution string '{ws}' detected in {full_path}",
                                            "path": full_path,
                                            "mitre_id": "T1505.003",
                                            "remediation": f"Quarantine file `{full_path}` and inspect web server access logs.",
                                        })
                                        break
                        except Exception:
                            pass
            except Exception:
                pass

        return findings

    def check_dns_and_hosts_tampering(self) -> List[Dict[str, Any]]:
        """
        DNS & Hosts File Tampering Check:
        Verifies that /etc/hosts or Windows hosts file has not been hijacked
        to block antivirus updates or route security portals to loopback or rogue servers.
        """
        findings = []
        is_windows = (sys.platform == "win32") or (os.name == "nt")
        hosts_file = (
            "C:\\Windows\\System32\\drivers\\etc\\hosts"
            if is_windows
            else "/etc/hosts"
        )

        security_domains = [
            "windowsupdate.com",
            "microsoft.com",
            "virustotal.com",
            "kaspersky.com",
            "avast.com",
            "bitdefender.com",
            "mcafee.com",
            "symantec.com",
            "malwarebytes.com",
            "eset.com",
            "sophos.com",
        ]

        if os.path.exists(hosts_file):
            try:
                with open(hosts_file, "r", errors="ignore") as f:
                    for line in f:
                        line_clean = line.strip()
                        if line_clean and not line_clean.startswith("#"):
                            parts = line_clean.split()
                            if len(parts) >= 2:
                                ip_target = parts[0]
                                domain = parts[1].lower()
                                for sec in security_domains:
                                    if sec in domain:
                                        findings.append({
                                            "severity": "HIGH",
                                            "category": "Hosts File DNS Hijacking",
                                            "indicator": f"Hosts file redirects security domain '{domain}' to '{ip_target}' in {hosts_file}",
                                            "path": hosts_file,
                                            "mitre_id": "T1565.001",
                                            "remediation": f"Remove hijacked domain `{domain}` from `{hosts_file}` and restore DNS integrity.",
                                        })
            except Exception:
                pass

        return findings

    def check_cryptominers(self) -> List[Dict[str, Any]]:
        """
        Cryptominer & Stratum Protocol Audit:
        Checks for stratum pool listener sockets and miner configuration artifacts.
        """
        findings = []
        miner_config_candidates = [
            "/tmp/config.json",
            "/tmp/xmrig.json",
            "/dev/shm/config.json",
            "C:\\Windows\\Temp\\config.json",
        ]

        for cfg in miner_config_candidates:
            if os.path.exists(cfg):
                try:
                    with open(cfg, "r", errors="ignore") as f:
                        content = f.read(4096)
                        if any(pool in content.lower() for pool in ["stratum+tcp", "monero", "hashvault", "nanopool", "supportxmr", "nicehash"]):
                            findings.append({
                                "severity": "HIGH",
                                "category": "Cryptomining Configuration File",
                                "indicator": f"Cryptocurrency mining pool config found at {cfg}",
                                "path": cfg,
                                "mitre_id": "T1496",
                                "remediation": f"Remove miner configuration file `{cfg}` and terminate associated mining processes.",
                            })
                except Exception:
                    pass

        return findings

    def check_kernel_rootkits_and_modules(self) -> List[Dict[str, Any]]:
        """
        Kernel Rootkit & Userland Hooking Audit:
        Checks for /etc/ld.so.preload injection (userland rootkits), hidden LKM kernel modules,
        and suspicious tainted kernel modules.
        """
        findings = []
        is_windows = (sys.platform == "win32") or (os.name == "nt")

        if not is_windows:
            # 1. /etc/ld.so.preload Check (Classic Linux userland rootkit)
            ld_preload = "/etc/ld.so.preload"
            if os.path.exists(ld_preload):
                try:
                    with open(ld_preload, "r", errors="ignore") as f:
                        content = f.read().strip()
                        if content:
                            findings.append({
                                "severity": "CRITICAL",
                                "category": "Rootkit / Userland Hooking",
                                "indicator": f"Suspicious /etc/ld.so.preload active hooking library: '{content[:80]}'",
                                "path": ld_preload,
                                "mitre_id": "T1574.006",
                                "remediation": f"Inspect and remove rogue library from `{ld_preload}` immediately. System calls may be intercepted.",
                            })
                except Exception:
                    pass

            # 2. Kernel Modules Check (/proc/modules)
            known_rootkit_modules = ["diamorphine", "adore", "reptile", "suterusu", "knark", "slub_debug", "kbeast"]
            if os.path.exists("/proc/modules"):
                try:
                    with open("/proc/modules", "r", errors="ignore") as f:
                        for line in f:
                            mod_name = line.split()[0].lower() if line.split() else ""
                            for rk in known_rootkit_modules:
                                if rk in mod_name:
                                    findings.append({
                                        "severity": "CRITICAL",
                                        "category": "Loadable Kernel Module (LKM) Rootkit",
                                        "indicator": f"Known malicious kernel rootkit module '{mod_name}' loaded in kernel space",
                                        "mitre_id": "T1547.006",
                                        "remediation": f"Unload module immediately with `rmmod {mod_name}` and reboot into a known clean kernel image.",
                                    })
                except Exception:
                    pass

            # 3. Kernel tainted status check
            if os.path.exists("/proc/sys/kernel/tainted"):
                try:
                    with open("/proc/sys/kernel/tainted", "r") as f:
                        taint_val = int(f.read().strip() or "0")
                        # Bit 12 (4096) = unsigned module loaded
                        if taint_val & 4096:
                            findings.append({
                                "severity": "MEDIUM",
                                "category": "Kernel Integrity Warning",
                                "indicator": f"Kernel is tainted (taint code {taint_val}): Out-of-tree or unsigned kernel module loaded.",
                                "mitre_id": "T1547.006",
                                "remediation": "Review loaded kernel modules (`lsmod`) for unrecognized third-party drivers.",
                            })
                except Exception:
                    pass
        else:
            # Windows unsigned driver check
            pass

        return findings

    def check_ssh_backdoors_and_authorized_keys(self) -> List[Dict[str, Any]]:
        """
        SSH Backdoors & Rogue Authorized Keys Check:
        Scans all user authorized_keys and sshd configurations for backdoor keys,
        forced command execution, and unauthorized port forwarding.
        """
        findings = []
        is_windows = (sys.platform == "win32") or (os.name == "nt")

        if not is_windows:
            ssh_key_paths = [
                "/root/.ssh/authorized_keys",
                os.path.expanduser("~/.ssh/authorized_keys"),
            ]
            # Also check /home/*/.ssh/authorized_keys
            if os.path.exists("/home"):
                try:
                    for u in os.listdir("/home"):
                        user_ak = os.path.join("/home", u, ".ssh", "authorized_keys")
                        if os.path.exists(user_ak):
                            ssh_key_paths.append(user_ak)
                except Exception:
                    pass

            for ak_path in set(ssh_key_paths):
                if os.path.exists(ak_path):
                    try:
                        with open(ak_path, "r", errors="ignore") as f:
                            for idx, line in enumerate(f, 1):
                                line_clean = line.strip()
                                if line_clean and not line_clean.startswith("#"):
                                    # Check for forced command backdoors
                                    if "command=" in line_clean.lower():
                                        findings.append({
                                            "severity": "CRITICAL",
                                            "category": "SSH Forced Command Backdoor",
                                            "indicator": f"Forced command backdoor in {ak_path}:{idx}: '{line_clean[:60]}...'",
                                            "path": ak_path,
                                            "mitre_id": "T1098.004",
                                            "remediation": f"Inspect line {idx} in `{ak_path}` and remove unauthorized SSH forced execution triggers.",
                                        })
                                    # Check for overly permissive or suspicious comment tags
                                    if any(susp in line_clean.lower() for susp in ["miner", "rootkit", "backdoor", "c2", "hacked"]):
                                        findings.append({
                                            "severity": "HIGH",
                                            "category": "Suspicious SSH Key Tag",
                                            "indicator": f"Suspicious SSH key metadata in {ak_path}:{idx}",
                                            "path": ak_path,
                                            "mitre_id": "T1098.004",
                                            "remediation": f"Remove unverified SSH key from `{ak_path}`.",
                                        })
                    except Exception:
                        pass

        return findings

    def check_webshells_and_file_integrity(self) -> List[Dict[str, Any]]:
        """
        Web Shell & Malicious Script File Audit:
        Scans staging and web roots for obfuscated webshell triggers (eval base64, passthru, system).
        """
        findings = []
        web_roots = [
            "/var/www",
            "/srv/http",
            "/srv/www",
            "/usr/share/nginx/html",
            "/tmp",
            "/var/tmp",
            "/dev/shm",
        ]

        webshell_signatures = [
            {"sig": "eval(base64_decode", "name": "Base64 Encoded Web Shell Evaluator"},
            {"sig": "gzinflate(base64_decode", "name": "Compressed Obfuscated Web Shell"},
            {"sig": "passthru($_POST", "name": "Direct POST Command Passthru"},
            {"sig": "system($_GET", "name": "Direct GET Shell Command Invocation"},
            {"sig": "shell_exec($_REQUEST", "name": "Shell Execution Web Door"},
            {"sig": "b374k", "name": "b374k Web Shell Signature"},
            {"sig": "c99shell", "name": "c99 Web Shell Signature"},
            {"sig": "WSOsetcookie", "name": "WSO Stealth Web Shell"},
        ]

        for root in web_roots:
            if os.path.exists(root) and os.path.isdir(root):
                try:
                    for dirpath, _, filenames in os.walk(root):
                        # Max depth 2 to prevent slow scans
                        rel = os.path.relpath(dirpath, root)
                        if rel.count(os.sep) > 2:
                            continue

                        for fname in filenames:
                            if any(fname.endswith(ext) for ext in [".php", ".phtml", ".jsp", ".jspx", ".asp", ".aspx", ".py", ".sh", ".pl"]):
                                full_p = os.path.join(dirpath, fname)
                                try:
                                    if os.path.isfile(full_p) and os.path.getsize(full_p) < 250000:
                                        with open(full_p, "r", errors="ignore") as f:
                                            chunk = f.read(8192)
                                            for wsig in webshell_signatures:
                                                if wsig["sig"] in chunk:
                                                    findings.append({
                                                        "severity": "CRITICAL",
                                                        "category": "Web Shell Backdoor",
                                                        "indicator": f"{wsig['name']} found in script `{full_p}`",
                                                        "path": full_p,
                                                        "mitre_id": "T1505.003",
                                                        "remediation": f"Quarantine or delete `{full_p}` immediately and review web server access logs for remote commands.",
                                                    })
                                                    break
                                except Exception:
                                    pass
                except Exception:
                    pass

        return findings

    def check_suid_privilege_escalation_backdoors(self) -> List[Dict[str, Any]]:
        """
        SUID / SGID Privilege Escalation Backdoor Check:
        Detects rogue SUID binaries placed in temp folders or elevated shell binaries.
        """
        findings = []
        is_windows = (sys.platform == "win32") or (os.name == "nt")

        if not is_windows:
            search_dirs = ["/tmp", "/var/tmp", "/dev/shm", "/home"]
            for d in search_dirs:
                if os.path.exists(d):
                    try:
                        for dirpath, _, filenames in os.walk(d):
                            if os.path.relpath(dirpath, d).count(os.sep) > 2:
                                continue
                            for fname in filenames:
                                full_p = os.path.join(dirpath, fname)
                                try:
                                    if os.path.isfile(full_p):
                                        st_mode = os.stat(full_p).st_mode
                                        # Check SUID (0o4000) or SGID (0o2000)
                                        if (st_mode & 0o4000) or (st_mode & 0o2000):
                                            findings.append({
                                                "severity": "CRITICAL",
                                                "category": "SUID Escalation Backdoor",
                                                "indicator": f"Rogue SUID binary discovered in staging folder: {full_p} (Mode: {oct(st_mode)})",
                                                "path": full_p,
                                                "mitre_id": "T1548.001",
                                                "remediation": f"Remove SUID permission with `chmod u-s {full_p}` or delete the suspicious binary.",
                                            })
                                except Exception:
                                    pass
                    except Exception:
                        pass

        return findings

    def check_scheduled_tasks_and_at_jobs(self) -> List[Dict[str, Any]]:
        """
        Cron & Scheduled Task Beaconing Audit:
        Inspects crontabs and scheduled tasks for external IP pipes (curl/wget | bash).
        """
        findings = []
        is_windows = (sys.platform == "win32") or (os.name == "nt")

        if not is_windows:
            cron_files = [
                "/etc/crontab",
                "/etc/cron.hourly",
                "/etc/cron.daily",
            ]
            for cf in cron_files:
                if os.path.exists(cf):
                    try:
                        if os.path.isfile(cf):
                            with open(cf, "r", errors="ignore") as f:
                                for line in f:
                                    line_clean = line.strip()
                                    if any(x in line_clean.lower() for x in ["| bash", "| sh", "curl -s", "wget -q", "python -c 'import socket"]):
                                        findings.append({
                                            "severity": "HIGH",
                                            "category": "Suspicious Cron Execution",
                                            "indicator": f"Suspicious remote fetch/pipe command in {cf}: '{line_clean[:80]}'",
                                            "path": cf,
                                            "mitre_id": "T1053.003",
                                            "remediation": f"Audit `{cf}` and eliminate unauthorized remote script downloads.",
                                        })
                    except Exception:
                        pass

        return findings

    def run_comprehensive_malware_audit(self) -> Dict[str, Any]:
        """
        Unified Multi-Vector Malware Audit Engine:
        Executes all 11 malware detection modules across processes, persistence,
        sockets, file artifacts, hosts file, cryptominers, rootkits, ssh keys,
        webshells, SUID backdoors, and scheduled tasks.
        """
        st = time.time()
        is_windows = (sys.platform == "win32") or (os.name == "nt")
        platform_name = "Windows 11" if is_windows else f"Linux ({os.uname().sysname if hasattr(os, 'uname') else 'POSIX'})"

        proc_findings = self.check_malware_processes()
        persist_findings = self.check_malware_persistence()
        socket_findings = self.check_reverse_shells_and_sockets()
        artifact_findings = self.check_sensitive_directories_for_artifacts()
        hosts_findings = self.check_dns_and_hosts_tampering()
        miner_findings = self.check_cryptominers()
        rootkit_findings = self.check_kernel_rootkits_and_modules()
        ssh_findings = self.check_ssh_backdoors_and_authorized_keys()
        webshell_findings = self.check_webshells_and_file_integrity()
        suid_findings = self.check_suid_privilege_escalation_backdoors()
        cron_findings = self.check_scheduled_tasks_and_at_jobs()

        all_findings = (
            proc_findings
            + persist_findings
            + socket_findings
            + artifact_findings
            + hosts_findings
            + miner_findings
            + rootkit_findings
            + ssh_findings
            + webshell_findings
            + suid_findings
            + cron_findings
        )

        critical_count = sum(1 for f in all_findings if f.get("severity") == "CRITICAL")
        high_count = sum(1 for f in all_findings if f.get("severity") == "HIGH")
        medium_count = sum(1 for f in all_findings if f.get("severity") == "MEDIUM")

        # Health score calculation: 100 - (critical * 35 + high * 18 + medium * 8)
        penalty = (critical_count * 35) + (high_count * 18) + (medium_count * 8)
        health_score = max(0, 100 - penalty)

        if critical_count > 0:
            status = "ACTIVE MALWARE INFECTION DETECTED"
            risk_grade = "CRITICAL"
        elif high_count > 0:
            status = "SUSPICIOUS MALWARE INDICATORS IDENTIFIED"
            risk_grade = "HIGH"
        elif all_findings:
            status = "LOW RISK ARTIFACTS PRESENT"
            risk_grade = "ELEVATED"
        else:
            status = "HOST SYSTEM INTEGRITY VERIFIED (CLEAN)"
            risk_grade = "CLEAN"

        duration_ms = round((time.time() - st) * 1000, 2)

        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "platform": platform_name,
            "status": status,
            "risk_grade": risk_grade,
            "health_score": health_score,
            "total_checks_run": 11,
            "threats_detected": len(all_findings),
            "critical_count": critical_count,
            "high_count": high_count,
            "medium_count": medium_count,
            "findings": all_findings,
            "module_breakdown": {
                "process_forensics": {"threats": len(proc_findings), "status": "FAIL" if proc_findings else "PASS", "label": "Process Forensics & Memory Evasion"},
                "persistence_mechanisms": {"threats": len(persist_findings), "status": "FAIL" if persist_findings else "PASS", "label": "Persistence & Autorun Services"},
                "reverse_shells_sockets": {"threats": len(socket_findings), "status": "FAIL" if socket_findings else "PASS", "label": "Reverse Shells & Raw Sockets"},
                "staging_dir_artifacts": {"threats": len(artifact_findings), "status": "FAIL" if artifact_findings else "PASS", "label": "Staging Directory Artifacts"},
                "dns_hosts_tampering": {"threats": len(hosts_findings), "status": "FAIL" if hosts_findings else "PASS", "label": "DNS & Hosts Hijacking"},
                "cryptominers": {"threats": len(miner_findings), "status": "FAIL" if miner_findings else "PASS", "label": "Cryptominers & Stratum Pools"},
                "rootkits_and_preload": {"threats": len(rootkit_findings), "status": "FAIL" if rootkit_findings else "PASS", "label": "LKM Rootkits & ld.so.preload"},
                "ssh_backdoors": {"threats": len(ssh_findings), "status": "FAIL" if ssh_findings else "PASS", "label": "SSH Keys & Forced Commands"},
                "webshell_integrity": {"threats": len(webshell_findings), "status": "FAIL" if webshell_findings else "PASS", "label": "Web Shells & Injected Scripts"},
                "suid_escalation": {"threats": len(suid_findings), "status": "FAIL" if suid_findings else "PASS", "label": "SUID Escalation Backdoors"},
                "scheduled_tasks": {"threats": len(cron_findings), "status": "FAIL" if cron_findings else "PASS", "label": "Scheduled Tasks & Cron Pipes"},
            },
            "definitions_loaded": len(KNOWN_RAT_REGISTRY),
            "duration_ms": duration_ms,
        }

    def scan_custom_target_path(self, target: str) -> Dict[str, Any]:
        """
        Scans a specific file, directory, or PID for malware artifacts or process anomalies.
        """
        st = time.time()
        findings = []

        if target.isdigit():
            # Treat as PID
            pid = int(target)
            if os.path.exists(f"/proc/{pid}"):
                try:
                    exe = os.readlink(f"/proc/{pid}/exe")
                    with open(f"/proc/{pid}/cmdline", "rb") as f:
                        cmdline = f.read(512).replace(b"\x00", b" ").decode("latin-1", errors="ignore")
                    if "(deleted)" in exe:
                        findings.append({
                            "severity": "CRITICAL",
                            "indicator": f"PID {pid} executes deleted binary: {exe}",
                            "mitre_id": "T1059.004",
                        })
                    findings.append({
                        "info": f"PID {pid} process inspected: {cmdline[:80]}",
                        "exe": exe,
                    })
                except Exception as e:
                    findings.append({"error": str(e)})
            else:
                findings.append({"error": f"Process PID {pid} is not running."})
        elif os.path.exists(target):
            # Treat as file/directory
            if os.path.isfile(target):
                size = os.path.getsize(target)
                sample = ""
                try:
                    with open(target, "r", errors="ignore") as f:
                        sample = f.read(4096)
                except Exception:
                    pass

                webshell_triggers = ["eval(base64_decode", "system($_GET", "passthru($_POST", "shell_exec", "powershell -enc"]
                for tr in webshell_triggers:
                    if tr in sample:
                        findings.append({
                            "severity": "CRITICAL",
                            "indicator": f"Suspicious malware execution pattern '{tr}' in file {target}",
                            "mitre_id": "T1059",
                        })
                findings.append({
                    "path": target,
                    "size_bytes": size,
                    "status": "SUSPICIOUS" if findings else "CLEAN",
                })
        else:
            findings.append({"error": f"Target path or PID '{target}' was not found on local system."})

        return {
            "target": target,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "findings": findings,
            "threats_count": len([f for f in findings if "severity" in f]),
            "duration_ms": round((time.time() - st) * 1000, 2),
        }

    def audit_local_system_integrity(self) -> Dict[str, Any]:
        """Runs the comprehensive multi-vector host integrity & malware audit."""
        return self.run_comprehensive_malware_audit()
