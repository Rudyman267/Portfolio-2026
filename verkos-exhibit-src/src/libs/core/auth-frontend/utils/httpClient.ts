import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import Session from 'supertokens-auth-react/recipe/session';
import { EmailVerificationClaim } from 'supertokens-auth-react/recipe/emailverification';
import { mapAxiosError, createEmailUnverifiedError } from './httpErrors';
import { AuthConfig } from '../types';

// Create an Axios instance with default configuration
export const createHttpClient = (
  baseURL: string,
  authConfig: AuthConfig,
  getOrgId?: () => string | undefined
): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // CRITICAL: Attach SuperTokens interceptors so the Authorization: Bearer
  // access token (header mode) is added automatically and 401s trigger a
  // session refresh + retry. Without this, every API call is unauthenticated.
  Session.addAxiosInterceptors(instance);

  // Additional request interceptor for org-id header
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      config.headers['st-auth-mode'] = 'header';

      // Dynamically add org-id header from current context
      const currentOrgId = getOrgId?.();

      // For API calls that require org-id, block if it's not available
      // Skip this check for auth endpoints that don't need org-id
      const isAuthEndpoint =
        config.url?.includes('/auth') ||
        config.url?.includes('/auth_check') ||
        config.url?.includes('/login') ||
        config.url?.includes('/logout') ||
        config.url?.includes('/member/organizations'); // For non-dock

      if (!isAuthEndpoint && !currentOrgId) {
        console.warn(
          'Blocking API call - org-id not available yet:',
          config.url
        );
        return Promise.reject(
          new Error(
            'Organization ID not available. Please wait for authentication to complete.'
          )
        );
      }

      if (currentOrgId) {
        config.headers['org-id'] = currentOrgId;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle token refresh and auth errors
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error) => {
      const standardError = mapAxiosError(error);

      // Helper to build absolute URLs from basePath, avoiding bare strings like "login-error"
      // that the browser misinterprets as hostnames.
      const buildUrl = (path: string): string => {
        const basePath = (authConfig.appInfo.websiteBasePath ?? '/').replace(/\/+$/, '');
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${window.location.origin}${basePath}${cleanPath}`;
      };

      // Handle 403 Forbidden errors - check for email verification claims
      if (standardError.status === 403) {
        console.error('403 Forbidden error:', standardError);
        try {
          // Check session claims
          const claimValidationErrors = await Session.validateClaims();

          // Convert to array if not already
          const errorsArray = Array.isArray(claimValidationErrors)
            ? claimValidationErrors
            : [claimValidationErrors];

          // Check if email verification error exists
          const emailUnverified = errorsArray.some(
            (e) => e.id === EmailVerificationClaim.id
          );

          if (emailUnverified) {
            console.warn('Email verification required');
            // Navigate to send verification email page
            window.location.href = buildUrl('/send-verification-email');

            // Return a specific email unverified error
            return Promise.reject(createEmailUnverifiedError(error));
          }
          // For other 403 errors, do NOT sign out — that triggers a SIGN_OUT loop
          // and breaks the session immediately after a successful login.
          // Just surface the error to the caller and let the UI decide.
          console.warn('403 received but no email verification claim — passing error through without signOut');
        } catch (claimError) {
          console.error('Error validating claims:', claimError);
        }
      }

      // For any other errors, return the standardized error
      return Promise.reject(standardError);
    }
  );

  return instance;
};
