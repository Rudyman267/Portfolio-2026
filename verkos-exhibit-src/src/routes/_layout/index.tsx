import { createFileRoute } from '@tanstack/react-router';
import ReportsLibrary from '../../components/reports/ReportsLibrary';

function HomePage() {
  return <ReportsLibrary />;
}

export const Route = createFileRoute('/_layout/')({
  component: HomePage,
});
