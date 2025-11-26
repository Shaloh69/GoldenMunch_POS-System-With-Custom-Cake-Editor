'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@heroui/button';
import { Divider } from '@heroui/divider';
import { Avatar } from '@heroui/avatar';
import { Tooltip } from '@heroui/tooltip';
import { Chip } from '@heroui/chip';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  TrashIcon,
  ReceiptRefundIcon,
  ChartBarIcon,
  Square3Stack3DIcon,
  TagIcon,
  CubeIcon,
  UserGroupIcon,
  CakeIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  adminOnly?: boolean;
  cashierOnly?: boolean;
  badge?: string;
}

const cashierNav: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Orders', href: '/cashier/orders', icon: ShoppingCartIcon },
  { name: 'Payment Verification', href: '/cashier/payment', icon: CreditCardIcon },
  { name: 'Waste Logging', href: '/cashier/waste', icon: TrashIcon },
  { name: 'Refund Requests', href: '/cashier/refunds', icon: ReceiptRefundIcon },
];

const adminNav: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon, adminOnly: true },
  { name: 'Menu Management', href: '/admin/menu', icon: Square3Stack3DIcon, adminOnly: true },
  { name: 'Categories', href: '/admin/categories', icon: TagIcon, adminOnly: true },
  { name: 'Inventory', href: '/admin/inventory', icon: CubeIcon, adminOnly: true },
  { name: 'Cashiers', href: '/admin/cashiers', icon: UserGroupIcon, adminOnly: true },
  { name: 'Custom Cakes', href: '/admin/custom-cakes', icon: CakeIcon, adminOnly: true },
  { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = isAdmin() ? adminNav : cashierNav;

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleMobile}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-gradient-to-r from-golden-orange to-deep-amber text-white shadow-xl hover:shadow-2xl transition-all hover:scale-110"
      >
        {isMobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen
          bg-white/80 backdrop-blur-xl
          border-r border-golden-orange/20
          shadow-2xl
          transition-all duration-300 z-40
          ${isCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'w-72'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-golden-orange/20 bg-gradient-to-r from-golden-orange/10 to-deep-amber/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="text-4xl animate-float">🥐</div>
              {!isCollapsed && (
                <div>
                  <h2 className="font-black text-xl bg-gradient-to-r from-golden-orange via-deep-amber to-orange-600 bg-clip-text text-transparent">
                    GoldenMunch
                  </h2>
                  <p className="text-xs font-semibold text-default-600">
                    {isAdmin() ? 'Admin Portal' : 'Cashier Portal'}
                  </p>
                </div>
              )}
            </div>

            {/* Desktop Collapse Button */}
            {!isCollapsed && (
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onClick={() => setIsCollapsed(true)}
                className="hidden lg:flex hover:bg-golden-orange/20"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-golden-orange/20 bg-gradient-to-br from-amber-50/50 to-orange-50/50">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <Avatar
              name={user?.name}
              size={isCollapsed ? "md" : "lg"}
              className="bg-gradient-to-br from-golden-orange to-deep-amber text-white font-bold border-3 border-white shadow-lg"
            />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-default-800">{user?.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Chip
                    size="sm"
                    className="bg-gradient-to-r from-golden-orange to-deep-amber text-white font-semibold"
                  >
                    {user?.type}
                  </Chip>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            const navButton = (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl
                  transition-all duration-200 group
                  ${active
                    ? 'bg-gradient-to-r from-golden-orange to-deep-amber text-white shadow-lg scale-105'
                    : 'hover:bg-gradient-to-r hover:from-golden-orange/10 hover:to-deep-amber/10 text-default-700 hover:scale-105'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
              >
                <Icon className={`h-6 w-6 flex-shrink-0 ${active ? '' : 'group-hover:scale-110 transition-transform'}`} />
                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm font-semibold">{item.name}</span>
                    {item.badge && (
                      <Chip size="sm" color="danger" variant="flat">
                        {item.badge}
                      </Chip>
                    )}
                  </div>
                )}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.name} content={item.name} placement="right" color="warning">
                  {navButton}
                </Tooltip>
              );
            }

            return navButton;
          })}
        </nav>

        {/* Quick Stats (if not collapsed) */}
        {!isCollapsed && (
          <div className="p-4 border-t border-golden-orange/20 bg-gradient-to-br from-amber-50/50 to-orange-50/50">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2 text-center border border-golden-orange/20">
                <p className="text-xs text-default-600">Today's Orders</p>
                <p className="text-lg font-bold text-golden-orange">24</p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2 text-center border border-golden-orange/20">
                <p className="text-xs text-default-600">Revenue</p>
                <p className="text-lg font-bold text-deep-amber">₱12.5K</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-golden-orange/20 space-y-2">
          <Button
            onClick={logout}
            variant="flat"
            color="danger"
            className={`w-full font-semibold ${isCollapsed ? 'px-2' : ''}`}
            startContent={!isCollapsed && <ArrowRightOnRectangleIcon className="h-5 w-5" />}
          >
            {isCollapsed ? (
              <ArrowRightOnRectangleIcon className="h-6 w-6" />
            ) : (
              'Logout'
            )}
          </Button>

          {isCollapsed && (
            <Button
              onClick={() => setIsCollapsed(false)}
              variant="light"
              size="sm"
              isIconOnly
              className="w-full hidden lg:flex"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </Button>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity"
          onClick={toggleMobile}
        />
      )}

      {/* Expand Button (when collapsed) */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="hidden lg:flex fixed left-20 top-1/2 -translate-y-1/2 z-30 p-2 rounded-r-lg bg-gradient-to-r from-golden-orange to-deep-amber text-white shadow-lg hover:shadow-xl transition-all hover:left-[82px]"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      )}
    </>
  );
}
