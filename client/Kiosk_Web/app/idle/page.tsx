"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cake, Sparkles, Heart, Star, Clock, AlertCircle } from "lucide-react";
import { MenuService } from "@/services/menu.service";
import { MenuItem, ItemType } from "@/types/api";

interface FeaturedItem {
  id: number;
  name: string;
  image: string;
  description: string;
  price: string;
}

interface Quote {
  text: string;
  author?: string;
}

// Page types for the rotating screens
type PageType = 'welcome' | 'featured' | 'quote1' | 'quote2' | 'custom-cake';

// Emoji mapping based on item types
const getEmojiForItemType = (itemType: ItemType, itemName: string): string => {
  const nameLower = itemName.toLowerCase();

  if (nameLower.includes('chocolate')) return '🍫';
  if (nameLower.includes('strawberry')) return '🍓';
  if (nameLower.includes('vanilla')) return '🍦';
  if (nameLower.includes('lemon')) return '🍋';
  if (nameLower.includes('coffee')) return '☕';
  if (nameLower.includes('caramel')) return '🍮';
  if (nameLower.includes('cheese')) return '🧀';
  if (nameLower.includes('custom')) return '🎨';

  switch (itemType) {
    case ItemType.CAKE: return '🎂';
    case ItemType.PASTRY: return '🥐';
    case ItemType.BEVERAGE: return '☕';
    case ItemType.SNACK: return '🍪';
    case ItemType.DESSERT: return '🍰';
    case ItemType.BREAD: return '🍞';
    default: return '🧁';
  }
};

export default function IdlePage() {
  const [currentPage, setCurrentPage] = useState<PageType>('welcome');
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);
  const [floatingElements, setFloatingElements] = useState<Array<{ id: number; x: number; y: number; emoji: string }>>([]);
  const [sparkleElements, setSparkleElements] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);

  // Promotional quotes
  const quotes: Quote[] = [
    { text: "Life is short, eat dessert first!", author: "Jacques Torres" },
    { text: "Every cake has a story to tell", author: "Golden Munch" },
    { text: "Happiness is a slice of cake", author: "Anonymous" },
    { text: "Baked fresh daily with love", author: "Golden Munch" },
    { text: "Where sweetness meets perfection", author: "Golden Munch" },
    { text: "Creating memories, one cake at a time", author: "Golden Munch" }
  ];

  const bakeryEmojis = ['🍰', '🧁', '🎂', '🍪', '🥐', '🍩', '🥧', '✨', '⭐', '💫'];

  // Fetch featured items from API
  useEffect(() => {
    const fetchFeaturedItems = async () => {
      try {
        setIsLoadingItems(true);
        console.log('🎯 [Idle] Fetching featured menu items...');

        const items = await MenuService.getMenuItems({ is_featured: true });

        const transformedItems: FeaturedItem[] = items
          .filter(item => item.status === 'available')
          .slice(0, 6)
          .map(item => ({
            id: item.menu_item_id,
            name: item.name,
            image: item.image_url || getEmojiForItemType(item.item_type, item.name),
            description: item.description || `Delicious ${item.name.toLowerCase()}`,
            price: item.current_price ? `₱${item.current_price.toFixed(2)}` : 'Price varies'
          }));

        if (transformedItems.length === 0) {
          setFeaturedItems([
            {
              id: 0,
              name: "Custom Cake Creation",
              image: "🎨",
              description: "Design your dream cake in stunning 3D",
              price: "From ₱1,200"
            }
          ]);
        } else {
          setFeaturedItems(transformedItems);
        }

        console.log('✅ [Idle] Featured items ready:', transformedItems.length);
      } catch (error) {
        console.error('❌ [Idle] Error fetching featured items:', error);
        setFeaturedItems([
          {
            id: 0,
            name: "Custom Cake Creation",
            image: "🎨",
            description: "Design your dream cake in stunning 3D",
            price: "From ₱1,200"
          }
        ]);
      } finally {
        setIsLoadingItems(false);
      }
    };

    fetchFeaturedItems();
  }, []);

  // Generate floating elements and sparkles
  useEffect(() => {
    const elements = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      emoji: bakeryEmojis[Math.floor(Math.random() * bakeryEmojis.length)]
    }));
    setFloatingElements(elements);

    const sparkles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100
    }));
    setSparkleElements(sparkles);
  }, []);

  // Page rotation logic - 30-40 seconds per page
  useEffect(() => {
    const getRandomDelay = () => 30000 + Math.random() * 10000; // 30-40 seconds

    const timer = setTimeout(() => {
      setCurrentPage(prev => {
        // Page sequence: welcome -> featured -> quote1 -> quote2 -> custom-cake -> welcome
        switch (prev) {
          case 'welcome': return 'featured';
          case 'featured': return 'quote1';
          case 'quote1': return 'quote2';
          case 'quote2': return 'custom-cake';
          case 'custom-cake': return 'welcome';
          default: return 'welcome';
        }
      });
    }, getRandomDelay());

    return () => clearTimeout(timer);
  }, [currentPage]);

  // Rotate featured items if on featured page
  useEffect(() => {
    if (currentPage === 'featured' && featuredItems.length > 1) {
      const timer = setInterval(() => {
        setCurrentFeaturedIndex(prev => (prev + 1) % featuredItems.length);
      }, 5000); // Change featured item every 5 seconds

      return () => clearInterval(timer);
    }
  }, [currentPage, featuredItems.length]);

  // Handle interaction
  const handleInteraction = useCallback(() => {
    window.location.href = '/';
  }, []);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter' || event.key === 'Escape') {
        handleInteraction();
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleInteraction]);

  // Get random quote for quote pages
  const getRandomQuote = (pageNum: number): Quote => {
    const seed = pageNum === 1 ? 0 : 3;
    const index = (seed + Math.floor(Date.now() / 40000)) % quotes.length;
    return quotes[index];
  };

  return (
    <div
      className="fixed inset-0 w-screen h-screen overflow-hidden cursor-pointer"
      onClick={handleInteraction}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#3A1F0F] via-[#662B35] to-[#7B4B28] animate-gradient-shift">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(234,215,183,0.1)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(217,119,6,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgba(102,43,53,0.15)_0%,transparent_50%)]" />
      </div>

      {/* Floating bakery elements */}
      {floatingElements.map((element) => (
        <motion.div
          key={element.id}
          className="absolute text-4xl opacity-20 pointer-events-none"
          initial={{ x: `${element.x}%`, y: `${element.y}%` }}
          animate={{
            x: `${element.x + Math.sin(element.id) * 10}%`,
            y: `${element.y + Math.cos(element.id) * 10}%`,
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 20 + element.id * 2,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {element.emoji}
        </motion.div>
      ))}

      {/* Sparkle effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {sparkleElements.map((sparkle) => (
          <motion.div
            key={sparkle.id}
            className="absolute w-2 h-2 bg-[#EAD7B7] rounded-full"
            style={{
              left: `${sparkle.x}%`,
              top: `${sparkle.y}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              delay: sparkle.id * 0.1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Page Content */}
      <div className="relative z-10 h-full flex items-center justify-center p-8">
        <AnimatePresence mode="wait">
          {/* PAGE 1: Welcome Screen */}
          {currentPage === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 1 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="text-[250px] mb-8"
              >
                🍰
              </motion.div>
              <h1 className="text-9xl font-bold text-[#FAF7F2] mb-6 drop-shadow-2xl">
                Golden Munch
              </h1>
              <p className="text-5xl text-[#EAD7B7] font-light tracking-wide mb-12">
                Where Every Bite is Pure Bliss
              </p>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-4xl text-[#FAF7F2]/80"
              >
                Touch screen to start ordering
              </motion.div>
            </motion.div>
          )}

          {/* PAGE 2: Featured Items */}
          {currentPage === 'featured' && !isLoadingItems && featuredItems.length > 0 && (
            <motion.div
              key="featured"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 1 }}
              className="w-full max-w-7xl mx-auto"
            >
              <div className="bg-gradient-to-br from-[#FAF7F2]/20 to-[#EAD7B7]/10 backdrop-blur-xl rounded-3xl p-16 shadow-[0_0_80px_rgba(234,215,183,0.4)] border-2 border-[#EAD7B7]/30">
                <div className="flex flex-col lg:flex-row items-center justify-center gap-20">
                  {/* Item image */}
                  <motion.div
                    key={currentFeaturedIndex}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="drop-shadow-2xl flex-shrink-0"
                  >
                    {featuredItems[currentFeaturedIndex].image.startsWith('http') ? (
                      <img
                        src={featuredItems[currentFeaturedIndex].image}
                        alt={featuredItems[currentFeaturedIndex].name}
                        className="w-[300px] h-[300px] object-cover rounded-3xl mx-auto"
                      />
                    ) : (
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="text-[300px] leading-none flex items-center justify-center"
                      >
                        {featuredItems[currentFeaturedIndex].image}
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Item details */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-4 mb-6">
                      <Star className="w-12 h-12 text-[#D97706] fill-[#D97706]" />
                      <span className="text-[#EAD7B7] text-3xl font-semibold tracking-wider uppercase">
                        Featured Special
                      </span>
                    </div>
                    <h2 className="text-8xl font-bold text-[#FAF7F2] mb-8 drop-shadow-lg break-words">
                      {featuredItems[currentFeaturedIndex].name}
                    </h2>
                    <p className="text-4xl text-[#EAD7B7] mb-10 leading-relaxed">
                      {featuredItems[currentFeaturedIndex].description}
                    </p>
                    <div className="flex items-center gap-6">
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="bg-gradient-to-r from-[#D97706] to-[#7B4B28] text-[#FAF7F2] text-6xl font-bold px-12 py-6 rounded-3xl shadow-2xl"
                      >
                        {featuredItems[currentFeaturedIndex].price}
                      </motion.div>
                      <Sparkles className="w-16 h-16 text-[#D97706]" />
                    </div>
                  </div>
                </div>

                {/* Item indicators */}
                {featuredItems.length > 1 && (
                  <div className="flex justify-center gap-4 mt-12">
                    {featuredItems.map((_, index) => (
                      <div
                        key={index}
                        className={`h-4 rounded-full transition-all duration-500 ${
                          index === currentFeaturedIndex
                            ? 'w-20 bg-[#D97706]'
                            : 'w-4 bg-[#EAD7B7]/40'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* PAGE 3: Quote 1 */}
          {currentPage === 'quote1' && (
            <motion.div
              key="quote1"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 1 }}
              className="w-full max-w-5xl text-center"
            >
              <div className="bg-gradient-to-br from-[#FAF7F2]/15 to-[#EAD7B7]/10 backdrop-blur-xl rounded-3xl p-20 border-2 border-[#EAD7B7]/30 shadow-[0_0_80px_rgba(234,215,183,0.4)]">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Heart className="w-20 h-20 text-[#D97706] fill-[#D97706] mx-auto mb-8" />
                </motion.div>
                <p className="text-6xl text-[#FAF7F2] font-light italic mb-8 leading-relaxed">
                  "{getRandomQuote(1).text}"
                </p>
                <p className="text-4xl text-[#EAD7B7] font-semibold">
                  — {getRandomQuote(1).author}
                </p>
              </div>
            </motion.div>
          )}

          {/* PAGE 4: Quote 2 */}
          {currentPage === 'quote2' && (
            <motion.div
              key="quote2"
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -90 }}
              transition={{ duration: 1 }}
              className="w-full max-w-5xl text-center"
            >
              <div className="bg-gradient-to-br from-[#FAF7F2]/15 to-[#EAD7B7]/10 backdrop-blur-xl rounded-3xl p-20 border-2 border-[#EAD7B7]/30 shadow-[0_0_80px_rgba(234,215,183,0.4)]">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-20 h-20 text-[#D97706] mx-auto mb-8" />
                </motion.div>
                <p className="text-6xl text-[#FAF7F2] font-light italic mb-8 leading-relaxed">
                  "{getRandomQuote(2).text}"
                </p>
                <p className="text-4xl text-[#EAD7B7] font-semibold">
                  — {getRandomQuote(2).author}
                </p>
              </div>
            </motion.div>
          )}

          {/* PAGE 5: Custom Cake Promotion */}
          {currentPage === 'custom-cake' && (
            <motion.div
              key="custom-cake"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 1 }}
              className="w-full max-w-6xl text-center"
            >
              <div className="bg-gradient-to-br from-[#D97706]/30 via-[#7B4B28]/30 to-[#662B35]/30 backdrop-blur-xl rounded-3xl p-20 border-4 border-[#EAD7B7]/50 shadow-[0_0_100px_rgba(217,119,6,0.8)]">
                <motion.div
                  animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-[200px] mb-8"
                >
                  🎨
                </motion.div>
                <h2 className="text-8xl font-bold text-[#FAF7F2] mb-6 drop-shadow-2xl">
                  Custom Cake Editor
                </h2>
                <p className="text-5xl text-[#EAD7B7] mb-8">
                  Design Your Dream Cake in Stunning 3D
                </p>
                <div className="flex items-center justify-center gap-12 mb-10">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-16 h-16 text-[#FFD700]" />
                  </motion.div>
                  <div className="text-4xl text-[#FAF7F2]">
                    • QR Code Enabled •
                  </div>
                  <motion.div
                    animate={{ rotate: [0, -360] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  >
                    <Cake className="w-16 h-16 text-[#FFD700]" />
                  </motion.div>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="bg-gradient-to-r from-[#FFD700] to-[#D97706] text-[#3A1F0F] text-6xl font-bold px-16 py-8 rounded-full shadow-2xl inline-block"
                >
                  NEW FEATURE!
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Custom CSS for gradient animation */}
      <style>{`
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 15s ease infinite;
        }
      `}</style>
    </div>
  );
}
