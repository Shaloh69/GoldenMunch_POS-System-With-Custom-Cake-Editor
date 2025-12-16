import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  description?: string
  errorMessage?: string
  isInvalid?: boolean
  isRequired?: boolean
  isDisabled?: boolean
  isReadOnly?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    className,
    label,
    description,
    errorMessage,
    isInvalid,
    isRequired,
    isDisabled,
    isReadOnly,
    ...props
  }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className={cn(
            "text-sm font-medium text-charcoal-gray mb-1.5 block",
            isDisabled && "opacity-50",
            isRequired && "after:content-['*'] after:ml-0.5 after:text-red-500"
          )}>
            {label}
          </label>
        )}
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border-2 bg-white px-3 py-2 text-base",
            "placeholder:text-charcoal-gray/50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunny-yellow focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "resize-vertical",
            isInvalid
              ? "border-red-500 focus-visible:ring-red-500"
              : "border-sunny-yellow/60 hover:border-sunny-yellow",
            className
          )}
          ref={ref}
          disabled={isDisabled}
          readOnly={isReadOnly}
          {...props}
        />
        {description && !isInvalid && (
          <p className="text-xs text-charcoal-gray/70 mt-1.5">{description}</p>
        )}
        {isInvalid && errorMessage && (
          <p className="text-xs text-red-500 mt-1.5">{errorMessage}</p>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
