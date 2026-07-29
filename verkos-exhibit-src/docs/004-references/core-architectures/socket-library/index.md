# Socket Library

The socket library provides a robust implementation for real-time socket communication with the backend. It handles connection management, subscription management, and message routing.

## Overview

- **Purpose**: Enable real-time communication between client applications and backend services
- **Primary Use Case**: Streaming telemetry data from drones/devices to the UI
- **Core Features**: Reference counting, automatic reconnection, topic-based subscriptions

## Documentation Sections

- [Architecture](architecture/socket-architecture.md): Design principles and system architecture
- [Implementation](implementation/socket-client-implementation.md): Details of the socket client implementation
- [Best Practices](best-practices/socket-best-practices.md): Guidelines for using the socket library efficiently
- [Examples](examples/socket-usage-examples.md): Practical examples showing how to use the socket library

## Related Modules

- [Drone State](../../../002-modules/fleet-view/features/drone-state/index.md): Uses the socket library for drone telemetry data
