'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/button';
import { Badge } from '@heroui/badge';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCartIcon, ChevronUpIcon, ChevronDownIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function HidableFooter() {
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();
  const { getItemCount, getTotal } = useCart();

  const itemCount = getItemCount();
  const total = getTotal();

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const handleCartClick = () => {
    router.push('/cart');
  };

  const handleCustomCakeClick = () => {
    router.push('/custom-cake');
  };

  return (
    <>
      {/* Toggle Button - Always Visible */}
      <button
        onClick={toggleVisibility}
        className={`fixed bottom-0 left-1/2 -translate-x-1/2 z-50 px-6 py-2 rounded-t-2xl bg-gradient-to-r from-light-caramel via-muted-clay to-light-caramel text-white shadow-glow transition-all duration-300 hover:scale-105 ${
          isVisible ? 'translate-y-0' : '-translate-y-2'
        }`}
      >
        {isVisible ? (
          <ChevronDownIcon className="h-6 w-6" />
        ) : (
          <ChevronUpIcon className="h-6 w-6" />
        )}
      </button>

      {/* Footer Panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-500 ease-in-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-gradient-to-r from-cream-white via-soft-sand to-cream-white backdrop-blur-xl border-t-4 border-light-caramel/40 shadow-caramel">
          <div className="max-w-screen-2xl mx-auto px-8 py-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Cart Section */}
              <Button
                size="lg"
                onClick={handleCartClick}
                className="h-24 bg-gradient-to-r from-light-caramel to-warm-beige text-white shadow-caramel hover:shadow-glow transition-all duration-300 hover:scale-105 group"
              >
                <div className="flex items-center gap-4 w-full">
                  <Badge
                    content={itemCount}
                    color="danger"
                    size="lg"
                    isInvisible={itemCount === 0}
                    className="scale-125"
                  >
                    <ShoppingCartIcon className="h-12 w-12 group-hover:animate-bounce" />
                  </Badge>
                  <div className="flex-1 text-left">
                    <p className="text-2xl font-bold">View Cart</p>
                    <p className="text-lg opacity-90">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'} • ₱{total.toFixed(2)}
                    </p>
                  </div>
                </div>
              </Button>

              {/* Custom Cake QR Section */}
              <Button
                size="lg"
                onClick={handleCustomCakeClick}
                className="h-24 bg-gradient-to-r from-muted-clay to-light-caramel text-white shadow-caramel hover:shadow-glow transition-all duration-300 hover:scale-105 group"
              >
                <div className="flex items-center gap-4 w-full">
                  <SparklesIcon className="h-12 w-12 group-hover:animate-pulse" />
                  <div className="flex-1 text-left">
                    <p className="text-2xl font-bold">Custom Cake</p>
                    <p className="text-lg opacity-90">Scan QR to Design</p>
                  </div>
                  <div className="text-5xl group-hover:animate-bounce">🎂</div>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer to prevent content from being hidden behind footer */}
      {isVisible && <div className="h-36"></div>}
    </>
  );
}
