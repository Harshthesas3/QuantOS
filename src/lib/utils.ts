import * as React from 'react'
import { clsx } from 'clsx'

export function cn(...inputs: React.ComponentPropsWithoutRef<'div'>['className'][]) {
  return clsx(inputs)
}
