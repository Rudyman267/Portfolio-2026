import { useRouter } from '@tanstack/react-router';
import { Button } from '../fb-components';

interface NotFoundPageProps {
  /** Route to navigate to when clicking the primary button. Defaults to '/' */
  homeRoute?: string;
  /** Text for the primary button. Defaults to 'Go to Home' */
  homeButtonText?: string;
}

export function NotFoundPage({
  homeRoute = '/',
  homeButtonText = 'Go to Home',
}: NotFoundPageProps = {}) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md p-8 bg-background-level-2 border border-outline-primary rounded-lg text-center">
        <div className="mb-6">
          <span className="text-6xl font-bold text-primary-200">404</span>
        </div>
        <h1 className="fb-title1-semi text-text-1 mb-3">Page Not Found</h1>
        <p className="fb-body2-regular text-text-2 mb-6">
          The page you're looking for doesn't exist or has been moved.
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
            onClick={() => router.history.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
