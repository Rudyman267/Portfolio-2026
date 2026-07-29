# FlytBase App Template

A production-ready React application template for building FlytBase drone management applications with authentication, routing, and design system integration.

## 🚀 What is this?

This template provides a complete foundation for FlytBase applications with:

- **Authentication**: SuperTokens integration (header-based mode for Lovable/dev environments)
- **Routing**: TanStack Router with file-based routing
- **Design System**: FlytBase custom UI components and Tailwind configuration
- **State Management**: Zustand + React Query
- **Multi-environment**: Support for dev, staging, and production environments

## 👋 New to This Template?

**Start here:** Read the **[USER-ONBOARDING.md](./USER-ONBOARDING.md)** guide!

This guide provides a complete step-by-step workflow for:
1. ✅ Remixing the project on Lovable
2. ✅ Setting up AI agent with correct documentation
3. ✅ Getting fb-stag staging access
4. ✅ Answering AI's questions to configure your app
5. ✅ Starting development

**First time users MUST follow this workflow before building!**

## 📦 Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + FlytBase Design System
- **Authentication**: SuperTokens (header-based for Lovable)
- **Routing**: TanStack Router
- **State**: Zustand + React Query
- **HTTP Client**: Axios with interceptors

## 🎯 Quick Start

### Option 1: Remix on Lovable (Recommended)

**👉 Follow the complete workflow:** [USER-ONBOARDING.md](./USER-ONBOARDING.md)

**Quick steps:**
1. Open the [Lovable project](https://lovable.dev/projects/5150bbc3-644f-402f-84cb-3a60e2806cc0)
2. Click **Remix** to create your own copy
3. Follow [USER-ONBOARDING.md](./USER-ONBOARDING.md) to set up AI and get fb-stag access
4. Your app will be live instantly at `*.lovable.app`

### Option 2: Local Development

#### Prerequisites

- Node.js 18+ (install with [nvm](https://github.com/nvm-sh/nvm))
- Docker (for backend proxy)
- Ngrok account (for tunnel)

#### Setup

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

Access the app at: `http://localhost:8080/flytbase-app-template/`

## 🔧 Local Development with Backend

To connect to the FlytBase backend during development:

### 1. Setup Backend Proxy

The proxy adds CORS headers and masks the origin to bypass CORS restrictions:

```bash
# Navigate to proxy directory
cd backend-proxy

# Start Docker proxy + ngrok tunnel
./start.sh
```

This will:
- Start Nginx proxy on `localhost:8888`
- Create an ngrok tunnel with public HTTPS URL
- Print the ngrok URL (e.g., `https://xxxxx.ngrok-free.app`)

### 2. Update Environment Files

Copy the ngrok URL and update:

**For local dev:** `src/environments/environment.dev.ts`
```typescript
apiDomain: 'https://YOUR-NGROK-URL.ngrok-free.app'
```

### 3. Restart Dev Server

```bash
npm run dev
```

Your app can now authenticate and make API calls!

## 🌍 Environment Configuration

The app automatically selects the environment based on deployment:

- **Local**: `environment.dev.ts` (uses Vite dev mode)
- **Lovable**: `environment.lovable.ts` (detected via domain)
- **Staging**: `environment.stag.ts` (CloudFlare staging)
- **Production**: `environment.prod.ts` (CloudFlare production)

Key environment settings:
- `apiDomain`: Backend API URL
- `websiteBasePath`: Application base path (e.g., `/flytbase-app-template/`)
- `devOrgId`: Organization ID for development/testing

## 🚢 Deployment

### Lovable (Automatic)

Changes pushed to your connected branch are automatically deployed to Lovable.

Access: `https://your-app.lovable.app/flytbase-app-template/`

### CloudFlare Pages

1. Push changes to your `staging` or `main` branch
2. CloudFlare Pages automatically builds and deploys
3. Environment is selected based on branch:
   - `staging` → `environment.stag.ts`
   - `main` → `environment.prod.ts`

**Note**: No backend proxy needed in production - staging/production environments use direct API access with CORS configured on the backend.

## 📁 Project Structure

```
├── src/
│   ├── routes/              # TanStack Router file-based routes
│   │   ├── _layout/         # Protected routes (requires auth)
│   │   ├── login.tsx        # Login page
│   │   └── logout.tsx       # Logout page
│   ├── environments/        # Environment configurations
│   ├── libs/                # Shared libraries
│   │   ├── core/            # Core functionality (auth, etc.)
│   │   └── shared/          # Shared components, utilities
│   ├── components/          # Application components
│   ├── store/               # Zustand stores
│   └── integrations/        # Third-party integrations
├── backend-proxy/           # Docker Nginx CORS proxy
│   ├── nginx.conf           # Nginx configuration
│   ├── docker-compose.yml   # Docker setup
│   └── start.sh             # Startup script with ngrok
└── public/                  # Static assets
```

## 🔐 Authentication

This template uses **header-based authentication** for Lovable and local development:

- **Token Storage**: localStorage (not cookies)
- **Auth Mode**: Headers (`st-auth-mode: header`)
- **Subdomain Check**: Skipped for localhost/Lovable (uses `devOrgId`)

### Login Flow

1. User clicks OAuth provider (Google/Microsoft)
2. Backend returns tokens in response headers
3. SuperTokens SDK saves to localStorage
4. All API requests include tokens in headers

## 🎨 Customization

### Rename the Application

Search and replace in these files:
1. `src/environments/*.ts` - Update `websiteBasePath`
2. `src/router.ts` - Update `basepath`
3. `index.html` - Update `<title>`
4. `src/integrations/routing-guide.md` - Update documentation

```bash
# Example: Rename to "my-app"
websiteBasePath: '/my-app/'
basepath: '/my-app'
```

### Customize Branding

- **Logo**: Replace `public/assets/flytbase-logo.svg`
- **Favicon**: Update favicon links in `index.html`
- **Colors**: Modify `tailwind.config.ts`
- **Typography**: Edit `src/libs/shared/configs/typography.ts`

## 🐛 Troubleshooting

### "Saving to cookies" error

✅ Fixed! The template uses header-based auth. If you see this:
- Verify `environment.dev.ts` has correct `apiDomain`
- Check network tab for `st-auth-mode: header` in requests
- Clear localStorage and try again

### Subdomain check failing

✅ Fixed! Lovable domains skip the subdomain check and use `devOrgId` from environment.


## 📚 Documentation

### 🚀 Getting Started

**New to this repository?** Start here:
- **[USER-ONBOARDING.md](./USER-ONBOARDING.md)** - Complete Lovable workflow for new users (START HERE!)
- **[Repository Onboarding Guide](docs/001-common/repository-onboarding.md)** - Comprehensive guide covering repository structure, tech stack, authentication, design system, and development patterns
- **[Deployment Quick Start Guide](docs/001-common/repo-quickstart.md)** - Step-by-step guide to customize and deploy your application

### Integration Guides

- **Routing Guide**: `src/integrations/routing-guide.md`
- **Socket.IO Integration**: `src/integrations/socket-integration.md`
- **Map Integration**: `src/integrations/map-integration.md`
- **Video Streaming**: `src/integrations/video-streaming-integration.md`
- **State Management**: `src/integrations/state-management-integration.md`
- **Design System**: `src/integrations/design-system-guide.md`
- **API Integration**: `src/integrations/api-integration.md`

### Core Libraries

- **FlytBase Design System**: `src/libs/shared/ui/`
- **Authentication**: `src/libs/core/auth-frontend/`
- **Shared Components**: `src/libs/shared/components/`

### Architecture Documentation

- **Map Library**: `docs/004-references/core-architectures/map-library/`
- **Socket Library**: `docs/004-references/core-architectures/socket-library/`
- **Auth Library**: `docs/004-references/core-architectures/auth-library/`

### For AI Agents

**🤖 Working with AI Assistants?** 

Read the **[AGENTS.md](./AGENTS.md)** file first - it contains:
- Critical constraints (what libraries you MUST use)
- Required reading list
- Questions to ask the user before building
- Senior engineer standards and best practices
- Code quality checklist

**Quick Context for AI:**
```
"Please read AGENTS.md at the repository root for complete AI agent instructions, 
then read docs/001-common/repository-onboarding.md for repository context including 
structure, tech stack, design system constraints, and patterns."
```

## 🤝 Contributing

1. Fork this template on Lovable
2. Make your changes
3. Test locally with backend proxy
4. Deploy to staging for testing
5. Merge to production

## 📄 License

This is a FlytBase internal template. Contact FlytBase for licensing information.

---

**Need help?** Check the documentation or contact the FlytBase development team.
