'use client';

import React from 'react';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { usePathname } from 'next/navigation';

export const CartFooter: React.FC = () => {
  const pathname = usePathname();
  const { getItemCount, getTotal } = useCart();

  // Hide footer on cart, custom-cake, and idle pages
  if (pathname === '/cart' || pathname === '/idle' || pathname === '/custom-cake') {
    return null;
  }

  const itemCount = getItemCount();
  const total = getTotal();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass-header border-t-4 border-[#EAD7B7]/30 shadow-[0_-10px_40px_rgba(234,215,183,0.3)]">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Cart Button */}
          <Button
            as={Link}
            href="/cart"
            size="lg"
            className={`flex-1 ${
              itemCount > 0
                ? 'bg-gradient-to-r from-[#7B4B28] to-[#662B35] shadow-[0_0_30px_rgba(234,215,183,0.4)]'
                : 'bg-[#3A1F0F]/50'
            } text-[#FAF7F2] font-bold text-2xl py-8 hover:scale-105 transition-all rounded-2xl min-h-[100px]`}
            isDisabled={itemCount === 0}
          >
            <div className="flex items-center justify-between w-full px-4">
              <div className="flex items-center gap-3">
                <span className="text-5xl">🛒</span>
                <div className="flex flex-col items-start">
                  <span className="text-3xl drop-shadow-lg">Cart</span>
                  {itemCount > 0 && (
                    <span className="text-lg text-[#EAD7B7]">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </span>
                  )}
                </div>
              </div>
              {itemCount > 0 && (
                <div className="flex flex-col items-end">
                  <Chip
                    size="lg"
                    className="text-xl font-bold mb-1 bg-[#EAD7B7] text-[#3A1F0F]"
                  >
                    {itemCount}
                  </Chip>
                  <span className="text-2xl font-black text-[#FAF7F2] drop-shadow-lg">₱{total.toFixed(0)}</span>
                </div>
              )}
            </div>
          </Button>

          {/* Custom Cake Button */}
          <Button
            as={Link}
            href="/custom-cake"
            size="lg"
            className="bg-gradient-to-r from-[#EAD7B7] via-[#7B4B28] to-[#662B35] text-[#FAF7F2] font-bold text-2xl py-8 px-12 shadow-[0_0_30px_rgba(234,215,183,0.5)] hover:scale-105 transition-all rounded-2xl min-h-[100px]"
          >
            <div className="flex items-center gap-3">
              <span className="text-5xl">🎂</span>
              <span className="text-3xl drop-shadow-lg">Custom Cake</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartFooter;
