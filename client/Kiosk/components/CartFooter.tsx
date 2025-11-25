'use client';

import React from 'react';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Badge } from '@heroui/badge';
import { useCart } from '@/contexts/CartContext';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export const CartFooter: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { items, getItemCount, getTotal } = useCart();

  // Hide footer on cart page and idle page
  if (pathname === '/cart' || pathname === '/idle') {
    return null;
  }

  // Don't show if cart is empty
  if (items.length === 0) {
    return null;
  }

  const itemCount = getItemCount();
  const total = getTotal();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50"
      >
        {/* Gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

        {/* Footer Content */}
        <div className="relative card-glass border-t-4 border-golden-orange/50 shadow-2xl">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="flex items-center justify-between gap-6">
              {/* Left: Cart Summary */}
              <div className="flex items-center gap-6">
                <div className="text-7xl animate-bounce-slow">🛒</div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-3xl font-bold text-chocolate-brown">Your Cart</h3>
                    <Badge content={itemCount} color="danger" size="lg" className="text-2xl px-4 py-1">
                      <div className="w-2 h-2" />
                    </Badge>
                  </div>
                  <p className="text-xl text-chocolate-brown/70">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'} • Ready to checkout
                  </p>
                </div>
              </div>

              {/* Center: Item Pills */}
              <div className="flex-1 flex gap-3 overflow-x-auto max-w-xl scrollbar-hide">
                {items.slice(0, 3).map((item, idx) => (
                  <Chip
                    key={idx}
                    size="lg"
                    variant="flat"
                    className="bg-white/60 backdrop-blur-sm text-lg px-4 py-6"
                  >
                    <span className="font-semibold">{item.quantity}x</span>
                    <span className="ml-2">{item.menuItem.name}</span>
                  </Chip>
                ))}
                {items.length > 3 && (
                  <Chip size="lg" variant="flat" className="bg-white/60 backdrop-blur-sm text-lg px-4 py-6">
                    +{items.length - 3} more
                  </Chip>
                )}
              </div>

              {/* Right: Total & Checkout Button */}
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xl text-chocolate-brown/70 mb-1">Total Amount</p>
                  <p className="text-5xl font-black bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
                    ₱{total.toFixed(2)}
                  </p>
                </div>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-golden-orange to-deep-amber text-white font-bold text-3xl px-12 py-8 shadow-xl-golden animate-glow hover:scale-105 transition-all rounded-2xl"
                  onClick={() => router.push('/cart')}
                >
                  <span className="text-4xl mr-3">💳</span>
                  Checkout Now
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tap indicator */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="bg-golden-orange/90 backdrop-blur-sm text-white px-6 py-3 rounded-full text-lg font-semibold shadow-lg">
            👆 Tap to checkout
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CartFooter;
