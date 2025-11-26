'use client';

import "@/styles/globals.css";
import "@/styles/glassmorphism.css";
import clsx from "clsx";
import { usePathname } from "next/navigation";

import { Providers } from "./providers";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Sidebar } from "@/components/sidebar";

import { fontSans } from "@/config/fonts";

interface LayoutContentProps {
  children: React.ReactNode;
}

function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname();

  // Pages where sidebar should NOT be shown
  const noSidebarPages = ['/login', '/register', '/'];
  const showSidebar = !noSidebarPages.includes(pathname || '');

  if (!showSidebar) {
    // Public pages (login, register, etc.)
    return (
      <>
        <AnimatedBackground />
        <main className="min-h-screen">
          {children}
        </main>
      </>
    );
  }

  // Admin/Cashier pages with sidebar
  return (
    <>
      <AnimatedBackground />
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden">
          {/* Top Bar for Mobile */}
          <div className="lg:hidden sticky top-0 z-30 w-full bg-gradient-to-r from-golden-orange/95 to-deep-amber/95 backdrop-blur-lg border-b border-white/20 shadow-lg">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🥐</span>
                  <div>
                    <h1 className="text-white font-bold text-lg">GoldenMunch POS</h1>
                    <p className="text-white/80 text-xs">Admin Portal</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head>
        <title>GoldenMunch POS - Admin & Cashier Portal</title>
        <meta name="description" content="GoldenMunch Point of Sale System - Admin and Cashier Management Portal" />
      </head>
      <body
        className={clsx(
          "min-h-screen text-foreground font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
          <LayoutContent>{children}</LayoutContent>
        </Providers>
      </body>
    </html>
  );
}
