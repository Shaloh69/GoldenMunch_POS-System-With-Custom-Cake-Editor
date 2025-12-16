"use client";

import { usePathname } from "next/navigation";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { BackToMenuButton } from "@/components/BackToMenuButton";

export function LayoutContent({ children }: { children: React.ReactNode }) {
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
