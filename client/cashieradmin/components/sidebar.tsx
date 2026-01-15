"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import { Tooltip } from "@heroui/tooltip";
import {
  HomeIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  Square3Stack3DIcon,
  TagIcon,
  UserGroupIcon,
  CakeIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BanknotesIcon,
  QrCodeIcon,
  PlusCircleIcon,
  PercentBadgeIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

import { useAuth } from "@/contexts/AuthContext";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";
import { Badge } from "@heroui/badge";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  adminOnly?: boolean;
  cashierOnly?: boolean;
}

const cashierNav: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Notifications", href: "/cashier/notifications", icon: BellIcon },
  { name: "New Order", href: "/cashier/new-order", icon: PlusCircleIcon },
  {
    name: "Orders & Payments",
    href: "/cashier/orders",
    icon: ShoppingCartIcon,
  },
  { name: "Custom Cakes", href: "/cashier/custom-cakes", icon: CakeIcon },
];

const adminNav: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Notifications", href: "/admin/notifications", icon: BellIcon, adminOnly: true },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: ChartBarIcon,
    adminOnly: true,
  },
  {
    name: "Transactions",
    href: "/admin/transactions",
    icon: BanknotesIcon,
    adminOnly: true,
  },
  {
    name: "Menu Management",
    href: "/admin/menu",
    icon: Square3Stack3DIcon,
    adminOnly: true,
  },
  {
    name: "Categories",
    href: "/admin/categories",
    icon: TagIcon,
    adminOnly: true,
  },
  {
    name: "Discounts",
    href: "/admin/discounts",
    icon: PercentBadgeIcon,
    adminOnly: true,
  },
  {
    name: "Cashiers",
    href: "/admin/cashiers",
    icon: UserGroupIcon,
    adminOnly: true,
  },
  {
    name: "Custom Cakes",
    href: "/admin/custom-cakes",
    icon: CakeIcon,
    adminOnly: true,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Cog6ToothIcon,
    adminOnly: true,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { unreadCount } = useUnreadNotificationCount();

  const navItems = isAdmin() ? adminNav : cashierNav;

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }

    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-gradient-to-r from-light-caramel to-muted-clay text-white shadow-caramel hover:shadow-xl transition-all duration-300 hover:scale-105"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <Bars3Icon className="h-6 w-6" />
        ) : (
          <XMarkIcon className="h-6 w-6" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen
          bg-gradient-to-b from-cream-white via-soft-sand to-warm-beige
          border-r border-light-caramel/30
          transition-all duration-300 z-40 shadow-soft
          ${isCollapsed ? "-translate-x-full lg:w-20" : "w-72"}
          lg:translate-x-0
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-5 border-b border-light-caramel/20">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🥐</div>
            {!isCollapsed && (
              <div>
                <h2 className="font-bold text-xl bg-gradient-to-r from-light-caramel to-muted-clay bg-clip-text text-transparent">
                  GoldenMunch
                </h2>
                <p className="text-xs font-medium text-warm-beige">
                  {isAdmin() ? "Admin Portal" : "Cashier Portal"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="p-5 border-b border-light-caramel/20 bg-gradient-to-r from-soft-sand/30 to-transparent">
          <div className="flex items-center gap-3">
            <Avatar
              className="bg-gradient-to-r from-light-caramel to-muted-clay ring-2 ring-light-caramel/30"
              name={user?.name}
              size="sm"
            />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-muted-clay">
                  {user?.name}
                </p>
                <p className="text-xs text-warm-beige capitalize font-medium">
                  {user?.type}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const isNotification = item.icon === BellIcon;

            const navButton = (
              <Link
                key={item.name}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl
                  transition-all duration-300 transform hover:scale-105
                  ${
                    active
                      ? "bg-gradient-to-r from-light-caramel to-muted-clay text-white shadow-caramel border border-light-caramel/30"
                      : "hover:bg-soft-sand/50 text-muted-clay hover:text-muted-clay border border-transparent hover:border-light-caramel/20"
                  }
                  ${isCollapsed ? "justify-center" : ""}
                `}
                href={item.href}
              >
                <div className="relative">
                  <Icon
                    className={`h-5 w-5 flex-shrink-0 ${active ? "animate-pulse-slow" : ""}`}
                  />
                  {isNotification && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                {!isCollapsed && (
                  <span className="text-sm font-semibold">{item.name}</span>
                )}
                {!isCollapsed && isNotification && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.name} content={item.name} placement="right">
                  {navButton}
                </Tooltip>
              );
            }

            return navButton;
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-light-caramel/20 bg-gradient-to-r from-soft-sand/30 to-transparent">
          <Button
            className={`w-full bg-gradient-to-r from-red-400 to-red-500 text-black hover:from-red-500 hover:to-red-600 shadow-md hover:shadow-lg transition-all duration-300 ${isCollapsed ? "px-2" : ""}`}
            startContent={
              !isCollapsed && <ArrowRightOnRectangleIcon className="h-5 w-5" />
            }
            onClick={logout}
          >
            {isCollapsed ? (
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            ) : (
              "Logout"
            )}
          </Button>

          {!isCollapsed && (
            <Button
              className="w-full mt-2 hidden lg:flex text-warm-beige hover:text-muted-clay hover:bg-soft-sand/30"
              size="sm"
              variant="light"
              onClick={() => setIsCollapsed(true)}
            >
              Collapse
            </Button>
          )}

          {isCollapsed && (
            <Button
              className="w-full mt-2 hidden lg:flex px-2 text-warm-beige hover:text-muted-clay"
              size="sm"
              variant="light"
              onClick={() => setIsCollapsed(false)}
            >
              <Bars3Icon className="h-5 w-5" />
            </Button>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-warm-beige/80 backdrop-blur-sm z-30 animate-fade-in"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  );
}
