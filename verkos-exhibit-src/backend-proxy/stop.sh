#!/bin/bash
# Stop Backend CORS Proxy and Cloudflare Tunnel

set -e

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

LOG_DIR="./logs"
CLOUDFLARED_PID_FILE="${LOG_DIR}/cloudflared.pid"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🛑 Stopping Backend Proxy and Cloudflare Tunnel                 ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Stop Docker containers
echo -e "${YELLOW}🐳 Stopping Docker containers...${NC}"
docker compose down
echo -e "${GREEN}✅ Docker containers stopped${NC}"
echo ""

# Stop Cloudflare tunnel
echo -e "${YELLOW}🌐 Stopping Cloudflare tunnel...${NC}"

# Try to stop via PID file first
if [ -f "${CLOUDFLARED_PID_FILE}" ]; then
    PID=$(cat "${CLOUDFLARED_PID_FILE}")
    if ps -p $PID > /dev/null 2>&1; then
        echo -e "${YELLOW}   Stopping cloudflared (PID: ${PID})...${NC}"
        kill $PID 2>/dev/null || true
        sleep 1
    fi
    rm -f "${CLOUDFLARED_PID_FILE}"
fi

# Kill any remaining cloudflared processes
PIDS=$(pgrep -f cloudflared || true)
if [ -n "$PIDS" ]; then
    echo -e "${YELLOW}   Found cloudflared processes: ${PIDS}${NC}"
    pkill -9 cloudflared || true
    echo -e "${GREEN}✅ Cloudflare tunnel stopped${NC}"
else
    echo -e "${GREEN}✅ No cloudflared processes found${NC}"
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✅ All services stopped                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
