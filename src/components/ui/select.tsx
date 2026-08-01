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
            className="text-xs text-[#A9A39A] uppercase tracking-wider font-semibold block mb-1.5"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          className={clsx(
            'w-full bg-[#0B0C10] border border-[#2A2E36] px-3 py-2 rounded text-sm text-[#F4F1EA] focus:outline-none transition-colors',
            error
              ? 'border-[#EF4444] focus:border-[#EF4444]'
              : 'focus:border-[#C8BFAF]',
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
