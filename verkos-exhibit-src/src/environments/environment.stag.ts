export const environment = {
  environment: 'staging',
  appInfo: {
    appName: 'Verkos Reports',
    tenantId: 'staging',
    devOrgId: '68edfa4d56b0eedad4f01854',
    websiteBasePath: '/verkos-reports/',
    apiBasePath: '/auth',
    apiDomain: 'https://api-stag.flytbase.com',
    websiteDomain: window.location.origin,
    loginAppUrl: 'https://login-stag.flytbase.com',
    consoleAppUrl: 'https://console-stag.flytbase.com',
    accountAppUrl: 'https://account-stag.flytbase.com',
  },
  localDeployment: false,
  branding: {
    poweredByLogoUrl:
      'https://assets.flytbase.com/flytnow/customer-branding/FlytBase/powered-by-flytbase.svg',
  },
  mapAssetsUrl: 'https://flytbase-map-assets-stag.s3.amazonaws.com/',
  cesium: {
    ionToken:
      '',
  },
};
