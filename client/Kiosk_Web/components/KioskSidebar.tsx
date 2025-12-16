"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Chip } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { usePathname } from "next/navigation";
import type { MenuItem } from "@/types/api";
import { getImageUrl } from "@/utils/imageUtils";

interface KioskSidebarProps {
  selectedItem: MenuItem | null;
  onClose: () => void;
}

export const KioskSidebar: React.FC<KioskSidebarProps> = ({
  selectedItem,
  onClose,
}) => {
  const pathname = usePathname();
  const { addItem, items: cartItems, getItemCount, getTotal } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isCartHidden, setIsCartHidden] = useState(false);

  // Don't show sidebar on cart, idle, or custom-cake pages
  if (
    pathname === "/cart" ||
    pathname === "/idle" ||
    pathname === "/custom-cake"
  ) {
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
  const isAvailable =
    selectedItem?.status === "available" &&
    (selectedItem?.is_infinite_stock ||
      (selectedItem?.stock_quantity ?? 0) > 0);

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[35vw] max-w-[500px] bg-gradient-to-b from-card/95 to-secondary/10 backdrop-blur-xl border-l-4 border-primary shadow-[-10px_0_40px_rgba(255,215,0,0.5)] z-50 flex flex-col">
      {/* Item Detail Section (Top 60%) */}
      <div
        className={`flex-1 overflow-y-auto transition-all duration-500 ${selectedItem ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        {selectedItem && (
          <div className="p-6 h-full">
            <Card className="bg-gradient-to-br from-pure-white/90 via-sunny-yellow/5 to-deep-orange-yellow/10 backdrop-blur-sm border-2 border-primary/60 shadow-xl h-full">
              <CardBody className="p-0 flex flex-col h-full">
                {/* Large Image */}
                <div className="relative h-80 bg-gradient-to-br from-sunny-yellow/25 via-deep-orange-yellow/20 to-sunny-yellow/35 flex items-center justify-center overflow-hidden">
                  {getImageUrl(selectedItem.image_url) ? (
                    <Image
                      src={getImageUrl(selectedItem.image_url) || ""}
                      alt={selectedItem.name}
                      fill
                      className="object-cover"
                      sizes="30vw"
                    />
                  ) : (
                    <div className="text-9xl">🍰</div>
                  )}

                  {/* Close Button - Larger for touch */}
                  <button
                    onClick={onClose}
                    className="absolute top-6 right-6 w-16 h-16 bg-primary rounded-full flex items-center justify-center text-foreground hover:bg-secondary hover:text-primary-foreground transition-all shadow-xl hover:scale-110 touch-target"
                  >
                    <span className="text-3xl font-bold">×</span>
                  </button>

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {selectedItem.is_featured && (
                      <Chip
                        size="lg"
                        className="font-bold text-base px-4 py-2 bg-secondary text-primary-foreground shadow-lg"
                      >
                        Popular
                      </Chip>
                    )}
                    {!isAvailable && (
                      <Chip
                        size="lg"
                        className="font-bold text-base px-4 py-2 bg-red-500 text-primary-foreground shadow-lg"
                      >
                        Sold Out
                      </Chip>
                    )}
                  </div>
                </div>

                {/* Item Details - White Background with Dark Text */}
                <div className="p-6 flex-1 flex flex-col justify-between bg-gradient-to-b from-pure-white/95 to-sunny-yellow/5 backdrop-blur-sm">
                  <div>
                    {/* Name - Larger for portrait */}
                    <h2 className="text-4xl font-black text-foreground mb-4">
                      {selectedItem.name}
                    </h2>

                    {/* Description - All black text */}
                    <p className="text-xl text-foreground mb-5 leading-relaxed">
                      {selectedItem.description ||
                        "Delicious treat made fresh daily with the finest ingredients."}
                    </p>

                    {/* Category & Type - Larger */}
                    <div className="flex gap-4 mb-5">
                      <Chip
                        size="lg"
                        className="bg-primary text-foreground font-bold text-lg px-5 py-2 shadow-md"
                      >
                        {selectedItem.item_type}
                      </Chip>
                      {selectedItem.categories &&
                        selectedItem.categories.length > 0 && (
                          <Chip
                            size="lg"
                            className="bg-secondary text-foreground font-bold text-lg px-5 py-2 shadow-md"
                          >
                            {selectedItem.categories[0].name}
                          </Chip>
                        )}
                    </div>

                    {/* Price - Larger and always black */}
                    <div className="mb-5">
                      <span className="text-6xl font-black text-foreground">
                        ${(Number(selectedItem.current_price) || 0).toFixed(2)}
                      </span>
                    </div>

                    {/* Stock Info - All black text */}
                    {!selectedItem.is_infinite_stock && (
                      <p className="text-lg text-foreground mb-5">
                        {isAvailable ? (
                          <span>
                            📦 {selectedItem.stock_quantity} available
                          </span>
                        ) : (
                          <span className="text-foreground font-bold">
                            ❌ Out of stock
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Quantity Selector & Add Button - Larger for touch */}
                  {isAvailable && (
                    <div className="space-y-5">
                      {/* Quantity Selector - Larger buttons */}
                      <div className="flex items-center gap-5">
                        <span className="text-2xl font-semibold text-foreground">
                          Quantity:
                        </span>
                        <div className="flex items-center gap-4">
                          <Button
                            size="icon"
                            className="bg-primary/30 text-foreground font-bold text-3xl hover:bg-primary hover:text-foreground transition-all w-20 h-20 touch-target-lg"
                            onClick={() => handleQuantityChange(-1)}
                          >
                            −
                          </Button>
                          <span className="text-4xl font-bold text-foreground min-w-[80px] text-center">
                            {quantity}
                          </span>
                          <Button
                            size="icon"
                            className="bg-primary/30 text-foreground font-bold text-3xl hover:bg-primary hover:text-foreground transition-all w-20 h-20 touch-target-lg"
                            onClick={() => handleQuantityChange(1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      {/* Add to Cart Button - Larger */}
                      <Button
                        size="lg"
                        className="w-full bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow text-foreground font-bold text-3xl py-10 shadow-xl hover:shadow-2xl hover:scale-105 transition-all touch-target-lg"
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
                      className="w-full bg-gray-300 text-foreground font-semibold text-3xl py-10 touch-target-lg"
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

      {/* Cart Section (Bottom 40%) - Always Present, portrait optimized */}
      <div
        className={`border-t-4 border-primary bg-gradient-to-b from-sunny-yellow/10 to-deep-orange-yellow/15 backdrop-blur-md transition-all duration-500 ${isCartHidden ? "h-20" : "h-[40vh]"}`}
      >
        {/* Toggle Button - Larger for touch */}
        <button
          onClick={() => setIsCartHidden(!isCartHidden)}
          className="w-full px-8 py-5 flex items-center justify-between hover:bg-primary/30 transition-all touch-target-lg"
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">🛒</span>
            <span className="text-2xl font-bold text-foreground">
              Your Cart {itemCount > 0 && `(${itemCount})`}
            </span>
          </div>
          <span className="text-3xl text-foreground">
            {isCartHidden ? "▲" : "▼"}
          </span>
        </button>

        {/* Cart Content */}
        {!isCartHidden && (
          <div className="px-6 pb-6 h-[calc(40vh-4rem)] flex flex-col bg-gradient-to-b from-transparent to-sunny-yellow/5">
            {itemCount === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-4">🛒</div>
                <p className="text-xl text-foreground font-semibold">
                  Your cart is empty
                </p>
                <p className="text-base text-foreground mt-2">
                  Select items to get started
                </p>
              </div>
            ) : (
              <>
                {/* Cart Items List - Larger images, all black text */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                  {cartItems.map((cartItem) => (
                    <Card
                      key={cartItem.menuItem.menu_item_id}
                      className="bg-gradient-to-r from-pure-white/90 to-sunny-yellow/10 backdrop-blur-sm border-3 border-primary/40 shadow-md"
                    >
                      <CardBody className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 bg-gradient-to-br from-sunny-yellow/20 to-deep-orange-yellow/20 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            {getImageUrl(cartItem.menuItem.image_url) ? (
                              <Image
                                src={
                                  getImageUrl(cartItem.menuItem.image_url) || ""
                                }
                                alt={cartItem.menuItem.name}
                                width={80}
                                height={80}
                                className="object-cover w-full h-full"
                                unoptimized
                              />
                            ) : (
                              <span className="text-4xl">🍰</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-bold text-foreground truncate leading-tight">
                              {cartItem.menuItem.name}
                            </h4>
                            <p className="text-base text-foreground font-semibold mt-1">
                              {cartItem.quantity} × $
                              {(
                                Number(cartItem.menuItem.current_price) || 0
                              ).toFixed(2)}
                            </p>
                          </div>
                          <div className="text-xl font-black text-foreground">
                            $
                            {(
                              (Number(cartItem.menuItem.current_price) || 0) *
                              cartItem.quantity
                            ).toFixed(2)}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>

                {/* Total - All black text */}
                <div className="border-t-2 border-primary pt-4 mb-4 bg-gradient-to-r from-sunny-yellow/15 to-deep-orange-yellow/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-foreground">
                      Total:
                    </span>
                    <span className="text-3xl font-black text-foreground">
                      ${total.toFixed(2)}
                    </span>
                  </div>

                  {/* Buttons - Larger for portrait touch */}
                  <div className="space-y-4">
                    <Button
                      as={Link}
                      href="/cart"
                      size="lg"
                      className="w-full bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow text-foreground font-bold text-2xl py-8 shadow-lg hover:shadow-xl hover:scale-105 transition-all touch-target-lg"
                    >
                      View Cart & Checkout →
                    </Button>

                    <Button
                      as={Link}
                      href="/custom-cake"
                      size="lg"
                      className="w-full bg-gradient-to-r from-deep-orange-yellow via-sunny-yellow to-deep-orange-yellow text-foreground font-bold text-2xl py-8 shadow-lg hover:shadow-xl hover:scale-105 transition-all touch-target-lg"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>🎂 Custom Cake</span>
                        <span className="text-sm bg-black/20 px-3 py-1 rounded-lg text-foreground">
                          📱 Scan QR
                        </span>
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
