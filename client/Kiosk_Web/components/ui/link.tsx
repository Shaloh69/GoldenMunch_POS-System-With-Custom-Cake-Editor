import * as React from "react"
import NextLink from "next/link"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const linkVariants = cva(
  "inline-flex items-center gap-1 transition-colors",
  {
    variants: {
      variant: {
        default: "text-sunny-yellow hover:text-deep-orange-yellow underline-offset-4 hover:underline",
        solid: "text-charcoal-gray hover:text-sunny-yellow",
        ghost: "text-charcoal-gray hover:bg-sunny-yellow/10 hover:text-sunny-yellow px-3 py-2 rounded-md",
        light: "text-sunny-yellow/70 hover:text-sunny-yellow",
        foreground: "text-charcoal-gray hover:text-sunny-yellow",
      },
      size: {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
      },
      underline: {
        none: "no-underline",
        hover: "no-underline hover:underline",
        always: "underline",
        active: "no-underline",
        focus: "no-underline focus:underline",
      },
      isBlock: {
        true: "block w-full",
      },
      isDisabled: {
        true: "opacity-50 pointer-events-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      underline: "none",
    },
  }
)

export interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>,
    VariantProps<typeof linkVariants> {
  href: string
  as?: string
  replace?: boolean
  scroll?: boolean
  shallow?: boolean
  prefetch?: boolean
  locale?: string | false
  isExternal?: boolean
  showAnchorIcon?: boolean
  anchorIcon?: React.ReactNode
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({
    className,
    variant,
    size,
    underline,
    isBlock,
    isDisabled,
    href,
    as,
    replace,
    scroll,
    shallow,
    prefetch,
    locale,
    isExternal,
    showAnchorIcon,
    anchorIcon,
    children,
    ...props
  }, ref) => {
    const linkClasses = cn(linkVariants({ variant, size, underline, isBlock, isDisabled, className }))

    // External link
    if (isExternal || href.startsWith('http')) {
      return (
        <a
          ref={ref}
          href={href}
          className={linkClasses}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
          {showAnchorIcon && (
            anchorIcon || (
              <svg
                className="w-3 h-3 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            )
          )}
        </a>
      )
    }

    // Internal Next.js link
    return (
      <NextLink
        ref={ref}
        href={href}
        as={as}
        replace={replace}
        scroll={scroll}
        shallow={shallow}
        prefetch={prefetch}
        locale={locale}
        className={linkClasses}
        {...props}
      >
        {children}
      </NextLink>
    )
  }
)
Link.displayName = "Link"

export { Link, linkVariants }
