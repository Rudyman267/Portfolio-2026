import { createFileRoute } from '@tanstack/react-router';
import { LoginWrapper } from '@auth';

export const Route = createFileRoute('/login')({
  component: LoginWrapper,
});
