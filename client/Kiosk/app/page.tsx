"use client";

import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody } from '@heroui/card';
import { Spinner } from '@heroui/spinner';
import { useCart } from '@/contexts/CartContext';
import { MenuService } from '@/services/menu.service';
import type { MenuItem, Category } from '@/types/api';
import { KioskSidebar } from '@/components/KioskSidebar';
import { MenuCard } from '@/components/MenuCard';

export default function HomePage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const { items: cartItems } = useCart();

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

    // Auto-refresh menu every 30 seconds
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

  const getCartQuantity = (itemId: number): number => {
    const cartItem = cartItems.find(item => item.menuItem.menu_item_id === itemId);
    return cartItem?.quantity || 0;
  };

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
  };

  const handleCloseSidebar = () => {
    setSelectedItem(null);
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
              Oops! Something went wrong
            </h1>
            <p className="text-2xl text-[#C9B8A5] mb-10">{error}</p>
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
    <>
      <div className="min-h-screen pr-[30vw] max-pr-[576px]">
        {/* Hero Header */}
        <div className="glass-header border-b-4 border-[#D9B38C]/40 py-10 px-12 mb-10">
          <div className="max-w-[1400px] mx-auto text-center">
            <div className="text-9xl mb-6 animate-float">🍰</div>
            <h1 className="text-8xl font-black bg-gradient-to-br from-[#C67B57] via-[#D9B38C] to-[#C9B8A5] bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(198,123,87,0.4)] mb-4">
              Golden Munch
            </h1>
            <p className="text-3xl text-[#C67B57] font-semibold drop-shadow-lg">
              Fresh • Delicious • Made with Love
            </p>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-12">
          {/* Categories */}
          {categories.length > 0 && (
            <div className="mb-10">
              <div className="flex gap-4 justify-center flex-wrap">
                <Button
                  size="lg"
                  className={`${
                    selectedCategory === null
                      ? 'bg-gradient-to-br from-[#D9B38C] to-[#C67B57] text-white scale-105 shadow-lg'
                      : 'bg-white/80 backdrop-blur-sm border-2 border-[#D9B38C]/30 text-[#C67B57] hover:border-[#D9B38C]'
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
                        : 'bg-white/80 backdrop-blur-sm border-2 border-[#D9B38C]/30 text-[#C67B57] hover:border-[#D9B38C]'
                    } font-bold text-xl px-10 py-7 rounded-2xl transition-all touch-target`}
                    onClick={() => setSelectedCategory(category.category_id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Menu Items Grid */}
          {filteredItems.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-lg border-2 border-[#D9B38C]/30">
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
            <>
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-[#C67B57] drop-shadow-lg">
                  {filteredItems.length} Delicious {filteredItems.length === 1 ? 'Item' : 'Items'}
                </h2>
              </div>

              {/* 4 Column Grid */}
              <div className="grid grid-cols-4 gap-8 pb-16">
                {filteredItems.map((item) => (
                  <MenuCard
                    key={item.menu_item_id}
                    item={item}
                    onClick={handleItemClick}
                    cartQuantity={getCartQuantity(item.menu_item_id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <KioskSidebar
        selectedItem={selectedItem}
        onClose={handleCloseSidebar}
      />
    </>
  );
}
