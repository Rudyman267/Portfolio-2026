import { createFileRoute } from '@tanstack/react-router';
import { useReportStore } from '../../store/report.store';
import TemplateDetail from '../../components/reports/TemplateDetail';
import { NotFoundPage } from '../../libs/shared/ui/components/NotFoundPage';

export const Route = createFileRoute('/_layout/template/$templateId')({
  component: TemplateDetailPage,
});

function TemplateDetailPage() {
  const { templateId } = Route.useParams();
  const templates = useReportStore((state) => state.templates);
  const template = templates.find((t) => t.id === templateId);
  if (!template) return <NotFoundPage />;
  return <TemplateDetail template={template} />;
}
