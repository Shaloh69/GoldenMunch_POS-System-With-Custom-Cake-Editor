"use client";

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Divider } from '@heroui/divider';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { OrderService } from '@/services/order.service';
import type {
  OrderType,
  OrderSource,
  PaymentMethod,
  CreateOrderRequest,
  CustomerOrder
} from '@/types/api';

export default function CartPage() {
  const router = useRouter();
  const {
    items: cartItems,
    updateQuantity,
    removeItem,
    clearCart,
    getItemCount,
    getSubtotal,
    getTax,
    getTotal,
    getOrderItems
  } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [orderType, setOrderType] = useState<OrderType>('walk_in');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<CustomerOrder | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const getItemEmoji = (itemType: string): string => {
    const emojiMap: Record<string, string> = {
      cake: '🍰',
      pastry: '🥐',
      beverage: '☕',
      snack: '🍪',
      main_dish: '🍽️',
      appetizer: '🥗',
      dessert: '🍨',
      bread: '🍞',
      other: '🍴'
    };
    return emojiMap[itemType] || '🍴';
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const orderData: CreateOrderRequest = {
        order_type: orderType,
        order_source: 'kiosk',
        payment_method: paymentMethod,
        special_instructions: specialInstructions || undefined,
        items: getOrderItems(),
      };

      const order = await OrderService.createOrder(orderData);
      setCompletedOrder(order);
      clearCart();
      onOpen();
    } catch (err: any) {
      console.error('Error creating order:', err);
      setError(err.message || 'Failed to create order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewOrder = () => {
    setCustomerName("");
    setCustomerPhone("");
    setSpecialInstructions("");
    setOrderType('walk_in');
    setPaymentMethod('cash');
    setCompletedOrder(null);
    onOpenChange();
    router.push('/');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-mesh-gradient flex items-center justify-center p-6">
        <Card className="max-w-lg card-modern animate-scale-in">
          <CardBody className="text-center p-12">
            <div className="text-9xl mb-6 animate-float">🛒</div>
            <h1 className="text-5xl font-bold text-chocolate-brown mb-4">
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
                className="bg-gradient-to-r from-golden-orange to-deep-amber text-white font-bold text-xl px-10 py-7 shadow-xl-golden hover:scale-105 transition-transform"
              >
                🍰 Browse Our Menu
              </Button>
              <Button
                as={NextLink}
                href="/specials"
                size="lg"
                variant="bordered"
                className="border-2 border-golden-orange text-chocolate-brown hover:bg-golden-orange/10 font-bold text-lg px-10"
              >
                ⭐ View Today's Specials
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh-gradient">
      {/* Beautiful Header */}
      <div className="bg-gradient-to-r from-golden-orange via-deep-amber to-golden-orange shadow-xl-golden">
        <div className="max-w-7xl mx-auto p-8">
          <div className="flex items-center gap-4 animate-slide-right">
            <div className="text-7xl animate-bounce-slow">🛒</div>
            <div>
              <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">Your Cart</h1>
              <p className="text-xl text-white/90">
                {getItemCount()} {getItemCount() === 1 ? 'item' : 'items'} • Ready to checkout?
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-8 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="card-modern animate-slide-up">
              <CardHeader className="p-6 border-b border-golden-orange/20">
                <h2 className="text-3xl font-bold text-chocolate-brown flex items-center gap-2">
                  <span className="text-4xl">📦</span>
                  Your Order ({getItemCount()} items)
                </h2>
              </CardHeader>
              <CardBody className="p-6 space-y-4">
                {cartItems.map((item, index) => (
                  <div
                    key={`${item.menuItem.menu_item_id}-${item.flavor_id || 0}-${item.size_id || 0}`}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-white to-golden-orange/5 rounded-2xl border-2 border-golden-orange/20 hover:border-golden-orange/40 hover:shadow-lg transition-all">
                      {/* Item Image */}
                      <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-golden-orange/20 to-deep-amber/20 flex items-center justify-center flex-shrink-0">
                        <div className="text-5xl">
                          {item.menuItem.image_url || getItemEmoji(item.menuItem.item_type)}
                        </div>
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-chocolate-brown truncate">
                          {item.menuItem.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Chip size="sm" color="default" variant="flat">
                            {item.menuItem.item_type}
                          </Chip>
                          <span className="text-lg font-semibold text-deep-amber">
                            ${(Number(item.menuItem.current_price) || 0).toFixed(2)} each
                          </span>
                        </div>
                        {item.special_instructions && (
                          <p className="text-sm text-chocolate-brown/60 mt-2 italic">
                            📝 {item.special_instructions}
                          </p>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-3 bg-white rounded-full px-3 py-2 shadow-md">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            className="rounded-full bg-deep-amber/10 hover:bg-deep-amber hover:text-white text-deep-amber font-bold transition-all"
                            onClick={() => updateQuantity(item.menuItem.menu_item_id, item.quantity - 1)}
                          >
                            −
                          </Button>
                          <span className="text-xl font-bold text-chocolate-brown min-w-[32px] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            isIconOnly
                            size="sm"
                            className="rounded-full bg-golden-orange hover:bg-deep-amber text-white font-bold shadow-lg transition-all"
                            onClick={() => updateQuantity(item.menuItem.menu_item_id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>

                        {/* Item Total */}
                        <div className="text-center">
                          <p className="text-2xl font-bold text-chocolate-brown">
                            ${((Number(item.menuItem.current_price) || 0) * item.quantity).toFixed(2)}
                          </p>
                          <Button
                            size="sm"
                            color="danger"
                            variant="light"
                            className="text-xs"
                            onClick={() => removeItem(item.menuItem.menu_item_id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Divider className="my-6" />

                <Button
                  as={NextLink}
                  href="/"
                  size="lg"
                  variant="bordered"
                  className="w-full border-2 border-golden-orange text-chocolate-brown hover:bg-golden-orange/10 font-bold text-lg py-6"
                >
                  + Add More Items
                </Button>
              </CardBody>
            </Card>
          </div>

          {/* Checkout Section */}
          <div className="space-y-6">
            {/* Order Information */}
            <Card className="card-modern animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="p-6 bg-gradient-to-r from-golden-orange/10 to-deep-amber/10 border-b border-golden-orange/20">
                <h2 className="text-2xl font-bold text-chocolate-brown flex items-center gap-2">
                  <span className="text-3xl">📋</span>
                  Order Details
                </h2>
              </CardHeader>
              <CardBody className="p-6 space-y-4">
                <Input
                  label="Your Name (Optional)"
                  placeholder="Enter your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  size="lg"
                  variant="bordered"
                  classNames={{
                    input: "text-chocolate-brown",
                    label: "text-chocolate-brown/70 font-semibold",
                    inputWrapper: "border-2 hover:border-golden-orange"
                  }}
                />
                <Input
                  label="Phone Number (Optional)"
                  placeholder="For order updates"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  size="lg"
                  variant="bordered"
                  classNames={{
                    input: "text-chocolate-brown",
                    label: "text-chocolate-brown/70 font-semibold",
                    inputWrapper: "border-2 hover:border-golden-orange"
                  }}
                />
                <Select
                  label="Order Type"
                  placeholder="Select order type"
                  selectedKeys={[orderType]}
                  onChange={(e) => setOrderType(e.target.value as OrderType)}
                  size="lg"
                  variant="bordered"
                  classNames={{
                    label: "text-chocolate-brown/70 font-semibold",
                    value: "text-chocolate-brown",
                    trigger: "border-2 hover:border-golden-orange"
                  }}
                >
                  <SelectItem key="walk_in" value="walk_in">🏪 Walk-in</SelectItem>
                  <SelectItem key="pickup" value="pickup">🚗 Pickup</SelectItem>
                  <SelectItem key="pre_order" value="pre_order">📅 Pre-order</SelectItem>
                </Select>
                <Select
                  label="Payment Method"
                  placeholder="Select payment method"
                  selectedKeys={[paymentMethod]}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  size="lg"
                  variant="bordered"
                  classNames={{
                    label: "text-chocolate-brown/70 font-semibold",
                    value: "text-chocolate-brown",
                    trigger: "border-2 hover:border-golden-orange"
                  }}
                >
                  <SelectItem key="cash" value="cash">💵 Cash</SelectItem>
                  <SelectItem key="gcash" value="gcash">📱 GCash</SelectItem>
                  <SelectItem key="paymaya" value="paymaya">💳 PayMaya</SelectItem>
                  <SelectItem key="card" value="card">💳 Card</SelectItem>
                </Select>
                <Input
                  label="Special Instructions (Optional)"
                  placeholder="Any special requests?"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  size="lg"
                  variant="bordered"
                  classNames={{
                    input: "text-chocolate-brown",
                    label: "text-chocolate-brown/70 font-semibold",
                    inputWrapper: "border-2 hover:border-golden-orange"
                  }}
                />
              </CardBody>
            </Card>

            {/* Order Summary */}
            <Card className="card-modern animate-slide-up sticky top-24" style={{ animationDelay: '0.3s' }}>
              <CardHeader className="p-6 bg-gradient-to-r from-golden-orange to-deep-amber">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="text-3xl">💰</span>
                  Order Summary
                </h2>
              </CardHeader>
              <CardBody className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-lg text-chocolate-brown">
                    <span>Subtotal ({getItemCount()} items)</span>
                    <span className="font-semibold">${getSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg text-chocolate-brown">
                    <span>Tax (12% VAT)</span>
                    <span className="font-semibold">${getTax().toFixed(2)}</span>
                  </div>
                  <Divider className="my-4" />
                  <div className="flex justify-between text-2xl font-bold">
                    <span className="text-chocolate-brown">Total</span>
                    <span className="bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
                      ${getTotal().toFixed(2)}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-xl animate-scale-in">
                    <p className="text-red-700 font-semibold">⚠️ {error}</p>
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full mt-6 bg-gradient-to-r from-golden-orange to-deep-amber text-white font-bold text-xl py-7 shadow-2xl hover:scale-105 transition-transform"
                  onClick={handleCheckout}
                  isLoading={isProcessing}
                >
                  {isProcessing ? "Processing..." : `💳 Place Order - $${getTotal().toFixed(2)}`}
                </Button>

                <p className="text-xs text-chocolate-brown/60 text-center mt-3">
                  🔒 Secure checkout • By placing this order, you agree to our terms
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      {/* Success Modal with Confetti Effect */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="2xl"
        isDismissable={false}
        classNames={{
          base: "bg-mesh-gradient",
          header: "border-b-0",
          body: "py-8",
          footer: "border-t-0"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-center pt-8">
                <div className="text-8xl mb-4 animate-bounce-slow">🎉</div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
                  Order Successful!
                </h2>
              </ModalHeader>
              <ModalBody className="text-center px-8">
                {completedOrder && (
                  <>
                    <p className="text-2xl text-chocolate-brown mb-6 font-semibold">
                      Thank you for your order! 🙏
                    </p>
                    <Card className="card-modern mb-6 animate-scale-in">
                      <CardBody className="p-8">
                        <p className="text-chocolate-brown/70 text-lg mb-3">
                          Order Number
                        </p>
                        <p className="text-2xl font-bold text-chocolate-brown mb-6">
                          #{completedOrder.order_number}
                        </p>

                        <div className="bg-gradient-to-r from-golden-orange to-deep-amber p-6 rounded-2xl mb-4">
                          <p className="text-white/90 text-sm mb-2">
                            Your Verification Code
                          </p>
                          <p className="text-5xl font-black text-white tracking-wider selectable">
                            {completedOrder.verification_code}
                          </p>
                          <p className="text-white/80 text-xs mt-3">
                            📋 Please save this code
                          </p>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-golden-orange/10 rounded-xl">
                          <span className="text-chocolate-brown font-semibold">Total Amount</span>
                          <span className="text-2xl font-bold bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
                            ${completedOrder.final_amount.toFixed(2)}
                          </span>
                        </div>
                      </CardBody>
                    </Card>

                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-4">
                      <p className="text-blue-900 font-semibold mb-2">
                        ✨ Your order is being prepared!
                      </p>
                      <p className="text-blue-700 text-sm">
                        Present your verification code at the counter when ready
                      </p>
                    </div>
                  </>
                )}
              </ModalBody>
              <ModalFooter className="flex justify-center gap-4 pb-8">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-golden-orange to-deep-amber text-white font-bold px-10 shadow-xl"
                  onClick={handleNewOrder}
                >
                  🏠 Back to Menu
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Spacer */}
      <div className="h-20"></div>
    </div>
  );
}
