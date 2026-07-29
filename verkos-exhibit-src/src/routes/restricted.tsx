import { createFileRoute } from '@tanstack/react-router';
import { RestrictedPage } from '@auth';

export const Route = createFileRoute('/restricted')({
  component: RestrictedPage,
});
