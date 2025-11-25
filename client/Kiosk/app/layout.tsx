"use client";

import "@/styles/globals.css";
import clsx from "clsx";
import { usePathname } from "next/navigation";

import { Providers } from "./providers";

import { fontSans } from "@/config/fonts";
import { KioskSidebar } from "@/components/KioskSidebar";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { CartFooter } from "@/components/CartFooter";

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
    return (
      <>
        <AnimatedBackground />
        {children}
      </>
    );
  }

  // Portrait mode - full screen without sidebar for better space utilization
  return (
    <>
      <AnimatedBackground />
      <div className="relative min-h-screen">
        {/* Main Content Area - Full width for portrait */}
        <main className="w-full overflow-y-auto pb-32">
          {children}
        </main>

        {/* Floating Cart Footer */}
        <CartFooter />
      </div>
    </>
  );
}