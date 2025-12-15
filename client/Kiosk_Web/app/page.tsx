
"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { useCart } from "@/contexts/CartContext";
import { MenuService } from "@/services/menu.service";
import type { MenuItem, Category } from "@/types/api";
import { KioskSidebar } from "@/components/KioskSidebar";
import { MenuCard } from "@/components/MenuCard";

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
          MenuService.getCategories(),
        ]);

        setMenuItems(items);
        setCategories(cats);
        setFilteredItems(items);
      } catch (err: any) {
        setError(err.message || "Failed to load menu. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Auto-refresh menu every 30 seconds
    const refreshInterval = setInterval(() => {
      MenuService.getMenuItems()
        .then((items) => {
          setMenuItems(items);
        })
        .catch((err) => {
          console.error("Auto-refresh failed:", err);
        });

      MenuService.getCategories()
        .then((cats) => {
          setCategories(cats);
        })
        .catch((err) => {
          console.error("Category refresh failed:", err);
        });
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  // Filter items by category
  useEffect(() => {
    let filtered = menuItems;

    if (selectedCategory !== null) {
      filtered = menuItems.filter((item) =>
        item.categories?.some((cat) => cat.category_id === selectedCategory),
      );
    }

    setFilteredItems(filtered);
  }, [menuItems, selectedCategory]);

  const getCartQuantity = (itemId: number): number => {
    const cartItem = cartItems.find(
      (item) => item.menuItem.menu_item_id === itemId,
    );
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
      <div className="h-[1920px] flex items-center justify-center">
        <div className="text-center">
          <Spinner
            size="lg"
            classNames={{
              wrapper: "w-32 h-32",
              circle1: "border-b-sunny-yellow",
              circle2: "border-b-deep-orange-yellow",
            }}
          />
          <p className="text-4xl font-bold text-charcoal-gray mt-8">
            Loading Menu...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[1920px] flex items-center justify-center p-6">
        <Card className="max-w-2xl bg-pure-white/20 backdrop-blur-lg border-2 border-sunny-yellow/40">
          <CardBody className="text-center p-12">
            <div className="text-9xl mb-8">⚠️</div>
            <h1 className="text-5xl font-bold text-charcoal-gray mb-6">
              Oops! Something went wrong
            </h1>
            <p className="text-2xl text-charcoal-gray/70 mb-10">{error}</p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow text-charcoal-gray font-bold text-2xl px-12 py-8 shadow-lg hover:shadow-xl transition-all"
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
      <div className="min-h-screen overflow-y-auto pr-[35vw] max-pr-[500px] flex flex-col pt-20">
        {/* Hero Header - Optimized for portrait */}
        <div className="bg-gradient-to-br from-sunny-yellow/25 via-pure-white/20 to-deep-orange-yellow/25 backdrop-blur-sm border-b-4 border-sunny-yellow py-8 px-8 mb-8 shadow-lg">
          <div className="max-w-full mx-auto text-center">
            <div className="text-8xl mb-4 animate-float drop-shadow-xl">🍰</div>
            <h1 className="text-7xl font-black text-black drop-shadow-lg mb-3">
              Golden Munch
            </h1>
            <p className="text-2xl text-black font-bold drop-shadow-sm">
              Fresh • Delicious • Made with Love
            </p>
          </div>
        </div>

        <div className="max-w-full mx-auto px-8">
          {/* Categories - Touch optimized */}
          {categories.length > 0 && (
            <div className="mb-8">
              <div className="flex gap-5 justify-center flex-wrap">
                <Button
                  size="lg"
                  className={`${
                    selectedCategory === null
                      ? "bg-gradient-to-br from-sunny-yellow to-deep-orange-yellow text-black scale-105 shadow-xl shadow-sunny-yellow/40"
                      : "bg-gradient-to-br from-pure-white/80 to-sunny-yellow/10 backdrop-blur-sm border-2 border-sunny-yellow/50 text-black hover:border-sunny-yellow hover:shadow-lg"
                  } font-bold text-2xl px-12 py-8 rounded-2xl transition-all touch-target-lg`}
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
                        ? "bg-gradient-to-br from-sunny-yellow to-deep-orange-yellow text-black scale-105 shadow-xl shadow-sunny-yellow/40"
                        : "bg-gradient-to-br from-pure-white/80 to-sunny-yellow/10 backdrop-blur-sm border-2 border-sunny-yellow/50 text-black hover:border-sunny-yellow hover:shadow-lg"
                    } font-bold text-2xl px-12 py-8 rounded-2xl transition-all touch-target-lg`}
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
            <Card className="bg-gradient-to-br from-pure-white/90 via-sunny-yellow/10 to-deep-orange-yellow/15 backdrop-blur-lg border-2 border-sunny-yellow/60 shadow-xl">
              <CardBody className="text-center py-24">
                <div className="text-[120px] mb-8 animate-float drop-shadow-xl">
                  🍽️
                </div>
                <h3 className="text-5xl font-bold text-black mb-6 drop-shadow-lg">
                  No items found
                </h3>
                <p className="text-2xl text-black/70 mb-10">
                  No items in this category
                </p>
                {selectedCategory !== null && (
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow text-black font-bold px-12 py-8 text-2xl touch-target shadow-xl hover:scale-105 transition-all"
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
                <h2 className="text-4xl font-bold text-black drop-shadow-sm">
                  {filteredItems.length} Delicious{" "}
                  {filteredItems.length === 1 ? "Item" : "Items"}
                </h2>
              </div>

              {/* 2 Column Grid - Portrait 21-inch optimized */}
              <div className="grid grid-cols-2 gap-8 pb-8 flex-1">
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

        {/* Promotional Section - Portrait optimized */}
        <div className="mt-auto bg-gradient-to-r from-sunny-yellow/30 via-deep-orange-yellow/25 to-sunny-yellow/30 backdrop-blur-md border-t-4 border-sunny-yellow py-10 px-8 shadow-2xl">
          <div className="max-w-full mx-auto">
            <div className="flex flex-col items-center gap-6 text-center">
              <div>
                <h3 className="text-5xl font-black text-black mb-3 drop-shadow-sm">
                  🎂 Design Your Dream Cake!
                </h3>
                <p className="text-2xl text-black font-bold">
                  Create a custom cake perfectly tailored to your celebration
                </p>
              </div>
              <Button
                size="lg"
                className="bg-gradient-to-br from-sunny-yellow via-deep-orange-yellow to-sunny-yellow text-black font-black text-3xl px-20 py-10 rounded-3xl shadow-2xl hover:shadow-[0_0_50px_rgba(251,205,47,0.7)] hover:scale-105 transition-all touch-target-lg border-4 border-deep-orange-yellow/50 animate-pulse-slow min-w-full"
                onClick={() => (window.location.href = "/custom-cake")}
              >
                🍰 Custom Cake Editor
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <KioskSidebar selectedItem={selectedItem} onClose={handleCloseSidebar} />
    </>
  );
}
