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
            className="text-xs text-[#A1A1AA] uppercase tracking-wider font-semibold block mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          className={clsx(
            'w-full bg-[#0d0e12] border border-[#27272A] px-3 py-2 rounded text-sm text-white placeholder-[#A1A1AA] transition-colors',
            error
              ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/30'
              : 'focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8]/30',
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
