import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    size?: "sm" | "md" | "lg"
    color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger"
    showValueLabel?: boolean
    label?: string
    valueLabel?: string
    formatOptions?: Intl.NumberFormatOptions
  }
>(({ className, value, size = "md", color = "default", showValueLabel, label, valueLabel, ...props }, ref) => {
  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  }

  const colorClasses = {
    default: "bg-sunny-yellow",
    primary: "bg-sunny-yellow",
    secondary: "bg-deep-orange-yellow",
    success: "bg-mint-green",
    warning: "bg-deep-orange-yellow",
    danger: "bg-red-500",
  }

  return (
    <div className="w-full space-y-1">
      {(label || showValueLabel) && (
        <div className="flex justify-between text-sm">
          {label && <span className="text-charcoal-gray">{label}</span>}
          {showValueLabel && (
            <span className="text-charcoal-gray/70">
              {valueLabel || `${value || 0}%`}
            </span>
          )}
        </div>
      )}
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-full bg-soft-warm-gray",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 transition-all",
            colorClasses[color]
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
