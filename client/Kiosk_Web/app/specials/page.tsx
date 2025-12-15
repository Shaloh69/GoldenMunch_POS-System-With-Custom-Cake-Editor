import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Badge } from '@heroui/badge';
import { Progress } from '@heroui/progress';
import NextLink from 'next/link';

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
    description: "Indulgent triple-layer chocolate cake with ganache frosting and chocolate shavings",
    originalPrice: 32.99,
    specialPrice: 19.99,
    emoji: "🍫",
    category: "cakes",
    timeLeft: "4 hours left",
    limitedQuantity: 6,
    soldCount: 2,
    isNew: true,
    discount: 39
  },
  {
    id: "special-2",
    name: "Fresh Berry Croissant Bundle",
    description: "Pack of 4 buttery croissants filled with fresh strawberries and cream",
    originalPrice: 18.99,
    specialPrice: 12.99,
    emoji: "🥐",
    category: "pastries",
    timeLeft: "All day",
    discount: 32
  },
  {
    id: "special-3",
    name: "Artisan Coffee + Cookie Combo",
    description: "Premium roasted coffee with your choice of any two freshly baked cookies",
    originalPrice: 12.99,
    specialPrice: 8.99,
    emoji: "☕",
    category: "beverages",
    timeLeft: "Until 3 PM",
    discount: 31
  },
  {
    id: "special-4",
    name: "Gourmet Sandwich Meal",
    description: "Any signature sandwich with chips and a drink - perfect lunch combo",
    originalPrice: 16.99,
    specialPrice: 13.99,
    emoji: "🥪",
    category: "sandwiches",
    timeLeft: "Lunch only",
    limitedQuantity: 15,
    soldCount: 8,
    discount: 18
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
    discount: 32
  }
];

export default function SpecialsPage() {
  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-white to-caramel-beige">
      {/* Header */}
      <div className="bg-gradient-to-r from-golden-orange via-deep-amber to-golden-orange text-chocolate-brown p-8 shadow-lg">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-2 animate-pulse-slow">⭐ Today's Specials ⭐</h1>
          <p className="text-xl opacity-90 mb-2">{getCurrentDate()}</p>
          <p className="text-lg opacity-80">Limited time offers - Don't miss out!</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Flash Sale Banner */}
        <div className="mb-8 bg-gradient-to-r from-deep-amber to-chocolate-brown text-cream-white p-6 rounded-2xl shadow-xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">🔥 Flash Sale Active! 🔥</h2>
            <p className="text-lg opacity-90">Extra savings on selected items - while supplies last!</p>
          </div>
        </div>

        {/* Today's Specials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {todaysSpecials.map((special) => (
            <Card 
              key={special.id}
              className="hover:scale-105 transition-all duration-300 shadow-xl border-2 border-golden-orange/30 hover:border-golden-orange bg-cream-white relative overflow-hidden"
            >
              {/* Discount Badge */}
              <div className="absolute top-4 right-4 z-10">
                <Chip 
                  color="danger" 
                  size="lg" 
                  variant="solid"
                  className="font-bold text-lg px-3 py-1"
                >
                  -{special.discount}%
                </Chip>
              </div>

              {/* New Badge */}
              {special.isNew && (
                <div className="absolute top-4 left-4 z-10">
                  <Chip 
                    color="success" 
                    size="sm" 
                    variant="flat"
                    className="font-bold animate-pulse-slow"
                  >
                    🆕 NEW
                  </Chip>
                </div>
              )}

              <CardHeader className="flex flex-col items-center px-6 pt-8 pb-4">
                <div className="text-8xl mb-4 animate-float">{special.emoji}</div>
                <h3 className="text-2xl font-bold text-chocolate-brown text-center mb-2">
                  {special.name}
                </h3>
                <p className="text-chocolate-brown/70 text-center mb-4">
                  {special.description}
                </p>
                
                {/* Price Display */}
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-lg text-chocolate-brown/60 line-through">
                      ${special.originalPrice.toFixed(2)}
                    </span>
                    <span className="text-3xl font-bold text-deep-amber">
                      ${special.specialPrice.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-chocolate-brown/70 mt-1">
                    You save ${(special.originalPrice - special.specialPrice).toFixed(2)}!
                  </p>
                </div>

                {/* Time Remaining */}
                <Chip 
                  color="warning" 
                  size="sm" 
                  variant="flat"
                  className="mb-4"
                >
                  ⏰ {special.timeLeft}
                </Chip>
              </CardHeader>
              
              <CardBody className="px-6 pb-6">
                {/* Quantity Tracker */}
                {special.limitedQuantity && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-chocolate-brown">
                        Limited Quantity
                      </span>
                      <span className="text-sm text-chocolate-brown/70">
                        {special.limitedQuantity - (special.soldCount || 0)} left
                      </span>
                    </div>
                    <Progress 
                      value={((special.soldCount || 0) / special.limitedQuantity) * 100}
                      color="warning"
                      className="mb-2"
                    />
                    <p className="text-xs text-chocolate-brown/60 text-center">
                      {special.soldCount || 0} of {special.limitedQuantity} sold
                    </p>
                  </div>
                )}
                
                <Button
                  size="lg"
                  className="w-full bg-golden-orange hover:bg-deep-amber text-chocolate-brown font-bold text-lg mb-3"
                >
                  🛒 Add Special to Cart
                </Button>

                <Button
                  as={NextLink}
                  href={`/?category=${special.category}`}
                  size="md"
                  variant="bordered"
                  className="w-full border-golden-orange text-chocolate-brown hover:bg-golden-orange/10 font-semibold"
                >
                  View Similar Items
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Additional Offers */}
        <div className="mt-12">
          <h2 className="text-3xl font-bold text-chocolate-brown mb-6 text-center">
            🎁 Additional Offers
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Loyalty Program */}
            <Card className="bg-gradient-to-br from-mint-green/20 to-mint-green/10 border-2 border-mint-green/30">
              <CardBody className="p-6 text-center">
                <div className="text-4xl mb-3">🏆</div>
                <h3 className="text-xl font-bold text-chocolate-brown mb-2">
                  Loyalty Rewards
                </h3>
                <p className="text-chocolate-brown/70 mb-4">
                  Earn points with every purchase! Get a free pastry after 10 visits.
                </p>
                <Button 
                  size="md"
                  className="bg-mint-green text-chocolate-brown font-bold"
                >
                  Learn More
                </Button>
              </CardBody>
            </Card>

            {/* Happy Hour */}
            <Card className="bg-gradient-to-br from-caramel-beige/30 to-caramel-beige/10 border-2 border-caramel-beige">
              <CardBody className="p-6 text-center">
                <div className="text-4xl mb-3">🕐</div>
                <h3 className="text-xl font-bold text-chocolate-brown mb-2">
                  Happy Hour Special
                </h3>
                <p className="text-chocolate-brown/70 mb-4">
                  50% off all beverages between 2-4 PM on weekdays!
                </p>
                <Button 
                  size="md"
                  variant="bordered"
                  className="border-caramel-beige text-chocolate-brown font-bold"
                >
                  Set Reminder
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              as={NextLink}
              href="/"
              size="lg"
              className="bg-deep-amber hover:bg-chocolate-brown text-cream-white font-bold px-8"
            >
              🏠 Back to Menu
            </Button>
            <Button
              as={NextLink}
              href="/categories"
              size="lg"
              variant="bordered"
              className="border-golden-orange text-chocolate-brown hover:bg-golden-orange/10 font-bold px-8"
            >
              📋 Browse Categories
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}