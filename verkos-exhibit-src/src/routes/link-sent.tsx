import { createFileRoute } from '@tanstack/react-router';
import { LinkSentPage } from '@auth';

export const Route = createFileRoute('/link-sent')({
  component: LinkSentPage,
});
