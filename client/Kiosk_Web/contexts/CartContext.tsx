"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type {
  MenuItem,
  OrderItemRequest,
  CustomCakeDesignRequest,
  OrderType,
  OrderSource,
  PaymentMethod
} from '@/types/api';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  flavor_id?: number;
  size_id?: number;
  flavor?: { flavor_id: number; additional_cost: number; flavor_name: string };
  size?: { size_id: number; size_multiplier: number; size_name: string };
  custom_cake_design?: CustomCakeDesignRequest;
  special_instructions?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: number) => void;
  updateQuantity: (menuItemId: number, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
  getOrderItems: () => OrderItemRequest[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const TAX_RATE = 0; // No tax
const CART_STORAGE_KEY = 'goldenmunch_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          setItems(JSON.parse(savedCart));
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
      setIsInitialized(true);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [items, isInitialized]);

  const addItem = useCallback((newItem: CartItem) => {
    setItems((currentItems) => {
      // Check if item already exists (same menu item and customizations)
      // For custom cakes, always treat as unique (don't merge)
      const existingIndex = newItem.custom_cake_design
        ? -1
        : currentItems.findIndex(
            (item) =>
              item.menuItem.menu_item_id === newItem.menuItem.menu_item_id &&
              item.flavor_id === newItem.flavor_id &&
              item.size_id === newItem.size_id &&
              !item.custom_cake_design // Also ensure existing item isn't a custom cake
          );

      if (existingIndex >= 0) {
        // Update quantity if item exists
        const updated = [...currentItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + newItem.quantity,
        };
        return updated;
      } else {
        // Add new item
        return [...currentItems, newItem];
      }
    });
  }, []);

  const removeItem = useCallback((menuItemId: number) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.menuItem.menu_item_id !== menuItemId)
    );
  }, []);

  const updateQuantity = useCallback((menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.menuItem.menu_item_id === menuItemId
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getItemCount = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const getSubtotal = useCallback(() => {
    return items.reduce((total, item) => {
      const basePrice = item.menuItem.current_price || 0;
      const flavorCost = item.flavor?.additional_cost || 0;
      const sizeMultiplier = item.size?.size_multiplier || 1;

      // Calculate design cost for custom cakes
      let designCost = 0;
      if (item.custom_cake_design) {
        // Basic design complexity cost estimation (could be fetched from theme if available)
        const complexityCosts = {
          simple: 0,
          moderate: 50,
          complex: 100,
          intricate: 200
        };
        designCost = complexityCosts[item.custom_cake_design.design_complexity] || 0;
      }

      // Match backend calculation: (basePrice + flavorCost + designCost) * sizeMultiplier * quantity
      const itemTotal = (basePrice + flavorCost + designCost) * sizeMultiplier * item.quantity;
      return total + itemTotal;
    }, 0);
  }, [items]);

  const getTax = useCallback(() => {
    return getSubtotal() * TAX_RATE;
  }, [getSubtotal]);

  const getTotal = useCallback(() => {
    return getSubtotal() + getTax();
  }, [getSubtotal, getTax]);

  const getOrderItems = useCallback((): OrderItemRequest[] => {
    return items.map((item) => ({
      menu_item_id: item.menuItem.menu_item_id,
      quantity: item.quantity,
      flavor_id: item.flavor_id,
      size_id: item.size_id,
      custom_cake_design: item.custom_cake_design,
      special_instructions: item.special_instructions,
    }));
  }, [items]);

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemCount,
    getSubtotal,
    getTax,
    getTotal,
    getOrderItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
