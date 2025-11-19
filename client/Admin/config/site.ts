export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Golden Munch Admin",
  description: "Administrative dashboard for Golden Munch POS System",
  navItems: [
    {
      label: "Dashboard",
      href: "/",
      icon: "📊",
    },
    {
      label: "Orders",
      href: "/orders",
      icon: "🛒",
    },
    {
      label: "Products",
      href: "/products",
      icon: "🍰",
    },
    {
      label: "Custom Cakes",
      href: "/custom-cakes",
      icon: "🎂",
    },
    {
      label: "Categories",
      href: "/categories",
      icon: "📁",
    },
    {
      label: "Inventory",
      href: "/inventory",
      icon: "📦",
    },
    {
      label: "Users",
      href: "/users",
      icon: "👥",
    },
    {
      label: "Analytics",
      href: "/analytics",
      icon: "📈",
    },
    {
      label: "Promotions",
      href: "/promotions",
      icon: "🎁",
    },
    {
      label: "Feedback",
      href: "/feedback",
      icon: "💬",
    },
    {
      label: "Settings",
      href: "/settings",
      icon: "⚙️",
    },
  ],
  links: {
    kiosk: "http://localhost:3000",
    docs: "#",
    support: "#",
  },
};
