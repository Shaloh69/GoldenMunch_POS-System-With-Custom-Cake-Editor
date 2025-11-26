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
            <Spinner size="lg" className="w-24 h-24" style={{ color: '#EAD7B7' }} />
            <div className="absolute inset-0 animate-ping opacity-20">
              <div className="w-24 h-24 rounded-full bg-[#EAD7B7]/30"></div>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-[#FAF7F2] mb-3 animate-pulse">
            ✨ Loading Delights...
          </h2>
          <p className="text-xl text-[#EAD7B7]">
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
            <h2 className="text-4xl font-bold text-[#FAF7F2] mb-4">
              Oops! Something went wrong
            </h2>
            <p className="text-xl text-[#EAD7B7] mb-8">{error}</p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#7B4B28] to-[#662B35] text-[#FAF7F2] font-bold text-xl px-12 py-6 shadow-xl touch-target"
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
    <div className="min-h-screen pb-32">
      {/* Hero Header - Portrait Optimized */}
      <div className="relative">
        <div className="glass-header border-b-4 border-[#EAD7B7]/30 p-8">
          <div className="text-center space-y-4">
            {/* Logo / Branding */}
            <div className="text-8xl animate-float mx-auto">🍰</div>
            <h1 className="text-6xl font-black bg-gradient-to-br from-[#EAD7B7] via-[#7B4B28] to-[#662B35] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(234,215,183,0.3)]">
              Golden Munch
            </h1>
            <p className="text-2xl text-[#FAF7F2] font-semibold drop-shadow-lg">
              Fresh • Delicious • Made with Love
            </p>
          </div>
        </div>

        {/* Floating Cart Badge */}
        {getItemCount() > 0 && (
          <Button
            as={NextLink}
            href="/cart"
            size="lg"
            className="absolute top-8 right-8 bg-gradient-to-br from-[#7B4B28] to-[#662B35] text-[#FAF7F2] font-bold text-xl px-8 py-6 rounded-full touch-target shadow-[0_0_30px_rgba(234,215,183,0.4)]"
            style={{ animation: 'glow 2s ease-in-out infinite' }}
          >
            <span className="text-3xl mr-2">🛒</span>
            <span className="text-2xl">{getItemCount()}</span>
            <Chip size="lg" className="ml-3 text-xl px-4 bg-[#662B35] text-[#FAF7F2] font-bold">
              ₱{getTotal().toFixed(0)}
            </Chip>
          </Button>
        )}
      </div>

      <div className="px-8 pt-8 space-y-8">
        {/* Categories - Horizontal Scroll */}
        {categories.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-[#FAF7F2] mb-6 flex items-center gap-3 drop-shadow-lg">
              <span className="text-5xl">📂</span>
              Categories
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              <Button
                size="lg"
                className={`${
                  selectedCategory === null
                    ? 'bg-gradient-to-br from-[#7B4B28] to-[#662B35] text-[#FAF7F2] scale-110 shadow-[0_0_20px_rgba(234,215,183,0.4)]'
                    : 'glass-button border-2 border-[#EAD7B7]/40 text-[#FAF7F2]'
                } font-bold text-2xl px-8 py-7 rounded-2xl min-w-[200px] snap-center transition-all touch-target`}
                onClick={() => setSelectedCategory(null)}
              >
                ✨ All Items
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.category_id}
                  size="lg"
                  className={`${
                    selectedCategory === category.category_id
                      ? 'bg-gradient-to-br from-[#7B4B28] to-[#662B35] text-[#FAF7F2] scale-110 shadow-[0_0_20px_rgba(234,215,183,0.4)]'
                      : 'glass-button border-2 border-[#EAD7B7]/40 text-[#FAF7F2]'
                  } font-bold text-2xl px-8 py-7 rounded-2xl min-w-[200px] snap-center transition-all touch-target`}
                  onClick={() => setSelectedCategory(category.category_id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items Grid - 2 Column for Portrait */}
        {filteredItems.length === 0 ? (
          <Card className="glass-card">
            <CardBody className="text-center py-20">
              <div className="text-9xl mb-6 animate-float">🍽️</div>
              <h3 className="text-5xl font-bold text-[#FAF7F2] mb-4 drop-shadow-lg">
                No items found
              </h3>
              <p className="text-2xl text-[#EAD7B7] mb-8">
                No items in this category
              </p>
              {selectedCategory !== null && (
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#7B4B28] to-[#662B35] text-[#FAF7F2] font-bold px-12 py-6 text-2xl touch-target"
                  onClick={() => setSelectedCategory(null)}
                >
                  Clear Filter
                </Button>
              )}
            </CardBody>
          </Card>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-[#FAF7F2] drop-shadow-lg">
                🍴 {filteredItems.length} Delicious Items
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {filteredItems.map((item) => {
                const cartQty = getCartQuantity(item.menu_item_id);
                const isAvailable = item.status === 'available' &&
                  (item.is_infinite_stock || item.stock_quantity > 0);

                return (
                  <Card
                    key={item.menu_item_id}
                    className={`glass-card hover:scale-105 transition-transform duration-300 ${!isAvailable && 'opacity-60'}`}
                  >
                    <CardBody className="p-0">
                      {/* Image/Icon Section */}
                      <div className="relative h-48 bg-gradient-to-br from-[#7B4B28]/20 to-[#662B35]/20 flex items-center justify-center rounded-t-xl overflow-hidden">
                        {getImageUrl(item.image_url) ? (
                          <div className="w-full h-full relative">
                            <Image
                              src={getImageUrl(item.image_url) || ''}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="text-8xl animate-float">🍰</div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                          {item.is_featured && (
                            <Chip size="lg" className="font-bold text-lg animate-pulse-slow bg-[#EAD7B7] text-[#3A1F0F]">
                              🔥 Hot
                            </Chip>
                          )}
                          {!isAvailable && (
                            <Chip size="lg" className="font-bold text-lg bg-[#662B35] text-[#FAF7F2]">
                              Sold Out
                            </Chip>
                          )}
                          {cartQty > 0 && (
                            <Chip size="lg" className="font-bold text-xl bg-[#7B4B28] text-[#FAF7F2]">
                              {cartQty} in cart
                            </Chip>
                          )}
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-5 space-y-4">
                        <div>
                          <h3 className="text-2xl font-bold text-[#FAF7F2] mb-2 line-clamp-2 drop-shadow-md">
                            {item.name}
                          </h3>
                          <p className="text-lg text-[#EAD7B7] line-clamp-2">
                            {item.description || 'Delicious treat made fresh daily'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-4xl font-black bg-gradient-to-r from-[#EAD7B7] to-[#7B4B28] bg-clip-text text-transparent drop-shadow-lg">
                            ₱{(Number(item.current_price) || 0).toFixed(0)}
                          </span>
                          <Chip size="lg" variant="flat" className="text-lg bg-[#EAD7B7]/20 text-[#FAF7F2] border border-[#EAD7B7]/30">
                            {item.item_type}
                          </Chip>
                        </div>

                        {isAvailable ? (
                          <Button
                            size="lg"
                            className="w-full bg-gradient-to-r from-[#7B4B28] to-[#662B35] text-[#FAF7F2] font-bold text-xl py-6 shadow-lg hover:shadow-[0_0_25px_rgba(234,215,183,0.5)] touch-target touch-feedback transition-all"
                            onClick={() => handleAddToCart(item)}
                          >
                            {cartQty > 0 ? '🛒 Add More' : '+ Add to Cart'}
                          </Button>
                        ) : (
                          <Button
                            disabled
                            size="lg"
                            className="w-full bg-[#3A1F0F]/50 text-[#EAD7B7]/50 font-semibold text-xl py-6 touch-target"
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
