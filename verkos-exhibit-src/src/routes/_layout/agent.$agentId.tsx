import { createFileRoute } from '@tanstack/react-router';
import { useReportStore } from '../../store/report.store';
import AgentDetail from '../../components/reports/AgentDetail';
import { NotFoundPage } from '../../libs/shared/ui/components/NotFoundPage';

export const Route = createFileRoute('/_layout/agent/$agentId')({
  component: AgentDetailPage,
});

function AgentDetailPage() {
  const { agentId } = Route.useParams();
  const agents = useReportStore((state) => state.agents);
  const agent = agents.find((a) => a.id === agentId);
  if (!agent) return <NotFoundPage />;
  return <AgentDetail agent={agent} />;
}
