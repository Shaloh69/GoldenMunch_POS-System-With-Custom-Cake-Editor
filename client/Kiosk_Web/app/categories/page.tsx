"use client";

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import NextLink from 'next/link';
import { MenuService } from '@/services/menu.service';
import type { Category, MenuItem } from '@/types/api';
import { useCart } from '@/contexts/CartContext';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getItemCount, getTotal } = useCart();

  const getCategoryItemCount = (categoryId: number): number => {
    return menuItems.filter(item => item.status === 'available').length;
  };

  const getCategoryEmoji = (index: number): string => {
    const emojis = ['🍰', '🥐', '🍪', '☕', '🥪', '🍕', '🍔', '🍜', '🍱', '🍲'];
    return emojis[index % emojis.length];
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [cats, items] = await Promise.all([
          MenuService.getCategories(),
          MenuService.getMenuItems()
        ]);

        setCategories(cats);
        setMenuItems(items);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load categories. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-scale-in">
          <div className="relative">
            <Spinner
              size="lg"
              classNames={{
                wrapper: "w-24 h-24",
                circle1: "border-b-sunny-yellow",
                circle2: "border-b-deep-orange-yellow"
              }}
            />
            <div className="absolute inset-0 animate-ping opacity-20">
              <div className="w-24 h-24 rounded-full bg-sunny-yellow/30"></div>
            </div>
          </div>
          <p className="text-3xl text-black mt-6 font-bold drop-shadow-lg">
            Loading categories...
          </p>
          <p className="text-lg text-black/70 mt-2">
            Organizing our delicious menu
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md bg-gradient-to-br from-pure-white/90 via-sunny-yellow/10 to-deep-orange-yellow/15 backdrop-blur-lg border-2 border-sunny-yellow/60 shadow-xl animate-scale-in">
          <CardBody className="text-center p-8">
            <div className="text-8xl mb-6 animate-bounce-slow drop-shadow-xl">⚠️</div>
            <h1 className="text-4xl font-bold text-black mb-4 drop-shadow-lg">
              Oops! Something went wrong
            </h1>
            <p className="text-xl text-black/70 mb-8">
              {error}
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow text-black font-bold text-xl px-8 shadow-xl hover:scale-105 transition-all"
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
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-sunny-yellow/25 via-pure-white/20 to-deep-orange-yellow/25 backdrop-blur-sm border-b-4 border-sunny-yellow shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-sunny-yellow via-deep-orange-yellow to-sunny-yellow opacity-20"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wLTE4YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>

        <div className="relative max-w-7xl mx-auto p-12 text-center">
          <div className="inline-block mb-6 animate-float">
            <div className="text-8xl drop-shadow-xl">📂</div>
          </div>
          <h1 className="text-6xl font-black bg-gradient-to-br from-sunny-yellow via-deep-orange-yellow to-sunny-yellow bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(251,205,47,0.6)] mb-4">
            Browse Categories
          </h1>
          <p className="text-2xl text-black font-bold max-w-2xl mx-auto drop-shadow-lg">
            Choose from our carefully curated selection of delicious categories
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-8 -mt-16">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-pure-white/90 via-sunny-yellow/10 to-deep-orange-yellow/15 backdrop-blur-lg border-2 border-sunny-yellow/60 shadow-xl animate-slide-up">
            <CardBody className="p-6 text-center">
              <div className="text-5xl mb-2 drop-shadow-lg">📋</div>
              <p className="text-3xl font-bold text-black drop-shadow-sm">{categories.length}</p>
              <p className="text-black/70 font-semibold">Categories</p>
            </CardBody>
          </Card>
          <Card className="bg-gradient-to-br from-pure-white/90 via-sunny-yellow/10 to-deep-orange-yellow/15 backdrop-blur-lg border-2 border-sunny-yellow/60 shadow-xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardBody className="p-6 text-center">
              <div className="text-5xl mb-2 drop-shadow-lg">🍴</div>
              <p className="text-3xl font-bold text-black drop-shadow-sm">{menuItems.length}</p>
              <p className="text-black/70 font-semibold">Total Items</p>
            </CardBody>
          </Card>
          <Card className="bg-gradient-to-br from-pure-white/90 via-sunny-yellow/10 to-deep-orange-yellow/15 backdrop-blur-lg border-2 border-sunny-yellow/60 shadow-xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardBody className="p-6 text-center">
              <div className="text-5xl mb-2 drop-shadow-lg">✨</div>
              <p className="text-3xl font-bold text-black drop-shadow-sm">
                {menuItems.filter(i => i.is_featured).length}
              </p>
              <p className="text-black/70 font-semibold">Featured</p>
            </CardBody>
          </Card>
        </div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <Card className="bg-gradient-to-br from-pure-white/90 via-sunny-yellow/10 to-deep-orange-yellow/15 backdrop-blur-lg border-2 border-sunny-yellow/60 shadow-xl animate-scale-in">
            <CardBody className="text-center py-16">
              <div className="text-9xl mb-6 animate-float drop-shadow-xl">📋</div>
              <h3 className="text-4xl font-bold text-black mb-4 drop-shadow-lg">
                No categories available
              </h3>
              <p className="text-xl text-black/70 mb-8">
                Categories are being set up. Please check back soon!
              </p>
              <Button
                as={NextLink}
                href="/"
                size="lg"
                className="bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow text-black font-bold px-8 shadow-xl hover:scale-105 transition-all"
              >
                Browse All Items
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-black flex items-center gap-3 drop-shadow-lg">
              <span className="text-4xl">🎯</span>
              All Categories
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map((category, index) => (
                <Card
                  key={category.category_id}
                  className="bg-gradient-to-br from-pure-white/90 via-sunny-yellow/10 to-deep-orange-yellow/15 backdrop-blur-lg border-2 border-sunny-yellow/60 shadow-xl group cursor-pointer animate-slide-up hover:scale-105 hover:border-sunny-yellow hover:shadow-2xl transition-all"
                  style={{ animationDelay: `${index * 0.05}s` }}
                  isPressable
                  as={NextLink}
                  href={`/menu?category=${category.category_id}`}
                >
                  <CardHeader className="p-0 relative overflow-hidden">
                    {/* Gradient Background */}
                    <div className="w-full h-40 bg-gradient-to-br from-sunny-yellow/30 via-deep-orange-yellow/20 to-sunny-yellow/10 flex items-center justify-center relative">
                      {/* Decorative Pattern */}
                      <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiPjxjaXJjbGUgY3g9IjMiIGN5PSIzIiByPSIzIi8+PC9nPjwvZz48L3N2Zz4=')]"></div>

                      {/* Emoji/Icon */}
                      <div className="relative z-10 text-7xl animate-float group-hover:scale-110 transition-transform drop-shadow-lg">
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            className="w-20 h-20 object-cover rounded-full shadow-xl border-4 border-sunny-yellow"
                          />
                        ) : (
                          getCategoryEmoji(index)
                        )}
                      </div>

                      {/* Shine Effect on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sunny-yellow to-transparent opacity-0 group-hover:opacity-30 transform -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
                    </div>
                  </CardHeader>

                  <CardBody className="px-5 py-6">
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-black mb-2 line-clamp-1 drop-shadow-sm">
                        {category.name}
                      </h3>
                      <p className="text-sm text-black/70 line-clamp-2 min-h-[40px]">
                        {category.description || 'Delicious items in this category'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <Chip
                        variant="flat"
                        size="sm"
                        className="bg-sunny-yellow text-black font-semibold shadow-md"
                      >
                        {getCategoryItemCount(category.category_id)} items
                      </Chip>
                      {category.is_active && (
                        <Chip variant="dot" size="sm" className="bg-green-500/20 text-green-700 font-semibold">
                          Available
                        </Chip>
                      )}
                    </div>

                    <div className="w-full bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow text-black font-bold shadow-lg group-hover:shadow-xl transition-all rounded-lg px-4 py-2 text-center">
                      Explore →
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quick Navigation */}
        <div className="mt-16 text-center space-y-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <Card className="bg-gradient-to-br from-pure-white/90 via-sunny-yellow/10 to-deep-orange-yellow/15 backdrop-blur-lg border-2 border-sunny-yellow/60 shadow-xl inline-block">
            <CardBody className="p-8">
              <h3 className="text-3xl font-bold text-black mb-6 drop-shadow-lg">
                Quick Navigation
              </h3>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  as={NextLink}
                  href="/"
                  size="lg"
                  className="bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow text-black font-bold px-10 shadow-xl hover:scale-105 transition-transform"
                >
                  🏠 Back to Menu
                </Button>
                <Button
                  as={NextLink}
                  href="/specials"
                  size="lg"
                  variant="bordered"
                  className="border-2 border-sunny-yellow/60 text-black hover:bg-sunny-yellow/10 hover:border-sunny-yellow font-bold px-10"
                >
                  ⭐ Today's Specials
                </Button>
                {getItemCount() > 0 && (
                  <Button
                    as={NextLink}
                    href="/cart"
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-10 shadow-xl animate-pulse-slow"
                  >
                    🛒 View Cart ({getItemCount()})
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Floating Cart for Mobile */}
      {getItemCount() > 0 && (
        <div className="fixed bottom-8 right-8 z-50 lg:hidden">
          <Button
            as={NextLink}
            href="/cart"
            isIconOnly
            className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 text-white text-3xl rounded-full shadow-2xl animate-glow"
          >
            🛒
          </Button>
          <div className="absolute -top-2 -right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg animate-bounce-slow">
            {getItemCount()}
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="h-20"></div>
    </div>
  );
}
