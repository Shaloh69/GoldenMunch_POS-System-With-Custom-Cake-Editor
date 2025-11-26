"use client";

import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { useCart } from '@/contexts/CartContext';
import { MenuService } from '@/services/menu.service';
import type { MenuItem, Category } from '@/types/api';
import NextLink from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/utils/imageUtils';

export default function HomePage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem, items: cartItems, getItemCount, getTotal } = useCart();

  // Fetch menu items and categories
  useEffect(() => {
    console.log('🎬 HOME PAGE: Component mounted, initializing data fetch');
    console.log('Timestamp:', new Date().toISOString());

    const fetchData = async () => {
      console.log('🔄 HOME PAGE: Starting initial data fetch...');
      setLoading(true);
      setError(null);

      try {
        const [items, cats] = await Promise.all([
          MenuService.getMenuItems(),
          MenuService.getCategories()
        ]);

        console.log('✅ HOME PAGE: Initial data loaded successfully', {
          itemCount: items.length,
          categoryCount: cats.length,
          timestamp: new Date().toISOString(),
        });

        setMenuItems(items);
        setCategories(cats);
        setFilteredItems(items);
      } catch (err: any) {
        console.error('❌ HOME PAGE: Error fetching data:', err);
        setError(err.message || 'Failed to load menu. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // ✅ Auto-refresh menu every 30 seconds to get latest items from admin
    console.log('⏰ HOME PAGE: Setting up auto-refresh interval (30s)');
    const refreshInterval = setInterval(() => {
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║  🔄 AUTO-REFRESH TRIGGERED (HOME PAGE - 30s)          ║');
      console.log('║  Timestamp:', new Date().toISOString().padEnd(30), '║');
      console.log('╚════════════════════════════════════════════════════════╝');

      MenuService.getMenuItems().then(items => {
        const previousCount = menuItems.length;
        setMenuItems(items);
        console.log('✅ Home page menu refreshed successfully:', {
          previousCount,
          newCount: items.length,
          difference: items.length - previousCount,
          timestamp: new Date().toISOString(),
        });

        if (items.length !== previousCount) {
          console.log('⚠️ MENU CHANGED - Items count changed from', previousCount, 'to', items.length);
        }
      }).catch(err => {
        console.error('❌ Auto-refresh failed:', err);
      });

      MenuService.getCategories().then(cats => {
        const previousCatCount = categories.length;
        setCategories(cats);
        console.log('✅ Home page categories refreshed:', {
          previousCount: previousCatCount,
          newCount: cats.length,
          timestamp: new Date().toISOString(),
        });
      }).catch(err => {
        console.error('❌ Category refresh failed:', err);
      });
    }, 30000); // Refresh every 30 seconds

    return () => {
      console.log('🛑 HOME PAGE: Component unmounting, clearing refresh interval');
      clearInterval(refreshInterval);
    };
  }, []);

  // Filter items by category
  useEffect(() => {
    let filtered = menuItems;

    if (selectedCategory !== null) {
      filtered = menuItems.filter(item =>
        item.categories?.some(cat => cat.category_id === selectedCategory)
      );
    }

    setFilteredItems(filtered);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <Spinner size="lg" className="w-24 h-24" style={{ color: '#C67B57' }} />
            <div className="absolute inset-0 animate-ping opacity-20">
              <div className="w-24 h-24 rounded-full bg-[#D9B38C]/40"></div>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-[#C67B57] mb-3 animate-pulse">
            ✨ Loading Delights...
          </h2>
          <p className="text-xl text-[#D9B38C]">
            Preparing something amazing
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="glass-card max-w-xl">
          <CardBody className="text-center p-12">
            <div className="text-9xl mb-6">⚠️</div>
            <h2 className="text-4xl font-bold text-[#C67B57] mb-4">
              Oops! Something went wrong
            </h2>
            <p className="text-xl text-[#D9B38C] mb-8">{error}</p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#D9B38C] to-[#C67B57] text-white font-bold text-xl px-12 py-6 shadow-xl touch-target"
              onClick={() => window.location.reload()}
            >
              🔄 Try Again
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-48">
      {/* Hero Header - 24-inch Display Optimized */}
      <div className="relative">
        <div className="glass-header border-b-4 border-[#D9B38C]/40 py-8 px-12">
          <div className="max-w-[1800px] mx-auto">
            <div className="text-center space-y-4">
              {/* Logo / Branding */}
              <div className="text-9xl animate-float mx-auto">🍰</div>
              <h1 className="text-7xl font-black bg-gradient-to-br from-[#C67B57] via-[#D9B38C] to-[#C9B8A5] bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(198,123,87,0.4)]">
                Golden Munch
              </h1>
              <p className="text-3xl text-[#C67B57] font-semibold drop-shadow-lg">
                Fresh • Delicious • Made with Love
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-12 pt-8 space-y-8">
        {/* Categories */}
        {categories.length > 0 && (
          <div>
            <div className="flex gap-4 justify-center flex-wrap mb-10">
              <Button
                size="lg"
                className={`${
                  selectedCategory === null
                    ? 'bg-gradient-to-br from-[#D9B38C] to-[#C67B57] text-white scale-105 shadow-lg'
                    : 'glass-button text-[#C67B57]'
                } font-bold text-xl px-10 py-7 rounded-2xl transition-all touch-target`}
                onClick={() => setSelectedCategory(null)}
              >
                All Items
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.category_id}
                  size="lg"
                  className={`${
                    selectedCategory === category.category_id
                      ? 'bg-gradient-to-br from-[#D9B38C] to-[#C67B57] text-white scale-105 shadow-lg'
                      : 'glass-button text-[#C67B57]'
                  } font-bold text-xl px-10 py-7 rounded-2xl transition-all touch-target`}
                  onClick={() => setSelectedCategory(category.category_id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items Grid - 4 Columns for 24-inch Display */}
        {filteredItems.length === 0 ? (
          <Card className="glass-card">
            <CardBody className="text-center py-24">
              <div className="text-[120px] mb-8 animate-float">🍽️</div>
              <h3 className="text-5xl font-bold text-[#C67B57] mb-6 drop-shadow-lg">
                No items found
              </h3>
              <p className="text-2xl text-[#D9B38C] mb-10">
                No items in this category
              </p>
              {selectedCategory !== null && (
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#D9B38C] to-[#C67B57] text-white font-bold px-12 py-8 text-2xl touch-target"
                  onClick={() => setSelectedCategory(null)}
                >
                  Clear Filter
                </Button>
              )}
            </CardBody>
          </Card>
        ) : (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[#C67B57] drop-shadow-lg">
                {filteredItems.length} Delicious {filteredItems.length === 1 ? 'Item' : 'Items'}
              </h2>
            </div>

            <div className="grid grid-cols-4 gap-8">
              {filteredItems.map((item) => {
                const cartQty = getCartQuantity(item.menu_item_id);
                const isAvailable = item.status === 'available' &&
                  (item.is_infinite_stock || item.stock_quantity > 0);

                return (
                  <Card
                    key={item.menu_item_id}
                    className={`glass-card hover:border-[#C67B57] hover:shadow-2xl hover:scale-105 transition-all duration-300 ${!isAvailable && 'opacity-60'}`}
                  >
                    <CardBody className="p-0">
                      {/* Image/Icon Section */}
                      <div className="relative h-64 bg-gradient-to-br from-[#E8DCC8]/30 to-[#D9B38C]/30 flex items-center justify-center rounded-t-xl overflow-hidden">
                        {getImageUrl(item.image_url) ? (
                          <div className="w-full h-full relative">
                            <Image
                              src={getImageUrl(item.image_url) || ''}
                              alt={item.name}
                              fill
                              className="object-cover hover:scale-110 transition-transform duration-300"
                              sizes="(max-width: 1920px) 25vw"
                            />
                          </div>
                        ) : (
                          <div className="text-9xl animate-float">🍰</div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                          {item.is_featured && (
                            <Chip size="lg" className="font-bold text-base px-4 py-2 bg-[#C67B57] text-white">
                              Popular
                            </Chip>
                          )}
                          {!isAvailable && (
                            <Chip size="lg" className="font-bold text-base px-4 py-2 bg-red-500 text-white">
                              Sold Out
                            </Chip>
                          )}
                          {cartQty > 0 && (
                            <Chip size="lg" className="font-bold text-base px-4 py-2 bg-green-500 text-white">
                              {cartQty} in cart
                            </Chip>
                          )}
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-6 space-y-4">
                        <div>
                          <h3 className="text-2xl font-bold text-[#C67B57] mb-2 line-clamp-1 drop-shadow-md">
                            {item.name}
                          </h3>
                          <p className="text-base text-[#C9B8A5] line-clamp-2 h-12">
                            {item.description || 'Delicious treat made fresh daily'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mb-5">
                          <span className="text-4xl font-black text-[#C67B57] drop-shadow-lg">
                            ${(Number(item.current_price) || 0).toFixed(2)}
                          </span>
                          <Chip size="md" className="bg-[#E8DCC8] text-[#C67B57] font-semibold">
                            {item.item_type}
                          </Chip>
                        </div>

                        {isAvailable ? (
                          <Button
                            size="lg"
                            className="w-full bg-gradient-to-r from-[#D9B38C] to-[#C67B57] text-white font-bold text-xl py-7 shadow-lg hover:shadow-xl hover:scale-105 touch-target touch-feedback transition-all"
                            onClick={() => handleAddToCart(item)}
                          >
                            {cartQty > 0 ? 'Add Another' : 'Add to Cart'}
                          </Button>
                        ) : (
                          <Button
                            disabled
                            size="lg"
                            className="w-full bg-gray-300 text-gray-500 font-semibold text-xl py-7 touch-target"
                          >
                            Unavailable
                          </Button>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
