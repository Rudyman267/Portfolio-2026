# App Template Integration Guides

This directory contains step-by-step guides for integrating common features from the FlytBase shared library ecosystem into your application.

## Available Integration Guides

| Integration                                           | Purpose                           | Reference Apps            |
| ----------------------------------------------------- | --------------------------------- | ------------------------- |
| [Keyboard Shortcuts](./keyboard-integration.md)       | Global keyboard handling          | mission-planner           |
| [Socket.IO](./socket-integration.md)                  | Real-time WebSocket communication | fleet, mission-planner    |
| [Map Library](./map-integration.md)                   | Cesium 3D maps and geospatial     | mission-planner, flyt-map |
| [Video Streaming](./video-streaming-integration.md)   | Millicast/Agora video             | fleet                     |
| [State Management](./state-management-integration.md) | Zustand stores                    | mission-planner, fleet    |
| [API Integration](./api-integration.md)               | REST API services                 | all apps                  |

## Quick Start

1. **Choose an integration** from the list above
2. **Follow the step-by-step guide** in the corresponding file
3. **Reference the example apps** (mission-planner, fleet) for real-world patterns
4. **Test your integration** before building features on top of it

## Integration Guide Structure

Each guide follows this consistent structure:

1. **Overview** - What the integration provides
2. **When to Use** - Use cases and scenarios
3. **Prerequisites** - Required dependencies and setup
4. **Step-by-Step Setup** - Installation and configuration
5. **Usage Examples** - Code examples from real apps
6. **Common Patterns** - Best practices from production code
7. **Troubleshooting** - Common issues and solutions
8. **Reference Apps** - Where this is used in the monorepo

## Reference Applications

### mission-planner (`/apps/mission-planner`)

- **Features**: Mission planning, 3D visualization, waypoint management
- **Key Integrations**: Map library, Socket.IO, Zustand, Keyboard shortcuts
- **Best for**: Geospatial features, real-time data, complex forms

### fleet (`/apps/fleet`)

- **Features**: Fleet monitoring, video streaming, real-time telemetry
- **Key Integrations**: Socket.IO, Video streaming, Zustand
- **Best for**: Real-time dashboards, live data visualization

### flyt-map (`/apps/flyt-map`)

- **Features**: Standalone map application, annotations
- **Key Integrations**: Map library (Cesium), annotations
- **Best for**: Map-centric features, geofencing

## Shared Libraries

All integrations use libraries from `/libs/shared/`:

- `@libs/shared/socket` - Socket.IO client and handlers
- `@libs/shared/map` - Cesium 3D map library
- `@libs/shared/video-streaming` - Video streaming abstraction
- `@libs/shared/state` - Shared Zustand stores
- `@libs/shared/components` - Reusable UI components
- `@libs/shared/ui` - Design system components
- `@libs/shared/api-modules` - API client wrappers

## Getting Help

- **Shared Library Docs**: `/libs/shared/[library]/README.md`
- **Architecture Docs**: `/docs/002-modules/`
- **Reference Apps**: Check `mission-planner` or `fleet` source code

## Best Practices

1. **Start Simple**: Begin with basic integration, add complexity as needed
2. **Follow Patterns**: Use the same patterns as reference apps
3. **Type Safety**: Leverage TypeScript for all integrations
4. **Test Thoroughly**: Test integrations before building features
5. **Document Changes**: Update this README when adding new integrations
