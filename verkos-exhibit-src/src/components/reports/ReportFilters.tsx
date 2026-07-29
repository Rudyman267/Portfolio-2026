import React from 'react';
import AppSelect from '@/components/ui/app-select';

interface ReportFiltersProps {
  searchValue: string;
  siteValue: string;
  typeValue: string;
  dateValue: string;
  onSearch: (value: string) => void;
  onSiteFilter: (value: string) => void;
  onTypeFilter: (value: string) => void;
  onDateFilter: (value: string) => void;
}

const siteOptions = [
  { value: '_all', label: 'All sites' },
  { value: 'Skybase Alpha', label: 'Skybase Alpha' },
  { value: 'Skybase Beta', label: 'Skybase Beta' },
];

const typeOptions = [
  { value: '_all', label: 'All types' },
  { value: 'full_operational', label: 'Full operational' },
  { value: 'executive_summary', label: 'Executive summary' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'incident', label: 'Incident' },
];

const dateOptions = [
  { value: '_all', label: 'All dates' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This week' },
  { value: 'last_week', label: 'Last week' },
  { value: 'this_month', label: 'This month' },
];

const ReportFilters: React.FC<ReportFiltersProps> = ({
  searchValue,
  siteValue,
  typeValue,
  dateValue,
  onSearch,
  onSiteFilter,
  onTypeFilter,
  onDateFilter,
}) => {
  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      <AppSelect
        value={siteValue || '_all'}
        onValueChange={(v) => onSiteFilter(v === '_all' ? '' : v)}
        options={siteOptions}
        aria-label="Filter by site"
      />

      <AppSelect
        value={typeValue || '_all'}
        onValueChange={(v) => onTypeFilter(v === '_all' ? '' : v)}
        options={typeOptions}
        aria-label="Filter by type"
      />

      <AppSelect
        value={dateValue || '_all'}
        onValueChange={(v) => onDateFilter(v === '_all' ? '' : v)}
        options={dateOptions}
        aria-label="Filter by date"
      />

      <div className="ml-auto relative flex items-center">
        <i className="fa-solid fa-magnifying-glass text-white/[0.25] absolute left-3 text-[10px] pointer-events-none" />
        <input
          type="text"
          placeholder="Search reports..."
          value={searchValue}
          onChange={(e) => onSearch(e.target.value)}
          className="bg-[#1C1C1F] border border-white/[0.08] rounded-lg pl-8 pr-3 py-2 text-[13px] text-white/[0.85] placeholder:text-white/[0.25] focus:outline-none focus:border-primary-200/40 focus:ring-1 focus:ring-primary-200/10 transition-colors duration-150 w-48"
          aria-label="Search reports"
        />
      </div>
    </div>
  );
};

export default ReportFilters;
