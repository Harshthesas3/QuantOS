import * as React from 'react'
import { clsx } from 'clsx'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from '@radix-ui/react-slot'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8BFAF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0C10] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-[#C8BFAF] text-[#0B0C10] hover:bg-[#C8BFAF]/85',
        secondary: 'bg-[#2A2E36] text-[#F4F1EA] border border-[#2A2E36] hover:bg-[#3A3F46]',
        ghost: 'text-[#A9A39A] hover:bg-white/5 hover:text-[#F4F1EA]',
        destructive: 'bg-[#D98A8A]/10 text-[#D98A8A] border border-[#D98A8A]/30 hover:bg-[#D98A8A]/20',
        info: 'bg-[#A8C69F]/10 text-[#A8C69F] border border-[#A8C69F]/30 hover:bg-[#A8C69F]/20',
        link: 'text-[#C8BFAF] underline-offset-2 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 py-2 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, leftIcon, rightIcon, children, ...props }, ref) => {
    const content = (
      <>
        {leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </>
    )

    if (asChild) {
      const Comp = Slot
      return (
        <Comp
          className={clsx(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {content}
        </Comp>
      )
    }

    return (
      <button
        className={clsx(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {content}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
