"use client";

import React from "react";
import { Card, CardBody, Chip } from "@/components/primitives";
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
    <div
      onClick={() => isAvailable && onClick(item)}
      className={`
        group relative overflow-hidden rounded-3xl h-[450px]
        touch-manipulation
        ${
          isAvailable
            ? "cursor-pointer active:scale-[0.98]"
            : "opacity-60 cursor-not-allowed grayscale"
        }
      `}
    >
      {/* Modern Card */}
      <div className="modern-card h-full flex flex-col">
        {/* Image Section */}
        <div className="relative h-[280px] w-full overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
          {getImageUrl(item.image_url) ? (
            <>
              <Image
                src={getImageUrl(item.image_url) || ""}
                alt={item.name}
                fill
                className="object-cover"
                sizes="50vw"
                priority={false}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
              <span className="text-8xl drop-shadow-lg animate-pulse-gentle">
                🍰
              </span>
            </div>
          )}

          {/* Badges - Top right */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
            {item.is_featured && (
              <div className="animate-bounce-in">
                <Chip
                  size="sm"
                  className="font-bold text-sm px-3 py-1.5 bg-gradient-to-r from-secondary to-accent text-white shadow-lg backdrop-blur-sm"
                >
                  ⭐ Popular
                </Chip>
              </div>
            )}
            {!isAvailable && (
              <div className="animate-shake">
                <Chip
                  size="sm"
                  className="font-bold text-sm px-3 py-1.5 bg-red-500/90 text-white shadow-lg backdrop-blur-sm"
                >
                  Sold Out
                </Chip>
              </div>
            )}
          </div>

          {/* Cart Badge - Top left */}
          {cartQuantity > 0 && (
            <div className="absolute top-3 left-3 z-10 animate-bounce-in">
              <div className="bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg border-2 border-white animate-glow-pulse">
                <span className="font-black text-lg">{cartQuantity}</span>
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="flex-1 bg-white p-4 flex flex-col justify-between">
          {/* Item Name */}
          <div className="mb-2">
            <h3 className="text-xl font-bold text-foreground line-clamp-2 leading-tight">
              {item.name}
            </h3>
          </div>

          {/* Price and Category Row */}
          <div className="flex items-end justify-between mt-auto">
            {/* Price */}
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground font-medium">
                Price
              </span>
              <span className="text-3xl font-black text-gradient">
                ${(Number(item.current_price) || 0).toFixed(2)}
              </span>
            </div>

            {/* Category Badge */}
            <div className="flex flex-col items-end gap-1">
              <Chip
                size="sm"
                className="bg-primary/10 text-primary border border-primary/30 font-semibold text-sm px-3 py-1.5"
              >
                {item.item_type}
              </Chip>

              {/* Tap Indicator */}
              {isAvailable && (
                <div className="mt-1">
                  <div className="bg-gradient-to-r from-primary to-secondary px-3 py-1 rounded-full shadow-md">
                    <span className="text-foreground font-bold text-xs">
                      👆 Tap to View
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Border accent */}
        <div className="absolute inset-0 rounded-3xl border-2 border-primary/20 pointer-events-none" />
      </div>
    </div>
  );
};

export default MenuCard;
