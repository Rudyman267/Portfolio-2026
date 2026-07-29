import React from 'react';
import { Toaster as SonnerToaster, toast } from 'sonner';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

type SnackbarVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

const toasterVariants = cva('toaster group', {
  variants: {
    theme: {
      light: 'light',
      dark: 'dark',
      system: 'system',
    },
    position: {
      'top-left': 'top-left',
      'top-center': 'top-center',
      'top-right': 'top-right',
      'bottom-left': 'bottom-left',
      'bottom-center': 'bottom-center',
      'bottom-right': 'bottom-right',
    },
  },
  defaultVariants: {
    theme: 'system',
    position: 'top-right',
  },
});

// Fallback styling for any non-custom Sonner toasts.
// Our public API renders the Snackbar UI using `toast.custom`.
const toastVariants = cva(
  'group toast group-[.toaster]:bg-surface group-[.toaster]:text-text-1 group-[.toaster]:border-outline-primary group-[.toaster]:shadow-lg',
  {
    variants: {
      variant: {
        default:
          'group-[.toaster]:bg-surface group-[.toaster]:text-text-1 group-[.toaster]:border-outline-primary',
        success:
          'group-[.toaster]:bg-success-30/70 group-[.toaster]:text-text-1 group-[.toaster]:border-success-30/80',
        error:
          'group-[.toaster]:bg-error-30/70 group-[.toaster]:text-text-1 group-[.toaster]:border-error-30/80',
        warning:
          'group-[.toaster]:bg-warning-30/70 group-[.toaster]:text-text-1 group-[.toaster]:border-warning-30/80',
        info: 'group-[.toaster]:bg-info-30/70 group-[.toaster]:text-text-1 group-[.toaster]:border-info-30/80',
      },
      size: {
        sm: 'group-[.toaster]:text-sm group-[.toaster]:p-3',
        md: 'group-[.toaster]:text-sm group-[.toaster]:p-4',
        lg: 'group-[.toaster]:text-base group-[.toaster]:p-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const snackbarVariants = cva(
  'relative overflow-hidden rounded-[8px] border border-white/[0.08] bg-background-level-2',
  {
    variants: {
      variant: {
        default: 'text-text-1',
        success: 'text-text-1',
        error: 'text-text-1',
        warning: 'text-text-1',
        info: 'text-text-1',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const snackbarTopBarVariants = cva('h-1 w-full', {
  variants: {
    variant: {
      default: 'bg-outline-primary',
      success: 'bg-success-30',
      error: 'bg-error-30',
      warning: 'bg-caution-30',
      info: 'bg-info-30',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const getSnackbarIconClassName = (variant: SnackbarVariant) => {
  switch (variant) {
    case 'success':
      return 'fa-solid fa-circle-check';
    case 'error':
      return 'fa-solid fa-circle-exclamation';
    case 'warning':
      return 'fa-solid fa-circle-exclamation';
    case 'info':
      return 'fa-solid fa-circle-info';
    default:
      return null;
  }
};

type SnackbarToastAction = {
  label: string;
  onClick: () => void;
};

type SnackbarToastProps = {
  id: string | number;
  message: string;
  description?: string;
  variant: SnackbarVariant;
  action?: SnackbarToastAction;
  cancel?: SnackbarToastAction;
  dismissible?: boolean;
};

const SnackbarToast: React.FC<SnackbarToastProps> = ({
  id,
  message,
  description,
  variant,
  action,
  cancel,
  dismissible = true,
}) => {
  const iconClassName = getSnackbarIconClassName(variant);

  return (
    <div className={snackbarVariants({ variant })} role="status">
      <div className={snackbarTopBarVariants({ variant })} />
      <div className="flex w-full items-start justify-between px-4 py-3">
        <div className="flex flex-1 items-start gap-2 pr-2">
          {iconClassName ? (
            <div className="mt-[2px] shrink-0 text-icon-1">
              <i className={cn(iconClassName, 'h-5 w-5 text-[20px]')} />
            </div>
          ) : null}

          <div className="flex-1">
            <p className="fb-body-1">{message}</p>

            {description ? (
              <p className="mt-1 fb-body-2 text-text-2">{description}</p>
            ) : null}

            {action || cancel ? (
              <div className="mt-1 flex h-5 items-center gap-[2px]">
                {action ? (
                  <button
                    type="button"
                    onClick={() => {
                      action.onClick();
                      toast.dismiss(id);
                    }}
                    className="font-dm-sans text-sm font-medium leading-5 text-primary-100 underline underline-offset-2"
                  >
                    {action.label}
                  </button>
                ) : null}

                {cancel ? (
                  <button
                    type="button"
                    onClick={() => {
                      cancel.onClick();
                      toast.dismiss(id);
                    }}
                    className="font-dm-sans text-sm font-medium leading-5 text-primary-100 underline underline-offset-2"
                  >
                    {cancel.label}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {dismissible ? (
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => toast.dismiss(id)}
            className="shrink-0 text-icon-1"
          >
            <i className="fa-solid fa-xmark h-5 w-5 text-[20px]" />
          </button>
        ) : (
          <div className="shrink-0 size-5" />
        )}
      </div>
    </div>
  );
};

const customToastWrapperClassNames = {
  toast: cn(
    // We render the full snackbar UI ourselves
    'group-[.toaster]:p-0 group-[.toaster]:bg-transparent group-[.toaster]:border-none group-[.toaster]:shadow-none'
  ),
  // Hide Sonner's internal action/cancel/close for custom snackbars
  actionButton: 'hidden',
  cancelButton: 'hidden',
  closeButton: 'hidden',
  description: 'hidden',
};

// Toaster component (mount once in app root)
export interface ToasterProps
  extends React.ComponentProps<typeof SonnerToaster>,
    VariantProps<typeof toasterVariants> {
  /**
   * Theme of the toaster
   * @default 'system'
   */
  theme?: 'light' | 'dark' | 'system';
  /**
   * Position of the toaster
   * @default 'top-right'
   */
  position?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
  /**
   * Toast variant for default styling
   * @default 'default'
   */
  variant?: SnackbarVariant;
  /**
   * Size of the toasts
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const Toaster: React.FC<ToasterProps> = ({
  theme = 'system',
  position = 'top-right',
  variant = 'default',
  size = 'md',
  className,
  ...props
}) => {
  return (
    <SonnerToaster
      theme={theme}
      position={position}
      className={cn(toasterVariants({ theme, position }), className)}
      toastOptions={{
        classNames: {
          toast: toastVariants({ variant, size }),
          description: 'group-[.toast]:text-text-1 fb-body-4',
          actionButton:
            'group-[.toast]:bg-primary-200 group-[.toast]:text-text-1 group-[.toast]:hover:bg-primary-200/90 group-[.toast]:focus:bg-primary-200/90 group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium',
          cancelButton:
            'group-[.toast]:bg-surface-hover group-[.toast]:text-text-1 group-[.toast]:hover:bg-surface-hover/80 group-[.toast]:focus:bg-surface-hover/80 group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium',
          closeButton:
            'group-[.toast]:border-outline-primary group-[.toast]:bg-surface group-[.toast]:text-text-1 group-[.toast]:hover:bg-surface-hover group-[.toast]:focus:bg-surface-hover',
        },
        ...props.toastOptions,
      }}
      {...props}
    />
  );
};

type SonnerToastOptions = Parameters<typeof toast>[1];

const showSnackbarToast = ({
  message,
  variant = 'default',
  description,
  action,
  cancel,
  duration = 4000,
  dismissible = true,
  position = 'top-right',
  options,
}: {
  message: string;
  variant?: SnackbarVariant;
  description?: string;
  action?: SnackbarToastAction;
  cancel?: SnackbarToastAction;
  duration?: number;
  dismissible?: boolean;
  position?: ToasterProps['position'];
  options?: SonnerToastOptions;
}) => {
  const { classNames, ...rest } = options ?? {};

  return toast.custom(
    (id) => (
      <SnackbarToast
        id={id}
        message={message}
        description={description}
        variant={variant}
        action={action}
        cancel={cancel}
        dismissible={dismissible}
      />
    ),
    {
      duration,
      dismissible,
      position,
      ...rest,
      classNames: {
        ...customToastWrapperClassNames,
        ...classNames,
        toast: cn(customToastWrapperClassNames.toast, classNames?.toast),
      },
    }
  );
};

// Toast utility functions
const styledToast = {
  success: (message: string, options?: Parameters<typeof toast.success>[1]) => {
    return showSnackbarToast({
      message,
      variant: 'success',
      description: options?.description as string | undefined,
      action: options?.action as unknown as SnackbarToastAction | undefined,
      cancel: options?.cancel as unknown as SnackbarToastAction | undefined,
      duration: options?.duration,
      dismissible: options?.dismissible,
      position: options?.position,
      options: options as unknown as SonnerToastOptions,
    });
  },

  error: (message: string, options?: Parameters<typeof toast.error>[1]) => {
    return showSnackbarToast({
      message,
      variant: 'error',
      description: options?.description as string | undefined,
      action: options?.action as unknown as SnackbarToastAction | undefined,
      cancel: options?.cancel as unknown as SnackbarToastAction | undefined,
      duration: options?.duration,
      dismissible: options?.dismissible,
      position: options?.position,
      options: options as unknown as SonnerToastOptions,
    });
  },

  warning: (message: string, options?: Parameters<typeof toast.warning>[1]) => {
    return showSnackbarToast({
      message,
      variant: 'warning',
      description: options?.description as string | undefined,
      action: options?.action as unknown as SnackbarToastAction | undefined,
      cancel: options?.cancel as unknown as SnackbarToastAction | undefined,
      duration: options?.duration,
      dismissible: options?.dismissible,
      position: options?.position,
      options: options as unknown as SonnerToastOptions,
    });
  },

  info: (message: string, options?: Parameters<typeof toast.info>[1]) => {
    return showSnackbarToast({
      message,
      variant: 'info',
      description: options?.description as string | undefined,
      action: options?.action as unknown as SnackbarToastAction | undefined,
      cancel: options?.cancel as unknown as SnackbarToastAction | undefined,
      duration: options?.duration,
      dismissible: options?.dismissible,
      position: options?.position,
      options: options as unknown as SonnerToastOptions,
    });
  },

  default: (message: string, options?: Parameters<typeof toast>[1]) => {
    return showSnackbarToast({
      message,
      variant: 'default',
      description: options?.description as string | undefined,
      action: options?.action as unknown as SnackbarToastAction | undefined,
      cancel: options?.cancel as unknown as SnackbarToastAction | undefined,
      duration: options?.duration,
      dismissible: options?.dismissible,
      position: options?.position,
      options: options,
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading?: string;
      success?: string | ((data: T) => string);
      error?: string | ((error: Error | unknown) => string);
      finally?: () => void;
    }
  ) => {
    const loadingMessage = options.loading || 'Loading...';

    const loadingId = showSnackbarToast({
      message: loadingMessage,
      variant: 'default',
      dismissible: false,
      // Keep it around until promise resolves/rejects
      duration: 60_000,
    });

    return promise
      .then((data) => {
        toast.dismiss(loadingId);
        const successMessage =
          typeof options.success === 'function'
            ? options.success(data)
            : options.success || 'Success!';

        showSnackbarToast({
          message: successMessage,
          variant: 'success',
        });

        return data;
      })
      .catch((error) => {
        toast.dismiss(loadingId);
        const errorMessage =
          typeof options.error === 'function'
            ? options.error(error)
            : options.error || 'Error occurred';

        showSnackbarToast({
          message: errorMessage,
          variant: 'error',
        });

        throw error;
      })
      .finally(() => {
        options.finally?.();
      });
  },

  custom: (
    jsx: (id: string | number) => React.ReactElement,
    options?: Parameters<typeof toast.custom>[1]
  ) => {
    return toast.custom(jsx, {
      ...options,
      classNames: {
        ...customToastWrapperClassNames,
        ...options?.classNames,
        toast: cn(
          customToastWrapperClassNames.toast,
          options?.classNames?.toast
        ),
      },
    });
  },
};

// Simple Toast API
export interface SimpleToastProps {
  /**
   * Toast message
   */
  message: string;
  /**
   * Toast variant
   * @default 'default'
   */
  variant?: SnackbarVariant;
  /**
   * Toast description
   */
  description?: string;
  /**
   * Action button configuration
   */
  action?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Cancel button configuration
   */
  cancel?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Duration in milliseconds
   * @default 4000
   */
  duration?: number;
  /**
   * Whether the toast is dismissible
   * @default true
   */
  dismissible?: boolean;
  /**
   * Position of the toast
   * @default 'top-right'
   */
  position?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
}

const showToast = ({
  message,
  variant = 'default',
  description,
  action,
  cancel,
  duration = 4000,
  dismissible = true,
  position = 'top-right',
}: SimpleToastProps) => {
  return showSnackbarToast({
    message,
    variant,
    description,
    action,
    cancel,
    duration,
    dismissible,
    position,
  });
};

// Toast Hook
const useToast = () => {
  return {
    toast: styledToast,
    showToast,
    dismiss: toast.dismiss,
    dismissAll: () => toast.dismiss(),
  };
};

export { Toaster, styledToast, showToast, useToast };

export default Toaster;
