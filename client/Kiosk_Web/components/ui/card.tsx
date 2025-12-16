import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-lg text-foreground",
  {
    variants: {
      variant: {
        default: "bg-card border border-border shadow-sm",
        bordered: "bg-card border-2 border-primary",
        flat: "bg-muted",
        shadow: "bg-card shadow-lg",
        faded: "bg-muted/50 backdrop-blur-sm",
      },
      isHoverable: {
        true: "transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer",
      },
      isPressable: {
        true: "transition-all duration-200 active:scale-[0.98]",
      },
      isBlurred: {
        true: "backdrop-blur-md bg-card/80",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  disableAnimation?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, isHoverable, isPressable, isBlurred, fullWidth, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, isHoverable, isPressable, isBlurred, fullWidth, className }))}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// CardBody alias for convenience
const CardBody = CardContent
CardBody.displayName = "CardBody"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardBody }
