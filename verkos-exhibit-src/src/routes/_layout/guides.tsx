/**
 * Integration Guides Route
 *
 * Displays integration guides for adding various features to the template app.
 */

import { createFileRoute } from '@tanstack/react-router';
import IntegrationGuidesViewer from '@/components/guides/IntegrationGuidesViewer';

function GuidesPage() {
  return <IntegrationGuidesViewer />;
}

export const Route = createFileRoute('/_layout/guides')({
  component: GuidesPage,
});
