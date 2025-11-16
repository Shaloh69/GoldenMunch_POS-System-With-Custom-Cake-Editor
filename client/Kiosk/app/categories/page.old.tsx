import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import NextLink from 'next/link';

interface Category {
  id: string;
  name: string;
  emoji: string;
  description: string;
  itemCount: number;
  featured: boolean;
  color: string;
}

const categories: Category[] = [
  {
    id: "cakes",
    name: "Cakes & Cupcakes",
    emoji: "🍰",
    description: "Decadent cakes and cupcakes made fresh daily with premium ingredients",
    itemCount: 12,
    featured: true,
    color: "golden-orange"
  },
  {
    id: "pastries",
    name: "Pastries & Breads",
    emoji: "🥐",
    description: "Flaky croissants, danish, and artisan breads baked every morning",
    itemCount: 18,
    featured: true,
    color: "deep-amber"
  },
  {
    id: "cookies",
    name: "Cookies & Sweets",
    emoji: "🍪",
    description: "Warm cookies, brownies, and sweet treats that melt in your mouth",
    itemCount: 15,
    featured: false,
    color: "caramel-beige"
  },
  {
    id: "beverages",
    name: "Hot & Cold Drinks",
    emoji: "☕",
    description: "Premium coffee, tea, smoothies, and refreshing cold beverages",
    itemCount: 20,
    featured: true,
    color: "mint-green"
  },
  {
    id: "sandwiches",
    name: "Sandwiches & Wraps",
    emoji: "🥪",
    description: "Fresh sandwiches, wraps, and light meals made to order",
    itemCount: 10,
    featured: false,
    color: "chocolate-brown"
  },
  {
    id: "specials",
    name: "Daily Specials",
    emoji: "⭐",
    description: "Today's featured items and seasonal specialties",
    itemCount: 6,
    featured: true,
    color: "golden-orange"
  }
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-white to-caramel-beige">
      {/* Header */}
      <div className="bg-gradient-to-r from-golden-orange to-deep-amber text-chocolate-brown p-8 shadow-lg">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-2">Browse Our Categories 📋</h1>
          <p className="text-xl opacity-90">Choose a category to explore our delicious offerings</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Featured Categories */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-chocolate-brown mb-6 text-center">
            🌟 Featured Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.filter(cat => cat.featured).map((category) => (
              <Card 
                key={category.id}
                className="hover:scale-105 transition-all duration-300 shadow-xl border-2 border-golden-orange/30 hover:border-golden-orange bg-cream-white cursor-pointer"
                isPressable
              >
                <CardHeader className="flex flex-col items-center px-6 pt-8 pb-4">
                  <div className="text-8xl mb-4 animate-float">{category.emoji}</div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-bold text-chocolate-brown text-center">
                      {category.name}
                    </h3>
                    <Chip color="warning" size="sm" variant="flat">
                      Featured
                    </Chip>
                  </div>
                  <Chip 
                    color="success" 
                    size="sm" 
                    variant="bordered"
                    className="mb-4"
                  >
                    {category.itemCount} items
                  </Chip>
                </CardHeader>
                
                <CardBody className="px-6 pb-6">
                  <p className="text-chocolate-brown/70 text-center mb-6">
                    {category.description}
                  </p>
                  
                  <Button
                    as={NextLink}
                    href={`/?category=${category.id}`}
                    size="lg"
                    className="w-full bg-golden-orange hover:bg-deep-amber text-chocolate-brown font-bold text-lg"
                  >
                    Explore {category.name}
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

        {/* All Categories */}
        <div>
          <h2 className="text-3xl font-bold text-chocolate-brown mb-6 text-center">
            🍽️ All Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Card 
                key={category.id}
                className="hover:scale-105 transition-all duration-300 shadow-lg border border-golden-orange/20 hover:border-golden-orange bg-cream-white cursor-pointer"
                isPressable
              >
                <CardHeader className="flex flex-col items-center px-4 pt-6 pb-2">
                  <div className="text-6xl mb-3">{category.emoji}</div>
                  <h3 className="text-lg font-bold text-chocolate-brown text-center mb-2">
                    {category.name}
                  </h3>
                  <Chip 
                    color="default" 
                    size="sm" 
                    variant="flat"
                    className="text-xs"
                  >
                    {category.itemCount} items
                  </Chip>
                </CardHeader>
                
                <CardBody className="px-4 pb-4">
                  <p className="text-chocolate-brown/60 text-sm text-center mb-4">
                    {category.description}
                  </p>
                  
                  <Button
                    as={NextLink}
                    href={`/?category=${category.id}`}
                    size="md"
                    variant="bordered"
                    className="w-full border-golden-orange text-chocolate-brown hover:bg-golden-orange/10 font-semibold"
                  >
                    View Items
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-bold text-chocolate-brown mb-6">
            Quick Navigation
          </h3>
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
              href="/specials"
              size="lg"
              variant="bordered"
              className="border-golden-orange text-chocolate-brown hover:bg-golden-orange/10 font-bold px-8"
            >
              ⭐ Today's Specials
            </Button>
            <Button
              as={NextLink}
              href="/cart"
              size="lg"
              variant="bordered"
              className="border-mint-green text-chocolate-brown hover:bg-mint-green/10 font-bold px-8"
            >
              🛒 View Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}