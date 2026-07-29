# Repository Usage Guides

This directory contains comprehensive guides for understanding and working with the FlytBase App Template repository.

## Available Guides

### 📘 [Repository Onboarding Guide](./repository-onboarding.md)

**Primary onboarding document for new developers and AI agents.**

**What's Included:**
- Complete repository structure explanation
- Comprehensive tech stack overview
- Core concepts and architecture patterns
- Authentication system guide
- Available libraries (Socket.IO, Maps, Video Streaming)
- Design system usage and constraints
- Development patterns and best practices
- AI agent guidelines
- Getting started checklist

**Who Should Read This:**
- ✅ New developers joining the project
- ✅ AI agents (Claude, Copilot) working with the codebase
- ✅ Anyone needing to understand the repository structure
- ✅ Developers before implementing new features

**Reading Time:** ~30-45 minutes  
**Level:** Beginner to Intermediate

---

### 🚀 [Deployment Quick Start Guide](./repo-quickstart.md)

**Step-by-step guide to customize and deploy your FlytBase application.**

**What's Included:**
- Understanding FlytBase URL structure
- Customizing application base path
- Environment configuration (dev/staging/production)
- Organization setup (FlyStake staging requirement)
- API documentation references
- Complete deployment checklist
- Troubleshooting common issues

**Who Should Read This:**
- ✅ Developers ready to deploy their application
- ✅ Anyone customizing the app template for a new project
- ✅ Developers setting up staging/production environments
- ✅ New developers needing to understand deployment flow

**Reading Time:** ~20-30 minutes  
**Level:** Intermediate

---

## Quick Start

1. **New to the repository?**  
   Start with [Repository Onboarding Guide](./repository-onboarding.md)

2. **Ready to deploy?**  
   Follow [Deployment Quick Start Guide](./deployment-quickstart.md)

3. **Need integration guides?**  
   Check `src/integrations/` for specific library integration guides

4. **Need architecture details?**  
   Check `docs/004-references/core-architectures/`

---

## Document Organization

This directory follows the structure:

```
repo-usage/
├── index.md                      # This file - Directory overview
├── repository-onboarding.md      # Comprehensive onboarding guide
└── deployment-quickstart.md      # Deployment and customization guide
```

---

## Related Documentation

### For Developers
- **Quick Start:** `/README.md`
- **Integration Guides:** `/src/integrations/`
- **Development Standards:** `/docs/001-common/development-standards/`
- **Testing Standards:** `/docs/001-common/testing-standards/`

### For Architecture
- **Map Library:** `/docs/004-references/core-architectures/map-library/`
- **Socket Library:** `/docs/004-references/core-architectures/socket-library/`
- **Auth Library:** `/docs/004-references/core-architectures/auth-library/`

### For DevOps
- **Deployment Guide:** `/docs/003-devops/deployment-guide-react.md`
- **CI/CD:** `/docs/003-devops/ci-cd.md`
- **Backend Proxy:** `/backend-proxy/README.md`

---

## Using These Guides with AI Agents

**🤖 For AI Assistants:** Read the **[AGENTS.md](../../../AGENTS.md)** file at the repository root first!

The AGENTS.md file contains:
- ⚠️ Critical constraints (what libraries you MUST/MUST NOT use)
- 📚 Required reading list (including these guides)
- 🤔 Questions to ask the user before building
- 👨‍💻 Senior engineer standards and code quality requirements
- ✅ Quality checklist

When working with AI assistants (Claude, Copilot, etc.), provide this context:

```
"I'm working with the FlytBase App Template. 

Step 1: Read AGENTS.md at the repository root
Step 2: Read docs/004-references/repo-usage/repository-onboarding.md
Step 3: Read docs/004-references/repo-usage/deployment-quickstart.md

Then ask me the questions from AGENTS.md before we start building."
```

This ensures the AI:
- ✅ Understands critical constraints (no new UI libraries!)
- ✅ Uses existing design system components
- ✅ Uses @libs/shared libraries (Socket, Map, Video)
- ✅ Follows established patterns
- ✅ Acts as a senior engineer with 10+ years React experience
- ✅ Writes secure, scalable, performant code

---

## Contribution

These guides are living documents. If you:
- Find outdated information
- Discover undocumented patterns
- Have suggestions for improvement

Please:
1. Update the relevant guide
2. Document the change
3. Submit a pull request

---

**Last Updated:** February 7, 2026  
**Maintained By:** FlytBase Development Team
