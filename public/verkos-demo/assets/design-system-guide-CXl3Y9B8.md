# FlytBase Design System

## Overview

FlytBase uses a comprehensive design system built on Tailwind CSS with custom tokens for colors, typography, and spacing.

## Reference App

**All apps** use the shared design system from `libs/shared/ui`

## Color System

### Background Colors

```typescript
// Main backgrounds (darkest to lightest)
bg - background; // hsla(240, 6%, 7%, 1)   - Main app background
bg - background - level - 1; // hsla(240, 3%, 12%, 1)  - Cards, panels
bg - background - level - 2; // hsla(240, 1%, 15%, 1)  - Elevated surfaces
bg - background - level - 3; // hsla(240, 2%, 18%, 1)  - More elevated
bg - background - level - 4; // hsla(240, 2%, 22%, 1)  - Highest elevation
bg - background - level - 5; // hsla(240, 2%, 26%, 1)  - Maximum elevation
```

### Text Colors

```typescript
text - text - 1; // hsla(0, 0%, 100%, 0.84) - Primary text
text - text - 2; // hsla(0, 0%, 100%, 0.54) - Secondary text
text - text - disabled; // hsla(0, 0%, 100%, 0.24) - Disabled text
```

### Primary Colors

```typescript
// Primary blue (FlytBase brand color)
bg - primary - 50; // Lightest
bg - primary - 100;
bg - primary - 200; // Primary - Most commonly used
bg - primary - 300;
bg - primary - 400; // Darkest

text - primary - 200; // Primary text color

// States
bg - primary - states - hover;
bg - primary - states - pressed;
bg - primary - states - focused;
bg - primary - states - disabled;
```

### Secondary Colors

```typescript
bg - secondary - 50;
bg - secondary - 100;
bg - secondary - 200; // Secondary - Most commonly used
bg - secondary - 300;
bg - secondary - 400;
```

### Surface Colors (Hover States)

```typescript
bg - surface; // hsla(240, 6%, 93%, 0.08)
bg - surface - hover; // hsla(240, 6%, 93%, 0.10)
bg - surface - pressed; // hsla(240, 6%, 93%, 0.12)
bg - surface - focused; // hsla(240, 6%, 93%, 0.10)
bg - surface - selected; // hsla(223, 25%, 34%, 1)
```

### Outline/Border Colors

```typescript
border - outline - primary; // hsla(0, 0%, 100%, 0.12) - Primary borders
border - outline - secondary; // hsla(0, 0%, 100%, 0.08) - Secondary borders
border - outline - disabled; // hsla(0, 0%, 100%, 0.04) - Disabled borders
```

### Status Colors

```typescript
// Success (green)
bg - success - 50, bg - success - 40, bg - success - 30, bg - success - 20, bg - success - 10;
text - success - 30;
bg - success - container; // For backgrounds

// Error (red)
bg - error - 50, bg - error - 40, bg - error - 30, bg - error - 20, bg - error - 10;
text - error - 30;
bg - error - container;

// Warning (orange)
bg - warning - 50, bg - warning - 40, bg - warning - 30, bg - warning - 20, bg - warning - 10;
text - warning - 30;
bg - warning - container;

// Caution (yellow)
bg - caution - 50, bg - caution - 40, bg - caution - 30, bg - caution - 20, bg - caution - 10;
text - caution - 30;
bg - caution - container;

// Info (blue)
bg - info - 50, bg - info - 40, bg - info - 30, bg - info - 20, bg - info - 10;
text - info - 30;
bg - info - container;
```

## Typography

### Heading Classes

```typescript
fb - h1; // 48px, font-weight: 700
fb - h2; // 36px, font-weight: 700
fb - h3; // 24px, font-weight: 600
fb - h4; // 20px, font-weight: 600
fb - h5; // 18px, font-weight: 600
fb - h6; // 16px, font-weight: 600
```

### Body Text Classes

```typescript
// Regular weight (400)
fb - body - 1; // 16px - Large body text
fb - body - 2; // 14px - Standard body text
fb - body - 3; // 13px - Small body text
fb - body - 4; // 12px - Extra small body text

// Medium weight (500)
fb - body - 5; // 14px - Emphasized text
fb - body - 6; // 12px - Small emphasized text
```

### Usage Examples

```typescript
<h1 className="fb-h1 text-text-1">Main Heading</h1>
<h2 className="fb-h2 text-text-1">Section Heading</h2>
<p className="fb-body-2 text-text-2">Regular paragraph text</p>
<span className="fb-body-4 text-text-disabled">Helper text</span>
```

## Icons

### FontAwesome Icons

FlytBase uses FontAwesome Pro (included globally).

```typescript
// Solid icons (most common)
<i className="fa-solid fa-user"></i>
<i className="fa-solid fa-gear"></i>
<i className="fa-solid fa-house"></i>
<i className="fa-solid fa-xmark"></i>
<i className="fa-solid fa-check"></i>
<i className="fa-solid fa-chevron-right"></i>
<i className="fa-solid fa-circle-info"></i>
<i className="fa-solid fa-triangle-exclamation"></i>

// Regular icons
<i className="fa-regular fa-heart"></i>
<i className="fa-regular fa-circle"></i>

// Light icons
<i className="fa-light fa-star"></i>

// Icon sizes
<i className="fa-solid fa-user text-xs"></i>    // 12px
<i className="fa-solid fa-user text-sm"></i>    // 14px
<i className="fa-solid fa-user text-base"></i>  // 16px
<i className="fa-solid fa-user text-lg"></i>    // 18px
<i className="fa-solid fa-user text-xl"></i>    // 20px
<i className="fa-solid fa-user text-2xl"></i>   // 24px

// Icon with color
<i className="fa-solid fa-check text-success-30"></i>
<i className="fa-solid fa-xmark text-error-30"></i>
<i className="fa-solid fa-info text-info-30"></i>
```

## Spacing

FlytBase uses Tailwind's default spacing scale (4px base):

```typescript
gap - 1; // 4px
gap - 1.5; // 6px
gap - 2; // 8px
gap - 3; // 12px
gap - 4; // 16px
gap - 6; // 24px
gap - 8; // 32px

p - 1, p - 2, p - 3, p - 4; // Padding
m - 1, m - 2, m - 3, m - 4; // Margin
```

## Common UI Patterns

### Card

```typescript
<div className="bg-background-level-1 rounded-lg border border-outline-primary p-4">
  <h3 className="fb-h3 text-text-1 mb-2">Card Title</h3>
  <p className="fb-body-3 text-text-2">Card content goes here</p>
</div>
```

### Button (Primary)

```typescript
<button className="bg-primary-200 hover:bg-primary-states-hover text-white fb-body-2 px-4 py-2 rounded-lg transition-colors">
  <i className="fa-solid fa-plus mr-2"></i>
  Add Item
</button>
```

### Button (Secondary)

```typescript
<button className="bg-surface hover:bg-surface-hover text-text-1 fb-body-2 px-4 py-2 rounded-lg border border-outline-primary transition-colors">Cancel</button>
```

### Icon Button

```typescript
<button className="w-8 h-8 flex items-center justify-center hover:bg-surface rounded transition-colors">
  <i className="fa-solid fa-gear text-text-2"></i>
</button>
```

### Input Field

```typescript
<div className="flex flex-col gap-1.5">
  <label className="fb-body-5 text-text-1">Field Label</label>
  <input type="text" className="bg-background-level-2 border border-outline-primary rounded-lg px-3 py-2 fb-body-2 text-text-1 placeholder:text-text-disabled focus:border-primary-200 focus:outline-none transition-colors" placeholder="Enter value..." />
  <span className="fb-body-6 text-text-2">Helper text</span>
</div>
```

### Select Dropdown

```typescript
<div className="flex flex-col gap-1.5">
  <label className="fb-body-5 text-text-1">Select Option</label>
  <select className="bg-background-level-2 border border-outline-primary rounded-lg px-3 py-2 fb-body-2 text-text-1 focus:border-primary-200 focus:outline-none">
    <option value="">Choose...</option>
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
  </select>
</div>
```

### Alert/Toast Messages

```typescript
// Success
<div className="bg-success-container border border-success-30 rounded-lg p-3 flex items-center gap-2">
  <i className="fa-solid fa-check text-success-30"></i>
  <span className="fb-body-3 text-success-30">Operation successful!</span>
</div>

// Error
<div className="bg-error-container border border-error-30 rounded-lg p-3 flex items-center gap-2">
  <i className="fa-solid fa-triangle-exclamation text-error-30"></i>
  <span className="fb-body-3 text-error-30">An error occurred</span>
</div>

// Warning
<div className="bg-warning-container border border-warning-30 rounded-lg p-3 flex items-center gap-2">
  <i className="fa-solid fa-circle-exclamation text-warning-30"></i>
  <span className="fb-body-3 text-warning-30">Warning message</span>
</div>
```

### Loading Spinner

```typescript
<div className="flex items-center justify-center p-4">
  <i className="fa-solid fa-spinner fa-spin text-primary-200 text-2xl"></i>
</div>
```

### Divider

```typescript
<div className="h-px bg-outline-primary my-4"></div>
<div className="w-px bg-outline-primary mx-4"></div>
```

## Best Practices

1. **Use design tokens** - Never hardcode colors or spacing
2. **Follow hierarchy** - Use background-level-X for depth perception
3. **Maintain consistency** - Use the same patterns across the app
4. **Accessibility** - Ensure sufficient color contrast
5. **Responsive design** - Use Tailwind's responsive utilities
6. **Dark theme first** - FlytBase is primarily dark-themed
7. **Icon consistency** - Use FontAwesome icons consistently
8. **Typography scale** - Stick to defined fb-\* classes

## Transition and Animation

```typescript
// Standard transitions
transition-colors    // For color changes
transition-all       // For multiple properties
duration-200         // 200ms (default)
duration-300         // 300ms

// Hover effects (always include transitions)
hover:bg-surface-hover transition-colors
hover:scale-105 transition-transform
```

## Layout Utilities

```typescript
// Flexbox
flex items-center justify-between gap-3
flex-col
flex-1

// Grid
grid grid-cols-2 gap-4
grid-cols-1 md:grid-cols-2 lg:grid-cols-3

// Positioning
relative absolute top-0 left-0
sticky top-0

// Overflow
overflow-auto
overflow-hidden
overflow-x-auto
```
