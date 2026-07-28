# Static Assets

This directory contains static assets for the application.

## Structure mahesh

```
assets/
├── flytbase-logo.svg    - FlytBase logo (add your own)
├── icons/               - App icons
├── images/              - Static images
└── data/                - Static data files (JSON, etc.)
```

## FlytBase Logo

Add the FlytBase logo to this directory:

- **File**: `flytbase-logo.svg`
- **Source**: Copy from another app's public/assets/ or design assets

## Usage in Components

```typescript
// Reference assets from public/
<img src="/assets/flytbase-logo.svg" alt="FlytBase" />
<img src="/assets/icons/my-icon.svg" alt="Icon" />
```

## Notes

- Assets in `public/` are served as-is (not processed by Vite)
- Use absolute paths starting with `/` to reference public assets
- For assets imported in components, place them in `src/assets/` instead
