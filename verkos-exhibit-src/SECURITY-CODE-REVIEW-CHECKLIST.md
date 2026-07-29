# 🔒 Security Code Review Checklist - FlytBase Applications

## Document Purpose

This checklist is designed for **thorough security review** of custom applications built on the FlytBase App Template before production deployment. Each application MUST pass all critical and high-severity checks.

**Review Context:**
- Multi-tenant drone management platform
- React/TypeScript SPA applications
- SuperTokens authentication
- FlytBase API integration
- Production deployment to `orgs.flytbase.com`

---

## 📊 Severity Levels

| Level | Symbol | Description | Action Required |
|-------|--------|-------------|-----------------|
| **CRITICAL** | 🔴 | Must fix before production | Blocking deployment |
| **HIGH** | 🟠 | Security risk, fix ASAP | Required for approval |
| **MEDIUM** | 🟡 | Should fix, follow-up allowed | Recommended fix |
| **LOW** | 🟢 | Best practice improvement | Nice to have |

---

## 1️⃣ Authentication & Authorization Security

### 1.1 Authentication Implementation

#### 🔴 CRITICAL Checks

- [ ] **No Custom Authentication Implementation**
  ```typescript
  // ❌ FORBIDDEN - Custom auth implementation
  const login = async (email, password) => {
    const response = await fetch('/auth/login', {
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem('token', response.token);
  };
  
  // ✅ REQUIRED - Use SuperTokens
  import { useAuth } from '@libs/core/auth-frontend';
  const { login, logout, isAuthenticated } = useAuth();
  ```
  **Why:** Custom auth bypasses secure session management, CSRF protection, and token rotation.
  
  **Check:**
  - Search for: `localStorage.setItem('token'`, `sessionStorage.setItem('auth'`
  - Search for: Custom `/auth/` endpoints not using SuperTokens
  - Search for: Manual JWT verification in frontend
  - Grep: `grep -r "setItem.*token" src/` should return nothing

---

- [ ] **No Hardcoded Credentials**
  ```typescript
  // ❌ FORBIDDEN
  const API_KEY = 'sk_live_123456789';
  const ADMIN_PASSWORD = 'admin123';
  const SECRET_TOKEN = 'abc-def-ghi';
  
  // ✅ CORRECT - Use environment variables
  const API_KEY = import.meta.env.VITE_API_KEY;
  ```
  **Check:**
  - Search files for: `password =`, `token =`, `secret =`, `api_key =`, `apiKey =`
  - Look for: Base64 encoded strings that might be credentials
  - Grep: `grep -ri "password.*=.*['\"]" src/` (excluding test files)
  - Verify: No `.env` files committed to git

---

- [ ] **Protected Routes Enforce Authentication**
  ```typescript
  // ❌ INSECURE - No auth check
  export const Route = createFileRoute('/_layout/sensitive-data')({
    component: SensitiveData,
  });
  
  // ✅ SECURE - Auth required
  export const Route = createFileRoute('/_layout/sensitive-data')({
    beforeLoad: async ({ context }) => {
      if (!context.auth.isAuthenticated) {
        throw redirect({ to: '/login' });
      }
    },
    component: SensitiveData,
  });
  ```
  **Check:**
  - Review all route files in `src/routes/`
  - Verify `_layout.tsx` enforces authentication
  - Check that sensitive routes have `beforeLoad` guards
  - Test: Can you access protected routes by direct URL when logged out?

---

#### 🟠 HIGH Severity

- [ ] **Session Timeout Handling**
  ```typescript
  // ✅ REQUIRED - Handle expired sessions
  axios.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        // Clear session and redirect to login
        signOut();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
  ```
  **Check:**
  - Verify 401 interceptor exists in API client
  - Test: Does expired token redirect to login?
  - Check: Are expired sessions cleared properly?

---

- [ ] **No Authentication Tokens in URLs**
  ```typescript
  // ❌ INSECURE - Token in URL
  navigate(`/dashboard?token=${authToken}`);
  window.location.href = `/api/data?api_key=${key}`;
  
  // ✅ SECURE - Use headers
  axios.get('/api/data', {
    headers: { Authorization: `Bearer ${token}` }
  });
  ```
  **Check:**
  - Search for: `?token=`, `?api_key=`, `?auth=` in navigation
  - Grep: `grep -r "navigate.*token" src/`
  - Browser DevTools Network tab: Check URL parameters for sensitive data

---

### 1.2 Authorization & Access Control

#### 🔴 CRITICAL Checks

- [ ] **Role-Based Access Control (RBAC) Implemented**
  ```typescript
  // ❌ INSECURE - No permission check
  const deleteDevice = () => {
    deviceService.delete(deviceId);
  };
  
  // ✅ SECURE - Check permissions
  const { hasPermission } = usePermissions();
  
  const deleteDevice = () => {
    if (!hasPermission('device.delete')) {
      toast.error('Unauthorized action');
      return;
    }
    deviceService.delete(deviceId);
  };
  ```
  **Check:**
  - Review critical actions (delete, modify, admin functions)
  - Verify permission checks before dangerous operations
  - Check: Are UI elements hidden based on permissions?
  - Test: Can user trigger unauthorized actions via console?

---

- [ ] **Client-Side Permissions Are Advisory Only**
  ```typescript
  // ⚠️ IMPORTANT - Frontend checks are NOT security
  // Backend MUST enforce permissions
  
  // Frontend: UI control only
  if (hasPermission('device.delete')) {
    return <Button onClick={deleteDevice}>Delete</Button>;
  }
  
  // Backend: MUST validate (not shown, but verify this exists)
  // DELETE /api/devices/:id should check user permissions
  ```
  **Verification:**
  - Document that backend validation exists
  - Frontend should fail gracefully if backend denies action
  - Never rely on frontend-only permission checks

---

## 2️⃣ Multi-Tenancy & Data Isolation

### 2.1 Organization/Tenant Context

#### 🔴 CRITICAL Checks

- [ ] **Organization ID Required for All API Calls**
  ```typescript
  // ❌ INSECURE - No org-id header
  axios.get('/v2/drones/list');
  
  // ✅ SECURE - org-id header required
  axios.get('/v2/drones/list', {
    headers: { 'org-id': currentOrgId }
  });
  
  // ✅ BEST - Axios interceptor adds it automatically
  axios.interceptors.request.use(config => {
    const orgId = getOrgIdFromContext();
    if (!orgId) throw new Error('Organization context required');
    config.headers['org-id'] = orgId;
    return config;
  });
  ```
  **Check:**
  - Verify axios interceptor adds `org-id` header globally
  - Search for manual API calls: Should use configured axios instance
  - Grep: `fetch(` in src/ should be minimal (use axios instead)
  - Test: DevTools Network tab - every API call has `org-id` header

---

- [ ] **No Organization ID in URLs or Client State**
  ```typescript
  // ❌ INSECURE - Org ID in URL
  navigate(`/dashboard/${orgId}/devices`);
  localStorage.setItem('orgId', orgId);
  
  // ✅ SECURE - Org ID from auth context
  const { orgId } = useAuth(); // From session token
  navigate('/dashboard/devices'); // No org ID in URL
  ```
  **Why:** Users could manipulate URL/localStorage to access other organizations' data.
  
  **Check:**
  - URLs should NOT contain organization IDs
  - Organization context comes from authenticated session only
  - LocalStorage/SessionStorage should NOT store org IDs
  - Grep: `grep -r "orgId.*localStorage\|sessionStorage" src/`

---

- [ ] **Cross-Tenant Data Leakage Prevention**
  ```typescript
  // ❌ INSECURE - Shared cache across orgs
  const { data } = useQuery({
    queryKey: ['drones'], // Missing org context!
    queryFn: droneService.getAll,
  });
  
  // ✅ SECURE - Org-specific cache
  const { orgId } = useAuth();
  const { data } = useQuery({
    queryKey: ['drones', orgId], // Org-specific cache key
    queryFn: () => droneService.getAll(orgId),
  });
  ```
  **Check:**
  - All React Query keys include organization context
  - Cache is invalidated on organization switch
  - No shared state between organizations
  - Test: Switch orgs - old data should not appear

---

#### 🟠 HIGH Severity

- [ ] **Organization Context Validation**
  ```typescript
  // ✅ REQUIRED - Validate org context exists
  const useRequireOrg = () => {
    const { orgId } = useAuth();
    
    useEffect(() => {
      if (!orgId) {
        toast.error('Organization context required');
        navigate('/select-organization');
      }
    }, [orgId]);
    
    return orgId;
  };
  ```
  **Check:**
  - Routes requiring org context validate it exists
  - Clear error messaging when org context missing
  - Graceful handling of missing context

---

### 2.2 Data Filtering & Scoping

#### 🔴 CRITICAL Checks

- [ ] **No Client-Side Data Filtering by Organization**
  ```typescript
  // ❌ INSECURE - Client-side filtering
  const myData = allData.filter(item => item.orgId === currentOrgId);
  
  // ✅ SECURE - Backend filters by org
  // Backend MUST filter by org-id header
  // Frontend receives only authorized data
  const { data } = useQuery({
    queryKey: ['data', orgId],
    queryFn: () => api.getData(), // Backend filters
  });
  ```
  **Why:** If frontend receives all orgs' data, it's already leaked.
  
  **Check:**
  - Search for: `.filter(.*orgId`
  - Verify: API responses only contain current org's data
  - Test: Inspect API responses - should not see other orgs' data

---

## 3️⃣ Secret Management & Sensitive Data

### 3.1 Environment Variables

#### 🔴 CRITICAL Checks

- [ ] **No Secrets Committed to Git**
  ```bash
  # ❌ FORBIDDEN - These files expose secrets
  .env
  .env.local
  .env.production
  credentials.json
  serviceAccount.json
  
  # ✅ REQUIRED - Add to .gitignore
  .env*
  !.env.example
  *credentials*.json
  ```
  **Check:**
  - Run: `git log --all --full-history -- "*.env"`
  - Run: `git grep -i "api.*key.*=.*['\"]" $(git rev-list --all)`
  - Verify: `.env` files in `.gitignore`
  - Check git history: No secrets committed previously

---

- [ ] **Environment Variables Properly Scoped**
  ```typescript
  // ❌ INSECURE - Backend secret in frontend
  VITE_DATABASE_PASSWORD=secret123
  VITE_ADMIN_SECRET_KEY=abc123
  
  // ✅ CORRECT - Only frontend-safe vars
  VITE_APP_NAME=My App
  VITE_API_DOMAIN=https://api.flytbase.com
  VITE_ENVIRONMENT=production
  ```
  **Rule:** Frontend should NEVER have backend secrets.
  
  **Check:**
  - Review all `VITE_*` environment variables
  - Look for: PASSWORD, SECRET, PRIVATE_KEY, TOKEN
  - Verify: No database credentials, admin tokens, API secrets

---

- [ ] **No Secrets in Source Code**
  ```typescript
  // ❌ FORBIDDEN
  const FIREBASE_KEY = 'AIzaSyC..._actual_key';
  const STRIPE_SECRET = 'sk_live_51J...';
  const DB_CONNECTION = 'mongodb://admin:pass@host/db';
  
  // ✅ CORRECT
  const FIREBASE_KEY = import.meta.env.VITE_FIREBASE_KEY;
  ```
  **Check:**
  - Grep: `grep -ri "api[_-]?key.*=.*['\"][^$]" src/`
  - Grep: `grep -ri "secret.*=.*['\"][^$]" src/`
  - Search for: Long alphanumeric strings (potential keys)
  - Use tools: `truffleHog`, `git-secrets` to scan repository

---

#### 🟠 HIGH Severity

- [ ] **Sensitive Data Not Logged**
  ```typescript
  // ❌ INSECURE - Logging sensitive data
  console.log('User token:', authToken);
  console.log('API response:', userData); // May contain PII
  
  // ✅ SECURE - No sensitive data in logs
  console.log('User authenticated');
  console.log('API call succeeded');
  
  // ✅ ACCEPTABLE - Development only
  if (import.meta.env.DEV) {
    console.log('Debug:', { userId: user.id }); // Non-sensitive
  }
  ```
  **Check:**
  - Search: `console.log.*token`, `console.log.*password`
  - Review: All console.log/console.error for sensitive data
  - Verify: Production builds remove console statements
  - Check: `vite.config.ts` for drop_console in production

---

### 3.2 API Keys & Tokens

#### 🔴 CRITICAL Checks

- [ ] **No API Keys Exposed in Client Bundle**
  ```typescript
  // ❌ INSECURE - Secret API key in frontend
  const OPENAI_API_KEY = 'sk-proj-abc123...';
  
  // ✅ SECURE - Use backend proxy
  // Frontend calls your backend
  const result = await api.post('/ai/generate', { prompt });
  
  // Backend makes OpenAI call with secret key
  ```
  **Check:**
  - Build project: `npm run build`
  - Inspect: `dist/assets/*.js` files for API keys
  - Search for: Keys starting with `sk_`, `pk_`, `AIza`
  - Use: `grep -r "sk_\|pk_\|AIza" dist/`

---

- [ ] **Third-Party SDK Keys Are Client-Safe**
  ```typescript
  // ✅ ACCEPTABLE - Client-safe public keys
  VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...  // Public key
  VITE_GOOGLE_MAPS_KEY=AIza... (with domain restrictions)
  VITE_MAPBOX_TOKEN=pk.... (with URL restrictions)
  
  // ❌ NEVER in frontend
  STRIPE_SECRET_KEY=sk_live_...  // Secret key
  ```
  **Verify:**
  - Public keys have domain/URL restrictions configured
  - Secret keys are never in frontend code
  - Document which keys are client-safe

---

- [ ] **No Hardcoded User IDs or Device IDs**
  ```typescript
  // ❌ INSECURE - Hardcoded IDs for testing
  const ADMIN_USER_ID = 'user_123456';
  const TEST_DRONE_ID = 'drone_abc123';
  
  // ✅ CORRECT - Dynamic IDs from API
  const { userId } = useAuth();
  const { droneId } = useParams();
  ```
  **Check:**
  - Search for: UUID patterns in code
  - Look for: `user_`, `drone_`, `device_` prefixes
  - Verify: No production IDs in code

---

## 4️⃣ API Security & Network Communication

### 4.1 API Endpoint Security

#### 🔴 CRITICAL Checks

- [ ] **No Direct Database Access from Frontend**
  ```typescript
  // ❌ ABSOLUTELY FORBIDDEN
  import { MongoClient } from 'mongodb';
  const client = new MongoClient(DB_URL);
  
  import Supabase from '@supabase/supabase-js';
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // ✅ CORRECT - Use backend API only
  const data = await api.get('/devices');
  ```
  **Why:** Direct DB access bypasses all security controls.
  
  **Check:**
  - Search: `mongodb`, `supabase`, `firebase-admin`, `pg`, `mysql`
  - Verify: No database client libraries in `package.json`
  - Confirm: All data access through FlytBase APIs

---

- [ ] **No Open/Unprotected API Endpoints Called**
  ```typescript
  // ❌ INSECURE - Calling internal/admin endpoints
  fetch('https://api.flytbase.com/internal/admin/users');
  fetch('https://api.flytbase.com/_admin/debug');
  
  // ✅ CORRECT - Use documented public APIs
  axios.get('/v2/drones/list');
  ```
  **Check:**
  - Review all API endpoints called
  - Verify endpoints are documented in https://apidocs.flytbase.com
  - Look for: `/internal/`, `/_admin/`, `/debug/`, `/test/`
  - Confirm: No undocumented endpoints used

---

- [ ] **HTTPS Enforced for All API Calls**
  ```typescript
  // ❌ INSECURE - HTTP endpoints
  const API_URL = 'http://api.flytbase.com';
  
  // ✅ SECURE - HTTPS only
  const API_URL = 'https://api.flytbase.com';
  
  // ✅ ENFORCE - Reject non-HTTPS
  if (!API_URL.startsWith('https://')) {
    throw new Error('API must use HTTPS');
  }
  ```
  **Check:**
  - Search: `http://` in code (excluding comments, localhost)
  - Verify: All production URLs use HTTPS
  - Test: Network tab shows all requests use HTTPS

---

#### 🟠 HIGH Severity

- [ ] **API Rate Limiting & Abuse Prevention**
  ```typescript
  // ❌ POTENTIAL ABUSE - No rate limiting
  const pollData = () => {
    setInterval(() => {
      api.getData(); // Polls every second!
    }, 1000);
  };
  
  // ✅ CORRECT - Reasonable polling
  const pollData = () => {
    setInterval(() => {
      api.getData();
    }, 30000); // 30 seconds
  };
  
  // ✅ BETTER - Use WebSocket for real-time
  const socket = useSocket();
  socket.on('data-update', handleUpdate);
  ```
  **Check:**
  - Search for: `setInterval`, `setTimeout` with API calls
  - Review polling intervals: Should be ≥ 10 seconds
  - Verify: No infinite loops making API calls
  - Check: No API calls in render functions (outside useEffect)

---

- [ ] **No Bulk API Calls Without Pagination**
  ```typescript
  // ❌ INEFFICIENT/ABUSIVE
  const allData = await Promise.all(
    Array.from({ length: 1000 }, (_, i) => 
      api.getItem(i)
    )
  ); // 1000 simultaneous requests!
  
  // ✅ CORRECT - Use pagination
  const { data } = useQuery({
    queryKey: ['items', page],
    queryFn: () => api.getItems({ page, limit: 50 }),
  });
  
  // ✅ CORRECT - Use batch endpoint
  const data = await api.getBatch({ ids });
  ```
  **Check:**
  - Search: `Promise.all(.*map`, `Promise.allSettled`
  - Review: Large arrays being mapped to API calls
  - Verify: Pagination for large datasets
  - Confirm: Batch endpoints used when available

---

- [ ] **API Error Handling Doesn't Leak Info**
  ```typescript
  // ❌ INSECURE - Exposes internal details
  catch (error) {
    toast.error(error.message); // May contain SQL, stack traces
  }
  
  // ✅ SECURE - Generic user messages
  catch (error) {
    console.error('API Error:', error); // Log for debugging
    toast.error('Failed to load data. Please try again.');
  }
  
  // ✅ BETTER - Categorized errors
  catch (error) {
    const userMessage = getErrorMessage(error.code);
    toast.error(userMessage);
  }
  ```
  **Check:**
  - Review error handling: Should not expose internals
  - Test: Trigger errors, check user-facing messages
  - Verify: Stack traces not shown to users

---

### 4.2 Request Security

#### 🔴 CRITICAL Checks

- [ ] **Input Validation Before API Calls**
  ```typescript
  // ❌ INSECURE - No validation
  const deleteDrone = (id: string) => {
    api.delete(`/drones/${id}`);
  };
  deleteDrone(userInput); // What if userInput = "../../../admin"?
  
  // ✅ SECURE - Validate input
  const deleteDrone = (id: string) => {
    const droneIdSchema = z.string().uuid();
    const validId = droneIdSchema.parse(id);
    api.delete(`/drones/${validId}`);
  };
  ```
  **Check:**
  - Search: Template literals with user input in URLs
  - Verify: URL parameters validated before use
  - Use: Zod schemas for all user inputs
  - Test: Try path traversal (`../`, `./`)

---

- [ ] **No SQL/NoSQL Injection in Query Parameters**
  ```typescript
  // ❌ POTENTIAL INJECTION
  api.get(`/users?filter=${userInput}`);
  // userInput = "1 OR 1=1" could cause issues
  
  // ✅ SECURE - Parameterized queries
  api.get('/users', {
    params: { filter: userInput } // axios handles encoding
  });
  
  // ✅ BEST - Validated input
  const filterSchema = z.enum(['active', 'inactive', 'all']);
  const validFilter = filterSchema.parse(userInput);
  api.get('/users', { params: { filter: validFilter } });
  ```
  **Check:**
  - Review query parameter construction
  - Verify: Using axios `params` object (auto-encodes)
  - Validate: User inputs before adding to queries

---

#### 🟡 MEDIUM Severity

- [ ] **CORS Configuration Review**
  ```typescript
  // Frontend should NOT configure CORS
  // CORS is backend responsibility
  
  // ✅ Verify backend CORS is properly configured
  // Check: No wildcard origins in production
  // Check: Credentials included only for same origin
  ```
  **Verify:**
  - CORS errors in console? (should not be any)
  - No client-side CORS workarounds
  - Backend properly configured for your domain

---

## 5️⃣ Cross-Site Scripting (XSS) Prevention

### 5.1 Output Encoding & Sanitization

#### 🔴 CRITICAL Checks

- [ ] **No dangerouslySetInnerHTML Without Sanitization**
  ```typescript
  // ❌ CRITICAL XSS VULNERABILITY
  <div dangerouslySetInnerHTML={{ __html: userContent }} />
  
  // ✅ SECURE - Sanitize HTML
  import DOMPurify from 'dompurify';
  <div dangerouslySetInnerHTML={{ 
    __html: DOMPurify.sanitize(userContent) 
  }} />
  
  // ✅ BEST - Avoid HTML altogether
  <div>{userContent}</div> // React auto-escapes
  ```
  **Check:**
  - Search: `dangerouslySetInnerHTML` in entire codebase
  - Verify: DOMPurify used if HTML rendering needed
  - Confirm: `dompurify` in `package.json` if used
  - Test: Try injecting `<script>alert('XSS')</script>`

---

- [ ] **User Input Properly Escaped in JSX**
  ```typescript
  // ✅ SAFE - React auto-escapes
  <div>{userName}</div>
  <input value={userInput} />
  
  // ❌ UNSAFE - Bypassing React escaping
  <div>{eval(userCode)}</div>
  <div>{new Function(userCode)()}</div>
  
  // ⚠️ CAREFUL - URL context
  <a href={userUrl}>Link</a> // Could be javascript: URL
  
  // ✅ SAFE - Validate URLs
  const safeUrl = userUrl.startsWith('http') ? userUrl : '#';
  <a href={safeUrl}>Link</a>
  ```
  **Check:**
  - Search: `eval(`, `new Function(`, `setTimeout(.*string`
  - Review: User-generated URLs in `href` attributes
  - Verify: No dynamic code execution with user input

---

- [ ] **No Inline Event Handlers with User Data**
  ```typescript
  // ❌ XSS VULNERABILITY
  <button onclick={`handleClick('${userInput}')`}>Click</button>
  
  // ✅ CORRECT - React event handlers
  <button onClick={() => handleClick(userInput)}>Click</button>
  ```
  **Check:**
  - Search: `onclick`, `onload`, `onerror` (lowercase)
  - Should only find React's `onClick`, `onLoad`, etc.
  - Verify: No inline JavaScript strings

---

#### 🟠 HIGH Severity

- [ ] **Content Security Policy (CSP) Configured**
  ```html
  <!-- ✅ REQUIRED in index.html -->
  <meta http-equiv="Content-Security-Policy" 
        content="
          default-src 'self';
          script-src 'self' 'unsafe-inline';
          style-src 'self' 'unsafe-inline';
          img-src 'self' data: https:;
          connect-src 'self' https://api.flytbase.com;
        ">
  ```
  **Check:**
  - Verify CSP meta tag exists in `index.html`
  - Review: Allowed sources are appropriate
  - Test: No CSP violations in console
  - Avoid: `unsafe-eval` if possible

---

- [ ] **External Links Use rel="noopener noreferrer"**
  ```typescript
  // ❌ SECURITY RISK - Tabnabbing
  <a href={externalUrl} target="_blank">Link</a>
  
  // ✅ SECURE
  <a href={externalUrl} target="_blank" rel="noopener noreferrer">
    Link
  </a>
  ```
  **Check:**
  - Search: `target="_blank"` without `rel="noopener"`
  - Add ESLint rule: `react/jsx-no-target-blank`

---

### 5.2 URL & Parameter Handling

#### 🔴 CRITICAL Checks

- [ ] **URL Parameters Validated**
  ```typescript
  // ❌ INSECURE - Using URL params directly
  const { id } = useParams();
  api.deleteUser(id); // No validation!
  
  // ✅ SECURE - Validate URL parameters
  const { id } = useParams();
  const userIdSchema = z.string().uuid();
  const validId = userIdSchema.parse(id);
  api.deleteUser(validId);
  ```
  **Check:**
  - Review all `useParams()` usage
  - Verify: Parameters validated before use
  - Test: Try invalid IDs, XSS payloads in URLs

---

- [ ] **No Reflected XSS from Query Parameters**
  ```typescript
  // ❌ REFLECTED XSS
  const params = new URLSearchParams(window.location.search);
  document.body.innerHTML = params.get('message'); // XSS!
  
  // ✅ SAFE
  const params = new URLSearchParams(window.location.search);
  setMessage(params.get('message')); // React escapes it
  ```
  **Check:**
  - Search: `window.location.search`, `URLSearchParams`
  - Verify: Query params not used in `innerHTML` or `eval`
  - Test: Try `?message=<script>alert(1)</script>`

---

## 6️⃣ Client-Side Storage Security

### 6.1 LocalStorage & SessionStorage

#### 🔴 CRITICAL Checks

- [ ] **No Sensitive Data in LocalStorage**
  ```typescript
  // ❌ INSECURE - Sensitive data in storage
  localStorage.setItem('authToken', token);
  localStorage.setItem('userPassword', password);
  localStorage.setItem('orgId', organizationId);
  localStorage.setItem('apiKey', key);
  
  // ✅ CORRECT - Only non-sensitive UI state
  localStorage.setItem('theme', 'dark');
  localStorage.setItem('sidebarCollapsed', 'true');
  ```
  **Why:** LocalStorage is accessible to any script (XSS attacks).
  
  **Check:**
  - Search: `localStorage.setItem`, `sessionStorage.setItem`
  - Review: What data is being stored
  - Verify: No tokens, passwords, org IDs, PII
  - Grep: `grep -r "localStorage.setItem\|sessionStorage.setItem" src/`

---

- [ ] **Sensitive Data Uses Secure HTTP-Only Cookies**
  ```typescript
  // ❌ WRONG - Auth tokens in localStorage
  localStorage.setItem('session', sessionToken);
  
  // ✅ CORRECT - SuperTokens handles cookies
  // Tokens stored in HTTP-only cookies (managed by SuperTokens)
  // Frontend cannot access tokens via JavaScript
  ```
  **Verify:**
  - SuperTokens configured for cookie-based sessions
  - No manual token management in frontend
  - Cookies have HttpOnly, Secure, SameSite flags

---

#### 🟠 HIGH Severity

- [ ] **Storage Data Validated on Read**
  ```typescript
  // ❌ TRUSTING STORAGE - Could be tampered
  const theme = localStorage.getItem('theme');
  document.body.className = theme; // What if theme = "hacked <script>"?
  
  // ✅ VALIDATED
  const themeSchema = z.enum(['light', 'dark']);
  const rawTheme = localStorage.getItem('theme');
  const theme = rawTheme ? themeSchema.parse(rawTheme) : 'light';
  ```
  **Check:**
  - All localStorage reads validated
  - Use Zod schemas for stored data
  - Handle corrupted/missing data gracefully

---

- [ ] **Storage Cleared on Logout**
  ```typescript
  // ✅ REQUIRED - Clear storage on logout
  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    signOut(); // SuperTokens logout
    navigate('/login');
  };
  ```
  **Check:**
  - Verify logout clears all storage
  - Test: Logout and check Application tab in DevTools
  - Ensure: No sensitive data remains after logout

---

### 6.2 Cookies

#### 🟡 MEDIUM Severity

- [ ] **No Manual Cookie Management for Auth**
  ```typescript
  // ❌ WRONG - Manual cookie handling
  document.cookie = `token=${authToken}; path=/`;
  
  // ✅ CORRECT - SuperTokens manages cookies
  // No manual cookie code needed
  ```
  **Check:**
  - Search: `document.cookie`
  - Should be none or minimal (non-auth purposes only)
  - Auth cookies managed by SuperTokens only

---

## 7️⃣ Dependency & Supply Chain Security

### 7.1 Package Security

#### 🔴 CRITICAL Checks

- [ ] **No Known Vulnerabilities in Dependencies**
  ```bash
  # ✅ REQUIRED - Run security audit
  npm audit
  
  # Should show:
  # found 0 vulnerabilities
  
  # If vulnerabilities found:
  npm audit fix
  ```
  **Check:**
  - Run: `npm audit` and review results
  - Fix: All critical and high severity vulnerabilities
  - Document: Any exceptions with justification
  - Run: Weekly in CI/CD pipeline

---

- [ ] **Dependencies Are Not Malicious**
  ```bash
  # ❌ DANGEROUS - Typosquatting
  npm install "rreact" # Should be "react"
  npm install "color.js" # Suspicious package
  
  # ✅ CORRECT - Verify package names
  npm install react
  npm install colors # Well-known package
  ```
  **Check:**
  - Review `package.json` for suspicious packages
  - Look for: Typos, unusual package names
  - Verify: Packages are official/well-maintained
  - Check: npm download stats, GitHub stars, last update
  - Use: `npm-check` or `snyk` for analysis

---

- [ ] **No Unused Dependencies**
  ```bash
  # ✅ Find unused dependencies
  npx depcheck
  
  # Remove unused packages
  npm uninstall <package-name>
  ```
  **Why:** Reduce attack surface, smaller bundle.
  
  **Check:**
  - Run: `npx depcheck`
  - Remove: Unused dependencies
  - Verify: All dependencies in package.json are used

---

#### 🟠 HIGH Severity

- [ ] **Dependency Versions Pinned (No ^ or ~)**
  ```json
  // ❌ RISKY - Unpinned versions
  {
    "dependencies": {
      "react": "^18.0.0",  // Could install 18.9.9
      "axios": "~1.0.0"    // Could install 1.0.9
    }
  }
  
  // ✅ SAFER - Exact versions
  {
    "dependencies": {
      "react": "18.2.0",
      "axios": "1.4.0"
    }
  }
  
  // ✅ BEST - Use package-lock.json
  // Commit package-lock.json to git
  ```
  **Check:**
  - Review `package.json` for `^` or `~`
  - Verify: `package-lock.json` committed to git
  - Test: Fresh install produces same versions

---

- [ ] **No Direct Git Dependencies**
  ```json
  // ❌ RISKY - Git dependencies
  {
    "dependencies": {
      "my-lib": "git+https://github.com/user/repo.git"
    }
  }
  
  // ✅ CORRECT - npm packages only
  {
    "dependencies": {
      "my-lib": "1.2.3"
    }
  }
  ```
  **Check:**
  - Search `package.json` for: `git+`, `github:`
  - Prefer: Published npm packages
  - Exception: Internal company packages (document why)

---

## 8️⃣ Build & Deployment Security

### 8.1 Production Build Configuration

#### 🔴 CRITICAL Checks

- [ ] **Source Maps Disabled in Production**
  ```typescript
  // vite.config.ts
  export default defineConfig({
    build: {
      sourcemap: false, // ✅ Disabled for production
      minify: 'terser', // ✅ Minification enabled
      terserOptions: {
        compress: {
          drop_console: true, // ✅ Remove console.log
          drop_debugger: true, // ✅ Remove debugger
        },
      },
    },
  });
  ```
  **Why:** Source maps expose your full source code.
  
  **Check:**
  - Verify `vite.config.ts` has `sourcemap: false`
  - Build: `npm run build`
  - Verify: No `.js.map` files in `dist/`
  - Check: `ls -la dist/assets/*.map` should be empty

---

- [ ] **No Debug Code in Production**
  ```typescript
  // ❌ REMOVE BEFORE PRODUCTION
  console.log('API Response:', data);
  console.debug('User object:', user);
  debugger;
  
  // ✅ DEVELOPMENT ONLY
  if (import.meta.env.DEV) {
    console.log('Debug info:', data);
  }
  ```
  **Check:**
  - Search: `console.log`, `console.debug`, `debugger`
  - Verify: terser removes them in production build
  - Build and search: `grep -r "console.log" dist/`

---

- [ ] **Environment Variables Validated**
  ```typescript
  // ✅ REQUIRED - Validate env vars at startup
  const envSchema = z.object({
    VITE_API_DOMAIN: z.string().url(),
    VITE_ENVIRONMENT: z.enum(['dev', 'stag', 'prod', 'prod-eu']),
    VITE_APP_NAME: z.string().min(1),
  });
  
  const env = envSchema.parse({
    VITE_API_DOMAIN: import.meta.env.VITE_API_DOMAIN,
    VITE_ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT,
    VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
  });
  
  // App crashes immediately if env vars invalid
  ```
  **Check:**
  - Environment validation exists
  - App fails fast if config invalid
  - All required env vars documented

---

#### 🟠 HIGH Severity

- [ ] **No Sensitive Comments in Code**
  ```typescript
  // ❌ REMOVE - Exposes internal info
  // TODO: Fix authentication bypass at /api/admin
  // HACK: Using admin token: sk_live_abc123
  // NOTE: Password is "admin123" for testing
  
  // ✅ ACCEPTABLE - Generic comments
  // TODO: Improve performance
  // NOTE: API docs at apidocs.flytbase.com
  ```
  **Check:**
  - Search: `TODO`, `HACK`, `FIXME`, `XXX`
  - Review: Comments don't expose sensitive info
  - Clean: Production code of implementation notes

---

- [ ] **Bundle Size Analyzed**
  ```bash
  # ✅ Analyze bundle
  npm run build
  npx vite-bundle-visualizer
  
  # Check for:
  # - Unexpectedly large packages
  # - Duplicate dependencies
  # - Large files that shouldn't be included
  ```
  **Check:**
  - Large bundle = more attack surface
  - Verify: No unexpected large files
  - Optimize: Code splitting for large features

---

### 8.2 Deployment Verification

#### 🟡 MEDIUM Severity

- [ ] **HTTPS Enforced**
  ```typescript
  // ✅ Verify in browser
  // - URL starts with https://
  // - Valid SSL certificate
  // - No mixed content warnings
  
  // ✅ Add to index.html
  <meta http-equiv="Content-Security-Policy" 
        content="upgrade-insecure-requests">
  ```
  **Check:**
  - Test production URL uses HTTPS
  - No HTTP downgrade warnings
  - Certificate valid (not expired/self-signed)

---

## 9️⃣ WebSocket & Real-Time Security

### 9.1 Socket.IO Security (if used)

#### 🔴 CRITICAL Checks

- [ ] **WebSocket Authentication Required**
  ```typescript
  // ❌ INSECURE - No auth
  const socket = io('wss://socket.flytbase.com');
  
  // ✅ SECURE - Authenticated connection
  const { token } = useAuth();
  const socket = io('wss://socket.flytbase.com', {
    auth: { token },
  });
  
  // Backend MUST verify token
  ```
  **Check:**
  - Socket connections include auth token
  - Backend validates token on connection
  - Unauthorized connections rejected

---

- [ ] **Socket Events Validate Organization Context**
  ```typescript
  // ❌ INSECURE - No org validation
  socket.on('drone-update', (data) => {
    updateDrone(data); // What if data from different org?
  });
  
  // ✅ SECURE - Validate org context
  const { orgId } = useAuth();
  socket.on('drone-update', (data) => {
    if (data.orgId !== orgId) {
      console.error('Invalid org in socket data');
      return;
    }
    updateDrone(data);
  });
  ```
  **Check:**
  - All socket event handlers validate org context
  - Backend ensures org-scoped events only

---

#### 🟠 HIGH Severity

- [ ] **Socket Input Validation**
  ```typescript
  // ❌ NO VALIDATION
  socket.emit('update-drone', userInput);
  
  // ✅ VALIDATED
  const updateSchema = z.object({
    droneId: z.string().uuid(),
    status: z.enum(['active', 'inactive']),
  });
  
  const validData = updateSchema.parse(userInput);
  socket.emit('update-drone', validData);
  ```
  **Check:**
  - All emitted data validated
  - Use Zod schemas for socket messages

---

## 🔟 Data Leakage Prevention

### 10.1 API Response Inspection

#### 🔴 CRITICAL Checks

- [ ] **API Responses Don't Contain Other Orgs' Data**
  ```typescript
  // ✅ Test: Inspect API responses in DevTools Network tab
  // Look for:
  // - Data with different org_id than current
  // - User data from other organizations
  // - Device/drone data from other tenants
  
  // If found: CRITICAL - Backend data leakage!
  ```
  **Manual Check:**
  1. Login to application
  2. Open DevTools Network tab
  3. Make API calls
  4. Inspect responses for data leakage
  5. Look for `orgId`, `organizationId`, `tenantId` fields
  6. Verify: All data belongs to current org

---

- [ ] **No Pagination Leakage**
  ```typescript
  // ❌ POTENTIAL LEAKAGE
  // If pagination returns other orgs' data
  api.get('/drones?page=999'); // Does it return other orgs?
  
  // ✅ Backend MUST filter by org on all pages
  ```
  **Test:**
  - Request high page numbers
  - Request large page sizes
  - Verify: Always returns only current org's data

---

#### 🟠 HIGH Severity

- [ ] **No PII in Logs or Analytics**
  ```typescript
  // ❌ LEAKING PII
  analytics.track('User Login', {
    email: user.email,
    password: password,
    address: user.address,
  });
  
  // ✅ CORRECT - No PII
  analytics.track('User Login', {
    userId: user.id, // Non-identifying ID
    timestamp: Date.now(),
  });
  ```
  **Check:**
  - Review analytics calls
  - Verify: No email, phone, address, names
  - Use: User IDs instead of identifiable info

---

- [ ] **Error Messages Don't Leak Data**
  ```typescript
  // ❌ LEAKING INFO
  catch (error) {
    toast.error(`Failed to delete user ${userEmail}: ${error.stack}`);
  }
  
  // ✅ SAFE
  catch (error) {
    console.error('Delete failed:', error); // Logs only
    toast.error('Failed to delete user. Please try again.');
  }
  ```
  **Check:**
  - Error messages don't contain PII
  - Stack traces not shown to users
  - Generic user-facing messages

---

### 10.2 Browser DevTools Protection

#### 🟡 MEDIUM Severity

- [ ] **Sensitive Data Not Stored in React DevTools**
  ```typescript
  // ⚠️ CAUTION - Visible in React DevTools
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  
  // ✅ BETTER - Don't store in state if not needed for rendering
  // Use refs or keep in closure
  ```
  **Note:** React DevTools exposes all state/props. Don't store secrets.

---

- [ ] **Network Tab Doesn't Show Sensitive URLs**
  ```typescript
  // ❌ VISIBLE - Token in URL
  api.get(`/data?token=${authToken}`);
  
  // ✅ HIDDEN - Token in header
  api.get('/data', {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  ```
  **Check:**
  - Network tab doesn't show tokens in URLs
  - Sensitive data in request body/headers only

---

## 1️⃣1️⃣ Additional Security Checks

### 11.1 Code Quality

#### 🟠 HIGH Severity

- [ ] **TypeScript Strict Mode Enabled**
  ```json
  // tsconfig.json
  {
    "compilerOptions": {
      "strict": true,
      "noImplicitAny": true,
      "strictNullChecks": true,
      "strictFunctionTypes": true
    }
  }
  ```
  **Check:**
  - Verify strict mode enabled
  - No `@ts-ignore` without justification
  - No `any` types (use `unknown` if needed)

---

- [ ] **ESLint Security Rules**
  ```bash
  # Install security plugins
  npm install --save-dev eslint-plugin-security
  npm install --save-dev eslint-plugin-react-security
  
  # Run ESLint
  npm run lint
  ```
  **Check:**
  - ESLint configured with security rules
  - No lint errors in production code
  - Security warnings addressed

---

### 11.2 Third-Party Integrations

#### 🔴 CRITICAL Checks

- [ ] **Third-Party Scripts Reviewed**
  ```html
  <!-- ❌ DANGEROUS - Unknown scripts -->
  <script src="https://random-cdn.com/script.js"></script>
  
  <!-- ✅ IF NEEDED - Only trusted sources -->
  <script src="https://cdn.jsdelivr.net/npm/react@18.2.0"></script>
  <!-- Use Subresource Integrity -->
  <script 
    src="https://cdn.jsdelivr.net/npm/react@18.2.0"
    integrity="sha384-..."
    crossorigin="anonymous">
  </script>
  ```
  **Check:**
  - List all third-party scripts in `index.html`
  - Verify: Each is necessary and trusted
  - Add: SRI (Subresource Integrity) hashes
  - Consider: Hosting locally instead of CDN

---

- [ ] **iFrames Properly Sandboxed**
  ```typescript
  // ❌ DANGEROUS - No restrictions
  <iframe src={userUrl} />
  
  // ✅ SANDBOXED
  <iframe 
    src={validatedUrl}
    sandbox="allow-scripts allow-same-origin"
    referrerPolicy="no-referrer"
  />
  ```
  **Check:**
  - Search: `<iframe` in codebase
  - Verify: sandbox attribute present
  - Limit: Permissions to minimum needed

---

---

## 📋 Final Security Review Checklist

### Pre-Production Deployment

- [ ] All CRITICAL items resolved
- [ ] All HIGH severity items resolved
- [ ] MEDIUM items documented with timeline
- [ ] Security scan completed (`npm audit`)
- [ ] Manual penetration testing performed
- [ ] Code review by security-aware developer
- [ ] Test accounts/data removed
- [ ] Environment variables configured correctly
- [ ] HTTPS enforced
- [ ] CSP configured
- [ ] Monitoring/logging enabled

### Testing Scenarios

- [ ] **Authentication Bypass Test**
  - Try accessing protected routes without login
  - Try manipulating auth tokens
  - Try using expired tokens

- [ ] **Authorization Test**
  - Try accessing other org's data
  - Try performing unauthorized actions
  - Try escalating privileges

- [ ] **Input Validation Test**
  - Try XSS payloads in all inputs
  - Try SQL injection strings
  - Try path traversal (`../`, `./`)
  - Try extremely long inputs
  - Try special characters

- [ ] **API Abuse Test**
  - Try making 1000 requests/second
  - Try accessing undocumented endpoints
  - Try manipulating request headers
  - Try replaying requests

- [ ] **Data Leakage Test**
  - Check API responses for other orgs' data
  - Check browser storage for sensitive data
  - Check network tab for exposed secrets
  - Check error messages for info leakage

---

## 🚨 Red Flags - Immediate Review Required

If you find ANY of these, stop and review immediately:

1. **Custom authentication implementation** (not using SuperTokens)
2. **Hardcoded credentials** anywhere in code or git history
3. **Direct database access** from frontend
4. **Organization ID in URLs** or client storage
5. **`dangerouslySetInnerHTML`** without sanitization
6. **API keys or secrets** in frontend bundle
7. **Disabled CORS** or wildcard origins
8. **SQL/NoSQL query strings** built with user input
9. **`eval()` or `new Function()`** with user input
10. **Production tokens/IDs** hardcoded for testing

---

## 📚 Security Resources

### OWASP Top 10 (2021)
1. Broken Access Control
2. Cryptographic Failures
3. Injection
4. Insecure Design
5. Security Misconfiguration
6. Vulnerable and Outdated Components
7. Identification and Authentication Failures
8. Software and Data Integrity Failures
9. Security Logging and Monitoring Failures
10. Server-Side Request Forgery (SSRF)

### Tools for Security Testing

```bash
# Dependency vulnerability scanning
npm audit
npx snyk test

# Find hardcoded secrets
npx trufflehog filesystem .
npm install -g git-secrets

# Bundle analysis
npx vite-bundle-visualizer

# Lighthouse security audit
npx lighthouse https://your-app.com --only-categories=best-practices

# OWASP Dependency Check
npx dependency-check --project myapp --scan ./
```

### Additional Reading

- **OWASP Cheat Sheets:** https://cheatsheetseries.owasp.org/
- **React Security Best Practices:** https://react.dev/learn/security
- **MDN Web Security:** https://developer.mozilla.org/en-US/docs/Web/Security
- **CSP Guide:** https://content-security-policy.com/
- **OWASP Top 10:** https://owasp.org/www-project-top-ten/

---

## 📝 Review Sign-Off

**Application Name:** _______________________  
**Reviewer:** _______________________  
**Review Date:** _______________________  
**Deployment Approved:** ☐ Yes ☐ No (issues found)

**Critical Issues Found:** _______  
**High Issues Found:** _______  
**Medium Issues Found:** _______  

**Reviewer Signature:** _______________________

---

**Document Version:** 1.0  
**Last Updated:** February 7, 2026  
**Maintained By:** FlytBase Security Team  
**Review Frequency:** Update quarterly or after major security incidents
