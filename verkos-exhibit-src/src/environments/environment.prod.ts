export const environment = {
  environment: 'production',
  appInfo: {
    appName: 'Verkos Reports',
    tenantId: 'production',
    devOrgId: '',
    websiteBasePath: '/verkos-reports/',
    apiBasePath: '/auth',
    apiDomain: 'https://api.flytbase.com',
    websiteDomain: window.location.origin,
    loginAppUrl: 'https://login.flytbase.com',
    consoleAppUrl: 'https://console.flytbase.com',
    accountAppUrl: 'https://account.flytbase.com',
  },
  localDeployment: false,
  branding: {
    poweredByLogoUrl:
      'https://assets.flytbase.com/flytnow/customer-branding/FlytBase/powered-by-flytbase.svg',
  },
  mapAssetsUrl: 'https://flytbase-map-assets-prod.s3.amazonaws.com/',
  cesium: {
    ionToken:
      '',
  },
};
