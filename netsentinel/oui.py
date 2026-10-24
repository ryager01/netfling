"""
NetSentinel OUI (Organizationally Unique Identifier) Vendor Resolution Engine.
Resolves hardware manufacturers from MAC addresses using an offline prefix registry
and detects locally administered / private randomized MACs (iOS, Android, Windows).
"""

import re
from typing import Optional

# Comprehensive offline dictionary of major IEEE OUI prefixes (normalized without colons/dashes, uppercase)
OUI_DATABASE = {
    # Apple Inc.
    "0017F2": "Apple, Inc.",
    "0019E3": "Apple, Inc.",
    "001C42": "Parallels / Apple VM",
    "001D4F": "Apple, Inc.",
    "001E52": "Apple, Inc.",
    "002312": "Apple, Inc.",
    "002500": "Apple, Inc.",
    "002608": "Apple, Inc.",
    "003EE1": "Apple, Inc.",
    "040CCE": "Apple, Inc.",
    "041552": "Apple, Inc.",
    "042665": "Apple, Inc.",
    "04DB56": "Apple, Inc.",
    "04E536": "Apple, Inc.",
    "086698": "Apple, Inc.",
    "0C4DE9": "Apple, Inc.",
    "1040F3": "Apple, Inc.",
    "147DDA": "Apple, Inc.",
    "18AF61": "Apple, Inc.",
    "1C1A6E": "Apple, Inc.",
    "20A2E4": "Apple, Inc.",
    "28CFDA": "Apple, Inc.",
    "2CBE08": "Apple, Inc.",
    "3035AD": "Apple, Inc.",
    "34159E": "Apple, Inc.",
    "38F9D3": "Apple, Inc.",
    "3C15C2": "Apple, Inc.",
    "406C8F": "Apple, Inc.",
    "442A60": "Apple, Inc.",
    "48D705": "Apple, Inc.",
    "4C3275": "Apple, Inc.",
    "50BC96": "Apple, Inc.",
    "542696": "Apple, Inc.",
    "5C969D": "Apple, Inc.",
    "600308": "Apple, Inc.",
    "64A5C3": "Apple, Inc.",
    "68D93C": "Apple, Inc.",
    "6C4008": "Apple, Inc.",
    "701124": "Apple, Inc.",
    "748D08": "Apple, Inc.",
    "784F43": "Apple, Inc.",
    "7CD1C3": "Apple, Inc.",
    "804971": "Apple, Inc.",
    "843835": "Apple, Inc.",
    "88665A": "Apple, Inc.",
    "8C8590": "Apple, Inc.",
    "9027E4": "Apple, Inc.",
    "9801A7": "Apple, Inc.",
    "A07888": "Apple, Inc.",
    "A483E7": "Apple, Inc.",
    "ACBC32": "Apple, Inc.",
    "B065BD": "Apple, Inc.",
    "B4430D": "Apple, Inc.",
    "B8782E": "Apple, Inc.",
    "BC926B": "Apple, Inc.",
    "C0B658": "Apple, Inc.",
    "C869CD": "Apple, Inc.",
    "CC29F5": "Apple, Inc.",
    "D0034B": "Apple, Inc.",
    "D89695": "Apple, Inc.",
    "DC2B61": "Apple, Inc.",
    "E0ACCB": "Apple, Inc.",
    "E4CE8F": "Apple, Inc.",
    "E8802E": "Apple, Inc.",
    "EC3586": "Apple, Inc.",
    "F01898": "Apple, Inc.",
    "F4F15A": "Apple, Inc.",
    "F81EDF": "Apple, Inc.",
    "FC253F": "Apple, Inc.",

    # Google / Alphabet
    "001A11": "Google, Inc.",
    "3C5AB4": "Google, Inc. (Chromecast)",
    "546009": "Google, Inc. (Nest)",
    "641666": "Google, Inc. (Pixel)",
    "94EB2C": "Google, Inc.",
    "A47733": "Google, Inc. (Nest)",
    "D86C63": "Google, Inc.",
    "E4F042": "Google, Inc.",
    "F4F5D8": "Google, Inc. (Google Home)",
    "F80F41": "Google, Inc.",

    # Amazon
    "00FC8B": "Amazon Technologies Inc.",
    "18742E": "Amazon Technologies Inc. (Echo)",
    "34D270": "Amazon Technologies Inc.",
    "40B4CD": "Amazon Technologies Inc. (Fire TV)",
    "44650D": "Amazon Technologies Inc.",
    "50F5DA": "Amazon Technologies Inc. (Echo/Kindle)",
    "6854FD": "Amazon Technologies Inc.",
    "747548": "Amazon Technologies Inc. (Ring)",
    "AC63BE": "Amazon Technologies Inc.",
    "CC9E00": "Amazon Technologies Inc.",
    "FC65DE": "Amazon Technologies Inc.",
    "FC7BE8": "Amazon Technologies Inc.",

    # Raspberry Pi Foundation
    "B827EB": "Raspberry Pi Foundation",
    "DC2632": "Raspberry Pi Trading Ltd",
    "E45F01": "Raspberry Pi Trading Ltd",
    "28CDC1": "Raspberry Pi Trading Ltd",

    # Espressif Systems (ESP8266, ESP32 IoT devices)
    "18FE34": "Espressif Systems (ESP8266/ESP32)",
    "240AC4": "Espressif Systems (ESP32)",
    "246F28": "Espressif Systems (ESP32)",
    "2C3AE8": "Espressif Systems (ESP32)",
    "30AEA4": "Espressif Systems (ESP32)",
    "3C71BF": "Espressif Systems (ESP32)",
    "4C7525": "Espressif Systems (ESP32)",
    "5C0272": "Espressif Systems (ESP32)",
    "68C63A": "Espressif Systems (ESP32)",
    "7CDFA1": "Espressif Systems (ESP32)",
    "840D8E": "Espressif Systems (ESP32)",
    "84F3EB": "Espressif Systems (ESP32)",
    "94B97E": "Espressif Systems (ESP32)",
    "A4CF12": "Espressif Systems (ESP32)",
    "A842E3": "Espressif Systems (ESP32)",
    "AC67B2": "Espressif Systems (ESP32)",
    "B4E62D": "Espressif Systems (ESP32)",
    "C44F33": "Espressif Systems (ESP32)",
    "CC50E3": "Espressif Systems (ESP32)",
    "DC4F22": "Espressif Systems (ESP32)",
    "E09806": "Espressif Systems (ESP32)",
    "ECFABC": "Espressif Systems (ESP32)",

    # Cisco Systems
    "00000C": "Cisco Systems, Inc.",
    "000142": "Cisco Systems, Inc.",
    "000196": "Cisco Systems, Inc.",
    "000427": "Cisco Systems, Inc.",
    "000785": "Cisco Systems, Inc.",
    "0018B9": "Cisco Systems, Inc.",
    "001BD4": "Cisco Systems, Inc.",
    "002155": "Cisco Systems, Inc.",
    "002414": "Cisco Systems, Inc.",
    "706979": "Cisco Meraki",
    "E0553D": "Cisco Meraki",

    # Intel Corporation
    "001B21": "Intel Corporate",
    "001E67": "Intel Corporate",
    "00216A": "Intel Corporate",
    "0024D7": "Intel Corporate",
    "3413E8": "Intel Corporate",
    "4C79BA": "Intel Corporate",
    "6805CA": "Intel Corporate",
    "7C70DB": "Intel Corporate",
    "8086F2": "Intel Corporate",
    "84A93E": "Intel Corporate",
    "8C8D28": "Intel Corporate",
    "902E16": "Intel Corporate",
    "A44CC8": "Intel Corporate",
    "C85B76": "Intel Corporate",
    "DC5360": "Intel Corporate",
    "E4A7A0": "Intel Corporate",

    # Samsung Electronics
    "0012FB": "Samsung Electronics",
    "001599": "Samsung Electronics",
    "0018AF": "Samsung Electronics",
    "0021D2": "Samsung Electronics",
    "0808C2": "Samsung Electronics",
    "0C1420": "Samsung Electronics",
    "101C0C": "Samsung Electronics",
    "14B457": "Samsung Electronics",
    "18227E": "Samsung Electronics",
    "1C5A3E": "Samsung Electronics",
    "205531": "Samsung Electronics",
    "30CDA7": "Samsung Electronics",
    "380B40": "Samsung Electronics",
    "4844F7": "Samsung Electronics",
    "508569": "Samsung Electronics",
    "5C0E8B": "Samsung Electronics",
    "60A10A": "Samsung Electronics",
    "68EBae": "Samsung Electronics",
    "78471D": "Samsung Electronics",
    "8425DB": "Samsung Electronics",
    "9463D1": "Samsung Electronics",
    "A00BBA": "Samsung Electronics",
    "B0C4E7": "Samsung Electronics",
    "CC07AB": "Samsung Electronics",
    "DC7144": "Samsung Electronics",
    "E47CF9": "Samsung Electronics",
    "F49F54": "Samsung Electronics",

    # TP-Link Technologies
    "001D0F": "TP-Link Technologies",
    "002719": "TP-Link Technologies",
    "14CC20": "TP-Link Technologies",
    "1C3BF3": "TP-Link Technologies",
    "30DE4B": "TP-Link Technologies",
    "50C7BF": "TP-Link Technologies (Kasa Smart)",
    "54E6FC": "TP-Link Technologies",
    "60A44C": "TP-Link Technologies",
    "647002": "TP-Link Technologies",
    "704F57": "TP-Link Technologies",
    "7405A5": "TP-Link Technologies",
    "8416F9": "TP-Link Technologies",
    "984827": "TP-Link Technologies",
    "A0F3C1": "TP-Link Technologies",
    "C04A00": "TP-Link Technologies",
    "D84732": "TP-Link Technologies",
    "E848B8": "TP-Link Technologies",
    "EC086B": "TP-Link Technologies",

    # Netgear
    "00095B": "Netgear Inc.",
    "000FB5": "Netgear Inc.",
    "00146C": "Netgear Inc.",
    "00184D": "Netgear Inc.",
    "001E2A": "Netgear Inc.",
    "0024B2": "Netgear Inc.",
    "20E52A": "Netgear Inc.",
    "2C3033": "Netgear Inc.",
    "4494FC": "Netgear Inc.",
    "841B5E": "Netgear Inc.",
    "9C3DCF": "Netgear Inc.",
    "B03956": "Netgear Inc.",
    "C0FFD4": "Netgear Inc.",
    "E4F4C6": "Netgear Inc.",

    # Ubiquiti Networks (UniFi)
    "00156D": "Ubiquiti Networks Inc.",
    "002722": "Ubiquiti Networks Inc.",
    "24A43C": "Ubiquiti Networks Inc.",
    "68D79A": "Ubiquiti Networks Inc.",
    "7483C2": "Ubiquiti Networks Inc.",
    "788A20": "Ubiquiti Networks Inc.",
    "802AA8": "Ubiquiti Networks Inc.",
    "AC8B03": "Ubiquiti Networks Inc.",
    "B4FBE4": "Ubiquiti Networks Inc.",
    "DC9FDB": "Ubiquiti Networks Inc.",
    "E43883": "Ubiquiti Networks Inc.",
    "F09FC2": "Ubiquiti Networks Inc.",

    # Dell Inc.
    "001143": "Dell Inc.",
    "001422": "Dell Inc.",
    "00188B": "Dell Inc.",
    "00219B": "Dell Inc.",
    "180373": "Dell Inc.",
    "3417EB": "Dell Inc.",
    "44A842": "Dell Inc.",
    "847BEB": "Dell Inc.",
    "B8AC6F": "Dell Inc.",
    "F8BC12": "Dell Inc.",

    # HP / Hewlett Packard
    "000802": "Hewlett Packard Enterprise",
    "000E7F": "Hewlett Packard",
    "00110A": "Hewlett Packard",
    "001635": "Hewlett Packard",
    "0025B3": "Hewlett Packard",
    "3CD92B": "HP Inc.",
    "705A0F": "HP Inc.",
    "A0D3C1": "HP Inc.",

    # Synology
    "001132": "Synology Incorporated",

    # QNAP Systems
    "00089B": "QNAP Systems, Inc.",
    "245EBE": "QNAP Systems, Inc.",

    # Sonos
    "000E58": "Sonos, Inc.",
    "5C313E": "Sonos, Inc.",
    "7828CA": "Sonos, Inc.",
    "949F3E": "Sonos, Inc.",
    "B8E937": "Sonos, Inc.",

    # Philips Lighting (Hue)
    "001788": "Philips Lighting (Hue)",
    "ECB5FA": "Philips Lighting (Hue)",

    # Microsoft
    "00155D": "Microsoft Corporation (Hyper-V)",
    "281878": "Microsoft Corporation (Surface/Xbox)",
    "501AC5": "Microsoft Corporation",
    "7C1E52": "Microsoft Corporation",
    "DC537C": "Microsoft Corporation",

    # Sony Interactive / Electronics
    "00041F": "Sony Interactive Entertainment (PlayStation)",
    "001315": "Sony Interactive Entertainment",
    "0015C1": "Sony Interactive Entertainment",
    "709E29": "Sony Interactive Entertainment (PS5)",
    "A8E3EE": "Sony Interactive Entertainment",
    "F8461C": "Sony Interactive Entertainment (PS4)",

    # Xiaomi Communications
    "0C1DAF": "Xiaomi Communications",
    "185936": "Xiaomi Communications",
    "286C07": "Xiaomi Communications",
    "3480D0": "Xiaomi Communications",
    "508F4C": "Xiaomi Communications",
    "640980": "Xiaomi Communications",
    "7C49EB": "Xiaomi Communications",
    "A4C138": "Xiaomi Communications",
    "F01898": "Xiaomi Communications",

    # Huawei
    "001882": "Huawei Technologies Co., Ltd.",
    "00259E": "Huawei Technologies Co., Ltd.",
    "04C06F": "Huawei Technologies Co., Ltd.",
    "20F3A3": "Huawei Technologies Co., Ltd.",
    "4846FB": "Huawei Technologies Co., Ltd.",
    "707B53": "Huawei Technologies Co., Ltd.",
    "AC853D": "Huawei Technologies Co., Ltd.",

    # Asus (ASUSTek)
    "0015F2": "ASUSTek Computer Inc.",
    "001E8C": "ASUSTek Computer Inc.",
    "04D4C4": "ASUSTek Computer Inc.",
    "107B44": "ASUSTek Computer Inc.",
    "2C4D54": "ASUSTek Computer Inc.",
    "38D547": "ASUSTek Computer Inc.",
    "40167E": "ASUSTek Computer Inc.",
    "704D7B": "ASUSTek Computer Inc.",
    "AC9E17": "ASUSTek Computer Inc.",

    # Virtualization & Cloud
    "000569": "VMware, Inc.",
    "000C29": "VMware, Inc.",
    "005056": "VMware, Inc.",
    "080027": "Oracle VirtualBox",
    "525400": "QEMU / KVM Virtual NIC",
}


def is_locally_administered(mac: str) -> bool:
    """
    Checks if a MAC address has the IEEE Locally Administered Address (LAA) bit set.
    Modern iOS, Android, and Windows devices use randomized MACs where bit 1 of byte 0 is 1.
    Hex digits ending in 2, 6, A, E in the first octet indicate private randomization.
    """
    clean_mac = re.sub(r"[^0-9A-Fa-f]", "", mac)
    if len(clean_mac) < 2:
        return False
    first_byte = int(clean_mac[:2], 16)
    return bool(first_byte & 0x02)


def resolve_oui(mac: str) -> str:
    """
    Resolves the vendor name from a MAC address.
    Checks built-in OUI database, then tests for private randomized address.
    """
    if not mac or mac == "00:00:00:00:00:00":
        return "Unknown"

    clean_mac = re.sub(r"[^0-9A-Fa-f]", "", mac).upper()
    if len(clean_mac) < 6:
        return "Generic / Unknown"

    prefix = clean_mac[:6]
    if prefix in OUI_DATABASE:
        return OUI_DATABASE[prefix]

    # Check for Scapy manuf lookup if scapy is present
    try:
        from scapy.data import MANUFDB
        scapy_vendor = MANUFDB._lookup(mac)
        if scapy_vendor and scapy_vendor != mac:
            return str(scapy_vendor)
    except Exception:
        pass

    # Detect private randomized MAC addresses (iOS Private Address, Android MAC Randomization)
    if is_locally_administered(mac):
        return "Private / Randomized MAC (Mobile/OS)"

    return "Generic Network Device"
