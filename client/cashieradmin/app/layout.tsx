import "@/styles/globals.css";
import "@/styles/glassmorphism.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { Providers } from "./providers";

import AnimatedBackground from "@/components/AnimatedBackground";
import { fontSans } from "@/config/fonts";

export const metadata: Metadata = {
  title: {
    default: "GoldenMunch POS - Admin & Cashier Portal",
    template: `%s - GoldenMunch POS`,
  },
  description:
    "GoldenMunch Point of Sale System - Admin and Cashier Management Portal",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          <AnimatedBackground />
          {children}
        </Providers>
      </body>
    </html>
  );
}
