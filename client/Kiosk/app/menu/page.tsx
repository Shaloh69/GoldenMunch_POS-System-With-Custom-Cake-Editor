"use client";

import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody } from '@heroui/card';
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
        setError(err.message || 'Failed to load menu. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      MenuService.getMenuItems().then(items => {
        setMenuItems(items);
      }).catch(err => {
        console.error('Auto-refresh failed:', err);
      });

      MenuService.getCategories().then(cats => {
        setCategories(cats);
      }).catch(err => {
        console.error('Category refresh failed:', err);
      });
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  // Filter items by category and search
  useEffect(() => {
    let filtered = menuItems;

    if (selectedCategory !== null) {
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
        <div className="text-center">
          <Spinner
            size="lg"
            classNames={{
              wrapper: "w-32 h-32",
              circle1: "border-b-[#D9B38C]",
              circle2: "border-b-[#C67B57]"
            }}
          />
          <p className="text-4xl font-bold text-[#C67B57] mt-8">
            Loading Menu...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-2xl bg-[#FFF9F2]/90 backdrop-blur-lg border-2 border-[#D9B38C]">
          <CardBody className="text-center p-12">
            <div className="text-9xl mb-8">⚠️</div>
            <h1 className="text-5xl font-bold text-[#C67B57] mb-6">
              Something went wrong
            </h1>
            <p className="text-2xl text-[#C9B8A5] mb-10">
              {error}
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#D9B38C] to-[#C67B57] text-white font-bold text-2xl px-12 py-8 shadow-lg hover:shadow-xl transition-all"
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
    <div className="min-h-screen pb-48">
      {/* Elegant Header */}
      <div className="glass-header sticky top-0 z-40 py-8 px-12 mb-8">
        <div className="max-w-[1800px] mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-7xl font-bold text-[#C67B57] mb-3 tracking-tight">
              Golden Munch
            </h1>
            <p className="text-3xl text-[#C9B8A5] font-light">
              Fresh. Delicious. Made with Love.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <Input
              placeholder="Search for delicious treats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="lg"
              startContent={<span className="text-3xl">🔍</span>}
              classNames={{
                input: "text-2xl py-4",
                inputWrapper: "bg-white/90 backdrop-blur-md shadow-lg border-2 border-[#D9B38C]/30 hover:border-[#D9B38C] transition-all h-20"
              }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-12">
        {/* Categories */}
        {categories.length > 0 && (
          <div className="mb-10">
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                size="lg"
                className={`
                  ${selectedCategory === null
                    ? 'bg-gradient-to-r from-[#D9B38C] to-[#C67B57] text-white shadow-lg scale-105'
                    : 'bg-white/80 backdrop-blur-sm border-2 border-[#D9B38C]/30 text-[#C67B57] hover:border-[#D9B38C]'
                  }
                  font-semibold text-xl px-10 py-7 rounded-2xl transition-all duration-300
                `}
                onClick={() => setSelectedCategory(null)}
              >
                All Items
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.category_id}
                  size="lg"
                  className={`
                    ${selectedCategory === category.category_id
                      ? 'bg-gradient-to-r from-[#D9B38C] to-[#C67B57] text-white shadow-lg scale-105'
                      : 'bg-white/80 backdrop-blur-sm border-2 border-[#D9B38C]/30 text-[#C67B57] hover:border-[#D9B38C]'
                    }
                    font-semibold text-xl px-10 py-7 rounded-2xl transition-all duration-300
                  `}
                  onClick={() => setSelectedCategory(category.category_id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items - 4 Per Row */}
        {filteredItems.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-lg border-2 border-[#D9B38C]/30">
            <CardBody className="text-center py-24">
              <div className="text-[120px] mb-8">🍽️</div>
              <h3 className="text-5xl font-bold text-[#C67B57] mb-6">
                No items found
              </h3>
              <p className="text-2xl text-[#C9B8A5] mb-10">
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : "No items available right now."
                }
              </p>
              {(searchQuery || selectedCategory !== null) && (
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#D9B38C] to-[#C67B57] text-white font-bold text-2xl px-12 py-8"
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
            <div className="mb-8 text-center">
              <h2 className="text-4xl font-bold text-[#C67B57]">
                {filteredItems.length} Delicious {filteredItems.length === 1 ? 'Item' : 'Items'}
              </h2>
            </div>

            {/* 4 Column Grid for 24-inch Display */}
            <div className="grid grid-cols-4 gap-8">
              {filteredItems.map((item, index) => {
                const cartQty = getCartQuantity(item.menu_item_id);
                const isAvailable = item.status === 'available' &&
                  (item.is_infinite_stock || item.stock_quantity > 0);

                return (
                  <Card
                    key={item.menu_item_id}
                    className={`
                      bg-white/85 backdrop-blur-lg border-2 border-[#D9B38C]/30
                      ${isAvailable ? 'hover:border-[#C67B57] hover:shadow-2xl hover:scale-105' : 'opacity-60'}
                      transition-all duration-300
                    `}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Image */}
                    <div className="relative">
                      <ImageLightbox
                        src={item.image_url}
                        alt={item.name}
                        className="w-full"
                      >
                        <div className="w-full h-64 bg-gradient-to-br from-[#E8DCC8] to-[#D9B38C]/30 flex items-center justify-center relative overflow-hidden group">
                          {item.image_url ? (
                            <div className="relative w-full h-full">
                              <Image
                                src={item.image_url}
                                alt={item.name}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                sizes="(max-width: 1920px) 25vw"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            </div>
                          ) : (
                            <div className="text-9xl">
                              {getItemEmoji(item.item_type)}
                            </div>
                          )}

                          {/* Badges */}
                          <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                            {item.is_featured && (
                              <Chip
                                size="lg"
                                className="bg-[#C67B57] text-white font-bold text-base px-4 py-2"
                              >
                                Popular
                              </Chip>
                            )}
                            {!isAvailable && (
                              <Chip
                                size="lg"
                                className="bg-red-500 text-white font-bold text-base px-4 py-2"
                              >
                                Sold Out
                              </Chip>
                            )}
                            {cartQty > 0 && (
                              <Chip
                                size="lg"
                                className="bg-green-500 text-white font-bold text-base px-4 py-2"
                              >
                                {cartQty} in cart
                              </Chip>
                            )}
                          </div>
                        </div>
                      </ImageLightbox>
                    </div>

                    <CardBody className="p-6">
                      {/* Item Name */}
                      <h3 className="text-2xl font-bold text-[#C67B57] mb-2 line-clamp-1">
                        {item.name}
                      </h3>

                      {/* Description */}
                      <p className="text-base text-[#C9B8A5] line-clamp-2 mb-4 h-12">
                        {item.description || 'Delicious treat made fresh daily'}
                      </p>

                      {/* Price & Type */}
                      <div className="flex items-center justify-between mb-5">
                        <span className="text-4xl font-bold text-[#C67B57]">
                          ${(Number(item.current_price) || 0).toFixed(2)}
                        </span>
                        <Chip
                          size="md"
                          className="bg-[#E8DCC8] text-[#C67B57] font-semibold"
                        >
                          {item.item_type}
                        </Chip>
                      </div>

                      {/* Add to Cart Button */}
                      {isAvailable ? (
                        <Button
                          size="lg"
                          className="w-full bg-gradient-to-r from-[#D9B38C] to-[#C67B57] text-white font-bold text-xl py-7 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                          onClick={() => handleAddToCart(item)}
                        >
                          {cartQty > 0 ? 'Add Another' : 'Add to Cart'}
                        </Button>
                      ) : (
                        <Button
                          disabled
                          size="lg"
                          className="w-full bg-gray-300 text-gray-500 font-semibold text-xl py-7"
                        >
                          Unavailable
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
