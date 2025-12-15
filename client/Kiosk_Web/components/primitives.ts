import { tv } from "tailwind-variants";

export const title = tv({
  base: "tracking-tight inline font-bold",
  variants: {
    color: {
      golden: "from-golden-orange to-deep-amber",
      chocolate: "from-chocolate-brown to-chocolate-brown/80",
      mint: "from-mint-green to-mint-green/80",
      caramel: "from-caramel-beige to-caramel-beige/80",
      cream: "from-cream-white to-cream-white/90",
      primary: "from-golden-orange to-deep-amber",
      secondary: "from-caramel-beige to-chocolate-brown",
      success: "from-mint-green to-mint-green/80",
      warning: "from-golden-orange to-deep-amber",
      foreground: "dark:from-cream-white dark:to-caramel-beige",
    },
    size: {
      sm: "text-2xl lg:text-3xl",
      md: "text-3xl lg:text-4xl",
      lg: "text-4xl lg:text-5xl",
      xl: "text-5xl lg:text-6xl",
      "2xl": "text-6xl lg:text-7xl",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium", 
      semibold: "font-semibold",
      bold: "font-bold",
      extrabold: "font-extrabold",
    },
    fullWidth: {
      true: "w-full block",
    },
    animated: {
      true: "animate-pulse-slow",
      float: "animate-float",
      bounce: "animate-bounce-slow",
    },
  },
  defaultVariants: {
    size: "md",
    weight: "bold",
    color: "golden",
  },
  compoundVariants: [
    {
      color: [
        "golden",
        "chocolate", 
        "mint",
        "caramel",
        "cream",
        "primary",
        "secondary",
        "success",
        "warning",
        "foreground",
      ],
      class: "bg-clip-text text-transparent bg-gradient-to-r",
    },
  ],
});

export const subtitle = tv({
  base: "my-2 text-chocolate-brown/80 block max-w-full leading-relaxed",
  variants: {
    size: {
      sm: "text-sm lg:text-base",
      md: "text-base lg:text-lg", 
      lg: "text-lg lg:text-xl",
      xl: "text-xl lg:text-2xl",
    },
    color: {
      default: "text-chocolate-brown/80",
      muted: "text-chocolate-brown/60",
      light: "text-chocolate-brown/70",
      cream: "text-cream-white/90",
      golden: "text-golden-orange",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
    },
    fullWidth: {
      true: "w-full",
      false: "w-auto md:w-2/3 lg:w-1/2",
    },
    centered: {
      true: "text-center mx-auto",
      false: "text-left",
    },
  },
  defaultVariants: {
    size: "md",
    color: "default",
    weight: "normal",
    fullWidth: false,
    centered: false,
  },
});

export const kioskCard = tv({
  base: "rounded-2xl shadow-lg border-2 transition-all duration-300 cursor-pointer",
  variants: {
    variant: {
      default: "bg-cream-white border-golden-orange/20 hover:border-golden-orange hover:shadow-xl",
      featured: "bg-gradient-to-br from-golden-orange/10 to-cream-white border-golden-orange hover:border-deep-amber hover:shadow-2xl",
      special: "bg-gradient-to-br from-deep-amber/10 to-cream-white border-deep-amber hover:border-chocolate-brown hover:shadow-2xl",
      disabled: "bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed",
    },
    size: {
      sm: "p-4",
      md: "p-6", 
      lg: "p-8",
    },
    interactive: {
      true: "hover:scale-105 active:scale-98",
      false: "",
    },
    elevated: {
      true: "shadow-2xl hover:shadow-golden",
      false: "shadow-lg",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
    interactive: true,
    elevated: false,
  },
});

export const kioskButton = tv({
  base: "font-bold rounded-xl transition-all duration-300 border-2 min-h-[60px] touch-manipulation",
  variants: {
    variant: {
      primary: "bg-golden-orange border-golden-orange text-chocolate-brown hover:bg-deep-amber hover:border-deep-amber",
      secondary: "bg-caramel-beige border-caramel-beige text-chocolate-brown hover:bg-golden-orange hover:border-golden-orange",
      outline: "bg-transparent border-golden-orange text-chocolate-brown hover:bg-golden-orange/10",
      success: "bg-mint-green border-mint-green text-chocolate-brown hover:bg-mint-green/80",
      danger: "bg-red-500 border-red-500 text-white hover:bg-red-600",
      ghost: "bg-transparent border-transparent text-chocolate-brown hover:bg-golden-orange/10",
    },
    size: {
      sm: "px-4 py-2 text-sm min-h-[48px]",
      md: "px-6 py-3 text-base min-h-[60px]",
      lg: "px-8 py-4 text-lg min-h-[72px]",
      xl: "px-12 py-6 text-xl min-h-[84px]",
    },
    interactive: {
      true: "hover:scale-105 active:scale-98 hover:shadow-lg",
      false: "",
    },
    disabled: {
      true: "opacity-50 cursor-not-allowed hover:scale-100 active:scale-100",
      false: "",
    },
    rounded: {
      true: "rounded-full",
      false: "rounded-xl",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
    interactive: true,
    disabled: false,
    rounded: false,
  },
});

export const priceDisplay = tv({
  base: "font-bold text-center",
  variants: {
    size: {
      sm: "text-lg",
      md: "text-xl",
      lg: "text-2xl", 
      xl: "text-3xl",
    },
    variant: {
      regular: "text-chocolate-brown",
      special: "text-deep-amber",
      discounted: "text-red-600",
      sale: "text-golden-orange",
    },
    strike: {
      true: "line-through opacity-60",
      false: "",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "regular",
    strike: false,
  },
});

export const categoryChip = tv({
  base: "inline-flex items-center gap-2 rounded-full font-semibold transition-all duration-200",
  variants: {
    color: {
      golden: "bg-golden-orange/20 text-chocolate-brown border border-golden-orange/40",
      amber: "bg-deep-amber/20 text-chocolate-brown border border-deep-amber/40", 
      mint: "bg-mint-green/20 text-chocolate-brown border border-mint-green/40",
      caramel: "bg-caramel-beige/40 text-chocolate-brown border border-caramel-beige",
      chocolate: "bg-chocolate-brown/20 text-chocolate-brown border border-chocolate-brown/40",
    },
    size: {
      sm: "px-2 py-1 text-xs",
      md: "px-3 py-1.5 text-sm",
      lg: "px-4 py-2 text-base",
    },
    interactive: {
      true: "hover:scale-105 cursor-pointer",
      false: "",
    },
  },
  defaultVariants: {
    color: "golden",
    size: "md", 
    interactive: false,
  },
});

export const kioskInput = tv({
  base: "rounded-xl border-2 font-medium transition-all duration-200 min-h-[60px] text-lg",
  variants: {
    variant: {
      default: "border-golden-orange/40 focus:border-golden-orange bg-cream-white text-chocolate-brown",
      filled: "border-caramel-beige bg-caramel-beige/20 focus:border-golden-orange text-chocolate-brown",
      error: "border-red-400 focus:border-red-500 bg-red-50 text-red-900",
    },
    size: {
      md: "px-4 py-3 text-base min-h-[60px]",
      lg: "px-6 py-4 text-lg min-h-[72px]", 
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});