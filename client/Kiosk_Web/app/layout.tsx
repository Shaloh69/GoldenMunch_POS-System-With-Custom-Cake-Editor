"use client";

import "@/styles/globals.css";
import clsx from "clsx";
import { usePathname } from "next/navigation";

import { Providers } from "./providers";

import { fontSans } from "@/config/fonts";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { BackToMenuButton } from "@/components/BackToMenuButton";

// Force all routes to be dynamic (skip static generation)
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
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

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isIdlePage = pathname === "/idle";

  if (isIdlePage) {
    // Return full-screen layout without sidebar for idle page
    return (
      <>
        <AnimatedBackground />
        <div className="relative z-10">{children}</div>
      </>
    );
  }

  // Full screen layout - Sidebar is handled within pages
  return (
    <>
      <AnimatedBackground />
      <BackToMenuButton />
      <div className="relative min-h-screen z-10">
        {/* Main Content Area */}
        <main className="w-full overflow-y-auto relative z-10">{children}</main>
      </div>
    </>
  );
}
