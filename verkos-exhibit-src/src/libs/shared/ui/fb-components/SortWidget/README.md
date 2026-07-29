# SortWidget

A comprehensive sort selection widget component that provides radio button selections for sorting options and directions, with a reset functionality.

## Features

- ✅ **Accessible**: Full ARIA support with proper labels and roles
- ✅ **Keyboard Navigation**: Complete keyboard support for all interactions
- ✅ **Optimized**: Uses useCallback for event handlers to prevent unnecessary re-renders
- ✅ **TypeScript**: Full type safety with comprehensive interfaces
- ✅ **Customizable**: Flexible styling and configuration options
- ✅ **Responsive**: Scrollable content with configurable dimensions
- ✅ **Design System Integration**: Uses fb-components design tokens
- ✅ **Dual Mode**: Static widget or dropdown with trigger support
- ✅ **Positioning**: Flexible placement options (bottom-left, bottom-right, top-left, top-right)
- ✅ **Click Outside**: Automatic dropdown closing when clicking outside
- ✅ **Controlled/Uncontrolled**: Supports both controlled and uncontrolled dropdown state

## Usage

### Static Mode (Basic Example)

```tsx
import { SortWidget, SortOption, SortDirection } from '@flytbase/fb-components';

const sortOptions: SortOption[] = [
  { id: 'created', label: 'Created on' },
  { id: 'updated', label: 'Updated on' },
  { id: 'device', label: 'Device' },
];

const sortDirections: SortDirection[] = [
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
];

function MyComponent() {
  const [selectedSort, setSelectedSort] = useState('created');
  const [selectedDirection, setSelectedDirection] = useState('newest');

  return (
    <SortWidget
      sortOptions={sortOptions}
      sortDirections={sortDirections}
      selectedSortOption={selectedSort}
      selectedSortDirection={selectedDirection}
      onSortOptionChange={setSelectedSort}
      onSortDirectionChange={setSelectedDirection}
      onReset={() => {
        setSelectedSort('created');
        setSelectedDirection('newest');
      }}
    />
  );
}
```

### Dropdown Mode Example

```tsx
import { SortWidget, SortOption, SortDirection } from '@flytbase/fb-components';
import { Button } from '@flytbase/fb-components';

const sortOptions: SortOption[] = [
  { id: 'created', label: 'Created on' },
  { id: 'updated', label: 'Updated on' },
  { id: 'device', label: 'Device' },
];

const sortDirections: SortDirection[] = [
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
];

function DropdownSortWidget() {
  const [selectedSort, setSelectedSort] = useState('created');
  const [selectedDirection, setSelectedDirection] = useState('newest');

  return (
    <SortWidget
      sortOptions={sortOptions}
      sortDirections={sortDirections}
      selectedSortOption={selectedSort}
      selectedSortDirection={selectedDirection}
      onSortOptionChange={setSelectedSort}
      onSortDirectionChange={setSelectedDirection}
      onReset={() => {
        setSelectedSort('created');
        setSelectedDirection('newest');
      }}
      // Dropdown props
      trigger={<Button variant="secondary">Sort Options</Button>}
      placement="bottom-left"
    />
  );
}
```

### Controlled Dropdown Example

```tsx
import { SortWidget, SortOption, SortDirection } from '@flytbase/fb-components';

function ControlledDropdownSort() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState('created');

  return (
    <SortWidget
      sortOptions={sortOptions}
      sortDirections={sortDirections}
      selectedSortOption={selectedSort}
      onSortOptionChange={setSelectedSort}
      // Controlled dropdown
      trigger={<button>Custom Trigger</button>}
      isOpen={isOpen}
      onToggle={setIsOpen}
      placement="bottom-right"
    />
  );
}
```

### Advanced Example with Disabled Options

```tsx
import { SortWidget, SortOption, SortDirection } from '@flytbase/fb-components';

const sortOptions: SortOption[] = [
  { id: 'created', label: 'Created on' },
  { id: 'updated', label: 'Updated on' },
  { id: 'device', label: 'Device' },
  { id: 'name', label: 'Name', disabled: true }, // Disabled option
];

const sortDirections: SortDirection[] = [
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'custom', label: 'Custom', disabled: true }, // Disabled direction
];

function AdvancedSortWidget() {
  const [selectedSort, setSelectedSort] = useState('created');
  const [selectedDirection, setSelectedDirection] = useState('newest');
  const [hasChanges, setHasChanges] = useState(false);

  const handleSortChange = (optionId: string) => {
    setSelectedSort(optionId);
    setHasChanges(true);
  };

  const handleDirectionChange = (directionId: string) => {
    setSelectedDirection(directionId);
    setHasChanges(true);
  };

  const handleReset = () => {
    setSelectedSort('created');
    setSelectedDirection('newest');
    setHasChanges(false);
  };

  return <SortWidget sortOptions={sortOptions} sortDirections={sortDirections} selectedSortOption={selectedSort} selectedSortDirection={selectedDirection} onSortOptionChange={handleSortChange} onSortDirectionChange={handleDirectionChange} onReset={handleReset} resetDisabled={!hasChanges} width="250px" maxHeight="350px" className="shadow-xl border-2" />;
}
```

### Custom Styling Example

```tsx
import { SortWidget } from '@flytbase/fb-components';

function CustomStyledSortWidget() {
  return (
    <SortWidget
      sortOptions={sortOptions}
      sortDirections={sortDirections}
      className="bg-background-level-2 border-primary-200"
      width="300px"
      maxHeight="400px"
      // ... other props
    />
  );
}
```

## API Reference

### SortWidget Props

| Prop                    | Type                            | Default         | Description                                                       |
| ----------------------- | ------------------------------- | --------------- | ----------------------------------------------------------------- |
| `sortOptions`           | `SortOption[]`                  | **Required**    | Array of sort options to display                                  |
| `sortDirections`        | `SortDirection[]`               | **Required**    | Array of sort direction options                                   |
| `selectedSortOption`    | `string`                        | `undefined`     | Currently selected sort option ID                                 |
| `selectedSortDirection` | `string`                        | `undefined`     | Currently selected sort direction ID                              |
| `onSortOptionChange`    | `(optionId: string) => void`    | `undefined`     | Callback when sort option is selected                             |
| `onSortDirectionChange` | `(directionId: string) => void` | `undefined`     | Callback when sort direction is selected                          |
| `onReset`               | `() => void`                    | `undefined`     | Callback when reset button is clicked                             |
| `resetDisabled`         | `boolean`                       | `false`         | Whether the reset button should be disabled                       |
| `className`             | `string`                        | `''`            | Additional CSS class name                                         |
| `width`                 | `string`                        | `'220px'`       | Width of the widget                                               |
| `maxHeight`             | `string`                        | `'300px'`       | Maximum height before scrolling                                   |
| `trigger`               | `ReactNode`                     | `undefined`     | Trigger element to toggle the sort widget (enables dropdown mode) |
| `placement`             | `SortWidgetPlacement`           | `'bottom-left'` | Placement of the dropdown relative to trigger                     |
| `isOpen`                | `boolean`                       | `undefined`     | Whether the dropdown is controlled externally                     |
| `onToggle`              | `(open: boolean) => void`       | `undefined`     | Callback when dropdown open state changes                         |
| `triggerClassName`      | `string`                        | `''`            | Additional CSS class name for the trigger container               |

### SortOption Interface

```tsx
interface SortOption {
  /** Unique identifier for the sort option */
  id: string;
  /** Display label for the sort option */
  label: string;
  /** Whether this option is disabled */
  disabled?: boolean;
}
```

### SortDirection Interface

```tsx
interface SortDirection {
  /** Unique identifier for the sort direction */
  id: string;
  /** Display label for the sort direction */
  label: string;
  /** Whether this option is disabled */
  disabled?: boolean;
}
```

### SortWidgetPlacement Type

```tsx
type SortWidgetPlacement = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
```

## Component Modes

The SortWidget supports two distinct modes of operation:

### Static Mode

- **When**: No `trigger` prop is provided
- **Behavior**: Widget is always visible and rendered inline
- **Use Case**: Dedicated sort panels, embedded widgets, always-visible controls

### Dropdown Mode

- **When**: `trigger` prop is provided
- **Behavior**: Widget is hidden until trigger is clicked, positioned relative to trigger
- **Use Case**: Space-saving interfaces, context menus, toolbar buttons

### Dropdown State Management

#### Uncontrolled Mode (Default)

```tsx
<SortWidget
  {...props}
  trigger={<Button>Sort</Button>}
  // Component manages its own open/close state
/>
```

#### Controlled Mode

```tsx
<SortWidget
  {...props}
  trigger={<Button>Sort</Button>}
  isOpen={isOpen}
  onToggle={setIsOpen}
  // Parent component controls open/close state
/>
```

### Positioning

The dropdown can be positioned in four locations relative to the trigger:

- **`bottom-left`**: Below trigger, aligned to left edge (default)
- **`bottom-right`**: Below trigger, aligned to right edge
- **`top-left`**: Above trigger, aligned to left edge
- **`top-right`**: Above trigger, aligned to right edge

## Styling

The SortWidget uses the fb-components design system tokens:

### Colors

- **Background**: `background-level-1`
- **Border**: `outline-primary`
- **Text**: `text-1` (normal), `text-disabled` (disabled), `text-2` (reset button hover)
- **Hover**: `surface-hover`

### Typography

- Uses `fb-body-2` for option labels
- Inherits font family from design system (`font-inter`)

### Spacing

- Internal padding: `p-2` for content, `px-4 py-3` for footer
- Item spacing: `gap-2` for radio button and label
- Border radius: `rounded-lg` (8px)

## Accessibility

The SortWidget is fully accessible and follows WCAG guidelines:

### ARIA Support

- `role="menu"` on the main container
- `aria-label="Sort options"` for screen readers
- `role="menuitemradio"` on each option container
- `aria-checked` attributes for selection state
- Descriptive `aria-label` for each radio button
- `role="button"` on dropdown trigger (when in dropdown mode)
- `aria-expanded` to indicate dropdown state
- `aria-haspopup="menu"` on trigger to indicate menu popup

### Keyboard Navigation

- **Tab**: Navigate between radio buttons and reset button
- **Space/Enter**: Select focused radio button or activate reset button
- **Arrow Keys**: Navigate between radio buttons in the same group
- **Enter/Space on Trigger**: Open/close dropdown (when in dropdown mode)
- **Escape**: Close dropdown (when in dropdown mode)

### Screen Reader Support

- Meaningful labels for each option (e.g., "Sort by Created on")
- Clear indication of selection states
- Proper grouping of related options

## Performance

- **Optimized Callbacks**: Uses `useCallback` for event handlers to prevent unnecessary handler re-creation
- **Efficient Updates**: Lightweight component that renders quickly without unnecessary optimizations
- **No Over-Engineering**: Avoids React.memo unless performance issues are measured and confirmed

## Browser Support

Supports all modern browsers:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Testing

The component includes comprehensive tests covering:

### Rendering Tests

- ✅ Renders without crashing
- ✅ Displays all sort options and directions
- ✅ Shows correct selection states
- ✅ Handles disabled states
- ✅ Renders divider and reset button

### Interaction Tests

- ✅ Sort option selection callbacks
- ✅ Sort direction selection callbacks
- ✅ Reset button functionality
- ✅ Disabled option handling
- ✅ Keyboard navigation

### Accessibility Tests

- ✅ ARIA attributes
- ✅ Screen reader labels
- ✅ Keyboard navigation
- ✅ Focus management

### Edge Cases

- ✅ Empty options array
- ✅ No selected options
- ✅ Multiple disabled options
- ✅ Missing callbacks

### Dropdown Mode Tests

- ✅ Static vs dropdown mode rendering
- ✅ Trigger click functionality
- ✅ Click outside behavior
- ✅ Controlled vs uncontrolled state
- ✅ Positioning classes
- ✅ ARIA attributes for dropdown
- ✅ Keyboard interaction on trigger
- ✅ Integration across both modes

## Migration Notes

If upgrading from an older version:

1. **Breaking Changes**: None - all existing props work as before
2. **New Features**:
   - Added dropdown/trigger support with `trigger`, `placement`, `isOpen`, `onToggle`, `triggerClassName` props
   - Added `useClickOutside` hook to shared hooks library
   - Added `resetDisabled` prop for better UX control
3. **Deprecations**: None

### Migrating to Dropdown Mode

**Before (Static only):**

```tsx
<SortWidget
  sortOptions={options}
  sortDirections={directions}
  // ... other props
/>
```

**After (Dropdown mode):**

```tsx
<SortWidget
  sortOptions={options}
  sortDirections={directions}
  // ... other props
  trigger={<Button>Sort</Button>}
  placement="bottom-left"
/>
```

## Related Components

- **Radio**: Used internally for option selection
- **Button**: Used for reset functionality
- **Separator**: Used for visual division
- **Menu**: Similar dropdown functionality
- **FilterWidget**: Similar filtering functionality

## Examples Repository

Find more examples and use cases in the [fb-components Storybook](storybook-link).

## Support

For issues or questions:

1. Check the [FAQ](faq-link)
2. Search [existing issues](issues-link)
3. Create a [new issue](new-issue-link)
