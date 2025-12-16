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
      isPressable={isAvailable}
      isHoverable={isAvailable}
      onClick={() => isAvailable && onClick(item)}
      className={`
        relative overflow-hidden h-[300px]
        border-2 border-primary
        bg-gradient-to-br from-card via-primary/30 to-secondary/40
        backdrop-blur-sm shadow-lg
        touch-manipulation
        ${
          isAvailable
            ? "cursor-pointer hover:border-primary hover:shadow-[0_0_30px_hsl(var(--primary)/0.6)]"
            : "opacity-60 cursor-not-allowed grayscale"
        }
      `}
    >
      <CardBody className="p-0 h-full flex flex-col">
        {/* Image Section - Compact */}
        <div className="relative h-[180px] w-full overflow-hidden bg-gradient-to-br from-primary/30 via-secondary/35 to-accent/40">
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
                className="font-bold text-xs px-2 py-1 bg-secondary text-white shadow-md"
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
        <div className="h-[120px] bg-gradient-to-b from-card/95 to-primary/20 backdrop-blur-sm p-3 flex flex-col justify-between border-t-2 border-primary/50">
          {/* Item Name - Compact */}
          <h3 className="text-lg font-bold text-foreground line-clamp-2 leading-tight">
            {item.name}
          </h3>

          {/* Price & Category */}
          <div className="flex items-end justify-between">
            <div>
              <span className="text-2xl font-black text-foreground">
                ${(Number(item.current_price) || 0).toFixed(2)}
              </span>
            </div>
            <Chip
              size="sm"
              className="bg-primary text-foreground font-bold text-xs px-3 py-1 shadow-sm"
            >
              {item.item_type}
            </Chip>
          </div>

          {/* Tap Indicator - Compact */}
          {isAvailable && (
            <div className="mt-1">
              <div className="inline-block bg-gradient-to-r from-primary to-secondary px-3 py-1 rounded-full shadow-md">
                <span className="text-foreground font-bold text-xs">👆 Tap</span>
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default MenuCard;
