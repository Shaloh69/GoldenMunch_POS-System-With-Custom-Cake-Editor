"use client";

import React from "react";
import { Button } from "@heroui/button";
import { useRouter, usePathname } from "next/navigation";

export const BackToMenuButton: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Don't show on these pages
  if (pathname === "/" || pathname === "/idle") {
    return null;
  }

  const handleBackToMenu = () => {
    router.push("/");
  };

  return (
    <div className="fixed top-6 left-6 z-50">
      <Button
        size="lg"
        onClick={handleBackToMenu}
        className="
          bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow
          text-black font-bold text-2xl
          px-8 py-8
          min-w-[200px] min-h-[80px]
          shadow-2xl hover:shadow-[0_0_30px_rgba(251,205,47,0.8)]
          hover:scale-105
          transition-all duration-300
          border-4 border-deep-orange-yellow/50
          touch-manipulation
        "
        startContent={<span className="text-3xl">←</span>}
      >
        Back to Menu
      </Button>
    </div>
  );
};

export default BackToMenuButton;
