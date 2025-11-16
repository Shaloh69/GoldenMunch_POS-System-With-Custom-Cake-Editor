"use client";

import "@/styles/globals.css";
import { Link } from "@heroui/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { KioskNavbar } from "@/components/kiosk-navbar";

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
    // Return full-screen layout without navbar for idle page
    return <>{children}</>;
  }

  // Return normal layout with navbar for all other pages
  return (
    <div className="relative flex flex-col h-screen">
      <KioskNavbar />
      <main className="container mx-auto max-w-7xl pt-16 px-6 flex-grow">
        {children}
      </main>
      <footer className="w-full flex items-center justify-center py-3">
        <Link
          isExternal
          className="flex items-center gap-1 text-current"
          href="https://heroui.com?utm_source=next-app-template"
          title="heroui.com homepage"
        >
          <span className="text-default-600">Powered by</span>
          <p className="text-primary">HeroUI</p>
        </Link>
      </footer>
    </div>
  );
}