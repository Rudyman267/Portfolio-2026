import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface AppSelectOption {
  value: string;
  label: string;
}

interface AppSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: AppSelectOption[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  'aria-label'?: string;
}

const AppSelect: React.FC<AppSelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  triggerClassName,
  'aria-label': ariaLabel,
}) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={cn(
          'bg-[#1C1C1F] border-white/[0.08] rounded-lg text-[13px] text-white/[0.85] h-auto py-2.5 px-3 focus:ring-1 focus:ring-primary-200/10 focus:border-primary-200/40 transition-colors duration-150 [&>svg]:text-white/[0.35] [&>span]:line-clamp-none whitespace-nowrap gap-2',
          triggerClassName,
          className,
        )}
        aria-label={ariaLabel}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-[#1C1C1F] border-white/[0.10] rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className="text-[13px] text-white/[0.70] focus:bg-white/[0.06] focus:text-white/[0.92] rounded-lg cursor-pointer"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default AppSelect;
