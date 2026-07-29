/**
 * EXHIBIT SHIM — replaces `@auth` (src/libs/core/auth-frontend).
 *
 * The real module boots SuperTokens, opens an authenticated axios instance and
 * runs route guards that redirect to /login. None of that can work in a static
 * portfolio embed, so the vite `@auth` alias points here instead.
 *
 * This must stay a DIRECTORY: several routes deep-import
 * `@auth/components/<Name>`, which only resolves against a folder.
 *
 * Load-bearing detail: `useAuth().orgId` is `null` on purpose. TemplateAppLayout
 * feeds it to `useDbSync()`, which only reaches for Supabase when an org id is
 * present — null keeps the whole app offline and lets the seeded store stand.
 */

import React from 'react';
import { mockHttpClient, createHttpClient } from '@/exhibit/mock-http';

// ─── Types ───────────────────────────────────────────────────────────

export interface AuthConfig {
  appName?: string;
  websiteBasePath?: string;
  apiDomain?: string;
  websiteDomain?: string;
  [key: string]: unknown;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  orgId: string | null;
  userId: string | null;
  tokenPayload: Record<string, unknown> | null;
  authConfig: AuthConfig;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export type GuardContext = Record<string, unknown>;
export type RouteLoaderContext = Record<string, unknown>;
export type SiteAccessGuardConfig = Record<string, unknown>;
export interface HttpErrorDetails {
  type: string;
  message: string;
  status?: number;
}

// ─── Auth state ──────────────────────────────────────────────────────

const AUTH_CONFIG: AuthConfig = {
  appName: 'Verkos Reports',
  websiteBasePath: import.meta.env.BASE_URL || '/',
};

const AUTH_VALUE: AuthContextType = {
  isAuthenticated: true,
  isLoading: false,
  orgId: null, // see header note — keeps useDbSync offline
  userId: 'demo-user',
  tokenPayload: {
    userId: 'demo-user',
    email: 'k.nair@demo.verkos',
    firstName: 'Kavya',
    lastName: 'Nair',
    orgName: 'Verkos Demo Org',
  },
  authConfig: AUTH_CONFIG,
  logout: async () => undefined,
  refreshSession: async () => undefined,
};

export function useAuth(): AuthContextType {
  return AUTH_VALUE;
}

export function useHttp() {
  return mockHttpClient;
}

export { createHttpClient };
export const httpClient = mockHttpClient;

// ─── Providers (pass-through) ────────────────────────────────────────

export const AuthProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
export const HttpProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;

// ─── SuperTokens config (inert) ──────────────────────────────────────

export function initializeSuperTokens(): void {}
export function redirectToThirdPartyLogin(): void {}
export function generateOriginToken(): string {
  return 'demo-origin-token';
}
export function decodeOriginToken(): Record<string, unknown> {
  return {};
}
export function getDomainName(): string {
  return typeof window !== 'undefined' ? window.location.hostname : 'localhost';
}
export function setAuthConfig(cfg: Partial<AuthConfig>): void {
  Object.assign(AUTH_CONFIG, cfg);
}
export function getAuthConfig(): AuthConfig {
  return AUTH_CONFIG;
}
export function getSuperTokensConfig(): Record<string, unknown> {
  return {};
}

// ─── HTTP errors ─────────────────────────────────────────────────────

export const HttpErrorType = {
  NETWORK: 'NETWORK',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN',
} as const;

export function mapAxiosError(error: unknown): HttpErrorDetails {
  return { type: HttpErrorType.UNKNOWN, message: String(error) };
}
export function createEmailUnverifiedError(): HttpErrorDetails {
  return { type: HttpErrorType.FORBIDDEN, message: 'Email unverified' };
}

// ─── Route guards (all inert — never redirect) ───────────────────────

type AnyFn = (...args: unknown[]) => unknown;

const passGuard = async () => ({ passed: true } as const);

export const requireAuth = passGuard;
export const requireOrg = passGuard;
export const requireSuperAdmin = passGuard;
export const requireRegistration = passGuard;
export const requireFeature = () => passGuard;
export const createSiteAccessGuard = () => passGuard;
export const createGuard = () => passGuard;
export const combineGuards = (..._g: AnyFn[]) => passGuard;
export const combineGuardFunctions = (..._g: AnyFn[]) => passGuard;
export const createRouteLoader = (..._a: unknown[]) => async () => ({ guardsPassed: true });
export const createLayoutGuardLoader =
  (..._a: unknown[]) =>
  async () => ({ guardsPassed: true });

// ─── Iframe storage handlers (inert) ─────────────────────────────────

export function getWindowHandler(original: unknown): unknown {
  return original;
}
export function getCookieHandler(original: unknown): unknown {
  return original;
}
export function shouldUseCustomHandlers(): boolean {
  return false;
}

// ─── Auth screens ────────────────────────────────────────────────────
// Unreachable in the exhibit (guards always pass), but they must exist so the
// /login, /signup, /logout… routes still compile.

export { default as LoginPage } from './components/LoginPage';
export { default as LoginWrapper } from './components/LoginPage';
export { default as OnPremLogin } from './components/LoginPage';
export { default as Signup } from './components/LoginPage';
export { default as LinkSentPage } from './components/LinkSentPage';
export { default as PasswordlessVerification } from './components/PasswordlessVerification';
export { default as ThirdPartyAuth } from './components/ThirdPartyAuthCallback';
export { default as ThirdPartyAuthCallback } from './components/ThirdPartyAuthCallback';
export { default as RestrictedPage } from './components/RestrictedPage';
export { default as OrgNotFoundPage } from './components/OrgNotAccessiblePage';
export { default as LoginErrorPage } from './components/LoginErrorPage';
export { default as LogoutPage } from './components/LogoutPage';
export { default as NoSitesAvailablePage } from './components/NoSitesAvailablePage';
export { default as UserRegistration } from './components/LoginPage';
export { default as Welcome } from './components/LoginPage';
export { default as Terms } from './components/LoginPage';
export { default as AdditionalInfo } from './components/LoginPage';
export { default as OrgCheckGate } from './components/OrgCheckGate';
