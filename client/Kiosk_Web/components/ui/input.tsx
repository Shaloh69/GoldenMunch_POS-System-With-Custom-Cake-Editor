import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-md border bg-pure-white px-3 py-2 text-base ring-offset-pure-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-charcoal-gray/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunny-yellow focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-soft-warm-gray",
        bordered: "border-2 border-sunny-yellow",
        flat: "border-0 bg-soft-warm-gray",
        faded: "border-soft-warm-gray bg-soft-warm-gray/30",
        underlined: "rounded-none border-0 border-b-2 border-sunny-yellow px-0 focus-visible:ring-0",
      },
      inputSize: {
        sm: "h-9 text-sm",
        md: "h-12 text-base",
        lg: "h-14 text-lg",
      },
      radius: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        full: "rounded-full",
      },
      isInvalid: {
        true: "border-red-500 focus-visible:ring-red-500",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "md",
      radius: "md",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string
  description?: string
  errorMessage?: string
  startContent?: React.ReactNode
  endContent?: React.ReactNode
  isReadOnly?: boolean
  isRequired?: boolean
  isDisabled?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type,
    variant,
    inputSize,
    radius,
    isInvalid,
    fullWidth,
    label,
    description,
    errorMessage,
    startContent,
    endContent,
    isReadOnly,
    isRequired,
    isDisabled,
    disabled,
    readOnly,
    required,
    ...props
  }, ref) => {
    const hasError = isInvalid || !!errorMessage

    return (
      <div className={cn("w-full space-y-2", fullWidth && "w-full")}>
        {label && (
          <label className="text-sm font-medium text-charcoal-gray">
            {label}
            {(isRequired || required) && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {startContent && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-gray/70">
              {startContent}
            </div>
          )}
          <input
            type={type}
            className={cn(
              inputVariants({ variant, inputSize, radius, isInvalid: hasError, fullWidth, className }),
              startContent && "pl-10",
              endContent && "pr-10"
            )}
            ref={ref}
            disabled={disabled || isDisabled}
            readOnly={readOnly || isReadOnly}
            required={required || isRequired}
            {...props}
          />
          {endContent && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-gray/70">
              {endContent}
            </div>
          )}
        </div>
        {description && !hasError && (
          <p className="text-xs text-charcoal-gray/70">{description}</p>
        )}
        {hasError && errorMessage && (
          <p className="text-xs text-red-500">{errorMessage}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
