# AI Patterns for Internationalization (i18n)

This document provides patterns and guidelines for AI/LLM developers working with the internationalization system in this codebase.

## Overview

The project uses `react-i18next` with `lingo.dev` for translation management. The setup is centralized in `libs/shared/i18n/` and follows static bundling patterns for optimal performance.

## Key Files and Structure

```
libs/shared/i18n/
├── i18n.ts              # Core i18n configuration and initialization
├── I18nProvider.tsx     # React provider component
├── hooks/
│   └── useTranslation.ts # Custom hooks for translations
├── locales/
│   ├── en.json          # English translations (source)
│   └── es.json          # Spanish translations (target)
└── types/
    └── i18n.types.ts     # TypeScript types
```

## Usage Patterns

### 1. Setting Up i18n in a Component

```tsx
import { I18nProvider } from '@cloud/shared/i18n';

// Wrap your app/component
function App() {
  return (
    <I18nProvider config={{ defaultLocale: 'en', supportedLocales: ['en', 'es'] }}>
      <YourAppComponents />
    </I18nProvider>
  );
}
```

### 2. Using Translations in Components

```tsx
import { useTranslation } from '@cloud/shared/i18n';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('greeting')}</h1>
      <button>{t('Actions')}</button>
    </div>
  );
}
```

### 3. Language Switching

```tsx
import { useLanguage } from '@cloud/shared/i18n';

function LanguageSwitcher() {
  const { currentLanguage, supportedLanguages, changeLanguage } = useLanguage();

  return (
    <select value={currentLanguage} onChange={(e) => changeLanguage(e.target.value)}>
      {supportedLanguages.map((lang) => (
        <option key={lang} value={lang}>
          {lang.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
```

## Translation Key Patterns

### Naming Convention

- Use camelCase for keys: `greeting`, `userProfile`, `submitButton`
- For nested objects, use dot notation: `user.profile.name`
- Keep keys descriptive but concise

### File Structure (JSON)

```json
{
  "greeting": "Hello from Lingo.dev",
  "Actions": "Actions",
  "user": {
    "profile": {
      "name": "Name",
      "email": "Email"
    }
  }
}
```

## Configuration Patterns

### Default Configuration

```typescript
const defaultConfig = {
  defaultLocale: 'en',
  supportedLocales: ['en', 'es'],
  debug: process.env.NODE_ENV === 'development',
};
```

### Detection Strategy

The system uses this priority order for language detection:

1. Navigator (browser language)
2. Query string parameter
3. Cookie
4. Local storage

## Development Workflow

### Adding New Translations

1. Add keys to `libs/shared/i18n/locales/en.json` (source)
2. Run lingo.dev sync to update target languages
3. Keys are automatically available via `t()` function

### Managing Translations

- Configuration file: `i18n.json` (root level)
- Source locale: `en`
- Target locales: `es` (configurable)
- Schema validation via lingo.dev

## AI Assistant Guidelines

When helping with i18n tasks:

1. **Always check existing patterns** in the codebase before suggesting new approaches
2. **Use the established hooks** (`useTranslation`, `useLanguage`) rather than direct i18next usage
3. **Follow the static bundling pattern** - translations are imported at build time
4. **Maintain type safety** by using the provided TypeScript interfaces
5. **Test with both source and target languages** when adding new features

## Common Tasks for AI

### Adding New Translation Keys

```typescript
// 1. Add to en.json
{
  "newFeature": "New Feature",
  "newFeature.description": "This is a new feature"
}

// 2. Use in component
const { t } = useTranslation();
return <h1>{t('newFeature')}</h1>;
```

### Creating Language-Aware Components

```tsx
import { useLanguage, useTranslation } from '@cloud/shared/i18n';

function MyComponent() {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  // Use currentLanguage for locale-specific logic
  const dateFormat = currentLanguage === 'es' ? 'DD/MM/YYYY' : 'MM/DD/YYYY';

  return (
    <div>
      {t('dateLabel')}: {formatDate(date, dateFormat)}
    </div>
  );
}
```

### Handling Pluralization

```json
{
  "itemCount": "{{count}} item",
  "itemCount_other": "{{count}} items"
}
```

```tsx
const { t } = useTranslation();
return <span>{t('itemCount', { count: items.length })}</span>;
```

## Performance Considerations

- Translations are statically bundled at build time
- No dynamic loading - all supported locales are included in bundle
- Language detection runs once on initialization
- Cookie caching prevents repeated detection on reload

## Integration Points

- **Dashboard**: Translation section provides UI for managing the system
- **Developer Samples**: Examples and playground for testing translations
- **Build System**: Vite handles static imports and bundling
- **Type System**: Full TypeScript support for translation keys and configuration

## Troubleshooting

### Common Issues

1. **Missing translations**: Check if key exists in source locale file
2. **Language not switching**: Verify language is in `supportedLocales` array
3. **Types not working**: Ensure proper imports from `@cloud/shared/i18n`

### Debug Mode

Enable debug logging by setting `debug: true` in i18n config or `NODE_ENV=development`.
