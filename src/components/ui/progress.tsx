import * as React from 'react'
import { clsx } from 'clsx'

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'info' | 'warning' | 'danger'
  showLabel?: boolean
}

const variantColors: Record<string, string> = {
  default: 'bg-[#38BDF8]',
  success: 'bg-green-500',
  info: 'bg-blue-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
}

const sizeHeights: Record<string, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-4',
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, value, max = 100, size = 'md', variant = 'default', showLabel = true, ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100))
    const colorClass = variantColors[variant] || variantColors.default
    const heightClass = sizeHeights[size] || sizeHeights.md
    const labelValue = showLabel ? `${Math.round(percentage)}%` : null

    return (
      <div ref={ref} className={clsx("w-full", className)} {...props}>
        {labelValue && (
          <div className="flex justify-between text-xs text-[#A1A1AA] mb-1">
            <span>{labelValue}</span>
          </div>
        )}
        <div
          className={clsx(
            'w-full bg-[#18181B] rounded-full overflow-hidden border border-[#27272A]',
            heightClass
          )}
        >
          <div
            className={clsx('h-full rounded-full transition-all duration-300', colorClass)}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }
)
ProgressBar.displayName = 'ProgressBar'

export { ProgressBar, variantColors }

export default ProgressBar
