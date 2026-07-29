# TypeScript Type System - Patterns & Best Practices

## Table of Contents

1. [Type Organization & Structure](#1-type-organization--structure)
2. [Interface vs Type Alias](#2-interface-vs-type-alias)
3. [Component Props Typing](#3-component-props-typing)
4. [React Hook Typing](#4-react-hook-typing)
5. [Generic Types in React](#5-generic-types-in-react)
6. [Utility Types Guide](#6-utility-types-guide)
7. [API Type Patterns](#7-api-type-patterns)
8. [Type Narrowing & Guards](#8-type-narrowing--guards)
9. [Domain Type Design](#9-domain-type-design)
10. [Real-World Examples](#10-real-world-examples)
11. [Anti-Patterns to Avoid](#11-anti-patterns-to-avoid)
12. [Type Safety Checklist](#12-type-safety-checklist)

---

## 1. Type Organization & Structure

### 1.1 Folder Structure Pattern

**Apps**: `/apps/{app-name}/src/app/types/`
```
types/
├── index.ts              # Barrel exports
├── domain.types.ts      # Domain entities
├── feature.types.ts     # Feature-specific types
└── shared.types.ts      # Shared utilities
```

**Libs**: `/libs/shared/{module}/types/`
```
types/
├── index.ts            # Public API exports
├── domain.types.ts     # Domain-specific types
└── shared.types.ts     # State management types
```

### 1.2 Type Organization Principles

1. **File naming**:
   - Domain entities: `{domain}.types.ts`
   - Features: `{feature}.types.ts`
   - API contracts: `{entity}.dto.ts`

2. **Barrel exports pattern**:
   ```typescript
   // types/index.ts
   export * from './domain.types';
   export * from './feature.types';
   export * from './shared.types';
   ```

3. **Layering structure**:
   ```typescript
   // Layer 1: Primitives
   export enum AssetStatus { ACTIVE = 'active' }

   // Layer 2: Domain entities
   export interface AssetMinimal { ... }
   export interface AssetDetail extends AssetMinimal { ... }

   // Layer 3: Operations
   export interface CreateAssetData { ... }

   // Layer 4: UI/state types
   export interface AssetTreeNode extends AssetDetail { ... }
   ```

4. **Dependency direction**: `UI/State → Domain → Shared/Primitive`

---

## 2. Interface vs Type Alias

### 2.1 When to Use Interfaces

**Use interfaces for:**
- Object shapes that can be extended
- Public API contracts
- Class definitions
- Objects that might be augmented

**Good Example** - Domain Entity:
```typescript
export interface AssetMinimal {
  _id: ObjectId;
  name: string;
  category: AssetCategory;
  status: AssetStatus;
  coordinates: GeoPoint;
  organizationId: ObjectId;
  siteId: ObjectId;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// Extension pattern
export interface AssetDetail extends AssetMinimal {
  properties: {
    material?: string;
    installationDate?: ISODateString;
    customFields?: Record<string, unknown>;
  };
  inspectionConfig: InspectionConfig;
  createdBy: ObjectId;
  updatedBy: ObjectId;
}
```

**Why interface?**
- Clear inheritance hierarchy
- Represents domain entity shape
- May be extended in consuming code
- Better IDE support for object shapes

### 2.2 When to Use Type Aliases

**Use type aliases for:**
- Union types
- Intersection types
- Utility type compositions
- Function types
- Mapped types

**Good Example** - Union Types:
```typescript
export type IWaypointActionMetadata =
  | ICameraZoomAction
  | IStopVideoRecordingAction
  | IIntervalShotsAction
  | IHoverAction
  | ICaptureMediaAction
  | IDroneYawAction
  | IGimbalYawAction
  | IGimbalPitchAction;
```

**Good Example** - Utility Types:
```typescript
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends (infer U)[]
    ? ReadonlyArray<DeepReadonly<U>>
    : T[P] extends object
    ? DeepReadonly<T[P]>
    : T[P];
};
```

### 2.3 Discriminated Unions

**Pattern for state management:**
```typescript
type AsyncState<T, E = Error> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: E };

// Usage with type narrowing
function handleState<T>(state: AsyncState<T>) {
  switch (state.status) {
    case 'success':
      console.log(state.data); // TypeScript knows `data` exists
      break;
    case 'error':
      console.error(state.error); // TypeScript knows `error` exists
      break;
  }
}
```

### 2.4 Interface vs Type Decision Tree

```
Is it a class or object shape?
├─ Yes → Use interface
│  ├─ Need extension/inheritance? → interface (preferred)
│  └─ Public API contract? → interface
└─ No → Use type alias
   ├─ Union of types? → type
   ├─ Utility type operation? → type
   ├─ Function type? → type
   └─ Complex mapped type? → type
```

---

## 3. Component Props Typing

### 3.1 Basic Props Interface

**Good Pattern** - Explicit Props Interface:
```typescript
export interface MediaCarouselHeaderProps {
  /** Name of the asset */
  assetName: string;
  /** Number of media items in carousel */
  mediaCount: number;
  /** Additional CSS classes */
  className?: string;
}

export const MediaCarouselHeader = React.memo<MediaCarouselHeaderProps>(
  ({ assetName, mediaCount, className }) => {
    return (
      <div className={cn('flex-shrink-0 p-4', className)}>
        <h3 className="text-text-1 fb-title2-medium">{assetName}</h3>
        <p className="text-text-3 fb-body5-regular">
          {mediaCount === 1 ? '1 item' : `${mediaCount} items`}
        </p>
      </div>
    );
  }
);
```

**Key Points**:
- Export props interface for reuse
- Use JSDoc comments for prop descriptions
- Include `className?: string` for flexibility
- Use `React.memo` with generic for performance

### 3.2 Props with Children

**Pattern 1** - Using `React.PropsWithChildren`:
```typescript
import type { ReactNode } from 'react';

interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
}

type ButtonPropsWithChildren = React.PropsWithChildren<ButtonProps>;

export const Button = ({ children, variant, onClick }) => {
  return <button onClick={onClick}>{children}</button>;
};
```

**Pattern 2** - Explicit children (recommended):
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: ReactNode;
}

export const Button = ({ children, variant, onClick }) => {
  return <button onClick={onClick}>{children}</button>;
};
```

### 3.3 Callback Props Typing

**Event Handlers**:
```typescript
interface InputProps {
  value: string;
  onChange: (value: string) => void;           // Custom callback
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;  // DOM event
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;  // Optional
}
```

**Best Practices**:
- Use specific event types (`MouseEvent<HTMLButtonElement>`)
- Extract values from events in callback if needed
- Make callbacks optional with `?` if not required

### 3.4 Polymorphic Component Pattern

**Advanced Pattern** - Using `as` prop:
```typescript
import type { ElementType, ReactNode } from 'react';

interface BaseProps {
  children: ReactNode;
  className?: string;
}

type PolymorphicComponentProps<T extends ElementType> = BaseProps & {
  as?: T;
} & React.ComponentPropsWithoutRef<T>;

export function Box<T extends ElementType = 'div'>({
  as,
  children,
  className,
  ...rest
}: PolymorphicComponentProps<T>) {
  const Component = as || 'div';
  return <Component className={className}>{children}</Component>;
}

// Usage:
<Box as="button" onClick={handleClick}>Click me</Box>
<Box as="a" href="/home">Home</Box>
<Box>Default div</Box>
```

### 3.5 ForwardRef Typing

**Pattern for ref forwarding**:
```typescript
interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ value, onChange, placeholder }, ref) => {
    return (
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    );
  }
);

Input.displayName = 'Input';
```

### 3.6 Generic Component Props

**Pattern** - Generic list component:
```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
}

export function List<T>({ items, renderItem, keyExtractor, emptyMessage }: ListProps<T>) {
  if (items.length === 0) {
    return <div>{emptyMessage || 'No items'}</div>;
  }

  return (
    <ul>
      {items.map((item, index) => (
        <li key={keyExtractor(item)}>{renderItem(item, index)}</li>
      ))}
    </ul>
  );
}
```

---

## 4. React Hook Typing

### 4.1 Custom Hook Return Types

**Pattern 1** - Explicit return type:
```typescript
interface UseAssetDetailResult {
  data: AssetDetailResponseDTO | undefined;
  isLoading: boolean;
  error: AssetApiError | null;
  refetch: () => void;
}

export function useAssetDetail(
  assetId: string,
  options?: UseQueryOptions<AssetDetailResponseDTO, AssetApiError>
): UseAssetDetailResult {
  const result = useQuery<AssetDetailResponseDTO, AssetApiError>({
    queryKey: ['asset', assetId],
    queryFn: () => fetchAsset(assetId),
    enabled: !!assetId,
    ...options,
  });

  return {
    data: result.data,
    isLoading: result.isLoading,
    error: result.error || null,
    refetch: result.refetch,
  };
}
```

**Pattern 2** - Return hook result directly (simpler):
```typescript
export function useAssetDetail(assetId: string) {
  return useQuery({
    queryKey: ['asset', assetId],
    queryFn: () => fetchAsset(assetId),
    enabled: !!assetId,
  });
}
```

**Recommendation**: Use Pattern 2 unless you need to transform the result.

### 4.2 Generic Hooks

**Pattern** - Reusable data fetching hook:
```typescript
interface UseResourceOptions<TData> {
  enabled?: boolean;
  staleTime?: number;
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
}

export function useResource<TData>(
  resourceKey: string,
  fetcher: () => Promise<TData>,
  options: UseResourceOptions<TData> = {}
) {
  return useQuery<TData, Error>({
    queryKey: [resourceKey],
    queryFn: fetcher,
    enabled: options.enabled ?? true,
    staleTime: options.staleTime,
    onSuccess: options.onSuccess,
    onError: options.onError,
  });
}
```

### 4.3 Event Handler Hooks

**Pattern** - Typed event handlers:
```typescript
interface UseKeyboardHandlers {
  onKeyDown: (e: KeyboardEvent) => void;
  onKeyUp: (e: KeyboardEvent) => void;
}

export function useKeyboard(
  keyMap: Record<string, () => void>,
  enabled: boolean = true
): UseKeyboardHandlers {
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    const handler = keyMap[e.key];
    handler?.();
  }, [keyMap, enabled]);

  return {
    onKeyDown,
    onKeyUp: () => {},
  };
}
```

### 4.4 Context Hooks

**Pattern** - Typed context:
```typescript
interface AssetContextValue {
  asset: AssetDetail | null;
  setAsset: (asset: AssetDetail) => void;
}

const AssetContext = createContext<AssetContextValue | null>(null);

export function useAssetContext(): AssetContextValue {
  const context = useContext(AssetContext);
  if (!context) {
    throw new Error('useAssetContext must be used within AssetProvider');
  }
  return context;
}
```

---

## 5. Generic Types in React

### 5.1 Generic Component Patterns

**Generic data table**:
```typescript
interface TableColumn<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (row: T) => void;
}

export function Table<T>({ data, columns, onRowClick }: TableProps<T>) {
  return (
    <table>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={String(col.key)}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} onClick={() => onRowClick?.(row)}>
            {columns.map((col) => (
              <td key={String(col.key)}>
                {col.render ? col.render(row[col.key], row) : String(row[col.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 5.2 Progressive Loading Pattern

**Minimal vs Detail split**:
```typescript
interface AssetMinimal {
  _id: string;
  name: string;
  status: string;
}

interface AssetDetail extends AssetMinimal {
  description: string;
  properties: Record<string, unknown>;
  inspectionConfig: InspectionConfig;
}

type ProgressiveLoader<TMinimal, TDetail extends TMinimal> = {
  minimal: TMinimal[];
  loadDetail: (id: string) => Promise<TDetail>;
  getDetail: (id: string) => TDetail | undefined;
};
```

### 5.3 Type Constraints

**Constrained generics**:
```typescript
interface Identifiable {
  _id: string;
}

function findById<T extends Identifiable>(items: T[], id: string): T | undefined {
  return items.find((item) => item._id === id);
}

// Usage
interface Asset extends Identifiable {
  name: string;
}

const assets: Asset[] = [{ _id: '1', name: 'Asset 1' }];
const asset = findById(assets, '1');
```

### 5.4 Conditional Types

**Conditional rendering based on type**:
```typescript
interface MediaBase {
  id: string;
  url: string;
}

interface ImageMedia extends MediaBase {
  type: 'image';
  alt: string;
}

interface VideoMedia extends MediaBase {
  type: 'video';
  duration: number;
}

type Media = ImageMedia | VideoMedia;

type MediaComponentProps<T extends Media> = T extends ImageMedia
  ? { media: T; onImageClick: () => void }
  : { media: T; onVideoEnd: () => void };

function MediaComponent<T extends Media>(props: MediaComponentProps<T>) {
  if (props.media.type === 'image') {
    return <img src={props.media.url} alt={props.media.alt} onClick="onImageClick" />;
  }
  return <video src={props.media.url} onEnded={props.onVideoEnd} />;
}
```

---

## 6. Utility Types Guide

### 6.1 Common Utility Types

**Partial** - Make all properties optional:
```typescript
interface UpdateAssetData {
  name?: string;
  category?: AssetCategory;
  status?: AssetStatus;
}

// More concise:
type UpdateAssetData = Partial<AssetDetail>;
```

**Pick** - Select specific properties:
```typescript
// From AssetDetail, pick only identifying fields
type AssetIdentifier = Pick<AssetDetail, '_id' | 'name' | 'status'>;

// Usage in list view
function AssetCard({ _id, name, status }: AssetIdentifier) {
  return <div>{name}</div>;
}
```

**Omit** - Remove specific properties:
```typescript
// Remove sensitive fields from API response
type PublicAsset = Omit<AssetDetail, 'createdBy' | 'updatedBy'>;

// Remove id when creating new asset
type CreateAssetInput = Omit<AssetDetail, '_id' | 'createdAt' | 'updatedAt'>;
```

**Record** - Dictionary type:
```typescript
// Custom fields dictionary
interface AssetProperties {
  customFields?: Record<string, string | number | boolean>;
}

// Type-safe record keys
type AssetMetadata = Record<'material' | 'voltage' | 'capacity', string>;
```

**Required** - Make all properties required:
```typescript
interface AssetDraft {
  name?: string;
  category?: AssetCategory;
}

type AssetRequired = Required<AssetDraft>;
```

**Readonly** - Immutable objects:
```typescript
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends (infer U)[]
    ? ReadonlyArray<DeepReadonly<U>>
    : T[P] extends object
    ? DeepReadonly<T[P]>
    : T[P];
};

// Usage
const config: DeepReadonly<AppConfig> = {
  // TypeScript prevents modification
};
```

### 6.2 Advanced Utility Types

**ReturnType** - Extract function return type:
```typescript
function fetchAsset(id: string): Promise<AssetDetail> {
  return fetch(`/api/assets/${id}`).then(r => r.json());
}

type FetchAssetReturn = ReturnType<typeof fetchAsset>;
// Type: Promise<AssetDetail>

// Use in hook
export function useAsset(id: string) {
  return useQuery<Awaited<FetchAssetReturn>>({
    queryKey: ['asset', id],
    queryFn: () => fetchAsset(id),
  });
}
```

**Parameters** - Extract function parameters:
```typescript
function updateAsset(id: string, data: UpdateAssetData, options?: { optimistic: boolean }) {
  // Implementation
}

type UpdateAssetParams = Parameters<typeof updateAsset>;
// Type: [string, UpdateAssetData, { optimistic: boolean } | undefined]
```

### 6.3 Template Literal Types

**Type-safe event emitters**:
```typescript
type AssetEvents = {
  'asset:created': AssetDetail;
  'asset:updated': { id: string; changes: Partial<AssetDetail> };
  'asset:deleted': { id: string };
};

class AssetEventEmitter {
  on<K extends keyof AssetEvents>(
    event: K,
    callback: (data: AssetEvents[K]) => void
  ): void {
    // Implementation
  }

  emit<K extends keyof AssetEvents>(
    event: K,
    data: AssetEvents[K]
  ): void {
    // Implementation
  }
}

// Type-safe usage
const emitter = new AssetEventEmitter();
emitter.on('asset:created', (asset) => {
  // asset is typed as AssetDetail
  console.log(asset.name);
});
```

---

## 7. API Type Patterns

### 7.1 Request/Response DTOs

**Pattern** - Separate DTO types from domain types:
```typescript
/** API Response wrapper */
export interface SuccessResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

/** Bulk operation request */
export interface BulkOperationRequest {
  missionIds: string[];
  action: string;
}

/** Name availability check */
export interface NameCheckRequest {
  name: string;
}

export interface NameCheckResponse {
  is_available: boolean;
}
```

### 7.2 API Error Types

**Pattern** - Structured error types:
```typescript
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  field?: string;
  traceId?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}
```

### 7.3 Pagination Types

**Pattern** - Cursor-based pagination:
```typescript
/** Pagination metadata for cursor-based pagination */
export interface PaginationInfo {
  cursor?: string;
  hasMore: boolean;
  pageSize?: number; // UI display only
  totalCount?: number; // Progress indicators only
}

/** Pagination request parameters */
export interface PaginationParams {
  limit?: number;
  cursor?: string;
}

/** Paginated response */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}
```

**Usage in hooks**:
```typescript
export function useAssetList(params: PaginationParams & AssetQuery) {
  return useQuery<PaginatedResponse<AssetMinimal>>({
    queryKey: ['assets', params],
    queryFn: () => apiClient.get('/assets', { params }),
  });
}
```

### 7.4 Query Parameter Types

**Pattern** - Type-safe query builders:
```typescript
export interface AssetQuery {
  assetGroupId?: ObjectId;
  category?: AssetCategory | AssetCategory[];
  status?: AssetStatus | AssetStatus[];
  tags?: string[];
  tagOperation?: 'and' | 'or';
  bbox?: [west: number, south: number, east: number, north: number];
  search?: string;
  createdAfter?: ISODateString;
  createdBefore?: ISODateString;
  sortBy?: AssetSortBy;
  sortOrder?: SortOrder;
  includeFields?: 'minimal' | 'standard' | 'full';
}

// Type-safe query builder
function buildAssetQuery(query: AssetQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (query.category) {
    if (Array.isArray(query.category)) {
      query.category.forEach(c => params.append('category', c));
    } else {
      params.set('category', query.category);
    }
  }

  if (query.bbox) {
    params.set('bbox', query.bbox.join(','));
  }

  return params;
}
```

---

## 8. Type Narrowing & Guards

### 8.1 Type Guards

**`typeof` checks**:
```typescript
function processValue(value: string | number) {
  if (typeof value === 'string') {
    // TypeScript knows value is string here
    return value.toUpperCase();
  }
  // TypeScript knows value is number here
  return value * 2;
}
```

**`in` operator**:
```typescript
interface CameraAction {
  type: 'camera';
  zoom?: number;
}

interface GimbalAction {
  type: 'gimbal';
  pitch: number;
  yaw: number;
}

type WaypointAction = CameraAction | GimbalAction;

function executeAction(action: WaypointAction) {
  if ('zoom' in action) {
    // TypeScript knows this is CameraAction
    console.log(action.zoom);
  } else {
    // TypeScript knows this is GimbalAction
    console.log(action.pitch, action.yaw);
  }
}
```

**Discriminated unions**:
```typescript
interface AssetLoading {
  status: 'loading';
}

interface AssetSuccess {
  status: 'success';
  asset: AssetDetail;
}

interface AssetError {
  status: 'error';
  error: Error;
}

type AssetState = AssetLoading | AssetSuccess | AssetError;

function renderAsset(state: AssetState) {
  switch (state.status) {
    case 'loading':
      return <Spinner />;
    case 'success':
      return <AssetCard asset={state.asset} />;
    case 'error':
      return <ErrorMessage error={state.error} />;
  }
}
```

### 8.2 Custom Type Guards

**User-defined type guards**:
```typescript
interface Asset {
  _id: string;
  name: string;
  type: 'pipeline' | 'building';
}

function isPipelineAsset(asset: Asset): asset is Asset & { type: 'pipeline' } {
  return asset.type === 'pipeline';
}

function processAsset(asset: Asset) {
  if (isPipelineAsset(asset)) {
    // TypeScript knows type is 'pipeline' here
    console.log('Processing pipeline asset');
  }
}
```

### 8.3 Assertion Functions

**Assert conditions for type narrowing**:
```typescript
function assertIsDefined<T>(value: T | null | undefined): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error('Value is not defined');
  }
}

function getAssetName(asset: AssetDetail | null): string {
  assertIsDefined(asset);
  // TypeScript knows asset is AssetDetail here
  return asset.name;
}
```

### 8.4 Nullable Handling

**Safe optional chaining**:
```typescript
interface Mission {
  device_model_info?: {
    drone?: SupportedDrones;
    primary_payload?: DronePayloadTypes;
  };
}

function getMissionDrone(mission: Mission): SupportedDrones | null {
  return mission.device_model_info?.drone ?? null;
}

// Pattern for providing defaults
function getMissionPayload(mission: Mission): DronePayloadTypes {
  return mission.device_model_info?.primary_payload ?? DronePayloadTypes.M30;
}
```

---

## 9. Domain Type Design

### 9.1 Progressive Loading Types

**Pattern** - Minimal vs Detail split:
```typescript
/** Minimal asset type for list views and maps */
export interface AssetMinimal {
  _id: ObjectId;
  name: string;
  category: AssetCategory;
  status: AssetStatus;
  coordinates: GeoPoint;
  organizationId: ObjectId;
  siteId: ObjectId;
  tags: string[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** Full asset detail type */
export interface AssetDetail extends AssetMinimal {
  properties: {
    material?: string;
    installationDate?: ISODateString;
    customFields?: Record<string, unknown>;
  };
  inspectionConfig: InspectionConfig;
  createdBy: ObjectId;
  updatedBy: ObjectId;
  inspectionCount: number;
  distanceFromUser?: number;
}
```

**Benefits**:
- Load minimal data for lists/maps (performance)
- Fetch detail only when needed (on-demand)
- Clear separation of concerns
- Type-safe progressive loading

### 9.2 Mission Types Hierarchy

**Complex Domain Model**:
```typescript
/** Base waypoint position */
export interface IWaypointPosition {
  lat: number;
  lng: number;
  alt: IAltitude;
}

/** Altitude with dual references */
export interface IAltitude {
  AGL: number; // Above Ground Level
  RLT: number; // Relative to Launch/Takeoff
}

/** Waypoint with actions */
export interface IWaypoint {
  waypoint_id?: string;
  position: IWaypointPosition;
  altitude_follow_route: boolean;
  altitude_reference: AltitudeReference;
  speed_follow_route: boolean;
  speed_value: number;
  waypoint_turn_type_follow_route: boolean;
  waypoint_turn_type: WayPointTurnType;
  waypoint_turn_value: number;
  next_waypoint_drone_yaw_mode_follow_route: boolean;
  next_waypoint_drone_yaw_mode: NextWaypointApproachDroneYawModes;
  next_waypoint_drone_yaw_value?: INextWaypointDroneYawValue;
  next_waypoint_gimbal_pitch: number;
  waypoint_actions: IWaypointAction[];

  // AGL calculation state
  aglCalculating?: boolean;
  aglError?: string | null;
}

/** Waypoint actions with discriminated union */
export interface IWaypointAction {
  action_id?: string;
  action_type: WaypointActions;
  action_metadata: IWaypointActionMetadata;
}

export type IWaypointActionMetadata =
  | ICameraZoomAction
  | IStopVideoRecordingAction
  | IIntervalShotsAction
  | IHoverAction
  | ICapturePanoramaAction
  | ICaptureMediaAction
  | IDroneYawAction
  | IGimbalYawAction
  | IGimbalPitchAction
  | IOrientedShootAction;

/** Specific action types with type-safe metadata */
export interface ICameraZoomAction {
  value: number;
}

export interface IIntervalShotsAction {
  interval_types: IntervalTypes;
  interval_value: number;
  camera_lenses: LensTypes[];
  camera_lenses_follow_route: boolean;
}
```

### 9.3 Enum Design

**Pattern** - String enums for type safety:
```typescript
export enum MissionType {
  WAYPOINT_PATH = 'WAYPOINT_PATH',
  GRID = 'GRID',
}

export enum MissionStatus {
  INCOMPLETE = 'INCOMPLETE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETE = 'COMPLETE',
  DRAFT = 'DRAFT',
  DISABLED = 'DISABLED',
}

// Enum-to-display mapping
export const ActionTypeToName: Record<WaypointActions, string> = {
  [WaypointActions.HOVER]: 'Hover',
  [WaypointActions.CAPTURE_MEDIA]: 'Capture media',
  [WaypointActions.DRONE_YAW]: 'Drone yaw',
};
```

### 9.4 Shared Type Aliases

**Pattern** - Reusable type primitives:
```typescript
import type { Point, Geometry } from 'geojson';

/** Type aliases for common primitives */
export type ObjectId = string;
export type ISODateString = string;

/** GeoJSON types */
export type GeoPoint = Point;
export type GeoGeometry = Geometry;

/** Sort order enum */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}
```

---

## 10. Real-World Examples

### 10.1 Good: Asset Types with Progressive Loading

```typescript
/** Asset Core Type Definitions */
export interface AssetMinimal {
  _id: ObjectId;
  name: string;
  category: AssetCategory;
  status: AssetStatus;
  coordinates: GeoPoint;
  organizationId: ObjectId;
  siteId: ObjectId;
  tags: string[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface AssetDetail extends AssetMinimal {
  properties: {
    material?: string;
    installationDate?: ISODateString;
    customFields?: Record<string, unknown>;
  };
  inspectionConfig: InspectionConfig;
  createdBy: ObjectId;
  updatedBy: ObjectId;
  inspectionCount: number;
}
```

**Why this is good**:
- Progressive loading pattern (minimal → detail)
- Type aliases for semantic clarity
- Well-organized with logical grouping

### 10.2 Good: Media Carousel Header Props

```typescript
export interface MediaCarouselHeaderProps {
  /** Name of the asset */
  assetName: string;
  /** Number of media items in carousel */
  mediaCount: number;
  /** Additional CSS classes */
  className?: string;
}

export const MediaCarouselHeader = React.memo<MediaCarouselHeaderProps>(
  ({ assetName, mediaCount, className }) => {
    return (
      <div className={cn('flex-shrink-0 p-4', className)}>
        <h3 className="text-text-1 fb-title2-medium">{assetName}</h3>
        <p className="text-text-3 fb-body5-regular">
          {mediaCount === 1 ? '1 item' : `${mediaCount} items`}
        </p>
      </div>
    );
  }
);
```

**Why this is good**:
- JSDoc comments for all props
- Optional props marked with `?`
- Uses `React.memo` with generic for performance
- Clean, focused interface

### 10.3 Good: Mission Action Types

```typescript
export type IWaypointActionMetadata =
  | ICameraZoomAction
  | IStopVideoRecordingAction
  | IIntervalShotsAction
  | IHoverAction
  | ICaptureMediaAction
  | IDroneYawAction
  | IGimbalYawAction
  | IGimbalPitchAction
  | IOrientedShootAction;

export interface IWaypointAction {
  action_id?: string;
  action_type: WaypointActions;
  action_metadata: IWaypointActionMetadata;
}
```

**Why this is good**:
- Discriminated union for type safety
- Clear action type hierarchy
- Easy to extend with new actions
- Type narrowing works naturally

### 10.4 Good: Telemetry Types

```typescript
/** Enhanced Global Position */
export interface GlobalPosition {
  position: {
    latitude: number;
    longitude: number;
    height: number;
    elevation: number;
    gps_satellites: number;
  };
  timestamp?: number;
  speed?: SpeedInfo;
  home_position?: HomePosition;
  rtk?: RTKInfo;
}

/** Attitude information - orientation of drone in 3D space */
export interface Attitude {
  roll: number; // Roll angle in degrees
  pitch: number; // Pitch angle in degrees
  yaw: number; // Yaw angle in degrees (heading)
}
```

**Why this is good**:
- Comprehensive documentation
- Comments explain units and ranges
- Matches data structure (DTO-like)
- Optional fields clearly marked

---

## 11. Anti-Patterns to Avoid

### 11.1 Using `any`

**Bad**:
```typescript
function processData(data: any) {
  return data.map((item: any) => item.value);
}
```

**Good**:
```typescript
interface DataItem {
  value: number;
  id: string;
}

function processData(data: DataItem[]): number[] {
  return data.map(item => item.value);
}
```

**Better** (if unknown):
```typescript
function processData(data: unknown[]): number[] {
  return data.map(item => {
    if (typeof item === 'object' && item !== null && 'value' in item) {
      return (item as { value: number }).value;
    }
    throw new Error('Invalid data item');
  });
}
```

### 11.2 Excessive Optional Chaining

**Bad**:
```typescript
const value = data?.user?.profile?.settings?.theme?.primary?.color;
```

**Good**:
```typescript
// Use nullish coalescing with defaults
const color = data?.user?.profile?.settings?.theme?.primary?.color ?? '#000';

// Or validate data at boundary
interface UserData {
  user: {
    profile: {
      settings: {
        theme: {
          primary: { color: string };
        };
      };
    };
  };
}

function getThemeColor(data: UserData): string {
  return data.user.profile.settings.theme.primary.color;
}
```

### 11.3 Duplicate Type Definitions

**Bad**:
```typescript
// In file1.ts
interface Asset {
  _id: string;
  name: string;
}

// In file2.ts
interface Asset {
  _id: string;
  name: string;
  status: string;
}
```

**Good**:
```typescript
// In types/asset.types.ts
export interface AssetMinimal {
  _id: string;
  name: string;
}

export interface AssetDetail extends AssetMinimal {
  status: string;
}

// In both files
import { AssetDetail } from '@/types/asset.types';
```

### 11.4 Magic Strings

**Bad**:
```typescript
function getAsset(type: string) {
  if (type === 'pipeline') {
    // ...
  }
}
```

**Good**:
```typescript
enum AssetCategory {
  PIPELINE = 'pipeline',
  BUILDING = 'building',
}

function getAsset(type: AssetCategory) {
  if (type === AssetCategory.PIPELINE) {
    // ...
  }
}
```

### 11.5 Complex Nested Types

**Bad**:
```typescript
interface Config {
  data: {
    user: {
      profile: {
        settings: {
          theme: {
            colors: {
              primary: string;
              secondary: string;
            };
          };
        };
      };
    };
  };
}
```

**Good**:
```typescript
interface ColorScheme {
  primary: string;
  secondary: string;
}

interface Theme {
  colors: ColorScheme;
}

interface Settings {
  theme: Theme;
}

interface Profile {
  settings: Settings;
}

interface UserData {
  profile: Profile;
}

interface Config {
  data: {
    user: UserData;
  };
}
```

---

## 12. Type Safety Checklist

### 12.1 Component Props Checklist
- [ ] All props have explicit types
- [ ] Optional props marked with `?`
- [ ] Props interface exported for reuse
- [ ] JSDoc comments for complex props
- [ ] Children properly typed (`ReactNode`)
- [ ] Event handlers use proper event types
- [ ] Generic components properly constrained
- [ ] `className?: string` for styling flexibility

### 12.2 Hook Return Types Checklist
- [ ] Return type explicitly defined or inferred
- [ ] Generic hooks properly typed
- [ ] Error types defined
- [ ] Loading states typed
- [ ] Data types match API contracts
- [ ] Optional returns handled (`| undefined`, `| null`)

### 12.3 API Type Checklist
- [ ] Request DTOs separate from domain types
- [ ] Response types wrapped in success/error types
- [ ] Error types structured with codes/messages
- [ ] Pagination types use consistent patterns
- [ ] Query parameters type-safe
- [ ] Path parameters validated

### 12.4 Domain Type Checklist
- [ ] Progressive loading (minimal/detail) where appropriate
- [ ] Enums for fixed value sets
- [ ] Discriminated unions for state
- [ ] Type aliases for semantic clarity
- [ ] Shared types in common location
- [ ] barrel exports for clean imports
- [ ] No circular type dependencies

### 12.5 Type Safety Best Practices
- [ ] No `any` types (use `unknown` with type guards)
- [ ] No type assertions without validation
- [ ] Strict null checks enabled
- [ ] Strict function types enabled
- [ ] No implicit any
- [ ] Strict property initialization
- [ ] No unused locals
- [ ] No unreachable code

---

## Summary

### Key Takeaways

1. **Organization**: Structure types by domain and feature, use barrel exports
2. **Interface vs Type**: Use interfaces for objects/shapes, types for unions/utilities
3. **Props Typing**: Export explicit interfaces, use JSDoc, handle children properly
4. **Hooks**: Return typed objects or use hook results directly
5. **Generics**: Use for reusable components with type constraints
6. **Utility Types**: Leverage `Partial`, `Pick`, `Omit`, `Record` appropriately
7. **API Types**: Separate DTOs from domain types, use pagination patterns
8. **Type Guards**: Use discriminated unions, custom guards, assertion functions
9. **Domain Design**: Progressive loading, enums for constants, clear hierarchies
10. **Avoid Anti-patterns**: No `any`, no duplicate definitions, flatten nested types

### Recommended Reading Order

1. Start with [Type Organization](#1-type-organization--structure)
2. Learn [Interface vs Type](#2-interface-vs-type-alias) patterns
3. Apply [Component Props Typing](#3-component-props-typing) in your components
4. Master [Type Narrowing](#8-type-narrowing--guards) for complex logic
5. Study [Real-World Examples](#10-real-world-examples) from the codebase
6. Use [Type Safety Checklist](#12-type-safety-checklist) for code review

---

**Document Version**: 1.0
**Last Updated**: 2025-01-27
**Maintainer**: Frontend Team
