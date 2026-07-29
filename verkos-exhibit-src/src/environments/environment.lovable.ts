/**
 * EXHIBIT NOTE — this is the config the runtime selector falls through to for
 * any non-flytbase hostname, so it is the one the portfolio embed actually
 * uses. Three changes from the original:
 *   1. `websiteBasePath` derives from the Vite base, so the TanStack router's
 *      basepath matches wherever the build is mounted (`/verkos-demo/` on the
 *      portfolio, `/` in local dev). Without this every route falls through to
 *      the index.
 *   2. The Cesium ion token is blanked — it is an account credential and this
 *      build is public.
 *   3. Remote branding/map asset hosts are emptied to hold the zero-external-
 *      request rule.
 */
export const environment = {
  environment: "lovable",
  appInfo: {
    appName: "Verkos Reports",
    tenantId: "staging",
    devOrgId: "658295f8dbab9efb302183ab",
    websiteBasePath: import.meta.env.BASE_URL || "/",
    apiBasePath: "/auth",
    apiDomain: "https://api-stag.flytbase.com",
    websiteDomain: window.location.origin,
    loginAppUrl: "https://login-stag.flytbase.com",
    consoleAppUrl: "https://console-stag.flytbase.com",
    accountAppUrl: "https://account-stag.flytbase.com",
  },
  localDeployment: false,
  branding: {
    poweredByLogoUrl: `${import.meta.env.BASE_URL || "/"}assets/flytbase-logo.svg`,
  },
  mapAssetsUrl: "",
  cesium: {
    ionToken: "",
  },
};
