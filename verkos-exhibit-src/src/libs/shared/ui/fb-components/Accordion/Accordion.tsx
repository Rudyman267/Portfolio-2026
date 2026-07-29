import React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { cva } from 'class-variance-authority';
import { cn } from '../../../utils/utils';

const accordionItemVariants = cva('border-b border-b-outline-primary', {
  variants: {
    variant: {
      default: 'border-b-outline-primary',
      ghost: 'border-b-transparent',
      bordered: 'border border-outline-primary rounded-lg mb-2 last:mb-0',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const accordionTriggerVariants = cva(
  'flex flex-1 items-center justify-between py-4 px-2 fb-body-2 font-medium transition-all duration-150 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2 [&[data-state=open]>svg]:rotate-180',
  {
    variants: {
      variant: {
        default: 'text-text-1 hover:bg-surface-hover',
        ghost: 'text-text-1 hover:bg-transparent px-0',
        bordered: 'text-text-1 hover:bg-surface-hover rounded-lg',
      },
      size: {
        sm: 'py-2 px-2 fb-body-4',
        md: 'py-4 px-2 fb-body-2',
        lg: 'py-6 px-4 fb-body-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const accordionContentVariants = cva(
  'overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
  {
    variants: {
      variant: {
        default: 'px-2 pb-4',
        ghost: 'px-0 pb-4',
        bordered: 'px-4 pb-4',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Root component
const AccordionRoot = AccordionPrimitive.Root;

// Item component
export interface AccordionItemProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> {
  variant?: 'default' | 'ghost' | 'bordered';
  className?: string;
}

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>(({ className, variant = 'default', ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(accordionItemVariants({ variant, className }))}
    {...props}
  />
));
AccordionItem.displayName = 'AccordionItem';

// Trigger component
export interface AccordionTriggerProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> {
  variant?: 'default' | 'ghost' | 'bordered';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  hideChevron?: boolean;
  className?: string;
}

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      children,
      icon,
      hideChevron = false,
      ...props
    },
    ref
  ) => (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(accordionTriggerVariants({ variant, size, className }))}
        {...props}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="flex items-center">{icon}</span>}
          <span className="text-left">{children}</span>
        </div>
        {!hideChevron && (
          <i className="fa-solid fa-chevron-down text-sm transition-transform duration-200" />
        )}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
);
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

// Content component
export interface AccordionContentProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> {
  variant?: 'default' | 'ghost' | 'bordered';
  className?: string;
}

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  AccordionContentProps
>(({ className, variant = 'default', children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(accordionContentVariants({ variant, className }))}
    {...props}
  >
    <div className="fb-body-2 text-text-2">{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

// Base props for all accordion types
interface AccordionBaseProps {
  /**
   * Array of accordion items
   */
  items: Array<{
    value: string;
    trigger: string;
    content: React.ReactNode;
    icon?: React.ReactNode;
    disabled?: boolean;
  }>;
  /**
   * Visual variant of the accordion
   * @default 'default'
   */
  variant?: 'default' | 'ghost' | 'bordered';
  /**
   * Size of the accordion
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether to hide chevron icons
   * @default false
   */
  hideChevron?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

// Single accordion props
interface AccordionSingleProps extends AccordionBaseProps {
  /**
   * Whether multiple items can be open simultaneously
   */
  multiple?: false;
  /**
   * Default open value for uncontrolled accordion
   */
  defaultValue?: string;
  /**
   * Controlled open value
   */
  value?: string;
  /**
   * Callback when value changes
   */
  onValueChange?: (value: string) => void;
}

// Multiple accordion props
interface AccordionMultipleProps extends AccordionBaseProps {
  /**
   * Whether multiple items can be open simultaneously
   */
  multiple: true;
  /**
   * Default open values for uncontrolled accordion
   */
  defaultValue?: string[];
  /**
   * Controlled open values
   */
  value?: string[];
  /**
   * Callback when values change
   */
  onValueChange?: (value: string[]) => void;
}

export type AccordionProps = AccordionSingleProps | AccordionMultipleProps;

const Accordion: React.FC<AccordionProps> = (props) => {
  const {
    items,
    variant = 'default',
    size = 'md',
    hideChevron = false,
    className,
  } = props;

  if (props.multiple) {
    return (
      <AccordionRoot
        type="multiple"
        defaultValue={props.defaultValue}
        value={props.value}
        onValueChange={props.onValueChange}
        className={className}
      >
        {items.map((item) => (
          <AccordionItem key={item.value} value={item.value} variant={variant}>
            <AccordionTrigger
              variant={variant}
              size={size}
              icon={item.icon}
              hideChevron={hideChevron}
              disabled={item.disabled}
            >
              {item.trigger}
            </AccordionTrigger>
            <AccordionContent variant={variant}>
              {item.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </AccordionRoot>
    );
  }

  return (
    <AccordionRoot
      type="single"
      collapsible
      defaultValue={props.defaultValue as string | undefined}
      value={props.value as string | undefined}
      onValueChange={props.onValueChange as ((value: string) => void) | undefined}
      className={className}
    >
      {items.map((item) => (
        <AccordionItem key={item.value} value={item.value} variant={variant}>
          <AccordionTrigger
            variant={variant}
            size={size}
            icon={item.icon}
            hideChevron={hideChevron}
            disabled={item.disabled}
          >
            {item.trigger}
          </AccordionTrigger>
          <AccordionContent variant={variant}>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </AccordionRoot>
  );
};

export {
  Accordion,
  AccordionRoot,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  accordionItemVariants,
  accordionTriggerVariants,
  accordionContentVariants,
};

export default Accordion;
