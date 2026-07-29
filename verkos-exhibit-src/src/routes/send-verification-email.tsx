import { createFileRoute } from '@tanstack/react-router';
import SendVerificationEmailPage from '@auth/components/SendVerificationEmailPage';

export const Route = createFileRoute('/send-verification-email')({
  component: SendVerificationEmailPage,
});
