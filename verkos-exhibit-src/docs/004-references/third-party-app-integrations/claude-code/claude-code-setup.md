# Claude Code Workflow Automation - Setup Guide

**Project**: Cloud Monorepo
**Version**: 1.0.0
**Last Updated**: 2025-10-09

---

## Overview

This directory contains a complete Claude Code workflow automation system for the Flytbase monorepo. The system provides standardized workflows for:

- **Context Loading**: Automatic repo overview and intelligent module context loading
- **Planning**: Structured implementation planning with requirements gathering
- **Execution**: Phase-based implementation with coding standards pre-loaded
- **Testing**: Automated test generation and execution with coverage analysis
- **Learning Capture**: Dual-track knowledge preservation (session + global)
- **Session Management**: Graceful handling of compaction and session resumption

---

## Directory Structure

```
.claude/
├── README.md                    # This file
├── MCP-SETUP.md                 # MCP configuration setup guide
├── settings.local.json          # Project-specific settings, hooks, and permissions
├── mcp.json                     # Full-stack MCP configuration (all servers)
├── mcp.backend.json             # Backend-optimized MCP configuration
├── mcp.frontend.json            # Frontend-optimized MCP configuration
├── commands/                    # Slash commands (user-invokable)
│   ├── load-module.md          # /load-module - Intelligent module context loading
│   ├── plan.md                 # /plan - Implementation planning
│   ├── execute-phase.md        # /execute-phase - Phase execution with standards
│   ├── write-test.md           # /write-test - Test generation
│   ├── perform-test.md         # /perform-test - Test execution
│   ├── resume.md               # /resume - Resume after compaction
│   ├── finalize.md             # /finalize - Capture learnings and document
│   └── review.md               # /review - Code review with standards
├── agents/                      # Subagents (delegated tasks)
│   ├── context-loader.md       # Module context discovery and loading
│   ├── test-writer.md          # Comprehensive test generation
│   ├── test-executor.md        # Test suite execution and analysis
│   ├── learning-curator.md     # Global learnings curation
│   ├── feature-documenter.md   # Feature documentation creation
│   └── code-reviewer.md        # Code review with standards compliance
├── hooks/                       # Session lifecycle hooks
│   ├── session-start.sh        # Runs on session start (loads context)
│   ├── session-end.sh          # Runs on session end (reminds to finalize)
│   └── post-compact.sh         # Runs after compaction (suggests /resume)
└── .agent-scratchpad/           # Session-specific work files (gitignored)
    ├── implementation-plan.md
    ├── progress-phase-N.md
    └── session-learnings.md

docs/001-common/                 # Project documentation (main docs folder)
├── repo-overview.md             # Repository structure and overview
├── global-learnings.md          # Team-wide knowledge base
├── development-standards/       # Coding standards
│   ├── backend/
│   │   ├── backend-nestjs.md
│   │   ├── mongodb.md
│   │   ├── api-design.md
│   │   └── security.md
│   └── frontend/
│       ├── frontend-angular.md
│       └── design-system.md
└── doc-templates/               # Document templates
    ├── adr-template.md
    ├── implementation-plan-template.md
    └── progress-phase-template.md
```

---

## Configuration Files

### 1. `.claude/settings.local.json`

**Location**: `/Users/maheshmali/Desktop/flytbase-web-mono-repo/.claude/settings.local.json`

**Purpose**: Project-specific configuration for Claude Code, including:

- Tool permissions (Bash, MCP tools)
- Session hooks (SessionStart, SessionEnd, PreCompact)

**Key Sections**:

```json
{
  "permissions": {
    "allow": [
      "Bash(cat:*)", "Bash(git:*)", "Bash(npm:*)",
      "mcp__filesystem__*",
      "mcp__sequential-thinking__*",
      "mcp__playwright__*",
      "mcp__mongodb__*",
      "mcp__Context7__*"
    ]
  },
  "hooks": {
    "SessionStart": [...],    // Runs .claude/hooks/session-start.sh
    "SessionEnd": [...],      // Runs .claude/hooks/session-end.sh
    "PreCompact": [...]       // Runs .claude/hooks/post-compact.sh
  }
}
```

**Environment Variable**: `$CLAUDE_PROJECT_DIR` references the project root

---

### 2. MCP Configuration Files

**Purpose**: Project-specific MCP (Model Context Protocol) server configurations optimized for different development contexts

**Configuration Files**:

#### `mcp.json` (Default - Full Stack)

**Location**: `.claude/mcp.json`

Includes all MCP servers for full-stack development:

- **openmemory**: Memory storage for conversation context
- **filesystem**: File system operations within project
- **sequential-thinking**: Structured problem-solving
- **playwright**: Browser automation and E2E testing
- **mongodb**: Database queries and operations
- **Context7**: Library documentation lookup
- **chrome-mcp-server**: Chrome browser automation

**Usage**: `claude` or `npm run claude` or `npm run claude:all`

---

#### `mcp.backend.json` (Backend-Optimized)

**Location**: `.claude/mcp.backend.json`

Optimized for NestJS microservices development:

- **openmemory**: Context persistence
- **filesystem**: File operations for backend code
- **sequential-thinking**: Complex backend logic analysis
- **mongodb**: Database operations and schema work
- **Context7**: Backend framework documentation

**Usage**: `npm run claude:backend`

**Benefits**: Reduced context overhead, faster startup, backend-focused documentation

---

#### `mcp.frontend.json` (Frontend-Optimized)

**Location**: `.claude/mcp.frontend.json`

Optimized for Angular/React development:

- **openmemory**: Context persistence
- **filesystem**: File operations for frontend code
- **sequential-thinking**: Complex UI logic analysis
- **playwright**: E2E testing and browser automation
- **Context7**: Frontend framework documentation

**Usage**: `npm run claude:frontend`

**Benefits**: Reduced context overhead, faster startup, frontend-focused tools

---

**First-Time Setup**:

When you first start Claude Code in this project, you'll be prompted to approve MCP servers. You can:

- Approve all: Recommended for this workflow
- Approve individually: Select which servers to use
- Reset choices: `claude mcp reset-project-choices`

**Environment Variables** (configured in MCP files):

```bash
# MongoDB connection (configured in .mcp.json and .mcp.backend.json)
MONGODB_URI="mongodb+srv://[credentials]@flytnow-staging-develop.2gc4i.mongodb.net"
MONGODB_DATABASE="flyt_now_auto_dev"

# OpenMemory API key (configured in all MCP files)
OPENMEMORY_API_KEY="om-[key]"
```

**Choosing the Right Configuration**:

| Scenario                              | Command                      | MCP Config                  | Servers Loaded |
| ------------------------------------- | ---------------------------- | --------------------------- | -------------- |
| Backend development (NestJS, MongoDB) | `npm run claude:backend`     | `.claude/mcp.backend.json`  | 5 servers      |
| Frontend development (Angular, React) | `npm run claude:frontend`    | `.claude/mcp.frontend.json` | 5 servers      |
| Full-stack or uncertain               | `npm run claude` or `claude` | `.claude/mcp.json`          | 7 servers      |

**Performance Impact**:

- Backend/Frontend configs: ~30% faster startup, reduced context usage
- Full config: Complete tooling, higher context usage

---

## Workflow Usage

### 1. Starting a Session

**What Happens Automatically**:

- `session-start.sh` hook executes
- Loads `docs/001-common/repo-overview.md`
- Loads `docs/001-common/global-learnings.md`
- Displays available commands and active MCP servers

**No Action Required** - Context is loaded automatically

---

### 2. Loading Module Context

**Command**: `/load-module [feature-description or module-names]`

**Example**:

```
/load-module geofence breach alarm notifications
```

**What It Does**:

- Delegates to `context-loader` agent
- Analyzes feature description to identify relevant services
- Navigates documentation structure in `docs/002-modules/`
- Loads module and feature documentation
- Researches code implementation (controllers, services, components)
- Provides comprehensive summary with architecture and integration points

**Output**: Comprehensive context summary ready for planning

---

### 3. Creating Implementation Plan

**Command**: `/plan [feature-description]`

**Example**:

```
/plan Implement real-time geofence breach detection with alarm routing
```

**What It Does**:

- Checks for existing documentation
- Gathers requirements interactively (if needed)
- Creates planning documents in `.agent-scratchpad/`:
  - `architecture.md` (if architectural changes)
  - `implementation-plan.md` (phased approach)
  - `progress-phase-N.md` (per-phase tracking)
  - `session-learnings.md` (initial setup)

**Output**: Phased implementation plan with approval request

---

### 4. Executing Implementation

**Command**: `/execute-phase [phase-number]`

**Example**:

```
/execute-phase 1
```

**What It Does**:

- Loads phase details from implementation plan
- Pre-loads relevant coding standards:
  - Backend NestJS standards
  - MongoDB schema standards
  - API design standards
  - Security standards
  - Frontend React standards (if applicable)
- Executes tasks with real-time progress tracking
- Updates `.agent-scratchpad/progress-phase-N.md`
- Captures learnings in `.agent-scratchpad/session-learnings.md`

**Execution Protocol**:

1. Follow loaded standards
2. Track progress in real-time
3. Validate after changes (syntax, lint, build)
4. Capture learnings continuously

---

### 5. Writing Tests

**Command**: `/write-test [target-files or phase-number]`

**Example**:

```
/write-test apps/apis/alarm-response/src
```

**What It Does**:

- Delegates to `test-writer` agent
- Analyzes implementation code
- Generates comprehensive test suite:
  - Unit tests (≥80% coverage target)
  - Integration tests (≥70% coverage target)
  - Edge cases and error scenarios
- Follows existing test patterns
- Provides test report with coverage analysis

**Output**: Test files + coverage report

---

### 6. Running Tests

**Command**: `/perform-test [unit|integration|e2e|all]`

**Example**:

```
/perform-test all
```

**What It Does**:

- Delegates to `test-executor` agent
- Prepares test environment
- Executes test suite with coverage
- Analyzes results and failures
- Generates comprehensive report:
  - Pass/fail summary
  - Coverage metrics
  - Failed test details with fixes
  - Performance analysis

**Output**: Detailed test execution report

---

### 7. Resuming After Compaction

**Command**: `/resume [optional: phase-number]`

**What Happens During Compaction**:

- `post-compact.sh` hook executes
- Suggests running `/resume` to restore context

**What `/resume` Does**:

- Reloads implementation plan
- Checks progress tracking files
- Reviews session learnings
- Shows recent git activity
- Identifies active phase
- Provides context restoration summary

**Output**: Full context restored, ready to continue

---

### 8. Finalizing Session

**Command**: `/finalize [optional: feature-name]`

**What It Does**:

- Delegates to two agents:
  1. **learning-curator**: Updates global learnings
     - Processes session learnings
     - Categorizes and deduplicates
     - Updates `docs/001-common/global-learnings.md`
  2. **feature-documenter**: Creates/updates feature docs
     - Analyzes git commits and implementation
     - Creates documentation in `docs/002-modules/[module]/features/[feature]/`
     - Includes overview, architecture, decisions, integrations

**Output**: Updated global learnings + feature documentation

**When to Run**:

- After completing a feature or significant work
- Before ending a session (reminder shown by `session-end.sh` hook)
- When you want to preserve learnings for the team

---

## Session Lifecycle Hooks

### SessionStart Hook

**Script**: `.claude/hooks/session-start.sh`

**Runs**: Automatically when starting a new Claude Code session

**Actions**:

- Displays welcome message
- Loads `repo-overview.md` (repository context)
- Loads `global-learnings.md` (team knowledge)
- Lists available slash commands
- Shows active MCP servers

**No User Action Required**

---

### SessionEnd Hook

**Script**: `.claude/hooks/session-end.sh`

**Runs**: Automatically when ending a Claude Code session

**Actions**:

- Reminds to run `/finalize` to capture learnings
- Lists session artifacts in `.agent-scratchpad/`
- Explains what finalization does

**User Action**: Consider running `/finalize` if you completed significant work

---

### PreCompact Hook

**Script**: `.claude/hooks/post-compact.sh`

**Runs**: Automatically after context compaction

**Actions**:

- Notifies about compaction
- Suggests running `/resume` to restore context
- Explains what will be reloaded

**User Action**: Run `/resume` to restore session state

---

## Agent Details

### context-loader Agent

**Purpose**: Intelligent module context discovery
**MCP Servers**: filesystem
**Input**: Feature description or service names
**Output**: Structured context summary with integration points

**Capabilities**:

- Navigates documentation structure starting from `docs/002-modules/index.md`
- Loads module and feature documentation
- Researches code implementation (grep, read files)
- Provides comprehensive architecture and data flow analysis

---

### test-writer Agent

**Purpose**: Comprehensive test generation
**MCP Servers**: filesystem, sequential-thinking
**Input**: Target files or phase number
**Output**: Test files + coverage report

**Capabilities**:

- Unit test generation (Jest/Vitest)
- Integration test generation (MongoDB Memory Server)
- Edge case and error scenario coverage
- Pattern-following based on existing tests

---

### test-executor Agent

**Purpose**: Test suite execution and analysis
**MCP Servers**: playwright, mongodb, filesystem
**Input**: Test scope (unit|integration|e2e|all)
**Output**: Detailed test execution report

**Capabilities**:

- Test environment preparation
- Test execution with coverage
- Failure analysis with fix suggestions
- Performance and flaky test detection
- E2E testing with browser automation

---

### learning-curator Agent

**Purpose**: Global knowledge base curation
**MCP Servers**: filesystem
**Input**: Session learnings
**Output**: Updated global learnings + curation report

**Capabilities**:

- Learning categorization
- Deduplication and consolidation
- Global knowledge base updates
- Quality assurance and formatting

---

### feature-documenter Agent

**Purpose**: Feature documentation creation
**MCP Servers**: filesystem
**Input**: Implementation context
**Output**: Feature documentation + report

**Capabilities**:

- Architecture documentation
- API documentation
- Integration guide creation
- ADR (Architecture Decision Record) creation
- Cross-reference management

---

## Best Practices

### 1. Always Load Context First

Before starting work, run:

```
/load-module [feature-description]
```

This ensures you have relevant service contexts loaded.

---

### 2. Plan Before Implementation

Always create an implementation plan:

```
/plan [feature-description]
```

Phased planning helps break down complex work and track progress.

---

### 3. Capture Learnings Continuously

As you work, note learnings in `.agent-scratchpad/session-learnings.md`. The `/finalize` command will process these automatically.

**Learning Categories**:

- Technical decisions and rationale
- Best practices discovered
- Pitfalls avoided and solutions
- Performance insights
- Security insights
- Architecture patterns
- Integration patterns
- Testing strategies

---

### 4. Finalize Before Ending Sessions

Always run `/finalize` before ending significant sessions:

- Preserves knowledge for team
- Updates global learnings
- Creates feature documentation
- Ensures nothing is lost

---

### 5. Use Resume After Compaction

If context gets compacted, immediately run:

```
/resume
```

This restores your session state and allows you to continue seamlessly.

---

## Troubleshooting

### Hooks Not Running

**Issue**: Session hooks don't execute

**Solution**:

1. Check hook scripts are executable:
   ```bash
   chmod +x .claude/hooks/*.sh
   ```
2. Verify `settings.local.json` hooks configuration
3. Check hook script output for errors

---

### MCP Servers Not Available

**Issue**: MCP tools not working

**Solution**:

1. Approve MCP servers when prompted
2. Check `.mcp.json` configuration
3. Verify MCP packages are installable:
   ```bash
   npx @modelcontextprotocol/server-filesystem --version
   ```
4. Reset choices: `claude mcp reset-project-choices`

---

### Context Documents Missing

**Issue**: Module documentation doesn't exist

**Solution**:

1. Create documentation in `docs/002-modules/[module-name]/`
2. Use established structure: `index.md`, feature docs, features folder
3. Include: purpose, API endpoints, database schema, dependencies

---

### Permission Denied Errors

**Issue**: Tool execution blocked

**Solution**:

1. Check `settings.local.json` permissions
2. Add required permission to `allow` list
3. Example: `"Bash(your-command:*)"`

---

## Maintenance

### Adding New Services

When creating new microservices:

1. Create module documentation:

   ```
   docs/002-modules/[module-name]/index.md
   ```

2. Include:

   - Module purpose and responsibilities
   - API endpoints and contracts
   - Database collections/schemas
   - Dependencies and integration points
   - Testing approach

3. Add features as they're implemented in `features/[feature-name]/`

---

### Updating Standards

Coding standards in `docs/001-common/development-standards/` should be updated when:

- New patterns are adopted
- Team conventions change
- New technologies are introduced
- Best practices evolve

**Process**:

1. Discuss changes with team
2. Update relevant standard document in `docs/001-common/development-standards/`
3. Capture rationale in global learnings
4. Communicate changes to team

---

### Evolving Workflows

As workflows evolve:

1. **Slash Commands**: Edit `.claude/commands/[command].md`
2. **Agents**: Edit `.claude/agents/[agent].md`
3. **Hooks**: Edit `.claude/hooks/[hook].sh`
4. **Templates**: Edit `docs/001-common/doc-templates/[template].md`

**Version Control**: All changes are git-tracked, enabling team collaboration.

---

## Support

### Resources

- **Claude Code Docs**: https://docs.claude.com/en/docs/claude-code
- **Team Documentation**: `docs/` folder
- **Global Learnings**: `docs/001-common/global-learnings.md`
- **Development Standards**: `docs/001-common/development-standards/`

### Getting Help

- **Slack**: #engineering channel
- **Tech Lead**: [Contact]
- **This README**: Reference for workflow usage

---

## Version History

| Version | Date       | Changes                                                               |
| ------- | ---------- | --------------------------------------------------------------------- |
| 1.0.0   | 2025-10-09 | Initial setup with 7 commands, 5 agents, hooks, and MCP configuration |

---

**Note**: This workflow automation system is designed to grow with your team. Feedback and improvements are welcome!
