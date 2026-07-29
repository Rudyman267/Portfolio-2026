# Deployment Guide for React Applications

## Overview

This guide provides step-by-step instructions for deploying a React application using Vite and NX. It covers the entire process, from setting up the environment to deploying the application in a production environment.

## Prerequisites

Before deployment, ensure your React application meets these requirements:

1. **Vite Configuration**

   - Properly configured React app with Vite
   - Base path set correctly in `vite.config.js`: `base: "/app-name/"`
   - If the app uses Cesium maps, add the plugin: `ViteCesiumBuildPlugin('app-name')` this plugin is present in each app, as this is a custom plugin for building cesium assets and it is not present in the shared lib, copy from other apps in the new app.

2. **Routing Configuration**

   - In `router.ts`, base path configured as: `'/app-name'`
   - In `index.html`, base path set to: `'/app-name/'`

3. **Asset References**

   - All asset paths should use relative paths: `"assets/file.png"` (correct)
   - Avoid absolute paths: `"/assets/file.png"` (incorrect)

4. **Environment Variables**
   - Ensure environment variables are set correctly in the `environment.dev.ts`, `environment.stag.ts`, `environment.prod.ts`, `environment.eu-prod.ts` files
   - Use the correct environment variables for each environment (development, staging, production)
   - In project.json, ensure mode is set correctly for each configuration, under `"target.build.configurations"`
   ```json
   "configurations": {
        "development": {
          "mode": "dev"
        },
        "staging": {
          "mode": "stag"
        },
        "production": {
          "mode": "prod"
        },
        "production-eu": {
          "mode": "eu-prod"
        }
      }
   ```

## Cloudflare Deployment Process

### Creating Pages

1. Navigate to Cloudflare Workers and Pages section
2. Create a new page
3. Enter your project name
4. For manual deployment, upload the distribution folder
5. Create two separate pages:
   - One for staging environment
   - One for production environment
6. Note the generated URLs with the format: `(project-name).pages.dev`

### Configuring the Worker

1. Update the existing worker that handles proxying requests to staging and production
2. Edit the worker code to include your project's URLs using this format:

```json
{
  "<project-name>": {
    "prod": "https://<project-name>.pages.dev",
    "staging": "https://<project-name>-stag.pages.dev",
    "eu": "https://<project-name>-eu.pages.dev"
  }
}
```

3. In worker settings, add a route following the existing pattern: `*.flytbase.com/<project-name>/*`

### Operations Dashboard Configuration

1. Add the new app's path to the `ngsw-config.json` file in the nagivationUrls array like this:

```json
{
  "navigationUrls": [
    "!/<project-name>/**"
    // ... other navigation URLs
  ]
}
```

2. This ensures the worker will trigger before accessing the operations dashboard
3. This step is essential for opening the app without issues

### Final Verification

Verify that the domain is properly proxied in Cloudflare. Without this configuration, the app won't open correctly and the operations app will be displayed instead.

## Building the Application

Use the following NX command to create a build for your application:

```bash
nx build <app-name> --configuration=<env-name>

# Examples:
nx build fleet --configuration=production
nx build fleet --configuration=staging
```

## Deploying to Cloudflare Pages

1. Navigate to your project in Cloudflare Pages
2. Click the "Create deployment" button
3. Upload the contents of the `dist/apps/<app-name>/` directory
