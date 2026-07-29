import React, { useRef, useState, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../utils/utils';
import { MenuItem } from '../MenuItem';
import type { MenuItemProps } from '../MenuItem';

export type MenuPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface MenuProps {
  /**
   * The trigger element that will open the menu when clicked
   */
  trigger: React.ReactNode;
  /**
   * The menu items to display
   */
  items: MenuItemProps[];
  /**
   * The preferred position of the menu
   * @default 'bottom-left'
   */
  position?: MenuPosition;
  /**
   * Additional CSS class name for the menu container
   */
  className?: string;
  /**
   * Width of the menu
   * @default '220px'
   */
  menuWidth?: string;
  /**
   * Whether the menu is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Additional CSS class name for the trigger container
   */
  triggerClassName?: string;
  /**
   * Full width of the menu
   * @default false
   */
  fullWidth?: boolean;
}

const MenuComponent: React.FC<MenuProps> = ({
  trigger,
  items,
  position = 'bottom-left',
  className = '',
  disabled = false,
  triggerClassName = '',
  menuWidth,
  fullWidth = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [calculatedPosition, setCalculatedPosition] =
    useState<MenuPosition>(position);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = (e?: React.MouseEvent) => {
    if (disabled) return;
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setIsOpen(!isOpen);
  };

  const handleItemClick = (onSelect?: () => void) => {
    if (onSelect) {
      onSelect();
    }
    setIsOpen(false);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      menuRef.current &&
      !menuRef.current.contains(event.target as Node) &&
      triggerRef.current &&
      !triggerRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      calculatePosition();

      // Also close on escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
        }
      };

      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  const calculatePosition = () => {
    if (triggerRef.current && menuRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;

      // Default to user's preferred position
      let newPosition = position;

      // Check if menu would go below viewport
      if (triggerRect.bottom + menuRect.height > windowHeight) {
        if (position === 'bottom-left') {
          newPosition = 'top-left';
        } else if (position === 'bottom-right') {
          newPosition = 'top-right';
        }
      }

      // Check if menu would go above viewport
      if (triggerRect.top - menuRect.height < 0) {
        if (position === 'top-left') {
          newPosition = 'bottom-left';
        } else if (position === 'top-right') {
          newPosition = 'bottom-right';
        }
      }

      // Check if menu would go beyond right edge
      if (
        triggerRect.left + menuRect.width > windowWidth &&
        (position === 'bottom-left' || position === 'top-left')
      ) {
        if (position === 'bottom-left') {
          newPosition = 'bottom-right';
        } else if (position === 'top-left') {
          newPosition = 'top-right';
        }
      }

      // Check if menu would go beyond left edge
      if (
        triggerRect.right - menuRect.width < 0 &&
        (position === 'bottom-right' || position === 'top-right')
      ) {
        if (position === 'bottom-right') {
          newPosition = 'bottom-left';
        } else if (position === 'top-right') {
          newPosition = 'top-left';
        }
      }

      setCalculatedPosition(newPosition);
    }
  };

  const getMenuPosition = () => {
    if (!triggerRef.current) return {};

    const triggerRect = triggerRef.current.getBoundingClientRect();

    switch (calculatedPosition) {
      case 'top-left':
        return {
          bottom: `${window.innerHeight - triggerRect.top}px`,
          left: `${triggerRect.left}px`,
        };
      case 'top-right':
        return {
          bottom: `${window.innerHeight - triggerRect.top}px`,
          right: `${window.innerWidth - triggerRect.right}px`,
        };
      case 'bottom-right':
        return {
          top: `${triggerRect.bottom}px`,
          right: `${window.innerWidth - triggerRect.right}px`,
        };
      case 'bottom-left':
      default:
        return {
          top: `${triggerRect.bottom}px`,
          left: `${triggerRect.left}px`,
        };
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        onClick={(e) => toggleMenu(e)}
        className={cn(
          'inline-flex items-center cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed',
          triggerClassName
        )}
      >
        {trigger}
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className={cn(
              'fixed z-50 p-1 flex flex-col gap-1 bg-background-level-1 rounded-lg shadow-lg min-w-max max-h-[400px] overflow-y-auto',
              className
            )}
            style={{
              ...getMenuPosition(),
              width: fullWidth
                ? `${triggerRef.current?.offsetWidth}px`
                : menuWidth
                ? `${menuWidth}`
                : undefined,
            }}
            role="menu"
          >
            {items.map((item, index) => (
              <MenuItem
                key={index}
                {...item}
                onSelect={() => handleItemClick(item.onSelect)}
              />
            ))}
          </div>,
          document.body
        )}
    </>
  );
};

const Menu = memo(MenuComponent);
export default Menu;
