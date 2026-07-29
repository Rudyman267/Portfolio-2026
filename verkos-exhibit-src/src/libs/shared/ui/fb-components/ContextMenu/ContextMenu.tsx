import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MenuItem } from '../MenuItem';
import type { MenuItemProps } from '../MenuItem';
import { Tooltip } from '../Tooltip';
import { cn } from '../../../utils/utils';

export interface ContextMenuProps {
  /**
   * Menu items to display in the dropdown menu
   */
  items: MenuItemProps[];
  /**
   * Optional custom menu icon component to replace the default ellipsis
   */
  customIcon?: React.ReactNode;
  /**
   * Additional CSS class name for the icon
   */
  iconClassName?: string;
  /**
   * Reference to an element that should trigger the context menu on right-click
   */
  contextMenuTarget?: React.RefObject<HTMLElement>;
  /**
   * Additional CSS class name for the menu container
   */
  menuClassName?: string;
  /**
   * Width of the menu
   * @default '180px'
   */
  menuWidth?: string;
  /**
   * Whether the menu is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Optional tooltip content for the menu trigger button.
   * If omitted, no tooltip is shown.
   */
  tooltipContent?: React.ReactNode;
}

/**
 * ContextMenu component - Provides a dropdown menu with ellipsis icon
 * Supports both regular clicking and context menu (right-click) functionality
 */
const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  customIcon,
  iconClassName = '',
  contextMenuTarget,
  menuClassName = '',
  menuWidth = '180px',
  disabled = false,
  tooltipContent,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close the menu when clicking outside
  useEffect(() => {
    if (disabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setContextMenuPosition(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    // Add context menu handler for right-click
    const handleContextMenu = (e: MouseEvent) => {
      // Only handle context menu events on the target element
      if (contextMenuTarget?.current?.contains(e.target as Node)) {
        e.preventDefault();
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setIsOpen(true);
      }
    };

    if (contextMenuTarget) {
      document.addEventListener('contextmenu', handleContextMenu);
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setContextMenuPosition(null);
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      if (contextMenuTarget) {
        document.removeEventListener('contextmenu', handleContextMenu);
      }
    };
  }, [isOpen, contextMenuTarget, disabled]);

  const handleMenuToggle = (e: React.MouseEvent) => {
    if (disabled) return;

    e.stopPropagation();
    e.preventDefault();
    setIsOpen(!isOpen);
    setContextMenuPosition(null);
  };

  const handleItemClick = (onSelect?: () => void) => {
    if (onSelect) {
      onSelect();
    }
    setIsOpen(false);
    setContextMenuPosition(null);
  };

  return (
    <div className="relative">
      {tooltipContent ? (
        <Tooltip
          content={tooltipContent}
          side="right"
          align="center"
          sideOffset={6}
          variant="ghost"
          size="sm"
        >
          {/* Tooltip wraps span so it still works when the button is disabled */}
          <span className="inline-flex">
            <button
              ref={buttonRef}
              onClick={handleMenuToggle}
              className={cn(
                'text-text-1 hover:text-primary-200 transition-colors w-4 h-4 flex items-center justify-center',
                disabled && 'opacity-50 cursor-not-allowed',
                iconClassName
              )}
              aria-label="More options"
              disabled={disabled}
            >
              {customIcon || (
                <i className="fa-solid fa-ellipsis-vertical text-sm"></i>
              )}
            </button>
          </span>
        </Tooltip>
      ) : (
        <button
          ref={buttonRef}
          onClick={handleMenuToggle}
          className={cn(
            'text-text-1 hover:text-primary-200 transition-colors w-4 h-4 flex items-center justify-center',
            disabled && 'opacity-50 cursor-not-allowed',
            iconClassName
          )}
          aria-label="More options"
          disabled={disabled}
        >
          {customIcon || (
            <i className="fa-solid fa-ellipsis-vertical text-sm"></i>
          )}
        </button>
      )}

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className={cn(
              'fixed z-50 p-1 bg-background-level-1 border border-outline-primary rounded-lg shadow-lg',
              menuClassName
            )}
            style={{
              // If context menu position exists, use that position
              // Otherwise, position relative to the button
              ...(contextMenuPosition
                ? {
                    top: `${contextMenuPosition.y}px`,
                    left: `${contextMenuPosition.x}px`,
                  }
                : {
                    top: `${
                      buttonRef.current?.getBoundingClientRect().bottom ?? 0
                    }px`,
                    right: `${
                      window.innerWidth -
                      (buttonRef.current?.getBoundingClientRect().right ?? 0)
                    }px`,
                  }),
              width: menuWidth,
            }}
            role="menu"
          >
            {(() => {
              const nonDestructiveItems = items.filter((i) => !i.destructive);
              const destructiveItems = items.filter((i) => i.destructive);

              const orderedItems =
                destructiveItems.length > 0
                  ? [...nonDestructiveItems, ...destructiveItems]
                  : items;

              const firstDestructiveIndex =
                destructiveItems.length > 0 ? nonDestructiveItems.length : -1;

              return orderedItems.map((item, index) => (
                <React.Fragment key={index}>
                  {index === firstDestructiveIndex &&
                    nonDestructiveItems.length > 0 &&
                    destructiveItems.length > 0 && (
                      <div className="mx-1 my-1 h-px bg-outline-primary"></div>
                    )}
                  <MenuItem
                    {...item}
                    // Prevent MenuItem's internal onSelect from firing alongside our click handler
                    onSelect={undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleItemClick(item.onSelect);
                    }}
                  />
                </React.Fragment>
              ));
            })()}
          </div>,
          document.body
        )}
    </div>
  );
};

export default ContextMenu;
