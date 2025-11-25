"use client";

import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { Input } from '@heroui/input';
import { useCart } from '@/contexts/CartContext';
import { MenuService } from '@/services/menu.service';
import type { MenuItem, Category } from '@/types/api';
import ImageLightbox from '@/components/ImageLightbox';
import Image from 'next/image';

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem, items: cartItems } = useCart();

  // Fetch menu items and categories
  useEffect(() => {
    console.log('🎬 MENU PAGE: Component mounted, initializing data fetch');
    console.log('Timestamp:', new Date().toISOString());

    const fetchData = async () => {
      console.log('🔄 MENU PAGE: Starting initial data fetch...');
      setLoading(true);
      setError(null);

      try {
        const [items, cats] = await Promise.all([
          MenuService.getMenuItems(),
          MenuService.getCategories()
        ]);

        console.log('✅ MENU PAGE: Initial data loaded successfully', {
          itemCount: items.length,
          categoryCount: cats.length,
          timestamp: new Date().toISOString(),
        });

        setMenuItems(items);
        setCategories(cats);
        setFilteredItems(items);
      } catch (err: any) {
        console.error('❌ MENU PAGE: Error fetching data:', err);
        setError(err.message || 'Failed to load menu. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // ✅ FIX: Auto-refresh menu every 30 seconds to get latest items from admin
    console.log('⏰ MENU PAGE: Setting up auto-refresh interval (30s)');
    const refreshInterval = setInterval(() => {
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║  🔄 AUTO-REFRESH TRIGGERED (30s interval)             ║');
      console.log('║  Timestamp:', new Date().toISOString().padEnd(30), '║');
      console.log('╚════════════════════════════════════════════════════════╝');

      MenuService.getMenuItems().then(items => {
        const previousCount = menuItems.length;
        setMenuItems(items);
        console.log('✅ Menu refreshed successfully:', {
          previousCount,
          newCount: items.length,
          difference: items.length - previousCount,
          timestamp: new Date().toISOString(),
        });

        // Log any new or removed items
        if (items.length !== previousCount) {
          console.log('⚠️ MENU CHANGED - Items count changed from', previousCount, 'to', items.length);
        }
      }).catch(err => {
        console.error('❌ Auto-refresh failed:', err);
      });

      MenuService.getCategories().then(cats => {
        const previousCatCount = categories.length;
        setCategories(cats);
        console.log('✅ Categories refreshed:', {
          previousCount: previousCatCount,
          newCount: cats.length,
          timestamp: new Date().toISOString(),
        });
      }).catch(err => {
        console.error('❌ Category refresh failed:', err);
      });
    }, 30000); // Refresh every 30 seconds

    // Cleanup interval on unmount
    return () => {
      console.log('🛑 MENU PAGE: Component unmounting, clearing refresh interval');
      clearInterval(refreshInterval);
    };
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-scale-in card-transparent p-12 rounded-3xl">
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
            🍰 Loading Delicious Menu...
          </p>
          <p className="text-lg text-chocolate-brown/70 mt-3 mb-4">
            Preparing something amazing for you
          </p>
          <div className="text-sm text-chocolate-brown/60 space-y-1">
            <p>✨ Fetching fresh treats</p>
            <p>🎂 Loading bakery specials</p>
            <p>☕ Preparing beverage options</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md card-transparent animate-scale-in">
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
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="header-glass p-8 shadow-xl mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6 animate-slide-right">
            <div className="text-7xl animate-float">🍰</div>
            <div>
              <h1 className="text-5xl font-bold text-white drop-shadow-lg">
                Golden Munch
              </h1>
              <p className="text-xl text-white/90">Fresh. Delicious. Made with Love.</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl animate-slide-left">
            <Input
              placeholder="Search for delicious treats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="lg"
              startContent={<span className="text-2xl">🔍</span>}
              classNames={{
                input: "text-lg",
                inputWrapper: "bg-white shadow-xl border-2 border-white/50 hover:border-white transition-colors"
              }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-8">
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
          <Card className="card-transparent animate-scale-in">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item, index) => {
                const cartQty = getCartQuantity(item.menu_item_id);
                const isAvailable = item.status === 'available' &&
                  (item.is_infinite_stock || item.stock_quantity > 0);

                return (
                  <Card
                    key={item.menu_item_id}
                    className={`
                      card-transparent
                      ${isAvailable ? '' : 'opacity-60'}
                      animate-slide-up
                    `}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <CardHeader className="flex-col items-start p-0 relative">
                      <ImageLightbox
                        src={item.image_url}
                        alt={item.name}
                        className="w-full"
                      >
                        <div className="w-full h-48 bg-gradient-to-br from-golden-orange/20 to-deep-amber/20 flex items-center justify-center relative overflow-hidden group">
                          {item.image_url ? (
                            <div className="relative w-full h-full">
                              <Image
                                src={item.image_url}
                                alt={item.name}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <span className="text-white text-4xl opacity-0 group-hover:opacity-100 transition-opacity">
                                  🔍
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-8xl animate-float">
                              {getItemEmoji(item.item_type)}
                            </div>
                          )}

                          {/* Badges */}
                          <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
                            {item.is_featured && (
                              <Chip
                                color="warning"
                                size="sm"
                                variant="shadow"
                                className="font-bold animate-pulse-slow"
                              >
                                🔥 Popular
                              </Chip>
                            )}
                            {!isAvailable && (
                              <Chip color="danger" size="sm" variant="shadow" className="font-bold">
                                Sold Out
                              </Chip>
                            )}
                            {cartQty > 0 && (
                              <Chip
                                color="success"
                                size="sm"
                                variant="shadow"
                                className="font-bold animate-bounce-slow"
                              >
                                {cartQty} in cart
                              </Chip>
                            )}
                          </div>
                        </div>
                      </ImageLightbox>
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
    </div>
  );
}
