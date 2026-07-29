// Legacy Checkbox component - original API
export { default as Checkbox, default } from './Checkbox';
export type { CheckboxProps, CheckboxSize, CheckboxState } from './Checkbox';

// Modern Checkbox component - CVA version
export {
  ModernCheckbox,
  LabeledCheckbox,
  CheckboxGroup,
  checkboxVariants,
  checkboxIndicatorVariants,
  checkboxLabelVariants,
} from './ModernCheckbox';
export type {
  ModernCheckboxProps,
  LabeledCheckboxProps,
  CheckboxGroupProps,
} from './ModernCheckbox';
