import { type HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'secondary' | 'outline' | 'destructive';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        {
          'bg-primary/10 text-primary': variant === 'default',
          'bg-green-100 text-green-800': variant === 'success',
          'bg-yellow-100 text-yellow-800': variant === 'warning',
          'bg-red-100 text-red-800': variant === 'error',
          'bg-gray-100 text-gray-800': variant === 'secondary',
          'border border-gray-300 text-gray-700': variant === 'outline',
          'bg-red-500 text-white': variant === 'destructive',
        },
        className
      )}
      {...props}
    />
  );
}
