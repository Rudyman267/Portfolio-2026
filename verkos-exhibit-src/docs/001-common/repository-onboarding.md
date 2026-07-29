# 🚀 Repository Onboarding Guide

**Welcome to the FlytBase App Template!** This guide will help you understand the repository structure, tech stack, development patterns, and best practices.

---

## 📚 Table of Contents

1. [Quick Overview](#quick-overview)
2. [Repository Structure](#repository-structure)
3. [Tech Stack](#tech-stack)
4. [Core Concepts](#core-concepts)
5. [Authentication System](#authentication-system)
6. [Available Libraries](#available-libraries)
7. [Design System](#design-system)
8. [Development Patterns](#development-patterns)
9. [AI Agent Guidelines](#ai-agent-guidelines)
10. [Getting Started](#getting-started)

---

## 🎯 Quick Overview

**FlytBase App Template** is a production-ready React 18 application template for building drone management applications. It provides:

- ✅ **Complete authentication** system (SuperTokens header-based)
- ✅ **Multi-environment** support (dev/stag/prod/eu-prod)
- ✅ **File-based routing** (TanStack Router)
- ✅ **Design system** (FlytBase custom components + Tailwind)
- ✅ **State management** (Zustand + React Query)
- ✅ **Production-ready** patterns and best practices

**Key Philosophy:**
> Use existing shared components and libraries. Extend them when needed. Avoid adding new external libraries unless absolutely necessary.

---

## 📁 Repository Structure

```
seville/  (FlytBase App Template)
│
├── src/
│   ├── routes/                         # TanStack Router file-based routes
│   │   ├── __root.tsx                  # Root layout with providers
│   │   ├── _layout.tsx                 # Protected routes layout
│   │   ├── _layout/                    # Protected route pages
│   │   │   ├── index.tsx               # Home page (/)
│   │   │   └── guides.tsx              # Integration guides (/guides)
│   │   ├── login.tsx                   # Login page
│   │   ├── logout.tsx                  # Logout handler
│   │   └── auth/                       # OAuth callback routes
│   │
│   ├── environments/                   # Environment configurations
│   │   ├── environment.ts              # Type definitions
│   │   ├── environment.dev.ts          # Local development
│   │   ├── environment.stag.ts         # Staging
│   │   ├── environment.prod.ts         # Production
│   │   └── environment.eu-prod.ts      # EU Production
│   │
│   ├── libs/                           # Shared libraries
│   │   ├── core/                       # Core functionality
│   │   │   └── auth-frontend/          # Authentication library
│   │   │       ├── components/         # Auth components
│   │   │       ├── providers/          # Auth providers
│   │   │       ├── guards/             # Route guards
│   │   │       └── services/           # Auth services
│   │   │
│   │   └── shared/                     # Shared utilities & components
│   │       ├── components/             # Reusable UI components
│   │       ├── ui/                     # Design system components
│   │       ├── configs/                # Shared configs
│   │       ├── hooks/                  # Custom React hooks
│   │       ├── utils/                  # Utility functions
│   │       ├── types/                  # TypeScript types
│   │       ├── enums/                  # TypeScript enums
│   │       ├── api-modules/            # API service abstractions
│   │       ├── socket/                 # Socket.IO client
│   │       ├── map/                    # Cesium 3D map library
│   │       ├── video-streaming/        # Video streaming services
│   │       ├── state/                  # Zustand stores
│   │       ├── i18n/                   # Internationalization
│   │       └── analytics/              # Analytics utilities
│   │
│   ├── components/                     # Application-specific components
│   │   ├── layouts/                    # Layout components
│   │   │   └── TemplateAppLayout.tsx   # Main app layout
│   │   ├── home/                       # Home page components
│   │   ├── guides/                     # Guide viewer components
│   │   └── ui/                         # Local UI components
│   │
│   ├── api/                            # API layer
│   │   ├── config/                     # API configuration
│   │   │   └── api-endpoints.ts        # Centralized endpoints
│   │   ├── services/                   # API service modules
│   │   └── types/                      # API type definitions
│   │
│   ├── store/                          # Zustand store
│   │   ├── feature-flags.store.ts      # Feature flags
│   │   ├── slices/                     # Store slices
│   │   ├── models/                     # State models
│   │   └── selectors/                  # State selectors
│   │
│   ├── hooks/                          # Custom React hooks
│   │   ├── use-toast.ts                # Toast notifications
│   │   └── use-mobile.tsx              # Mobile detection
│   │
│   ├── styles/                         # Global styles
│   │   ├── globals.scss                # Global CSS
│   │   └── utils.css                   # Utility classes
│   │
│   ├── utils/                          # Utility functions
│   │
│   ├── integrations/                   # Integration guides
│   │   ├── README.md                   # Integration overview
│   │   ├── routing-guide.md            # Routing patterns
│   │   ├── socket-integration.md       # Socket.IO guide
│   │   ├── map-integration.md          # Map library guide
│   │   ├── video-streaming-integration.md  # Video streaming guide
│   │   ├── state-management-integration.md # State management guide
│   │   ├── design-system-guide.md      # Design system guide
│   │   └── api-integration.md          # API integration guide
│   │
│   ├── App.tsx                         # Root App component
│   ├── main.tsx                        # Application entry point
│   ├── router.ts                       # Router configuration
│   └── routeTree.gen.ts                # Generated route tree (auto-generated)
│
├── backend-proxy/                      # Backend CORS proxy (Docker + Cloudflare)
│   ├── nginx.conf                      # Nginx configuration
│   ├── Dockerfile                      # Docker image
│   ├── docker-compose.yml              # Docker Compose config
│   ├── start.sh                        # Start services
│   ├── stop.sh                         # Stop services
│   ├── status.sh                       # Check status
│   └── test-cors.sh                    # Test CORS headers
│
├── public/                             # Static assets
│   └── assets/                         # Images, fonts, etc.
│
├── docs/                               # Documentation
│   ├── 001-common/                     # Standards and guidelines
│   ├── 002-applications/               # Application docs
│   ├── 003-devops/                     # DevOps guides
│   └── 004-references/                 # Reference docs
│
├── vite.config.ts                      # Vite build configuration
├── tailwind.config.ts                  # Tailwind CSS config
├── tsconfig.json                       # TypeScript configuration
├── package.json                        # Dependencies and scripts
└── .env.example                        # Environment variables template
```

---

## 🛠️ Tech Stack

### Core Framework & Language
- **React 18.3.1** - Modern React with hooks, concurrent features
- **TypeScript 5.8.3** - Type-safe development
- **Vite 5.4.19** - Fast build tool with HMR

### Routing & Navigation
- **TanStack Router 1.157.15** - File-based, type-safe routing
- **File-based routing** - Routes auto-generated from `src/routes/`
- **Route guards** - Authentication and authorization checks

### State Management
- **Zustand 5.0.3** - Lightweight state management
- **TanStack Query 5.64.2** - Server state management and caching
- **Immer 10.1.1** - Immutable state updates

### UI & Styling
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **Radix UI** - Accessible UI component primitives (50+ components)
- **Framer Motion 12.23.12** - Animation library
- **Lucide React** - Icon library
- **FlytBase Design System** - Custom design tokens and components

### Forms & Validation
- **React Hook Form 7.54.2** - Performant form management
- **Zod 3.24.1** - Schema validation

### HTTP & API
- **Axios 1.13.3** - HTTP client with interceptors
- **SuperTokens 0.48.0** - Authentication SDK

### Advanced Features
- **Cesium 1.138.0** - 3D geospatial visualization (if using map library)
- **Socket.IO Client 4.8.1** - Real-time WebSocket communication (if using socket library)
- **Millicast SDK 0.3.2** - Video streaming (if using video library)
- **Agora RTC SDK 4.23.1** - WebRTC video calls (if using video library)

### Development Tools
- **ESLint 9.8.0** - Code linting
- **Prettier** - Code formatting
- **Vitest 3.2.4** - Unit testing
- **Playwright** - E2E testing (optional)
- **Husky** - Git hooks
- **lint-staged** - Pre-commit linting

### Build & Bundle
- **Rollup** - Module bundler (via Vite)
- **Terser** - JavaScript minifier
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

---

## 🧠 Core Concepts

### 1. **File-Based Routing**

Routes are automatically generated from the file structure in `src/routes/`:

```
src/routes/
├── __root.tsx              → Root layout (all routes)
├── login.tsx               → /login
├── logout.tsx              → /logout
├── _layout.tsx             → Protected routes layout
└── _layout/
    ├── index.tsx           → / (protected)
    └── guides.tsx          → /guides (protected)
```

**Key Points:**
- Files in `src/routes/` become routes
- `_layout` prefix creates nested layouts
- `__root.tsx` is the root layout for all routes
- Protected routes use layout groups
- Route tree is auto-generated in `routeTree.gen.ts`

### 2. **Environment-Based Configuration**

The app uses different environment files based on the deployment:

```typescript
// src/environments/
environment.dev.ts      → npm run dev:dev
environment.stag.ts     → npm run dev:stag
environment.prod.ts     → npm run dev:prod
environment.eu-prod.ts  → npm run dev:eu-prod
```

**Configuration via Vite mode:**
```typescript
// vite.config.ts
export default defineConfig(async ({ mode }) => {
  const envSuffix = mode || 'dev';
  
  resolve: {
    alias: {
      "@env": `./src/environments/environment.${envSuffix}.ts`,
    },
  },
});
```

**Usage in code:**
```typescript
import { environment } from '@env';

// Access environment variables
const apiUrl = environment.appInfo.apiDomain;
```

### 3. **Multi-Tenant Architecture**

The application is designed for multi-organization support:

```typescript
// Each request includes org-id header
headers: {
  'org-id': currentOrgId,
  'authorization': `Bearer ${token}`,
}
```

**Key Concepts:**
- Users can belong to multiple organizations
- Organization context is maintained in state
- API requests are scoped to current organization
- Authentication tokens include organization information

### 4. **Path Aliases**

TypeScript path aliases for clean imports:

```typescript
// Available aliases (tsconfig.json)
"@/*"           → "./src/*"
"@env"          → "./src/environments/environment.*.ts"
"@libs/*"       → "./src/libs/*"
"@components/*" → "./src/components/*"
"@api/*"        → "./src/api/*"
"@store/*"      → "./src/store/*"
"@hooks/*"      → "./src/hooks/*"
"@utils/*"      → "./src/utils/*"
```

**Usage:**
```typescript
import { environment } from '@env';
import { Button } from '@libs/shared/ui/button';
import { useAuth } from '@libs/core/auth-frontend';
import { api } from '@api/config/api-endpoints';
```

---

## 🔐 Authentication System

### Overview

**Authentication Provider:** SuperTokens  
**Auth Mode:** Header-based (not cookie-based)  
**Token Storage:** localStorage  
**Multi-tenant:** Organization-scoped access

### Authentication Flow

```
1. User clicks OAuth provider (Google/Microsoft)
   ↓
2. Redirected to FlytBase auth backend
   ↓
3. Backend validates and returns tokens in response headers:
   - st-access-token
   - st-refresh-token
   - anti-csrf token
   ↓
4. SuperTokens SDK saves tokens to localStorage
   ↓
5. All subsequent API requests include tokens in headers:
   - Authorization: Bearer <access-token>
   - st-auth-mode: header
   - rid: anti-csrf
   ↓
6. Backend validates token and returns data
```

### Key Components

**Auth Provider:**
```typescript
// src/libs/core/auth-frontend/providers/AuthProvider.tsx
<AuthProvider>
  <App />
</AuthProvider>
```

**Route Guards:**
```typescript
// Protected routes use AuthGuard
import { AuthGuard } from '@libs/core/auth-frontend';

<Route>
  <AuthGuard>
    <YourProtectedComponent />
  </AuthGuard>
</Route>
```

**Available Guards:**
- `AuthGuard` - Requires authentication
- `AdminGuard` - Requires admin role
- `OrgGuard` - Requires organization context
- `RegistrationGuard` - Handles registration flow

### Authentication Hooks

```typescript
import { useAuth } from '@libs/core/auth-frontend';

function MyComponent() {
  const { 
    isAuthenticated,  // boolean
    user,             // User object
    login,            // Login function
    logout,           // Logout function
    loading,          // Loading state
  } = useAuth();
  
  // Use authentication state
}
```

### API Request Headers

All authenticated API requests automatically include:

```typescript
{
  'Authorization': 'Bearer <access-token>',
  'st-auth-mode': 'header',
  'rid': 'anti-csrf',
  'org-id': '<current-org-id>',
  'fdi-version': '<frontend-version>',
}
```

**Axios interceptors** handle this automatically - you don't need to set these headers manually.

---

## 📦 Available Libraries

### 1. **Socket.IO Library** (`@libs/shared/socket`)

**Purpose:** Real-time WebSocket communication for live telemetry, notifications, and updates.

**When to Use:**
- Real-time drone telemetry
- Live fleet status updates
- Push notifications
- Real-time collaboration features

**Quick Start:**
```typescript
import { useSocket } from '@libs/shared/socket';

function MyComponent() {
  const socket = useSocket();
  
  // Subscribe to events
  useEffect(() => {
    socket.on('drone:telemetry', (data) => {
      console.log('Telemetry update:', data);
    });
    
    return () => socket.off('drone:telemetry');
  }, [socket]);
}
```

**Documentation:** `src/integrations/socket-integration.md`

**Key Features:**
- Automatic connection management
- Reconnection strategies
- Event subscription patterns
- Room-based messaging
- Connection state management

---

### 2. **Map Library** (`@libs/shared/map`)

**Purpose:** Cesium-based 3D geospatial visualization for drone operations.

**When to Use:**
- 3D terrain visualization
- Drone position tracking
- Mission planning with waypoints
- Geofencing and zones
- KML/KMZ file visualization

**Quick Start:**
```typescript
import { MapProvider, useMap } from '@libs/shared/map';

function MapComponent() {
  return (
    <MapProvider>
      <MyMap />
    </MapProvider>
  );
}

function MyMap() {
  const { map, addEntity, removeEntity } = useMap();
  
  // Add markers, lines, polygons
  addEntity({
    id: 'drone-1',
    type: 'point',
    position: { lat: 40.7128, lng: -74.0060, alt: 100 },
  });
}
```

**Documentation:** `src/integrations/map-integration.md`

**Architecture Docs:** `docs/004-references/core-architectures/map-library/`

**Key Features:**
- Provider abstraction (Cesium, Google Maps, etc.)
- Entity management system
- Event system for map interactions
- Performance optimizations
- Custom map layers
- Keyboard controls

**Important:** The map library has comprehensive architecture documentation. Always refer to it before making changes.

---

### 3. **Video Streaming Library** (`@libs/shared/video-streaming`)

**Purpose:** Real-time video streaming for drone cameras and live operations.

**When to Use:**
- Drone camera feeds
- Live video streaming
- Multi-camera views
- Video recording and playback

**Quick Start:**
```typescript
import { VideoPlayer } from '@libs/shared/video-streaming';

function VideoComponent() {
  return (
    <VideoPlayer
      streamUrl="https://stream-url.com"
      provider="millicast"  // or 'agora'
      autoplay
      muted
    />
  );
}
```

**Documentation:** `src/integrations/video-streaming-integration.md`

**Supported Providers:**
- **Millicast SDK** - Low-latency streaming
- **Agora RTC SDK** - WebRTC video calls

**Key Features:**
- Multi-provider support
- Low-latency streaming
- Video quality controls
- Connection state management
- Error recovery

---

### 4. **Design System** (`@libs/shared/ui` & `@libs/shared/components`)

**Purpose:** FlytBase custom design system with 50+ pre-built components.

**Philosophy:**
> ⚠️ **IMPORTANT:** Always use existing components from the design system. Modify them if needed, but **DO NOT** add new external UI libraries.

**Available Components:**
- **Form Controls:** Button, Input, Textarea, Select, Checkbox, Radio, Switch, Slider
- **Data Display:** Table, Card, Badge, Avatar, Tooltip, Progress, Skeleton
- **Feedback:** Alert, Toast, Dialog, AlertDialog, Sheet
- **Layout:** Accordion, Collapsible, Tabs, Separator, ScrollArea
- **Navigation:** Navigation Menu, Dropdown Menu, Context Menu, Menubar
- **Overlays:** Dialog, Sheet, Popover, HoverCard, Tooltip

**Usage:**
```typescript
import { Button } from '@libs/shared/ui/button';
import { Card } from '@libs/shared/ui/card';
import { Input } from '@libs/shared/ui/input';
import { Select } from '@libs/shared/ui/select';

function MyForm() {
  return (
    <Card>
      <Input placeholder="Enter text" />
      <Select options={[...]} />
      <Button variant="primary">Submit</Button>
    </Card>
  );
}
```

**Documentation:** `src/integrations/design-system-guide.md`

**Key Concepts:**
- **Design Tokens:** Colors, typography, spacing defined in Tailwind config
- **Variants:** Components have built-in variants (primary, secondary, outline, ghost)
- **Accessibility:** All components are accessible (Radix UI)
- **Consistency:** Uniform look and feel across all apps

---

### 5. **State Management** (Zustand + React Query)

**Two-layer State Architecture:**

**1. Client State (Zustand):**
```typescript
import { create } from 'zustand';

// Define store
export const useFeatureFlagsStore = create<FeatureFlagsState>((set) => ({
  flags: {},
  isLoading: false,
  
  setFlags: (flags) => set({ flags }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// Use in components
function MyComponent() {
  const flags = useFeatureFlagsStore((state) => state.flags);
  const setFlags = useFeatureFlagsStore((state) => state.setFlags);
}
```

**2. Server State (React Query):**
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Fetch data
function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetchUser(userId),
  });
  
  // Mutate data
  const mutation = useMutation({
    mutationFn: (newUser) => createUser(newUser),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
    },
  });
}
```

**Documentation:** `src/integrations/state-management-integration.md`

**When to Use Each:**
- **Zustand:** UI state, form state, modal state, filters, selections
- **React Query:** API data, server cache, background sync, optimistic updates

---

### 6. **API Integration** (Axios + Interceptors)

**Centralized API Configuration:**
```typescript
// src/api/config/api-endpoints.ts
export const API_ENDPOINTS = {
  subscription: {
    activePlans: '/subscription/active-org-plans',
    features: '/subscription/features',
  },
  user: {
    profile: '/v2/user/profile',
    update: '/v2/user/update',
  },
  // ... more endpoints
};
```

**Usage:**
```typescript
import axios from 'axios';
import { API_ENDPOINTS } from '@api/config/api-endpoints';

// Axios instance with interceptors (auto-configured)
const response = await axios.get(API_ENDPOINTS.user.profile);
```

**HTTP Interceptors:**
- **Request Interceptor:** Adds auth headers automatically
- **Response Interceptor:** Handles token refresh, errors
- **Error Handling:** Centralized error logging and toast notifications

**Documentation:** `src/integrations/api-integration.md`

---

## 🎨 Design System

### Color System

**Background Levels (Elevation):**
```css
bg-background          /* Main app background (darkest) */
bg-background-level-1  /* Cards, panels */
bg-background-level-2  /* Elevated surfaces */
bg-background-level-3  /* More elevated */
bg-background-level-4  /* Highest elevation */
bg-background-level-5  /* Maximum elevation */
```

**Text Colors:**
```css
text-text-1          /* Primary text (84% opacity) */
text-text-2          /* Secondary text (54% opacity) */
text-text-disabled   /* Disabled text (24% opacity) */
```

**Primary Colors:**
```css
bg-primary-50        /* Lightest */
bg-primary-100
bg-primary-200       /* Primary - Most commonly used */
bg-primary-300
bg-primary-400       /* Darkest */
```

**Status Colors:**
```css
bg-success-200       /* Success/positive actions */
bg-danger-200        /* Errors/destructive actions */
bg-warning-200       /* Warnings */
bg-info-200          /* Informational */
```

### Typography

**Headings:**
```css
text-h1  /* 2.25rem (36px) - Page titles */
text-h2  /* 1.875rem (30px) - Section titles */
text-h3  /* 1.5rem (24px) - Subsection titles */
text-h4  /* 1.25rem (20px) - Card titles */
text-h5  /* 1.125rem (18px) - Small headers */
text-h6  /* 1rem (16px) - Smallest headers */
```

**Body Text:**
```css
text-body-large   /* 1rem (16px) */
text-body         /* 0.875rem (14px) - Default */
text-body-small   /* 0.75rem (12px) */
text-caption      /* 0.625rem (10px) */
```

### Spacing

**Consistent spacing scale:**
```css
space-1   /* 4px */
space-2   /* 8px */
space-3   /* 12px */
space-4   /* 16px */
space-5   /* 20px */
space-6   /* 24px */
space-8   /* 32px */
space-10  /* 40px */
space-12  /* 48px */
space-16  /* 64px */
```

### Component Guidelines

**❌ DON'T:**
- Install new UI libraries (e.g., Material-UI, Ant Design, Chakra UI)
- Use inline styles instead of Tailwind classes
- Create custom components if one exists in the design system
- Deviate from design tokens (colors, spacing, typography)

**✅ DO:**
- Use existing components from `@libs/shared/ui`
- Modify existing components if they don't meet your needs
- Follow Tailwind utility classes
- Use design tokens (colors, spacing, typography)
- Maintain consistency with other parts of the app

**Example - Good vs Bad:**

```typescript
// ❌ BAD - Installing new library
import { Button as MUIButton } from '@mui/material';

// ✅ GOOD - Using design system
import { Button } from '@libs/shared/ui/button';

// ❌ BAD - Inline styles
<div style={{ backgroundColor: '#007bff', padding: '16px' }}>

// ✅ GOOD - Tailwind classes with design tokens
<div className="bg-primary-200 p-4">
```

---

## 🏗️ Development Patterns

### 1. **Component Pattern**

**File Structure:**
```
MyFeature/
├── MyFeature.tsx              # Main component
├── MyFeature.types.ts         # TypeScript types
├── components/                # Sub-components
│   ├── FeatureHeader.tsx
│   └── FeatureContent.tsx
└── hooks/                     # Custom hooks
    └── use-feature-data.ts
```

**Component Template:**
```typescript
// MyFeature.tsx
import { FC } from 'react';
import { MyFeatureProps } from './MyFeature.types';
import { Button } from '@libs/shared/ui/button';

export const MyFeature: FC<MyFeatureProps> = ({ title, onAction }) => {
  // 1. Hooks first
  const [state, setState] = useState();
  const { data, isLoading } = useQuery(...);
  
  // 2. Event handlers
  const handleAction = () => {
    onAction();
  };
  
  // 3. Early returns for loading/error states
  if (isLoading) return <LoadingSpinner />;
  if (!data) return <EmptyState />;
  
  // 4. Main render
  return (
    <div className="container">
      <h2 className="text-h2">{title}</h2>
      <Button onClick={handleAction}>Action</Button>
    </div>
  );
};
```

### 2. **API Service Pattern**

**Create service modules:**
```typescript
// src/api/services/user.service.ts
import axios from 'axios';
import { API_ENDPOINTS } from '@api/config/api-endpoints';

export const userService = {
  getProfile: async () => {
    const response = await axios.get(API_ENDPOINTS.user.profile);
    return response.data;
  },
  
  updateProfile: async (data: UserProfile) => {
    const response = await axios.put(API_ENDPOINTS.user.update, data);
    return response.data;
  },
};
```

**Use with React Query:**
```typescript
import { useQuery } from '@tanstack/react-query';
import { userService } from '@api/services/user.service';

function UserProfile() {
  const { data: profile } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: userService.getProfile,
  });
  
  return <div>{profile?.name}</div>;
}
```

### 3. **State Management Pattern**

**Zustand Store Structure:**
```typescript
// src/store/feature.store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface FeatureState {
  // State
  items: Item[];
  selectedItem: Item | null;
  
  // Actions
  setItems: (items: Item[]) => void;
  selectItem: (id: string) => void;
  clearSelection: () => void;
}

export const useFeatureStore = create<FeatureState>()(
  immer((set) => ({
    // Initial state
    items: [],
    selectedItem: null,
    
    // Actions with Immer for immutable updates
    setItems: (items) => set((state) => {
      state.items = items;
    }),
    
    selectItem: (id) => set((state) => {
      state.selectedItem = state.items.find(item => item.id === id) || null;
    }),
    
    clearSelection: () => set((state) => {
      state.selectedItem = null;
    }),
  }))
);
```

**Usage:**
```typescript
function MyComponent() {
  // Select specific state (prevents unnecessary re-renders)
  const items = useFeatureStore((state) => state.items);
  const selectItem = useFeatureStore((state) => state.selectItem);
  
  return (
    <div>
      {items.map(item => (
        <div key={item.id} onClick={() => selectItem(item.id)}>
          {item.name}
        </div>
      ))}
    </div>
  );
}
```

### 4. **Form Handling Pattern**

**React Hook Form + Zod:**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@libs/shared/ui/button';
import { Input } from '@libs/shared/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@libs/shared/ui/form';

// 1. Define schema
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

type FormData = z.infer<typeof formSchema>;

// 2. Create form component
function MyForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });
  
  const onSubmit = (data: FormData) => {
    console.log('Form data:', data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

### 5. **Error Handling Pattern**

**Error Boundaries:**
```typescript
import { FBErrorBoundary } from '@libs/shared/components/error-boundary';

function MyFeature() {
  return (
    <FBErrorBoundary fallback={<ErrorFallback />}>
      <MyComponent />
    </FBErrorBoundary>
  );
}
```

**Toast Notifications:**
```typescript
import { useToast } from '@hooks/use-toast';

function MyComponent() {
  const { toast } = useToast();
  
  const handleError = (error: Error) => {
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive',
    });
  };
  
  const handleSuccess = () => {
    toast({
      title: 'Success',
      description: 'Operation completed successfully',
      variant: 'default',
    });
  };
}
```

### 6. **Routing Pattern**

**Creating a New Route:**

**Step 1:** Create file in `src/routes/`
```typescript
// src/routes/_layout/my-feature.tsx
import { createFileRoute } from '@tanstack/react-router';
import { MyFeature } from '@components/my-feature/MyFeature';

export const Route = createFileRoute('/_layout/my-feature')({
  component: MyFeature,
});
```

**Step 2:** Build route tree
```bash
# Route tree auto-generates on file save (Vite HMR)
# Or manually: npm run dev
```

**Step 3:** Navigate to route
```typescript
import { Link } from '@tanstack/react-router';

<Link to="/my-feature">Go to My Feature</Link>
```

**Route Layouts:**
- `__root.tsx` - Root layout (all routes)
- `_layout.tsx` - Protected routes (requires auth)
- Custom layouts - Create your own layout groups

---

## 🤖 AI Agent Guidelines

### Working with AI Agents (Claude, Copilot, etc.)

When using AI assistants to work with this repository:

#### 1. **Provide Context**

**Always provide this document as context:**
```
"I'm working with a FlytBase React app. Please read docs/004-references/repo-usage/repository-onboarding.md for context about the repository structure, tech stack, and patterns."
```

#### 2. **Design System Constraints**

**Tell the AI:**
```
"This repository uses a custom FlytBase design system. You MUST:
- Use existing components from @libs/shared/ui
- NOT install new UI libraries (Material-UI, Ant Design, etc.)
- Follow Tailwind CSS patterns
- Use design tokens for colors, spacing, typography
- Modify existing components if they don't meet requirements"
```

#### 3. **Authentication Context**

**Tell the AI:**
```
"Authentication is handled by SuperTokens in HEADER mode (not cookies).
- Tokens stored in localStorage
- Axios interceptors handle auth headers automatically
- Use AuthGuard for protected routes
- Don't implement custom auth logic"
```

#### 4. **Library Integration**

**Tell the AI:**
```
"Before adding any feature, check if we have an existing library:
- Socket.IO: Use @libs/shared/socket
- Maps: Use @libs/shared/map (Cesium-based)
- Video: Use @libs/shared/video-streaming
- State: Use Zustand + React Query
- Forms: Use React Hook Form + Zod
- UI: Use @libs/shared/ui components"
```

#### 5. **Code Patterns**

**Tell the AI:**
```
"Follow these patterns:
- File-based routing (TanStack Router)
- Component + types in separate files
- API services in src/api/services/
- Zustand for client state, React Query for server state
- Error boundaries for error handling
- Toast notifications for user feedback"
```

#### 6. **Environment Configuration**

**Tell the AI:**
```
"Environment configuration:
- Import from '@env' (NOT hardcoded)
- Multiple environments: dev, stag, prod, eu-prod
- Vite modes control which environment file loads
- Never commit sensitive data to environment files"
```

#### 7. **Respect Existing Architecture**

**Tell the AI:**
```
"Before making changes:
1. Check src/integrations/ for integration guides
2. Check docs/004-references/ for architecture docs
3. Use existing patterns from similar features
4. Don't reinvent wheels - use shared libraries
5. Follow the established folder structure"
```

---

## 🚦 Getting Started

### Prerequisites

- **Node.js 18.16.9+** (use [nvm](https://github.com/nvm-sh/nvm))
- **npm** (latest)
- **Docker Desktop** (for backend proxy)
- **Git**

### Local Setup

**Step 1: Clone Repository**
```bash
git clone <repository-url>
cd seville
```

**Step 2: Install Dependencies**
```bash
npm install
```

**Step 3: Start Development Server**
```bash
npm run dev:dev      # Development environment
npm run dev:stag     # Staging environment
npm run dev:prod     # Production environment
npm run dev:eu-prod  # EU Production environment
```

**Step 4: Access Application**
```
http://localhost:8080/flytbase-app-template/
```

### With Backend Connection

**Step 1: Start Backend Proxy**
```bash
cd backend-proxy
./start.sh dev     # Or: stag, prod, eu
```

**Step 2: Update Environment**
```typescript
// Copy tunnel URL from output
// Update src/environments/environment.dev.ts
apiDomain: 'https://xxx.trycloudflare.com'
```

**Step 3: Restart Frontend**
```bash
# Stop dev server (Ctrl+C)
npm run dev:dev
# Hard refresh browser: Cmd+Shift+R
```

---

## 📊 Available NPM Scripts

### Development
```bash
npm run dev             # Start with default mode
npm run dev:dev         # Development environment
npm run dev:stag        # Staging environment
npm run dev:prod        # Production environment
npm run dev:eu-prod     # EU Production environment
```

### Build
```bash
npm run build           # Build for production
npm run build:dev       # Build for development
npm run build:stag      # Build for staging
npm run build:eu-prod   # Build for EU production
```

### Testing
```bash
npm run test            # Run tests once
npm run test:watch      # Run tests in watch mode
npm run lint            # Run ESLint
```

### Other
```bash
npm run preview         # Preview production build
```

---

## 🎓 Learning Path

### For New Developers

**Week 1: Understand the Basics**
1. Read this document thoroughly
2. Explore `src/integrations/` guides
3. Run the app locally
4. Navigate through the app and inspect code

**Week 2: Understand Core Libraries**
1. **Auth:** Read `src/libs/core/auth-frontend/README.md`
2. **Routing:** Read `src/integrations/routing-guide.md`
3. **State:** Read `src/integrations/state-management-integration.md`
4. **Design System:** Read `src/integrations/design-system-guide.md`

**Week 3: Build a Small Feature**
1. Create a new route
2. Add a form with validation
3. Integrate with API
4. Use design system components
5. Add tests

**Week 4: Explore Advanced Features**
1. **Socket.IO:** Read `src/integrations/socket-integration.md`
2. **Map Library:** Read `docs/004-references/core-architectures/map-library/`
3. **Video Streaming:** Read `src/integrations/video-streaming-integration.md`

### For AI Agents

**Step 1: Load Context**
```
Always read this document first:
docs/004-references/repo-usage/repository-onboarding.md
```

**Step 2: Check Existing Patterns**
```
Before implementing:
1. Check src/integrations/ for guides
2. Check existing components for similar patterns
3. Check docs/004-references/ for architecture
```

**Step 3: Follow Constraints**
```
Must follow:
- Use design system components only
- Use existing libraries (socket, map, video)
- Follow established patterns
- Don't add new external UI libraries
```

---

## 🧭 Common Development Scenarios

### Scenario 1: Add a New Page

**Task:** Create a "Settings" page

**Steps:**
1. Create route file
   ```typescript
   // src/routes/_layout/settings.tsx
   import { createFileRoute } from '@tanstack/react-router';
   
   export const Route = createFileRoute('/_layout/settings')({
     component: Settings,
   });
   
   function Settings() {
     return <div>Settings Page</div>;
   }
   ```

2. Add navigation link
   ```typescript
   <Link to="/settings">Settings</Link>
   ```

3. Route automatically available at `/settings`

### Scenario 2: Add API Integration

**Task:** Fetch and display drone list

**Steps:**
1. Define API endpoint
   ```typescript
   // src/api/config/api-endpoints.ts
   export const API_ENDPOINTS = {
     drones: {
       list: '/drones/list',
     },
   };
   ```

2. Create service
   ```typescript
   // src/api/services/drone.service.ts
   export const droneService = {
     getDrones: async () => {
       const response = await axios.get(API_ENDPOINTS.drones.list);
       return response.data;
     },
   };
   ```

3. Use in component
   ```typescript
   import { useQuery } from '@tanstack/react-query';
   import { droneService } from '@api/services/drone.service';
   
   function DroneList() {
     const { data: drones, isLoading } = useQuery({
       queryKey: ['drones'],
       queryFn: droneService.getDrones,
     });
     
     if (isLoading) return <LoadingSpinner />;
     
     return (
       <div>
         {drones?.map(drone => (
           <Card key={drone.id}>{drone.name}</Card>
         ))}
       </div>
     );
   }
   ```

### Scenario 3: Add Form with Validation

**Task:** Create a "Create Asset" form

**Steps:**
1. Define schema
   ```typescript
   import { z } from 'zod';
   
   const assetSchema = z.object({
     name: z.string().min(2, 'Name required'),
     type: z.enum(['building', 'bridge', 'tower']),
     location: z.object({
       lat: z.number(),
       lng: z.number(),
     }),
   });
   ```

2. Create form
   ```typescript
   import { useForm } from 'react-hook-form';
   import { zodResolver } from '@hookform/resolvers/zod';
   
   function CreateAssetForm() {
     const form = useForm({
       resolver: zodResolver(assetSchema),
     });
     
     const onSubmit = (data) => {
       // Handle form submission
     };
     
     return (
       <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)}>
           {/* Form fields */}
         </form>
       </Form>
     );
   }
   ```

### Scenario 4: Use Socket.IO for Real-time Updates

**Task:** Display live drone telemetry

**Steps:**
1. Import socket hooks
   ```typescript
   import { useSocket } from '@libs/shared/socket';
   ```

2. Subscribe to events
   ```typescript
   function DroneTelemetry({ droneId }) {
     const socket = useSocket();
     const [telemetry, setTelemetry] = useState(null);
     
     useEffect(() => {
       socket.emit('subscribe:drone', droneId);
       
       socket.on('drone:telemetry', (data) => {
         if (data.droneId === droneId) {
           setTelemetry(data);
         }
       });
       
       return () => {
         socket.emit('unsubscribe:drone', droneId);
         socket.off('drone:telemetry');
       };
     }, [droneId, socket]);
     
     return <div>Battery: {telemetry?.battery}%</div>;
   }
   ```

### Scenario 5: Integrate 3D Map

**Task:** Display drone on map

**Steps:**
1. Add map provider
   ```typescript
   import { MapProvider } from '@libs/shared/map';
   
   function MapPage() {
     return (
       <MapProvider>
         <DroneMap />
       </MapProvider>
     );
   }
   ```

2. Use map hooks
   ```typescript
   import { useMap } from '@libs/shared/map';
   
   function DroneMap() {
     const { addEntity, updateEntity } = useMap();
     
     useEffect(() => {
       // Add drone to map
       addEntity({
         id: 'drone-1',
         type: 'point',
         position: { lat: 40.7128, lng: -74.0060, alt: 100 },
         icon: 'drone-icon',
       });
     }, [addEntity]);
     
     return <div id="cesium-container" />;
   }
   ```

---

## ⚠️ Important Constraints

### 1. **Design System Usage**

**MUST:**
- Use components from `@libs/shared/ui`
- Use design tokens (colors, spacing, typography)
- Follow Tailwind CSS patterns
- Maintain visual consistency

**MUST NOT:**
- Install Material-UI, Ant Design, Chakra UI, or similar
- Use inline styles
- Create custom UI components if one exists
- Deviate from design system colors/typography

**Exception:** You can create custom business logic components, but use design system UI components inside them.

### 2. **Library Additions**

**Before adding any new library, check:**
1. Does `@libs/shared` have this functionality?
2. Is there a guide in `src/integrations/`?
3. Is it absolutely necessary?

**Process for adding new libraries:**
1. Discuss with team
2. Document the need
3. Evaluate alternatives
4. Get approval
5. Document usage patterns

### 3. **Authentication**

**DO:**
- Use existing AuthProvider and guards
- Use axios for API calls (interceptors handle auth)
- Let SuperTokens handle token management

**DON'T:**
- Implement custom auth logic
- Manually add auth headers to requests
- Store tokens differently than localStorage
- Bypass route guards

### 4. **Environment Variables**

**DO:**
- Import from `@env`
- Use environment-specific files
- Document all environment variables

**DON'T:**
- Hardcode API URLs
- Commit secrets to `.env` files
- Use `process.env` directly (use `@env` alias)

---

## 📖 Documentation Structure

### Quick Reference

| Documentation Type | Location | Purpose |
|-------------------|----------|---------|
| **Repository Overview** | This document | High-level understanding |
| **Integration Guides** | `src/integrations/` | How to use libraries |
| **API Documentation** | `src/api/services/README.md` | API patterns |
| **Design System** | `src/integrations/design-system-guide.md` | UI components |
| **Architecture** | `docs/004-references/core-architectures/` | Deep dives |
| **Development Standards** | `docs/001-common/development-standards/` | Coding standards |

### Reading Order for New Developers

1. **Start Here:** This document (repository-onboarding.md)
2. **Then:** `README.md` (quick start)
3. **Then:** `src/integrations/README.md` (available integrations)
4. **Specific Topics:** Read relevant integration guides as needed
5. **Deep Dives:** Read architecture docs for complex features

---

## 🎯 Quick Command Reference

```bash
# Development
npm run dev:dev          # Start dev server (development backend)
npm run dev:stag         # Start dev server (staging backend)

# Build
npm run build            # Production build
npm run build:dev        # Development build

# Quality
npm run lint             # Lint code
npm run test             # Run tests
npm run test:watch       # Watch mode

# Backend Proxy
cd backend-proxy
./start.sh dev           # Start with dev backend
./start.sh stag          # Start with staging backend
./status.sh              # Check status
./stop.sh                # Stop all services
```

---

## 🔗 Important Links

### Documentation
- **Integration Guides:** `src/integrations/`
- **Architecture Docs:** `docs/004-references/core-architectures/`
- **Development Standards:** `docs/001-common/development-standards/`
- **Backend Proxy:** `backend-proxy/README.md`

### External Resources
- **React Docs:** https://react.dev/
- **TanStack Router:** https://tanstack.com/router
- **TanStack Query:** https://tanstack.com/query
- **Zustand:** https://zustand-demo.pmnd.rs/
- **Tailwind CSS:** https://tailwindcss.com/
- **Radix UI:** https://www.radix-ui.com/
- **SuperTokens:** https://supertokens.com/docs/

---

## ✅ Checklist for New Developers

Before you start coding:

- [ ] Read this entire document
- [ ] Run the app locally (`npm run dev:dev`)
- [ ] Explore the app in browser
- [ ] Read `src/integrations/README.md`
- [ ] Review existing components in `src/components/`
- [ ] Review design system in `src/libs/shared/ui/`
- [ ] Understand auth flow in `src/libs/core/auth-frontend/`
- [ ] Read relevant integration guides for your task
- [ ] Set up backend proxy if needed
- [ ] Review code standards in `docs/001-common/development-standards/`

After completing checklist:
- [ ] You understand the repository structure
- [ ] You know where to find components
- [ ] You understand routing patterns
- [ ] You understand state management approach
- [ ] You know NOT to add new UI libraries
- [ ] You know to use `@env` for environment config
- [ ] You understand auth is handled by SuperTokens

---

## ✅ Checklist for AI Agents

Before generating code:

- [ ] Read this document for repository context
- [ ] Check if required functionality exists in shared libraries
- [ ] Use design system components (`@libs/shared/ui`)
- [ ] Don't install new UI libraries
- [ ] Follow existing patterns from similar features
- [ ] Use `@env` for environment configuration
- [ ] Use SuperTokens auth (don't implement custom auth)
- [ ] Follow file-based routing patterns
- [ ] Use Zustand for client state, React Query for server state
- [ ] Add TypeScript types for all new code
- [ ] Follow naming conventions
- [ ] Add error handling with toast notifications
- [ ] Test the generated code

---

## 🎉 Summary

**This repository provides:**
- ✅ Production-ready React 18 + TypeScript template
- ✅ Complete authentication system (SuperTokens)
- ✅ File-based routing (TanStack Router)
- ✅ Design system (50+ components)
- ✅ State management (Zustand + React Query)
- ✅ Multi-environment support
- ✅ Backend proxy with CORS handling
- ✅ Comprehensive documentation

**Key Principles:**
1. **Use existing components** - Don't add new UI libraries
2. **Follow patterns** - Check integration guides first
3. **Type safety** - Use TypeScript for everything
4. **Environment config** - Use `@env` alias
5. **Auth is handled** - Use existing auth system
6. **Documentation first** - Read guides before coding

**You're ready to start!** 🚀

---

**Last Updated:** February 7, 2026  
**Maintained By:** FlytBase Development Team  
**Status:** ✅ Production-Ready Template

For questions or issues, refer to the documentation in `docs/` or contact the development team.
