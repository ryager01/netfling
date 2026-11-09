"""
NetSentinel Windows 11 Installer Packager.
Generates a self-contained Windows 11 installation zip bundle containing all
launchers, setup scripts, backend modules, and compiled assets.
"""

import os
import sys
import zipfile
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
OUTPUT_ZIP = Path("/tmp/NetSentinel-Windows11-Setup.zip")

EXCLUDE_DIRS = {
    "node_modules",
    ".git",
    "__pycache__",
    ".aistudio",
    ".cache",
    ".vite",
}

EXCLUDE_FILES = {
    "netsentinel.db",
    "netsentinel.db-wal",
    "netsentinel.db-shm",
}


def build_windows11_package(output_path: Path = OUTPUT_ZIP) -> str:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output_path, "w", compression=zipfile.ZIP_DEFLATED) as z:
        # Include primary installer launchers explicitly
        for fname in [
            "install-windows11.bat",
            "create-shortcut.bat",
            "install.bat",
            "install.ps1",
            "start.bat",
            "run.bat",
            "cli.py",
            "server.ts",
            "package.json",
            "requirements.txt",
            "environment.yml",
            "tsconfig.json",
            "vite.config.ts",
            "index.html",
        ]:
            fpath = ROOT_DIR / fname
            if fpath.is_file():
                z.write(fpath, fname)

        # Include netsentinel python module
        netsentinel_dir = ROOT_DIR / "netsentinel"
        if netsentinel_dir.is_dir():
            for root, dirs, files in os.walk(netsentinel_dir):
                dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
                for file in files:
                    if file in EXCLUDE_FILES or file.endswith(".pyc"):
                        continue
                    full_p = Path(root) / file
                    arcname = full_p.relative_to(ROOT_DIR)
                    z.write(full_p, str(arcname))

        # Include dist/ compiled assets if present
        dist_dir = ROOT_DIR / "dist"
        if dist_dir.is_dir():
            for root, dirs, files in os.walk(dist_dir):
                for file in files:
                    full_p = Path(root) / file
                    arcname = full_p.relative_to(ROOT_DIR)
                    z.write(full_p, str(arcname))

        # Include src/
        src_dir = ROOT_DIR / "src"
        if src_dir.is_dir():
            for root, dirs, files in os.walk(src_dir):
                dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
                for file in files:
                    full_p = Path(root) / file
                    arcname = full_p.relative_to(ROOT_DIR)
                    z.write(full_p, str(arcname))

        # Write README_WINDOWS11.md inside zip
        readme_content = """# NetSentinel - Windows 11 Installation Guide

### Quick Start (Windows 11)
1. Extract all files from this archive to a folder (e.g. `C:\\NetSentinel` or `%USERPROFILE%\\NetSentinel`).
2. Right-click `install-windows11.bat` and select **"Run as administrator"** (or double-click to run in user mode).
3. The installer will automatically:
   - Validate 64-bit Windows 11 architecture.
   - Detect or install Miniconda3 silently into `%USERPROFILE%\\miniconda3`.
   - Provision the dedicated `netsentinel` Conda environment (Python 3.11 + Node.js 20).
   - Install all Python security modules and Node.js dependencies.
   - Create a desktop shortcut named **"NetSentinel Security"** on your Windows 11 Desktop.
   - Create a Start Menu shortcut under `Programs > NetSentinel`.
   - Add an inbound firewall rule for Port 3000 in Windows Defender Firewall.
   - Compile the production frontend bundle.
4. Launch NetSentinel anytime by double-clicking the **"NetSentinel Security"** shortcut on your Desktop or executing `start.bat`.
5. Open your browser at: `http://localhost:3000`

### Optional Raw Packet Driver:
For low-level kernel promiscuous ARP & Wi-Fi monitor mode, install Npcap from https://npcap.com/.
"""
        z.writestr("README_WINDOWS11.md", readme_content)

    return str(output_path)


if __name__ == "__main__":
    path = build_windows11_package()
    print(f"Windows 11 installer zip package created at: {path} ({os.path.getsize(path)} bytes)")
