---
name: Route Guards
description: requireAuth, requireOrg guards and Lovable auth bypass
type: feature
---
- Route access controlled by `requireAuth` and `requireOrg` guards with a 30-minute cache.
- App gated by `contextReady` in `App.tsx`.
- Lovable environment: 3-second timeout sets `authBypass`, allowing UI to mount and skipping guards. Cross-domain SuperTokens auth is impossible on lovableproject.com (different origin than login-stag.flytbase.com = no token transfer). devOrgId used for API calls.
- Staging/production: full SuperTokens auth enforced, no bypass.
