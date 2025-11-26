'use client';

import React from 'react';
import { Card } from '@heroui/card';
import { Chip } from '@heroui/chip';
import Image from 'next/image';
import type { MenuItem } from '@/types/api';
import { getImageUrl } from '@/utils/imageUtils';

interface MenuCardProps {
  item: MenuItem;
  onClick: (item: MenuItem) => void;
  cartQuantity?: number;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item, onClick, cartQuantity = 0 }) => {
  const isAvailable = item.status === 'available' &&
    (item.is_infinite_stock || item.stock_quantity > 0);

  return (
    <Card
      isPressable
      onPress={() => onClick(item)}
      className={`
        relative overflow-hidden cursor-pointer
        border-2 border-[#D9B38C]/30
        transition-all duration-300
        ${isAvailable
          ? 'hover:border-[#C67B57] hover:shadow-[0_0_30px_rgba(198,123,87,0.4)] hover:scale-105'
          : 'opacity-60 cursor-not-allowed'
        }
      `}
    >
      {/* Full Image Background */}
      <div className="relative h-80 w-full overflow-hidden">
        {getImageUrl(item.image_url) ? (
          <Image
            src={getImageUrl(item.image_url) || ''}
            alt={item.name}
            fill
            className={`object-cover transition-transform duration-300 ${isAvailable ? 'group-hover:scale-110' : ''}`}
            sizes="25vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#E8DCC8]/50 to-[#D9B38C]/50 flex items-center justify-center">
            <span className="text-9xl">🍰</span>
          </div>
        )}

        {/* Gradient Overlay - Bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Badges - Top Right */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          {item.is_featured && (
            <Chip
              size="lg"
              className="font-bold text-base px-4 py-2 bg-[#C67B57] text-white shadow-xl backdrop-blur-sm"
            >
              ⭐ Popular
            </Chip>
          )}
          {!isAvailable && (
            <Chip
              size="lg"
              className="font-bold text-base px-4 py-2 bg-red-500 text-white shadow-xl backdrop-blur-sm"
            >
              Sold Out
            </Chip>
          )}
          {cartQuantity > 0 && (
            <Chip
              size="lg"
              className="font-bold text-base px-4 py-2 bg-green-500 text-white shadow-xl backdrop-blur-sm animate-pulse"
            >
              {cartQuantity} in cart
            </Chip>
          )}
        </div>

        {/* Item Info - Bottom Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
          {/* Item Name */}
          <h3 className="text-2xl font-black text-white mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] line-clamp-2">
            {item.name}
          </h3>

          {/* Price & Type */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-4xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                ${(Number(item.current_price) || 0).toFixed(2)}
              </span>
            </div>
            <Chip
              size="md"
              className="bg-white/90 backdrop-blur-sm text-[#C67B57] font-semibold text-sm px-3"
            >
              {item.item_type}
            </Chip>
          </div>

          {/* Click to View Indicator */}
          {isAvailable && (
            <div className="mt-3 text-center">
              <div className="inline-block bg-[#D9B38C]/90 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-white font-semibold text-sm">
                  👆 Tap to view details
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Hover Shine Effect */}
        {isAvailable && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
        )}
      </div>
    </Card>
  );
};

export default MenuCard;
