// Legacy Input component - original API
export { default as Input } from './Input';
export type { InputProps, InputSize, InputVariant, InputState } from './Input';

// Modern Input component - CVA version
export {
  ModernInput,
  SimpleInput,
  FloatingLabelInput,
  inputVariants,
  inputWrapperVariants,
  inputLabelVariants,
  inputDescriptionVariants,
  inputIconVariants,
} from './ModernInput';
export type { ModernInputProps, FloatingLabelInputProps } from './ModernInput';
