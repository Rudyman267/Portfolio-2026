import { createFileRoute } from '@tanstack/react-router';
import AgentsList from '../../components/reports/AgentsList';

export const Route = createFileRoute('/_layout/agents')({
  component: AgentsPage,
});

function AgentsPage() {
  return <AgentsList />;
}
