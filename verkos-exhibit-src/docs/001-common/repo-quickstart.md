# 🚀 Deployment Quick Start Guide

This guide will help you customize and deploy your FlytBase application with a custom base path and proper environment configuration.

---

## 📚 Table of Contents

1. [Understanding the URL Structure](#understanding-the-url-structure)
2. [Customizing Your Application](#customizing-your-application)
3. [Environment Setup](#environment-setup)
4. [Organization Requirements](#organization-requirements)
5. [API Documentation](#api-documentation)
6. [Deployment Checklist](#deployment-checklist)
7. [Troubleshooting](#troubleshooting)

---

## 🌐 Understanding the URL Structure

### How FlytBase Apps Are Accessed

FlytBase applications follow this URL structure:

```
https://<org-name>.flytbase.com/<app-base-path>/<app-routes>
```

**Example:**
```
https://fb-stag.flytbase.com/my-custom-app/dashboard
│                          │              │
│                          │              └─ Application route
│                          └──────────────── App base path
└─────────────────────────────────────────── Organization subdomain
```

### Breaking It Down

1. **Organization Subdomain** - Your organization as a subdomain
   - Development: `localhost:8080` (no subdomain for local)
   - Staging: `fb-stag.flytbase.com` (fb-stag organization)
   - Production: `<your-org>.flytbase.com` (your organization name)
   - Example: `acme-corp.flytbase.com`

2. **App Base Path** - Your application's unique identifier
   - Currently: `/flytbase-app-template/`
   - **You need to change this** to your app name
   - Example: `/asset-inspector/`, `/fleet-manager/`, `/mission-planner/`

3. **App Routes** - Internal application routes
   - Defined by your TanStack Router routes
   - Examples: `/`, `/dashboard`, `/settings`
   - Managed automatically by the router

---

## 🎨 Customizing Your Application

### Step 1: Choose Your Application Name

First, decide on a clear, URL-friendly name for your application:

**Good Examples:**
- `asset-inspector` - Asset inspection app
- `fleet-manager` - Fleet management app
- `mission-planner` - Mission planning app
- `live-ops` - Live operations dashboard

**Naming Guidelines:**
- Use lowercase letters
- Use hyphens for spaces (kebab-case)
- Keep it short and descriptive (2-3 words max)
- Avoid special characters
- Make it unique within FlytBase ecosystem

### Step 2: Update Environment Files

Update the `websiteBasePath` in **all** environment files:

**File: `src/environments/environment.dev.ts`**
```typescript
export const environment = {
  environment: 'development',
  appInfo: {
    appName: 'My Custom App Dev',  // ← Update this
    tenantId: 'development',
    devOrgId: DEV_ORGS.ASSET_MANAGEMENT,
    websiteBasePath: '/my-custom-app/',  // ← Update this
    apiBasePath: '/auth',
    apiDomain: 'https://your-tunnel-url.trycloudflare.com',
    websiteDomain: window.location.origin,
    // ... rest of config
  },
  // ... rest of config
};
```

**File: `src/environments/environment.stag.ts`**
```typescript
export const environment = {
  environment: 'staging',
  appInfo: {
    appName: 'My Custom App Stag',  // ← Update this
    tenantId: 'staging',
    devOrgId: '658295f8dbab9efb302183ab',  // fb-stag org ID
    websiteBasePath: '/my-custom-app/',  // ← Update this
    apiBasePath: '/auth',
    apiDomain: 'https://api-stag.flytbase.com',
    websiteDomain: window.location.origin,
    loginAppUrl: 'https://login-stag.flytbase.com',
    consoleAppUrl: 'https://fb-stag.flytbase.com',
    accountAppUrl: 'https://account-stag.flytbase.com',
  },
  // ... rest of config
};
```

**File: `src/environments/environment.prod.ts`**
```typescript
export const environment = {
  environment: 'production',
  appInfo: {
    appName: 'My Custom App',  // ← Update this
    tenantId: 'production',
    devOrgId: '',  // Empty for production
    websiteBasePath: '/my-custom-app/',  // ← Update this
    apiBasePath: '/auth',
    apiDomain: 'https://api.flytbase.com',
    websiteDomain: window.location.origin,
    loginAppUrl: 'https://login.flytbase.com',
    consoleAppUrl: 'https://<your-org>.flytbase.com',
    accountAppUrl: 'https://account.flytbase.com',
  },
  // ... rest of config
};
```

**File: `src/environments/environment.eu-prod.ts`** (if using EU deployment)
```typescript
export const environment = {
  environment: 'production',
  appInfo: {
    appName: 'My Custom App EU',  // ← Update this
    tenantId: 'production',
    devOrgId: '',  // Empty for production
    websiteBasePath: '/my-custom-app/',  // ← Update this
    apiBasePath: '/auth',
    apiDomain: 'https://api-eu.flytbase.com',
    websiteDomain: window.location.origin,
    loginAppUrl: 'https://login-eu.flytbase.com',
    consoleAppUrl: 'https://console-eu.flytbase.com',
    accountAppUrl: 'https://account-eu.flytbase.com',
  },
  // ... rest of config
};
```

**Important Notes:**
- The base path **must** start and end with `/` (e.g., `/my-app/`)
- Keep the same path across all environments for consistency
- Update `appName` to reflect your application

### Step 3: Update Router Configuration

**File: `src/router.ts`**
```typescript
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { QueryClient } from '@tanstack/react-query';
import { AuthContextType } from '@auth';
import { AxiosInstance } from 'axios';

// ... type declarations ...

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

export const router = createRouter({
  routeTree,
  basepath: '/my-custom-app',  // ← Update this (no trailing slash)
  context: {
    queryClient,
  },
});

// ... rest of router config ...
```

**Important:** 
- Router `basepath` should **NOT** have a trailing slash
- Must match the `websiteBasePath` from environment files (minus trailing slash)

### Step 4: Update HTML Title

**File: `index.html`**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>My Custom App</title>  <!-- ← Update this -->
    <base href="/" />

    <meta name="viewport" content="width=device-width, initial-scale=1" />
    
    <!-- Update metadata -->
    <meta name="description" content="My Custom App - FlytBase Application" />
    <meta name="author" content="FlytBase" />
    
    <!-- Open Graph for sharing -->
    <meta property="og:title" content="My Custom App" />
    <meta property="og:description" content="My Custom App - FlytBase Application" />
    <meta property="og:type" content="website" />
    
    <!-- ... rest of head ... -->
  </head>
  <!-- ... rest of HTML ... -->
</html>
```

### Step 5: Update Package.json (Optional)

**File: `package.json`**
```json
{
  "name": "@flytbase/my-custom-app",
  "version": "1.0.0",
  "description": "My Custom App for FlytBase",
  // ... rest of package.json
}
```

### Step 6: Update Documentation

Update these files to reflect your new application name:

1. **README.md** - Replace "FlytBase App Template" with your app name
2. **src/integrations/routing-guide.md** - Update base path examples
3. Any other documentation mentioning the template

---

## 🌍 Environment Setup

### Development Environment

For local development:

**File: `src/environments/environment.dev.ts`**
```typescript
export const environment = {
  environment: 'development',
  appInfo: {
    appName: 'My Custom App Dev',
    tenantId: 'development',
    devOrgId: DEV_ORGS.ASSET_MANAGEMENT,  // Or choose another dev org
    websiteBasePath: '/my-custom-app/',
    apiBasePath: '/auth',
    apiDomain: 'https://your-tunnel-url.trycloudflare.com',  // ← Update this
    websiteDomain: window.location.origin,
    loginAppUrl: 'http://localhost:4006',
    consoleAppUrl: 'http://localhost:4002',
    accountAppUrl: 'http://localhost:4004',
  },
  localDeployment: false,
  // ... rest of config
};
```

**Available Development Organizations:**
```typescript
// From: src/libs/shared/enums/dev-env.enums.ts
DEV_ORGS.REAL_DEVICES      // '64ba7374f8b63db2083b2665'
DEV_ORGS.THREE_D_MAP       // '663cb7eb26b3ef56b1f3a202'
DEV_ORGS.ASSET_MANAGEMENT  // '68edfa4d56b0eedad4f01854'
DEV_ORGS.SRV_DEV           // '643969ebd433e41b9b3b3d63'
```

**Local Development URL:**
```
http://localhost:8080/my-custom-app/
```

### Staging Environment

For staging deployment:

**File: `src/environments/environment.stag.ts`**
```typescript
export const environment = {
  environment: 'staging',
  appInfo: {
    appName: 'My Custom App Stag',
    tenantId: 'staging',
    devOrgId: '658295f8dbab9efb302183ab',  // fb-stag staging org
    websiteBasePath: '/my-custom-app/',
    apiBasePath: '/auth',
    apiDomain: 'https://api-stag.flytbase.com',
    websiteDomain: window.location.origin,
    loginAppUrl: 'https://login-stag.flytbase.com',
    consoleAppUrl: 'https://fb-stag.flytbase.com',
    accountAppUrl: 'https://account-stag.flytbase.com',
  },
  localDeployment: false,
  // ... rest of config
};
```

**Staging Access URL:**
```
https://fb-stag.flytbase.com/my-custom-app/
│                          │
│                          └─ Your app base path
└─────────────────────────────────────────── fb-stag staging organization
```

### Production Environment

For production deployment:

**File: `src/environments/environment.prod.ts`**
```typescript
export const environment = {
  environment: 'production',
  appInfo: {
    appName: 'My Custom App',
    tenantId: 'production',
    devOrgId: '',  // Empty for production (uses logged-in user's org)
    websiteBasePath: '/my-custom-app/',
    apiBasePath: '/auth',
    apiDomain: 'https://api.flytbase.com',
    websiteDomain: window.location.origin,
    loginAppUrl: 'https://login.flytbase.com',
    consoleAppUrl: 'https://<your-org>.flytbase.com',
    accountAppUrl: 'https://account.flytbase.com',
  },
  localDeployment: false,
  // ... rest of config
};
```

**Production Access URL:**
```
https://<your-org>.flytbase.com/my-custom-app/
│                               │
│                               └─ Your app base path
└───────────────────────────────────────────── Your organization subdomain
```

---

## 🏢 Organization Requirements

### fb-stag Staging Organization

**IMPORTANT:** For testing and development, you **must** be part of the **fb-stag** organization on the staging environment.

### Why fb-stag?

fb-stag is the designated staging organization for FlytBase application development and testing:

- **Complete test data** - Pre-populated with devices, missions, assets
- **Staging environment access** - Connected to staging backend
- **Testing isolation** - Safe environment for testing without affecting production
- **Developer access** - All FlytBase developers have access

### Getting Access to fb-stag

**Step 1: Create Staging Account**

1. Go to **Staging Login:** https://login-stag.flytbase.com
2. Sign up with your email
3. Complete email verification

**Step 2: Request Organization Access**

Contact FlytBase team to get added to fb-stag organization:

- **Email:** support@flytbase.com
- **Subject:** "Request Access to fb-stag Staging Organization"
- **Include:** 
  - Your staging account email
  - Your application name
  - Reason for access (development/testing)

**Step 3: Verify Access**

1. Login to staging: https://fb-stag.flytbase.com
2. Check organization selector (top-left)
3. Verify "fb-stag" appears in the organization list
4. Switch to fb-stag organization

### Organization ID Reference

```typescript
// Staging Environment
devOrgId: '658295f8dbab9efb302183ab'  // fb-stag staging org

// Development Environment (choose one)
devOrgId: DEV_ORGS.ASSET_MANAGEMENT    // '68edfa4d56b0eedad4f01854'
devOrgId: DEV_ORGS.REAL_DEVICES        // '64ba7374f8b63db2083b2665'
devOrgId: DEV_ORGS.THREE_D_MAP         // '663cb7eb26b3ef56b1f3a202'
devOrgId: DEV_ORGS.SRV_DEV             // '643969ebd433e41b9b3b3d63'

// Production Environment
devOrgId: ''  // Empty - uses logged-in user's organization
```

---

## 📖 API Documentation

### FlytBase API Documentation

All FlytBase REST APIs and Socket.IO APIs are comprehensively documented at:

**🔗 https://apidocs.flytbase.com/login**

### Using the API Documentation

The API documentation portal provides:

- **REST APIs** - Complete REST API reference with endpoints, request/response schemas, and examples
- **Socket.IO APIs** - Real-time event documentation with event names, payloads, and usage patterns
- **Authentication** - How to authenticate and authorize API requests
- **Interactive Testing** - Try APIs directly from the documentation browser
- **Code Examples** - Sample code in multiple languages (cURL, JavaScript, Python)

**To access:**
1. Visit https://apidocs.flytbase.com/login
2. Login with your FlytBase credentials
3. Browse API categories (Authentication, Devices, Missions, Assets, etc.)
4. View detailed endpoint/event documentation
5. Test APIs using the interactive playground

### API Integration in Your App

**REST API Example:**
```typescript
// src/api/services/drone.service.ts
import axios from 'axios';
import { API_ENDPOINTS } from '@api/config/api-endpoints';

export const droneService = {
  getDroneList: async (orgId: string) => {
    const response = await axios.get(`${API_ENDPOINTS.drones.list}`, {
      headers: { 'org-id': orgId },
    });
    return response.data;
  },
};
```

**Socket.IO Example:**
```typescript
// Using the shared socket library
import { useSocket } from '@libs/shared/socket';

function DroneTelemetry({ droneId }) {
  const socket = useSocket();
  
  useEffect(() => {
    // Subscribe to drone telemetry
    socket.emit('subscribe:drone', droneId);
    
    // Listen for telemetry updates
    socket.on('drone:telemetry', (data) => {
      console.log('Telemetry:', data);
    });
    
    return () => {
      socket.emit('unsubscribe:drone', droneId);
      socket.off('drone:telemetry');
    };
  }, [droneId, socket]);
}
```

### API Endpoints Reference

Common API endpoints are centralized in:

**File:** `src/api/config/api-endpoints.ts`

Add your endpoints here:
```typescript
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/signin',
    logout: '/auth/signout',
    verify: '/auth/verify',
  },
  drones: {
    list: '/v2/drones/list',
    details: '/v2/drones/:id',
    command: '/v2/drones/:id/command',
  },
  missions: {
    list: '/v2/missions/list',
    create: '/v2/missions/create',
    execute: '/v2/missions/:id/execute',
  },
  // Add your custom endpoints here
  myFeature: {
    getData: '/v2/my-feature/data',
    postData: '/v2/my-feature/data',
  },
};
```

### Authentication Headers

All API requests automatically include authentication headers (handled by Axios interceptors):

```typescript
{
  'Authorization': 'Bearer <access-token>',
  'st-auth-mode': 'header',
  'rid': 'anti-csrf',
  'org-id': '<current-org-id>',
  'fdi-version': '<frontend-version>',
}
```

You don't need to manually add these headers - they're handled automatically.

---

## ✅ Deployment Checklist

Before deploying your application, complete this checklist:

### 📝 Configuration Checklist

- [ ] **Choose application name** (kebab-case, descriptive)
- [ ] **Update all environment files** (`environment.dev.ts`, `environment.stag.ts`, `environment.prod.ts`, `environment.eu-prod.ts`)
  - [ ] Change `appName`
  - [ ] Change `websiteBasePath`
  - [ ] Verify `apiDomain` for each environment
- [ ] **Update router configuration** (`src/router.ts`)
  - [ ] Change `basepath` (no trailing slash)
- [ ] **Update HTML title** (`index.html`)
- [ ] **Update package.json** (optional)
- [ ] **Update README.md** with your app name
- [ ] **Update documentation** mentioning the template

### 🧪 Testing Checklist

**Local Development:**
- [ ] Run `npm install` to ensure dependencies are installed
- [ ] Start dev server: `npm run dev:dev`
- [ ] Verify app loads at: `http://localhost:8080/my-custom-app/`
- [ ] Test navigation between routes
- [ ] Verify authentication works
- [ ] Test API calls

**Staging Deployment:**
- [ ] Get access to fb-stag staging organization
- [ ] Verify staging environment configuration
- [ ] Build staging bundle: `npm run build:stag`
- [ ] Deploy to staging environment
- [ ] Access at: `https://fb-stag.flytbase.com/my-custom-app/`
- [ ] Test with staging API (`api-stag.flytbase.com`)
- [ ] Verify authentication flow
- [ ] Test all features with staging data

**Production Deployment:**
- [ ] Review all changes with team
- [ ] Verify production environment configuration
- [ ] Build production bundle: `npm run build:prod`
- [ ] Deploy to production environment
- [ ] Access at: `https://<your-org>.flytbase.com/my-custom-app/`
- [ ] Smoke test critical features
- [ ] Monitor error logs

### 🔐 Security Checklist

- [ ] No hardcoded API keys or secrets
- [ ] All secrets in environment files (not committed)
- [ ] Authentication properly configured
- [ ] CORS settings reviewed (backend proxy if needed)
- [ ] API endpoints use HTTPS
- [ ] Organization ID validation enabled

### 📋 Documentation Checklist

- [ ] Update README with new app name and purpose
- [ ] Document custom API endpoints in `src/api/config/api-endpoints.ts`
- [ ] Add integration guides for custom features
- [ ] Update environment setup instructions
- [ ] Document any custom environment variables

---

## 🔧 Troubleshooting

### Issue: App Not Loading / 404 Error

**Problem:** Accessing your app URL shows 404 or blank page

**Possible Causes:**
1. Base path mismatch between environment and router
2. Incorrect organization name in URL
3. App not deployed to the environment

**Solutions:**
```typescript
// 1. Check environment file
websiteBasePath: '/my-custom-app/'  // Must have leading and trailing slash

// 2. Check router configuration
basepath: '/my-custom-app'  // Must have leading slash, NO trailing slash

// 3. Verify they match (minus trailing slash)
websiteBasePath.slice(0, -1) === basepath  // Should be true
```

**Verify URL structure:**
```
Development:  http://localhost:8080/my-custom-app/
Staging:      https://fb-stag.flytbase.com/my-custom-app/
Production:   https://<your-org>.flytbase.com/my-custom-app/
```

### Issue: Authentication Not Working

**Problem:** Login redirects don't work, or you get logged out immediately

**Possible Causes:**
1. Wrong API domain in environment
2. Base path mismatch affecting redirects
3. Not logged into correct environment
4. CORS issues

**Solutions:**

**Check environment configuration:**
```typescript
// Staging
apiDomain: 'https://api-stag.flytbase.com',
loginAppUrl: 'https://login-stag.flytbase.com',
consoleAppUrl: 'https://fb-stag.flytbase.com',

// Production
apiDomain: 'https://api.flytbase.com',
loginAppUrl: 'https://login.flytbase.com',
consoleAppUrl: 'https://<your-org>.flytbase.com',
```

**Verify authentication flow:**
1. Clear browser cache and cookies
2. Open browser DevTools → Network tab
3. Click login
4. Check for redirect chains
5. Verify tokens in localStorage after login

**Check CORS (for local development):**
- Use backend proxy: `cd backend-proxy && ./start.sh dev`
- Update `apiDomain` in `environment.dev.ts` to proxy URL

### Issue: API Calls Failing

**Problem:** API requests return 401, 403, or CORS errors

**Possible Causes:**
1. Wrong organization ID
2. Not authenticated
3. Missing organization context
4. Wrong API domain

**Solutions:**

**Verify organization setup:**
```typescript
// Development - use any dev org
devOrgId: DEV_ORGS.ASSET_MANAGEMENT

// Staging - use fb-stag
devOrgId: '658295f8dbab9efb302183ab'

// Production - leave empty
devOrgId: ''
```

**Check API requests in Network tab:**
```typescript
// Should include these headers
'org-id': '<organization-id>'
'Authorization': 'Bearer <token>'
'st-auth-mode': 'header'
```

**Verify you're in correct organization:**
1. Check organization selector in top-left of console
2. Switch to fb-stag (staging) or your org (production)
3. Refresh your app

### Issue: Environment Not Switching

**Problem:** Changes to environment files not reflected in app

**Possible Causes:**
1. Using wrong npm script
2. Vite mode not matching environment file
3. Build cache
4. Browser cache

**Solutions:**

**Use correct npm script:**
```bash
npm run dev:dev      # Uses environment.dev.ts
npm run dev:stag     # Uses environment.stag.ts
npm run dev:prod     # Uses environment.prod.ts
npm run dev:eu-prod  # Uses environment.eu-prod.ts
```

**Clear build cache:**
```bash
# Stop dev server (Ctrl+C)
rm -rf node_modules/.vite
npm run dev:dev
```

**Hard refresh browser:**
```
Chrome/Edge: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
Firefox: Cmd+Shift+R (Mac) or Ctrl+F5 (Windows)
```

### Issue: Routes Not Working

**Problem:** Direct navigation to routes shows 404, or routes don't load

**Possible Causes:**
1. Route file not following TanStack Router conventions
2. Base path not matching
3. Route tree not regenerated

**Solutions:**

**Check route file naming:**
```
src/routes/
├── _layout.tsx           ✅ Layout route
├── _layout/
│   ├── index.tsx         ✅ / route
│   └── dashboard.tsx     ✅ /dashboard route
├── login.tsx             ✅ /login route
└── settings.tsx          ✅ /settings route
```

**Regenerate route tree:**
```bash
# Routes auto-regenerate on file save with Vite HMR
# Or manually restart dev server:
npm run dev:dev
```

**Verify base path is correct:**
```typescript
// src/router.ts
basepath: '/my-custom-app'  // Must match environment base path
```

### Issue: Organization Not Found in Staging

**Problem:** Can't access staging app, "Organization not found" error

**Possible Causes:**
1. Not part of fb-stag organization
2. Wrong organization ID in environment
3. Not logged into staging

**Solutions:**

**Request fb-stag access:**
- Contact FlytBase support
- Provide your staging account email
- Wait for access approval

**Verify organization ID:**
```typescript
// src/environments/environment.stag.ts
devOrgId: '658295f8dbab9efb302183ab'  // fb-stag staging org
```

**Verify you're logged into staging:**
1. Go to https://login-stag.flytbase.com
2. Login with your staging account
3. Navigate to https://fb-stag.flytbase.com
4. Check organization selector shows "fb-stag"

### Issue: Build Errors

**Problem:** Build fails with TypeScript or module errors

**Possible Causes:**
1. Missing dependencies
2. Type errors after environment changes
3. Import path errors

**Solutions:**

**Reinstall dependencies:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Check TypeScript errors:**
```bash
npm run lint
```

**Verify imports after base path change:**
```typescript
// Ensure all environment imports use @env alias
import { environment } from '@env';  // ✅ Correct

// Not direct path
import { environment } from './environments/environment.dev';  // ❌ Wrong
```

---

## 🚦 Quick Reference

### NPM Scripts

```bash
# Development
npm run dev:dev      # Development environment
npm run dev:stag     # Staging environment
npm run dev:prod     # Production environment

# Build
npm run build:dev    # Build for development
npm run build:stag   # Build for staging
npm run build:prod   # Build for production

# Backend Proxy (for local dev)
cd backend-proxy
./start.sh dev       # Start proxy with dev backend
./start.sh stag      # Start proxy with staging backend
./stop.sh            # Stop proxy
./status.sh          # Check status
```

### Important URLs

**Development:**
```
App:     http://localhost:8080/my-custom-app/
API:     https://your-tunnel-url.trycloudflare.com (via proxy)
```

**Staging:**
```
Login:   https://login-stag.flytbase.com
Console: https://fb-stag.flytbase.com
App:     https://fb-stag.flytbase.com/my-custom-app/
API:     https://api-stag.flytbase.com
Docs:    https://apidocs.flytbase.com/login
```

**Production:**
```
Login:   https://login.flytbase.com
Console: https://<your-org>.flytbase.com
App:     https://<your-org>.flytbase.com/my-custom-app/
API:     https://api.flytbase.com
Docs:    https://apidocs.flytbase.com/login
```

### Files to Update

| File | What to Change |
|------|----------------|
| `src/environments/environment.dev.ts` | `appName`, `websiteBasePath` |
| `src/environments/environment.stag.ts` | `appName`, `websiteBasePath` |
| `src/environments/environment.prod.ts` | `appName`, `websiteBasePath` |
| `src/environments/environment.eu-prod.ts` | `appName`, `websiteBasePath` |
| `src/router.ts` | `basepath` (no trailing slash) |
| `index.html` | `<title>`, metadata |
| `package.json` | `name`, `description` (optional) |
| `README.md` | App name references |

### Organization IDs

```typescript
// Staging (fb-stag)
'658295f8dbab9efb302183ab'

// Development (choose one)
DEV_ORGS.ASSET_MANAGEMENT  // '68edfa4d56b0eedad4f01854'
DEV_ORGS.REAL_DEVICES      // '64ba7374f8b63db2083b2665'
DEV_ORGS.THREE_D_MAP       // '663cb7eb26b3ef56b1f3a202'
DEV_ORGS.SRV_DEV           // '643969ebd433e41b9b3b3d63'

// Production
''  // Empty - uses logged-in user's organization
```

---

## 📞 Getting Help

### Documentation Resources

- **Repository Onboarding:** `docs/004-references/repo-usage/repository-onboarding.md`
- **Integration Guides:** `src/integrations/`
- **Backend Proxy:** `backend-proxy/README.md`
- **API Documentation:** https://apidocs.flytbase.com/login

### Support Channels

- **FlytBase Support:** support@flytbase.com
- **API Questions:** Check https://apidocs.flytbase.com/login first
- **fb-stag Access:** Request via support email
- **Technical Issues:** Create internal issue or contact dev team

---

## ✨ Summary

To deploy your custom FlytBase application:

1. **Choose a name** - Pick a clear, URL-friendly name
2. **Update configuration** - Change base paths in environment files and router
3. **Get fb-stag access** - Join staging organization for testing
4. **Test locally** - Verify everything works on localhost
5. **Deploy to staging** - Test with fb-stag organization
6. **Deploy to production** - After thorough testing

**Remember:**
- Base path must be consistent across all files
- Use fb-stag organization for staging
- Refer to https://apidocs.flytbase.com/login for API documentation
- Test thoroughly in each environment before promoting

---

**Last Updated:** February 7, 2026  
**Maintained By:** FlytBase Development Team

For questions or issues, refer to the documentation or contact the FlytBase development team.
