"use client";

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Divider } from '@heroui/divider';
import { Input } from '@heroui/input';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import NextLink from 'next/link';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  emoji: string;
  category: string;
  specialInstructions?: string;
}

// Mock cart data
const mockCartItems: CartItem[] = [
  {
    id: "1",
    name: "Classic Chocolate Cake",
    price: 24.99,
    quantity: 1,
    emoji: "🍰",
    category: "cakes",
  },
  {
    id: "3",
    name: "Chocolate Chip Cookies",
    price: 2.99,
    quantity: 3,
    emoji: "🍪",
    category: "cookies",
  },
  {
    id: "4",
    name: "Artisan Coffee",
    price: 4.99,
    quantity: 2,
    emoji: "☕",
    category: "beverages",
  },
];

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>(mockCartItems);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const {isOpen, onOpen, onOpenChange} = useDisclosure();

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCartItems(prev => prev.filter(item => item.id !== id));
    } else {
      setCartItems(prev => 
        prev.map(item => 
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getTax = () => {
    return getSubtotal() * 0.08; // 8% tax
  };

  const getTotal = () => {
    return getSubtotal() + getTax();
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real app, this would process the payment
    onOpen();
    setIsProcessing(false);
  };

  const handleNewOrder = () => {
    setCartItems([]);
    setCustomerName("");
    setCustomerPhone("");
    setSpecialInstructions("");
    onOpenChange();
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-white to-caramel-beige flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-8xl mb-6">🛒</div>
          <h1 className="text-4xl font-bold text-chocolate-brown mb-4">
            Your Cart is Empty
          </h1>
          <p className="text-xl text-chocolate-brown/70 mb-8">
            Looks like you haven't added any delicious treats yet!
          </p>
          <div className="flex flex-col gap-4">
            <Button
              as={NextLink}
              href="/"
              size="lg"
              className="bg-golden-orange hover:bg-deep-amber text-chocolate-brown font-bold text-xl px-8 py-4"
            >
              🍰 Browse Our Menu
            </Button>
            <Button
              as={NextLink}
              href="/specials"
              size="lg"
              variant="bordered"
              className="border-golden-orange text-chocolate-brown hover:bg-golden-orange/10 font-bold text-lg px-8"
            >
              ⭐ View Today's Specials
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-white to-caramel-beige">
      {/* Header */}
      <div className="bg-gradient-to-r from-golden-orange to-deep-amber text-chocolate-brown p-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-bold mb-2">🛒 Your Cart</h1>
          <p className="text-xl opacity-90">
            {getTotalItems()} items • Ready to checkout?
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card className="bg-cream-white border-2 border-golden-orange/20 shadow-xl">
              <CardHeader className="p-6">
                <h2 className="text-2xl font-bold text-chocolate-brown">
                  Order Items ({getTotalItems()})
                </h2>
              </CardHeader>
              <CardBody className="p-6 pt-0">
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id}>
                      <div className="flex items-center gap-4 p-4 bg-caramel-beige/10 rounded-xl">
                        <div className="text-5xl">{item.emoji}</div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-chocolate-brown">
                            {item.name}
                          </h3>
                          <Chip size="sm" color="default" variant="flat">
                            {item.category}
                          </Chip>
                          <p className="text-lg font-semibold text-deep-amber mt-1">
                            ${item.price.toFixed(2)} each
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            size="sm"
                            variant="bordered"
                            className="border-deep-amber text-deep-amber min-w-unit-10 font-bold text-lg"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="text-chocolate-brown font-bold text-xl min-w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            className="bg-golden-orange text-chocolate-brown min-w-unit-10 font-bold text-lg"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-chocolate-brown">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          <Button
                            size="sm"
                            color="danger"
                            variant="light"
                            onClick={() => updateQuantity(item.id, 0)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Divider className="my-6" />
                
                <Button
                  as={NextLink}
                  href="/"
                  size="lg"
                  variant="bordered"
                  className="w-full border-golden-orange text-chocolate-brown hover:bg-golden-orange/10 font-bold"
                >
                  + Add More Items
                </Button>
              </CardBody>
            </Card>
          </div>

          {/* Order Summary & Checkout */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card className="bg-cream-white border-2 border-golden-orange/20 shadow-xl">
              <CardHeader className="p-6">
                <h2 className="text-xl font-bold text-chocolate-brown">
                  📋 Order Information
                </h2>
              </CardHeader>
              <CardBody className="p-6 pt-0 space-y-4">
                <Input
                  label="Your Name"
                  placeholder="Enter your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  size="lg"
                  className="text-chocolate-brown"
                  classNames={{
                    input: "text-chocolate-brown",
                    label: "text-chocolate-brown/70",
                  }}
                />
                <Input
                  label="Phone Number (Optional)"
                  placeholder="For order updates"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  size="lg"
                  classNames={{
                    input: "text-chocolate-brown",
                    label: "text-chocolate-brown/70",
                  }}
                />
                <Input
                  label="Special Instructions (Optional)"
                  placeholder="Any special requests?"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  size="lg"
                  classNames={{
                    input: "text-chocolate-brown",
                    label: "text-chocolate-brown/70",
                  }}
                />
              </CardBody>
            </Card>

            {/* Order Summary */}
            <Card className="bg-cream-white border-2 border-golden-orange/20 shadow-xl">
              <CardHeader className="p-6">
                <h2 className="text-xl font-bold text-chocolate-brown">
                  💰 Order Summary
                </h2>
              </CardHeader>
              <CardBody className="p-6 pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between text-chocolate-brown">
                    <span>Subtotal ({getTotalItems()} items)</span>
                    <span className="font-semibold">${getSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-chocolate-brown">
                    <span>Tax (8%)</span>
                    <span className="font-semibold">${getTax().toFixed(2)}</span>
                  </div>
                  <Divider />
                  <div className="flex justify-between text-xl font-bold text-chocolate-brown">
                    <span>Total</span>
                    <span className="text-deep-amber">${getTotal().toFixed(2)}</span>
                  </div>
                </div>
                
                <Button
                  size="lg"
                  className="w-full mt-6 bg-golden-orange hover:bg-deep-amber text-chocolate-brown font-bold text-xl py-4"
                  onClick={handleCheckout}
                  isLoading={isProcessing}
                  disabled={!customerName.trim()}
                >
                  {isProcessing ? "Processing..." : `💳 Pay $${getTotal().toFixed(2)}`}
                </Button>
                
                <p className="text-xs text-chocolate-brown/60 text-center mt-3">
                  By placing this order, you agree to our terms and conditions
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        size="2xl"
        classNames={{
          base: "bg-cream-white",
          header: "border-b border-golden-orange/20",
          body: "py-6",
          footer: "border-t border-golden-orange/20",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-center">
                <div className="text-6xl mb-2">🎉</div>
                <h2 className="text-2xl font-bold text-chocolate-brown">
                  Order Successful!
                </h2>
              </ModalHeader>
              <ModalBody className="text-center">
                <p className="text-lg text-chocolate-brown mb-4">
                  Thank you, <strong>{customerName}</strong>!
                </p>
                <div className="bg-golden-orange/10 p-4 rounded-xl mb-4">
                  <p className="text-chocolate-brown font-semibold">
                    Order #GM-{Date.now().toString().slice(-6)}
                  </p>
                  <p className="text-chocolate-brown/70">
                    Total: ${getTotal().toFixed(2)}
                  </p>
                </div>
                <p className="text-chocolate-brown/80">
                  Your order is being prepared! Estimated ready time: <strong>15-20 minutes</strong>
                </p>
                <p className="text-sm text-chocolate-brown/60 mt-2">
                  We'll notify you when your order is ready for pickup.
                </p>
              </ModalBody>
              <ModalFooter className="flex justify-center gap-4">
                <Button
                  color="primary"
                  className="bg-golden-orange text-chocolate-brown font-bold"
                  onClick={handleNewOrder}
                >
                  🏠 Back to Menu
                </Button>
                <Button 
                  variant="bordered"
                  className="border-golden-orange text-chocolate-brown"
                  onClick={onClose}
                >
                  View Receipt
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}