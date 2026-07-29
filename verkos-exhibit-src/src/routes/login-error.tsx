import { createFileRoute } from '@tanstack/react-router';
import { LoginErrorPage } from '@auth';

export const Route = createFileRoute('/login-error')({
  component: LoginErrorPage,
});
