# Services Layer - Patterns & Best Practices

## Table of Contents

1. [What Are Services?](#1-what-are-services)
2. [When to Create Services](#2-when-to-create-services)
3. [Service Categories](#3-service-categories)
4. [Service Organization & Structure](#4-service-organization--structure)
5. [Service Architecture Patterns](#5-service-architecture-patterns)
6. [API Service Patterns](#6-api-service-patterns)
7. [Business Logic Services](#7-business-logic-services)
8. [Integration Services](#8-integration-services)
9. [Real-time Services](#9-real-time-services)
10. [Testing Services](#10-testing-services)
11. [Real-World Examples](#11-real-world-examples)
12. [Anti-Patterns to Avoid](#12-anti-patterns-to-avoid)
13. [Service Checklist](#13-service-checklist)

---

## 1. What Are Services?

### Definition

A **service** is a reusable, standalone unit of business logic or infrastructure code that provides specific functionality to the application. Services are stateless or minimally stateful classes/functions that can be injected into components, hooks, or other services.

### Services vs Other Architectural Elements

| Aspect | Service | Component | Hook | Utility |
|--------|---------|-----------|------|----------|
| **Purpose** | Business logic, data operations, integrations | UI rendering, user interactions | React lifecycle, state management | Pure functions, helpers |
| **State** | Can have scoped state | Has React state | Can have React state | No state |
| **Lifecycle** | Manual creation/disposal | React lifecycle | React lifecycle | Stateless |
| **Dependencies** | Can inject other services | Can use hooks/services | Can use services | No dependencies |
| **Testability** | Easy (unit tests) | Requires React testing | Requires React testing | Easiest (pure functions) |
| **Example** | `KMLParserService`, `MissionService` | `MissionForm`, `AssetList` | `useMissionService`, `useAuth` | `formatDate()`, `calculateBearing()` |

### Key Characteristics of Services

1. **Single Responsibility**: Each service handles one specific concern
2. **Reusability**: Can be used across multiple components/features
3. **Testability**: Can be unit tested in isolation
4. **Dependency Injection**: Accept dependencies via constructor or parameters
5. **Explicit Lifecycle**: Clear initialization and disposal patterns
6. **State Management**: Minimal internal state, explicit when required

---

## 2. When to Create Services

### Create a Service When:

1. **Data Fetching/Operations**
   - API calls that need caching, transformation, or error handling
   - Complex data manipulation or transformation
   - Business rule validation
   - Example: `MissionService`, `PayloadService`

2. **Business Logic**
   - Complex calculations or algorithms
   - Multi-step operations with intermediate state
   - Domain-specific rules and validations
   - Example: `OrientationComputationService`, `TakeoffPathService`

3. **External Integration**
   - Third-party library integrations
   - File parsing/generation
   - Hardware/device communication
   - Example: `KMLParserService`, `JSBridgeService`, `ZipyAnalyticsService`

4. **Real-time Operations**
   - WebSocket connections
   - Video streaming
   - Event streaming
   - Example: `StreamingService`, `VVMTrackingService`, `EventService`

5. **Stateful Operations**
   - Maintaining session state
   - Managing connections
   - Tracking active operations
   - Example: `StreamingService` (platform instance), `VVMTrackingService` (active sessions)

### Use a Utility Function When:

- Pure input/output transformation
- Simple calculations without side effects
- Stateless helper functions
- Example: `calculateBearing()`, `formatCoordinates()`, `generateUuid()`

### Use a Hook When:

- Wrapping service for React consumption
- Managing React state or side effects
- Need to tie into component lifecycle
- Example: `useMissionService()`, `useZipyAnalytics()`

---

## 3. Service Categories

### 3.1 API Services

**Purpose**: Handle all HTTP/API operations for a specific domain or resource.

**Characteristics**:
- Wrapper around HTTP client (Axios/fetch)
- Type-safe request/response handling
- Error transformation and retry logic
- No business logic (just data transport)

**Examples**:
- `MissionService` - CRUD operations for missions
- `PayloadService` - Payload configuration API calls
- `SiteService` - Site/zone management API calls

### 3.2 Business Logic Services

**Purpose**: Encapsulate domain-specific business rules and calculations.

**Characteristics**:
- Pure or mostly pure functions
- Complex algorithmic logic
- Validation and rule enforcement
- State-free or read-only state

**Examples**:
- `OrientationComputationService` - Drone yaw calculations
- `TakeoffPathService` - Flight path generation
- `WaypointSchemaValidator` - Mission validation logic

### 3.3 Integration Services

**Purpose**: Bridge between the application and external libraries/systems.

**Characteristics**:
- Wraps third-party APIs
- Handles library-specific quirks
- Provides clean interface to rest of app
- May have lifecycle (init/dispose)

**Examples**:
- `KMLParserService` - KML file parsing
- `JSBridgeService` - DJI hardware integration
- `ZipyAnalyticsService` - Analytics tracking

### 3.4 Real-time Services

**Purpose**: Manage persistent connections and real-time data streams.

**Characteristics**:
- Connection lifecycle management
- Event emission/subscription
- Stateful (active connections)
- Cleanup on disposal

**Examples**:
- `StreamingService` - Video stream management
- `VVMTrackingService` - Video viewer minutes tracking
- `EventService` - Event bus for mission planner

### 3.5 Manager Services

**Purpose**: Coordinate multiple entities or complex UI interactions.

**Characteristics**:
- Manage collections of objects
- Handle inter-entity relationships
- Event coordination
- Lifecycle management

**Examples**:
- `MarkerService` - Mission marker lifecycle
- `AssetManager` - Asset collection management
- `AnnotationManager` - Map annotation management

---

## 4. Service Organization & Structure

### Folder Structure

```
apps/mission-planner/
├── api/
│   └── services/
│       ├── mission.ts              # Mission API service
│       ├── payload.ts              # Payload API service
│       └── site.ts                 # Site API service
├── validation/
│   └── services/
│       ├── WaypointSchemaValidator.ts
│       └── index.ts

apps/asset-management/
└── src/
    └── app/
        ├── features/
        │   └── kml-import/
        │       └── services/
        │           ├── kml-parser.service.ts
        │           └── index.ts
        └── shared/
            └── services/
                ├── AssetCoordinateService.ts
                ├── AssetDisplayService.ts
                └── index.ts

libs/shared/
├── map/src/
│   └── private/
│       ├── feature-entities/missions/
│       │   ├── linear-mission/services/
│       │   │   ├── marker-service.ts
│       │   │   ├── orientation-computation.service.ts
│       │   │   └── state-service.ts
│       │   └── shared/services/
│       │       ├── takeoff-path.service.ts
│       │       ├── event-service.ts
│       │       └── debug-service.ts
│       └── map-providers/cesium/services/
│           ├── cesium-map-service.ts
│           └── map-tile-provider-factory.service.ts
├── video-streaming/src/
│   └── services/
│       ├── streaming.service.ts
│       └── vvm-tracking.service.ts
└── analytics/src/
    └── zipy-analytics-service.ts
```

### Naming Conventions

1. **Service Files**
   - Use `.service.ts` suffix for integration/business logic services
   - Use just `.ts` for simple API service factories
   - Example: `kml-parser.service.ts`, `orientation-computation.service.ts`

2. **Service Classes**
   - Use `Service` suffix for classes
   - Example: `KMLParserService`, `StreamingService`, `MarkerService`

3. **Service Factories**
   - Use `create{ServiceName}` prefix
   - Example: `createMissionService(httpClient)`

4. **Service Hooks**
   - Use `use{ServiceName}` prefix
   - Example: `useMissionService()`, `useZipyAnalytics()`

5. **Service Instances**
   - Export singleton instances with `camelCase`
   - Example: `analyticsService`, `kmlParserService`

---

## 5. Service Architecture Patterns

### 5.1 Service Composition

Services can compose other services to create higher-level functionality.

**Example**: `StreamingService` composing `VVMTrackingService`

```typescript
export class StreamingService {
  private vvmService: VVMTrackingService | null = null;

  constructor(private socketStore?: any) {
    // Optional composition
    if (isVVMEnabled() && this.socketStore) {
      this.vvmService = new VVMTrackingService(vvmConfig, this.socketStore);
    }
  }

  async requestStream(deviceId: string, streamId: string): Promise<void> {
    await this.platform.subscribeToStream();

    // Delegate to composed service
    if (this.vvmService) {
      await this.vvmService.startStreamMonitoring(params);
    }
  }
}
```

**Guidelines**:
- Compose, don't inherit (prefer composition over inheritance)
- Pass dependencies via constructor
- Make composition optional (nullable) for flexibility
- Clear ownership of lifecycle (parent disposes child)

### 5.2 Service Factories

Factory pattern creates service instances with injected dependencies.

**Example**: API Service Factory

```typescript
export const createMissionService = (httpClient: AxiosInstance) => ({
  getMissionsList: async (): Promise<IMissionLite[]> => {
    const response = await httpClient.get(API_ENDPOINTS.MISSION.LIST);
    return response.data;
  },

  getMission: async (id: string): Promise<IMission> => {
    const response = await httpClient.get(API_ENDPOINTS.MISSION.GET(id));
    return response.data;
  },

  // ... more methods
});

// Hook for React integration
export const useMissionService = () => {
  const httpClient = useHttp();
  return createMissionService(httpClient);
};
```

**Benefits**:
- Easy testing (mock HTTP client)
- Type-safe dependency injection
- React-friendly via hooks
- Singleton per HTTP client instance

### 5.3 Singleton Pattern

For stateless or globally stateful services, export a singleton instance.

**Example**: Analytics Service

```typescript
class ZipyAnalyticsService {
  init(apiKey?: string) {
    if (apiKey) {
      zipy.init(apiKey);
    }
  }

  setUser(userDetails: UserDetails, apiKey?: string) {
    this.init(apiKey);
    zipy.identify(userId, additionalDetails);
  }
}

// Singleton export
export const analyticsService = new ZipyAnalyticsService();
```

**When to Use**:
- Global configuration needed
- Third-party library with global state
- Logging, analytics, monitoring
- No concurrent access issues

**When to Avoid**:
- Service holds per-request state
- Need multiple instances with different configs
- Testing isolation required

### 5.4 Service Lifecycle Management

Services with resources need explicit lifecycle management.

**Example**: StreamingService Lifecycle

```typescript
export class StreamingService {
  private platform: StreamingPlatform | null = null;
  private initialized = false;

  async requestStream(deviceId: string, streamId: string): Promise<void> {
    // Cleanup previous state if exists
    if (this.initialized && this.platform) {
      await this.releaseStream();
    }

    // Initialize new stream
    await this.initializePlatform(provider, streamConfig);
    await this.platform.subscribeToStream();
  }

  async releaseStream(): Promise<void> {
    if (!this.platform || !this.initialized) return;

    // Cleanup stream but keep platform for reuse
    await this.platform.unsubscribeFromStream();
    this.currentDeviceId = '';
    this.currentStreamId = '';
  }

  async dispose(): Promise<void> {
    // Full cleanup including platform
    if (this.platform) {
      await this.platform.dispose();
      this.platform = null;
      this.initialized = false;
    }
  }
}
```

**Lifecycle States**:
1. **Created** - Constructor called, dependencies injected
2. **Initialized** - Resources allocated, connections made
3. **Active** - Processing requests, emitting events
4. **Released** - Temporary cleanup, reusable
5. **Disposed** - Full cleanup, not reusable

### 5.5 Pure Functions vs Classes

**Use Pure Functions When**:
- No state required
- Simple input/output
- Easy to test
- Example: `TakeoffPathService`, `WaypointSchemaValidator`

**Example**: Pure Function Service

```typescript
export class WaypointSchemaValidator {
  static validateWaypoint(waypoint: unknown): SchemaValidationSummary {
    try {
      WaypointSchema.parse(waypoint);
      return { isValid: true, errors: [], /* ... */ };
    } catch (error) {
      return { isValid: false, errors: transformErrors(error), /* ... */ };
    }
  }
}

// Usage - no instantiation needed
const result = WaypointSchemaValidator.validateWaypoint(data);
```

**Use Classes When**:
- State needed (connections, sessions)
- Multiple related methods
- Configuration required
- Event handling needed
- Example: `StreamingService`, `VVMTrackingService`

**Example**: Stateful Service

```typescript
export class StreamingService {
  private platform: StreamingPlatform | null = null;
  private currentDeviceId = '';
  private currentStreamId = '';

  constructor(private socketStore?: any) {
    // Initialization
  }

  async requestStream(deviceId: string, streamId: string): Promise<void> {
    // Uses and updates internal state
    this.currentDeviceId = deviceId;
    this.currentStreamId = streamId;
    // ...
  }
}

// Usage - requires instantiation
const service = new StreamingService(socketStore);
await service.requestStream(deviceId, streamId);
```

---

## 6. API Service Patterns

### 6.1 Service Factory Pattern

**Best Practice**: Use factory functions for API services with HTTP client injection.

```typescript
export const createMissionService = (httpClient: AxiosInstance) => ({
  getMissionsList: async (): Promise<IMissionLite[]> => {
    const response = await httpClient.get(API_ENDPOINTS.MISSION.LIST);
    return response.data;
  },

  getMission: async (id: string): Promise<IMission> => {
    const response = await httpClient.get(API_ENDPOINTS.MISSION.GET(id));
    return response.data;
  },

  createMission: async (data: Omit<IMission, 'id'>): Promise<IMission> => {
    const response = await httpClient.post(API_ENDPOINTS.MISSION.CREATE, data);
    return response.data;
  },
});

// Hook for React components
export const useMissionService = () => {
  const httpClient = useHttp();
  return createMissionService(httpClient);
};
```

### 6.2 Error Handling

**Pattern**: Centralized error handling with HTTP interceptor.

```typescript
deleteMission: async (id: string): Promise<SuccessResponse> => {
  try {
    const response = await httpClient.delete(API_ENDPOINTS.MISSION.DELETE(id));
    return response.data;
  } catch (error) {
    // Add domain-specific error handling
    if (error.status === 409) {
      throw new Error('Cannot delete mission: mission is in use');
    }
    throw error;
  }
}
```

### 6.3 Request Transformation

```typescript
createMission: async (data: Omit<IMission, 'id'>): Promise<IMission> => {
  // Process data before sending
  const processedData = transformMissionData(data);
  const response = await httpClient.post(API_ENDPOINTS.MISSION.CREATE, processedData);
  return response.data;
}
```

### 6.4 Multipart File Upload

```typescript
importKmz: async (file: File): Promise<KmzImportResponse> => {
  const formData = new FormData();
  formData.append('kmzFile', file);

  const response = await httpClient.post(API_ENDPOINTS.MISSION.KMZ_IMPORT, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000,
  });
  return response.data;
}
```

---

## 7. Business Logic Services

### 7.1 Validation Services

**Example**: `WaypointSchemaValidator`

```typescript
export class WaypointSchemaValidator {
  /**
   * Validate clipboard data with per-waypoint validation results
   */
  static validateClipboardDataPerWaypoint(data: unknown): ClipboardValidationResult {
    // Validate structure
    const clipboardData = this.validateStructure(data);
    if (!clipboardData) return emptyResult();

    // Validate each waypoint individually
    const results = clipboardData.waypoints.map((waypoint, index) =>
      this.validateWaypoint(waypoint, index)
    );

    return buildSummary(results);
  }

  private static validateWaypoint(waypoint: unknown, index: number): WaypointValidationResult {
    try {
      MissionSequenceItemSchema.parse(waypoint);
      return { waypointIndex: index, isValid: true, errors: [] };
    } catch (error) {
      return { waypointIndex: index, isValid: false, errors: transformErrors(error) };
    }
  }
}
```

**Key Patterns**:
- Static methods for stateless validation
- Return structured error information
- Support both full and partial validation
- Type-safe with Zod schemas

### 7.2 Calculation Services

**Example**: `OrientationComputationService`

```typescript
export class OrientationComputationService {
  constructor(private readonly _debugService: DebugService) {}

  /**
   * Computes device yaw considering waypoint actions, route settings, and trajectory
   */
  public computeDeviceYaw(
    waypointIndex: number,
    waypointsData: WaypointData[],
    referencePoint: IPosition,
    routeDeviceYawMode: DeviceYawRouteSettingsMode
  ): number {
    // Validate inputs
    if (!this.isValidIndex(waypointIndex, waypointsData)) {
      this._debugService.warn(`Invalid waypoint index: ${waypointIndex}`);
      return 0;
    }

    // Compute with approach settings
    const effectiveYaw = this._computeWithApproachSettings(/* params */);
    return this._normalizeYaw(effectiveYaw);
  }

  // Private helpers
  private _computeWithApproachSettings(/* ... */): number { /* ... */ }
  private _normalizeYaw(yaw: number): number { /* ... */ }
}
```

**Key Patterns**:
- Inject dependencies via constructor
- Public API for main operations
- Private methods for implementation details
- Defensive programming

### 7.3 Path Generation Services

**Example**: `TakeoffPathService`

```typescript
export class TakeoffPathService implements ITakeoffPathService {
  /**
   * Generates flight path from reference to first waypoint
   * Implements six different flight path scenarios
   */
  public generateTakeoffPath(
    referencePoint: IPosition,
    firstWaypoint: IPosition,
    takeoffMode: TakeoffMode,
    takeoffAltitude: number
  ): IPosition[] {
    // Determine scenario based on mode and altitudes
    if (takeoffMode === TakeoffMode.DIRECT_ASCENT) {
      return this.generateDirectAscentScenario(/* params */);
    } else {
      return this.generateSafeTakeoffScenario(/* params */);
    }
  }

  // Private scenario implementations
  private _generateDirectAscentPath(/* ... */): IPosition[] { /* ... */ }
  private _generateAscentOvershootPath(/* ... */): IPosition[] { /* ... */ }
}
```

**Key Patterns**:
- Interface-based design
- Strategy pattern (different scenarios)
- Pure functions (no state)
- Well-documented scenarios

---

## 8. Integration Services

### 8.1 File Parsing Services

**Example**: `KMLParserService`

```typescript
export class KMLParserService {
  private readonly MAX_FILE_SIZE = FILE_LIMITS.WARNING_THRESHOLD;

  async parseKMLFile(file: File): Promise<ParsedKMLData> {
    const errors: KMLParsingError[] = [];

    try {
      // 1. Validate file size
      if (file.size > this.MAX_FILE_SIZE) {
        throw new Error(`File size exceeds maximum`);
      }

      // 2. Read and sanitize content
      const content = await this.readFileContent(file);
      const sanitizedContent = this.sanitizeContent(content);

      // 3. Parse XML and convert to GeoJSON
      const xmlDoc = new DOMParser().parseFromString(sanitizedContent, 'text/xml');
      const rootData = kmlWithFolders(xmlDoc);

      // 4. Process hierarchical data
      const assets: ProcessedAsset[] = [];
      const assetGroups: ProcessedAssetGroup[] = [];
      this.processChildren(rootData.children, assets, assetGroups, file, undefined);

      return { assets, assetGroups, errors, metadata: this.buildMetadata(file, assets, errors) };
    } catch (error) {
      return this.buildErrorResponse(error, file);
    }
  }

  private sanitizeContent(content: string): string {
    return content
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<!ENTITY[^>]*>/gi, '')
      .replace(/&[^;]*;/g, '');
  }

  // Private helpers
  private async readFileContent(file: File): Promise<string> { /* ... */ }
  private processChildren(/* ... */): void { /* ... */ }
  private createAssetFromFeature(/* ... */): ProcessedAsset | null { /* ... */ }
}

// Singleton export
export const kmlParserService = new KMLParserService();
```

**Key Patterns**:
- Singleton instance (stateless)
- Security sanitization
- Comprehensive error collection
- Hierarchical data processing

### 8.2 Hardware Integration Services

**Example**: `JSBridgeService`

```typescript
export class JSBridgeService implements IJSBridgeService {
  private initialized = false;
  private connectionState = ConnectionState.DISCONNECTED;

  async initialize(config: JSBridgeConfig): Promise<boolean> {
    if (this.initialized) return true;

    // Check if DJI JSBridge is available
    if (!window.djiBridge) {
      console.error('DJI JSBridge not available');
      return false;
    }

    // Validate license with DJI
    const licenseValid = window.djiBridge.platformVerifyLicense(
      config.appId,
      config.appKey,
      config.license
    );

    this.initialized = licenseValid;
    return licenseValid;
  }

  async detectDevices(): Promise<DeviceDetectionResult> {
    if (!this.initialized) {
      throw new Error('JSBridge not initialized');
    }

    // Query device info via DJI bridge
    const rcResponse = await this.queryDevice('platformGetRemoteControllerSN');
    const aircraftResponse = await this.queryDevice('platformGetAircraftSN');

    return {
      rcState: this.validateResponse(rcResponse) ? DeviceDetectionState.DETECTED : DeviceDetectionState.ERROR,
      droneState: this.validateResponse(aircraftResponse) ? DeviceDetectionState.DETECTED : DeviceDetectionState.ERROR,
    };
  }
}
```

**Key Patterns**:
- Interface implementation
- Async initialization with validation
- State tracking
- Global window object access
- Promise-based async operations

---

## 9. Real-time Services

### 9.1 Video Streaming Services

**Example**: `StreamingService`

```typescript
export class StreamingService {
  private platform: StreamingPlatform | null = null;
  private vvmService: VVMTrackingService | null = null;

  constructor(private socketStore?: any) {
    // Initialize VVM service if enabled
    if (isVVMEnabled() && this.socketStore) {
      this.vvmService = new VVMTrackingService(vvmConfig, this.socketStore);
    }
  }

  async requestStream(
    deviceId: string,
    streamId: string,
    elementId?: string,
    statusCallback?: (status: StreamStatus) => void,
    errorCallback?: (error: StreamError) => void
  ): Promise<void> {
    try {
      // Release previous stream if active
      if (this.initialized && this.platform) {
        await this.releaseStream();
      }

      // Get backend configuration
      const backendConfig = await this.getStreamConfig(deviceId, streamId);

      // Initialize platform
      await this.initializePlatform(backendConfig.provider, streamConfig);

      // Register callbacks
      if (statusCallback) this.platform!.on('status', statusCallback);
      if (errorCallback) this.platform!.on('error', errorCallback);

      // Subscribe to stream
      await this.platform!.subscribeToStream();
    } catch (error) {
      // Cleanup on error
      this.cleanup();
      throw error;
    }
  }

  async releaseStream(): Promise<void> {
    if (!this.platform || !this.initialized) return;

    try {
      await this.platform.unsubscribeFromStream();
    } catch (error) {
      console.error(`Failed to release stream`, error);
    }
  }

  async dispose(): Promise<void> {
    // Cleanup VVM service
    this.vvmService?.dispose();

    // Cleanup platform
    if (this.platform) {
      await this.platform.dispose();
      this.platform = null;
      this.initialized = false;
    }
  }
}
```

**Key Patterns**:
- Composition (VVM service)
- Platform abstraction (Agora, Millicast, MediaMTX)
- Explicit lifecycle (request/release/dispose)
- Error resilience (cleanup on error)
- Stateful (current device/stream IDs)

### 9.2 WebSocket Tracking Services

**Example**: `VVMTrackingService`

```typescript
export class VVMTrackingService {
  private activeSessions: Map<VVMStreamKey, VVMStreamSession> = new Map();
  private pingIntervals: Map<VVMStreamKey, NodeJS.Timeout> = new Map();
  private socketEventCleanup: (() => void)[] = [];

  constructor(config: VVMConfig, private socketStore: SocketState) {
    this.setupSocketEventListeners();
  }

  private setupSocketEventListeners(): void {
    // Register disconnect/reconnect handlers
    this.socketEventCleanup.push(
      this.socketStore.onDisconnect((reason) => this.handleSocketDisconnect(reason)),
      this.socketStore.onReconnect((attempt) => this.handleSocketReconnect(attempt))
    );
  }

  async startStreamMonitoring(params: VVMStreamParams): Promise<void> {
    const sessionKey = this.createSessionKey(streamId, deviceId);

    // Create and store session
    const session: VVMStreamSession = {
      streamId, deviceId, screenType: params.screenType,
      startTime: Date.now(), isActive: true,
    };
    this.activeSessions.set(sessionKey, session);

    // Emit start event via socket
    this.socketStore.emit(VVM_SOCKET_EVENTS.START_MONITORING_STREAM, payload);

    // Start ping interval
    this.startVideoPing(streamId, deviceId);
  }

  async stopStreamMonitoring(streamId: string, deviceId: string): Promise<void> {
    const sessionKey = this.createSessionKey(streamId, deviceId);
    const session = this.activeSessions.get(sessionKey);

    if (!session) return;

    // Emit stop event
    this.socketStore.emit(VVM_SOCKET_EVENTS.STOP_MONITORING_STREAM, payload);

    // Stop ping interval and remove session
    this.stopVideoPing(sessionKey);
    this.activeSessions.delete(sessionKey);
  }

  handleSocketDisconnect(): void {
    // Stop all pings and mark sessions inactive
    this.pingIntervals.forEach((interval) => clearInterval(interval));
    this.pingIntervals.clear();
    this.activeSessions.forEach((session) => { session.isActive = false; });
  }

  handleSocketReconnect(): void {
    // Restart monitoring for inactive sessions
    this.activeSessions.forEach((session) => {
      if (!session.isActive) {
        session.isActive = true;
        this.startVideoPing(session.streamId, session.deviceId);
        this.socketStore.emit(VVM_SOCKET_EVENTS.START_MONITORING_STREAM, payload);
      }
    });
  }

  dispose(): void {
    // Cleanup all listeners and intervals
    this.socketEventCleanup.forEach((cleanup) => cleanup());
    this.pingIntervals.forEach((interval) => clearInterval(interval));
    this.activeSessions.clear();
  }
}
```

**Key Patterns**:
- Session management with Map
- Socket event cleanup tracking
- Automatic reconnection handling
- Interval-based keep-alive pings
- Graceful error handling in disposal

### 9.3 Event Bus Services

**Example**: `EventService`

```typescript
export class EventService<TEventType extends string = string, TEventData = unknown> {
  private _eventCallbacks: Map<TEventType, Map<(data: TEventData) => void, (event: IEvent) => void>> = new Map();

  constructor(
    private readonly _compositeManager: ICompositeManager,
    private readonly id: string
  ) {
    this._eventEmitter = new MapEventEmitter();
  }

  public emitEvent(eventType: TEventType, data: Partial<TEventData>): void {
    this._eventEmitter.emit({ type: eventType, id: this.id, data });
  }

  public onEvent(eventType: TEventType, callback: (data: TEventData) => void): void {
    // Create wrapper for cleanup
    const wrapper = (event: IEvent) => {
      if (event?.data) callback(event.data as TEventData);
    };

    // Store wrapper
    let callbacksForEvent = this._eventCallbacks.get(eventType);
    if (!callbacksForEvent) {
      callbacksForEvent = new Map();
      this._eventCallbacks.set(eventType, callbacksForEvent);
    }
    callbacksForEvent.set(callback, wrapper);

    this._eventEmitter.addListener(eventType, wrapper);
  }

  public offEvent(eventType: TEventType, callback: (data: TEventData) => void): void {
    const callbacksForEvent = this._eventCallbacks.get(eventType);
    const wrapper = callbacksForEvent?.get(callback);

    if (wrapper) {
      this._eventEmitter.removeListener(eventType, wrapper);
      callbacksForEvent.delete(callback);
    }
  }

  public dispose(): void {
    this._eventCallbacks.clear();
  }
}
```

**Key Patterns**:
- Generic TypeScript for type safety
- Wrapper function tracking for cleanup
- Map-based callback storage
- Automatic cleanup on disposal

---

## 10. Testing Services

### 10.1 Testing Pure Function Services

**Example**: Testing `WaypointSchemaValidator`

```typescript
describe('WaypointSchemaValidator', () => {
  describe('validateWaypoint', () => {
    it('should validate a correct waypoint', () => {
      const validWaypoint = { position: { latitude: 37.7749, longitude: -122.4194, altitude: 100 } };
      const result = WaypointSchemaValidator.validateWaypoint(validWaypoint);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid waypoint', () => {
      const invalidWaypoint = { position: { latitude: 'invalid', longitude: -122.4194 } };
      const result = WaypointSchemaValidator.validateWaypoint(invalidWaypoint);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateClipboardDataPerWaypoint', () => {
    it('should allow partial imports with some invalid waypoints', () => {
      const clipboardData = {
        waypoints: [validWaypoint1, invalidWaypoint, validWaypoint2],
      };

      const result = WaypointSchemaValidator.validateClipboardDataPerWaypoint(clipboardData);

      expect(result.summary.total).toBe(3);
      expect(result.summary.valid).toBe(2);
      expect(result.summary.invalid).toBe(1);
    });
  });
});
```

### 10.2 Testing Stateful Services

**Example**: Testing `StreamingService`

```typescript
describe('StreamingService', () => {
  let service: StreamingService;
  let mockSocketStore: any;

  beforeEach(() => {
    mockSocketStore = { isConnected: true, emit: jest.fn() };
    service = new StreamingService(mockSocketStore);
  });

  afterEach(async () => {
    await service.dispose();
  });

  it('should request a new stream successfully', async () => {
    await service.requestStream('device-123', 'stream-456');
    expect(service.getCurrentBackendConfig()).not.toBeNull();
  });

  it('should release previous stream before requesting new one', async () => {
    const releaseSpy = jest.spyOn(service, 'releaseStream');

    await service.requestStream('device-123', 'stream-456');
    await service.requestStream('device-789', 'stream-012');

    expect(releaseSpy).toHaveBeenCalled();
  });

  it('should cleanup all resources on dispose', async () => {
    await service.requestStream('device-123', 'stream-456');
    await service.dispose();

    expect(service.getCurrentBackendConfig()).toBeNull();
  });
});
```

### 10.3 Testing Services with Dependencies

**Example**: Testing `OrientationComputationService`

```typescript
describe('OrientationComputationService', () => {
  let service: OrientationComputationService;
  let mockDebugService: any;

  beforeEach(() => {
    mockDebugService = { log: jest.fn(), warn: jest.fn() };
    service = new OrientationComputationService(mockDebugService);
  });

  it('should compute yaw for ALONG_ROUTE mode', () => {
    const waypointsData = [
      { position: { latitude: 37.7749, longitude: -122.4194, altitude: 100 } },
      { position: { latitude: 37.7750, longitude: -122.4195, altitude: 100 } },
    ];

    const yaw = service.computeDeviceYaw(0, waypointsData, referencePoint, 'ALONG_ROUTE');

    expect(typeof yaw).toBe('number');
    expect(yaw).toBeGreaterThanOrEqual(-180);
    expect(yaw).toBeLessThanOrEqual(180);
  });

  it('should handle invalid waypoint index', () => {
    const yaw = service.computeDeviceYaw(-1, [], null, 'ALONG_ROUTE');

    expect(yaw).toBe(0);
    expect(mockDebugService.warn).toHaveBeenCalledWith('Invalid waypoint index: -1');
  });
});
```

### Testing Best Practices

1. **Isolation**: Mock external dependencies (HTTP clients, socket stores, etc.)
2. **Lifecycle**: Use `beforeEach`/`afterEach` for setup/teardown
3. **State**: Test state transitions and lifecycle methods
4. **Errors**: Test error handling and cleanup paths
5. **Async**: Use proper async/await and error assertions
6. **Spies**: Use jest spies to verify method calls and interactions

---

## 11. Real-World Examples

### 11.1 KMLParserService Structure

**Purpose**: Parse KML/KMZ files with security validation and hierarchical processing

```typescript
export class KMLParserService {
  private readonly MAX_FILE_SIZE = FILE_LIMITS.WARNING_THRESHOLD;

  async parseKMLFile(file: File): Promise<ParsedKMLData> {
    const errors: KMLParsingError[] = [];

    try {
      // Validate file size
      if (file.size > this.MAX_FILE_SIZE) {
        throw new Error(`File size exceeds maximum`);
      }

      // Read, sanitize, and parse
      const content = await this.readFileContent(file);
      const sanitizedContent = this.sanitizeContent(content);
      const xmlDoc = new DOMParser().parseFromString(sanitizedContent, 'text/xml');

      // Convert to GeoJSON and process
      const rootData = kmlWithFolders(xmlDoc);
      const assets: ProcessedAsset[] = [];
      const assetGroups: ProcessedAssetGroup[] = [];

      this.processChildren(rootData.children, assets, assetGroups, file, undefined);

      return { assets, assetGroups, errors, metadata: this.buildMetadata(file, assets, errors) };
    } catch (error) {
      return this.buildErrorResponse(error, file);
    }
  }

  // Private helpers
  private sanitizeContent(content: string): string { /* Remove DOCTYPE, ENTITY, etc. */ }
  private processChildren(/* ... */): void { /* Recursive hierarchical processing */ }
  private createAssetFromFeature(/* ... */): ProcessedAsset | null { /* Type-safe conversion */ }
}

export const kmlParserService = new KMLParserService();
```

**Key Patterns**:
- Singleton instance
- Security sanitization (XXE prevention)
- Type guards for runtime validation
- Error accumulation (partial success)

### 11.2 MarkerService Structure

**Purpose**: Manage map markers with event handling and lifecycle

```typescript
export class MarkerService {
  private _waypointMarkers: IFBMarker[] = [];
  private _eventListeners: Map<string, (event: IEvent) => void> = new Map();

  constructor(private readonly _compositeManager: ICompositeManager) {}

  public createWaypointMarker(id: string, position: IPosition, index: number): IFBMarker {
    const markerOptions = { /* marker config */ };
    const marker = this._compositeManager.createFBMarker(markerOptions);

    // Set up event handlers
    this._setupMarkerEventHandlers(marker, marker.id);

    // Store marker
    this._waypointMarkers.push(marker);

    return marker;
  }

  private _setupMarkerEventHandlers(marker: IFBMarker, id: string): void {
    const posListener = (event: IEvent) => this._handlePositionChange(event);
    const clickListener = (event: IEvent) => this._handleClick(event);

    // Store listeners for cleanup
    this._eventListeners.set(`${id}-position`, posListener);
    this._eventListeners.set(`${id}-click`, clickListener);

    marker.getEventEmitter().addListener(IEventType.POSITION_CHANGED, posListener);
    marker.getEventEmitter().addListener(IEventType.CLICK, clickListener);
  }

  public cleanupEntities(): void {
    // Cleanup all markers and listeners
    for (const marker of this._waypointMarkers) {
      this._eventListeners.delete(`${marker.id}-position`);
      this._eventListeners.delete(`${marker.id}-click`);
      marker.remove();
    }
    this._waypointMarkers = [];
    this._eventListeners.clear();
  }
}
```

**Key Patterns**:
- Event listener tracking for cleanup
- Manual lifecycle management
- Map-based cleanup tracking

---

## 12. Anti-Patterns to Avoid

### 12.1 God Service

**Anti-Pattern**: One service doing too many things.

```typescript
// BAD: GodService
class GodService {
  // API calls
  getMission() { /* ... */ }
  createMission() { /* ... */ }

  // Parsing
  parseKML() { /* ... */ }

  // Validation
  validateWaypoint() { /* ... */ }

  // Calculations
  computeOrientation() { /* ... */ }
  computePath() { /* ... */ }

  // State management
  activeMission: Mission | null = null;
  selectedWaypoint: number | null = null;
}
```

**Solution**: Split into focused services.

```typescript
// GOOD: Focused services
class MissionService { /* API only */ }
class KMLParserService { /* Parsing only */ }
class WaypointSchemaValidator { /* Validation only */ }
class OrientationComputationService { /* Calculations only */ }
class MissionStore { /* State management */ }
```

### 12.2 Tight Coupling

**Anti-Pattern**: Service directly coupled to specific implementations.

```typescript
// BAD: Tightly coupled
class BadService {
  async doSomething() {
    // Directly using global axios instance
    const response = await axios.get('/api/endpoint');

    // Directly using global store
    const data = useMissionStore.getState().data;

    // Directly using specific map implementation
    const viewer = (window as any).cesiumViewer;
  }
}
```

**Solution**: Inject dependencies.

```typescript
// GOOD: Dependency injection
class GoodService {
  constructor(
    private httpClient: AxiosInstance,
    private missionStore: MissionStore,
    private mapService: IMapService
  ) {}

  async doSomething() {
    const response = await this.httpClient.get('/api/endpoint');
    const data = this.missionStore.getData();
    const viewer = this.mapService.getViewer();
  }
}
```

### 12.3 Hidden State

**Anti-Pattern**: Service state that's not visible or manageable.

```typescript
// BAD: Hidden global state
class BadService {
  private cache = new Map(); // Never cleared

  async getData(id: string) {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }
    const data = await fetchData(id);
    this.cache.set(id, data);
    return data;
  }
  // No way to clear cache or control size
}
```

**Solution**: Explicit state management.

```typescript
// GOOD: Explicit state with lifecycle
class GoodService {
  private cache = new Map();
  private maxCacheSize = 100;

  async getData(id: string) {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }
    const data = await fetchData(id);
    this.setCached(id, data);
    return data;
  }

  private setCached(id: string, data: any) {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(id, data);
  }

  clearCache() {
    this.cache.clear();
  }
}
```

### 12.4 No Cleanup

**Anti-Pattern**: Services that don't clean up resources.

```typescript
// BAD: No cleanup
class BadService {
  async startMonitoring() {
    this.interval = setInterval(() => {
      // Do something
    }, 1000);

    this.socket.on('event', this.handleEvent);
    // No cleanup - intervals and listeners accumulate
  }
}
```

**Solution**: Implement dispose pattern.

```typescript
// GOOD: Proper cleanup
class GoodService {
  private intervals: NodeJS.Timeout[] = [];
  private socketCleanup: (() => void)[] = [];

  async startMonitoring() {
    const interval = setInterval(() => {
      // Do something
    }, 1000);
    this.intervals.push(interval);

    const cleanup = this.socket.on('event', this.handleEvent);
    this.socketCleanup.push(cleanup);
  }

  dispose() {
    this.intervals.forEach(clearInterval);
    this.intervals = [];

    this.socketCleanup.forEach(cleanup => cleanup());
    this.socketCleanup = [];
  }
}
```

### 12.5 Mixed Responsibilities

**Anti-Pattern**: Service mixing UI and business logic.

```typescript
// BAD: UI logic in service
class BadService {
  updateMarker(index: number) {
    // DOM manipulation in service!
    const element = document.getElementById(`marker-${index}`);
    element.style.backgroundColor = 'red';
    element.classList.add('selected');
  }
}
```

**Solution**: Keep services UI-agnostic.

```typescript
// GOOD: Service returns state, component handles UI
class GoodService {
  updateMarkerState(index: number): MarkerState {
    return {
      index,
      selected: true,
      color: 'red',
    };
  }
}

// Component handles UI
function MarkerComponent({ index }) {
  const service = useMarkerService();
  const [state, setState] = useState();

  const handleClick = () => {
    const newState = service.updateMarkerState(index);
    setState(newState);
  };

  return <div style={{ backgroundColor: state?.color }} className={state?.selected ? 'selected' : ''} />;
}
```

---

## 13. Service Checklist

Use this checklist when creating or reviewing services:

### Design & Structure

- [ ] **Single Responsibility**: Service has one clear purpose
- [ ] **Interface First**: Define interfaces/contracts before implementation
- [ ] **Dependency Injection**: Dependencies passed via constructor/parameters
- [ ] **Naming**: Uses clear, descriptive names with `Service` suffix
- [ ] **Location**: Placed in appropriate `services/` directory

### State Management

- [ ] **Minimal State**: Only stores state absolutely necessary
- [ ] **State Visibility**: State is observable or accessible via getters
- [ ] **Immutability**: State updates don't mutate external objects
- [ ] **Thread Safety**: No race conditions in async operations

### Lifecycle Management

- [ ] **Initialization**: Clear init method or constructor logic
- [ ] **Disposal**: Implements `dispose()` or `cleanup()` method
- [ ] **Resource Cleanup**: Clears intervals, listeners, connections
- [ ] **Error Recovery**: Graceful handling of failures
- [ ] **Idempotency**: Can be initialized/disposed multiple times safely

### Error Handling

- [ ] **Input Validation**: Validates parameters before processing
- [ ] **Error Transformation**: Converts errors to domain-specific types
- [ ] **Error Logging**: Logs errors with context
- [ ] **Graceful Degradation**: Fallback behavior for non-critical failures
- [ ] **Error Propagation**: Errors bubble up appropriately

### API Design

- [ ] **Clear Public API**: Public methods are well-documented
- [ ] **Private Implementation**: Internal details marked private
- [ ] **Type Safety**: Proper TypeScript types for all inputs/outputs
- [ ] **Consistent Patterns**: Similar operations follow same pattern
- [ ] **Return Types**: Clear, specific return types (not `any`)

### Testing

- [ ] **Unit Testable**: Can be tested without React/UI
- [ ] **Mockable**: Dependencies can be mocked
- [ ] **Test Coverage**: Critical paths have tests
- [ ] **Edge Cases**: Handles boundary conditions
- [ ] **Error Paths**: Tests error scenarios

### Documentation

- [ ] **JSDoc Comments**: Public methods have JSDoc
- [ ] **Usage Examples**: Examples in comments or separate docs
- [ ] **Complex Logic**: Detailed comments for algorithms
- [ ] **Parameters**: All parameters documented
- [ ] **Return Values**: Return values documented

### Performance

- [ ] **No Memory Leaks**: Cleanup prevents memory leaks
- [ ] **Efficient Algorithms**: Appropriate complexity for operations
- [ ] **Caching**: Expensive operations cached appropriately
- [ ] **Lazy Loading**: Resources loaded only when needed
- [ ] **Debouncing**: Rapid operations debounced/throttled

### Integration

- [ ] **React Integration**: Provides hook for React components
- [ ] **Store Integration**: Integrates with state stores appropriately
- [ ] **Event System**: Emits events for important state changes
- [ ] **Composition**: Can be composed with other services
- [ ] **Configuration**: Configurable without code changes

---

## Appendix: Quick Reference

### Service Template

```typescript
/**
 * Brief description of service purpose
 */
export class ExampleService implements IExampleService {
  private _internalState: Map<string, any> = new Map();
  private _initialized = false;

  constructor(
    private readonly dependency: DependencyType,
    private readonly options?: ServiceOptions
  ) {}

  /**
   * Initialize the service
   */
  public async initialize(): Promise<void> {
    if (this._initialized) return;
    // Initialization logic
    this._initialized = true;
  }

  /**
   * Main operation
   */
  public async performOperation(input: InputType): Promise<OutputType> {
    if (!this._initialized) throw new Error('Service not initialized');
    if (!this.isValidInput(input)) throw new Error('Invalid input');

    return await this.processInput(input);
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this._internalState.clear();
    this._initialized = false;
  }

  // Private helpers
  private isValidInput(input: InputType): boolean { /* ... */ }
  private async processInput(input: InputType): Promise<OutputType> { /* ... */ }
}
```

### Service Factory Template

```typescript
export const createExampleService = (
  dependency: DependencyType,
  options?: ServiceOptions
) => ({
  async operation(input: InputType): Promise<OutputType> {
    // Implementation
    return {} as OutputType;
  },
});

// React hook
export const useExampleService = () => {
  const dependency = useDependency();
  return useMemo(() => createExampleService(dependency), [dependency]);
};
```

---

## Conclusion

Services are a critical architectural layer in React applications, providing a home for business logic, integrations, and stateful operations that don't belong in components or hooks. By following the patterns and best practices outlined in this guide, you can create maintainable, testable, and reusable services that keep your application codebase clean and organized.

**Key Takeaways**:

1. **Services have single responsibilities** - One service, one job
2. **Prefer composition over inheritance** - Compose services together
3. **Explicit lifecycle management** - Init, use, dispose
4. **Dependency injection** - Pass dependencies in, don't create them
5. **Testable in isolation** - No React, no DOM, just pure logic
6. **Type-safe APIs** - Leverage TypeScript for better DX
7. **Error handling** - Transform, log, and propagate errors appropriately

Remember: Not everything needs to be a service. Use utility functions for simple transformations, hooks for React integration, and only create services when you have genuine business logic, stateful operations, or external integrations that warrant it.
