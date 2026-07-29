import { DEV_ORGS } from "@libs/shared";

// For development environment
export const environment = {
  environment: 'development',
  appInfo: {
    appName: 'Verkos Reports',
    tenantId: 'development',
    devOrgId: '68edfa4d56b0eedad4f01854',
    websiteBasePath: '/verkos-reports/',
    apiBasePath: '/auth',
    apiDomain: 'https://api-dev.flytbase.com',
    websiteDomain: window.location.origin,
    loginAppUrl: 'http://localhost:4006',
    consoleAppUrl: 'http://localhost:4002',
    accountAppUrl: 'http://localhost:4004',
  },
  localDeployment: false,
  branding: {
    poweredByLogoUrl:
      'https://assets.flytbase.com/flytnow/customer-branding/FlytBase/powered-by-flytbase.svg',
  },
  mapAssetsUrl: 'https://flytbase-map-assets-dev.s3.amazonaws.com/',
  cesium: {
    ionToken:
      '',
  },
  analytics: {
    zipyApiKey: '',
    zipyEnabled: false,
  },
};
