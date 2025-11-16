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
  const { getItemCount } = useCart();

  // Category item counts
  const getCategoryItemCount = (categoryId: number): number => {
    // This would need proper category mapping from the database
    // For now, return a placeholder
    return menuItems.filter(item => item.status === 'available').length;
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
            Loading categories...
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
      <div className="bg-gradient-to-r from-golden-orange to-deep-amber text-chocolate-brown p-8 shadow-lg">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-2">Browse Our Categories 📋</h1>
          <p className="text-xl opacity-90">Choose a category to explore our delicious offerings</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* All Categories */}
        <div>
          <h2 className="text-3xl font-bold text-chocolate-brown mb-6 text-center">
            🍽️ All Categories
          </h2>
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-8xl mb-4">📋</div>
              <h3 className="text-3xl font-bold text-chocolate-brown mb-2">
                No categories available
              </h3>
              <p className="text-xl text-chocolate-brown/70">
                Categories are being set up. Please check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map((category) => (
                <Card
                  key={category.category_id}
                  className="hover:scale-105 transition-all duration-300 shadow-lg border border-golden-orange/20 hover:border-golden-orange bg-cream-white cursor-pointer"
                  isPressable
                >
                  <CardHeader className="flex flex-col items-center px-4 pt-6 pb-2">
                    <div className="text-6xl mb-3">
                      {category.image_url ? (
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="w-16 h-16 object-cover rounded-full"
                        />
                      ) : (
                        '🍽️'
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-chocolate-brown text-center mb-2">
                      {category.name}
                    </h3>
                    <Chip
                      color="default"
                      size="sm"
                      variant="flat"
                      className="text-xs"
                    >
                      {getCategoryItemCount(category.category_id)} items
                    </Chip>
                  </CardHeader>

                  <CardBody className="px-4 pb-4">
                    <p className="text-chocolate-brown/60 text-sm text-center mb-4 line-clamp-2">
                      {category.description || 'Delicious items in this category'}
                    </p>

                    <Button
                      as={NextLink}
                      href={`/menu?category=${category.category_id}`}
                      size="md"
                      variant="bordered"
                      className="w-full border-golden-orange text-chocolate-brown hover:bg-golden-orange/10 font-semibold"
                    >
                      View Items
                    </Button>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Navigation */}
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-bold text-chocolate-brown mb-6">
            Quick Navigation
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              as={NextLink}
              href="/"
              size="lg"
              className="bg-deep-amber hover:bg-chocolate-brown text-cream-white font-bold px-8"
            >
              🏠 Back to Menu
            </Button>
            <Button
              as={NextLink}
              href="/specials"
              size="lg"
              variant="bordered"
              className="border-golden-orange text-chocolate-brown hover:bg-golden-orange/10 font-bold px-8"
            >
              ⭐ Today's Specials
            </Button>
            {getItemCount() > 0 && (
              <Button
                as={NextLink}
                href="/cart"
                size="lg"
                variant="bordered"
                className="border-mint-green text-chocolate-brown hover:bg-mint-green/10 font-bold px-8"
              >
                🛒 View Cart ({getItemCount()})
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
