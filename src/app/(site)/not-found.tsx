import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="text-[var(--step-0)] font-medium text-accent">404</p>
      <h1 className="mt-3 text-[var(--step-4)] font-semibold">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-muted">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
      </p>
      <div className="mt-8">
        <ButtonLink href="/">Back home</ButtonLink>
      </div>
    </Container>
  );
}
