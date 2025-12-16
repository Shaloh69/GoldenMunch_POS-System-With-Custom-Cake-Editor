"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { KioskAppSidebar } from "@/components/KioskAppSidebar";
import { useCart } from "@/contexts/CartContext";
import NextLink from "next/link";
import type { MenuItem } from "@/types/api";

export const dynamic = "force-dynamic";

interface Special {
  id: string;
  name: string;
  description: string;
  originalPrice: number;
  specialPrice: number;
  emoji: string;
  category: string;
  timeLeft: string;
  limitedQuantity?: number;
  soldCount?: number;
  isNew?: boolean;
  discount: number;
}

const todaysSpecials: Special[] = [
  {
    id: "special-1",
    name: "Triple Chocolate Delight",
    description:
      "Indulgent triple-layer chocolate cake with ganache frosting and chocolate shavings",
    originalPrice: 32.99,
    specialPrice: 19.99,
    emoji: "🍫",
    category: "cakes",
    timeLeft: "4 hours left",
    limitedQuantity: 6,
    soldCount: 2,
    isNew: true,
    discount: 39,
  },
  {
    id: "special-2",
    name: "Fresh Berry Croissant Bundle",
    description:
      "Pack of 4 buttery croissants filled with fresh strawberries and cream",
    originalPrice: 18.99,
    specialPrice: 12.99,
    emoji: "🥐",
    category: "pastries",
    timeLeft: "All day",
    discount: 32,
  },
  {
    id: "special-3",
    name: "Artisan Coffee + Cookie Combo",
    description:
      "Premium roasted coffee with your choice of any two freshly baked cookies",
    originalPrice: 12.99,
    specialPrice: 8.99,
    emoji: "☕",
    category: "beverages",
    timeLeft: "Until 3 PM",
    discount: 31,
  },
  {
    id: "special-4",
    name: "Gourmet Sandwich Meal",
    description:
      "Any signature sandwich with chips and a drink - perfect lunch combo",
    originalPrice: 16.99,
    specialPrice: 13.99,
    emoji: "🥪",
    category: "sandwiches",
    timeLeft: "Lunch only",
    limitedQuantity: 15,
    soldCount: 8,
    discount: 18,
  },
  {
    id: "special-5",
    name: "Mystery Cupcake Box",
    description: "Box of 6 surprise cupcakes - different flavors each time!",
    originalPrice: 24.99,
    specialPrice: 16.99,
    emoji: "🧁",
    category: "cakes",
    timeLeft: "2 hours left",
    limitedQuantity: 4,
    soldCount: 1,
    isNew: true,
    discount: 32,
  },
];

export default function SpecialsPage() {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const { items: cartItems } = useCart();

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleItemClick = (special: Special) => {
    // For now, just log - in future, convert Special to MenuItem
    console.log("Special clicked:", special);
  };

  const handleCloseSidebar = () => {
    setSelectedItem(null);
  };

  return (
    <>
      <div className="min-h-screen pr-[35vw] max-pr-[500px]">
        {/* Modern Header */}
        <div className="sticky top-0 z-40 glass-header py-6 px-4 mb-4 animate-fade-in-down">
          <div className="max-w-full mx-auto text-center">
            <h1 className="text-5xl font-black text-gradient drop-shadow-md mb-2 animate-bounce-in">
              ⭐ Today's Specials ⭐
            </h1>
            <p className="text-xl text-foreground/80 mb-1 font-semibold">{getCurrentDate()}</p>
            <p className="text-lg text-foreground/70">
              Limited time offers - Don't miss out!
            </p>
          </div>
        </div>

        <div className="max-w-full mx-auto px-4">
          {/* Flash Sale Banner */}
          <div className="mb-6 glass-card p-6 rounded-2xl shadow-xl animate-scale-in border-2 border-primary/60">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                🔥 Flash Sale Active! 🔥
              </h2>
              <p className="text-lg text-foreground/80">
                Extra savings on selected items - while supplies last!
              </p>
            </div>
          </div>

          {/* Today's Specials Grid - 2 Column Layout */}
          <div className="grid grid-cols-2 gap-6 pb-8">
            {todaysSpecials.map((special, index) => (
              <div
                key={special.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Card className="modern-card hover:scale-105 transition-all duration-300 shadow-xl relative overflow-hidden h-full cursor-pointer">
                  {/* Discount Badge */}
                  <div className="absolute top-4 right-4 z-10 animate-bounce-in animation-delay-200">
                    <Chip
                      size="lg"
                      className="font-bold text-base px-4 py-2 bg-red-500 text-white shadow-lg"
                    >
                      -{special.discount}%
                    </Chip>
                  </div>

                  {/* New Badge */}
                  {special.isNew && (
                    <div className="absolute top-4 left-4 z-10 animate-pulse-gentle">
                      <Chip
                        size="sm"
                        className="font-bold bg-green-500 text-white"
                      >
                        🆕 NEW
                      </Chip>
                    </div>
                  )}

                  <CardHeader className="flex flex-col items-center px-6 pt-8 pb-4">
                    <div className="text-8xl mb-4 animate-float drop-shadow-lg">
                      {special.emoji}
                    </div>
                    <h3 className="text-2xl font-bold text-foreground text-center mb-2">
                      {special.name}
                    </h3>
                    <p className="text-foreground/70 text-center mb-4 text-sm">
                      {special.description}
                    </p>

                    {/* Price Display */}
                    <div className="text-center mb-4">
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-lg text-foreground/60 line-through">
                          ₱{special.originalPrice.toFixed(2)}
                        </span>
                        <span className="text-3xl font-bold text-gradient">
                          ₱{special.specialPrice.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/70 mt-1 font-semibold">
                        You save ₱
                        {(special.originalPrice - special.specialPrice).toFixed(2)}!
                      </p>
                    </div>

                    {/* Time Remaining */}
                    <Chip
                      size="sm"
                      className="mb-4 bg-primary/20 text-foreground border border-primary/40"
                    >
                      ⏰ {special.timeLeft}
                    </Chip>
                  </CardHeader>

                  <CardBody className="px-6 pb-6">
                    {/* Quantity Tracker */}
                    {special.limitedQuantity && (
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-foreground">
                            Limited Quantity
                          </span>
                          <span className="text-sm text-foreground/70">
                            {special.limitedQuantity - (special.soldCount || 0)}{" "}
                            left
                          </span>
                        </div>
                        <Progress
                          value={
                            ((special.soldCount || 0) / special.limitedQuantity) *
                            100
                          }
                          className="mb-2 h-2"
                        />
                        <p className="text-xs text-foreground/60 text-center">
                          {special.soldCount || 0} of {special.limitedQuantity} sold
                        </p>
                      </div>
                    )}

                    <Button
                      size="lg"
                      className="w-full btn-gradient font-bold text-base mb-3 py-4 touch-target"
                      onClick={() => handleItemClick(special)}
                    >
                      🛒 Add Special to Cart
                    </Button>

                    <Button
                      as={NextLink}
                      href={`/?category=${special.category}`}
                      size="md"
                      variant="bordered"
                      className="w-full glass-button font-semibold text-sm"
                    >
                      View Similar Items
                    </Button>
                  </CardBody>
                </Card>
              </div>
            ))}
          </div>

          {/* Additional Offers */}
          <div className="mb-8 animate-fade-in-up animation-delay-1000">
            <h2 className="text-3xl font-bold text-foreground mb-6 text-center">
              🎁 Additional Offers
            </h2>

            <div className="grid grid-cols-2 gap-6">
              {/* Loyalty Program */}
              <Card className="glass-card border-2 border-primary/40">
                <CardBody className="p-6 text-center">
                  <div className="text-4xl mb-3 animate-bounce-slow">🏆</div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Loyalty Rewards
                  </h3>
                  <p className="text-foreground/70 mb-4 text-sm">
                    Earn points with every purchase! Get a free pastry after 10
                    visits.
                  </p>
                  <Button
                    size="md"
                    className="btn-gradient font-bold"
                  >
                    Learn More
                  </Button>
                </CardBody>
              </Card>

              {/* Happy Hour */}
              <Card className="glass-card border-2 border-secondary/40">
                <CardBody className="p-6 text-center">
                  <div className="text-4xl mb-3 animate-pulse-gentle">🕐</div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Happy Hour Special
                  </h3>
                  <p className="text-foreground/70 mb-4 text-sm">
                    50% off all beverages between 2-4 PM on weekdays!
                  </p>
                  <Button
                    size="md"
                    variant="bordered"
                    className="glass-button font-bold"
                  >
                    Set Reminder
                  </Button>
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Navigation */}
          <div className="pb-8 text-center animate-fade-in-up animation-delay-2000">
            <div className="flex gap-4">
              <Button
                as={NextLink}
                href="/"
                size="lg"
                className="btn-gradient flex-1 font-bold text-lg py-6 touch-target"
              >
                🏠 Back to Menu
              </Button>
              <Button
                as={NextLink}
                href="/menu"
                size="lg"
                className="glass-button flex-1 font-bold text-lg py-6 touch-target"
              >
                📋 Browse Menu
              </Button>
            </div>
          </div>
        </div>
        </div>

      {/* Sidebar */}
      <KioskAppSidebar selectedItem={selectedItem} onClose={handleCloseSidebar} />
    </>
  );
}
