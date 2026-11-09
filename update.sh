#!/usr/bin/env bash
# ==============================================================================
# NetSentinel - Linux / macOS GitHub Automated Updater (update.sh)
# ==============================================================================

set -e

REPO="${1:-netfling/netsentinel}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=================================================================="
echo "    [NetSentinel] GitHub Automated Updater (Linux/macOS)"
echo "=================================================================="
echo ""

echo "[1/4] Interrogating GitHub Repository: ${REPO}..."
ZIP_URL="https://github.com/${REPO}/archive/refs/heads/main.zip"
TEMP_DIR="/tmp/netsentinel-update-sh"
TEMP_ZIP="${TEMP_DIR}/main.zip"

rm -rf "${TEMP_DIR}"
mkdir -p "${TEMP_DIR}"

echo "[2/4] Downloading latest code package from GitHub..."
curl -sSL "${ZIP_URL}" -o "${TEMP_ZIP}"

echo "[3/4] Extracting package and updating application files..."
EXTRACT_DIR="${TEMP_DIR}/extracted"
mkdir -p "${EXTRACT_DIR}"
unzip -q "${TEMP_ZIP}" -d "${EXTRACT_DIR}"

ROOT_SOURCE=$(find "${EXTRACT_DIR}" -mindepth 1 -maxdepth 1 -type d | head -n 1)
if [ -z "${ROOT_SOURCE}" ]; then
  ROOT_SOURCE="${EXTRACT_DIR}"
fi

cd "${ROOT_SOURCE}"
find . -type f | while read -r file; do
  rel="${file#./}"
  if [ "${rel}" = "netsentinel.db" ] || [ "${rel}" = "netsentinel.db-wal" ] || [ "${rel}" = ".env" ]; then
    continue
  fi
  mkdir -p "${SCRIPT_DIR}/$(dirname "${rel}")"
  cp -f "${file}" "${SCRIPT_DIR}/${rel}"
done

echo "[4/4] Updating Python & Node dependencies..."
cd "${SCRIPT_DIR}"
if command -v python3 &>/dev/null; then
  python3 -m pip install -r requirements.txt --quiet || true
fi

if command -v npm &>/dev/null; then
  npm run build || true
fi

echo ""
echo "=================================================================="
echo "    [SUCCESS] NetSentinel updated to the latest GitHub version!"
echo "=================================================================="
