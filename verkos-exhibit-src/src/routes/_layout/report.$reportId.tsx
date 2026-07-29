import { createFileRoute } from '@tanstack/react-router';
import { useReportStore } from '../../store/report.store';
import ReportReview from '../../components/reports/ReportReview';
import { NotFoundPage } from '../../libs/shared/ui/components/NotFoundPage';

export const Route = createFileRoute('/_layout/report/$reportId')({
  component: ReportReviewPage,
});

function ReportReviewPage() {
  const { reportId } = Route.useParams();
  const reports = useReportStore((state) => state.reports);
  const report = reports.find((r) => r.id === reportId);
  if (!report) return <NotFoundPage />;
  return <ReportReview report={report} />;
}
