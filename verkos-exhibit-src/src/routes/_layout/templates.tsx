import { createFileRoute } from '@tanstack/react-router';
import TemplatesList from '../../components/reports/TemplatesList';

export const Route = createFileRoute('/_layout/templates')({
  component: TemplatesPage,
});

function TemplatesPage() {
  return <TemplatesList />;
}
