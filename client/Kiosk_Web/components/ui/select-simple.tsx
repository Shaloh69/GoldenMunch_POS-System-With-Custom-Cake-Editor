import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// Simple Select wrapper with HeroUI-like API
export interface SimpleSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'onChange'> {
  label?: string
  placeholder?: string
  selectedKeys?: string[]
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  size?: "sm" | "md" | "lg"
  variant?: "default" | "bordered" | "flat" | "faded"
  classNames?: {
    base?: string
    label?: string
    trigger?: string
    value?: string
    innerWrapper?: string
    selectorIcon?: string
    listboxWrapper?: string
    listbox?: string
    popoverContent?: string
  }
  listboxProps?: {
    itemClasses?: {
      base?: string
      title?: string
    }
  }
  children?: React.ReactNode
}

export const Select = React.forwardRef<HTMLSelectElement, SimpleSelectProps>(
  ({
    label,
    placeholder,
    selectedKeys,
    onChange,
    size = "md",
    variant = "default",
    classNames,
    listboxProps,
    className,
    children,
    ...props
  }, ref) => {
    const sizeClasses = {
      sm: "h-9 text-sm",
      md: "h-12 text-base",
      lg: "h-14 text-lg",
    }

    const variantClasses = {
      default: "border border-soft-warm-gray bg-pure-white",
      bordered: "border-2 border-sunny-yellow bg-pure-white",
      flat: "border-0 bg-soft-warm-gray",
      faded: "border border-soft-warm-gray bg-soft-warm-gray/30",
    }

    const value = selectedKeys && selectedKeys.length > 0 ? selectedKeys[0] : ""

    return (
      <div className={cn("w-full space-y-2", classNames?.base)}>
        {label && (
          <label className={cn("text-sm font-medium text-charcoal-gray", classNames?.label)}>
            {label}
          </label>
        )}
        <div className={cn("relative", classNames?.innerWrapper)}>
          <select
            ref={ref}
            value={value}
            onChange={onChange}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-3 py-2 text-charcoal-gray ring-offset-pure-white focus:outline-none focus:ring-2 focus:ring-sunny-yellow focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
              sizeClasses[size],
              variantClasses[variant],
              classNames?.trigger,
              classNames?.value,
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {children}
          </select>
          <div className={cn("absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none", classNames?.selectorIcon)}>
            <ChevronDown className="h-4 w-4 opacity-50 text-charcoal-gray" />
          </div>
        </div>
      </div>
    )
  }
)
Select.displayName = "Select"

export interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  textValue?: string
  children: React.ReactNode
}

export const SelectItem = React.forwardRef<HTMLOptionElement, SelectItemProps>(
  ({ className, children, textValue, ...props }, ref) => {
    return (
      <option
        ref={ref}
        className={cn("py-2 px-3 cursor-pointer hover:bg-sunny-yellow/20", className)}
        {...props}
      >
        {children}
      </option>
    )
  }
)
SelectItem.displayName = "SelectItem"
