# 🚀 User Onboarding - Lovable Workflow

Welcome to the FlytBase App Template! This guide will walk you through getting started with your own FlytBase application on Lovable.

---

## 📋 Quick Start Workflow

### Step 1: Access the Lovable Template

1. **Go to Lovable:** Visit the FlytBase App Template project on Lovable 
 [LOVABLE_PROJECT](https://lovable.dev/projects/5150bbc3-644f-402f-84cb-3a60e2806cc0)
2. **Login:** Sign in with your Lovable account
3. **IMPORTANT** DON'T PROMPT ANYTHING IN THE TEMPLATE APP PROJECT AT ANY COST

### Step 2: Remix the Project

1. **Click "Remix"** button to create your own copy
2. **Name your project:** Give it a meaningful name (e.g., "Asset Inspector App", "Fleet Manager")
3. **Wait for setup:** Lovable will create your project workspace
4. **Connect to github** We have FlytbaseAILabs github account. connect your projects to that account so all the codebase stays under FlytBase org and Don't link to personal github accounts at any Cost

### Step 3: Initialize AI Agent

Once your project is ready, start working with the AI agent:

**3.1. First, tell the AI to read the agent instructions:**
```
@AGENTS.md
```

**3.2. Then, tell the AI to read the repository onboarding:**
```
@docs/001-common/repository-onboarding.md
```

**3.3. Finally, tell the AI to read the deployment quick start:**
```
@docs/001-common/repo-quickstart.md
```

### Step 4: Answer AI's Questions

The AI will now ask you questions about your application. Be ready to answer:

- **What application are you building?** (Purpose and features)
- **Application name and base route?** (e.g., `/asset-inspector/`)
- **Which libraries do you need?** (Socket.IO, Map, Video Streaming)
- **Which environment?** (Local development, Staging/Lovable, Production)
- **Which APIs will you use?** (Device, Mission, Asset, etc.)

### Step 5: Get fb-stag Access (IMPORTANT)

To test your application on staging, you **must** get access to the fb-stag organization:

**5.1. Create Staging Account:**
- Go to: https://login-stag.flytbase.com
- Sign up with your email
- Complete email verification

**5.2. Request fb-stag Access:**
- Email: support@flytbase.com or contact Havish
- Subject: "Request Access to fb-stag Staging Organization"
- Include:
  - Your staging account email
  - Your application name
  - Reason: Development/Testing

**5.3. Wait for Approval:**
- FlytBase team will add you to fb-stag
- You'll receive confirmation email

**5.4. Verify Access:**
- Login to: https://fb-stag.flytbase.com
- Check organization selector (top-left)
- Confirm "fb-stag" appears
- Switch to fb-stag organization

### Step 6: Start Building

Once the AI has your answers and you have fb-stag access:

1. **AI will configure** your application with the correct base path
2. **AI will set up** environment files for dev/staging/production
3. **You can start building** features using existing libraries
4. **AI will guide you** following senior engineer best practices

---

## 🎯 What Happens Next?

After completing these steps:

### ✅ Your Project is Configured
- Application name and base path set
- Environment files updated
- Router configured
- Ready for development

### ✅ You Can Test Locally
- Use Lovable's preview
- Or clone and run locally with `npm run dev:dev`

### ✅ You Can Deploy to Staging
- Push changes to your connected branch
- Test at: `https://fb-stag.flytbase.com/your-app/`
- Access real staging data

### ✅ You Have AI Support
- AI knows the repository structure
- AI will use existing libraries (no new UI libraries!)
- AI will write secure, performant code
- AI will follow FlytBase design system

---

## 📖 Important Documents

These documents are essential references:

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **AGENTS.md** | AI instructions & constraints | AI reads this first |
| **repository-onboarding.md** | Complete repo guide | Understanding structure |
| **repo-quickstart.md** | Deployment & config | Customizing & deploying |

---

## ⚠️ Key Reminders

### DO ✅
- ✅ Get fb-stag access **before** testing on staging
- ✅ Answer AI's questions accurately
- ✅ Use existing design system components
- ✅ Use existing libraries (Socket, Map, Video)
- ✅ Test locally first, then staging, then production

### DON'T ❌
- ❌ Skip reading AGENTS.md (AI needs this!)
- ❌ Add new UI libraries (Material-UI, Ant Design, etc.)
- ❌ Hardcode environment values
- ❌ Deploy to production without staging tests
- ❌ Bypass fb-stag organization access

---

## 🆘 Need Help?

### Documentation
- **Complete Guide:** `docs/001-common/repository-onboarding.md`
- **Deployment Guide:** `docs/001-common/repo-quickstart.md`
- **Integration Guides:** `src/integrations/`
- **API Documentation:** https://apidocs.flytbase.com/login

### Support
- **FlytBase Support:** support@flytbase.com
- **fb-stag Access:** support@flytbase.com
- **Technical Issues:** Contact dev team

---

## ✨ You're Ready!

Once you've completed all steps above, you're ready to build amazing FlytBase applications!

**Remember:** 
- The AI will guide you using existing libraries and design system
- Test on fb-stag before production
- Follow the patterns in the repository
- Refer to documentation when needed

**Happy Building!** 🎉

---

**Last Updated:** February 7, 2026  
**For Questions:** Contact FlytBase Support (support@flytbase.com)
