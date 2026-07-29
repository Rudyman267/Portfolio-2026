import { createFileRoute } from '@tanstack/react-router';
import ThirdPartyVerification from '@auth/components/ThirdPartyAuthCallback';

export const Route = createFileRoute('/auth/callback/google')({
  component: ThirdPartyVerification,
});
