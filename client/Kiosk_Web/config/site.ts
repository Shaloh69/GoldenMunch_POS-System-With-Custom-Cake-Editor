export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Golden Munch Kiosk",
  description:
    "Delicious treats at your fingertips - Order with ease from our interactive kiosk system.",
  navItems: [
    {
      label: "Menu",
      href: "/",
    },
    {
      label: "Categories",
      href: "/categories",
    },
    {
      label: "Specials",
      href: "/specials",
    },
    {
      label: "About",
      href: "/about",
    },
  ],
  categories: [
    {
      id: "cakes",
      name: "Cakes",
      emoji: "🍰",
      color: "golden-orange",
    },
    {
      id: "pastries",
      name: "Pastries",
      emoji: "🥐",
      color: "deep-amber",
    },
    {
      id: "cookies",
      name: "Cookies",
      emoji: "🍪",
      color: "caramel-beige",
    },
    {
      id: "beverages",
      name: "Beverages",
      emoji: "☕",
      color: "mint-green",
    },
    {
      id: "sandwiches",
      name: "Sandwiches",
      emoji: "🥪",
      color: "chocolate-brown",
    },
  ],
  idleTimeout: 30000, // 30 seconds of inactivity triggers idle screen
  links: {
    support: "#",
    admin: "/admin",
  },
};
