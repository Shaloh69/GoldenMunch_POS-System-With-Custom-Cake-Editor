"use client";

import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody } from '@heroui/card';
import { Spinner } from '@heroui/spinner';
import { Input } from '@heroui/input';
import { useCart } from '@/contexts/CartContext';
import { MenuService } from '@/services/menu.service';
import type { MenuItem, Category } from '@/types/api';
import { KioskSidebar } from '@/components/KioskSidebar';
import { MenuCard } from '@/components/MenuCard';

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
      filtered = menuItems.filter(item =>
        item.categories?.some(cat => cat.category_id === selectedCategory)
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  }, [menuItems, selectedCategory, searchQuery]);

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
              circle1: "border-b-sunny-yellow",
              circle2: "border-b-deep-orange-yellow"
            }}
          />
          <p className="text-4xl font-bold text-black mt-8">
            Loading Menu...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-2xl bg-pure-white/20 backdrop-blur-lg border-2 border-sunny-yellow/40">
          <CardBody className="text-center p-12">
            <div className="text-9xl mb-8">⚠️</div>
            <h1 className="text-5xl font-bold text-black mb-6">
              Oops! Something went wrong
            </h1>
            <p className="text-2xl text-black mb-10">
              {error}
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow text-black font-bold text-2xl px-12 py-8 shadow-lg hover:shadow-xl transition-all touch-target-lg"
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
      <div className="min-h-screen pr-[35vw] max-pr-[500px] pt-16">
        {/* Compact Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-br from-sunny-yellow/25 via-pure-white/20 to-deep-orange-yellow/25 backdrop-blur-sm border-b-2 border-sunny-yellow py-3 px-4 mb-4 shadow-md">
          <div className="max-w-full mx-auto">
            {/* Compact Title */}
            <div className="text-center mb-2">
              <h1 className="text-3xl font-black text-black drop-shadow-md">
                Golden Munch
              </h1>
            </div>

            {/* Compact Search Bar */}
            <div className="max-w-full mx-auto">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="sm"
                startContent={<span className="text-xl">🔍</span>}
                classNames={{
                  input: "text-base py-2 text-black",
                  inputWrapper: "bg-gradient-to-r from-pure-white/95 to-sunny-yellow/10 backdrop-blur-md shadow-md border-2 border-sunny-yellow/60 hover:border-sunny-yellow hover:shadow-lg transition-all min-h-[48px]"
                }}
              />
            </div>
          </div>
        </div>

        <div className="max-w-full mx-auto px-4">
          {/* Horizontal Scrollable Categories */}
          {categories.length > 0 && (
            <div className="mb-4 -mx-4 px-4">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                <Button
                  size="sm"
                  className={`
                    ${selectedCategory === null
                      ? 'bg-gradient-to-br from-sunny-yellow to-deep-orange-yellow text-black shadow-lg'
                      : 'bg-gradient-to-br from-pure-white/80 to-sunny-yellow/10 backdrop-blur-sm border-2 border-sunny-yellow/50 text-black'
                    }
                    font-bold text-base px-6 py-4 rounded-xl transition-all whitespace-nowrap flex-shrink-0 snap-start
                  `}
                  onClick={() => setSelectedCategory(null)}
                >
                  All Items
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.category_id}
                    size="sm"
                    className={`
                      ${selectedCategory === category.category_id
                        ? 'bg-gradient-to-br from-sunny-yellow to-deep-orange-yellow text-black shadow-lg'
                        : 'bg-gradient-to-br from-pure-white/80 to-sunny-yellow/10 backdrop-blur-sm border-2 border-sunny-yellow/50 text-black'
                      }
                      font-bold text-base px-6 py-4 rounded-xl transition-all whitespace-nowrap flex-shrink-0 snap-start
                    `}
                    onClick={() => setSelectedCategory(category.category_id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Menu Items - 2 Column Portrait Grid */}
          {filteredItems.length === 0 ? (
            <Card className="bg-gradient-to-br from-pure-white/90 via-sunny-yellow/10 to-deep-orange-yellow/15 backdrop-blur-lg border-2 border-sunny-yellow/60 shadow-lg">
              <CardBody className="text-center py-12">
                <div className="text-6xl mb-4 animate-float drop-shadow-lg">🍽️</div>
                <h3 className="text-3xl font-bold text-black mb-3">
                  No items found
                </h3>
                <p className="text-lg text-black mb-6">
                  {searchQuery
                    ? `No results for "${searchQuery}"`
                    : "No items available right now."
                  }
                </p>
                {(searchQuery || selectedCategory !== null) && (
                  <Button
                    size="md"
                    className="bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow text-black font-bold text-base px-6 py-4 shadow-lg hover:scale-105 transition-all"
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
              <div className="mb-3 text-center">
                <h2 className="text-xl font-bold text-black">
                  {filteredItems.length} {filteredItems.length === 1 ? 'Item' : 'Items'}
                </h2>
              </div>

              {/* 2 Column Grid - Compact spacing */}
              <div className="grid grid-cols-2 gap-4 pb-8">
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
