"use client";

import React from "react";
import { Card, CardBody } from "@/components/ui/card";
import { Chip } from "@/components/ui/badge";
import Image from "next/image";
import type { MenuItem } from "@/types/api";
import { getImageUrl } from "@/utils/imageUtils";

interface MenuCardProps {
  item: MenuItem;
  onClick: (item: MenuItem) => void;
  cartQuantity?: number;
}

export const MenuCard: React.FC<MenuCardProps> = ({
  item,
  onClick,
  cartQuantity = 0,
}) => {
  const isAvailable =
    item.status === "available" &&
    (item.is_infinite_stock || item.stock_quantity > 0);

  return (
    <Card
      isPressable
      onPress={() => onClick(item)}
      className={`
        relative overflow-hidden cursor-pointer h-[300px]
        border-2 border-sunny-yellow/60
        bg-gradient-to-br from-pure-white via-sunny-yellow/10 to-deep-orange-yellow/15
        backdrop-blur-sm shadow-lg
        transition-all duration-300
        touch-manipulation
        ${
          isAvailable
            ? "hover:border-sunny-yellow hover:shadow-[0_0_30px_rgba(251,205,47,0.5)] hover:scale-[1.01]"
            : "opacity-60 cursor-not-allowed grayscale"
        }
      `}
    >
      <CardBody className="p-0 h-full flex flex-col">
        {/* Image Section - Compact */}
        <div className="relative h-[180px] w-full overflow-hidden bg-gradient-to-br from-sunny-yellow/20 via-deep-orange-yellow/15 to-sunny-yellow/30">
          {getImageUrl(item.image_url) ? (
            <Image
              src={getImageUrl(item.image_url) || ""}
              alt={item.name}
              fill
              className={`object-cover transition-transform duration-500 ${isAvailable ? "group-hover:scale-110" : ""}`}
              sizes="50vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl">🍰</span>
            </div>
          )}

          {/* Compact Badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
            {item.is_featured && (
              <Chip
                size="sm"
                className="font-bold text-xs px-2 py-1 bg-deep-orange-yellow text-white shadow-md"
              >
                ⭐ Popular
              </Chip>
            )}
            {!isAvailable && (
              <Chip
                size="sm"
                className="font-bold text-xs px-2 py-1 bg-red-500 text-white shadow-md"
              >
                Sold Out
              </Chip>
            )}
            {cartQuantity > 0 && (
              <Chip
                size="sm"
                className="font-bold text-xs px-2 py-1 bg-green-600 text-white shadow-md animate-pulse"
              >
                {cartQuantity} in cart
              </Chip>
            )}
          </div>
        </div>

        {/* Compact Info Section */}
        <div className="h-[120px] bg-gradient-to-b from-pure-white/95 to-sunny-yellow/5 backdrop-blur-sm p-3 flex flex-col justify-between border-t-2 border-sunny-yellow/30">
          {/* Item Name - Compact */}
          <h3 className="text-lg font-bold text-black line-clamp-2 leading-tight">
            {item.name}
          </h3>

          {/* Price & Category */}
          <div className="flex items-end justify-between">
            <div>
              <span className="text-2xl font-black text-black">
                ${(Number(item.current_price) || 0).toFixed(2)}
              </span>
            </div>
            <Chip
              size="sm"
              className="bg-sunny-yellow text-black font-bold text-xs px-3 py-1 shadow-sm"
            >
              {item.item_type}
            </Chip>
          </div>

          {/* Tap Indicator - Compact */}
          {isAvailable && (
            <div className="mt-1">
              <div className="inline-block bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow px-3 py-1 rounded-full shadow-md">
                <span className="text-black font-bold text-xs">👆 Tap</span>
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default MenuCard;
