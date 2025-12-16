import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { Providers } from "./providers";
import { LayoutContent } from "@/components/LayoutContent";

import { fontSans } from "@/config/fonts";

// Force all routes to be dynamic (skip static generation)
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export const metadata: Metadata = {
  title: {
    default: "GoldenMunch Kiosk",
    template: `%s - GoldenMunch Kiosk`,
  },
  description: "GoldenMunch Point of Sale Kiosk - Self-Service Ordering",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html suppressHydrationWarning lang="en" className="bg-transparent light">
      <head />
      <body
        className={clsx(
          "min-h-screen bg-transparent text-foreground font-sans antialiased",
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
