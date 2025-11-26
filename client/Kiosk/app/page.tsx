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
import HidableFooter from '@/components/HidableFooter';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream-white via-soft-sand to-warm-beige">
        <div className="text-center">
          <div className="relative mb-8">
            <Spinner size="lg" className="w-24 h-24 text-muted-clay" />
            <div className="absolute inset-0 animate-ping opacity-20">
              <div className="w-24 h-24 rounded-full bg-light-caramel/40"></div>
            </div>
          </div>
          <h2 className="text-5xl font-bold bg-gradient-to-r from-light-caramel to-muted-clay bg-clip-text text-transparent mb-4">
            ✨ Loading Delights...
          </h2>
          <p className="text-2xl text-warm-beige font-medium">
            Preparing something amazing
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-cream-white via-soft-sand to-warm-beige">
        <Card className="max-w-2xl shadow-caramel border-2 border-light-caramel/30 bg-cream-white/80 backdrop-blur-xl">
          <CardBody className="text-center p-12">
            <div className="text-9xl mb-6">⚠️</div>
            <h2 className="text-5xl font-bold bg-gradient-to-r from-light-caramel to-muted-clay bg-clip-text text-transparent mb-6">
              Oops! Something went wrong
            </h2>
            <p className="text-2xl text-warm-beige font-medium mb-8">{error}</p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-light-caramel to-muted-clay text-white font-bold text-xl px-12 py-6 shadow-caramel hover:shadow-glow transition-all duration-300 hover:scale-105"
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
    <div className="min-h-screen bg-gradient-to-br from-cream-white via-soft-sand to-warm-beige">
      {/* Hero Header - 24-inch TV Optimized */}
      <div className="relative">
        <div className="bg-gradient-to-r from-cream-white via-soft-sand to-cream-white backdrop-blur-xl border-b-4 border-light-caramel/40 shadow-soft p-8">
          <div className="text-center space-y-4">
            {/* Logo / Branding */}
            <div className="text-8xl mx-auto drop-shadow-lg">🍰</div>
            <h1 className="text-6xl font-black bg-gradient-to-r from-light-caramel via-muted-clay to-light-caramel bg-clip-text text-transparent drop-shadow-lg">
              Golden Munch
            </h1>
            <p className="text-3xl text-muted-clay font-bold drop-shadow-md">
              Fresh • Delicious • Made with Love
            </p>
          </div>
        </div>
      </div>

      <div className="px-8 pt-8 pb-40 space-y-8">
        {/* Categories - Horizontal Scroll */}
        {categories.length > 0 && (
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-light-caramel to-muted-clay bg-clip-text text-transparent mb-6 flex items-center gap-3 drop-shadow-lg">
              <span className="text-5xl">📂</span>
              Categories
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              <Button
                size="lg"
                className={`${
                  selectedCategory === null
                    ? 'bg-gradient-to-r from-light-caramel to-muted-clay text-white scale-105 shadow-caramel'
                    : 'bg-cream-white/50 border-2 border-light-caramel/30 text-muted-clay hover:bg-soft-sand/50'
                } font-bold text-2xl px-8 py-7 rounded-2xl min-w-[220px] snap-center transition-all duration-300 hover:scale-105 shadow-soft`}
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
                      ? 'bg-gradient-to-r from-light-caramel to-muted-clay text-white scale-105 shadow-caramel'
                      : 'bg-cream-white/50 border-2 border-light-caramel/30 text-muted-clay hover:bg-soft-sand/50'
                  } font-bold text-2xl px-8 py-7 rounded-2xl min-w-[220px] snap-center transition-all duration-300 hover:scale-105 shadow-soft`}
                  onClick={() => setSelectedCategory(category.category_id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items Grid - 4 Column for 24-inch TV */}
        {filteredItems.length === 0 ? (
          <Card className="shadow-caramel border-2 border-light-caramel/30 bg-cream-white/80 backdrop-blur-xl">
            <CardBody className="text-center py-20">
              <div className="text-9xl mb-6">🍽️</div>
              <h3 className="text-5xl font-bold bg-gradient-to-r from-light-caramel to-muted-clay bg-clip-text text-transparent mb-6 drop-shadow-lg">
                No items found
              </h3>
              <p className="text-2xl text-warm-beige font-medium mb-8">
                No items in this category
              </p>
              {selectedCategory !== null && (
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-light-caramel to-muted-clay text-white font-bold px-12 py-6 text-2xl shadow-caramel hover:shadow-glow transition-all duration-300 hover:scale-105"
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
              <h2 className="text-4xl font-bold bg-gradient-to-r from-light-caramel to-muted-clay bg-clip-text text-transparent drop-shadow-lg">
                🍴 {filteredItems.length} Delicious Items
              </h2>
            </div>

            <div className="grid grid-cols-4 gap-6">
              {filteredItems.map((item) => {
                const cartQty = getCartQuantity(item.menu_item_id);
                const isAvailable = item.status === 'available' &&
                  (item.is_infinite_stock || item.stock_quantity > 0);

                return (
                  <Card
                    key={item.menu_item_id}
                    className={`shadow-caramel border-2 border-light-caramel/30 bg-cream-white/80 backdrop-blur-xl hover:scale-105 transition-all duration-300 hover:shadow-glow ${!isAvailable && 'opacity-60'}`}
                  >
                    <CardBody className="p-0">
                      {/* Image/Icon Section */}
                      <div className="relative h-48 bg-gradient-to-br from-soft-sand/40 to-light-caramel/30 flex items-center justify-center rounded-t-xl overflow-hidden">
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
                          <div className="text-8xl">🍰</div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                          {item.is_featured && (
                            <Chip size="lg" className="font-bold text-lg bg-gradient-to-r from-light-caramel to-muted-clay text-white shadow-caramel">
                              🔥 Hot
                            </Chip>
                          )}
                          {!isAvailable && (
                            <Chip size="lg" className="font-bold text-lg bg-warm-beige text-white shadow-soft">
                              Sold Out
                            </Chip>
                          )}
                          {cartQty > 0 && (
                            <Chip size="lg" className="font-bold text-xl bg-light-caramel text-white shadow-caramel">
                              {cartQty} in cart
                            </Chip>
                          )}
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-5 space-y-4">
                        <div>
                          <h3 className="text-2xl font-bold text-muted-clay mb-2 line-clamp-2 drop-shadow-md">
                            {item.name}
                          </h3>
                          <p className="text-lg text-warm-beige line-clamp-2">
                            {item.description || 'Delicious treat made fresh daily'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-4xl font-black bg-gradient-to-r from-light-caramel to-muted-clay bg-clip-text text-transparent drop-shadow-lg">
                            ₱{(Number(item.current_price) || 0).toFixed(0)}
                          </span>
                          <Chip size="lg" variant="flat" className="text-lg bg-soft-sand/50 text-muted-clay border border-light-caramel/30 font-semibold">
                            {item.item_type}
                          </Chip>
                        </div>

                        {isAvailable ? (
                          <Button
                            size="lg"
                            className="w-full bg-gradient-to-r from-light-caramel to-muted-clay text-white font-bold text-xl py-6 shadow-caramel hover:shadow-glow transition-all duration-300 hover:scale-105"
                            onClick={() => handleAddToCart(item)}
                          >
                            {cartQty > 0 ? '🛒 Add More' : '+ Add to Cart'}
                          </Button>
                        ) : (
                          <Button
                            disabled
                            size="lg"
                            className="w-full bg-warm-beige/50 text-soft-sand font-semibold text-xl py-6"
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

      {/* Hidable Footer with Cart and Custom Cake */}
      <HidableFooter />
    </div>
  );
}
