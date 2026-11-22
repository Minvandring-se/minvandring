import type { VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { knappStil } from '@/components/ui/knappStil'
import { cn } from '@/lib/utils'

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof knappStil>) {
  return <button className={cn(knappStil({ variant, size }), className)} {...props} />
}
