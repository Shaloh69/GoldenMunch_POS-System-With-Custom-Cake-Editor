import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-sunny-yellow text-charcoal-gray hover:bg-deep-orange-yellow shadow-md",
        destructive:
          "bg-red-500 text-white hover:bg-red-600",
        outline:
          "border-2 border-sunny-yellow bg-transparent text-sunny-yellow hover:bg-sunny-yellow hover:text-charcoal-gray",
        secondary:
          "bg-deep-orange-yellow text-white hover:bg-[#E89113]",
        ghost: "hover:bg-sunny-yellow/10 hover:text-sunny-yellow",
        link: "text-sunny-yellow underline-offset-4 hover:underline",
        solid: "bg-sunny-yellow text-charcoal-gray hover:bg-deep-orange-yellow shadow-md",
        bordered: "border-2 border-sunny-yellow bg-transparent text-sunny-yellow hover:bg-sunny-yellow hover:text-charcoal-gray",
        flat: "bg-sunny-yellow/20 text-sunny-yellow hover:bg-sunny-yellow/30",
        faded: "bg-soft-warm-gray text-charcoal-gray hover:bg-caramel-beige",
        shadow: "bg-sunny-yellow text-charcoal-gray hover:bg-deep-orange-yellow shadow-lg",
        light: "bg-sunny-yellow/10 text-sunny-yellow hover:bg-sunny-yellow/20",
      },
      size: {
        default: "h-12 px-6 py-3 text-base",
        sm: "h-9 px-4 text-sm",
        lg: "h-14 px-8 text-lg",
        xl: "h-16 px-10 text-xl",
        icon: "h-10 w-10",
      },
      radius: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        full: "rounded-full",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      radius: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  isDisabled?: boolean
  startContent?: React.ReactNode
  endContent?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, radius, fullWidth, asChild = false, isLoading, isDisabled, startContent, endContent, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, radius, fullWidth, className }))}
        ref={ref}
        disabled={disabled || isDisabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {startContent && !isLoading && startContent}
        {children}
        {endContent && endContent}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
