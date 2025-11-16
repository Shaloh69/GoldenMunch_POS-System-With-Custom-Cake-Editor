"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { Badge } from '@heroui/badge';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  popular: boolean;
}

interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

const categories: Category[] = [
  { id: "all", name: "All Items", emoji: "🍽️", color: "golden-orange" },
  { id: "cakes", name: "Cakes", emoji: "🍰", color: "golden-orange" },
  { id: "pastries", name: "Pastries", emoji: "🥐", color: "deep-amber" },
  { id: "cookies", name: "Cookies", emoji: "🍪", color: "caramel-beige" },
  { id: "beverages", name: "Beverages", emoji: "☕", color: "mint-green" },
  { id: "sandwiches", name: "Sandwiches", emoji: "🥪", color: "chocolate-brown" },
];

// Mock data for when server is not available
const mockMenuItems: MenuItem[] = [
  {
    id: "1",
    name: "Classic Chocolate Cake",
    description: "Rich, moist chocolate cake with cream frosting",
    price: 24.99,
    category: "cakes",
    image: "🍰",
    available: true,
    popular: true,
  },
  {
    id: "2",
    name: "Fresh Croissant",
    description: "Buttery, flaky pastry baked fresh daily",
    price: 3.49,
    category: "pastries",
    image: "🥐",
    available: true,
    popular: false,
  },
  {
    id: "3",
    name: "Chocolate Chip Cookies",
    description: "Warm, gooey cookies with premium chocolate chips",
    price: 2.99,
    category: "cookies",
    image: "🍪",
    available: true,
    popular: true,
  },
  {
    id: "4",
    name: "Artisan Coffee",
    description: "Freshly roasted coffee beans, perfectly brewed",
    price: 4.99,
    category: "beverages",
    image: "☕",
    available: true,
    popular: false,
  },
  {
    id: "5",
    name: "Gourmet Club Sandwich",
    description: "Triple-decker with premium meats and fresh vegetables",
    price: 12.99,
    category: "sandwiches",
    image: "🥪",
    available: false,
    popular: false,
  },
  {
    id: "6",
    name: "Red Velvet Cupcake",
    description: "Decadent red velvet with cream cheese frosting",
    price: 4.99,
    category: "cakes",
    image: "🧁",
    available: true,
    popular: true,
  },
  {
    id: "7",
    name: "Apple Danish",
    description: "Flaky pastry with sweet apple filling",
    price: 3.99,
    category: "pastries",
    image: "🥧",
    available: true,
    popular: false,
  },
  {
    id: "8",
    name: "Iced Latte",
    description: "Smooth espresso with cold milk and ice",
    price: 5.49,
    category: "beverages",
    image: "🧊",
    available: true,
    popular: true,
  },
];

export default function Home() {
  // Optimized state management
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use refs for frequently changing values to avoid re-renders
  const cartRef = useRef<{[key: string]: number}>({});
  const [cartUpdateTrigger, setCartUpdateTrigger] = useState(0);
  
  // Debounce cart updates
  const updateCartDisplay = useCallback(() => {
    setCartUpdateTrigger(prev => prev + 1);
  }, []);

  // Memoized filtered items - only recalculate when menuItems or selectedCategory changes
  const filteredItems = useMemo(() => {
    if (selectedCategory === "all") {
      return menuItems;
    }
    return menuItems.filter(item => item.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  // Memoized cart calculations - only recalculate when cart changes
  const cartStats = useMemo(() => {
    const cart = cartRef.current;
    const totalItems = Object.values(cart).reduce((sum, count) => sum + count, 0);
    const totalPrice = Object.entries(cart).reduce((total, [itemId, count]) => {
      const item = menuItems.find(i => i.id === itemId);
      return total + (item ? item.price * count : 0);
    }, 0);
    
    return { totalItems, totalPrice };
  }, [menuItems, cartUpdateTrigger]);

  // Optimized API call with proper cleanup
  useEffect(() => {
    let isMounted = true;
    
    const fetchMenuItems = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (!isMounted) return;
        
        // Simulate random server availability (85% success rate)
        if (Math.random() > 0.85) {
          throw new Error("Server temporarily unavailable");
        }
        
        setMenuItems(mockMenuItems);
      } catch (err) {
        if (!isMounted) return;
        
        console.warn("Server not available, using mock data:", err);
        setMenuItems(mockMenuItems);
        setError("Using offline menu (server unavailable)");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMenuItems();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Optimized cart functions with minimal re-renders
  const addToCart = useCallback((itemId: string) => {
    cartRef.current = {
      ...cartRef.current,
      [itemId]: (cartRef.current[itemId] || 0) + 1
    };
    updateCartDisplay();
  }, [updateCartDisplay]);

  const removeFromCart = useCallback((itemId: string) => {
    const currentCount = cartRef.current[itemId] || 0;
    if (currentCount > 0) {
      cartRef.current = {
        ...cartRef.current,
        [itemId]: currentCount - 1
      };
      updateCartDisplay();
    }
  }, [updateCartDisplay]);

  // Memoized category buttons to prevent unnecessary re-renders
  const CategoryButtons = useMemo(() => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {categories.map((category) => (
        <Button
          key={category.id}
          size="lg"
          variant={selectedCategory === category.id ? "solid" : "bordered"}
          className={`
            ${selectedCategory === category.id 
              ? 'bg-golden-orange text-chocolate-brown border-golden-orange shadow-lg scale-105' 
              : 'border-golden-orange text-chocolate-brown hover:bg-golden-orange/10 hover:scale-105'
            }
            font-semibold text-lg px-4 py-6 h-auto flex-col gap-2 transition-all duration-300
          `}
          onClick={() => setSelectedCategory(category.id)}
        >
          <span className="text-3xl">{category.emoji}</span>
          <span>{category.name}</span>
        </Button>
      ))}
    </div>
  ), [selectedCategory]);

  // Memoized menu item component to prevent unnecessary re-renders
  const MenuItem = useCallback(({ item }: { item: MenuItem }) => {
    const itemCount = cartRef.current[item.id] || 0;
    
    return (
      <Card 
        key={item.id}
        className={`
          ${item.available ? 'hover:scale-105 cursor-pointer' : 'opacity-60'}
          transition-all duration-300 shadow-lg border-2 border-golden-orange/20
          ${item.available ? 'hover:shadow-2xl hover:border-golden-orange' : ''}
          bg-cream-white
        `}
        isPressable={item.available}
        onClick={() => item.available && addToCart(item.id)}
      >
        <CardHeader className="flex flex-col items-start px-6 pt-6 pb-0">
          <div className="flex justify-between items-start w-full">
            <div className="text-6xl mb-2">{item.image}</div>
            <div className="flex flex-col gap-1">
              {item.popular && (
                <Chip color="warning" size="sm" variant="flat">
                  🔥 Popular
                </Chip>
              )}
              {!item.available && (
                <Chip color="danger" size="sm" variant="flat">
                  Sold Out
                </Chip>
              )}
            </div>
          </div>
          <h3 className="text-xl font-bold text-chocolate-brown">{item.name}</h3>
          <p className="text-chocolate-brown/70 text-sm">{item.description}</p>
        </CardHeader>
        
        <CardBody className="px-6 pt-2">
          <div className="flex justify-between items-center mb-4">
            <span className="text-2xl font-bold text-deep-amber">
              ${item.price.toFixed(2)}
            </span>
            {itemCount > 0 && (
              <Badge content={itemCount} color="success" size="lg">
                <div className="w-8 h-8 rounded-full bg-golden-orange"></div>
              </Badge>
            )}
          </div>
          
          {item.available ? (
            <div className="flex items-center gap-2">
              {itemCount > 0 && (
                <>
                  <Button
                    size="sm"
                    variant="bordered"
                    className="border-deep-amber text-deep-amber min-w-unit-10 font-bold text-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromCart(item.id);
                    }}
                  >
                    -
                  </Button>
                  <span className="text-chocolate-brown font-bold min-w-8 text-center text-lg">
                    {itemCount}
                  </span>
                </>
              )}
              <Button
                size={itemCount > 0 ? "sm" : "md"}
                className={`
                  ${itemCount > 0 ? 'min-w-unit-10' : 'w-full'}
                  bg-golden-orange hover:bg-deep-amber text-chocolate-brown font-bold
                  ${itemCount > 0 ? 'text-lg' : ''}
                `}
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(item.id);
                }}
              >
                {itemCount > 0 ? '+' : '🛒 Add to Cart'}
              </Button>
            </div>
          ) : (
            <Button
              disabled
              className="w-full bg-gray-300 text-gray-500"
            >
              Currently Unavailable
            </Button>
          )}
        </CardBody>
      </Card>
    );
  }, [addToCart, removeFromCart, cartUpdateTrigger]);

  // Loading state
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
            Loading delicious menu...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-white to-caramel-beige">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-golden-orange to-deep-amber text-chocolate-brown p-8 shadow-lg">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-2">Welcome to Golden Munch! 🍰</h1>
          <p className="text-xl opacity-90">Touch an item to add it to your order</p>
          
          {/* Error Banner */}
          {error && (
            <div className="mt-4 bg-mint-green/20 border border-mint-green rounded-lg p-3 max-w-md mx-auto">
              <p className="text-chocolate-brown text-sm">
                ⚠️ {error}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-chocolate-brown mb-6 text-center">Choose Your Category</h2>
          {CategoryButtons}
        </div>

        {/* Menu Items */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-8xl mb-4">🍽️</div>
            <h3 className="text-3xl font-bold text-chocolate-brown mb-2">
              No items available
            </h3>
            <p className="text-xl text-chocolate-brown/70 mb-6">
              {selectedCategory === "all" 
                ? "Our menu is being updated. Please check back soon!"
                : "No items in this category right now."
              }
            </p>
            <Button
              size="lg"
              className="bg-golden-orange text-chocolate-brown font-bold px-8 py-4 text-xl"
              onClick={() => setSelectedCategory("all")}
            >
              View All Categories
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <MenuItem key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Floating Cart Button */}
        {cartStats.totalItems > 0 && (
          <div className="fixed bottom-6 right-6 z-50">
            <Badge content={cartStats.totalItems} color="danger" size="lg" placement="top-left">
              <Button
                size="lg"
                className="bg-deep-amber hover:bg-chocolate-brown text-cream-white font-bold text-xl px-8 py-6 rounded-full shadow-2xl animate-bounce-slow"
              >
                🛒 Checkout<br/>${cartStats.totalPrice.toFixed(2)}
              </Button>
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}