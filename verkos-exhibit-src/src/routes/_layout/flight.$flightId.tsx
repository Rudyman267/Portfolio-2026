import { createFileRoute } from '@tanstack/react-router';
import FlightContextPage from '@/components/flights/FlightContextPage';

export const Route = createFileRoute('/_layout/flight/$flightId')({
  component: FlightContextPage,
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: typeof search.returnTo === 'string' ? search.returnTo : undefined,
  }),
});
