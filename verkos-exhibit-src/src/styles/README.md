# Custom Styles

This directory contains custom CSS/SCSS stylesheets beyond Tailwind.

## When to Use

Use custom styles for:

- Complex animations not easily done with Tailwind
- Third-party library style overrides
- Global CSS that can't be expressed with Tailwind utilities
- Custom CSS variables and themes

## Structure

```
styles/
├── animations.scss    - Custom animations
├── overrides.scss     - Third-party library overrides
└── variables.scss     - Custom CSS variables
```

## Prefer Tailwind

Most styling should use Tailwind utilities. Only add custom CSS when:

- The design requires complex animations
- You need to override third-party library styles
- Tailwind doesn't support the required styling

## Example

```scss
// animations.scss
@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.slide-in {
  animation: slideIn 0.3s ease-out;
}
```

```scss
// overrides.scss
// Override library styles when necessary
.react-datepicker {
  @apply border-border bg-background;
}

.react-datepicker__header {
  @apply bg-muted text-foreground;
}
```

## Import in index.scss

```scss
// src/index.scss
@tailwind base;
@tailwind components;
@tailwind utilities;

@import './styles/variables.scss';
@import './styles/animations.scss';
@import './styles/overrides.scss';
```
