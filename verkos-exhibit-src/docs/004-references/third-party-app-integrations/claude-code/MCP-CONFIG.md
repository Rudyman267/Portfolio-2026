# MCP Configuration - Quick Reference

**Location**: `.claude/mcp*.json`

---

## Available Configurations

| Configuration  | File                        | MCP Servers | Use For                     |
| -------------- | --------------------------- | ----------- | --------------------------- |
| **Backend**    | `.claude/mcp.backend.json`  | 5 servers   | NestJS, MongoDB development |
| **Frontend**   | `.claude/mcp.frontend.json` | 6 servers   | Angular, React, E2E testing |
| **Full Stack** | `.claude/mcp.json`          | 7 servers   | Complete development        |

---

## Usage

### npm Scripts (Recommended)

```bash
# Backend development - ONLY backend MCP servers
npm run claude:backend

# Frontend development - ONLY frontend MCP servers
npm run claude:frontend

# Full-stack development - ALL MCP servers
npm run claude
```

### Direct Claude Command

```bash
# With strict mode (ignores other MCP configs)
claude --mcp-config .claude/mcp.backend.json --strict-mcp-config
claude --mcp-config .claude/mcp.frontend.json --strict-mcp-config
claude --mcp-config .claude/mcp.json --strict-mcp-config
```

---

## How --strict-mcp-config Works

The `--strict-mcp-config` flag ensures:

✅ **Only uses servers from specified config file**
✅ **Ignores user-level MCP configurations** (from `~/.claude/mcp.json`)
✅ **Ignores other project MCP configurations** (from `.mcp.json` in root)
✅ **Consistent environment across team**

Without this flag, Claude Code would merge MCP servers from multiple sources, which could lead to:
❌ Unexpected MCP servers being loaded
❌ Conflicts between different configurations
❌ Inconsistent behavior across team members

---

## MCP Server Details

### Backend Configuration (5 servers)

1. **openmemory** - Conversation context persistence
2. **filesystem** - File operations within project
3. **sequential-thinking** - Complex problem-solving
4. **mongodb** - Database queries and operations
5. **Context7** - NestJS, Node.js, TypeScript documentation

### Frontend Configuration (6 servers)

1. **openmemory** - Conversation context persistence
2. **filesystem** - File operations within project
3. **sequential-thinking** - Complex problem-solving
4. **playwright** - Browser automation, E2E testing
5. **Context7** - Angular, React, TypeScript documentation
6. **chrome-mcp-server** - Chrome browser automation

### Full Stack Configuration (7 servers)

All of the above servers combined.

---

## Credentials Configuration

### MongoDB Connection

Located in: `.claude/mcp.backend.json` and `.claude/mcp.json`

```json
"mongodb": {
  "env": {
    "MONGODB_URI": "mongodb+srv://V79tw6GYX:2bdoyotGmLU3azMU@flytnow-staging-develop.2gc4i.mongodb.net",
    "MONGODB_DATABASE": "flyt_now_auto_dev"
  }
}
```

### OpenMemory API Key

Located in: All MCP config files

```json
"openmemory": {
  "env": {
    "OPENMEMORY_API_KEY": "om-4rsovkzaj10sc9f2hnxa7db9aqhek0zt",
    "CLIENT_NAME": "claude"
  }
}
```

---

## Troubleshooting

### Issue: Wrong MCP servers loading

**Solution**: Ensure you're using the npm scripts which include `--strict-mcp-config`:

```bash
npm run claude:backend  # NOT: claude --mcp-config .claude/mcp.backend.json
```

### Issue: MCP servers from user config still loading

**Solution**: The `--strict-mcp-config` flag should prevent this. If it persists:

```bash
# Reset MCP approvals
claude mcp reset-project-choices

# Then run with npm script
npm run claude:backend
```

### Issue: MCP server connection failed

**Solution**:

1. Check internet connection (MCP servers installed via npx)
2. Verify credentials in `.claude/mcp*.json` files
3. For MongoDB: Check VPN connection if required

---

## Performance Benefits

| Aspect            | Backend Config  | Frontend Config   | Full Config     |
| ----------------- | --------------- | ----------------- | --------------- |
| **Startup Time**  | ~30% faster     | ~30% faster       | Baseline        |
| **MCP Servers**   | 5               | 6                 | 7               |
| **Context Usage** | Lower           | Lower             | Higher          |
| **Best For**      | API development | UI/UX development | Full-stack work |

---

**Last Updated**: 2025-10-13
