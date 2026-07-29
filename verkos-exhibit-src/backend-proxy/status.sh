#!/bin/bash
# Check Status of Backend CORS Proxy and Cloudflare Tunnel

set -e

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

LOG_DIR="./logs"
CLOUDFLARED_PID_FILE="${LOG_DIR}/cloudflared.pid"
CLOUDFLARED_LOG="${LOG_DIR}/cloudflared.log"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     📊 Backend Proxy & Cloudflare Tunnel Status                     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check Docker containers
echo -e "${YELLOW}🐳 Docker Containers:${NC}"
docker compose ps || echo -e "${RED}   ❌ No containers running${NC}"
echo ""

# Check nginx proxy health
echo -e "${YELLOW}🏥 Nginx Proxy Health:${NC}"
if curl -s http://localhost:8888/health > /dev/null 2>&1; then
    HEALTH_MSG=$(curl -s http://localhost:8888/health)
    echo -e "${GREEN}   ✅ ${HEALTH_MSG}${NC}"
else
    echo -e "${RED}   ❌ Nginx proxy not responding${NC}"
fi
echo ""

# Check Cloudflare tunnel
echo -e "${YELLOW}🌐 Cloudflare Tunnel:${NC}"

CLOUDFLARED_PIDS=$(pgrep -f cloudflared || true)
if [ -n "$CLOUDFLARED_PIDS" ]; then
    echo -e "${GREEN}   ✅ Cloudflared is running (PIDs: ${CLOUDFLARED_PIDS})${NC}"
    
    # Try to get tunnel URL from logs
    if [ -f "${CLOUDFLARED_LOG}" ]; then
        TUNNEL_URL=$(grep -o 'https://[^/]*\.trycloudflare\.com' ${CLOUDFLARED_LOG} | tail -1)
        if [ -n "$TUNNEL_URL" ]; then
            echo -e "${GREEN}   ✅ Tunnel URL: ${TUNNEL_URL}${NC}"
        fi
    fi
    
    # Show PID file status
    if [ -f "${CLOUDFLARED_PID_FILE}" ]; then
        SAVED_PID=$(cat "${CLOUDFLARED_PID_FILE}")
        echo -e "${GREEN}   ✅ PID file: ${SAVED_PID}${NC}"
    fi
else
    echo -e "${RED}   ❌ No cloudflared processes found${NC}"
fi
echo ""

# Show log locations
echo -e "${YELLOW}📁 Log Files:${NC}"
echo -e "   Cloudflare: ${BLUE}${CLOUDFLARED_LOG}${NC}"
echo -e "   Nginx:      ${BLUE}${LOG_DIR}/proxy_access.log${NC}"
echo -e "   Errors:     ${BLUE}${LOG_DIR}/proxy_error.log${NC}"
echo ""

# Show recent cloudflare logs (last 5 lines)
if [ -f "${CLOUDFLARED_LOG}" ]; then
    echo -e "${YELLOW}📄 Recent Cloudflare Logs:${NC}"
    tail -5 "${CLOUDFLARED_LOG}" | sed 's/^/   /'
    echo ""
fi

echo -e "${YELLOW}💡 Useful Commands:${NC}"
echo -e "   Start:     ${BLUE}./start.sh [dev|stag|prod|eu]${NC}"
echo -e "   Stop:      ${BLUE}./stop.sh${NC}"
echo -e "   Test CORS: ${BLUE}./test-cors.sh${NC}"
echo ""
