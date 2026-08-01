import * as React from 'react'
import { clsx } from 'clsx'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs text-[#A9A39A] uppercase tracking-wider font-semibold block mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          className={clsx(
            'w-full bg-[#0B0C10] border border-[#2A2E36] px-3 py-2 rounded text-sm text-[#F4F1EA] placeholder-[#7C7870] transition-colors',
            error
              ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/30'
              : 'focus:border-[#C8BFAF] focus:ring-1 focus:ring-[#C8BFAF]/30',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-[#EF4444] mt-1">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
