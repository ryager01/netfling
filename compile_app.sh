#!/usr/bin/env bash
# ==============================================================================
# NetSentinel Complete Application Build & Compiler Script
# Compiles TypeScript frontend, bundles Vite production assets, and verifies
# Python security engines and SQLite database schema integrity.
# ==============================================================================

set -euo pipefail

BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
RESET="\033[0m"

echo -e "${BOLD}${CYAN}NetSentinel Application Compiler${RESET}"
echo "--------------------------------------------------------"

# 1. Verify Python Engines & Syntax
echo -e "${BOLD}[1/4] Validating Python Security Engines...${RESET}"
PYTHON_BIN="$(command -v python3 || command -v python)"
if [ -z "${PYTHON_BIN}" ]; then
    echo -e "${RED}Error: Python 3 not found in PATH.${RESET}"
    exit 1
fi

"${PYTHON_BIN}" -m py_compile cli.py
for f in netsentinel/*.py; do
    "${PYTHON_BIN}" -m py_compile "$f"
done
echo -e "      ${GREEN}✓ All Python modules validated with zero syntax errors.${RESET}"

# 2. Verify Database Schema & Settings
echo -e "\n${BOLD}[2/4] Initializing Database Schema & Settings...${RESET}"
"${PYTHON_BIN}" -c "
from netsentinel.db import DatabaseEngine
db = DatabaseEngine()
settings = db.get_settings()
print(f'      ✓ Database initialized at {db.db_path} with settings table.')
"

# 3. TypeScript Type-Checking
echo -e "\n${BOLD}[3/4] Running TypeScript Strict Typecheck...${RESET}"
if command -v npm &> /dev/null; then
    npm run lint
else
    npx tsc --noEmit
fi
echo -e "      ${GREEN}✓ TypeScript compilation succeeded with zero type errors.${RESET}"

# 4. Vite Frontend Production Bundle
echo -e "\n${BOLD}[4/4] Compiling Production Static Assets (Vite)...${RESET}"
npm run build

if [ -f "dist/index.html" ]; then
    DIST_SIZE="$(du -sh dist | cut -f1)"
    echo -e "      ${GREEN}✓ Frontend compiled successfully into ./dist (${DIST_SIZE})${RESET}"
else
    echo -e "${RED}Error: Build finished but dist/index.html was not generated.${RESET}"
    exit 1
fi

echo -e "\n${BOLD}${GREEN}✓ Complete application build succeeded!${RESET}"
echo -e "Launch with: ${CYAN}npm run dev${RESET} (dev server) or ${CYAN}npm start${RESET} (production)"
