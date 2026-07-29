# Cesium Map Integration with Vite

This document captures all findings and steps required to properly integrate CesiumJS with a Vite-based React application.

## Overview

CesiumJS is a powerful 3D geospatial visualization library. However, due to its reliance on static assets (Workers, Assets, ThirdParty files), special configuration is needed when using it with modern bundlers like Vite.

## Prerequisites

- Vite-based React project
- CesiumJS package installed (`cesium`)

## Integration Steps

### 1. Install vite-plugin-cesium

The `vite-plugin-cesium` package handles all the complex configuration automatically:

```bash
npm install vite-plugin-cesium --save-dev
# or
bun add vite-plugin-cesium -d
```

### 2. Configure Vite

Update `vite.config.ts` to include the Cesium plugin:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import cesium from 'vite-plugin-cesium';

export default defineConfig({
  plugins: [
    react(),
    cesium(), // Add this plugin
  ],
  // ... rest of config
});
```

**What the plugin does:**
- Sets `window.CESIUM_BASE_URL` automatically
- Copies Cesium's static assets (Workers, Assets, ThirdParty, Widgets) to the build output
- Configures the necessary build settings for Cesium
- Handles external dependencies properly

### 3. Import Cesium CSS

In your main entry file (`src/main.tsx`), import the Cesium widgets CSS:

```typescript
import 'cesium/Build/Cesium/Widgets/widgets.css';
```

This is required for proper styling of:
- Map controls and widgets
- Info boxes and tooltips
- Timeline and animation controls
- Navigation help popups

### 4. Configure Cesium Ion Token

For terrain, imagery, and 3D assets from Cesium Ion, you need an access token.

**In environment configuration:**

```typescript
// src/environments/environment.dev.ts
export const environment = {
  // ... other config
  cesium: {
    ionToken: 'your-cesium-ion-access-token',
  },
};
```

**In map initialization:**

```typescript
import { Ion } from 'cesium';
import { environment } from '@env';

// Set the token before creating the viewer
Ion.defaultAccessToken = environment.cesium.ionToken;
```

## Common Issues and Solutions

### Issue: Globe and Assets Not Loading

**Symptoms:**
- Map container shows but globe is blank
- Console shows 404 errors for Workers or Assets
- "Failed to load resource" errors

**Solution:**
Ensure `vite-plugin-cesium` is installed and configured. This plugin automatically handles the `CESIUM_BASE_URL` configuration.

### Issue: Map Widgets Have No Styling

**Symptoms:**
- Map controls appear unstyled
- Buttons and UI elements are plain HTML
- Timeline appears broken

**Solution:**
Import the Cesium widgets CSS in your main entry file:

```typescript
import 'cesium/Build/Cesium/Widgets/widgets.css';
```

### Issue: "Ion.defaultAccessToken is not set" Warning

**Symptoms:**
- Console warning about missing token
- Terrain and imagery may not load
- Cesium Ion assets fail to load

**Solution:**
Set the Ion access token before creating any Cesium viewer:

```typescript
Ion.defaultAccessToken = 'your-token-here';
```

### Issue: Build Fails with Memory Error

**Symptoms:**
- Out of memory during build
- Build hangs indefinitely

**Solution:**
Add Cesium to optimizeDeps exclude and configure build options:

```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    exclude: ['cesium'],
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
```

## Manual Configuration (Alternative to Plugin)

If you cannot use `vite-plugin-cesium`, here's the manual approach:

### 1. Set CESIUM_BASE_URL in HTML

```html
<!-- index.html -->
<script>
  window.CESIUM_BASE_URL = 'https://cesium.com/downloads/cesiumjs/releases/1.138.0/Build/Cesium/';
</script>
```

Or for local assets:

```html
<script>
  window.CESIUM_BASE_URL = '/cesium/';
</script>
```

### 2. Copy Static Assets with vite-plugin-static-copy

```typescript
import { viteStaticCopy } from 'vite-plugin-static-copy';

const cesiumSource = 'node_modules/cesium/Build/Cesium';
const cesiumBaseUrl = 'cesium';

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        { src: `${cesiumSource}/ThirdParty`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Workers`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Assets`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Widgets`, dest: cesiumBaseUrl },
      ],
    }),
  ],
  define: {
    CESIUM_BASE_URL: JSON.stringify(`/${cesiumBaseUrl}`),
  },
});
```

## Project-Specific Implementation

In our map library, Cesium is initialized through the provider pattern:

```
src/libs/shared/map/
├── src/
│   ├── private/
│   │   └── map-providers/
│   │       └── cesium/
│   │           └── cesium-map-service.ts  # Sets Ion token, creates viewer
│   └── runtime/
│       └── map-instance.ts                # Factory for creating map instances
```

**Key initialization flow:**
1. `createMapInstanceWithProvider()` is called with map options
2. Provider registry returns Cesium provider
3. `cesium-map-service.ts` sets `Ion.defaultAccessToken` from config
4. Cesium Viewer is created with the configured options

## Environment Configuration Example

```typescript
// src/environments/environment.dev.ts
export const environment = {
  // ... other config
  cesium: {
    ionToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },
  mapAssetsUrl: 'https://flytbase-map-assets-dev.s3.amazonaws.com/',
};
```

## Testing the Integration

After configuration, verify:

1. **Globe renders** - You should see the Earth with terrain
2. **Controls work** - Zoom, pan, and rotate should function
3. **Ion assets load** - If using Cesium Ion, check for terrain detail
4. **No console errors** - Check for 404s or configuration warnings

## References

- [Cesium Documentation](https://cesium.com/learn/cesiumjs-learn/)
- [vite-plugin-cesium GitHub](https://github.com/nshen/vite-plugin-cesium)
- [Configuring Vite or Webpack for CesiumJS](https://cesium.com/blog/2024/02/13/configuring-vite-or-webpack-for-cesiumjs/)
- [Cesium Ion Access Tokens](https://cesium.com/learn/ion/cesium-ion-access-tokens/)
