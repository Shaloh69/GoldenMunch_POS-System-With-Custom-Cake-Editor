"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import type { MenuItem } from "@/types/api";
import { getImageUrl } from "@/utils/imageUtils";
import { Button, Chip } from "@/components/primitives";

interface KioskAppSidebarProps {
  selectedItem: MenuItem | null;
  onClose: () => void;
}

export function KioskAppSidebar({
  selectedItem,
  onClose,
}: KioskAppSidebarProps) {
  const pathname = usePathname();
  const { addItem, items: cartItems, getItemCount, getTotal } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isCartHidden, setIsCartHidden] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);

  // Don't show sidebar on idle, cart, and custom-cake pages
  if (
    pathname === "/idle" ||
    pathname === "/cart" ||
    pathname === "/custom-cake"
  ) {
    console.log("KioskAppSidebar: Hidden on path", pathname);
    return null;
  }

  const handleAddToCart = () => {
    if (selectedItem) {
      // Check stock availability before adding
      if (!selectedItem.is_infinite_stock) {
        const currentCartItem = cartItems.find(
          (item) => item.menuItem.menu_item_id === selectedItem.menu_item_id
        );
        const currentCartQuantity = currentCartItem?.quantity || 0;
        const totalQuantity = currentCartQuantity + quantity;

        if (totalQuantity > selectedItem.stock_quantity) {
          alert(
            `Sorry! Only ${selectedItem.stock_quantity} item(s) available.\nYou already have ${currentCartQuantity} in your cart.`
          );
          return;
        }
      }

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

    // Get max allowed quantity
    let maxQty = 99;
    if (selectedItem && !selectedItem.is_infinite_stock) {
      const currentCartItem = cartItems.find(
        (item) => item.menuItem.menu_item_id === selectedItem.menu_item_id
      );
      const currentCartQuantity = currentCartItem?.quantity || 0;
      maxQty = Math.min(99, selectedItem.stock_quantity - currentCartQuantity);
    }

    if (newQty >= 1 && newQty <= maxQty) {
      setQuantity(newQty);
    }
  };

  const itemCount = getItemCount();
  const total = getTotal();
  const isAvailable =
    selectedItem?.status === "available" &&
    (selectedItem?.is_infinite_stock ||
      (selectedItem?.stock_quantity ?? 0) > 0);

  // Calculate remaining available quantity for current item
  const getRemainingStock = (): number | null => {
    if (!selectedItem || selectedItem.is_infinite_stock) return null;

    const currentCartItem = cartItems.find(
      (item) => item.menuItem.menu_item_id === selectedItem.menu_item_id
    );
    const currentCartQuantity = currentCartItem?.quantity || 0;
    return selectedItem.stock_quantity - currentCartQuantity;
  };

  const remainingStock = getRemainingStock();
  const maxAllowedQty = remainingStock !== null ? Math.min(99, remainingStock) : 99;

  console.log("KioskAppSidebar: Rendering on path", pathname, {
    selectedItem: selectedItem?.name,
    itemCount,
  });

  return (
    <>
      {/* Sidebar Toggle Button - Always visible */}
      <button
        onClick={() => setIsSidebarHidden(!isSidebarHidden)}
        className={`fixed top-1/2 -translate-y-1/2 z-[10000] bg-gradient-to-br from-primary to-secondary text-black font-bold shadow-xl rounded-l-2xl flex items-center justify-center touch-target transition-all duration-500 ${
          isSidebarHidden ? "right-0" : "right-[35vw] max-right-[500px]"
        }`}
        style={{
          right: isSidebarHidden ? "0" : "min(35vw, 500px)",
          writingMode: "vertical-rl",
          padding: "1rem 0.5rem",
        }}
        aria-label={isSidebarHidden ? "Show sidebar" : "Hide sidebar"}
      >
        <span className="text-2xl">{isSidebarHidden ? "◀" : "▶"}</span>
      </button>

      {/* Sidebar Container */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-[35vw] max-w-[500px] z-[9999] flex flex-col backdrop-blur-3xl bg-white/85 border-l-2 border-primary/20 shadow-[-20px_0_60px_rgba(251,205,47,0.2)] transition-transform duration-500 ease-in-out ${
          isSidebarHidden ? "translate-x-full" : "translate-x-0"
        }`}
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(48px)",
          WebkitBackdropFilter: "blur(48px)",
        }}
      >
        {/* Item Detail Section */}
        <div
          className={`flex-1 overflow-y-auto scrollbar-hide transition-all duration-500 p-0 ${selectedItem ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          {selectedItem && (
            <div className="p-6 h-full animate-slide-in-left">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-8 right-8 w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-black shadow-lg z-50 touch-target animate-bounce-in active:scale-95"
              >
                <span className="text-3xl font-bold">×</span>
              </button>

              <div className="modern-card h-full flex flex-col overflow-hidden">
                {/* Large Image */}
                <div className="relative h-80 bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden">
                  {getImageUrl(selectedItem.image_url) ? (
                    <>
                      <Image
                        src={getImageUrl(selectedItem.image_url) || ""}
                        alt={selectedItem.name}
                        fill
                        className="object-cover"
                        sizes="30vw"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-9xl animate-pulse-gentle">🍰</div>
                    </div>
                  )}

                  {/* Floating Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-3 z-10">
                    {selectedItem.is_featured && (
                      <div className="animate-bounce-in animation-delay-200">
                        <Chip
                          size="lg"
                          className="font-bold text-base px-4 py-2 bg-gradient-to-r from-secondary to-accent text-white shadow-lg backdrop-blur-sm"
                        >
                          ⭐ Popular
                        </Chip>
                      </div>
                    )}
                    {!isAvailable && (
                      <div className="animate-shake">
                        <Chip
                          size="lg"
                          className="font-bold text-base px-4 py-2 bg-red-500/90 text-white shadow-lg backdrop-blur-sm"
                        >
                          ❌ Sold Out
                        </Chip>
                      </div>
                    )}
                  </div>
                </div>

                {/* Item Details */}
                <div className="flex-1 bg-white p-6 flex flex-col overflow-y-auto scrollbar-hide">
                  {/* Name */}
                  <h2 className="text-4xl font-black text-gradient mb-4 animate-fade-in-up">
                    {selectedItem.name}
                  </h2>

                  {/* Description */}
                  <p className="text-xl text-black mb-6 leading-relaxed animate-fade-in-up animation-delay-200">
                    {selectedItem.description ||
                      "Delicious treat made fresh daily with the finest ingredients."}
                  </p>

                  {/* Category Tags */}
                  <div className="flex gap-3 mb-6 flex-wrap animate-fade-in-up animation-delay-500">
                    <Chip
                      size="lg"
                      className="bg-primary/10 text-primary border border-primary/30 font-semibold text-base px-4 py-2"
                    >
                      {selectedItem.item_type}
                    </Chip>
                    {selectedItem.categories &&
                      selectedItem.categories.length > 0 && (
                        <Chip
                          size="lg"
                          className="bg-secondary/10 text-secondary border border-secondary/30 font-semibold text-base px-4 py-2"
                        >
                          {selectedItem.categories[0].name}
                        </Chip>
                      )}
                  </div>

                  {/* Price */}
                  <div className="mb-6 animate-scale-in animation-delay-500">
                    <span className="text-sm text-black font-medium block mb-1">
                      Price
                    </span>
                    <span className="text-6xl font-black text-gradient">
                      ₱{(Number(selectedItem.current_price) || 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Stock Info */}
                  {!selectedItem.is_infinite_stock && (
                    <div className="mb-6 animate-fade-in-up animation-delay-1000">
                      {isAvailable ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-lg text-black">
                            <span>📦</span>
                            <span>{selectedItem.stock_quantity} in stock</span>
                          </div>
                          {remainingStock !== null &&
                            remainingStock < selectedItem.stock_quantity && (
                              <div className="flex items-center gap-2 text-base text-orange-600 font-semibold">
                                <span>🛒</span>
                                <span>
                                  {remainingStock} available (
                                  {selectedItem.stock_quantity - remainingStock} in
                                  cart)
                                </span>
                              </div>
                            )}
                          {remainingStock === 0 && (
                            <div className="flex items-center gap-2 text-base text-red-600 font-bold">
                              <span>⚠️</span>
                              <span>All items already in cart</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-lg text-red-500 font-bold">
                          <span>❌</span>
                          <span>Out of stock</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Spacer */}
                  <div className="flex-1 min-h-4" />

                  {/* Quantity & Add to Cart */}
                  {isAvailable && remainingStock !== 0 && (
                    <div className="space-y-5 animate-fade-in-up animation-delay-1000">
                      {/* Quantity Selector */}
                      <div className="glass-card p-5 rounded-2xl">
                        <span className="text-xl font-semibold text-black block mb-4">
                          Quantity
                        </span>
                        <div className="flex items-center justify-center gap-4">
                          <Button
                            size="icon"
                            onClick={() => handleQuantityChange(-1)}
                            disabled={quantity <= 1}
                            className="btn-gradient w-12 h-12 text-2xl font-bold touch-target active:scale-60"
                          >
                            −
                          </Button>
                          <span className="text-5xl font-black text-gradient min-w-[100px] text-center">
                            {quantity}
                          </span>
                          <Button
                            size="icon"
                            onClick={() => handleQuantityChange(1)}
                            disabled={quantity >= maxAllowedQty}
                            className="btn-gradient w-12 h-12 text-2xl font-bold touch-target active:scale-60"
                          >
                            +
                          </Button>
                        </div>
                        {remainingStock !== null && remainingStock < 99 && (
                          <div className="text-center mt-3 text-sm text-black font-medium">
                            Max: {maxAllowedQty}
                          </div>
                        )}
                      </div>

                      {/* Add to Cart Button */}
                      <Button
                        size="lg"
                        onClick={handleAddToCart}
                        className="btn-gradient w-full text-3xl font-black py-10 shadow-2xl touch-target-lg rounded-2xl active:scale-95"
                      >
                        🛒 Add to Cart
                      </Button>
                    </div>
                  )}

                  {isAvailable && remainingStock === 0 && (
                    <Button
                      disabled
                      size="lg"
                      className="w-full bg-gray-300 text-gray-600 font-semibold text-3xl py-10 touch-target-lg rounded-2xl opacity-60"
                    >
                      All in Cart
                    </Button>
                  )}

                  {!isAvailable && (
                    <Button
                      disabled
                      size="lg"
                      className="w-full bg-gray-300 text-gray-600 font-semibold text-3xl py-10 touch-target-lg rounded-2xl opacity-60"
                    >
                      Unavailable
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cart Section - Always visible */}
        <div
          className={`border-t-2 border-primary/20 transition-all duration-500 p-0 ${isCartHidden ? "h-20" : "h-[40vh]"} bg-gradient-to-b from-primary/5 to-white`}
        >
          {/* Toggle Button */}
          <button
            onClick={() => setIsCartHidden(!isCartHidden)}
            className="w-full px-8 py-5 flex items-center justify-between bg-primary/5 active:bg-primary/10 touch-target-lg group"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">🛒</span>
              <span className="text-2xl font-bold text-black">
                Your Cart {itemCount > 0 && `(${itemCount})`}
              </span>
            </div>
            <span
              className={`text-3xl text-black transition-transform duration-300 ${isCartHidden ? "" : "rotate-180"}`}
            >
              ▼
            </span>
          </button>

          {/* Cart Content */}
          {!isCartHidden && (
            <div className="px-6 pb-6 h-[calc(40vh-5rem)] flex flex-col">
              {itemCount === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
                  <div className="text-6xl mb-4 animate-pulse-gentle">🛒</div>
                  <p className="text-xl text-black font-semibold">
                    Your cart is empty
                  </p>
                  <p className="text-base text-black mt-2">
                    Select items to get started
                  </p>
                </div>
              ) : (
                <>
                  {/* Cart Items List */}
                  <div className="flex-1 overflow-y-auto mb-4 space-y-3 scrollbar-hide">
                    {cartItems.map((cartItem, index) => (
                      <div
                        key={`${cartItem.menuItem.menu_item_id}-${index}`}
                        className="glass-card p-4 rounded-xl animate-slide-in-right"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex items-center gap-4">
                          {/* Item Image */}
                          <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                            {getImageUrl(cartItem.menuItem.image_url) ? (
                              <Image
                                src={
                                  getImageUrl(cartItem.menuItem.image_url) || ""
                                }
                                alt={cartItem.menuItem.name}
                                width={80}
                                height={80}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <span className="text-4xl">🍰</span>
                            )}
                          </div>

                          {/* Item Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-bold text-black truncate">
                              {cartItem.menuItem.name}
                            </h4>
                            <p className="text-base text-black font-medium">
                              {cartItem.quantity} × ₱
                              {(
                                Number(cartItem.menuItem.current_price) || 0
                              ).toFixed(2)}
                            </p>
                          </div>

                          {/* Item Total */}
                          <div className="text-xl font-black text-gradient">
                            ₱
                            {(
                              (Number(cartItem.menuItem.current_price) || 0) *
                              cartItem.quantity
                            ).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total & Buttons */}
                  <div className="space-y-4">
                    {/* Total */}
                    <div className="glass-card p-5 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-black">
                          Total:
                        </span>
                        <span className="text-4xl font-black text-gradient">
                          ₱{total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Checkout Button */}
                    <Link href="/cart" className="block">
                      <Button
                        size="lg"
                        className="btn-gradient w-full text-2xl font-bold py-8 shadow-xl touch-target-lg rounded-2xl active:scale-95"
                      >
                        View Cart & Checkout →
                      </Button>
                    </Link>

                    {/* Custom Cake Button */}
                    <Link href="/custom-cake" className="block">
                      <Button
                        size="lg"
                        className="glass-button w-full text-xl font-semibold py-7 touch-target rounded-2xl border-2 border-primary/30 active:scale-95"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>🎂 Custom Cake</span>
                          <span className="text-sm bg-primary/20 px-3 py-1 rounded-lg">
                            📱 Scan QR
                          </span>
                        </div>
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default KioskAppSidebar;
