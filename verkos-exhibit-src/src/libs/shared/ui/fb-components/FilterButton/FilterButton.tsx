import React, { ButtonHTMLAttributes, ReactNode } from 'react';

export interface FilterButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  selected?: boolean;
  className?: string;
  disabled?: boolean;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  children,
  icon,
  selected = false,
  className = '',
  disabled = false,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-lg h-8 px-3 py-0 text-sm font-normal gap-1 transition-colors';

  const stateClasses = selected
    ? 'bg-surface-selected/40 text-primary-100 border border-primary-200'
    : 'bg-transparent hover:bg-surface active:bg-surface-pressed text-text-2 hover:text-text-1 border border-outline-primary';

  return (
    <button
      type="button"
      className={`${baseClasses} ${stateClasses} ${className} ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      }`}
      {...props}
    >
      {icon && <span className="flex items-center justify-center">{icon}</span>}
      <span className="fb-body2-regular">{children}</span>
    </button>
  );
};

export default FilterButton;
