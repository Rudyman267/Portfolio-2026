import { redirect, isRedirect } from '@tanstack/react-router';
import Session from 'supertokens-auth-react/recipe/session';
import { GuardFunction } from './types';

/**
 * Auth guard - Checks if the user is authenticated
 * On Lovable with header mode, doesSessionExist() handles refresh internally.
 * Do NOT call attemptRefreshingSession() manually — it causes 401 loops with stale tokens.
 * Do NOT call logout() here — it triggers signOut which reloads the page, creating a loop.
 */
export const requireAuth: GuardFunction = async () => {
  try {
    const sessionExists = await Session.doesSessionExist();

    if (!sessionExists) {
      throw redirect({ to: '/login' });
    }
  } catch (error) {
    // Re-throw TanStack Router redirects — they're not errors
    if (isRedirect(error)) {
      throw error;
    }
    console.warn('Auth guard error, redirecting to login:', error);
    throw redirect({ to: '/login' });
  }
};
