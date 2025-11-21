"use client";

import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader, CardFooter } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { Badge } from '@heroui/badge';
import { Input } from '@heroui/input';
import { useCart } from '@/contexts/CartContext';
import { MenuService } from '@/services/menu.service';
import type { MenuItem, Category } from '@/types/api';
import NextLink from 'next/link';

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem, items: cartItems, getItemCount, getTotal } = useCart();

  // Fetch menu items and categories
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [items, cats] = await Promise.all([
          MenuService.getMenuItems(),
          MenuService.getCategories()
        ]);

        setMenuItems(items);
        setCategories(cats);
        setFilteredItems(items);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load menu. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter items by category and search
  useEffect(() => {
    let filtered = menuItems;

    if (selectedCategory !== null) {
      // Filter by category (would need proper category mapping)
      filtered = menuItems;
    }

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  }, [menuItems, selectedCategory, searchQuery]);

  const handleAddToCart = (item: MenuItem) => {
    addItem({
      menuItem: item,
      quantity: 1,
    });
  };

  const getCartQuantity = (itemId: number): number => {
    const cartItem = cartItems.find(item => item.menuItem.menu_item_id === itemId);
    return cartItem?.quantity || 0;
  };

  const getItemEmoji = (itemType: string): string => {
    const emojiMap: Record<string, string> = {
      cake: '🍰',
      pastry: '🥐',
      beverage: '☕',
      snack: '🍪',
      main_dish: '🍽️',
      appetizer: '🥗',
      dessert: '🍨',
      bread: '🍞',
      other: '🍴'
    };
    return emojiMap[itemType] || '🍴';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh-gradient flex items-center justify-center">
        <div className="text-center animate-scale-in">
          <div className="relative">
            <Spinner
              size="lg"
              color="warning"
              classNames={{
                wrapper: "w-24 h-24"
              }}
            />
            <div className="absolute inset-0 animate-ping opacity-20">
              <div className="w-24 h-24 rounded-full bg-golden-orange/30"></div>
            </div>
          </div>
          <p className="text-3xl text-chocolate-brown mt-6 font-bold">
            Loading delicious menu...
          </p>
          <p className="text-lg text-chocolate-brown/60 mt-2">
            Preparing something amazing for you
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-mesh-gradient flex items-center justify-center p-6">
        <Card className="max-w-md card-modern animate-scale-in">
          <CardBody className="text-center p-8">
            <div className="text-8xl mb-6 animate-bounce-slow">⚠️</div>
            <h1 className="text-4xl font-bold text-chocolate-brown mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-xl text-chocolate-brown/70 mb-8">
              {error}
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-golden-orange to-deep-amber text-white font-bold text-xl px-8 shadow-xl-golden"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh-gradient">
      {/* Modern Header with Glassmorphism */}
      <div className="sticky top-0 z-40 bg-glass border-b border-golden-orange/20 shadow-lg backdrop-blur-lg">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-6xl animate-float">🍰</div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
                  Golden Munch
                </h1>
                <p className="text-lg text-chocolate-brown/70">Fresh. Delicious. Made with Love.</p>
              </div>
            </div>

            {/* Cart Button */}
            {getItemCount() > 0 && (
              <Badge content={getItemCount()} color="danger" size="lg" placement="top-right" className="animate-scale-in">
                <Button
                  as={NextLink}
                  href="/cart"
                  size="lg"
                  className="bg-gradient-to-r from-golden-orange to-deep-amber text-white font-bold text-xl px-8 shadow-xl-golden hover:scale-105 transition-transform"
                >
                  🛒 ${getTotal().toFixed(2)}
                </Button>
              </Badge>
            )}
          </div>

          {/* Search Bar */}
          <div className="max-w-xl">
            <Input
              placeholder="Search for delicious treats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="lg"
              startContent={<span className="text-2xl">🔍</span>}
              classNames={{
                input: "text-lg",
                inputWrapper: "bg-white shadow-lg border-2 border-golden-orange/20 hover:border-golden-orange/40 transition-colors"
              }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Category Pills with Modern Design */}
        {categories.length > 0 && (
          <div className="animate-slide-right">
            <h2 className="text-2xl font-bold text-chocolate-brown mb-4 flex items-center gap-2">
              <span className="text-3xl">📂</span>
              Categories
            </h2>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                variant={selectedCategory === null ? "solid" : "bordered"}
                className={`
                  ${selectedCategory === null
                    ? 'bg-gradient-to-r from-golden-orange to-deep-amber text-white shadow-xl-golden scale-105'
                    : 'bg-white border-2 border-golden-orange/30 text-chocolate-brown hover:border-golden-orange hover:shadow-lg'
                  }
                  font-semibold text-lg px-6 py-3 rounded-full transition-all duration-300
                `}
                onClick={() => setSelectedCategory(null)}
              >
                ✨ All Items
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.category_id}
                  size="lg"
                  variant={selectedCategory === category.category_id ? "solid" : "bordered"}
                  className={`
                    ${selectedCategory === category.category_id
                      ? 'bg-gradient-to-r from-golden-orange to-deep-amber text-white shadow-xl-golden scale-105'
                      : 'bg-white border-2 border-golden-orange/30 text-chocolate-brown hover:border-golden-orange hover:shadow-lg'
                    }
                    font-semibold text-lg px-6 py-3 rounded-full transition-all duration-300
                  `}
                  onClick={() => setSelectedCategory(category.category_id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items Grid with Staggered Animation */}
        {filteredItems.length === 0 ? (
          <Card className="card-modern animate-scale-in">
            <CardBody className="text-center py-16">
              <div className="text-9xl mb-6 animate-float">🍽️</div>
              <h3 className="text-4xl font-bold text-chocolate-brown mb-4">
                No items found
              </h3>
              <p className="text-xl text-chocolate-brown/70 mb-6">
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : "No items in this category right now."
                }
              </p>
              {(searchQuery || selectedCategory !== null) && (
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-golden-orange to-deep-amber text-white font-bold px-8 shadow-xl"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardBody>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-chocolate-brown flex items-center gap-2">
                <span className="text-3xl">🍴</span>
                {filteredItems.length} Delicious Items
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item, index) => {
                const cartQty = getCartQuantity(item.menu_item_id);
                const isAvailable = item.status === 'available' &&
                  (item.is_infinite_stock || item.stock_quantity > 0);

                return (
                  <Card
                    key={item.menu_item_id}
                    className={`
                      card-modern
                      ${isAvailable ? 'hover:cursor-pointer' : 'opacity-60'}
                      animate-slide-up
                    `}
                    style={{ animationDelay: `${index * 0.05}s` }}
                    isPressable={isAvailable}
                  >
                    <CardHeader className="flex-col items-start p-0 relative">
                      {/* Image Container with Gradient Overlay */}
                      <div className="w-full h-48 bg-gradient-to-br from-golden-orange/20 to-deep-amber/20 flex items-center justify-center relative overflow-hidden">
                        <div className="text-8xl animate-float">
                          {item.image_url || getItemEmoji(item.item_type)}
                        </div>

                        {/* Badges */}
                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                          {item.is_featured && (
                            <Chip
                              color="warning"
                              size="md"
                              variant="shadow"
                              className="font-bold animate-pulse-slow"
                            >
                              🔥 Popular
                            </Chip>
                          )}
                          {!isAvailable && (
                            <Chip color="danger" size="md" variant="shadow" className="font-bold">
                              Sold Out
                            </Chip>
                          )}
                          {cartQty > 0 && (
                            <Chip
                              color="success"
                              size="md"
                              variant="shadow"
                              className="font-bold animate-bounce-slow"
                            >
                              {cartQty} in cart
                            </Chip>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardBody className="px-5 py-4">
                      <div className="mb-3">
                        <h3 className="text-xl font-bold text-chocolate-brown mb-1 line-clamp-1">
                          {item.name}
                        </h3>
                        <p className="text-sm text-chocolate-brown/60 line-clamp-2 min-h-[40px]">
                          {item.description || 'Delicious treat made fresh daily'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-3xl font-bold bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
                            ${(Number(item.current_price) || 0).toFixed(2)}
                          </span>
                        </div>
                        <Chip size="sm" variant="flat" color="default">
                          {item.item_type}
                        </Chip>
                      </div>

                      {isAvailable ? (
                        <Button
                          size="lg"
                          className="w-full bg-gradient-to-r from-golden-orange to-deep-amber text-white font-bold shadow-lg hover:shadow-xl-golden hover:scale-105 transition-all"
                          onClick={() => handleAddToCart(item)}
                        >
                          {cartQty > 0 ? (
                            <>🛒 Add Another</>
                          ) : (
                            <>+ Add to Cart</>
                          )}
                        </Button>
                      ) : (
                        <Button
                          disabled
                          size="lg"
                          className="w-full bg-gray-200 text-gray-500 font-semibold"
                        >
                          Currently Unavailable
                        </Button>
                      )}
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Floating Cart Button for Mobile */}
      {getItemCount() > 0 && (
        <div className="fixed bottom-8 right-8 z-50 lg:hidden animate-scale-in">
          <Badge content={getItemCount()} color="danger" size="lg" placement="top-left">
            <Button
              as={NextLink}
              href="/cart"
              isIconOnly
              className="w-16 h-16 bg-gradient-to-r from-golden-orange to-deep-amber text-white text-2xl rounded-full shadow-2xl animate-glow"
            >
              🛒
            </Button>
          </Badge>
        </div>
      )}

      {/* Spacer for bottom navigation */}
      <div className="h-24"></div>
    </div>
  );
}
