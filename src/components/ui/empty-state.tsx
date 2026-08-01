import * as React from 'react'
import { clsx } from 'clsx'
import { HelpCircle } from 'lucide-react'

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, title = 'Nothing here yet', description = 'There\'s nothing to show.', icon, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'flex flex-col items-center justify-center text-center p-8 rounded-lg border border-dashed border-[#27272A] bg-[#0d0e12]/50',
          className
        )}
        {...props}
      >
        <div className="p-4 bg-[#27272A] rounded-full mb-4">
          {icon || <HelpCircle className="w-6 h-6 text-[#A1A1AA]" />}
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm text-[#A1A1AA] mb-4 max-w-sm">{description}</p>
        {action}
      </div>
    )
  }
)
EmptyState.displayName = 'EmptyState'

export { EmptyState }
