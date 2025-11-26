'use client';

import React from 'react';
import { Card, CardBody } from '@heroui/card';
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
        relative overflow-hidden cursor-pointer h-[330px]
        border-2 border-[#D9B38C]
        transition-all duration-300
        ${isAvailable
          ? 'hover:border-[#C67B57] hover:shadow-[0_0_30px_rgba(198,123,87,0.4)] hover:scale-103'
          : 'opacity-60 cursor-not-allowed'
        }
      `}
    >
      <CardBody className="p-0 h-full flex flex-col">
        {/* Image Section - 60% (200px) - Clean, no text */}
        <div className="relative h-[200px] w-full overflow-hidden bg-gradient-to-br from-[#E8DCC8] to-[#D9B38C]/30">
          {getImageUrl(item.image_url) ? (
            <Image
              src={getImageUrl(item.image_url) || ''}
              alt={item.name}
              fill
              className={`object-cover transition-transform duration-500 ${isAvailable ? 'group-hover:scale-110' : ''}`}
              sizes="25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-8xl">🍰</span>
            </div>
          )}

          {/* Badges - Only on Image */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
            {item.is_featured && (
              <Chip
                size="lg"
                className="font-bold text-sm px-3 py-1 bg-[#C67B57] text-white shadow-lg"
              >
                ⭐ Popular
              </Chip>
            )}
            {!isAvailable && (
              <Chip
                size="lg"
                className="font-bold text-sm px-3 py-1 bg-red-500 text-white shadow-lg"
              >
                Sold Out
              </Chip>
            )}
            {cartQuantity > 0 && (
              <Chip
                size="lg"
                className="font-bold text-sm px-3 py-1 bg-green-600 text-white shadow-lg animate-pulse"
              >
                {cartQuantity} in cart
              </Chip>
            )}
          </div>
        </div>

        {/* Info Section - 40% (130px) - Solid Background, Perfect Contrast */}
        <div className="h-[130px] bg-[#FFF9F2] p-4 flex flex-col justify-between">
          {/* Item Name */}
          <h3 className="text-lg font-bold text-[#8B5A3C] line-clamp-1 leading-tight">
            {item.name}
          </h3>

          {/* Price & Category */}
          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-3xl font-black text-[#8B5A3C]">
                ${(Number(item.current_price) || 0).toFixed(2)}
              </span>
            </div>
            <Chip
              size="sm"
              className="bg-[#E8DCC8] text-[#8B5A3C] font-semibold text-xs px-2"
            >
              {item.item_type}
            </Chip>
          </div>

          {/* Tap to View Indicator */}
          {isAvailable && (
            <div className="mt-2">
              <div className="inline-block bg-[#D9B38C] px-3 py-1 rounded-full">
                <span className="text-white font-semibold text-xs">
                  👆 Tap for details
                </span>
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default MenuCard;
