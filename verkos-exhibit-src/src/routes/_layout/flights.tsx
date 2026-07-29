import { createFileRoute } from '@tanstack/react-router';
import FlightsPage from '@/components/flights/FlightsPage';

export const Route = createFileRoute('/_layout/flights')({
  component: FlightsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: typeof search.returnTo === 'string' ? search.returnTo : undefined,
    filter:
      search.filter === 'live' || search.filter === 'all' ? (search.filter as 'live' | 'all') : ('recent' as const),
    from: typeof search.from === 'string' ? search.from : undefined,
    to: typeof search.to === 'string' ? search.to : undefined,
    q: typeof search.q === 'string' ? search.q : undefined,
  }),
});
