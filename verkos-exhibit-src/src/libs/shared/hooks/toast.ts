import * as React from 'react';

export type ToastProps = {
  id?: string;
  className?: string;
  description?: React.ReactNode;
  duration?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDismiss?: () => void;
};

export type ToastActionElement = React.ReactElement<{
  className?: string;
  altText?: string;
  onClick?: () => void;
}>;
