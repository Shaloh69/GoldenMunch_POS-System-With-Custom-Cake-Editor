import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-sunny-yellow text-charcoal-gray shadow hover:bg-deep-orange-yellow",
        secondary:
          "border-transparent bg-deep-orange-yellow text-white shadow hover:bg-[#E89113]",
        destructive:
          "border-transparent bg-red-500 text-white shadow hover:bg-red-600",
        outline: "text-sunny-yellow border-sunny-yellow",
        solid: "border-transparent bg-sunny-yellow text-charcoal-gray",
        flat: "border-transparent bg-sunny-yellow/20 text-sunny-yellow",
        faded: "border-transparent bg-soft-warm-gray text-charcoal-gray",
        dot: "border-sunny-yellow bg-transparent text-sunny-yellow pl-4 relative before:absolute before:left-1.5 before:top-1/2 before:-translate-y-1/2 before:w-2 before:h-2 before:rounded-full before:bg-sunny-yellow",
      },
      size: {
        sm: "text-xs px-2 py-0.5",
        md: "text-sm px-2.5 py-0.5",
        lg: "text-base px-3 py-1",
      },
      radius: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        full: "rounded-full",
      },
      isOneChar: {
        true: "px-0 w-5 h-5 min-w-5 min-h-5 flex items-center justify-center",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      radius: "md",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  content?: React.ReactNode
  isInvisible?: boolean
  showOutline?: boolean
  placement?: "top-right" | "top-left" | "bottom-right" | "bottom-left"
  disableOutline?: boolean
  disableAnimation?: boolean
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, radius, isOneChar, content, children, ...props }, ref) => {
    // If children exists, this is a badge wrapper (like HeroUI)
    if (children) {
      return (
        <div className="relative inline-flex">
          {children}
          {content !== undefined && (
            <div
              ref={ref}
              className={cn(
                badgeVariants({ variant, size, radius, isOneChar, className }),
                "absolute -top-1 -right-1 z-10"
              )}
              {...props}
            >
              {content}
            </div>
          )}
        </div>
      )
    }

    // Otherwise, it's a standalone badge
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size, radius, isOneChar, className }))}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

// HeroUI-compatible Chip component (alias for Badge)
const Chip = Badge
Chip.displayName = "Chip"

export { Badge, Chip, badgeVariants }
