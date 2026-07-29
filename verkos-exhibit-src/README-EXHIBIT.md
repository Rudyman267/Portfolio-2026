# Verkos exhibit — build source

This is the **source** for the interactive Verkos product demo embedded in
`/work/verkos-reports`. The thing the site actually serves is the compiled
output at **`public/verkos-demo/`**, which is committed separately.

It lives in the repo purely as **insurance**. It was previously only in
`E:\tmp\verkos-exhibit-main`, so a temp clear would have destroyed every patch
and forced a rebuild from scratch.

## This does NOT affect the site build

Nothing here is imported by the Next app, so Turbopack never bundles it — zero
bytes reach any client bundle. It is excluded from `tsconfig.json` (otherwise
`tsc --noEmit` would try to compile ~1000 files that import `@auth`, `@ui`,
`@libs/*` — aliases that don't exist in the portfolio) and listed in
`.vercelignore`. It is not under `public/`, so it is not web-accessible.

## What it is

The FlytBase "Verkos Reports" app (from `verkos-reports-exhibit-rudy-main.zip`),
patched to run as a fully offline, backend-free static build.

Patches, all under `src/`:

| Path | Purpose |
|---|---|
| `exhibit-auth/` | Replaces the `@auth` vite alias. Inert route guards (the real ones redirect to `/login`), pass-through providers, `useHttp()` → the mock client. Must stay a **directory** — routes deep-import `@auth/components/*`. |
| `exhibit/mock-http.ts` | URL-routing offline replacement for the axios instance. Flights, media, forensic search + bounding boxes, sites, profile, org. Never throws, never hits the network. |
| `exhibit/seed-data.ts` | Fills the gaps the app's demo mode leaves: its base mocks ship as **empty arrays** and `flightContexts` starts `{}`. Authors sites, reports, drafts, flight contexts and gallery media for flights 6-12. |
| `exhibit/bootstrap.ts` | Runs once before the router mounts: seeds contexts → seeds collections → `enterDemoMode()`. Order matters. |
| `exhibit/icon-swap.ts` | Fills each `<i class="fa-*">` with inline lucide SVG. **Injects a child — never `replaceWith()`**, which pulls React-managed nodes out of the tree and throws `NotFoundError: removeChild` on unmount. |
| `exhibit/lucide-icons.ts` | Generated. `node scripts/gen-icon-map.mjs`. |
| `exhibit/asset-url.ts` | Base-aware path resolution. **Idempotent on purpose** — values pass through twice (demo data → mock HTTP responses) and double-applying produced `/verkos-demo/verkos-demo/...`. |
| `integrations/supabase/client.ts` | Offline mock. The original shipped a live URL + anon key and is called for all four `generate-report` modes. |
| `environments/environment.lovable.ts` | The config that actually runs (the runtime selector falls through to it on any non-flytbase hostname). `websiteBasePath` derives from `import.meta.env.BASE_URL` — this sets the TanStack router `basepath`; without it every route falls through to the index. |

Also patched: `App.tsx` (reduced shell), `routes/_layout.tsx` (guards removed),
`index.html` (FontAwesome Pro kit + Google Fonts stripped, self-hosted fonts),
`components/layouts/AppSidebar.tsx` + `components/reports/{ReportsTable,ReportReview}.tsx`
(demo-mode button and DEMO chips removed).

## Credentials

All removed — **do not reintroduce them.** A Supabase URL + anon key, the
FontAwesome Pro kit token (a FlytBase account token), and **five** Cesium ion
tokens (`environment.{dev,prod,stag,eu-prod}.ts` plus `lovable`) were stripped
before this was committed. Re-scan after any re-sync from the original zip:

```bash
grep -rlnE "eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}" src/
```

## Rebuilding

```bash
cp -r ../public/verkos-demo/demo ./public/demo   # see public/DEMO-IMAGES-RESTORE.md
npm install
VITE_PROXY_BASE=/verkos-demo/ npx vite build --mode prod
cp -r dist/* ../public/verkos-demo/
```

`node_modules/` and `dist/` are deliberately not vendored. Full context,
including the verification harness and the four bugs found during it, is in
`PROJECT_LOG.md` §6 "VERKOS APP EXHIBIT".
