import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const Logout = () => {
  const { logout, authConfig } = useAuth();

  useEffect(() => {
    const performLogout = async () => {
      await logout();

      const loginUrl = authConfig?.appInfo?.loginAppUrl;
      const basePath = authConfig?.appInfo?.websiteBasePath || '/';
      const isLocalhost = window.location.hostname === 'localhost';

      if (loginUrl && !isLocalhost) {
        window.location.href = loginUrl;
      } else {
        window.location.href = `${basePath}login`;
      }
    };
    performLogout();
  }, [logout, authConfig]);

  return null;
};

export default Logout;

