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
        'h-11 w-full rounded-knapp border border-muted-foreground/70 bg-card px-3 text-base focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
      {...props}
    />
  )
}
