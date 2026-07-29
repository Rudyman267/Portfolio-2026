# FlytBase Backend CORS Proxy

Production-ready Docker-based Nginx reverse proxy with Cloudflare Tunnel for development.

## 🎯 What This Does

```
Lovable App (https://your-app.lovable.app)
    ↓ API call
Cloudflare Tunnel (https://xxx.trycloudflare.com)
    ↓ Forward
Docker Nginx (localhost:8888)
    ↓ Add CORS headers + Proxy
FlytBase Backend (https://api-dev.flytbase.com)
    ✅ Returns data with proper CORS headers
```

## ✨ Key Features

- ✅ **Cross-platform**: Works on macOS, Linux (all distributions), and remote VMs
- ✅ **Auto-installation**: Detects OS and installs dependencies automatically
- ✅ **Multi-environment support**: dev / stag / prod / eu
- ✅ **Cloudflare Tunnel**: Free, no CORS injection issues
- ✅ **Dynamic backend**: Environment-based configuration
- ✅ **Header-based auth**: SuperTokens support
- ✅ **Background mode**: Services run without blocking terminal
- ✅ **Production-grade**: Proper logging, health checks, error handling

---

## 📋 Prerequisites

### Required
1. **Docker**
   - macOS: Docker Desktop
   - Linux: Docker Engine

### Auto-Installed
2. **Cloudflare Tunnel** (cloudflared)
   - The `start.sh` script automatically installs this
   - Supports macOS, Ubuntu, Debian, RHEL, CentOS, Fedora, and more

### Installation

**One-line setup (any platform):**
```bash
cd backend-proxy
./start.sh dev
```

The script will:
- ✅ Detect your OS (macOS/Linux)
- ✅ Detect your Linux distribution (if applicable)
- ✅ Install cloudflared automatically
- ✅ Start all services

For detailed installation instructions, see **[INSTALLATION.md](./INSTALLATION.md)**

---

## 🚀 Quick Start

### Step 1: Start Services

```bash
cd backend-proxy

# Start with development backend (default)
./start.sh dev

# Or choose environment:
./start.sh stag    # Staging
./start.sh prod    # Production
./start.sh eu      # EU Production
```

The script will:
- Start Docker containers with selected backend
- Launch Cloudflare tunnel in background
- Display tunnel URL

### Step 2: Update Environment File

Copy the tunnel URL from output and update:

```typescript
// src/environments/environment.dev.ts
export const environment = {
  appInfo: {
    apiDomain: 'https://xxx.trycloudflare.com', // ← Your tunnel URL
  },
};
```

### Step 3: Restart Frontend

```bash
# Stop current dev server (Ctrl+C)
npm run dev

# Hard refresh browser
# Mac: Cmd+Shift+R
# Windows: Ctrl+Shift+R
```

✅ Done! No CORS errors, all API calls working!

---

## 🎛️ Available Environments

| Environment | Backend URL | Command |
|------------|------------|---------|
| Development | api-dev.flytbase.com | `./start.sh dev` |
| Staging | api-stag.flytbase.com | `./start.sh stag` |
| Production | api.flytbase.com | `./start.sh prod` |
| EU Production | api-eu.flytbase.com | `./start.sh eu` |
| Custom | your-api.com | `./start.sh your-api.com` |

---

## 🛠️ Management Commands

### Check Status
```bash
./status.sh
```

Shows:
- Docker container status
- Nginx health
- Cloudflare tunnel status and URL
- Log file locations

### Stop Services
```bash
./stop.sh
```

Stops:
- Docker containers
- Cloudflare tunnel

### Test CORS
```bash
./test-cors.sh
```

Runs automated CORS header tests.

---

## 📊 Monitoring

### View Logs

```bash
# Cloudflare tunnel logs
tail -f logs/cloudflared.log

# Nginx access logs
tail -f logs/proxy_access.log

# Nginx error logs
tail -f logs/proxy_error.log

# Docker logs
docker compose logs -f
```

### Health Check

```bash
# Check proxy health
curl http://localhost:8888/health

# Should return: "Nginx CORS Proxy - Backend: api-dev.flytbase.com"
```

---

## 🔧 Configuration

### Change Default Environment

Edit `start.sh` line 13:
```bash
ENVIRONMENT=${1:-dev}  # Change 'dev' to your default
```

### Modify CORS Headers

Edit `nginx.conf`:
- Line 26-37: CORS configuration maps
- Line 88-93: OPTIONS preflight headers
- Line 190-196: Response CORS headers

After changes:
```bash
./stop.sh
./start.sh dev
```

### Custom Backend URL

```bash
# Pass custom backend directly
./start.sh api-custom.example.com
```

---

## 🐛 Troubleshooting

### Docker Not Running
```bash
# Start Docker Desktop
open -a Docker

# Wait for Docker to start, then:
./start.sh dev
```

### Port 8888 In Use
```bash
# Find process using port
lsof -ti:8888

# Kill process
kill $(lsof -ti:8888)
```

### CORS Errors Persist
```bash
# 1. Check tunnel is running
./status.sh

# 2. Verify tunnel URL in environment file

# 3. Restart frontend dev server (required!)
npm run dev

# 4. Hard refresh browser
# Mac: Cmd+Shift+R
```

### Tunnel URL Not Found
```bash
# Check logs
cat logs/cloudflared.log | grep trycloudflare

# Or restart services
./stop.sh && ./start.sh dev
```

### 502 Bad Gateway
```bash
# Test backend directly
curl https://api-dev.flytbase.com/health

# Check nginx logs
tail -f logs/proxy_error.log

# Verify backend URL is correct
./status.sh
```

---

## 📁 File Structure

```
backend-proxy/
├── start.sh              # Start services with env selection
├── stop.sh               # Stop all services
├── status.sh             # Check status
├── test-cors.sh          # Test CORS configuration
├── nginx.conf            # Nginx configuration template
├── Dockerfile            # Docker image definition
├── docker-compose.yml    # Docker Compose config
├── README.md             # This file
└── logs/                 # Log files (auto-created)
    ├── cloudflared.log
    ├── cloudflared.pid
    ├── proxy_access.log
    └── proxy_error.log
```

---

## 🔐 Security Notes

### Development Use
✅ **Safe for**:
- Local development
- Testing integrations
- Debugging API calls

⚠️ **Configuration**:
- SSL verification disabled for flexibility
- CORS allows any origin (for dev convenience)
- Not for production deployment

### Production Recommendations

If deploying to production:

1. **Enable SSL verification**:
   ```nginx
   # nginx.conf line 182
   proxy_ssl_verify on;
   ```

2. **Restrict CORS origins**:
   ```nginx
   # nginx.conf lines 26-29
   map $http_origin $cors_origin {
       "https://app.flytbase.com" "https://app.flytbase.com";
       "https://eu.flytbase.com" "https://eu.flytbase.com";
       default "";
   }
   ```

3. **Use persistent tunnel**:
   - Cloudflare Tunnel with named tunnel
   - Or use paid ngrok tier

---

## 🎓 How It Works

### CORS Flow

1. **Browser** sends request with `credentials: 'include'`
2. **Cloudflare Tunnel** forwards to nginx (no header injection)
3. **Nginx** hides upstream CORS headers
4. **Nginx** adds specific origin header (not wildcard)
5. **Backend** receives request with masked origin
6. **Nginx** ensures response has correct CORS headers
7. **Browser** receives response, accepts it (no CORS error)

### Why Cloudflare?

❌ **Ngrok free tier**:
- Injects `Access-Control-Allow-Origin: *` (wildcard)
- Breaks requests with `credentials: 'include'`
- Cannot be overridden by nginx

✅ **Cloudflare Tunnel**:
- No CORS header injection
- Nginx configuration works correctly
- Free forever, no limits
- Better performance (global CDN)

---

## ✅ Checklist

Before using:
- [ ] Docker Desktop installed and running
- [ ] Cloudflared installed (or let script install it)
- [ ] Run `./start.sh dev` (or your environment)
- [ ] Copy tunnel URL to environment file
- [ ] Restart frontend dev server
- [ ] Hard refresh browser
- [ ] Verify no CORS errors in console

---

## 💡 Pro Tips

### One-Command Start
```bash
# Add alias to your .zshrc or .bashrc
alias proxy-dev="cd ~/path/to/backend-proxy && ./start.sh dev"
alias proxy-prod="cd ~/path/to/backend-proxy && ./start.sh prod"
```

### Keep Tunnel URL Updated
```bash
# Get current tunnel URL
./status.sh | grep "Tunnel URL"

# Or from logs
cat logs/cloudflared.log | grep trycloudflare
```

### Quick Status Check
```bash
# One-liner to see if everything is running
docker compose ps && pgrep cloudflared
```

---

## 🎉 Summary

**What you get**:
- Multi-environment backend proxy
- Cloudflare tunnel (no CORS issues)
- Background mode (non-blocking)
- Production-grade configuration
- Complete logging and monitoring

**Time to setup**: ~2 minutes  
**Cost**: $0 (completely free)  
**Maintenance**: Minimal (just run `./start.sh`)

---

## 📞 Support

### Quick Commands
```bash
./start.sh dev    # Start development
./status.sh       # Check status
./stop.sh         # Stop all services
./test-cors.sh    # Test CORS config
```

### Common Issues
- **CORS errors**: Restart frontend dev server
- **Tunnel down**: Run `./stop.sh && ./start.sh dev`
- **Port in use**: Kill process on 8888
- **Docker error**: Start Docker Desktop

**Status**: ✅ Production-ready  
**Maintained**: Active  
**Version**: 2.0 (Cloudflare-only)
