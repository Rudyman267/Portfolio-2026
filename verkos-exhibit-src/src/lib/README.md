# Build Utilities & Plugins

This directory contains build-time utilities and Vite plugins.

## Purpose

This folder is for:

- Custom Vite plugins
- Build configuration helpers
- Development tools
- Code generation scripts

## Example Files

```
lib/
├── vite-plugin-custom.ts     - Custom Vite plugin
└── code-generator.ts         - Build-time code generation
```

## When to Use

Use this directory for:

- Vite plugins that modify build process
- Custom transformers
- Build-time code generation
- Development server enhancements

## NOT for Runtime Code

Do NOT put runtime application code here. Use:

- `/utils/` for runtime utility functions
- `/hooks/` for React hooks
- `/components/` for UI components

## Example Vite Plugin

```typescript
// lib/vite-plugin-custom.ts
import { Plugin } from 'vite';

export function CustomPlugin(): Plugin {
  return {
    name: 'custom-plugin',
    transform(code, id) {
      // Transform code during build
      return {
        code: transformedCode,
        map: null,
      };
    },
  };
}
```
