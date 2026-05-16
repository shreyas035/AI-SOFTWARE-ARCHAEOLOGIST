import { HTMLAttributes } from 'react';
import { cn } from '@utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'hover';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Reusable card component with variants
 */
export default function Card({
  className,
  variant = 'default',
  padding = 'md',
  children,
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-dark-900 border border-dark-700',
    glass: 'glass',
    hover: 'card-hover',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        'rounded-lg shadow-lg',
        variants[variant],
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function CardHeader({
  title,
  description,
  action,
  className,
  children,
  ...props
}: CardHeaderProps) {
  return (
    <div className={cn('mb-6', className)} {...props}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {title && (
            <h3 className="text-xl font-semibold text-white mb-1">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-dark-400">{description}</p>
          )}
          {children}
        </div>
        {action && <div className="ml-4">{action}</div>}
      </div>
    </div>
  );
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div className={cn('mt-6 pt-6 border-t border-dark-700', className)} {...props}>
      {children}
    </div>
  );
}

// Made with Bob
