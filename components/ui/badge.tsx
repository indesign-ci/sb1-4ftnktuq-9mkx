import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-gold-100 text-gold-700',
        secondary: 'border-transparent bg-gray-100 text-gray-700',
        destructive: 'border-transparent bg-red-100 text-red-700',
        // Nouveaux états globaux
        success: 'border-transparent bg-green-50 text-green-600',
        warning: 'border-transparent bg-orange-50 text-orange-600',
        danger: 'border-transparent bg-red-50 text-red-600',
        info: 'border-transparent bg-blue-50 text-blue-600',
        draft: 'border-transparent bg-gray-100 text-gray-600',
        // États existants spécifiques
        pending: 'border-transparent bg-orange-50 text-orange-600',
        approved: 'border-transparent bg-green-50 text-green-600',
        rejected: 'border-transparent bg-red-50 text-red-600',
        outline: 'border-gray-200 text-gray-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
