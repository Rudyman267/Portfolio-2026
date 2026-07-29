import { createFileRoute } from '@tanstack/react-router';
import { LogoutPage } from '@auth';

export const Route = createFileRoute('/logout')({
  component: LogoutPage,
});
