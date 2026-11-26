import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Ett textfält på flera rader, med samma kant, text och fokus som Input. */
export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full rounded-knapp border border-muted-foreground/70 bg-card px-4 py-3 text-base focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
      {...props}
    />
  )
}
