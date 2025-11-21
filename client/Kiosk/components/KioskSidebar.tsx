'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@heroui/button';
import { Card, CardBody } from '@heroui/card';
import { Badge } from '@heroui/badge';
import { Divider } from '@heroui/divider';
import { ScrollShadow } from '@heroui/scroll-shadow';
import { Chip } from '@heroui/chip';
import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';
import CustomCakeQRModal from './CustomCakeQRModal';

interface KioskSidebarProps {
  onCustomCakeComplete?: (data: any) => void;
}

export const KioskSidebar: React.FC<KioskSidebarProps> = ({ onCustomCakeComplete }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { items, removeItem, updateQuantity, getTotal, getItemCount, clearCart } = useCart();
  const [isCustomCakeModalOpen, setIsCustomCakeModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const getKioskSessionId = (): string => {
    let sessionId = sessionStorage.getItem('kiosk_session_id');
    if (!sessionId) {
      sessionId = `kiosk_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      sessionStorage.setItem('kiosk_session_id', sessionId);
    }
    return sessionId;
  };

  const handleCustomCakeComplete = (customizationData: any) => {
    console.log('Custom cake customization completed:', customizationData);
    if (onCustomCakeComplete) {
      onCustomCakeComplete(customizationData);
    }
    // TODO: Add custom cake to cart with customization data
    alert('Custom cake design completed! (Cart integration coming soon)');
  };

  const handleCheckout = () => {
    router.push('/cart');
  };

  const isCartPage = pathname === '/cart';

  return (
    <>
      {/* Sidebar Toggle Button - Mobile */}
      <Button
        isIconOnly
        className={`
          fixed top-6 right-6 z-50 lg:hidden
          bg-gradient-to-r from-golden-orange to-deep-amber text-white
          shadow-2xl-golden hover:scale-110 transition-all duration-300
          ${isSidebarCollapsed ? 'animate-bounce' : ''}
        `}
        size="lg"
        onPress={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      >
        {isSidebarCollapsed ? (
          <Badge content={getItemCount()} color="danger" size="sm" placement="top-left">
            <span className="text-2xl">🍰</span>
          </Badge>
        ) : (
          <span className="text-2xl">✕</span>
        )}
      </Button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 right-0 h-screen bg-white/95 backdrop-blur-xl
          shadow-2xl border-l-4 border-golden-orange/30
          transition-all duration-500 ease-in-out z-40
          ${isSidebarCollapsed ? 'translate-x-full lg:translate-x-0' : 'translate-x-0'}
          w-full sm:w-96 lg:w-[420px]
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-golden-orange to-deep-amber p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-3xl font-bold text-white flex items-center gap-2">
              <span className="text-4xl animate-float">🛒</span>
              Your Order
            </h2>
            <Badge content={getItemCount()} color="danger" size="lg" className="animate-pulse-slow">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">🍰</span>
              </div>
            </Badge>
          </div>
          <div className="flex items-center justify-between text-white/90">
            <span className="text-lg">Total:</span>
            <span className="text-3xl font-bold animate-glow">${getTotal().toFixed(2)}</span>
          </div>
        </div>

        {/* Custom Cake Button - Prominent */}
        <div className="p-4 bg-gradient-to-br from-golden-orange/10 to-deep-amber/10 border-b-2 border-golden-orange/20">
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-golden-orange to-deep-amber text-white font-bold text-lg shadow-xl-golden hover:scale-105 transition-all duration-300 h-16 animate-pulse-slow"
            onClick={() => setIsCustomCakeModalOpen(true)}
          >
            <span className="text-2xl mr-2">🎨</span>
            Design Custom Cake
          </Button>
        </div>

        {/* Cart Items */}
        <ScrollShadow className="flex-1 overflow-y-auto px-4 py-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in">
              <div className="text-9xl mb-6 animate-bounce-slow opacity-30">🛒</div>
              <h3 className="text-2xl font-bold text-chocolate-brown mb-2">
                Your cart is empty
              </h3>
              <p className="text-chocolate-brown/60 mb-6">
                Start adding delicious treats!
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-golden-orange to-deep-amber text-white font-bold"
                onClick={() => router.push('/menu')}
              >
                Browse Menu
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <Card
                  key={`${item.menuItem.menu_item_id}-${index}`}
                  className="card-modern hover:shadow-xl-golden transition-all duration-300 hover:scale-[1.02] animate-slide-right"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardBody className="p-4">
                    <div className="flex gap-4">
                      {/* Item Image */}
                      <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-golden-orange/10">
                        {item.menuItem.image_url ? (
                          <Image
                            src={item.menuItem.image_url}
                            alt={item.menuItem.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            🍰
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-chocolate-brown truncate text-lg">
                          {item.menuItem.name}
                        </h4>
                        <p className="text-deep-amber font-semibold text-lg">
                          ${(Number(item.menuItem.current_price) || 0).toFixed(2)}
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            className="rounded-full bg-red-100 hover:bg-red-200 text-red-600 min-w-8 h-8"
                            onClick={() => {
                              if (item.quantity === 1) {
                                removeItem(item.menuItem.menu_item_id);
                              } else {
                                updateQuantity(item.menuItem.menu_item_id, item.quantity - 1);
                              }
                            }}
                          >
                            {item.quantity === 1 ? '🗑️' : '−'}
                          </Button>
                          <span className="font-bold text-chocolate-brown min-w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            isIconOnly
                            size="sm"
                            className="rounded-full bg-golden-orange hover:bg-deep-amber text-white min-w-8 h-8"
                            onClick={() => updateQuantity(item.menuItem.menu_item_id, item.quantity + 1)}
                          >
                            +
                          </Button>
                          <Chip size="sm" color="warning" variant="flat" className="ml-auto">
                            ${((Number(item.menuItem.current_price) || 0) * item.quantity).toFixed(2)}
                          </Chip>
                        </div>

                        {/* Special Instructions */}
                        {item.special_instructions && (
                          <p className="text-xs text-chocolate-brown/60 mt-2 italic">
                            📝 {item.special_instructions}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </ScrollShadow>

        {/* Footer Actions */}
        {items.length > 0 && (
          <div className="p-4 bg-white border-t-2 border-golden-orange/20 space-y-3">
            {/* Summary */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-chocolate-brown">
                <span>Items ({getItemCount()})</span>
                <span className="font-semibold">${getTotal().toFixed(2)}</span>
              </div>
              <Divider />
              <div className="flex justify-between text-xl font-bold text-chocolate-brown">
                <span>Total</span>
                <span className="text-deep-amber">${getTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            {!isCartPage && (
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-golden-orange to-deep-amber text-white font-bold text-xl shadow-xl-golden hover:scale-105 transition-all h-16"
                onClick={handleCheckout}
              >
                <span className="text-2xl mr-2">💳</span>
                Proceed to Checkout
              </Button>
            )}

            <Button
              size="lg"
              variant="bordered"
              className="w-full border-2 border-red-300 text-red-600 hover:bg-red-50 font-semibold"
              onClick={clearCart}
            >
              <span className="mr-2">🗑️</span>
              Clear Cart
            </Button>
          </div>
        )}
      </aside>

      {/* Custom Cake QR Modal */}
      <CustomCakeQRModal
        isOpen={isCustomCakeModalOpen}
        onClose={() => setIsCustomCakeModalOpen(false)}
        onComplete={handleCustomCakeComplete}
        kioskSessionId={getKioskSessionId()}
      />

      {/* Overlay for mobile */}
      {!isSidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden animate-fade-in"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}
    </>
  );
};

export default KioskSidebar;
