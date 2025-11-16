"use client";

import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { Badge } from '@heroui/badge';
import { useCart } from '@/contexts/CartContext';
import { MenuService } from '@/services/menu.service';
import type { MenuItem, Category } from '@/types/api';
import NextLink from 'next/link';

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
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

  // Filter items by category
  useEffect(() => {
    if (selectedCategory === null) {
      setFilteredItems(menuItems);
    } else {
      // Note: We'd need to query the category_has_menu_item table
      // For now, filter by item_type matching category name
      setFilteredItems(menuItems);
    }
  }, [menuItems, selectedCategory]);

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
      <div className="min-h-screen bg-gradient-to-br from-cream-white to-caramel-beige flex items-center justify-center">
        <div className="text-center">
          <Spinner
            size="lg"
            color="warning"
            classNames={{
              wrapper: "w-20 h-20"
            }}
          />
          <p className="text-2xl text-chocolate-brown mt-4 font-semibold">
            Loading delicious menu...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-white to-caramel-beige flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="text-8xl mb-6">⚠️</div>
          <h1 className="text-4xl font-bold text-chocolate-brown mb-4">
            Oops! Something went wrong
          </h1>
          <p className="text-xl text-chocolate-brown/70 mb-8">
            {error}
          </p>
          <Button
            size="lg"
            className="bg-golden-orange hover:bg-deep-amber text-chocolate-brown font-bold text-xl px-8"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-white to-caramel-beige">
      {/* Header */}
      <div className="bg-golden-orange text-chocolate-brown p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">🍰 Golden Munch</h1>
            <p className="text-lg opacity-80">Fresh. Delicious. Made with Love.</p>
          </div>

          {/* Cart Summary */}
          {getItemCount() > 0 && (
            <Badge content={getItemCount()} color="danger" size="lg">
              <Button
                as={NextLink}
                href="/cart"
                size="lg"
                className="bg-deep-amber hover:bg-chocolate-brown text-cream-white font-bold text-xl px-8"
              >
                🛒 Cart - ${getTotal().toFixed(2)}
              </Button>
            </Badge>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-chocolate-brown mb-4">Categories</h2>
            <div className="flex flex-wrap gap-3">
              <Button
                key="all"
                size="lg"
                variant={selectedCategory === null ? "solid" : "bordered"}
                className={`
                  ${selectedCategory === null
                    ? 'bg-golden-orange text-chocolate-brown border-golden-orange'
                    : 'border-golden-orange text-chocolate-brown hover:bg-golden-orange/10'
                  }
                  font-semibold text-lg px-6 py-3
                `}
                onClick={() => setSelectedCategory(null)}
              >
                🍽️ All Items
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.category_id}
                  size="lg"
                  variant={selectedCategory === category.category_id ? "solid" : "bordered"}
                  className={`
                    ${selectedCategory === category.category_id
                      ? 'bg-golden-orange text-chocolate-brown border-golden-orange'
                      : 'border-golden-orange text-chocolate-brown hover:bg-golden-orange/10'
                    }
                    font-semibold text-lg px-6 py-3
                  `}
                  onClick={() => setSelectedCategory(category.category_id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-8xl mb-4">🍽️</div>
            <h3 className="text-3xl font-bold text-chocolate-brown mb-2">
              No items available
            </h3>
            <p className="text-xl text-chocolate-brown/70">
              {selectedCategory === null
                ? "Our menu is being updated. Please check back soon!"
                : "No items in this category right now."
              }
            </p>
            {selectedCategory !== null && (
              <Button
                size="lg"
                className="mt-6 bg-golden-orange text-chocolate-brown font-bold"
                onClick={() => setSelectedCategory(null)}
              >
                View All Categories
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => {
              const cartQty = getCartQuantity(item.menu_item_id);
              const isAvailable = item.status === 'available' &&
                (item.is_infinite_stock || item.stock_quantity > 0);

              return (
                <Card
                  key={item.menu_item_id}
                  className={`
                    ${isAvailable ? 'hover:scale-105' : 'opacity-60'}
                    transition-all duration-300 shadow-lg border-2 border-golden-orange/20
                    ${isAvailable ? 'hover:shadow-2xl hover:border-golden-orange' : ''}
                  `}
                >
                  <CardHeader className="flex flex-col items-start px-6 pt-6 pb-0">
                    <div className="flex justify-between items-start w-full">
                      <div className="text-6xl mb-2">
                        {item.image_url || getItemEmoji(item.item_type)}
                      </div>
                      <div className="flex flex-col gap-1">
                        {item.is_featured && (
                          <Chip color="warning" size="sm" variant="flat">
                            🔥 Popular
                          </Chip>
                        )}
                        {!isAvailable && (
                          <Chip color="danger" size="sm" variant="flat">
                            Sold Out
                          </Chip>
                        )}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-chocolate-brown">{item.name}</h3>
                    <p className="text-chocolate-brown/70 text-sm">{item.description}</p>
                  </CardHeader>

                  <CardBody className="px-6 pt-2">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-2xl font-bold text-deep-amber">
                        ${(item.current_price || 0).toFixed(2)}
                      </span>
                      {cartQty > 0 && (
                        <Badge content={cartQty} color="success" size="lg">
                          <div className="w-8 h-8 rounded-full bg-golden-orange"></div>
                        </Badge>
                      )}
                    </div>

                    {isAvailable ? (
                      <Button
                        size="md"
                        className="w-full bg-golden-orange hover:bg-deep-amber text-chocolate-brown font-bold"
                        onClick={() => handleAddToCart(item)}
                      >
                        {cartQty > 0 ? `Add Another (${cartQty} in cart)` : '🛒 Add to Cart'}
                      </Button>
                    ) : (
                      <Button
                        disabled
                        className="w-full bg-gray-300 text-gray-500"
                      >
                        Currently Unavailable
                      </Button>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}

        {/* Floating Cart Button */}
        {getItemCount() > 0 && (
          <div className="fixed bottom-6 right-6 z-50">
            <Badge content={getItemCount()} color="danger" size="lg">
              <Button
                as={NextLink}
                href="/cart"
                size="lg"
                className="bg-deep-amber hover:bg-chocolate-brown text-cream-white font-bold text-xl px-8 py-4 rounded-full shadow-2xl animate-bounce-slow"
              >
                🛒 Checkout - ${getTotal().toFixed(2)}
              </Button>
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
