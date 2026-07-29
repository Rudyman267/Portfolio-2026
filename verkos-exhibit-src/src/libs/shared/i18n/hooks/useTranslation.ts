import { useTranslation as useI18nextTranslation } from 'react-i18next';

// Re-export with type safety enhancements
export const useTranslation = (namespace?: string) => {
  return useI18nextTranslation(namespace);
};

// Hook for changing language
export const useLanguage = () => {
  const { i18n } = useI18nextTranslation();

  const changeLanguage = (language: string) => {
    return i18n.changeLanguage(language);
  };

  const currentLanguage = i18n.language;
  const supportedLanguages = (i18n.options.supportedLngs as string[])?.filter(
    (lang) => lang !== 'cimode'
  ) || ['en'];
  return {
    currentLanguage,
    supportedLanguages,
    changeLanguage,
  };
};
