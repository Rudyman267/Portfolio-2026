import React, { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { initI18n, I18nConfig } from './i18n';

interface I18nProviderProps {
  children: React.ReactNode;
  config?: I18nConfig;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  config = {},
}) => {
  const i18nInstance = initI18n(config);

  // useEffect(() => {
  //   // Any additional initialization logic can go here
  // }, [config]);

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
};
