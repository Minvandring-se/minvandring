import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 1234 g → "1,2 kg" */
export function kg(gram: number): string {
  return `${(gram / 1000).toLocaleString('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`
}

/** Bredd och sidmarginal för menyn på de utloggade sidorna: närmare skärmens kanter på stora skärmar, men högst 1440 px bred. */
export const menyBredd = 'mx-auto w-full max-w-[90rem] px-[clamp(1.5rem,4vw,4rem)]'
