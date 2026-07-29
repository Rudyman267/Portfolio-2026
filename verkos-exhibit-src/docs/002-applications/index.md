# Modules Documentation

This section contains documentation for all application modules in the FlytBase monorepo.

## Application Modules

### [Design System](./design-system/index.md)

Centralized design language and component library for maintaining consistency across all FlytBase applications. Includes design tokens, reusable components, and comprehensive developer documentation.

### [Fleet View](./fleet-view/index.md)

Real-time drone fleet monitoring and control dashboard. Provides operators with comprehensive oversight of multiple drones, live telemetry, video feeds, and command interfaces.

### [Map Integration](./map-temp/index.md)

Core mapping and geospatial visualization capabilities shared across applications. Includes entity management, real-time tracking, and interactive map features.

### [Socket Communication](./socket/index.md)

Real-time communication framework for live data streaming between applications and backend services. Handles telemetry, status updates, and command dispatch.

### [Drone State Management](fleet-view/features/drone-state/index.md)

Centralized state management system for drone telemetry, status, and operational data across all applications.

## Module Organization

Each module follows a consistent documentation structure:

- **Overview** - Module purpose, features, and technical stack
- **Architecture** - Technical architecture and design decisions
- **Features** - Detailed feature documentation organized by functionality
- **Integration** - How the module integrates with other system components

## Development Guidelines

When working with modules:

1. **Follow feature-based architecture** - Organize code and documentation by features, not file types
2. **Maintain clear boundaries** - Ensure modules have well-defined interfaces and responsibilities
3. **Document integration points** - Clearly document how modules interact with each other
4. **Keep documentation current** - Update documentation as features evolve

## Cross-Module Dependencies

- **Design System** provides UI consistency for Fleet View and other applications
- **Map Integration** is used by Fleet View for geospatial visualization
- **Socket Communication** provides real-time data for Fleet View and other applications
- **Drone State Management** centralizes data used across multiple modules

## Contributing to Module Documentation

When adding or updating module documentation:

1. Follow the established directory structure in the [Documentation Best Practices](../001-common/doc-standards/documentation-best-practices.md)
2. Use the appropriate templates from [Doc Templates](../001-common/doc-templates/index.md)
3. Maintain the feature-based organization within each module
4. Update this index file when adding new modules
