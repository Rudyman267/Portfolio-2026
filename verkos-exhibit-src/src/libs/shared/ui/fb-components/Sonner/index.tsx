/**
 * Sonner Toast Component
 * Re-exports the main Toaster from sonner library with custom styling
 */
import { Toaster as SonnerToaster, toast } from 'sonner';
import React from 'react';

export interface ToasterProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  expand?: boolean;
  visibleToasts?: number;
  closeButton?: boolean;
  richColors?: boolean;
  duration?: number;
}

export interface SimpleToastProps {
  title?: string;
  description?: string;
  type?: 'default' | 'success' | 'error' | 'warning' | 'info';
}

export const Toaster: React.FC<ToasterProps> = (props) => {
  return (
    <SonnerToaster
      position={props.position || 'bottom-right'}
      expand={props.expand}
      visibleToasts={props.visibleToasts || 3}
      closeButton={props.closeButton}
      richColors={props.richColors}
      duration={props.duration || 4000}
      className="toaster"
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
    />
  );
};

export { toast };
export default Toaster;
