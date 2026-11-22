import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * En vanlig väljare med samma höjd, kant och fokus som Input.
 * Texten är 16 px, annars zoomar iPhone in sidan när väljaren får fokus.
 */
export function Select({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'h-11 w-full rounded-md border border-border bg-card px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20',
        className,
      )}
      {...props}
    />
  )
}
