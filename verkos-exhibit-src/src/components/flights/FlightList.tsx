import React, { useMemo } from 'react';
import { useReportStore } from '@/store/report.store';
import { useFlights } from '@/libs/shared/api-modules/flights/hooks/use-flights';
import FlightRow from './FlightRow';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { format, differenceInDays, addDays } from 'date-fns';

type StatusFilter = 'live' | 'recent' | 'all';
const MAX_DAYS = 6;

const FlightList: React.FC<{
  onFlightSelect: (flightId: string) => void;
  statusFilter: StatusFilter;
  dateFrom?: string;
  dateTo?: string;
  searchQuery: string;
  onFiltersChange: (patch: { filter?: StatusFilter; from?: string; to?: string; q?: string }) => void;
  selectedFlightId?: string | null;
}> = ({ onFlightSelect, statusFilter, dateFrom, dateTo, searchQuery, onFiltersChange, selectedFlightId }) => {
  const liveFlights = useReportStore((s) => s.liveFlights);
  const flightContexts = useReportStore((s) => s.flightContexts);

  const dateRange = useMemo(() => {
    if (!dateFrom) return null;
    const from = new Date(dateFrom);
    const to = dateTo ? new Date(dateTo) : from;
    return { from, to };
  }, [dateFrom, dateTo]);

  const { flights: apiFlights, isLoading } = useFlights(undefined, dateRange);

  const onDateChange = (from?: Date, to?: Date) => {
    if (!from) {
      onFiltersChange({ from: undefined, to: undefined });
      return;
    }
    const startOfFrom = new Date(from);
    startOfFrom.setHours(0, 0, 0, 0);
    const endOfTo = new Date(to ?? from);
    endOfTo.setHours(23, 59, 59, 999);
    if (differenceInDays(endOfTo, startOfFrom) > MAX_DAYS - 1) {
      toast.warning(`Date range capped at ${MAX_DAYS} days`);
      const cappedEnd = addDays(startOfFrom, MAX_DAYS - 1);
      cappedEnd.setHours(23, 59, 59, 999);
      onFiltersChange({ from: startOfFrom.toISOString(), to: cappedEnd.toISOString() });
    } else {
      onFiltersChange({ from: startOfFrom.toISOString(), to: endOfTo.toISOString() });
    }
  };

  const liveArr = useMemo(() => Object.values(liveFlights), [liveFlights]);
  const filteredLive = statusFilter === 'live' || statusFilter === 'all' || statusFilter === 'recent' ? liveArr : [];

  const filteredPast = useMemo(() => {
    if (statusFilter === 'live') return [];
    let result = apiFlights;
    if (statusFilter === 'recent' && !dateRange) {
      const cutoff = Date.now() - 86400000;
      result = result.filter((f) => new Date(f.timestamp).getTime() >= cutoff);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((f) =>
        f.missions?.[0]?.mission_name?.toLowerCase().includes(q) ||
        f.site_details?.site_name?.toLowerCase().includes(q) ||
        f.drone_details?.drone_name?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [apiFlights, statusFilter, dateRange, searchQuery]);

  const total = filteredLive.length + filteredPast.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {(['live', 'recent', 'all'] as StatusFilter[]).map((key) => {
          const label = key === 'live' ? 'Live' : key === 'recent' ? 'Recent' : 'All';
          const active = statusFilter === key;
          return (
            <button
              key={key}
              onClick={() => onFiltersChange({ filter: key })}
              className={`rounded-lg px-3 py-1.5 text-[13px] cursor-pointer transition-all ${
                active
                  ? 'bg-white/[0.08] text-white/[0.88] border border-white/[0.10]'
                  : 'text-white/[0.42] hover:text-white/[0.65] hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              {label}
              {key === 'live' && liveArr.length > 0 && (
                <span className="ml-1 text-emerald-300/80">· {liveArr.length}</span>
              )}
            </button>
          );
        })}

        <Popover>
          <PopoverTrigger asChild>
            <button className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] text-white/[0.65] hover:text-white/[0.88] hover:bg-white/[0.04] border border-white/[0.08] cursor-pointer transition-colors">
              <i className="fa-regular fa-calendar text-[11px]" />
              {dateRange
                ? `${format(dateRange.from, 'MMM d')} – ${format(dateRange.to, 'MMM d')}`
                : 'Date'}
              {dateRange && (
                <i
                  className="fa-solid fa-xmark text-[10px] text-white/[0.40] hover:text-white/[0.80] ml-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFiltersChange({ from: undefined, to: undefined });
                  }}
                />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange ? { from: dateRange.from, to: dateRange.to } : undefined}
              onSelect={(r) => onDateChange(r?.from, r?.to)}
              defaultMonth={dateRange?.from ?? new Date()}
              className="p-3 pointer-events-auto"
            />
            <div className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
              Max range: 6 days
            </div>
          </PopoverContent>
        </Popover>

        <div className="ml-auto relative">
          <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-white/[0.30]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onFiltersChange({ q: e.target.value || undefined })}
            placeholder="Search by site, mission, drone..."
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg pl-7 pr-3 py-1.5 text-[13px] text-white/[0.80] placeholder:text-white/[0.30] focus:outline-none focus:border-primary-200/40 w-[240px]"
          />
        </div>
      </div>

      <div className="text-[11px] text-white/[0.42]">
        {total} flight{total !== 1 ? 's' : ''}
      </div>

      <div className="space-y-4 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
        {filteredLive.length > 0 && (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-emerald-300/70 mb-2 px-1">
              Live
            </div>
            <div className="space-y-2">
              {filteredLive.map((lf) => (
                <FlightRow
                  key={lf.flightId}
                  variant="live"
                  live={lf}
                  context={flightContexts[lf.flightId]}
                  onClick={() => onFlightSelect(lf.flightId)}
                  isSelected={selectedFlightId === lf.flightId}
                />
              ))}
            </div>
          </div>
        )}
        {filteredPast.length > 0 && (
          <div>
            {filteredLive.length > 0 && (
              <div className="text-[11px] uppercase tracking-wider text-white/[0.40] mb-2 px-1">
                Past flights
              </div>
            )}
            <div className="space-y-2">
              {filteredPast.map((f) => (
                <FlightRow
                  key={f.flight_id}
                  variant="past"
                  flight={f}
                  context={flightContexts[f.flight_id]}
                  onClick={() => onFlightSelect(f.flight_id)}
                  isSelected={selectedFlightId === f.flight_id}
                />
              ))}
            </div>
          </div>
        )}
        {total === 0 && !isLoading && (
          <div className="text-center py-12 text-white/[0.40]">
            <i className="fa-solid fa-helicopter text-2xl mb-2 block" />
            <p className="text-[13px]">No flights match the current filters</p>
          </div>
        )}
        {isLoading && (
          <div className="flex items-center justify-center py-8 text-white/[0.40] text-[12px]">
            <i className="fa-solid fa-spinner fa-spin mr-2" />
            Loading flights…
          </div>
        )}
      </div>
    </div>
  );
};
export default FlightList;
