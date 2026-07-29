import React, {
  useState,
  useRef,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import { SearchBar } from '../SearchBar';
import { MenuItem } from '../MenuItem';

// Custom hook for outside click detection - Proper React Pattern
const useClickOutside = (
  refs: React.RefObject<HTMLElement>[],
  callback: () => void,
  enabled = true
) => {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutside = refs.every(
        (ref) => ref.current && !ref.current.contains(target)
      );

      if (isOutside) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [refs, callback, enabled]);
};

export interface FilterOption {
  id: string;
  label: string;
}

export interface FilterCategory {
  id: string;
  label: string;
  options: FilterOption[];
  multiSelect?: boolean; // Whether this category supports multi-select
}

export interface SelectedFilters {
  [categoryId: string]: string[];
}

export interface FilterWidgetProps {
  categories: FilterCategory[];
  onFilterChange: (selectedFilters: SelectedFilters) => void;
  initialFilters?: SelectedFilters;
  className?: string;
  trigger?: ReactNode; // Trigger element to toggle the filter widget
  placement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'; // Dropdown placement
  width?: number | string; // Width of the filter widget
  maxHeight?: number | string; // Max height of the filter widget
}

const FilterWidget: React.FC<FilterWidgetProps> = ({
  categories,
  onFilterChange,
  initialFilters = {},
  className = '',
  trigger = null,
  placement = 'bottom-left',
  width = 200,
  maxHeight = 400,
}) => {
  // State for dropdown visibility
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FilterCategory | null>(
    categories[0]
  );
  const [filteredCategories, setFilteredCategories] = useState(categories);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] =
    useState<SelectedFilters>(initialFilters);

  const triggerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Use the proper React hook for outside click detection
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  useClickOutside([widgetRef, triggerRef], handleClose, isOpen);

  const handleSearchChange = (query: string) => {
    const trimmedQuery = (query || '').trim();
    if (!trimmedQuery) {
      setFilteredCategories(categories);
      setSearchQuery('');
      setActiveCategory(categories[0]);
      return;
    }
    const loweredQuery = trimmedQuery.toLowerCase();
    const filtered = categories
      .map((category) => {
        const filteredOptions = category.options.filter((option) =>
          option.label.toLowerCase().includes(loweredQuery)
        );
        if (filteredOptions.length === 0) return null;
        return { ...category, options: filteredOptions };
      })
      .filter(Boolean) as typeof categories;
    setFilteredCategories(filtered);
    setActiveCategory(filtered[0]);
    setSearchQuery(query);
  };

  const handleCategorySelect = (selectedCategory: FilterCategory) => {
    setActiveCategory(selectedCategory);
  };

  const handleOptionSelect = (categoryId: string, optionId: string) => {
    setSelectedFilters((prev) => {
      let newFilters;
      if (prev[categoryId]?.includes(optionId)) {
        newFilters = {
          ...prev,
          [categoryId]: prev[categoryId].filter((id) => id !== optionId),
        };
      } else if (prev[categoryId] === undefined) {
        newFilters = {
          ...prev,
          [categoryId]: [optionId],
        };
      } else {
        newFilters = {
          ...prev,
          [categoryId]: [...prev[categoryId], optionId],
        };
      }
      onFilterChange(newFilters);
      return newFilters;
    });
  };

  const handleSelectAll = (categoryId: string) => {
    if (!activeCategory) return;
    if (
      selectedFilters[categoryId]?.length === activeCategory?.options.length
    ) {
      const newFilters = {
        ...selectedFilters,
        [categoryId]: [],
      };
      setSelectedFilters(newFilters);
      onFilterChange(newFilters);
      return;
    }
    const newFilters = {
      ...selectedFilters,
      [categoryId]: activeCategory?.options.map((option) => option.id),
    };
    setSelectedFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Determine the placement classes for the dropdown
  const getPlacementClasses = () => {
    switch (placement) {
      case 'bottom-right':
        return 'right-0 top-full mt-1';
      case 'top-left':
        return 'left-0 bottom-full mb-1';
      case 'top-right':
        return 'right-0 bottom-full mb-1';
      case 'bottom-left':
      default:
        return 'left-0 top-full mt-1';
    }
  };

  return (
    <div className="relative inline-block">
      {/* Trigger Element */}
      <div ref={triggerRef} onClick={toggleDropdown} className="cursor-pointer">
        {trigger}
      </div>

      {/* Dropdown Filter Widget */}
      {isOpen && (
        <div
          ref={widgetRef}
          className={`absolute z-50 shadow-lg ${getPlacementClasses()}`}
          style={{ width }}
        >
          <div
            className={`bg-background-level-1 rounded-lg overflow-hidden flex flex-col ${className}`}
            style={{ maxHeight: maxHeight }}
          >
            {/* Header with Search */}
            <div className="p-3 pb-2 border-b border-outline-primary">
              <SearchBar
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search"
                className="w-full max-w-none bg-[rgba(236,236,238,0.08)] border-primary-200"
              />
            </div>

            {/* Category and Filter Content */}
            <div className="flex flex-1 overflow-hidden">
              {/* Categories List */}
              <div className="w-[120px] flex flex-col gap-2 border-r scrollbar-thin scrollbar-track-background-level-1 scrollbar-thumb-background-level-3 scrollbar-thumb-hover-background-level-5 border-outline-primary p-2">
                {filteredCategories.map((category) => (
                  <MenuItem
                    key={category.id}
                    label={category.label}
                    type="menu"
                    selectionType="single"
                    selected={activeCategory?.id === category.id}
                    onSelect={() => handleCategorySelect(category)}
                  />
                ))}
              </div>

              {/* Filter Options List */}
              <div className="flex flex-col flex-1">
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-background-level-1 scrollbar-thumb-background-level-3 scrollbar-thumb-hover-background-level-5 p-2 flex flex-col gap-2 min-h-0">
                  {activeCategory?.options.length === 0 ? (
                    <div className="text-text-2 text-sm p-2 text-center">
                      No options found
                    </div>
                  ) : (
                    activeCategory?.options.map((option) => (
                      <MenuItem
                        key={option.id}
                        label={option.label}
                        selectionType={
                          activeCategory?.multiSelect ? 'multiple' : 'single'
                        }
                        selected={selectedFilters[activeCategory?.id]?.includes(
                          option.id
                        )}
                        onSelect={() =>
                          handleOptionSelect(activeCategory?.id, option.id)
                        }
                      />
                    ))
                  )}
                </div>

                {/* Footer with "Select All" Option and "Clear All" Button - Always visible at bottom */}
                <div className="border-t border-outline-primary p-2 flex-shrink-0">
                  <div className="flex justify-between items-center">
                    {activeCategory?.multiSelect && (
                      <MenuItem
                        label="Select all"
                        selectionType="multiple"
                        selected={
                          activeCategory?.options.length ===
                          selectedFilters[activeCategory?.id]?.length
                        }
                        onSelect={() => handleSelectAll(activeCategory?.id)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterWidget;
