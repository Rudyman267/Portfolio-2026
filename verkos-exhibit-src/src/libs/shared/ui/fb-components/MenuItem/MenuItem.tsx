import React, { ReactNode, memo } from 'react';
import { Checkbox } from '../Checkbox';

export type MenuItemType = 'dropdown' | 'menu';
export type MenuItemSelectionType = 'single' | 'multiple';
export type MenuItemState =
  | 'default'
  | 'hover'
  | 'pressed'
  | 'focused'
  | 'disabled';

export interface MenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Label text to display in the menu item
   */
  label: string;
  /**
   * The type of menu item (dropdown or menu)
   */
  type?: MenuItemType;
  /**
   * The selection type of menu item (single or multiple)
   */
  selectionType?: MenuItemSelectionType;
  /**
   * Current state of the menu item
   */
  state?: MenuItemState;
  /**
   * Whether the item is selected
   */
  selected?: boolean;
  /**
   * Whether the item is destructive
   */
  destructive?: boolean;
  /**
   * Prefix element to display before the menu item label
   */
  prefixNode?: ReactNode;
  /**
   * Suffix element to display after the menu item label
   */
  suffixNode?: ReactNode;
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Callback when the item is selected
   */
  onSelect?: () => void;
  /**
   * Whether the item is a divider
   */
  divider?: boolean;
}

const MenuItemComponent: React.FC<MenuItemProps> = ({
  label,
  type = 'dropdown',
  selectionType = 'single',
  state = 'default',
  selected = false,
  destructive = false,
  prefixNode,
  suffixNode,
  className = '',
  onSelect,
  divider,
  ...props
}) => {
  if (divider) {
    return <div className="flex h-px w-full bg-text-disabled" />;
  }

  // Base container classes
  const getContainerClasses = () => {
    const baseClasses =
      'flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors w-full';

    if (state === 'disabled') {
      // Keep semantic text color (destructive vs normal); use opacity for disabled affordance.
      return `${baseClasses} opacity-70 cursor-not-allowed`;
    }

    if (selected) {
      return `${baseClasses} ${
        destructive ? 'bg-error-container' : 'bg-[rgba(236,236,238,0.1)]'
      } cursor-pointer`;
    }

    switch (state) {
      case 'hover':
        return `${baseClasses} ${
          destructive ? 'bg-error-container' : 'bg-[rgba(236,236,238,0.1)]'
        } cursor-pointer`;
      case 'pressed':
        return `${baseClasses} ${
          destructive ? 'bg-error-container' : 'bg-[rgba(236,236,238,0.12)]'
        } cursor-pointer`;
      case 'focused':
        return `${baseClasses} ${
          destructive ? 'bg-error-container' : 'bg-[rgba(236,236,238,0.1)]'
        } outline-none ring-2 ring-[rgba(0,128,255,1)] cursor-pointer`;
      default:
        return `${baseClasses} hover:bg-[rgba(236,236,238,0.1)] active:bg-[rgba(236,236,238,0.12)] cursor-pointer`;
    }
  };

  // Text color classes
  const getTextClasses = () => {
    if (destructive) {
      return 'text-error-30';
    }

    return 'text-text-1';
  };

  // Secondary text color classes for suffix
  const getSuffixTextClasses = () => {
    return 'text-text-1';
  };

  const renderPrefix = () => {
    if (prefixNode) {
      return prefixNode;
    }

    if (selectionType === 'multiple') {
      return (
        <Checkbox
          state={selected ? 'checked' : 'unchecked'}
          size="sm"
          disabled={state === 'disabled'}
          className="flex-shrink-0"
          onChange={onSelect}
        />
      );
    }
    return null;
  };

  return (
    <div
      role="menuitem"
      tabIndex={state === 'disabled' ? -1 : 0}
      className={`${getContainerClasses()} ${className}`}
      {...props}
    >
      {renderPrefix()}

      <div
        className={`flex flex-grow items-center ${
          state === 'disabled' ? 'cursor-not-allowed' : 'cursor-pointer'
        }`}
        onClick={state === 'disabled' ? undefined : onSelect}
      >
        <span className={`text-sm font-normal font-inter ${getTextClasses()}`}>
          {label}
        </span>
      </div>

      {suffixNode && (
        <div
          className={`flex items-center text-xs font-normal font-inter ${getSuffixTextClasses()}`}
        >
          {suffixNode}
        </div>
      )}
    </div>
  );
};

const MenuItem = memo(MenuItemComponent);
export default MenuItem;
