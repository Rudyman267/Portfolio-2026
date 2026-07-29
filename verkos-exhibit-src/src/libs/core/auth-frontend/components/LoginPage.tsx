import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../hooks/useAuth';
import ThirdPartyAuth from './ThirdPartyAuth';
import PasswordlessAuth from './PasswordlessAuth';
import '../styles/auth.css';
import Footer from './Footer';
import { useEffect, useState } from 'react';
import { generateOriginToken } from '../config/SuperTokensConfig';
import { STORAGE_KEYS } from '../types';
import Session from 'supertokens-auth-react/recipe/session';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, authConfig } = useAuth();
  const [isRestoringSession, setIsRestoringSession] = useState(false);

  const loginUrl = authConfig?.appInfo?.loginAppUrl;
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('.lovable.app') ||
    window.location.hostname.includes('.lovableproject.com') ||
    window.location.hostname.includes('lovable.dev');

  useEffect(() => {
    let isMounted = true;

    const redirectToHostedLogin = async () => {
      if (!loginUrl || isLocalhost || isAuthenticated || isLoading) {
        return;
      }

      setIsRestoringSession(true);

      try {
        await Session.attemptRefreshingSession();
      } catch (refreshError) {
        console.warn('Session restore failed on login page:', refreshError);
      }

      const sessionExists = await Session.doesSessionExist();

      if (!isMounted) {
        return;
      }

      if (sessionExists) {
        navigate({ to: '/' });
        return;
      }

      const origin =
        window.location.origin + (authConfig?.appInfo?.websiteBasePath || '');
      const originToken = generateOriginToken(origin);
      sessionStorage.setItem(STORAGE_KEYS.SESSION_ORIGIN, origin);
      window.location.href = `${loginUrl}/accounts/login?origin=${encodeURIComponent(originToken)}`;
    };

    void redirectToHostedLogin();

    return () => {
      isMounted = false;
      setIsRestoringSession(false);
    };
  }, [loginUrl, isLocalhost, isAuthenticated, isLoading, authConfig, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/' });
    }
  }, [isAuthenticated, navigate]);

  if (isLoading || isRestoringSession) {
    return null;
  }

  if (isAuthenticated) {
    return null;
  }

  if (loginUrl && !isLocalhost) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col">
      <div className="flex-1 flex items-center justify-center mx-auto w-full max-w-[400px] px-4">
        <div className="w-full py-4 sm:py-8">
          <div className="flex justify-center mb-8">
            <img
              src="assets/flytbase-logo.svg"
              onError={(e) => {
                e.currentTarget.src = 'assets/icons/login/fb-logo-large.svg';
              }}
              alt="Flytbase Logo"
              className="h-10"
            />
          </div>
          <h2 className="text-center text-xl text-text-1 mb-8">
            Login or Sign up
          </h2>

          <ThirdPartyAuth />

          <div className="flex space-x-2 my-6 items-center w-full">
            <hr className="border-gray-600 flex-1" />
            <span className="px-3 text-gray-400 text-sm">or</span>
            <hr className="border-gray-600 flex-1" />
          </div>

          <PasswordlessAuth />
        </div>
      </div>
      <Footer />
    </div>
  );
}
