import * as React from 'react';
import { cn } from '../utils/cn';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-lg border border-neutral-200 bg-white', className)} {...props} />;
}
