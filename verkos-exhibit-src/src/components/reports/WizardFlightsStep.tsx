import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Severity } from '../../types/report.types';
import { useReportStore } from '../../store/report.store';
import { DEMO_WIZARD_FLIGHTS } from '../../data/demo-scenario';
import type { FlightLog } from '@/libs/shared/api-modules/flights';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

// ─── Types ──────────────────────────────────────────────────────────────────

interface FlightRow {
  id: string;
  date: string;
  time: string;
  drone: string;
  dock: string;
  durationSec: number;
  imageCount: number;
  highestSeverity: Severity;
  missionName: string;
  siteId: string;
  /** UTC ms — used for calendar/date-range filtering */
  timestampMs: number;
}

// Derive a synthetic timestamp from a demo date label like "Today" / "Yesterday" / "3 days ago"
function demoLabelToMs(label: string, time: string): number {
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (label === 'Today') {
    // base
  } else if (label === 'Yesterday') {
    base.setDate(base.getDate() - 1);
  } else {
    const m = /^(\d+)\s+days?\s+ago$/i.exec(label);
    if (m) base.setDate(base.getDate() - parseInt(m[1], 10));
  }
  const [hh, mm] = (time || '00:00').split(':').map((n) => parseInt(n, 10) || 0);
  base.setHours(hh, mm, 0, 0);
  return base.getTime();
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
function endOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
}

interface WizardFlightsStepProps {
  selectedFlights: string[];
  onChange: (selected: string[]) => void;
  siteIds?: string[];
  apiFlights?: FlightLog[];
  isLoading?: boolean;
  /** Lifted date range — when set, parent fetches flights via Media Gallery API. */
  dateRange?: { from: Date; to: Date } | null;
  onDateRangeChange?: (range: { from: Date; to: Date } | null) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

type TimeFilter = 'last_flight' | 'today' | 'yesterday' | 'last_7_days' | 'all';

const timeFilterPills: { key: TimeFilter; label: string }[] = [
  { key: 'last_flight', label: 'Last flight' },
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last_7_days', label: 'Last 7 days' },
  { key: 'all', label: 'All' },
];

const severityDotColor: Record<Severity, string> = {
  critical: 'bg-error-30',
  high: 'bg-warning-30',
  moderate: 'bg-caution-30',
  low: 'bg-success-30',
};

function filterByTime(items: FlightRow[], filter: TimeFilter): FlightRow[] {
  const now = new Date();
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayMs = todayMs - 24 * 60 * 60 * 1000;
  const sevenDaysAgoMs = todayMs - 7 * 24 * 60 * 60 * 1000;

  if (filter === 'all') return items;
  if (filter === 'last_flight') return items.length > 0 ? [items[0]] : [];
  if (filter === 'last_7_days') return items.filter((f) => f.timestampMs >= sevenDaysAgoMs);
  if (filter === 'today') return items.filter((f) => f.timestampMs >= todayMs);
  if (filter === 'yesterday') return items.filter((f) => f.timestampMs >= yesterdayMs && f.timestampMs < todayMs);
  return items;
}

function groupByDate(items: FlightRow[]): { date: string; items: FlightRow[] }[] {
  const map = new Map<string, FlightRow[]>();
  for (const f of items) {
    const group = map.get(f.date) ?? [];
    group.push(f);
    map.set(f.date, group);
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}

function formatDuration(sec: number): string {
  if (!sec || sec <= 0) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

// ─── Component ──────────────────────────────────────────────────────────────

const WizardFlightsStep: React.FC<WizardFlightsStepProps> = ({
  selectedFlights,
  onChange,
  siteIds,
  apiFlights,
  isLoading,
  dateRange: externalDateRange,
  onDateRangeChange,
}) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [internalDateRange, setInternalDateRange] = useState<DateRange | undefined>(undefined);
  // Use parent-controlled range when provided; else local state.
  const isControlled = onDateRangeChange !== undefined;
  const dateRange: DateRange | undefined = isControlled
    ? externalDateRange
      ? { from: externalDateRange.from, to: externalDateRange.to }
      : undefined
    : internalDateRange;
  const setDateRange = useCallback(
    (next: DateRange | undefined) => {
      if (isControlled) {
        if (!next?.from) {
          onDateRangeChange?.(null);
        } else {
          const to = next.to ?? next.from;
          const from = new Date(next.from);
          from.setHours(0, 0, 0, 0);
          const toEnd = new Date(to);
          toEnd.setHours(23, 59, 59, 999);
          onDateRangeChange?.({ from, to: toEnd });
        }
      } else {
        setInternalDateRange(next);
      }
    },
    [isControlled, onDateRangeChange]
  );
  const [calendarOpen, setCalendarOpen] = useState(false);
  const demoMode = useReportStore((s) => s.demoMode);

  const mappedItems: FlightRow[] = useMemo(() => {
    if (demoMode) {
      return DEMO_WIZARD_FLIGHTS.map((f) => ({
        id: f.id,
        date: f.date,
        time: f.time,
        drone: f.drone,
        dock: f.dock,
        durationSec: f.durationSec,
        imageCount: f.imageCount,
        highestSeverity: f.highestSeverity,
        missionName: f.missionName,
        siteId: f.siteId,
        timestampMs: demoLabelToMs(f.date, f.time),
      }));
    }
    return (apiFlights ?? []).map((f) => {
      const missionName = f.missions?.[0]?.mission_name ?? 'Unknown mission';
      const ts = new Date(f.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateLabel = ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      if (ts.toDateString() === today.toDateString()) dateLabel = 'Today';
      else if (ts.toDateString() === yesterday.toDateString()) dateLabel = 'Yesterday';

      const m0 = f.missions?.[0];
      const durationSec = m0?.mission_end_time && m0?.mission_start_time
        ? Math.round(
            (new Date(m0.mission_end_time).getTime() -
              new Date(m0.mission_start_time).getTime()) /
              1000
          )
        : 0;

      return {
        id: f.flight_id,
        date: dateLabel,
        time: ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        drone: f.drone_details?.drone_name ?? 'Unknown',
        dock: f.docking_station?.docking_station_name?.trim() || 'N/A',
        durationSec,
        imageCount: f.total_media || f.fb_media_count || 0,
        highestSeverity: 'low' as const,
        missionName,
        siteId: f.site_details?.site_id ?? '',
        timestampMs: ts.getTime(),
      };
    });
  }, [apiFlights, demoMode]);

  const itemSource = mappedItems;

  const siteFiltered = useMemo(
    () => siteIds && siteIds.length > 0 ? itemSource.filter((f) => siteIds.includes(f.siteId)) : itemSource,
    [siteIds, itemSource]
  );

  const dateFiltered = useMemo(() => {
    if (!dateRange?.from) return siteFiltered;
    const fromMs = startOfDay(dateRange.from);
    const toMs = endOfDay(dateRange.to ?? dateRange.from);
    return siteFiltered.filter((f) => f.timestampMs >= fromMs && f.timestampMs <= toMs);
  }, [siteFiltered, dateRange]);

  const timeFiltered = useMemo(
    () => (dateRange?.from ? dateFiltered : filterByTime(siteFiltered, timeFilter)),
    [dateFiltered, siteFiltered, timeFilter, dateRange]
  );
  const visibleItems = timeFiltered;
  const groups = useMemo(() => groupByDate(visibleItems), [visibleItems]);
  const visibleIds = useMemo(() => new Set(visibleItems.map((f) => f.id)), [visibleItems]);

  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!hasInitialized.current && selectedFlights.length === 0) {
      hasInitialized.current = true;
      const todayIds = siteFiltered.filter((f) => f.date === 'Today').map((f) => f.id);
      onChange(todayIds);
    }
  }, [selectedFlights.length, onChange, siteFiltered]);

  useEffect(() => {
    if (siteIds && siteIds.length > 0) {
      const validIds = new Set(siteFiltered.map((f) => f.id));
      const filtered = selectedFlights.filter((id) => validIds.has(id));
      if (filtered.length !== selectedFlights.length) {
        onChange(filtered);
      }
    }
  }, [siteIds, siteFiltered, selectedFlights, onChange]);

  const handleTimeFilter = useCallback(
    (filter: TimeFilter) => {
      setTimeFilter(filter);
      setDateRange(undefined);
      if (filter === 'last_flight') onChange(siteFiltered.length > 0 ? [siteFiltered[0].id] : []);
    },
    [onChange, siteFiltered]
  );

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const handleDayClick = useCallback(
    (day: Date) => {
      if (!dateRange?.from) {
        setDateRange({ from: day, to: undefined });
        return;
      }
      if (!dateRange.to) {
        if (isSameDay(day, dateRange.from)) {
          setDateRange(undefined);
          return;
        }
        const [from, to] = day < dateRange.from ? [day, dateRange.from] : [dateRange.from, day];
        setDateRange({ from, to });
        setCalendarOpen(false);
        return;
      }
      if (isSameDay(day, dateRange.from) || isSameDay(day, dateRange.to)) {
        setDateRange(undefined);
        return;
      }
      setDateRange({ from: day, to: undefined });
    },
    [dateRange]
  );

  const handleClearDate = useCallback(() => {
    setDateRange(undefined);
    setCalendarOpen(false);
  }, []);

  const dateRangeLabel = useMemo(() => {
    if (!dateRange?.from) return null;
    const from = format(dateRange.from, 'MMM d');
    if (!dateRange.to || startOfDay(dateRange.to) === startOfDay(dateRange.from)) return from;
    return `${from} – ${format(dateRange.to, 'MMM d')}`;
  }, [dateRange]);

  const toggleItem = useCallback(
    (id: string) => {
      if (selectedFlights.includes(id)) onChange(selectedFlights.filter((f) => f !== id));
      else onChange([...selectedFlights, id]);
    },
    [selectedFlights, onChange]
  );

  const allVisibleSelected = visibleItems.length > 0 && visibleItems.every((f) => selectedFlights.includes(f.id));

  const handleSelectAll = useCallback(() => {
    if (allVisibleSelected) onChange(selectedFlights.filter((id) => !visibleIds.has(id)));
    else {
      const currentSet = new Set(selectedFlights);
      visibleItems.forEach((f) => currentSet.add(f.id));
      onChange(Array.from(currentSet));
    }
  }, [allVisibleSelected, selectedFlights, visibleItems, visibleIds, onChange]);

  const handleClear = useCallback(() => onChange([]), [onChange]);

  const selectedCount = selectedFlights.length;
  const totalImages = useMemo(
    () => siteFiltered.filter((f) => selectedFlights.includes(f.id)).reduce((s, f) => s + f.imageCount, 0),
    [selectedFlights, siteFiltered]
  );

  return (
    <div>
      {/* ZONE 1 — Time filter pills */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {timeFilterPills.map((pill) => {
          const active = !dateRange?.from && timeFilter === pill.key;
          return (
            <button
              key={pill.key}
              onClick={() => handleTimeFilter(pill.key)}
              className={`rounded-lg px-3 py-1.5 text-[13px] cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 ${
                active
                  ? 'bg-white/[0.08] text-white/[0.88] border border-white/[0.10]'
                  : 'text-white/[0.42] hover:text-white/[0.65] hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              {pill.label}
            </button>
          );
        })}

        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={`rounded-lg px-3 py-1.5 text-[13px] cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 inline-flex items-center gap-1.5 ${
                dateRange?.from
                  ? 'bg-primary-200/10 border border-primary-200/30 text-primary-200'
                  : 'text-white/[0.42] hover:text-white/[0.65] hover:bg-white/[0.04] border border-transparent'
              }`}
              aria-label="Filter flights by date"
            >
              <i className="fa-regular fa-calendar text-[11px]" />
              <span>{dateRangeLabel ?? 'Date'}</span>
              {dateRange?.from && (
                <i
                  role="button"
                  aria-label="Clear date filter"
                  className="fa-solid fa-xmark text-[10px] ml-1 opacity-70 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearDate();
                  }}
                />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-auto p-0 bg-[#1C1C1F] border-white/[0.10]"
          >
            <Calendar
              mode="range"
              numberOfMonths={1}
              selected={dateRange}
              onDayClick={handleDayClick}
              defaultMonth={dateRange?.from ?? new Date()}
              initialFocus
              className="p-3 pointer-events-auto"
            />
            <div className="flex items-center justify-between px-3 py-2 border-t border-white/[0.06] text-[12px]">
              <span className="text-white/[0.40]">
                {dateRange?.from && dateRange?.to
                  ? 'Range selected'
                  : dateRange?.from
                  ? 'Click another day for a range'
                  : 'Click a day or two for a range'}
              </span>
              <button
                onClick={handleClearDate}
                className="text-white/[0.50] hover:text-white/[0.80] transition-colors duration-150 cursor-pointer"
              >
                Clear
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <p className="text-[12px] text-white/[0.30] mb-2">
        {visibleItems.length} flight{visibleItems.length !== 1 ? 's' : ''}
      </p>

      {/* ZONE 3 — Scrollable list */}
      <div
        className="max-h-[280px] overflow-y-auto rounded-xl border border-white/[0.06] bg-[#1C1C1F]"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.12) transparent' }}
      >
        {isLoading ? (
          <div className="py-8 text-center">
            <i className="fa-solid fa-spinner fa-spin text-white/[0.30] text-xl mb-2" />
            <p className="text-[12px] text-white/[0.40]">Searching flights for selected date…</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="py-8 text-center">
            <i className="fa-solid fa-route text-white/[0.15] text-2xl mb-2" />
            <p className="text-[13px] text-white/[0.40] mb-1">No flights available</p>
            <p className="text-[12px] text-white/[0.25]">
              {demoMode
                ? 'No flights match the current filters. Try "All" or "Last 7 days".'
                : 'Flights for the selected sites will appear here.'}
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.date}>
              <div className="sticky top-0 z-10 bg-[#161618] flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
                <span className="text-[11px] uppercase tracking-wider text-white/[0.30]">{group.date}</span>
                <span className="text-[11px] text-white/[0.30]">{group.items.length} flight{group.items.length !== 1 ? 's' : ''}</span>
              </div>

              {group.items.map((f, idx) => {
                const checked = selectedFlights.includes(f.id);
                const isLast = idx === group.items.length - 1;
                const hasMedia = f.imageCount > 0;

                return (
                  <div
                    key={f.id}
                    onClick={() => toggleItem(f.id)}
                    role="checkbox"
                    aria-checked={checked}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && toggleItem(f.id)}
                    className={`cursor-pointer transition-colors duration-150 py-3 px-3 ${
                      !isLast ? 'border-b border-white/[0.04]' : ''
                    } ${checked ? 'bg-primary-200/[0.04]' : 'hover:bg-white/[0.03]'} border-l-2 border-l-transparent`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${checked ? 'bg-primary-200 border border-primary-200' : 'border border-white/[0.20] bg-transparent'}`}>
                        {checked && <i className="fa-solid fa-check text-white" style={{ fontSize: '10px' }} />}
                      </span>
                      <span className="flex-1 truncate text-[14px] text-white/[0.80]">{f.missionName}</span>
                      <span className="text-[12px] text-white/[0.35] tabular-nums flex-shrink-0">{f.time}</span>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${severityDotColor[f.highestSeverity]}`} />
                    </div>

                    <div className="flex items-center gap-2 ml-6 mt-0.5 flex-wrap">
                      <span className="text-[12px] text-white/[0.35]">
                        {f.drone} · {f.dock}
                        {f.durationSec > 0 ? ` · ${formatDuration(f.durationSec)}` : ''}
                      </span>
                      <span
                        className={`text-[11px] rounded px-1.5 py-0.5 ${
                          hasMedia
                            ? 'bg-success-30/10 text-success-30'
                            : 'bg-white/[0.05] text-white/[0.35]'
                        }`}
                      >
                        {hasMedia ? `${f.imageCount} media` : 'No media'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* ZONE 4 — Selection summary bar */}
      <div className="flex items-center justify-between py-2 border-t border-white/[0.05] mt-2">
        <span className="text-[12px] text-white/[0.45]">
          {selectedCount} flight{selectedCount !== 1 ? 's' : ''} selected · {totalImages} media
        </span>
        <div className="flex items-center gap-1 text-[12px]">
          {!allVisibleSelected && (
            <button onClick={handleSelectAll} className="text-white/[0.45] hover:text-white/[0.75] transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 rounded px-1">
              Select all
            </button>
          )}
          {selectedCount > 0 && (
            <>
              {!allVisibleSelected && <span className="text-white/[0.20]">·</span>}
              <button onClick={handleClear} className="text-white/[0.45] hover:text-white/[0.75] transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 rounded px-1">
                Clear
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WizardFlightsStep;
