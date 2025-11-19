"use client";

import "@/styles/globals.css";
import clsx from "clsx";
import { usePathname } from "next/navigation";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminHeader } from "@/components/admin-header";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html suppressHydrationWarning lang="en">
      <head>
        <title>{siteConfig.name}</title>
        <meta name="description" content={siteConfig.description} />
      </head>
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
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

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  // If it's login page, render without sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Normal layout with sidebar and header
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-72 transition-all duration-300">
        {/* Header */}
        <AdminHeader />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-mesh-gradient p-6">
          <div className="container mx-auto max-w-7xl">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-cream-white dark:bg-background border-t-2 border-golden-orange/20 py-4 px-6">
          <div className="flex items-center justify-between text-sm text-default-600">
            <p>© 2024 Golden Munch. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-golden-orange transition-colors">Support</a>
              <a href="#" className="hover:text-golden-orange transition-colors">Documentation</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
