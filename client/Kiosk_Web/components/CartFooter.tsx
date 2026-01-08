"use client";

import React, { useState } from "react";
import { Button, Chip } from "@/components/primitives";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { usePathname } from "next/navigation";

export const CartFooter: React.FC = () => {
  const pathname = usePathname();
  const { getItemCount, total } = useCart();
  const [isHidden, setIsHidden] = useState(false);

  // Hide footer on specific pages
  if (
    pathname === "/cart" ||
    pathname === "/idle" ||
    pathname === "/custom-cake"
  ) {
    return null;
  }

  const itemCount = getItemCount();

  return (
    <>
      {/* Toggle Button - Always Visible */}
      <div className="fixed bottom-6 right-8 z-50">
        <Button
          isIconOnly
          size="lg"
          className="bg-gradient-to-r from-[#D9B38C] to-[#C67B57] text-white shadow-2xl hover:scale-110 transition-all w-16 h-16 rounded-full"
          onClick={() => setIsHidden(!isHidden)}
        >
          <span className="text-3xl">{isHidden ? "⬆️" : "⬇️"}</span>
        </Button>
      </div>

      {/* Footer Bar */}
      <div
        className={`fixed left-0 right-0 z-40 transition-all duration-500 ease-in-out ${
          isHidden ? "bottom-[-200px]" : "bottom-0"
        }`}
      >
        <div className="glass-footer border-t-4 border-[#D9B38C]/40 shadow-[0_-10px_40px_rgba(198,123,87,0.35)]">
          <div className="max-w-[1800px] mx-auto px-12 py-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Cart Button */}
              <Button
                as={Link}
                href="/cart"
                size="lg"
                className={`${
                  itemCount > 0
                    ? "bg-gradient-to-r from-[#D9B38C] to-[#C67B57] shadow-[0_0_30px_rgba(198,123,87,0.5)] scale-105"
                    : "bg-[#C9B8A5]/50 opacity-70"
                } text-white font-bold py-10 hover:scale-110 transition-all rounded-2xl`}
                isDisabled={itemCount === 0}
              >
                <div className="flex items-center justify-between w-full px-6">
                  <div className="flex items-center gap-5">
                    <span className="text-6xl">🛒</span>
                    <div className="flex flex-col items-start">
                      <span className="text-4xl drop-shadow-lg font-bold">
                        Cart
                      </span>
                      {itemCount > 0 && (
                        <span className="text-xl text-[#FFF9F2]/90">
                          {itemCount} {itemCount === 1 ? "item" : "items"}
                        </span>
                      )}
                    </div>
                  </div>
                  {itemCount > 0 && (
                    <div className="flex flex-col items-end gap-2">
                      <Chip
                        size="lg"
                        className="text-2xl font-bold bg-[#FFF9F2] text-[#C67B57] px-5 py-1"
                      >
                        {itemCount}
                      </Chip>
                      <span className="text-3xl font-black text-white drop-shadow-lg">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </Button>

              {/* Custom Cake Button with QR Code Icon */}
              <Button
                as={Link}
                href="/custom-cake"
                size="lg"
                className="bg-gradient-to-r from-[#C67B57] via-[#D9B38C] to-[#C9B8A5] text-white font-bold py-10 shadow-[0_0_30px_rgba(198,123,87,0.6)] hover:scale-110 transition-all rounded-2xl"
              >
                <div className="flex items-center justify-between w-full px-6">
                  <div className="flex items-center gap-5">
                    <span className="text-6xl">🎂</span>
                    <div className="flex flex-col items-start">
                      <span className="text-4xl drop-shadow-lg font-bold">
                        Custom Cake
                      </span>
                      <span className="text-xl text-[#FFF9F2]/90">
                        Design your dream cake
                      </span>
                    </div>
                  </div>

                  {/* QR Code Indicator */}
                  <div className="flex flex-col items-center bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl border-2 border-white/40">
                    <span className="text-5xl mb-1">📱</span>
                    <span className="text-sm font-semibold text-white">
                      Scan QR
                    </span>
                  </div>
                </div>
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center mt-4">
              <p className="text-[#C67B57] text-lg font-medium">
                Tap the buttons above to view your cart or design a custom cake
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CartFooter;
