# Tailwind CSS Guidelines

## 1. Configuration

- Tailwind CSS is configured in `libs/shared/ui/tailwind.config.js`
- Design tokens are defined in `libs/shared/configs/` and automatically integrated

## 2. FlytBase Design System

This style guide defines the proper usage of FlytBase design tokens for consistent styling across all applications.

### Design Token Architecture

The FlytBase design system uses semantic design tokens organized into three main categories:

1. **Colors**: Semantic color tokens defined in `libs/shared/configs/colors.ts`
2. **Typography**: Typography tokens with `fb-` prefix defined in `libs/shared/configs/typography.ts`
3. **Spacing**: Standard Tailwind spacing scale with semantic documentation

### Color Design Tokens

#### Core Color Categories

**Background Tokens:**

- `bg-background-level-1` - Primary background
- `bg-background-level-2` - Secondary background
- `bg-background-level-3` - Tertiary background
- `bg-background-level-4` - Fourth level background
- `bg-background-level-5` - Fifth level background

**Text Tokens:**

- `text-text-1` - Primary text
- `text-text-2` - Secondary text
- `text-text-3` - Tertiary text

**Primary Color Tokens:**

- `bg-primary-50` through `bg-primary-400` - Primary color variants
- `bg-primary-states-hover` - Primary hover state
- `bg-primary-states-pressed` - Primary pressed state

**Status Color Tokens:**

- `bg-success-30`, `text-success-10` - Success states
- `bg-error-30`, `text-error-10` - Error states
- `bg-warning-30`, `text-warning-10` - Warning states
- `bg-info-30`, `text-info-10` - Info states

**Surface & Outline Tokens:**

- `bg-surface` - Surface background
- `bg-surface-hover` - Surface hover state
- `bg-surface-pressed` - Surface pressed state
- `border-outline-primary` - Primary borders
- `border-outline-secondary` - Secondary borders

### Typography Design Tokens

All typography uses the `fb-` prefix with semantic naming:

#### Typography Classes

**Heading Styles:**

- `fb-mega` - Largest heading text

**Title Styles:**

- `fb-title1-semi` - Title 1 Semi (18px, 600 weight)
- `fb-title2-medium` - Title 2 Medium (18px, 500 weight)
- `fb-title1-medium` - Title 1 Medium (16px, 500 weight)
- `fb-title2-regular` - Title 2 Regular (16px, 400 weight)

**Body Styles:**

- `fb-body1-medium` - Body 1 Medium (14px, 500 weight)
- `fb-body2-regular` - Body 2 Regular (14px, 400 weight)
- `fb-body3-mono` - Body 3 Mono (14px, 400 weight, Fira Code)
- `fb-body4-medium` - Body 4 Medium (12px, 500 weight)
- `fb-body5-regular` - Body 5 Regular (12px, 400 weight)
- `fb-body6` - Body 6 (12px, 400 weight)

**Tiny Styles:**

- `fb-tiny1-medium` - Tiny 1 Medium (11px, 500 weight)
- `fb-tiny2-medium` - Tiny 2 Medium (10px, 500 weight)

### Icon Library Guidelines

**Icon Selection Strategy**: Choose the most appropriate icon library based on the specific icon needs and context:

- **Lucide React**: Modern, clean icons ideal for UI actions and interface elements

  ```tsx
  import { Search, Filter, Plus, Edit } from 'lucide-react';
  <Search className="w-4 h-4 text-text-2" />;
  ```

- **Font Awesome**: Comprehensive icon set for specialized icons and legacy compatibility
  ```tsx
  <i className="fa-solid fa-chart-bar text-text-2" />
  ```

**Selection Guidelines**:

- Use **Lucide React** for modern UI interactions (search, edit, navigation)
- Use **Font Awesome** when specific icons aren't available in Lucide React
- Maintain consistency within component families
- Follow existing patterns in similar components

### Component Examples Using Design Tokens

#### Buttons

##### Primary Action Buttons

```tsx
<Button className="bg-primary-200 hover:bg-primary-states-hover text-text-1 focus:ring-2 focus:ring-primary-100">
  <span className="fb-body2-regular">Primary Action</span>
</Button>
```

##### Secondary Buttons

```tsx
<Button variant="outline" className="bg-surface hover:bg-surface-hover text-text-1 border border-outline-primary">
  <span className="fb-body2-regular">Secondary Action</span>
</Button>
```

##### Tertiary/Text Buttons

```tsx
<Button variant="ghost" className="bg-transparent text-primary-100 hover:text-primary-50">
  <span className="fb-body2-regular">Tertiary Action</span>
</Button>
```

##### Status Buttons

```tsx
<Button className="bg-success-30 text-success-10">
  <span className="fb-body2-regular">Success Action</span>
</Button>
<Button className="bg-error-30 text-error-10">
  <span className="fb-body2-regular">Error Action</span>
</Button>
```

##### Disabled Buttons

```tsx
<Button disabled className="bg-background-level-2 text-text-3 border border-outline-secondary">
  <span className="fb-body2-regular">Disabled Button</span>
</Button>
```

#### Navigation & Tabs

##### Navigation Items

```tsx
<nav>
  <a className="text-text-2 hover:bg-surface-hover p-3 rounded">
    <span className="fb-body2-regular">Default Item</span>
  </a>
  <a className="bg-surface text-primary-100 p-3 rounded">
    <span className="fb-body2-regular">Active Item</span>
  </a>
</nav>
```

##### Tabs

```tsx
<TabsList className="bg-background-level-2 p-1">
  <TabsTrigger value="tab1" className="text-text-2 hover:text-text-1 data-[state=active]:bg-surface data-[state=active]:text-primary-100">
    <span className="fb-body2-regular">Tab 1</span>
  </TabsTrigger>
</TabsList>
```

#### Cards & Containers

##### Cards

```tsx
<Card className="bg-background-level-1 border border-outline-primary rounded-lg">
  <CardHeader className="p-6">
    <CardTitle className="fb-title2-medium text-text-1">Card Title</CardTitle>
  </CardHeader>
  <CardContent className="p-6 pt-0">
    <p className="fb-body2-regular text-text-2">Card Content</p>
  </CardContent>
</Card>
```

##### Filter Panel

```tsx
<div className="bg-background-level-2 border border-outline-primary p-4 rounded-lg">
  <h3 className="fb-title2-medium text-text-1 mb-3">Filter Panel</h3>
  <div className="fb-body2-regular text-text-2">Filter Panel Content</div>
</div>
```

#### Input Elements

##### Text Inputs

```tsx
<div className="space-y-2">
  <Label className="fb-body2-regular text-text-1">Input Label</Label>
  <Input className="bg-background-level-2 border border-outline-primary text-text-1 focus:ring-2 focus:ring-primary-100 focus:border-primary-200" />
</div>

<!-- Error State -->
<Input className="bg-background-level-2 border border-error-30 text-text-1 focus:ring-2 focus:ring-error-30" />
```

##### Search Bar

```tsx
<SearchBar className="bg-background-level-2 border border-outline-primary text-text-1 focus:ring-2 focus:ring-primary-100">
  <span className="fb-body2-regular">Search placeholder...</span>
</SearchBar>
```

#### Typography Examples

##### Headings

```tsx
<h1 className="fb-mega text-text-1">Main Heading</h1>
<h2 className="fb-title1-semi text-text-1">Section Heading</h2>
<h3 className="fb-title2-medium text-text-1">Subsection Heading</h3>
```

##### Body Text

```tsx
<p className="fb-body1-medium text-text-1">Primary body text</p>
<p className="fb-body2-regular text-text-2">Secondary body text</p>
<p className="fb-tiny1-medium text-text-3">Helper text</p>
```

##### Code Text

```tsx
<code className="fb-body3-mono bg-background-level-2 text-text-1 px-2 py-1 rounded">Code snippet</code>
```

#### Layout Components

##### Split View Divider

```tsx
<div className="h-full w-1 bg-outline-primary hover:bg-primary-300 cursor-col-resize"></div>
```

##### Detail Panel

```tsx
<div className="bg-background-level-1 border border-outline-primary p-6 rounded-lg">
  <h3 className="fb-title2-medium text-text-1 mb-4">Detail Panel</h3>
  <div className="space-y-3">
    <p className="fb-body2-regular text-text-2">Panel content goes here</p>
    <div className="fb-body5-regular text-text-3">Additional details</div>
  </div>
</div>
```

## Design Token Best Practices

### 1. Use Semantic Names

```tsx
// ✅ CORRECT - Semantic design tokens
className = 'bg-background-level-1 text-text-1 border border-outline-primary';

// ❌ INCORRECT - Hardcoded colors
className = 'bg-[rgb(32,32,32)] text-[rgb(255,255,255)] border border-[rgb(38,38,38)]';
```

### 2. Use Typography Tokens

```tsx
// ✅ CORRECT - Typography design tokens
<h1 className="fb-title1-semi">Heading</h1>
<p className="fb-body2-regular">Body text</p>

// ❌ INCORRECT - Arbitrary text classes
<h1 className="text-xl font-semibold">Heading</h1>
<p className="text-base">Body text</p>
```

### 3. Use Standard Spacing

```tsx
// ✅ CORRECT - Standard Tailwind spacing
<div className="p-4 m-6 gap-3 space-y-4">

// ❌ INCORRECT - Arbitrary spacing
<div className="p-[16px] m-[24px] gap-[12px]">
```

### 4. Layer Design Tokens Appropriately

```tsx
// ✅ CORRECT - Proper layering
<Card className="bg-background-level-1 border border-outline-primary">
  <div className="bg-background-level-2 p-4">
    <h3 className="fb-title2-medium text-text-1">Title</h3>
    <p className="fb-body2-regular text-text-2">Description</p>
  </div>
</Card>
```

## Configuration Reference

### Accessing Design Tokens

Design tokens are automatically available in Tailwind through:

1. **Colors**: Imported from `libs/shared/configs/colors.ts`
2. **Typography**: Generated from `libs/shared/configs/typography.ts` with `fb-` prefix
3. **Spacing**: Standard Tailwind spacing scale

### Integration Example

```typescript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: require('./libs/shared/configs/colors').getTailwindColors(),
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = require('./libs/shared/configs/typography').getTailwindTypography();
      addUtilities(newUtilities, ['responsive', 'hover']);
    },
  ],
};
```

## Design System Exploration

To explore all available design tokens and see live examples:

1. **Design System App**: Navigate to `/apps/design-system/`
2. **Color Tokens**: View all color tokens in the Colors page
3. **Typography**: See all typography tokens in the Typography page
4. **Components**: Explore component examples showing proper token usage

This ensures consistent styling across all FlytBase applications while maintaining design system integrity.

## FlytBase UI Components Guide

The FlytBase design system provides a comprehensive set of pre-built components in `@libs/shared/ui/fb-components/` that should be used instead of creating custom components. These components are designed to work seamlessly with the FlytBase design tokens and provide consistent user experience across all applications.

### Available Components

#### Form Components

##### Button Component

Located at `@libs/shared/ui/fb-components/Button/Button.tsx`

**Variants**: `primary`, `secondary`, `outline`, `text`, `number`  
**Sizes**: `xs`, `sm`, `md`, `lg`

```tsx
import { Button } from '@libs/shared/ui/fb-components/Button';

// Primary button with design tokens
<Button variant="primary" size="md" className="bg-primary-200 hover:bg-primary-states-hover">
  <span className="fb-body2-regular">Primary Action</span>
</Button>

// Secondary button
<Button variant="secondary" size="md" className="bg-surface hover:bg-surface-hover">
  <span className="fb-body2-regular">Secondary Action</span>
</Button>

// Outline button
<Button variant="outline" size="md" className="border-outline-primary text-text-1">
  <span className="fb-body2-regular">Outline Action</span>
</Button>

// Text button
<Button variant="text" size="sm" className="text-primary-100 hover:text-primary-50">
  <span className="fb-body2-regular">Text Action</span>
</Button>

// With icons
<Button variant="primary" leftIcon={<i className="fa-solid fa-plus" />}>
  <span className="fb-body2-regular">Add Item</span>
</Button>
```

##### SearchBar Component

Located at `@libs/shared/ui/fb-components/SearchBar/SearchBar.tsx`

```tsx
import { SearchBar } from '@libs/shared/ui/fb-components/SearchBar';

// Controlled search bar
<SearchBar
  value={searchValue}
  onChange={(value) => setSearchValue(value)}
  placeholder="Search assets..."
  className="bg-background-level-2 border-outline-primary text-text-1"
/>

// Uncontrolled search bar with clear function
<SearchBar
  onClear={() => handleClear()}
  placeholder="Search..."
  className="min-w-96"
/>
```

##### Input Component

Located at `@libs/shared/ui/fb-components/Input/Input.tsx`

```tsx
import { Input } from '@libs/shared/ui/fb-components/Input';

// Standard input with design tokens
<Input
  placeholder="Enter asset name"
  className="bg-background-level-2 border-outline-primary text-text-1 focus:ring-primary-100"
/>

// Input with label
<div className="space-y-2">
  <label className="fb-body2-regular text-text-1">Asset Name</label>
  <Input className="bg-background-level-2 border-outline-primary" />
</div>
```

##### Checkbox Component

Located at `@libs/shared/ui/fb-components/Checkbox/Checkbox.tsx`

```tsx
import { Checkbox } from '@libs/shared/ui/fb-components/Checkbox';

// Standard checkbox
<Checkbox
  checked={isChecked}
  onChange={(checked) => setIsChecked(checked)}
  className="text-primary-100"
/>

// Checkbox with label
<div className="flex items-center space-x-2">
  <Checkbox checked={isSelected} onChange={handleChange} />
  <label className="fb-body2-regular text-text-1">Enable notifications</label>
</div>
```

##### Radio Component

Located at `@libs/shared/ui/fb-components/Radio/Radio.tsx`

```tsx
import { Radio } from '@libs/shared/ui/fb-components/Radio';

// Radio group
<div className="space-y-2">
  <Radio name="assetType" value="pipeline" checked={selectedType === 'pipeline'} onChange={(value) => setSelectedType(value)} />
  <label className="fb-body2-regular text-text-1">Pipeline</label>
</div>;
```

##### NumberInput Component

Located at `@libs/shared/ui/fb-components/NumberInput/NumberInput.tsx`

```tsx
import { NumberInput } from '@libs/shared/ui/fb-components/NumberInput';

// Number input with min/max
<NumberInput value={count} onChange={(value) => setCount(value)} min={0} max={100} className="bg-background-level-2 border-outline-primary" />;
```

##### RangeSlider Component

Located at `@libs/shared/ui/fb-components/RangeSlider/RangeSlider.tsx`

```tsx
import { RangeSlider } from '@libs/shared/ui/fb-components/RangeSlider';

// Range slider for filters
<RangeSlider min={0} max={100} value={[minValue, maxValue]} onChange={(range) => setRange(range)} className="text-primary-100" />;
```

##### ToggleSwitch Component

Located at `@libs/shared/ui/fb-components/ToggleSwitch/ToggleSwitch.tsx`

```tsx
import { ToggleSwitch } from '@libs/shared/ui/fb-components/ToggleSwitch';

// Toggle switch
<ToggleSwitch checked={isEnabled} onChange={(checked) => setIsEnabled(checked)} className="text-primary-100" />;
```

#### Navigation Components

##### FilterWidget Component

Located at `@libs/shared/ui/fb-components/FilterWidget/FilterWidget.tsx`

```tsx
import { FilterWidget } from '@libs/shared/ui/fb-components/FilterWidget';

// Filter widget with categories
<FilterWidget
  categories={[
    {
      id: 'category',
      label: 'Category',
      options: [
        { id: 'pipeline', label: 'Pipeline' },
        { id: 'building', label: 'Building' },
      ],
      multiSelect: true,
    },
  ]}
  onFilterChange={(filters) => setFilters(filters)}
  trigger={
    <Button variant="outline" className="border-outline-primary">
      <i className="fa-solid fa-filter mr-2" />
      <span className="fb-body2-regular">Filter</span>
    </Button>
  }
  className="bg-background-level-1 border-outline-primary"
/>;
```

##### Menu Component

Located at `@libs/shared/ui/fb-components/Menu/Menu.tsx`

```tsx
import { Menu } from '@libs/shared/ui/fb-components/Menu';

// Context menu
<Menu
  items={[
    { id: 'edit', label: 'Edit Asset', icon: 'fa-solid fa-edit' },
    { id: 'delete', label: 'Delete Asset', icon: 'fa-solid fa-trash' },
  ]}
  onItemClick={(itemId) => handleMenuAction(itemId)}
  className="bg-background-level-1 border-outline-primary"
/>;
```

##### MenuItem Component

Located at `@libs/shared/ui/fb-components/MenuItem/MenuItem.tsx`

```tsx
import { MenuItem } from '@libs/shared/ui/fb-components/MenuItem';

// Menu item in lists
<MenuItem label="Asset Name" selected={isSelected} onSelect={() => handleSelect()} selectionType="single" className="hover:bg-surface-hover" />;
```

#### Action Components

##### IconButton Component

Located at `@libs/shared/ui/fb-components/IconButton/IconButton.tsx`

```tsx
import { IconButton } from '@libs/shared/ui/fb-components/IconButton';

// Icon-only button
<IconButton icon="fa-solid fa-edit" onClick={() => handleEdit()} className="text-primary-100 hover:text-primary-50" />;
```

##### FilterButton Component

Located at `@libs/shared/ui/fb-components/FilterButton/FilterButton.tsx`

```tsx
import { FilterButton } from '@libs/shared/ui/fb-components/FilterButton';

// Filter toggle button
<FilterButton active={isActive} onClick={() => toggleFilter()} className="bg-surface hover:bg-surface-hover">
  <span className="fb-body2-regular">Active Assets</span>
</FilterButton>;
```

##### FilterChip Component

Located at `@libs/shared/ui/fb-components/FilterChip/FilterChip.tsx`

```tsx
import { FilterChip } from '@libs/shared/ui/fb-components/FilterChip';

// Removable filter chip
<FilterChip label="Pipeline Assets" onRemove={() => removeFilter('pipeline')} className="bg-primary-50 text-primary-100" />;
```

##### MultiChoiceToggleButton Component

Located at `@libs/shared/ui/fb-components/MultiChoiceToggleButton/MultiChoiceToggleButton.tsx`

```tsx
import { MultiChoiceToggleButton } from '@libs/shared/ui/fb-components/MultiChoiceToggleButton';

// Multi-choice toggle
<MultiChoiceToggleButton
  options={[
    { id: 'list', label: 'List View', icon: 'fa-solid fa-list' },
    { id: 'map', label: 'Map View', icon: 'fa-solid fa-map' },
  ]}
  selected={viewMode}
  onChange={(mode) => setViewMode(mode)}
  className="bg-background-level-2 border-outline-primary"
/>;
```

##### SegmentedButton Component

Located at `@libs/shared/ui/fb-components/SegmentedButton/SegmentedButton.tsx`

```tsx
import { SegmentedButton } from '@libs/shared/ui/fb-components/SegmentedButton';

// Segmented control
<SegmentedButton
  options={[
    { id: 'all', label: 'All Assets' },
    { id: 'active', label: 'Active' },
    { id: 'inactive', label: 'Inactive' },
  ]}
  selected={statusFilter}
  onChange={(status) => setStatusFilter(status)}
  className="bg-background-level-2"
/>;
```

#### Utility Components

##### Badge Component

Located at `@libs/shared/ui/fb-components/Badge/Badge.tsx`

```tsx
import { Badge } from '@libs/shared/ui/fb-components/Badge';

// Status badge
<Badge className="bg-success-30 text-success-10 fb-tiny2-medium">
  Active
</Badge>

// Error badge
<Badge className="bg-error-30 text-error-10 fb-tiny2-medium">
  Error
</Badge>
```

##### CardMenu Component

Located at `@libs/shared/ui/fb-components/CardMenu/CardMenu.tsx`

```tsx
import { CardMenu } from '@libs/shared/ui/fb-components/CardMenu';

// Card with menu
<CardMenu
  menuItems={[
    { id: 'edit', label: 'Edit', icon: 'fa-solid fa-edit' },
    { id: 'delete', label: 'Delete', icon: 'fa-solid fa-trash' },
  ]}
  onMenuItemClick={(itemId) => handleAction(itemId)}
  className="bg-background-level-1 border-outline-primary"
>
  <div className="p-4">
    <h3 className="fb-title2-medium text-text-1">Asset Card</h3>
    <p className="fb-body2-regular text-text-2">Asset details...</p>
  </div>
</CardMenu>;
```

##### ContextMenu Component

Located at `@libs/shared/ui/fb-components/ContextMenu/ContextMenu.tsx`

```tsx
import { ContextMenu } from '@libs/shared/ui/fb-components/ContextMenu';

// Right-click context menu
<ContextMenu
  items={[
    { id: 'copy', label: 'Copy', icon: 'fa-solid fa-copy' },
    { id: 'paste', label: 'Paste', icon: 'fa-solid fa-paste' },
  ]}
  onItemSelect={(itemId) => handleContextAction(itemId)}
  className="bg-background-level-1 border-outline-primary"
/>;
```

##### ConfirmDialog Component

Located at `@libs/shared/ui/fb-components/ConfirmDialog/ConfirmDialog.tsx`

```tsx
import { ConfirmDialog } from '@libs/shared/ui/fb-components/ConfirmDialog';

// Confirmation dialog
<ConfirmDialog open={showDialog} onClose={() => setShowDialog(false)} onConfirm={() => handleConfirm()} title="Delete Asset" message="Are you sure you want to delete this asset? This action cannot be undone." confirmText="Delete" cancelText="Cancel" className="bg-background-level-1 border-outline-primary" />;
```

### Component Usage Best Practices

#### 1. Always Use FlytBase Components First

```tsx
// ✅ CORRECT - Use FlytBase components
import { Button, SearchBar, FilterWidget } from '@libs/shared/ui/fb-components';

// ❌ INCORRECT - Don't create custom components that duplicate existing ones
const CustomButton = ({ children, ...props }) => (
  <button className="custom-button" {...props}>
    {children}
  </button>
);
```

#### 2. Apply Design Tokens Consistently

```tsx
// ✅ CORRECT - Use design tokens for consistent styling
<Button className="bg-primary-200 hover:bg-primary-states-hover text-text-1">
  <span className="fb-body2-regular">Save Changes</span>
</Button>

// ❌ INCORRECT - Don't use arbitrary colors
<Button className="bg-blue-500 hover:bg-blue-600 text-white">
  <span className="text-sm">Save Changes</span>
</Button>
```

#### 3. Combine Components for Complex UI

```tsx
// ✅ CORRECT - Combine multiple FlytBase components
<div className="flex items-center gap-4">
  <SearchBar placeholder="Search assets..." className="bg-background-level-2 border-outline-primary" />
  <FilterWidget
    categories={filterCategories}
    onFilterChange={handleFilterChange}
    trigger={
      <Button variant="outline" className="border-outline-primary">
        <i className="fa-solid fa-filter mr-2" />
        <span className="fb-body2-regular">Filter</span>
      </Button>
    }
  />
  <Button variant="primary" className="bg-primary-200 hover:bg-primary-states-hover">
    <i className="fa-solid fa-plus mr-2" />
    <span className="fb-body2-regular">Add</span>
  </Button>
</div>
```

#### 4. Handle Component States Properly

```tsx
// ✅ CORRECT - Handle loading, error, and success states
<Button variant="primary" disabled={isLoading} className="bg-primary-200 hover:bg-primary-states-hover disabled:opacity-50">
  {isLoading ? <i className="fa-solid fa-spinner fa-spin mr-2" /> : <i className="fa-solid fa-save mr-2" />}
  <span className="fb-body2-regular">{isLoading ? 'Saving...' : 'Save Asset'}</span>
</Button>
```

#### 5. Maintain Accessibility

```tsx
// ✅ CORRECT - Include proper accessibility attributes
<Button variant="primary" aria-label="Add new asset" className="bg-primary-200 hover:bg-primary-states-hover">
  <i className="fa-solid fa-plus mr-2" aria-hidden="true" />
  <span className="fb-body2-regular">Add</span>
</Button>
```

### Component Import Patterns

```tsx
// ✅ CORRECT - Import from the main components index
import { Button, SearchBar, FilterWidget, Input, Checkbox } from '@libs/shared/ui/fb-components';

// ✅ CORRECT - Import individual components
import { Button } from '@libs/shared/ui/fb-components/Button';
import { SearchBar } from '@libs/shared/ui/fb-components/SearchBar';

// ❌ INCORRECT - Don't import from internal files
import Button from '@libs/shared/ui/fb-components/Button/Button.tsx';
```

This comprehensive guide ensures that all FlytBase applications maintain consistency by using the established component library while applying proper design tokens for a cohesive user experience.
