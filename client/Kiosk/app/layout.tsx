"use client";

import "@/styles/globals.css";
import clsx from "clsx";
import { usePathname } from "next/navigation";

import { Providers } from "./providers";

import { fontSans } from "@/config/fonts";
import { KioskSidebar } from "@/components/KioskSidebar";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <LayoutContent>{children}</LayoutContent>
        </Providers>
      </body>
    </html>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isIdlePage = pathname === '/idle';

  if (isIdlePage) {
    // Return full-screen layout without sidebar for idle page
    return <>{children}</>;
  }

  // Return layout with sidebar for all other pages
  return (
    <div className="relative flex h-screen overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto lg:mr-[420px]">
        {children}
      </main>

      {/* Sidebar */}
      <KioskSidebar />
    </div>
  );
}