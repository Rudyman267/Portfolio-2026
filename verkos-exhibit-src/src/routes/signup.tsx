import { createFileRoute } from '@tanstack/react-router';
import { Signup } from '@auth';

export const Route = createFileRoute('/signup')({
  component: Signup,
});
