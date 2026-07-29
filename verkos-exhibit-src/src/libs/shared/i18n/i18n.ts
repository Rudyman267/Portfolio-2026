import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations statically - Vite will bundle these
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';

export interface I18nConfig {
  defaultLocale?: string;
  supportedLocales?: string[];
  debug?: boolean;
}

// Import all supported translations
import deTranslations from './locales/de.json';
import frTranslations from './locales/fr.json';
import huTranslations from './locales/hu.json';
import idTranslations from './locales/id.json';
import itTranslations from './locales/it.json';
import jaTranslations from './locales/ja.json';
import koTranslations from './locales/ko.json';

// Static resources - bundled at build time
const resources = {
  en: { translation: enTranslations },
  es: { translation: esTranslations },
  de: { translation: deTranslations },
  fr: { translation: frTranslations },
  hu: { translation: huTranslations },
  id: { translation: idTranslations },
  it: { translation: itTranslations },
  ja: { translation: jaTranslations },
  ko: { translation: koTranslations },
};

// Initialize i18next
export const initI18n = (config: I18nConfig = {}) => {
  const {
    defaultLocale = 'en',
    supportedLocales = ['en', 'es', 'de', 'fr', 'hu', 'id', 'it', 'ja', 'ko'],
    debug = process.env.NODE_ENV === 'development',
  } = config;

  i18n
    .use(LanguageDetector) // Detect user language
    .use(initReactI18next) // Bind to React
    .init({
      fallbackLng: defaultLocale,
      supportedLngs: supportedLocales,
      debug,
      interpolation: {
        escapeValue: false, // React handles XSS
      },
      resources,
      detection: {
        order: ['navigator', 'querystring', 'cookie', 'localStorage'],
        caches: ['cookie'],
      },
    });

  return i18n;
};

export default i18n;
