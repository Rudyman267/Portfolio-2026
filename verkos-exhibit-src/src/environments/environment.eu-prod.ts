export const environment = {
  environment: 'production-eu',
  appInfo: {
    appName: 'Verkos Reports',
    tenantId: 'production-eu',
    devOrgId: '',
    websiteBasePath: '/verkos-reports/',
    apiBasePath: '/auth',
    apiDomain: 'https://api-eu.flytbase.com',
    websiteDomain: window.location.origin,
    loginAppUrl: 'https://login-eu.flytbase.com',
    consoleAppUrl: 'https://console-eu.flytbase.com',
    accountAppUrl: 'https://account-eu.flytbase.com',
  },
  localDeployment: false,
  branding: {
    poweredByLogoUrl:
      'https://assets.flytbase.com/flytnow/customer-branding/FlytBase/powered-by-flytbase.svg',
  },
  mapAssetsUrl: 'https://flytbase-map-assets-prod-eu.s3.amazonaws.com/',
  cesium: {
    ionToken:
      '',
  },
};
