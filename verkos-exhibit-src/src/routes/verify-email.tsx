import { createFileRoute } from '@tanstack/react-router';
import VerifyEmailPage from '@auth/components/VerifyEmailPage';

export const Route = createFileRoute('/verify-email')({
  component: VerifyEmailPage,
});
