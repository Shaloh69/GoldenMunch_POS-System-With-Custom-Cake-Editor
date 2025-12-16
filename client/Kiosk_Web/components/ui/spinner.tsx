import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const spinnerVariants = cva(
  "inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]",
  {
    variants: {
      size: {
        sm: "h-4 w-4 border-2",
        md: "h-8 w-8 border-3",
        lg: "h-12 w-12 border-4",
        xl: "h-16 w-16 border-4",
      },
      color: {
        default: "text-sunny-yellow",
        primary: "text-sunny-yellow",
        secondary: "text-deep-orange-yellow",
        success: "text-mint-green",
        warning: "text-deep-orange-yellow",
        danger: "text-red-500",
        current: "text-current",
        white: "text-white",
      },
    },
    defaultVariants: {
      size: "md",
      color: "default",
    },
  }
)

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string
  labelColor?: string
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, color, label, labelColor, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("inline-flex flex-col items-center gap-2", className)} {...props}>
        <div
          className={cn(spinnerVariants({ size, color }))}
          role="status"
          aria-label={label || "Loading"}
        >
          <span className="sr-only">{label || "Loading..."}</span>
        </div>
        {label && (
          <span className={cn("text-sm", labelColor || "text-charcoal-gray/70")}>
            {label}
          </span>
        )}
      </div>
    )
  }
)
Spinner.displayName = "Spinner"

// Circular Progress variant (HeroUI compatible)
const CircularProgress = Spinner
CircularProgress.displayName = "CircularProgress"

export { Spinner, CircularProgress, spinnerVariants }
