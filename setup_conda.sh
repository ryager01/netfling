#!/usr/bin/env bash
# ==============================================================================
# NetSentinel Conda Installation, Environment Provisioning & Build Script
# 
# Features:
# 1. Automatically detects system OS (Linux / macOS) and CPU architecture (x86_64 / arm64).
# 2. Downloads and installs Miniconda non-interactively if conda is not detected.
# 3. Creates/updates dedicated isolated 'netsentinel' conda environment (Python 3.11 + Node.js 20).
# 4. Installs all required system, Python, and Node.js dependencies.
# 5. Compiles and builds the complete NetSentinel application for production.
# ==============================================================================

set -euo pipefail

# ANSI Color Codes
BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
RESET="\033[0m"

echo -e "${BOLD}${CYAN}"
echo "=================================================================="
echo "    🛡️  NetSentinel Network Security Intelligence Suite"
echo "    Automated Conda Setup, Environment Provisioning & App Compiler"
echo "=================================================================="
echo -e "${RESET}"

# 1. Detect Architecture and OS
OS="$(uname -s)"
ARCH="$(uname -m)"

echo -e "${BOLD}[1/5] Detecting Operating System and Hardware Architecture...${RESET}"
echo -e "      OS:   ${CYAN}${OS}${RESET}"
echo -e "      Arch: ${CYAN}${ARCH}${RESET}"

CONDA_INSTALL_DIR="${HOME}/miniconda3"
INSTALL_URL=""

if [ "${OS}" = "Linux" ]; then
    if [ "${ARCH}" = "x86_64" ]; then
        INSTALL_URL="https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh"
    elif [ "${ARCH}" = "aarch64" ] || [ "${ARCH}" = "arm64" ]; then
        INSTALL_URL="https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-aarch64.sh"
    else
        echo -e "${RED}Unsupported Linux architecture: ${ARCH}${RESET}"
        exit 1
    fi
elif [ "${OS}" = "Darwin" ]; then
    if [ "${ARCH}" = "arm64" ]; then
        INSTALL_URL="https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-arm64.sh"
    else
        INSTALL_URL="https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-x86_64.sh"
    fi
else
    echo -e "${RED}Unsupported Operating System: ${OS}. NetSentinel requires Linux or macOS.${RESET}"
    exit 1
fi

# 2. Check for Existing Conda Installation or Install Fresh Miniconda
echo -e "\n${BOLD}[2/5] Checking for Conda Installation...${RESET}"
CONDA_BIN=""

if command -v conda &> /dev/null; then
    CONDA_BIN="$(command -v conda)"
    echo -e "      ${GREEN}✓ Found existing conda at: ${CONDA_BIN}${RESET}"
elif [ -f "${CONDA_INSTALL_DIR}/bin/conda" ]; then
    CONDA_BIN="${CONDA_INSTALL_DIR}/bin/conda"
    echo -e "      ${GREEN}✓ Found existing conda at: ${CONDA_BIN}${RESET}"
else
    echo -e "      ${YELLOW}Conda not detected. Downloading Miniconda installer...${RESET}"
    INSTALLER_TMP="/tmp/miniconda_installer_${RANDOM}.sh"

    if command -v curl &> /dev/null; then
        curl -fsSL "${INSTALL_URL}" -o "${INSTALLER_TMP}"
    elif command -v wget &> /dev/null; then
        wget -q "${INSTALL_URL}" -O "${INSTALLER_TMP}"
    else
        echo -e "${RED}Error: Neither curl nor wget is available to download Miniconda.${RESET}"
        exit 1
    fi

    echo -e "      Installing Miniconda silently to ${CONDA_INSTALL_DIR}..."
    bash "${INSTALLER_TMP}" -b -u -p "${CONDA_INSTALL_DIR}"
    rm -f "${INSTALLER_TMP}"
    CONDA_BIN="${CONDA_INSTALL_DIR}/bin/conda"
    echo -e "      ${GREEN}✓ Miniconda installed successfully!${RESET}"
fi

# Initialize conda in current subshell
CONDA_DIR="$(dirname "$(dirname "${CONDA_BIN}")")"
if [ -f "${CONDA_DIR}/etc/profile.d/conda.sh" ]; then
    # shellcheck source=/dev/null
    source "${CONDA_DIR}/etc/profile.d/conda.sh"
fi

# 3. Create or Update 'netsentinel' Conda Environment
ENV_NAME="netsentinel"
echo -e "\n${BOLD}[3/5] Provisioning Conda Environment '${ENV_NAME}'...${RESET}"

if "${CONDA_BIN}" env list | grep -E "^${ENV_NAME}\s" > /dev/null 2>&1; then
    echo -e "      Environment '${ENV_NAME}' already exists. Updating packages..."
    "${CONDA_BIN}" install -y -n "${ENV_NAME}" python=3.11 nodejs=20 npm pip sqlite
else
    echo -e "      Creating fresh conda environment with Python 3.11 and Node.js 20..."
    "${CONDA_BIN}" create -y -n "${ENV_NAME}" python=3.11 nodejs=20 npm pip sqlite
fi

# Activate environment
echo -e "      Activating conda environment '${ENV_NAME}'..."
conda activate "${ENV_NAME}" || true

# 4. Install Application Dependencies
echo -e "\n${BOLD}[4/5] Installing Dependencies inside '${ENV_NAME}'...${RESET}"

echo -e "      Installing Python requirements..."
if [ -f "requirements.txt" ]; then
    pip install --upgrade pip
    pip install -r requirements.txt || true
fi

echo -e "      Installing Node.js packages..."
if command -v npm &> /dev/null; then
    npm install
else
    echo -e "      ${YELLOW}npm not found in active path, using conda npm...${RESET}"
    "${CONDA_DIR}/envs/${ENV_NAME}/bin/npm" install
fi

# 5. Compile Complete Application
echo -e "\n${BOLD}[5/5] Compiling and Building Complete Application...${RESET}"

if [ -f "./compile_app.sh" ]; then
    chmod +x ./compile_app.sh
    ./compile_app.sh
else
    echo -e "      Running TypeScript compiler check..."
    npx tsc --noEmit
    echo -e "      Compiling production assets with Vite..."
    npm run build
fi

echo -e "\n${BOLD}${GREEN}=================================================================="
echo "    ✓ NetSentinel Build & Environment Setup Completed!"
echo "==================================================================${RESET}"
echo -e "To activate your environment and launch NetSentinel:"
echo -e "  1. Activate conda:  ${CYAN}conda activate ${ENV_NAME}${RESET}"
echo -e "  2. Start Web GUI:   ${CYAN}npm run dev${RESET}  (or ${CYAN}npm start${RESET})"
echo -e "  3. Open Browser:    ${CYAN}http://localhost:3000${RESET}"
echo -e "  4. Run CLI scan:    ${CYAN}python3 cli.py --scan${RESET}"
echo -e "  5. Launch daemon:   ${CYAN}python3 cli.py --daemon --interval 15${RESET}"
echo "=================================================================="
