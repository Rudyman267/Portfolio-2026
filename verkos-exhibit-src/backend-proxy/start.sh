#!/bin/bash
# FlytBase Backend CORS Proxy with Cloudflare Tunnel
# Usage: ./start.sh [environment]
# Example: ./start.sh dev     # Development backend (default)
# Example: ./start.sh stag    # Staging backend
# Example: ./start.sh prod    # Production backend
# Example: ./start.sh eu      # EU Production backend

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT=${1:-dev}
PROXY_PORT=8888
LOG_DIR="./logs"
CLOUDFLARED_LOG="${LOG_DIR}/cloudflared.log"
CLOUDFLARED_PID_FILE="${LOG_DIR}/cloudflared.pid"

# Banner
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🚀 FlytBase Backend CORS Proxy - Cloudflare Tunnel              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Determine backend URL based on environment
# NOTE: docker-compose automatically loads .env file
# Command line argument takes precedence over .env file
case $ENVIRONMENT in
    dev)
        BACKEND_URL="api-dev.flytbase.com"
        ENV_NAME="Development"
        ;;
    prod)
        BACKEND_URL="api.flytbase.com"
        ENV_NAME="Production"
        ;;
    stag)
        BACKEND_URL="api-stag.flytbase.com"
        ENV_NAME="Staging"
        ;;
    eu)
        BACKEND_URL="api-eu.flytbase.com"
        ENV_NAME="EU Production"
        ;;
    *)
        BACKEND_URL=$ENVIRONMENT
        ENV_NAME="Custom"
        ;;
esac

echo -e "${YELLOW}🌍 Environment: ${ENV_NAME}${NC}"
echo -e "${YELLOW}📡 Backend URL: ${BACKEND_URL}${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    echo -e "${YELLOW}   Please start Docker Desktop and try again${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo -e "${RED}❌ cloudflared is not installed${NC}"
    echo -e "${YELLOW}   Detecting OS and installing...${NC}"
    echo ""
    
    # Detect OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        echo -e "${BLUE}📦 Detected macOS - Installing via Homebrew${NC}"
        if command -v brew &> /dev/null; then
            brew install cloudflared
        else
            echo -e "${RED}❌ Homebrew not found${NC}"
            echo -e "${YELLOW}   Install Homebrew from: https://brew.sh${NC}"
            echo -e "${YELLOW}   Or install cloudflared manually from: https://github.com/cloudflare/cloudflared/releases${NC}"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        echo -e "${BLUE}📦 Detected Linux - Installing cloudflared${NC}"
        
        # Try to detect Linux distribution
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            OS=$ID
        else
            OS=$(uname -s)
        fi
        
        case $OS in
            ubuntu|debian)
                echo -e "${YELLOW}   Installing for Debian/Ubuntu...${NC}"
                # Add Cloudflare GPG key
                sudo mkdir -p /usr/share/keyrings
                curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
                
                # Add repository
                echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
                
                # Update and install
                sudo apt-get update && sudo apt-get install -y cloudflared
                ;;
            rhel|centos|fedora|rocky|almalinux)
                echo -e "${YELLOW}   Installing for RHEL/CentOS/Fedora...${NC}"
                # Add repository
                sudo curl -fsSL https://pkg.cloudflare.com/cloudflare-main.repo -o /etc/yum.repos.d/cloudflare-main.repo
                
                # Install
                if command -v dnf &> /dev/null; then
                    sudo dnf install -y cloudflared
                else
                    sudo yum install -y cloudflared
                fi
                ;;
            *)
                echo -e "${YELLOW}   Distribution not recognized, using generic installation...${NC}"
                # Generic Linux installation (download binary directly)
                ARCH=$(uname -m)
                case $ARCH in
                    x86_64)
                        CLOUDFLARED_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
                        ;;
                    aarch64|arm64)
                        CLOUDFLARED_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64"
                        ;;
                    armv7l)
                        CLOUDFLARED_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm"
                        ;;
                    *)
                        echo -e "${RED}❌ Unsupported architecture: $ARCH${NC}"
                        echo -e "${YELLOW}   Please install cloudflared manually from: https://github.com/cloudflare/cloudflared/releases${NC}"
                        exit 1
                        ;;
                esac
                
                echo -e "${YELLOW}   Downloading cloudflared binary...${NC}"
                sudo curl -fsSL "$CLOUDFLARED_URL" -o /usr/local/bin/cloudflared
                sudo chmod +x /usr/local/bin/cloudflared
                ;;
        esac
    else
        echo -e "${RED}❌ Unsupported OS: $OSTYPE${NC}"
        echo -e "${YELLOW}   Please install cloudflared manually from: https://github.com/cloudflare/cloudflared/releases${NC}"
        exit 1
    fi
    
    # Verify installation
    if command -v cloudflared &> /dev/null; then
        echo -e "${GREEN}✅ cloudflared installed successfully${NC}"
        cloudflared --version
    else
        echo -e "${RED}❌ cloudflared installation failed${NC}"
        exit 1
    fi
    echo ""
fi

echo -e "${GREEN}✅ cloudflared is installed${NC}"
echo ""

# Create logs directory with proper permissions
mkdir -p ${LOG_DIR}
chmod 755 ${LOG_DIR}
# Ensure we have write permissions (handle case where dir exists with wrong ownership)
if [ ! -w "${LOG_DIR}" ]; then
    echo -e "${RED}❌ No write permission for ${LOG_DIR}${NC}"
    echo -e "${YELLOW}   Run: sudo chown -R $USER:$USER ${LOG_DIR}${NC}"
    exit 1
fi

# Stop existing services
echo -e "${YELLOW}🧹 Cleaning up existing services...${NC}"

# Stop Docker containers
docker compose down > /dev/null 2>&1 || true

# Stop existing cloudflared
if [ -f "${CLOUDFLARED_PID_FILE}" ]; then
    OLD_PID=$(cat "${CLOUDFLARED_PID_FILE}")
    if ps -p $OLD_PID > /dev/null 2>&1; then
        kill $OLD_PID 2>/dev/null || true
    fi
    rm -f "${CLOUDFLARED_PID_FILE}"
fi
pkill -9 cloudflared 2>/dev/null || true

echo -e "${GREEN}✅ Cleaned up existing services${NC}"
echo ""

# Build and start Docker containers with backend URL
echo -e "${YELLOW}🐳 Building Docker image...${NC}"
docker compose build --no-cache

echo -e "${YELLOW}🚀 Starting containers with backend: ${BLUE}${BACKEND_URL}${NC}"
BACKEND_URL=${BACKEND_URL} docker compose up -d

echo -e "${YELLOW}📋 Checking container startup logs...${NC}"
sleep 2
docker compose logs --tail=20

# Wait for nginx to be ready
echo -e "${YELLOW}⏳ Waiting for nginx to be ready...${NC}"
sleep 3

# Verify nginx health
if curl -s http://localhost:${PROXY_PORT}/health > /dev/null; then
    echo -e "${GREEN}✅ Nginx proxy is running on localhost:${PROXY_PORT}${NC}"
else
    echo -e "${RED}❌ Nginx proxy failed to start${NC}"
    echo -e "${YELLOW}   Checking logs:${NC}"
    docker compose logs
    exit 1
fi

echo ""

# Start Cloudflare tunnel in background
echo -e "${YELLOW}🌐 Starting Cloudflare tunnel in background...${NC}"
nohup cloudflared tunnel --url http://localhost:${PROXY_PORT} > ${CLOUDFLARED_LOG} 2>&1 &
TUNNEL_PID=$!
echo ${TUNNEL_PID} > ${CLOUDFLARED_PID_FILE}

echo -e "${GREEN}✅ Cloudflare tunnel started (PID: ${TUNNEL_PID})${NC}"

# Wait for tunnel to establish
echo -e "${YELLOW}⏳ Waiting for tunnel to establish...${NC}"
sleep 5

# Extract tunnel URL from logs
TUNNEL_URL=""
for i in {1..20}; do
    if [ -f "${CLOUDFLARED_LOG}" ]; then
        TUNNEL_URL=$(grep -o 'https://[^/]*\.trycloudflare\.com' ${CLOUDFLARED_LOG} | head -1)
        if [ ! -z "$TUNNEL_URL" ]; then
            break
        fi
    fi
    sleep 1
done

echo ""

if [ ! -z "$TUNNEL_URL" ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     ✅ Services Started Successfully!                                ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}📊 Status:${NC}"
    echo -e "   ${GREEN}✅ Environment:${NC}       ${ENV_NAME}"
    echo -e "   ${GREEN}✅ Backend:${NC}           ${BACKEND_URL}"
    echo -e "   ${GREEN}✅ Nginx Proxy:${NC}       http://localhost:${PROXY_PORT}"
    echo -e "   ${GREEN}✅ Cloudflare Tunnel:${NC} ${TUNNEL_URL}"
    echo -e "   ${GREEN}✅ Process ID:${NC}        ${TUNNEL_PID}"
    echo ""
    echo -e "${YELLOW}📝 Next Steps:${NC}"
    echo -e "   1. Update your environment file:"
    echo -e "      ${BLUE}src/environments/environment.dev.ts${NC}"
    echo -e "      ${BLUE}apiDomain: '${TUNNEL_URL}'${NC}"
    echo ""
    echo -e "   2. Restart frontend dev server:"
    echo -e "      ${BLUE}npm run dev${NC}"
    echo ""
    echo -e "   3. Hard refresh browser:"
    echo -e "      ${BLUE}Cmd+Shift+R${NC} (Mac) or ${BLUE}Ctrl+Shift+R${NC} (Windows)"
    echo ""
    echo -e "${YELLOW}💡 Useful Commands:${NC}"
    echo -e "   View tunnel logs:  ${BLUE}tail -f ${CLOUDFLARED_LOG}${NC}"
    echo -e "   View proxy logs:   ${BLUE}tail -f ${LOG_DIR}/proxy_access.log${NC}"
    echo -e "   Check status:      ${BLUE}./status.sh${NC}"
    echo -e "   Test CORS:         ${BLUE}./test-cors.sh${NC}"
    echo -e "   Stop services:     ${BLUE}./stop.sh${NC}"
    echo ""
    echo -e "${GREEN}✨ Services are running in background. Terminal can be closed safely!${NC}"
    echo ""
else
    echo -e "${RED}❌ Failed to get Cloudflare tunnel URL${NC}"
    echo -e "${YELLOW}   Check logs: ${CLOUDFLARED_LOG}${NC}"
    exit 1
fi
