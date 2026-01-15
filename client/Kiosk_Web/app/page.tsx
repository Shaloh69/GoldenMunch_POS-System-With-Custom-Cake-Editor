"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Button, Card, CardBody, Spinner } from "@/components/primitives";
import { useCart } from "@/contexts/CartContext";
import { MenuService } from "@/services/menu.service";
import type { MenuItem, Category, MenuItemType, UnitOfMeasure } from "@/types/api";
import { KioskAppSidebar } from "@/components/KioskAppSidebar";
import { MenuCard } from "@/components/MenuCard";

export default function HomePage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemTypes, setItemTypes] = useState<MenuItemType[]>([]);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<number | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const { items: cartItems } = useCart();
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Fetch menu items, categories, item types, and units
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [items, cats, types, unitsData] = await Promise.all([
          MenuService.getMenuItems(),
          MenuService.getCategories(),
          MenuService.getItemTypes(),
          MenuService.getUnits(),
        ]);

        setMenuItems(items);
        setCategories(cats);
        setItemTypes(types);
        setUnits(unitsData);
      } catch (err: any) {
        setError(err.message || "Failed to load menu. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Auto-refresh menu every 60 seconds (increased from 30s for better performance)
    const refreshInterval = setInterval(() => {
      // Refresh menu items silently in background
      MenuService.getMenuItems()
        .then((items) => {
          setMenuItems(items);
        })
        .catch((err) => {
          console.error("Auto-refresh failed:", err);
        });

      // Categories change less frequently, refresh every 2 minutes
      if (Date.now() % 120000 < 60000) {
        MenuService.getCategories()
          .then((cats) => {
            setCategories(cats);
          })
          .catch((err) => {
            console.error("Category refresh failed:", err);
          });
      }
    }, 60000); // Increased to 60 seconds

    return () => clearInterval(refreshInterval);
  }, []);

  // Filter items by category, item type, unit, and sort (sold_out items always last) - Memoized for performance
  const filteredItems = useMemo(() => {
    let filtered = menuItems;

    // Filter by category
    if (selectedCategory !== null) {
      filtered = filtered.filter((item) =>
        item.categories?.some((cat) => cat.category_id === selectedCategory)
      );
    }

    // Filter by item type
    if (selectedItemType !== null) {
      filtered = filtered.filter((item) => item.item_type_id === selectedItemType);
    }

    // Filter by unit of measure
    if (selectedUnit !== null) {
      filtered = filtered.filter((item) => item.unit_of_measure_id === selectedUnit);
    }

    // Sort: Always put sold_out/discontinued items last
    const sorted = [...filtered].sort((a, b) => {
      const aOutOfStock = a.status === "sold_out" || a.status === "discontinued";
      const bOutOfStock = b.status === "sold_out" || b.status === "discontinued";

      if (aOutOfStock && !bOutOfStock) return 1; // a goes to end
      if (!aOutOfStock && bOutOfStock) return -1; // b goes to end

      // If both same status, maintain original order (by display_order or id)
      return 0;
    });

    return sorted;
  }, [menuItems, selectedCategory, selectedItemType, selectedUnit]);

  // Memoized function to get cart quantity for an item
  const getCartQuantity = useCallback((itemId: number): number => {
    const cartItem = cartItems.find(
      (item) => item.menuItem.menu_item_id === itemId
    );
    return cartItem?.quantity || 0;
  }, [cartItems]);

  // Memoized event handlers
  const handleItemClick = useCallback((item: MenuItem) => {
    setSelectedItem(item);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSelectedItem(null);
  }, []);

  // Check scroll position and update arrow visibility - Memoized
  const checkScrollPosition = useCallback(() => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        categoryScrollRef.current;
      setShowLeftArrow(scrollLeft > 5);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
    }
  }, []);

  // Scroll categories left - Memoized
  const scrollLeft = useCallback(() => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
      // Recheck after scroll animation
      setTimeout(checkScrollPosition, 350);
    }
  }, [checkScrollPosition]);

  // Scroll categories right - Memoized
  const scrollRight = useCallback(() => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
      // Recheck after scroll animation
      setTimeout(checkScrollPosition, 350);
    }
  }, [checkScrollPosition]);

  // Update arrow visibility when categories change
  useEffect(() => {
    checkScrollPosition();
    // Also check after a short delay to ensure layout is complete
    const timer = setTimeout(checkScrollPosition, 100);
    return () => clearTimeout(timer);
  }, [categories]);

  // Add scroll event listener and resize observer
  useEffect(() => {
    const scrollContainer = categoryScrollRef.current;
    if (!scrollContainer) return;

    // Throttle scroll events for better performance
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      checkScrollPosition();
      // Also check after scrolling settles
      scrollTimeout = setTimeout(checkScrollPosition, 150);
    };

    // Add scroll event listener
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    // Add scrollend event for better detection when scroll completes
    scrollContainer.addEventListener("scrollend", checkScrollPosition);

    // Add ResizeObserver to detect container size changes
    const resizeObserver = new ResizeObserver(() => {
      checkScrollPosition();
    });
    resizeObserver.observe(scrollContainer);

    return () => {
      clearTimeout(scrollTimeout);
      scrollContainer.removeEventListener("scroll", handleScroll);
      scrollContainer.removeEventListener("scrollend", checkScrollPosition);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <>
      <div className="min-h-screen overflow-y-auto pr-0 flex flex-col relative">
        {loading && (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center animate-fade-in-up">
              <div className="relative">
                <Spinner size="lg" color="primary" className="w-32 h-32" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl animate-pulse-gentle">🍰</div>
                </div>
              </div>
              <p className="text-4xl font-bold text-foreground mt-8 animate-pulse-gentle">
                Loading Menu...
              </p>
              <p className="text-xl text-muted-foreground mt-2">
                Preparing something delicious
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="min-h-screen flex items-center justify-center p-8 animate-fade-in">
            <div className="glass-card max-w-2xl p-12 animate-shake">
              <div className="text-center">
                <div className="text-9xl mb-8 animate-bounce-in">⚠️</div>
                <h1 className="text-5xl font-bold text-foreground mb-6">
                  Oops! Something went wrong
                </h1>
                <p className="text-2xl text-muted-foreground mb-10">{error}</p>
                <Button
                  size="lg"
                  className="btn-gradient text-2xl px-12 py-8 shadow-lg touch-target"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Modern Hero Header - Compact Version */}
            <header className="glass-header sticky top-0 z-30 animate-fade-in-down">
              <div className="max-w-full mx-auto py-4 px-6">
                <div className="text-center">
                  <div className="text-5xl mb-2 animate-bounce-in">🍰</div>
                  <h1 className="text-4xl font-black text-gradient drop-shadow-lg mb-1">
                    Golden Munch
                  </h1>
                  <p className="text-lg font-semibold text-black">
                    Fresh • Delicious • Made with Love
                  </p>
                </div>
              </div>
            </header>

            <div className="flex-1 px-8 py-6">
              {/* Modern Categories - Horizontal Scrollable */}
              {categories.length > 0 && (
                <div className="mb-8 animate-fade-in-up animation-delay-200 flex items-center gap-4">
                  {/* Left Arrow - Only show when scrolled */}
                  <div className="flex-shrink-0">
                    {showLeftArrow ? (
                      <button
                        onClick={scrollLeft}
                        className="glass-button p-4 rounded-full shadow-lg hover:scale-110 transition-transform"
                        aria-label="Scroll left"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={3}
                          stroke="currentColor"
                          className="w-8 h-8"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 19.5L8.25 12l7.5-7.5"
                          />
                        </svg>
                      </button>
                    ) : (
                      <div className="w-16" />
                    )}
                  </div>

                  {/* Scrollable Categories Container */}
                  <div
                    ref={categoryScrollRef}
                    className="flex-1 flex flex-nowrap gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
                    style={{
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                      WebkitOverflowScrolling: "touch",
                    }}
                  >
                    <Button
                      size="lg"
                      onClick={() => setSelectedCategory(null)}
                      className={`${
                        selectedCategory === null
                          ? "btn-gradient scale-105"
                          : "glass-button"
                      } font-bold text-xl px-10 py-7 rounded-2xl touch-target whitespace-nowrap flex-shrink-0`}
                    >
                      All Items
                    </Button>
                    {categories.map((category, index) => (
                      <Button
                        key={category.category_id}
                        size="lg"
                        onClick={() =>
                          setSelectedCategory(category.category_id)
                        }
                        className={`${
                          selectedCategory === category.category_id
                            ? "btn-gradient scale-105"
                            : "glass-button"
                        } font-bold text-xl px-10 py-7 rounded-2xl touch-target animate-fade-in whitespace-nowrap flex-shrink-0`}
                        style={{ animationDelay: `${index * 0.1 + 0.3}s` }}
                      >
                        {category.name}
                      </Button>
                    ))}
                  </div>

                  {/* Right Arrow - Only show when there's more content */}
                  <div className="flex-shrink-0">
                    {showRightArrow ? (
                      <button
                        onClick={scrollRight}
                        className="glass-button p-4 rounded-full shadow-lg hover:scale-110 transition-transform"
                        aria-label="Scroll right"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={3}
                          stroke="currentColor"
                          className="w-8 h-8"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.25 4.5l7.5 7.5-7.5 7.5"
                          />
                        </svg>
                      </button>
                    ) : (
                      <div className="w-16" />
                    )}
                  </div>
                </div>
              )}

              {/* Item Type and Unit of Measure Filters - Smaller, side by side */}
              <div className="mb-6 animate-fade-in-up animation-delay-300 flex gap-4">
                {/* Item Type Filter */}
                {itemTypes.length > 0 && (
                  <div className="flex-1">
                    <select
                      value={selectedItemType || ""}
                      onChange={(e) => setSelectedItemType(e.target.value ? Number(e.target.value) : null)}
                      className="w-full glass-button px-6 py-4 rounded-xl text-lg font-semibold cursor-pointer hover:scale-102 transition-transform"
                    >
                      <option value="">All Types</option>
                      {itemTypes.map((type) => (
                        <option key={type.type_id} value={type.type_id}>
                          {type.display_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Unit of Measure Filter */}
                {units.length > 0 && (
                  <div className="flex-1">
                    <select
                      value={selectedUnit || ""}
                      onChange={(e) => setSelectedUnit(e.target.value ? Number(e.target.value) : null)}
                      className="w-full glass-button px-6 py-4 rounded-xl text-lg font-semibold cursor-pointer hover:scale-102 transition-transform"
                    >
                      <option value="">All Units</option>
                      {units.map((unit) => (
                        <option key={unit.unit_id} value={unit.unit_id}>
                          {unit.display_name} {unit.abbreviation ? `(${unit.abbreviation})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Clear Filters Button - Show when any filter is active */}
              {(selectedCategory !== null || selectedItemType !== null || selectedUnit !== null) && (
                <div className="mb-6 text-center animate-fade-in-up">
                  <Button
                    size="md"
                    className="glass-button px-8 py-3 rounded-xl text-base font-semibold"
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedItemType(null);
                      setSelectedUnit(null);
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}

              {/* Menu Items Grid or Empty State */}
              {filteredItems.length === 0 ? (
                <div className="animate-fade-in-up">
                  <div className="glass-card p-16 text-center">
                    <div className="text-[120px] mb-8 animate-float-smooth">
                      🍽️
                    </div>
                    <h3 className="text-5xl font-bold text-black mb-6">
                      No items found
                    </h3>
                    <p className="text-2xl text-black mb-10">
                      No items match the selected filters
                    </p>
                    {(selectedCategory !== null || selectedItemType !== null || selectedUnit !== null) && (
                      <Button
                        size="lg"
                        className="btn-gradient text-2xl px-12 py-8 shadow-xl touch-target"
                        onClick={() => {
                          setSelectedCategory(null);
                          setSelectedItemType(null);
                          setSelectedUnit(null);
                        }}
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Item Count with animation */}
                  <div className="text-center mb-6 animate-fade-in-up animation-delay-500">
                    <h2 className="text-4xl font-bold text-black">
                      {filteredItems.length} Delicious{" "}
                      {filteredItems.length === 1 ? "Item" : "Items"}
                    </h2>
                  </div>

                  {/* 3 Column Grid with stagger animation */}
                  <div className="grid grid-cols-3 gap-6 pb-8">
                    {filteredItems.map((item, index) => (
                      <div
                        key={item.menu_item_id}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${index * 0.05 + 0.6}s` }}
                      >
                        <MenuCard
                          item={item}
                          onClick={handleItemClick}
                          cartQuantity={getCartQuantity(item.menu_item_id)}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Modern CTA Section - Sticky at bottom */}
            <div className="mt-auto glass-footer sticky bottom-0 z-30 animate-fade-in-up animation-delay-1000">
              <div className="max-w-full mx-auto py-8 px-8">
                <div className="flex flex-col items-center gap-6 text-center">
                  <div>
                    <h3 className="text-5xl font-black text-gradient mb-3">
                      🎂 Design Your Dream Cake!
                    </h3>
                    <p className="text-2xl text-black font-semibold">
                      Create a custom cake perfectly tailored to your
                      celebration
                    </p>
                  </div>
                  <Button
                    size="lg"
                    className="btn-gradient text-3xl font-black px-20 py-10 rounded-3xl shadow-2xl touch-target-lg border-4 border-white/30 w-full max-w-3xl"
                    onClick={() => (window.location.href = "/custom-cake")}
                  >
                    🍰 Custom Cake Editor
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sidebar with slide animation - Always visible */}
      <KioskAppSidebar
        selectedItem={selectedItem}
        onClose={handleCloseSidebar}
      />
    </>
  );
}
