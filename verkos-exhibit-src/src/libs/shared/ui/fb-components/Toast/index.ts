export { Toaster, styledToast, showToast, useToast } from './Toast';
export type { ToasterProps, SimpleToastProps } from './Toast';
export { Toaster as default } from './Toast';

// Re-export types that are referenced but come from radix or internal components
// These are placeholder types to satisfy the index exports
export type ToastProps = React.ComponentPropsWithoutRef<'div'>;
export type ToastViewportProps = React.ComponentPropsWithoutRef<'div'>;
export type ToastActionProps = React.ComponentPropsWithoutRef<'button'>;
export type ToastCloseProps = React.ComponentPropsWithoutRef<'button'>;
export type ToastTitleProps = React.ComponentPropsWithoutRef<'div'>;
export type ToastDescriptionProps = React.ComponentPropsWithoutRef<'div'>;

import React from 'react';
