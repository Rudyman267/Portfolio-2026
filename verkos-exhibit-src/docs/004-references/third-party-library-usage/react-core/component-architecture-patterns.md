# Component Architecture - Patterns & Best Practices

> **Purpose**: Establish comprehensive guidelines for component design, organization, and hierarchy across all React applications.
>
> **Status**: Active Standard
>
> **Last Updated**: 2026-01-27
>
> **Analysis Based On**: Mission Planner (116 components), Asset Management (107 components), Fleet View (62 components)

---

## Table of Contents

1. [Component Types & Responsibilities](#1-component-types--responsibilities)
2. [Component Size Guidelines](#2-component-size-guidelines)
3. [Component Hierarchy & Nesting](#3-component-hierarchy--nesting)
4. [Component Composition Patterns](#4-component-composition-patterns)
5. [Feature-Based Organization](#5-feature-based-organization)
6. [Public API Design (Index Files)](#6-public-api-design-index-files)
7. [Shared vs Feature Components](#7-shared-vs-feature-components)
8. [Performance Patterns](#8-performance-patterns)
9. [Error Boundaries](#9-error-boundaries)
10. [Real-World Examples](#10-real-world-examples)
11. [Anti-Patterns to Avoid](#11-anti-patterns-to-avoid)
12. [Component Checklist](#12-component-checklist)

---

## 1. Component Types & Responsibilities

### 1.1 Component Classification

#### **Presentational Components** (UI Components)

**Purpose**: Purely visual components that receive props and render UI.

**Characteristics**:
- No internal state (except ephemeral UI state)
- No side effects (data fetching, mutations)
- Receive all data via props
- Emit events via callbacks
- Highly reusable across features

**Simplified Example**:
```typescript
// ✅ GOOD: Simple presentational component
export function SearchInput({ placeholder, className }: SearchInputProps) {
  const searchText = useSearchText();
  const setSearchText = useSetSearchText();

  return (
    <div className={`relative ${className}`}>
      <Input
        type="text"
        placeholder={placeholder}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="w-full pr-8"
      />
    </div>
  );
}
```

**Size Guidelines**: 20-80 lines

---

#### **Container Components** (Smart Components)

**Purpose**: Orchestrate data fetching, state management, and business logic.

**Characteristics**:
- Manage complex state (Zustand, React Query)
- Handle data fetching and mutations
- Provide context to child components
- Coordinate multiple child components
- Less reusable, more feature-specific

**Simplified Example**:
```typescript
// ✅ GOOD: Container component orchestrating data and presentation
const LeftPanel: React.FC = () => {
  // Select state from store
  const routeSettingsPanelOpen = useMissionStore(
    (state) => state.missionFormState.routeSettingsPanelOpen
  );

  // Render components
  return (
    <div className="flex h-full">
      <MissionRouteDetails />
      <MissionSequenceList />
      <RouteSettingsPanel />
    </div>
  );
};
```

**Size Guidelines**: 50-200 lines

---

#### **Layout Components**

**Purpose**: Define page structure, spacing, and responsive behavior.

**Characteristics**:
- Arrange child components spatially
- Handle responsive breakpoints
- No business logic or data fetching
- Highly reusable across features

**Simplified Example**:
```typescript
// ✅ GOOD: Layout component organizing structure
export function AssetManagementAppLayout() {
  return (
    <div className="h-screen flex flex-col bg-background">
      <AssetManagementHeader />
      <div className="flex-1 flex overflow-hidden">
        <LeftSidePanel />
        <main className="flex-1 overflow-hidden bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

**Size Guidelines**: 30-150 lines

---

### 1.2 Component Type Decision Tree

```
Does it fetch data or manage complex state?
├─ Yes → Container Component
└─ No
   ├─ Does it define page structure/spacing?
   │  ├─ Yes → Layout Component
   │  └─ No → Presentational Component
```

---

## 2. Component Size Guidelines

### 2.1 Real-World Size Analysis

**Mission Planner (116 components)**:
- Largest: `MissionDetailsForm.tsx` (705 lines) ⚠️ **Too Large**
- Average: 150-250 lines
- Smallest: `RightPanel.tsx` (28 lines) ✅

**Asset Management (107 components)**:
- Largest: `MediaCarouselPanel.tsx` (723 lines) ⚠️ **Too Large**
- Average: 100-200 lines
- Smallest: `AssetListPage.tsx` (37 lines) ✅

### 2.2 Size Guidelines by Component Type

| Component Type | Ideal Size | Max Size | Refactor |
|----------------|-----------|---------|----------|
| **Presentational** | 20-80 LOC | 150 LOC | 200 LOC |
| **Container** | 50-200 LOC | 350 LOC | 400 LOC |
| **Layout** | 30-150 LOC | 250 LOC | 300 LOC |
| **Page/Route** | 30-100 LOC | 200 LOC | 250 LOC |

### 2.3 When to Split Components

**Split when component**:
1. Exceeds size guidelines for its type
2. Has 3+ distinct JSX sections
3. Mixed concerns (UI + logic + data)
4. Deeply nested JSX (>4 levels)
5. Complex business logic mixed with UI

**Example**: Split 705-line `MissionDetailsForm` into focused sections:
```typescript
// ❌ BAD: 705 lines doing too much
export const MissionDetailsForm = ({ onChange }) => {
  // 705 lines of device selection, mission type, validation, form logic...
};

// ✅ GOOD: Split into focused components
export const MissionDetailsForm = () => {
  return (
    <div className="mission-details-form">
      <MissionNameSection />
      <DeviceModelSelector />
      <MissionTypeSelector />
      <DockingStationSelector />
    </div>
  );
};
```

---

## 3. Component Hierarchy & Nesting

### 3.1 Recommended Nesting Depth

**Maximum Nesting**: 4-5 levels of JSX nesting

```typescript
// ✅ GOOD: Shallow nesting with extracted components
<div className="panel">
  <PanelHeader />
  <PanelContent />
  <PanelFooter />
</div>

// ❌ BAD: Deep nesting (8+ levels)
<div className="panel">
  <div className="panel-inner">
    <div className="panel-content">
      <div className="content-wrapper">
        <div className="content-inner">
          <div className="form-section">
            <div className="form-group">
              <input />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 3.2 Component Hierarchy Levels

```
Level 1: App Layout
├─ Level 2: Page/Route Component
   ├─ Level 3: Feature Component
      ├─ Level 4: Section Component
         ├─ Level 5: UI Primitive (from shared library)
```

**Example Hierarchy**:
```typescript
// Level 1: App Layout
<AssetManagementAppLayout>
  {/* Level 2: Page */}
  <AssetListPage>
    {/* Level 3: Feature */}
    <AssetWorkspace>
      {/* Level 4: Section */}
      <AssetTreePanel />
      <MainContentPanel>
        {/* Level 5: UI Primitives */}
        <Button />
        <Input />
      </MainContentPanel>
    </AssetWorkspace>
  </AssetListPage>
</AssetManagementAppLayout>
```

### 3.3 Wrapper Components

**Provider Wrappers** (Context/HOC):
```typescript
// ✅ GOOD: Clean provider wrapping
<QueryClientProvider client={queryClient}>
  <AuthProvider>
    <FeatureFlagProvider>
      <App />
    </FeatureFlagProvider>
  </AuthProvider>
</QueryClientProvider>
```

**Higher-Order Components**:
```typescript
// ✅ GOOD: HOC for cross-cutting concerns
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<FallbackProps>
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary FallbackComponent={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
```

---

## 4. Component Composition Patterns

### 4.1 Component Composition Patterns

**Compound Components**: For sharing state between related components
```typescript
// Tab configuration pattern
const TAB_CONFIG = {
  overview: { label: 'Overview', component: AssetOverviewTab },
  gallery: { label: 'Gallery', component: AssetGalleryTab },
};

export function AssetDetailsTwoPanelLayout({ assetId }) {
  const [activeTab, setActiveTab] = useState('overview');
  const ActiveTabComponent = TAB_CONFIG[activeTab].component;

  return (
    <div className="flex h-full">
      <TabNavigation tabs={TAB_CONFIG} activeTab={activeTab} />
      <ActiveTabComponent assetId={assetId} />
    </div>
  );
}
```

**Render Props**: For sharing rendering logic
```typescript
export function MapManager({ children }) {
  const [map, setMap] = useState(null);

  return (
    <div ref={mapRef} className="map-container">
      {map && children(map)}
    </div>
  );
}

// Usage
<MapManager>
  {(map) => <><MapControls map={map} /></>}
</MapManager>
```

**Custom Hooks**: For reusable logic (preferred over render props)
```typescript
export function useRouteSettings(missionPlanner) {
  return {
    updateRouteAltitude: (value) => missionPlanner.setRouteAltitude(value),
    updateRouteSpeed: (value) => missionPlanner.setRouteSpeed(value),
  };
}
```

### 4.2 Component Organization

**Feature-Based Colocation**: Keep related files together
```
✅ GOOD: Feature-based organization
src/app/features/asset-details/
├── components/
│   ├── tabs/
│   │   ├── AssetOverviewTab.tsx
│   │   └── AssetGalleryTab.tsx
│   ├── panels/
│   │   ├── MediaCarouselPanel.tsx
│   │   └── AssetMapPanel.tsx
│   └── error-boundaries/
│       ├── AssetDetailsErrorBoundary.tsx
│       └── MediaErrorBoundary.tsx
├── api/
├── hooks/
├── stores/
└── types/
```

**Benefits**:
- Easy file discovery
- Clear feature boundaries
- Simplifies refactoring

---

## 5. Feature-Based Organization

### 5.1 Feature Structure

```
src/app/features/[feature-name]/
├── components/          # Feature-specific components
│   ├── [sub-feature]/
│   │   ├── ComponentName.tsx
│   │   └── index.ts  # Public API
│   ├── pages/          # Page components
│   ├── layout/         # Layout components
│   └── shared/         # Shared within feature
├── api/                # API calls & services
├── hooks/              # Feature-specific hooks
├── stores/             # Zustand stores
├── types/              # TypeScript types
└── index.ts            # Feature public API
```

### 5.2 Real-World Examples

**Mission Planner**:
```
apps/mission-planner/src/components/
├── MissionForm/                    # Feature
│   ├── LeftPanel.tsx
│   ├── components/
│   │   ├── RouteSettingsPanel/
│   │   │   ├── InfoModals/         # Sub-feature
│   │   │   └── RouteSettingsPanel.tsx
│   │   └── WaypointActions/        # Sub-feature
│   └── __tests__/
└── Map/                           # Separate feature
    ├── components/
    └── hooks/
```

**Asset Management**:
```
apps/asset-management/src/app/features/
├── asset-details/                  # Feature
│   ├── components/
│   │   ├── tabs/                   # Sub-feature
│   │   ├── panels/                 # Sub-feature
│   │   ├── error-boundaries/       # Sub-feature
│   │   └── layout/
│   ├── api/
│   ├── hooks/
│   └── stores/
└── asset-list/                     # Separate feature
    └── components/
        ├── action-bar/             # Sub-feature
        └── asset-tree/             # Sub-feature
```

### 5.3 When to Create a Sub-Feature

**Create sub-feature when**:
- 3+ related components
- Shared internal state/logic
- Distinct functionality within feature
- Likely to grow independently

**Example**:
```
✅ GOOD: Sub-feature for related modals
MissionForm/components/
└── multiWaypointActions/
    ├── ImportWaypointsDropdown.tsx
    ├── WaypointImportModal.tsx
    └── index.ts
```

---

## 6. Public API Design (Index Files)

### 6.1 Public API Design

**Barrel Exports** (Recommended):
```typescript
// ✅ GOOD: Clean barrel exports
// apps/mission-planner/src/components/MissionForm/components/WaypointActions/index.ts
export * from './WaypointActionForm';
export * from './WaypointActionHeader';
```

**Named Exports** (Preferred):
```typescript
// ✅ GOOD: Named exports in component file
export const WaypointActionForm = () => { ... };
export const WaypointActionHeader = () => { ... };

// Index file
export { WaypointActionForm, WaypointActionHeader } from './WaypointActionForm';
```

**Default Exports** (Use Sparingly):
```typescript
// ⚠️ ACCEPTABLE: Only for simple components
const WaypointCard = (props) => { ... };
export default WaypointCard;
```

### 6.2 Index File Organization

**Feature-Level Index**:
```typescript
// src/app/features/asset-details/index.ts
export { AssetDetailsPage } from './components/pages/asset-details-page/AssetDetailsPage';
export { AssetOverviewTab } from './components/tabs/AssetOverviewTab';
export { AssetErrorBoundary } from './components/error-boundaries/AssetErrorBoundary';
export { useAssetDetailsUIStore } from './stores';
```

**Sub-Feature Index**:
```typescript
// components/WaypointActions/index.ts
export * from './WaypointActionForm';
export * from './WaypointActionHeader';
```

### 6.3 Import Best Practices

**✅ DO**:
```typescript
// Clean imports from public API
import { AssetDetailsPage, AssetOverviewTab } from '@/app/features/asset-details';

// Or from sub-feature
import { WaypointActionForm, WaypointActionHeader } from './components/WaypointActions';
```

**❌ DON'T**:
```typescript
// Deep relative imports (brittle)
import { WaypointActionForm } from '../../../components/MissionForm/components/WaypointActions/WaypointActionForm';

// Importing internal files (breaks encapsulation)
import { InternalComponent } from '@/app/features/asset-details/components/panels/components/internal';
```

---

## 7. Shared vs Feature Components

### 7.1 Shared vs Feature Components

**Decision Tree**:
```
Is this component used in multiple apps?
├─ Yes → Shared Library (@libs/shared/ui/fb-components)
└─ No
   ├─ Used in multiple features within same app?
   │  ├─ Yes → App-Level Shared (src/components/shared/)
   │  └─ No → Feature Component (src/app/features/[feature]/components/)
```

### 7.2 Shared Library Components

**Location**: `/libs/shared/ui/fb-components/`

**Examples**: Button, Input, Select (UI primitives)
**Characteristics**:
- Used in 2+ applications
- Highly configurable via props
- No business logic
- Generic and reusable

**Example**:
```typescript
// ✅ GOOD: Shared Button component
export const Button = React.memo(({ variant, size, onClick, children }) => {
  return (
    <button
      className={cn(`fb-button-${variant}`, `fb-button-${size}`)}
      onClick={onClick}
    >
      {children}
    </button>
  );
});
```

### 7.3 Feature Components

**Location**: `/apps/[app-name]/src/app/features/[feature]/components/`

**Examples**: AssetDetailsPage, MissionSequenceList, MediaCarouselPanel
**Characteristics**:
- Contains business logic
- Uses feature-specific stores/hooks
- Not reusable across features
- Tightly coupled to feature domain

**Example**:
```typescript
// ✅ GOOD: Feature-specific component
export const MediaCarouselPanel = React.memo(({ assetId }) => {
  // Feature-specific store
  const { selectedMediaId, setSelectedMediaId } = useMediaCarouselStore();

  // Feature-specific API call
  const { data: media, isLoading } = useAssetMedia(assetId);

  if (isLoading) return <MediaCarouselSkeleton />;

  return (
    <div className="media-carousel-panel">
      <MediaThumbnailCarousel media={media} />
    </div>
  );
});
```

### 7.4 App-Level Shared Components

**Location**: `/apps/[app-name]/src/components/shared/`
**Use**: Components used across multiple features but not generic enough for shared library

---

## 8. Performance Patterns

### 8.1 Performance Patterns

**React.memo**: For frequently re-rendering pure components
```typescript
// ✅ GOOD: Memoized with stable props
export const MediaCarouselHeader = React.memo(({ title, count }) => {
  return (
    <div className="flex items-center justify-between">
      <h3>{title}</h3>
      <span>{count} items</span>
    </div>
  );
});
```

**❌ BAD**: Unnecessary memoization with changing props
```typescript
// ❌ BAD: Receives new function every render
export const MyComponent = React.memo(({ onClick }) => {
  return <button onClick={onClick}>Click</button>;
});

// ✅ GOOD: Use useCallback
<MyComponent onClick={useCallback(() => console.log('click'), [])} />
```

### 8.2 Optimization Patterns

**useMemo**: For expensive computations
```typescript
const waypointIds = useMemo(() => {
  return missionSequence.map((seq) => seq.waypoint.id);
}, [missionSequence]);
```

**useCallback**: For stable function references
```typescript
const handleMediaSelect = useCallback((mediaId) => {
  onMediaSelect(mediaId);
}, [onMediaSelect]);
```

### 8.3 Code Splitting

**Route-based**:
```typescript
// ✅ GOOD: Lazy load route components
export const Route = createLazyFileRoute('/assets')({
  component: lazy(() => import('./AssetListPage')),
});
```

**Component-based**:
```typescript
// ✅ GOOD: Lazy load heavy components
const KmzImportModal = lazy(() => import('./KmzImportModal'));

{isModalOpen && (
  <Suspense fallback={<ModalSkeleton />}>
    <KmzImportModal />
  </Suspense>
)}
```

### 8.4 Virtual Scrolling

**Use for large lists** (>100 items):
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function MissionSequenceList() {
  const virtualizer = useVirtualizer({
    count: waypoints.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
  });

  return (
    <div ref={parentRef}>
      {virtualizer.getVirtualItems().map((row) => (
        <WaypointCard key={row.key} wpIndex={row.index} />
      ))}
    </div>
  );
}
```

---

## 9. Error Boundaries

### 9.1 Error Boundaries

**Placement Levels**:
1. **Feature level** (wrap entire feature)
2. **Tab level** (wrap tab content)
3. **Component level** (wrap error-prone components)
4. **Async operation level** (data fetching, media loading)

### 9.2 Real-World Examples

**Feature-level error boundary**:
```typescript
// ✅ GOOD: Feature-level error boundary
export function AssetDetailsErrorBoundary({ children, assetId }) {
  const handleError = (error, errorInfo) => {
    logger.error('Asset details error caught', {
      message: error.message,
      assetId,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={AssetDetailsErrorFallback}
      onError={handleError}
    >
      {children}
    </ReactErrorBoundary>
  );
}

// Usage
<AssetDetailsErrorBoundary assetId={assetId}>
  <AssetDetailsPage assetId={assetId} />
</AssetDetailsErrorBoundary>
```

**Tab-level error boundary**:
```typescript
// ✅ GOOD: Tab-level error boundary
export function TabErrorBoundary({ children, tabName }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={({ error }) => (
        <div className="p-4">
          <Alert variant="error">
            Failed to load {tabName}: {error.message}
          </Alert>
        </div>
      )}
    >
      {children}
    </ReactErrorBoundary>
  );
}
```

### 9.3 Best Practices

1. **Contextual Fallbacks**: Different UI based on context
2. **Recovery Actions**: Provide retry or refresh options
3. **Error Logging**: Log errors with context
4. **Graceful Degradation**: Show useful info when part fails

---

## 10. Real-World Examples

### 10.1 Real-World Examples

**Good Component Hierarchies**:

**Example 1: Asset List Page** (37 lines - excellent size)
```typescript
// ✅ EXCELLENT: Simple, focused page component
export function AssetListPage() {
  return (
    <div className="h-full flex flex-col bg-background">
      <AssetModuleHeader />
      <AssetWorkspace />
    </div>
  );
}
```

**Example 2: Mission Form Left Panel** (43 lines - good size)
```typescript
// ✅ GOOD: Clear composition of child components
const LeftPanel = () => {
  const routeSettingsPanelOpen = useMissionStore(
    (state) => state.missionFormState.routeSettingsPanelOpen
  );

  return (
    <div className="flex h-full">
      <MissionRouteDetails />
      <MissionSequenceList />
      <RouteSettingsPanel />
    </div>
  );
};
```

**Example 3: Waypoint Action Form** (94 lines - good composition)
```typescript
// ✅ GOOD: Clean routing to specific action components
export const WaypointActionForm = () => {
  const { getWaypointActionBeingEdited } = useMissionStore();
  const waypointActionData = getWaypointActionBeingEdited();

  const ActionTypeToComponent = {
    [WaypointActions.HOVER]: HoverWPA,
    [WaypointActions.DRONE_YAW]: DroneYawWPA,
    // ... action types
  };

  const WpFormComponent = ActionTypeToComponent[waypointActionData?.action_type];

  return waypointActionData && WpFormComponent ? (
    <WpFormComponent action={waypointActionData} />
  ) : null;
};
```

### 10.2 Components That Need Refactoring

**Example 1: Mission Details Form** (705 lines - too large)
```typescript
// ❌ PROBLEM: 705 lines doing too much
export const MissionDetailsForm = ({ onChange }) => {
  // 200+ lines of state selectors
  const missionFormState = useMissionStore((state) => state.missionFormState);
  // ... 20+ more selectors

  // 100+ lines of form logic
  const { control, watch, setValue, formState: { errors } } = useForm();
  // ... more logic

  // 350+ lines of JSX
  return (
    <div>
      {/* Mission name, device selection, mission type, docking station */}
    </div>
  );
};

// ✅ REFACTORED: Split into focused components
export const MissionDetailsForm = () => {
  return (
    <div className="mission-details-form">
      <MissionNameSection />
      <MissionTypeSelector value={missionType} onChange={setMissionType} />
      <DeviceModelSelector missionType={missionType} />
      <DockingStationSelector missionType={missionType} />
      <MissionFormActions />
    </div>
  );
};
```

**Example 2: Media Carousel Panel** (723 lines - too large)
```typescript
// ❌ PROBLEM: 723 lines mixing concerns
export const MediaCarouselPanel = ({ assetId }) => {
  // Data fetching, media selection, error handling, all in one
};

// ✅ REFACTORED: Separate concerns
export const MediaCarouselPanel = ({ assetId }) => {
  return (
    <MediaErrorBoundary assetId={assetId}>
      <MediaCarouselContent assetId={assetId} />
    </MediaErrorBoundary>
  );
};

const MediaCarouselContent = ({ assetId }) => {
  const { data: media, isLoading, error } = useAssetMedia(assetId);

  if (isLoading) return <MediaCarouselSkeleton />;
  if (error) return <MediaCarouselError error={error} />;
  return <MediaCarouselWithData media={media} assetId={assetId} />;
};
```

### 10.3 Feature-Based Organization Examples

**Mission Planner - Good Sub-Feature Organization**:
```
MissionForm/components/RouteSettingsPanel/
├── components/
│   ├── AdvancedRouteSettings/
│   │   ├── components/
│   │   │   ├── GimbalControl.tsx
│   │   │   ├── PositioningAccuracy.tsx
│   │   │   └── RouteDroneYawMode.tsx
│   │   └── AdvancedRouteSettings.tsx
│   ├── InfoModals/
│   │   ├── RouteAltInfoModal.tsx
│   │   └── index.ts
│   └── RouteSettingsPanel.tsx
```

**Asset Management - Error Boundary Organization**:
```
asset-details/components/error-boundaries/
├── AssetDetailsErrorBoundary.tsx  # Feature-level
├── MediaErrorBoundary.tsx          # Media-specific
├── TabErrorBoundary.tsx            # Tab-specific
└── KmlApiErrorBoundary.tsx         # API-specific
```

### 10.4 Index File Patterns

**Simple barrel export**:
```typescript
// WaypointActions/index.ts
export * from './WaypointActionForm';
export * from './WaypointActionHeader';
```

**Feature-level public API**:
```typescript
// asset-details/index.ts
export { AssetDetailsPage } from './components/pages/asset-details-page/AssetDetailsPage';
export { AssetOverviewTab } from './components/tabs/AssetOverviewTab';
export { AssetErrorBoundary } from './components/error-boundaries/AssetErrorBoundary';
```

---

## 11. Anti-Patterns to Avoid

### 11.1 Component Anti-Patterns

**❌ God Component** (1000+ lines):
```typescript
// BAD: Single component doing everything
export const HugeComponent = () => {
  // 1000+ lines of data fetching, state, logic, and UI mixed together
};
```

**❌ Prop Drilling**:
```typescript
// BAD: Passing props through 5+ levels
export const Level1 = ({ data }) => <Level2 data={data} />;
export const Level2 = ({ data }) => <Level3 data={data} />;
export const Level3 = ({ data }) => <Level4 data={data} />;
export const Level4 = ({ data }) => <Level5 data={data} />;

// GOOD: Use context or store
const DataContext = createContext();
export const Level1 = () => (
  <DataProvider><Level2 /></DataProvider>
);
export const Level5 = () => {
  const { data } = useDataContext();
  return <div>{data}</div>;
};
```

**❌ Duplicate Logic**:
```typescript
// BAD: Same logic in multiple components
export const Component1 = () => {
  const [loading, setLoading] = useState(false);
  // ... fetch logic
};

export const Component2 = () => {
  const [loading, setLoading] = useState(false);
  // ... same fetch logic
};

// GOOD: Extract to custom hook
const useAsyncOperation = (operation) => {
  const [loading, setLoading] = useState(false);
  const execute = async (...args) => {
    setLoading(true);
    try {
      return await operation(...args);
    } finally {
      setLoading(false);
    }
  };
  return { execute, loading };
};
```

**❌ Unnecessary Re-renders**:
```typescript
// BAD: Creating new objects/arrays in render
<ExpensiveChild
  config={{ option1: true, option2: false }}  // New object every render
  items={[1, 2, 3]}                           // New array every render
/>

// GOOD: Use useMemo for stable references
const config = useMemo(() => ({ option1: true, option2: false }), []);
const items = useMemo(() => [1, 2, 3], []);
<ExpensiveChild config={config} items={items} />
```

**❌ Deep Nesting**:
```typescript
// BAD: 8+ levels of nesting
<div className="a"><div className="b"><div className="c"><button>Click</button></div></div></div>

// GOOD: Extract components
<div className="a"><ComponentA /></div>
const ComponentA = () => <div className="b"><ComponentB /></div>;
```

### 11.2 Organization Anti-Patterns

**❌ Poor File Organization**:
```
BAD: Flat structure with 100+ files
src/components/Button.tsx
src/components/Input.tsx
src/components/AssetList.tsx
... 100+ files

GOOD: Feature-based organization
src/app/features/asset-list/components/
src/app/features/asset-details/components/
```

**❌ Inconsistent Naming**:
```
BAD: Inconsistent naming
assetDetails.tsx
AssetList.tsx
media-gallery.tsx
Mission_Details_Form.tsx

GOOD: Consistent naming
AssetDetails.tsx
AssetList.tsx
MediaGallery.tsx
MissionDetailsForm.tsx
```

**❌ Missing Index Files**:
```
BAD: Deep imports
import { Button } from '../../../components/shared/ui/Button/Button';

GOOD: Clean imports via index
import { Button } from '@libs/shared/ui/fb-components';
```

---

## 12. Component Checklist

Use this checklist when reviewing or creating components:

### Component Design
- [ ] **Single Responsibility**: Component does one thing well
- [ ] **Appropriate Size**: Within LOC guidelines for component type
- [ ] **Clear Naming**: Name reflects purpose (e.g., `UserCard`)
- [ ] **Type Safety**: All props have TypeScript interfaces

### Component Structure
- [ ] **Shallow Nesting**: JSX nesting ≤ 4 levels
- [ ] **Extracted Sub-Components**: Large JSX blocks extracted
- [ ] **Custom Hooks**: Complex logic extracted to hooks
- [ ] **Consistent Styling**: Uses design tokens, not magic values

### Performance
- [ ] **React.memo**: Used for frequently re-rendering pure components
- [ ] **useMemo**: Used for expensive computations
- [ ] **useCallback**: Used for callbacks passed to optimized children
- [ ] **Lazy Loading**: Heavy components lazy-loaded

### Data Flow
- [ ] **Props Interface**: Clear, documented prop interface
- [ ] **No Prop Drilling**: Uses context/store for deep props
- [ ] **Server State**: Uses TanStack Query for server data
- [ ] **Client State**: Uses Zustand for global client state

### Error Handling
- [ ] **Error Boundaries**: Wrapped for error-prone components
- [ ] **Loading States**: Shows skeleton/loading during async operations
- [ ] **Empty States**: Handles empty data gracefully
- [ ] **Error States**: Shows user-friendly error messages

---

## Quick Reference

### Component Size Limits

| Type | Ideal | Max | Refactor |
|------|-------|-----|----------|
| Presentational | 20-80 | 150 | 200 |
| Container | 50-200 | 350 | 400 |
| Layout | 30-150 | 250 | 300 |
| Page | 30-100 | 200 | 250 |

### Nesting Limits

- **JSX Nesting**: Max 4-5 levels
- **Component Hierarchy**: Max 5 levels (App → Page → Feature → Section → UI)
- **Folder Depth**: Max 5-6 levels from `/src`

### When to Split Components

1. Component exceeds size guidelines
2. JSX has >3-4 distinct sections
3. Mixed concerns (UI + logic + data)
4. Deeply nested JSX
5. Repeated UI patterns

### When to Create Sub-Feature

1. 3+ related components
2. Shared internal state/logic
3. Distinct functionality
4. Likely to grow independently

### Performance Optimization Checklist

- [ ] React.memo for pure components with stable props
- [ ] useMemo for expensive computations
- [ ] useCallback for callbacks passed to children
- [ ] Lazy loading for heavy components/routes
- [ ] Virtual scrolling for large lists (>100 items)
- [ ] Code splitting by route

---

## Appendices

### A. Component Type Comparison

| Aspect | Presentational | Container | Layout |
|--------|---------------|----------|--------|
| **State** | Ephemeral only | Complex state | Minimal state |
| **Data Fetching** | No | Yes | No |
| **Business Logic** | No | Yes | No |
| **Reusability** | High | Low | Medium |
| **Size** | 20-80 LOC | 50-200 LOC | 30-150 LOC |
| **Example** | `SearchInput` | `MediaCarouselPanel` | `AssetDetailsTwoPanelLayout` |

### B. Real-World Component Stats

**Mission Planner (116 components)**:
- Largest: `MissionDetailsForm` (705 LOC) ⚠️
- Smallest: `RightPanel` (28 LOC) ✅
- Average: ~150 LOC
- Good examples: `WaypointActionForm` (94 LOC), `LeftPanel` (43 LOC)

**Asset Management (107 components)**:
- Largest: `MediaCarouselPanel` (723 LOC) ⚠️
- Smallest: `AssetListPage` (37 LOC) ✅
- Average: ~125 LOC
- Good examples: `AssetListPage` (37 LOC), `SearchInput` (73 LOC)

### C. Further Reading

- [React Official Documentation - Component Patterns](https://react.dev/learn/understanding-your-ui-as-a-tree)
- [TanStack Query - React Component Patterns](https://tanstack.com/query/latest/docs/react/guides/testing)
- [Zustand - Best Practices](https://github.com/pmndrs/zustand#best-practices)
- [Web.dev - Render Props vs Hooks](https://web.dev/render-prop-vs-hook/)

---

**Document Status**: ✅ Active Standard

**Next Review Date**: 2026-04-27

**Change Log**:
- 2026-01-27: Initial version created based on analysis of Mission Planner, Asset Management, and Fleet View applications
