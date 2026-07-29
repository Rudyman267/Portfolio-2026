import { createFileRoute } from '@tanstack/react-router';
import OrgNotAccessiblePage from '@auth/components/OrgNotAccessiblePage';

export const Route = createFileRoute('/org-not-accessible')({
  component: OrgNotAccessiblePage,
});
