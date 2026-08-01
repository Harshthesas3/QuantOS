import * as React from 'react'
import { clsx } from 'clsx'

export type StatusType =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: StatusType
  variant?: 'default' | 'outline' | 'solid'
}

const statusColors: Record<StatusType, { bg: string; text: string; border: string }> = {
  default: { bg: 'bg-[#27272A]/50', text: 'text-[#A1A1AA]', border: 'border-[#27272A]' },
  success: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  warning: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  error: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  info: { bg: 'bg-[#38BDF8]/10', text: 'text-[#38BDF8]', border: 'border-[#38BDF8]/30' },
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, status = 'default', variant = 'solid', children, ...props }, ref) => {
    const colors = statusColors[status]
    const baseClasses = 'inline-flex items-center rounded-full text-[10px] font-semibold uppercase tracking-wider'

    const variantClasses = {
      solid: `${colors.bg} ${colors.text}`,
      outline: `${colors.text} ${colors.border} border`,
      default: `${colors.bg} ${colors.text}`,
    }

    return (
      <span
        ref={ref}
        className={clsx(baseClasses, variantClasses[variant], 'px-2 py-0.5', className)}
        {...props}
      >
        {children}
      </span>
    )
  }
)
Badge.displayName = 'Badge'

export { Badge, statusColors }
