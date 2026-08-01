import * as React from 'react'
import { clsx } from 'clsx'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs text-[#A1A1AA] uppercase tracking-wider font-semibold block mb-1.5"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          className={clsx(
            'w-full bg-[#0d0e12] border border-[#27272A] px-3 py-2 rounded text-sm text-white focus:outline-none transition-colors',
            error
              ? 'border-[#EF4444] focus:border-[#EF4444]'
              : 'focus:border-[#38BDF8]',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-[#EF4444] mt-1">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'

export { Select }
