"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { Divider } from "@heroui/divider";
import { Avatar } from "@heroui/avatar";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { MenuIcon, CloseIcon, LogoutIcon, UserIcon, ChevronDownIcon } from "@/components/icons";
import { ThemeSwitch } from "@/components/theme-switch";

export const AdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const handleLogout = () => {
    // Clear authentication tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('cashier_token');
      window.location.href = '/login';
    }
  };

  return (
    <aside
      className={clsx(
        "fixed left-0 top-0 h-screen bg-gradient-to-b from-golden-orange to-deep-amber text-chocolate-brown shadow-xl-golden z-50 sidebar-transition",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-chocolate-brown/20">
        {!isCollapsed && (
          <div className="flex items-center gap-3 animate-fade-in">
            <span className="text-4xl">🍰</span>
            <div>
              <h1 className="font-bold text-xl text-cream-white">Golden Munch</h1>
              <p className="text-xs text-chocolate-brown/70">Admin Dashboard</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <span className="text-3xl mx-auto animate-fade-in">🍰</span>
        )}
        <Button
          isIconOnly
          size="sm"
          variant="light"
          className={clsx("text-cream-white", isCollapsed && "hidden")}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <MenuIcon size={20} /> : <CloseIcon size={20} />}
        </Button>
      </div>

      {/* Collapse button when collapsed */}
      {isCollapsed && (
        <div className="flex justify-center p-2">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className="text-cream-white"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <MenuIcon size={20} />
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {siteConfig.navItems.map((item) => {
          const isActive = pathname === item.href;

          if (isCollapsed) {
            return (
              <Tooltip key={item.href} content={item.label} placement="right">
                <Button
                  as={NextLink}
                  href={item.href}
                  isIconOnly
                  size="lg"
                  variant={isActive ? "solid" : "light"}
                  className={clsx(
                    "w-full",
                    isActive
                      ? "bg-cream-white text-golden-orange shadow-golden"
                      : "text-cream-white hover:bg-deep-amber/30"
                  )}
                >
                  <span className="text-2xl">{item.icon}</span>
                </Button>
              </Tooltip>
            );
          }

          return (
            <Button
              key={item.href}
              as={NextLink}
              href={item.href}
              size="lg"
              variant={isActive ? "solid" : "light"}
              className={clsx(
                "w-full justify-start gap-3 animate-slide-right",
                isActive
                  ? "bg-cream-white text-golden-orange shadow-golden font-bold"
                  : "text-cream-white hover:bg-deep-amber/30 font-medium"
              )}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t-2 border-chocolate-brown/20">
        {!isCollapsed && (
          <div className="mb-4">
            <ThemeSwitch />
          </div>
        )}

        <Divider className="mb-4 bg-chocolate-brown/20" />

        {isCollapsed ? (
          <div className="space-y-2">
            <Tooltip content="Profile" placement="right">
              <Button
                isIconOnly
                size="lg"
                variant="light"
                className="w-full text-cream-white"
              >
                <UserIcon size={24} />
              </Button>
            </Tooltip>
            <Tooltip content="Logout" placement="right">
              <Button
                isIconOnly
                size="lg"
                variant="light"
                className="w-full text-cream-white hover:bg-red-500/30"
                onClick={handleLogout}
              >
                <LogoutIcon size={24} />
              </Button>
            </Tooltip>
          </div>
        ) : (
          <Dropdown placement="top">
            <DropdownTrigger>
              <Button
                variant="light"
                className="w-full justify-start gap-3 text-cream-white hover:bg-deep-amber/30"
              >
                <Avatar
                  size="sm"
                  name="Admin"
                  className="bg-cream-white text-golden-orange font-bold"
                />
                <div className="flex-1 text-left">
                  <p className="font-semibold">Administrator</p>
                  <p className="text-xs opacity-70">admin@goldenmunch.com</p>
                </div>
                <ChevronDownIcon size={20} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="User menu">
              <DropdownItem
                key="profile"
                startContent={<UserIcon size={18} />}
              >
                Profile Settings
              </DropdownItem>
              <DropdownItem
                key="logout"
                className="text-danger"
                color="danger"
                startContent={<LogoutIcon size={18} />}
                onClick={handleLogout}
              >
                Logout
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )}
      </div>
    </aside>
  );
};
