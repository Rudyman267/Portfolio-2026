import { createFileRoute } from '@tanstack/react-router';
import { PasswordlessVerification } from '@auth';

export const Route = createFileRoute('/verify')({
  component: PasswordlessVerification,
});
