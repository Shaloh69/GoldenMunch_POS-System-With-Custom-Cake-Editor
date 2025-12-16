import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
    size?: "sm" | "md" | "lg"
    color?: "default" | "primary" | "secondary" | "success"
    isSelected?: boolean
    onValueChange?: (checked: boolean) => void
  }
>(({ className, size = "md", color = "default", isSelected, onValueChange, checked, ...props }, ref) => {
  const sizeClasses = {
    sm: "h-5 w-9",
    md: "h-6 w-11",
    lg: "h-7 w-14",
  }

  const thumbSizeClasses = {
    sm: "h-4 w-4 data-[state=checked]:translate-x-4",
    md: "h-5 w-5 data-[state=checked]:translate-x-5",
    lg: "h-6 w-6 data-[state=checked]:translate-x-7",
  }

  const colorClasses = {
    default: "data-[state=checked]:bg-sunny-yellow",
    primary: "data-[state=checked]:bg-sunny-yellow",
    secondary: "data-[state=checked]:bg-deep-orange-yellow",
    success: "data-[state=checked]:bg-mint-green",
  }

  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunny-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-pure-white disabled:cursor-not-allowed disabled:opacity-50 data-[state=unchecked]:bg-soft-warm-gray",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      checked={checked ?? isSelected}
      onCheckedChange={onValueChange}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block rounded-full bg-pure-white shadow-lg ring-0 transition-transform data-[state=unchecked]:translate-x-0",
          thumbSizeClasses[size]
        )}
      />
    </SwitchPrimitives.Root>
  )
})
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
