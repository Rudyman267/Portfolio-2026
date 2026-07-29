/**
 * Runtime environment selector.
 *
 * All environment configs are bundled at build time. The correct one is
 * selected synchronously at module-load time — before React mounts, before
 * auth, before any API call — based on the hostname pattern.
 *
 * Hostname patterns (FlytBase standard):
 *   EU production  →  *-eu.flytbase.com  /  *-eu.flytnow.com
 *   US production  →  *.flytbase.com     /  *.flytnow.com   (no -eu)
 *   Staging        →  *.lovable.app      /  *-stag.*
 *   Local dev      →  localhost          /  127.0.0.1
 */

import { environment as devConfig } from './environment.dev';
import { environment as stagConfig } from './environment.stag';
import { environment as prodConfig } from './environment.prod';
import { environment as euProdConfig } from './environment.eu-prod';
import { environment as lovableConfig } from './environment.lovable';

function detectEnvironment() {
  const hostname = window.location.hostname;

  if (
    hostname.includes('.lovable.app') ||
    hostname.includes('lovable.dev') ||
    hostname.includes('.lovableproject.com')
  ) {
    return lovableConfig;
  }

  // Staging: Lovable-hosted preview or explicit stag subdomains
  if (hostname.includes('-stag.flytbase.com')) {
    return stagConfig;
  }

  // EU production: orgname-eu.flytbase.com
  if (hostname.includes('-eu.flytbase.com')) {
    return euProdConfig;
  }

  // US production: any other flytbase.com
  if (hostname.includes('flytbase.com')) {
    return prodConfig;
  }

  // Local development fallback (localhost, 127.0.0.1, etc.)
  return lovableConfig;
}

export const environment = detectEnvironment();
