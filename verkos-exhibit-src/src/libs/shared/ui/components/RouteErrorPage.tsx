import { useRouter } from '@tanstack/react-router';
import { Button } from '../fb-components';

interface RouteErrorPageProps {
  /** The error that occurred */
  error: Error;
  /** Route to navigate to when clicking the primary button. Defaults to '/' */
  homeRoute?: string;
  /** Text for the primary button. Defaults to 'Go to Home' */
  homeButtonText?: string;
}

export function RouteErrorPage({
  error,
  homeRoute = '/',
  homeButtonText = 'Go to Home',
}: RouteErrorPageProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md p-6 bg-background-level-2 border border-outline-primary rounded-lg text-center">
        <h2 className="fb-title1-semi text-error-30 mb-4">
          Something went wrong
        </h2>
        <p className="fb-body2-regular text-text-2 mb-4">
          We encountered an unexpected error. Please try again.
        </p>
        <p className="fb-tiny1-medium text-text-3 mb-6 break-words">
          {error.message}
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="primary"
            size="md"
            onClick={() => router.navigate({ to: homeRoute })}
          >
            {homeButtonText}
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </div>
      </div>
    </div>
  );
}
