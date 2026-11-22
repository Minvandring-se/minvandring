import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        // Kanten är mörkare än border, så att fältet syns (minst 3:1 mot kortet i båda lägena). Fokus som i resten av appen.
        'h-11 w-full rounded-md border border-muted-foreground/70 bg-card px-4 text-base focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
      {...props}
    />
  )
}
