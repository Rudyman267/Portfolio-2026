import { createFileRoute } from '@tanstack/react-router';
import DraftsList from '../../components/reports/DraftsList';

export const Route = createFileRoute('/_layout/drafts')({
  component: DraftsPage,
});

function DraftsPage() {
  return <DraftsList />;
}
