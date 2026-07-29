import '../styles/utils.css';
// ===================================
// LEGACY COMPONENTS
// ===================================

export { Button } from './Button';
export { IconButton } from './IconButton';
export { FilterButton } from './FilterButton';
export { MenuItem } from './MenuItem';
export { Menu } from './Menu';
export { ContextMenu } from './ContextMenu';
export { Radio } from './Radio';
export {
  RadioGroup,
  SimpleRadioGroup,
  HorizontalRadioGroup,
  CompactRadioGroup,
} from './RadioGroup';
export { FilterWidget } from './FilterWidget';
export { FilterChip } from './FilterChip';
export { SegmentedButton } from './SegmentedButton';
export { ToggleSwitch } from './ToggleSwitch';
export { Input } from './Input';
export { RangeSlider } from './RangeSlider';
export { MultiChoiceToggleButton } from './MultiChoiceToggleButton';
export { ConfirmDialog } from './ConfirmDialog';
export { CardMenu } from './CardMenu';
export { NumberInput } from './NumberInput';
export { SearchBar } from './SearchBar';
export { SortWidget } from './SortWidget';

// ===================================
// CVA COMPONENTS
// ===================================

// Basic UI Components
export { Card } from './Card';
export { SimpleLabel as Label } from './Label';
export { Separator } from './Separator';
export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
} from './Skeleton';
export { Progress, SimpleProgress, IndeterminateProgress } from './Progress';

// Form Components
export { Toggle, IconToggle, ToggleGroup as ToggleGroupBasic } from './Toggle';
export { Checkbox } from './Checkbox';
export {
  ModernCheckbox,
  LabeledCheckbox,
  CheckboxGroup,
  checkboxVariants,
  checkboxIndicatorVariants,
  checkboxLabelVariants,
} from './Checkbox';
export { Badge } from './Badge';
export {
  ModernBadge,
  StatusBadge,
  CountBadge,
  NotificationBadge,
  IconBadge,
  BadgeGroup,
} from './Badge';
export {
  ModernInput,
  SimpleInput,
  FloatingLabelInput,
  inputVariants,
  inputWrapperVariants,
  inputLabelVariants,
  inputDescriptionVariants,
  inputIconVariants,
} from './Input';
export { Textarea, SimpleTextarea } from './Textarea';
export {
  Select,
  SimpleSelect,
  MultiSelect,
  SelectRoot,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './Select';
export {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
  SimpleInputOTP,
  PinCodeInput,
  VerificationCodeInput,
} from './InputOTP';
export {
  ToggleGroup,
  ToggleGroupItem,
  SimpleToggleGroup,
  SegmentToggleGroup,
  IconToggleGroup,
} from './ToggleGroup';

// Layout Components
export { Tabs, TabsRoot, TabsList, TabsTrigger, TabsContent } from './Tabs';
export {
  Accordion,
  AccordionRoot,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from './Accordion';
export { AspectRatio, ImageAspectRatio } from './AspectRatio';
export {
  Sheet,
  SheetRoot,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from './Sheet';
export {
  Collapsible,
  SimpleCollapsible,
  CollapsibleRoot,
  CollapsibleTrigger,
  CollapsibleContent,
} from './Collapsible';
export {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from './Resizable';
export {
  ScrollArea,
  VerticalScrollArea,
  HorizontalScrollArea,
  SimpleScrollArea,
} from './ScrollArea';
export {
  Table,
  TableContainer,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
  CompleteTable,
} from './Table';

// Navigation Components
export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  SimpleAvatar,
  UserAvatar,
  AvatarGroup,
} from './Avatar';
export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
  SimpleBreadcrumb,
} from './Breadcrumb';
export {
  Calendar,
  DateRangeCalendar,
  DatePicker,
  SimpleCalendar,
} from './Calendar';
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  SimpleDropdownMenu,
} from './DropdownMenu';
export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
  SimpleMenubar,
} from './Menubar';
export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  SimpleNavigationMenu,
  HeaderNavigationMenu,
} from './NavigationMenu';
export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  SimplePagination,
} from './Pagination';
export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
  SimpleCommand,
} from './Command';

// Overlay Components
export {
  Tooltip,
  SimpleTooltip,
  HelpTooltip,
  KeyboardTooltip,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
} from './Tooltip';
export {
  Popover,
  SimplePopover,
  ConfirmationPopover,
  MenuPopover,
  PopoverRoot,
  PopoverTrigger,
  PopoverClose,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
} from './Popover';
export {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  SimpleHoverCard,
  UserProfileHoverCard,
} from './HoverCard';
export {
  Dialog,
  ConfirmDialog as ConfirmDialogCVA,
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './Dialog';
export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  SimpleAlertDialog,
} from './AlertDialog';
export {
  Alert,
  AlertTitle,
  AlertDescription,
  SuccessAlert,
  WarningAlert,
  ErrorAlert,
  InfoAlert,
  SimpleAlert,
} from './Alert';

// Notification Components
export { styledToast, showToast, useToast } from './Toast';

// ===================================
// TYPE EXPORTS
// ===================================

// Legacy Component Types
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';
export type { IconButtonProps, IconButtonSize } from './IconButton';
export type { FilterButtonProps } from './FilterButton';
export type {
  MenuItemProps,
  MenuItemType,
  MenuItemSelectionType,
  MenuItemState,
} from './MenuItem';
export type { MenuProps, MenuPosition } from './Menu';
export type { ContextMenuProps } from './ContextMenu';
export type { RadioProps, RadioSize, RadioState } from './Radio';
export type {
  RadioGroupProps,
  SimpleRadioGroupProps,
  HorizontalRadioGroupProps,
  CompactRadioGroupProps,
  RadioOption,
} from './RadioGroup';
export type {
  FilterWidgetProps,
  FilterCategory,
  FilterOption,
  SelectedFilters,
} from './FilterWidget';
export type { FilterChipProps } from './FilterChip';
export type {
  SegmentedButtonProps,
  SegmentedButtonOption,
} from './SegmentedButton';
export type { ToggleSwitchProps } from './ToggleSwitch';
export type { InputProps, InputSize, InputVariant, InputState } from './Input';
export type { RangeSliderProps } from './RangeSlider';
export type { MultiChoiceToggleButtonProps } from './MultiChoiceToggleButton';
export type { CardMenuProps } from './CardMenu';
export type { NumberInputProps } from './NumberInput';
export type { SearchBarProps } from './SearchBar';
export type {
  SortWidgetProps,
  SortOption,
  SortDirection,
  SortWidgetPlacement,
} from './SortWidget';

// CVA Component Types
export type { CardProps } from './Card';
export type { LabelProps } from './Label';
export type { SeparatorProps } from './Separator';
export type { SkeletonProps } from './Skeleton';
export type { ProgressProps } from './Progress';
export type {
  ToggleProps,
  ToggleGroupProps as ToggleGroupBasicProps,
} from './Toggle';
export type { CheckboxProps, CheckboxSize, CheckboxState } from './Checkbox';
export type {
  ModernCheckboxProps,
  LabeledCheckboxProps,
  CheckboxGroupProps,
} from './Checkbox';
export type { BadgeProps, BadgeType } from './Badge';
export type { ModernBadgeProps, BadgeGroupProps } from './Badge';
export type { ModernInputProps, FloatingLabelInputProps } from './Input';
export type { TextareaProps } from './Textarea';
export type {
  SelectProps,
  SelectTriggerProps,
  SelectContentProps,
  SelectItemProps,
} from './Select';
export type {
  InputOTPProps,
  InputOTPGroupProps,
  InputOTPSlotProps,
  InputOTPSeparatorProps,
  SimpleInputOTPProps,
  PinCodeInputProps,
  VerificationCodeInputProps,
} from './InputOTP';
export type {
  ToggleGroupProps,
  ToggleGroupItemProps,
  SimpleToggleGroupProps,
  SegmentToggleGroupProps,
  IconToggleGroupProps,
} from './ToggleGroup';

// Layout Component Types
export type {
  TabsProps,
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps,
} from './Tabs';
export type {
  AccordionProps,
  AccordionItemProps,
  AccordionTriggerProps,
  AccordionContentProps,
} from './Accordion';
export type { AspectRatioProps, ImageAspectRatioProps } from './AspectRatio';
export type { SheetProps, SheetContentProps } from './Sheet';
export type {
  CollapsibleProps,
  CollapsibleTriggerProps,
  CollapsibleContentProps,
} from './Collapsible';
export type { ResizableHandleProps } from './Resizable';
export type { ScrollAreaProps } from './ScrollArea';
export type {
  TableProps,
  TableContainerProps,
  TableHeaderProps,
  TableRowProps,
  TableHeadProps,
  TableCellProps,
  CompleteTableProps,
} from './Table';

// Navigation Component Types
export type {
  AvatarProps,
  AvatarImageProps,
  AvatarFallbackProps,
  SimpleAvatarProps,
  UserAvatarProps,
  AvatarGroupProps,
} from './Avatar';
export type {
  BreadcrumbProps,
  BreadcrumbListProps,
  BreadcrumbItemProps,
  BreadcrumbLinkProps,
  BreadcrumbPageProps,
  BreadcrumbSeparatorProps,
  BreadcrumbEllipsisProps,
  SimpleBreadcrumbProps,
} from './Breadcrumb';
export type {
  CalendarProps,
  DateRangeCalendarProps,
  DatePickerProps,
  SimpleCalendarProps,
} from './Calendar';
export type {
  DropdownMenuContentProps,
  DropdownMenuItemProps,
  DropdownMenuCheckboxItemProps,
  DropdownMenuRadioItemProps,
  DropdownMenuLabelProps,
  DropdownMenuSeparatorProps,
  DropdownMenuShortcutProps,
  SimpleDropdownMenuProps,
} from './DropdownMenu';
export type {
  MenubarProps,
  MenubarTriggerProps,
  MenubarContentProps,
  MenubarItemProps,
  MenubarCheckboxItemProps,
  MenubarRadioItemProps,
  MenubarLabelProps,
  MenubarSeparatorProps,
  MenubarSubTriggerProps,
  MenubarSubContentProps,
  MenubarShortcutProps,
  SimpleMenubarProps,
} from './Menubar';
export type {
  NavigationMenuProps,
  NavigationMenuListProps,
  NavigationMenuTriggerProps,
  NavigationMenuContentProps,
  NavigationMenuViewportProps,
  NavigationMenuIndicatorProps,
  SimpleNavigationMenuProps,
  HeaderNavigationMenuProps,
} from './NavigationMenu';
export type {
  PaginationProps,
  PaginationContentProps,
  PaginationItemProps,
  PaginationLinkProps,
  PaginationPreviousProps,
  PaginationNextProps,
  PaginationEllipsisProps,
  SimplePaginationProps,
} from './Pagination';
export type {
  CommandProps,
  CommandInputProps,
  CommandListProps,
  CommandEmptyProps,
  CommandGroupProps,
  CommandItemProps,
  CommandSeparatorProps,
  CommandShortcutProps,
  SimpleCommandProps,
} from './Command';

// Overlay Component Types
export type { TooltipProps, TooltipContentProps } from './Tooltip';
export type {
  PopoverProps,
  PopoverContentProps,
  PopoverHeaderProps,
  PopoverBodyProps,
  PopoverFooterProps,
} from './Popover';
export type {
  HoverCardContentProps,
  SimpleHoverCardProps,
  UserProfileHoverCardProps,
} from './HoverCard';
export type {
  DialogProps,
  ConfirmDialogProps,
  DialogOverlayProps,
  DialogContentProps,
  DialogHeaderProps,
  DialogFooterProps,
  DialogTitleProps,
  DialogDescriptionProps,
} from './Dialog';
export type {
  AlertDialogOverlayProps,
  AlertDialogContentProps,
  AlertDialogHeaderProps,
  AlertDialogFooterProps,
  AlertDialogTitleProps,
  AlertDialogDescriptionProps,
  AlertDialogActionProps,
  AlertDialogCancelProps,
  SimpleAlertDialogProps,
} from './AlertDialog';
export type {
  AlertProps,
  AlertTitleProps,
  AlertDescriptionProps,
} from './Alert';

// Notification Component Types
export type {
  ToastProps,
  ToastViewportProps,
  ToastActionProps,
  ToastCloseProps,
  ToastTitleProps,
  ToastDescriptionProps,
  SimpleToastProps as SimpleToastBasicProps,
  ToasterProps as ToasterBasicProps,
} from './Toast';
export type {
  ToasterProps as SonnerToasterProps,
  SimpleToastProps as SonnerToastProps,
} from './Sonner';
