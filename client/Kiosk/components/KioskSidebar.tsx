'use client';

import React, { useState } from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody } from '@heroui/card';
import { Chip } from '@heroui/chip';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { usePathname } from 'next/navigation';
import type { MenuItem } from '@/types/api';
import { getImageUrl } from '@/utils/imageUtils';

interface KioskSidebarProps {
  selectedItem: MenuItem | null;
  onClose: () => void;
}

export const KioskSidebar: React.FC<KioskSidebarProps> = ({ selectedItem, onClose }) => {
  const pathname = usePathname();
  const { addItem, items: cartItems, getItemCount, getTotal } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isCartHidden, setIsCartHidden] = useState(false);

  // Don't show sidebar on cart, idle, or custom-cake pages
  if (pathname === '/cart' || pathname === '/idle' || pathname === '/custom-cake') {
    return null;
  }

  const handleAddToCart = () => {
    if (selectedItem) {
      addItem({
        menuItem: selectedItem,
        quantity: quantity,
      });
      // Reset and close
      setQuantity(1);
      onClose();
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= 99) {
      setQuantity(newQty);
    }
  };

  const itemCount = getItemCount();
  const total = getTotal();
  const isAvailable = selectedItem?.status === 'available' &&
    (selectedItem?.is_infinite_stock || (selectedItem?.stock_quantity ?? 0) > 0);

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[30vw] max-w-[576px] bg-white border-l-4 border-[#D9B38C] shadow-[-10px_0_40px_rgba(198,123,87,0.3)] z-30 flex flex-col">
      {/* Item Detail Section (Top 60%) */}
      <div className={`flex-1 overflow-y-auto transition-all duration-500 ${selectedItem ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {selectedItem && (
          <div className="p-6 h-full">
            <Card className="bg-white border-2 border-[#D9B38C] shadow-xl h-full">
              <CardBody className="p-0 flex flex-col h-full">
                {/* Large Image */}
                <div className="relative h-80 bg-gradient-to-br from-[#E8DCC8]/30 to-[#D9B38C]/30 flex items-center justify-center overflow-hidden">
                  {getImageUrl(selectedItem.image_url) ? (
                    <Image
                      src={getImageUrl(selectedItem.image_url) || ''}
                      alt={selectedItem.name}
                      fill
                      className="object-cover"
                      sizes="30vw"
                    />
                  ) : (
                    <div className="text-9xl">🍰</div>
                  )}

                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#8B5A3C] hover:bg-[#C67B57] hover:text-white transition-all shadow-lg hover:scale-110"
                  >
                    <span className="text-2xl font-bold">×</span>
                  </button>

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {selectedItem.is_featured && (
                      <Chip size="lg" className="font-bold text-base px-4 py-2 bg-[#C67B57] text-white shadow-lg">
                        Popular
                      </Chip>
                    )}
                    {!isAvailable && (
                      <Chip size="lg" className="font-bold text-base px-4 py-2 bg-red-500 text-white shadow-lg">
                        Sold Out
                      </Chip>
                    )}
                  </div>
                </div>

                {/* Item Details - White Background with Dark Text */}
                <div className="p-6 flex-1 flex flex-col justify-between bg-white">
                  <div>
                    {/* Name */}
                    <h2 className="text-3xl font-black text-[#8B5A3C] mb-3">
                      {selectedItem.name}
                    </h2>

                    {/* Description - Darker text for readability */}
                    <p className="text-lg text-[#6B4423] mb-4 leading-relaxed">
                      {selectedItem.description || 'Delicious treat made fresh daily with the finest ingredients.'}
                    </p>

                    {/* Category & Type */}
                    <div className="flex gap-3 mb-4">
                      <Chip size="lg" className="bg-[#E8DCC8] text-[#8B5A3C] font-semibold text-base px-4">
                        {selectedItem.item_type}
                      </Chip>
                      {selectedItem.categories && selectedItem.categories.length > 0 && (
                        <Chip size="lg" className="bg-[#D9B38C]/30 text-[#8B5A3C] font-semibold text-base px-4">
                          {selectedItem.categories[0].name}
                        </Chip>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <span className="text-5xl font-black text-[#8B5A3C]">
                        ${(Number(selectedItem.current_price) || 0).toFixed(2)}
                      </span>
                    </div>

                    {/* Stock Info */}
                    {!selectedItem.is_infinite_stock && (
                      <p className="text-base text-[#6B4423] mb-4">
                        {isAvailable ? (
                          <span>📦 {selectedItem.stock_quantity} available</span>
                        ) : (
                          <span className="text-red-600">❌ Out of stock</span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Quantity Selector & Add Button */}
                  {isAvailable && (
                    <div className="space-y-4">
                      {/* Quantity Selector */}
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-semibold text-[#8B5A3C]">Quantity:</span>
                        <div className="flex items-center gap-3">
                          <Button
                            size="lg"
                            isIconOnly
                            className="bg-[#E8DCC8] text-[#8B5A3C] font-bold text-2xl hover:bg-[#D9B38C] hover:text-white transition-all w-14 h-14"
                            onClick={() => handleQuantityChange(-1)}
                          >
                            −
                          </Button>
                          <span className="text-3xl font-bold text-[#8B5A3C] min-w-[60px] text-center">
                            {quantity}
                          </span>
                          <Button
                            size="lg"
                            isIconOnly
                            className="bg-[#E8DCC8] text-[#8B5A3C] font-bold text-2xl hover:bg-[#D9B38C] hover:text-white transition-all w-14 h-14"
                            onClick={() => handleQuantityChange(1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                      <Button
                        size="lg"
                        className="w-full bg-gradient-to-r from-[#D9B38C] to-[#C67B57] text-white font-bold text-2xl py-8 shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
                        onClick={handleAddToCart}
                      >
                        🛒 Add to Cart
                      </Button>
                    </div>
                  )}

                  {!isAvailable && (
                    <Button
                      disabled
                      size="lg"
                      className="w-full bg-gray-300 text-gray-500 font-semibold text-2xl py-8"
                    >
                      Unavailable
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>

      {/* Cart Section (Bottom 40%) - Always Present */}
      <div className={`border-t-4 border-[#D9B38C] bg-[#FFF9F2] transition-all duration-500 ${isCartHidden ? 'h-16' : 'h-[40vh]'}`}>
        {/* Toggle Button */}
        <button
          onClick={() => setIsCartHidden(!isCartHidden)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#E8DCC8]/50 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛒</span>
            <span className="text-xl font-bold text-[#8B5A3C]">
              Your Cart {itemCount > 0 && `(${itemCount})`}
            </span>
          </div>
          <span className="text-2xl text-[#8B5A3C]">
            {isCartHidden ? '▲' : '▼'}
          </span>
        </button>

        {/* Cart Content */}
        {!isCartHidden && (
          <div className="px-6 pb-6 h-[calc(40vh-4rem)] flex flex-col bg-white">
            {itemCount === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-4">🛒</div>
                <p className="text-xl text-[#8B5A3C] font-semibold">
                  Your cart is empty
                </p>
                <p className="text-base text-[#6B4423] mt-2">
                  Select items to get started
                </p>
              </div>
            ) : (
              <>
                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                  {cartItems.map((cartItem) => (
                    <Card key={cartItem.menuItem.menu_item_id} className="bg-[#FFF9F2] border border-[#D9B38C]/30">
                      <CardBody className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 bg-gradient-to-br from-[#E8DCC8] to-[#D9B38C]/30 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            {getImageUrl(cartItem.menuItem.image_url) ? (
                              <Image
                                src={getImageUrl(cartItem.menuItem.image_url) || ''}
                                alt={cartItem.menuItem.name}
                                width={64}
                                height={64}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <span className="text-3xl">🍰</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-bold text-[#8B5A3C] truncate">
                              {cartItem.menuItem.name}
                            </h4>
                            <p className="text-sm text-[#6B4423]">
                              {cartItem.quantity} × ${(Number(cartItem.menuItem.current_price) || 0).toFixed(2)}
                            </p>
                          </div>
                          <div className="text-lg font-bold text-[#8B5A3C]">
                            ${((Number(cartItem.menuItem.current_price) || 0) * cartItem.quantity).toFixed(2)}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t-2 border-[#D9B38C] pt-4 mb-4 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-[#8B5A3C]">Total:</span>
                    <span className="text-3xl font-black text-[#8B5A3C]">
                      ${total.toFixed(2)}
                    </span>
                  </div>

                  {/* Buttons */}
                  <div className="space-y-3">
                    <Button
                      as={Link}
                      href="/cart"
                      size="lg"
                      className="w-full bg-gradient-to-r from-[#D9B38C] to-[#C67B57] text-white font-bold text-xl py-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                    >
                      View Cart & Checkout →
                    </Button>

                    <Button
                      as={Link}
                      href="/custom-cake"
                      size="lg"
                      className="w-full bg-gradient-to-r from-[#C67B57] via-[#D9B38C] to-[#C9B8A5] text-white font-bold text-xl py-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>🎂 Custom Cake</span>
                        <span className="text-sm bg-white/20 px-3 py-1 rounded-lg">📱 Scan QR</span>
                      </div>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KioskSidebar;
