export interface TranslationKeys {
  greeting: string;
  // Add more keys as they are added to translation files
}

export type SupportedLocale = 'en' | 'es';

export interface I18nContextType {
  currentLanguage: SupportedLocale;
  supportedLanguages: SupportedLocale[];
  changeLanguage: (language: SupportedLocale) => Promise<void>;
  t: (key: keyof TranslationKeys, options?: any) => string;
}
