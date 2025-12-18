"use client";

import React, { useState } from "react";
import { Button } from "@/components/primitives";
import { useRouter, usePathname } from "next/navigation";

export const BackToMenuButton: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  // Don't show on these pages
  if (pathname === "/" || pathname === "/idle") {
    return null;
  }

  const handleBackToMenu = () => {
    setIsNavigating(true);

    // Wait for animation to complete before navigating
    setTimeout(() => {
      router.push("/");
    }, 1500);
  };

  return (
    <>
      {/* Back Button */}
      <div className="fixed top-6 left-6 z-50">
        <Button
          size="lg"
          onClick={handleBackToMenu}
          isDisabled={isNavigating}
          className="
            bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow
            text-black font-bold text-5xl
            px-0 py-0
            w-[80px] h-[80px]
            shadow-2xl hover:shadow-[0_0_30px_rgba(251,205,47,0.8)]
            hover:scale-110
            transition-all duration-300
            border-4 border-secondary/50
            touch-manipulation
            rounded-2xl
            flex items-center justify-center
          "
        >
          <span className="text-5xl">←</span>
        </Button>
      </div>

      {/* Navigation Animation Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow p-12 rounded-3xl shadow-2xl border-4 border-secondary animate-scale-in">
            <div className="flex flex-col items-center gap-6">
              <div className="text-8xl animate-bounce-slow">🏠</div>
              <h2 className="text-5xl font-black text-black text-center drop-shadow-lg">
                Going Back to the Menu
              </h2>
              <div className="flex gap-3">
                <div className="w-4 h-4 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-4 h-4 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-4 h-4 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BackToMenuButton;
