import {
  ErrorBoundary as ReactErrorBoundary,
  FallbackProps,
} from 'react-error-boundary';
import { ReactNode } from 'react';
import { ErrorInfo } from 'react';

interface Environment {
  environment: string;
}

interface FBErrorFallbackProps extends FallbackProps {
  environment: Environment;
}

function FBErrorFallback({
  error,
  resetErrorBoundary,
  environment,
}: FBErrorFallbackProps) {
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-background">
      <div className="absolute top-0 w-full flex pt-4">
        <img
          src="assets/flytbase-logo.svg"
          alt="FlytBase Logo"
          className="w-[150px] cursor-pointer mx-auto"
          title="Go to Dashboard"
        />
      </div>
      <div className="max-w-lg p-6 bg-background-level-2 border border-outline-primary rounded">
        <div className="flex items-center mb-3">
          {environment.environment !== 'development' && (
            <h2 className="fb-title1-semi text-error-30">
              We are sorry for the bad experience
            </h2>
          )}
          {environment.environment === 'development' && (
            <h2 className="fb-title1-semi text-error-30">
              Please fix the below error
            </h2>
          )}
        </div>
        {environment.environment !== 'development' && (
          <div className="mb-4">
            <p className="fb-body2-regular text-surface mb-2">
              Please try refreshing the page.
            </p>
            <p className="fb-body5-regular text-text-2">
              If the problem persists, please contact our support team for
              assistance. <br /> Contact:{' '}
              <a href="mailto:support@flytbase.com" className="text-primary-30">
                support@flytbase.com
              </a>
            </p>
          </div>
        )}
        {environment.environment === 'development' && (
          <div className="bg-error-container border-l-4 border-l-error-50 p-3 mb-4">
            <div className="fb-body5-regular text-text-2 mt-2 overflow-auto max-h-32 whitespace-pre-wrap">
              {error.message}
              {error.stack && (
                <>
                  {'\nStack trace\n:'}
                  {error.stack}
                </>
              )}
            </div>
          </div>
        )}
        {environment.environment !== 'development' && (
          <button
            onClick={resetErrorBoundary}
            className="bg-primary-200 px-4 py-1 text-text-1 rounded-lg"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  environment: Environment;
  fallback?: React.ComponentType<FallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

// Error boundary component that wraps applications with environment-aware error handling
export function FBErrorBoundary({
  children,
  environment,
  fallback,
  onError,
}: ErrorBoundaryProps) {
  const DefaultFallback = (props: FallbackProps) => (
    <FBErrorFallback {...props} environment={environment} />
  );

  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
    console.error('Stack trace:', error.stack);
    if (onError) {
      onError(error, errorInfo);
    }
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={fallback || DefaultFallback}
      onError={handleError}
      onReset={() => window.location.reload()}
    >
      {children}
    </ReactErrorBoundary>
  );
}
