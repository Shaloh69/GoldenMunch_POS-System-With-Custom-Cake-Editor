"use client";

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Divider } from '@heroui/divider';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { OrderService } from '@/services/order.service';
import { printerService } from '@/services/printer.service';
import { SettingsService } from '@/services/settings.service';
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
  const [orderType, setOrderType] = useState<OrderType>('takeout');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [referenceNumber, setReferenceNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<CustomerOrder | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // QR Code state
  const { isOpen: isQROpen, onOpen: onQROpen, onClose: onQRClose } = useDisclosure();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [showReferenceInput, setShowReferenceInput] = useState(false);

  // Fetch QR code when payment method changes to cashless
  useEffect(() => {
    if (paymentMethod === 'cashless') {
      fetchQRCode();
      setShowReferenceInput(false);
    } else {
      setQrCodeUrl(null);
      setShowReferenceInput(false);
      setReferenceNumber(''); // Clear reference number for cash payments
    }
  }, [paymentMethod]);

  const fetchQRCode = async () => {
    setLoadingQR(true);
    try {
      const url = await SettingsService.getPaymentQR('cashless');
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Failed to fetch cashless payment QR code:', error);
      setQrCodeUrl(null);
    } finally {
      setLoadingQR(false);
    }
  };

  const handleShowQRCode = () => {
    if (qrCodeUrl) {
      onQROpen();
    } else {
      setError(`No ${paymentMethod.toUpperCase()} QR code configured. Please contact staff.`);
    }
  };

  const handlePaymentComplete = () => {
    onQRClose();
    setShowReferenceInput(true);
  };

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

    // Validate reference number for cashless payments
    if (paymentMethod === 'cashless' && !referenceNumber.trim()) {
      setError('Please enter your payment reference number');
      setIsProcessing(false);
      return;
    }

    try {
      const orderData: CreateOrderRequest = {
        order_type: orderType,
        order_source: 'kiosk',
        payment_method: paymentMethod,
        payment_reference_number: referenceNumber.trim() || undefined,
        special_instructions: specialInstructions || undefined,
        items: getOrderItems(),
      };

      const order = await OrderService.createOrder(orderData);
      setCompletedOrder(order);
      clearCart();
      onOpen();

      // ✅ FIX: Print receipt after successful order creation
      try {
        console.log('🖨️ Attempting to print receipt...');
        const receiptData = printerService.formatOrderForPrint({
          ...order,
          items: cartItems.map(item => ({
            name: item.menuItem.name,
            quantity: item.quantity,
            unit_price: item.menuItem.current_price,
            special_instructions: item.special_instructions
          })),
          total_amount: getSubtotal(),
          tax_amount: getTax(),
          final_amount: getTotal(),
          discount_amount: 0
        });

        const printResult = await printerService.printReceipt(receiptData);
        if (printResult.success) {
          console.log('✅ Receipt printed successfully');
        } else {
          console.warn('⚠️ Receipt printing failed:', printResult.error);
          // Don't block order completion if printing fails
        }
      } catch (printErr) {
        console.error('❌ Receipt printing error:', printErr);
        // Don't block order completion if printing fails
      }
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
    setOrderType('takeout');
    setPaymentMethod('cash');
    setReferenceNumber("");
    setCompletedOrder(null);
    onOpenChange();
    router.push('/');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-lg bg-gradient-to-br from-pure-white/90 via-sunny-yellow/10 to-deep-orange-yellow/15 backdrop-blur-lg border-2 border-sunny-yellow/60 shadow-xl animate-scale-in">
          <CardBody className="text-center p-12">
            <div className="text-9xl mb-6 animate-float drop-shadow-xl">🛒</div>
            <h1 className="text-5xl font-bold text-black mb-4 drop-shadow-lg">
              Your Cart is Empty
            </h1>
            <p className="text-xl text-black mb-8">
              Looks like you haven't added any delicious treats yet!
            </p>
            <div className="flex flex-col gap-4">
              <Button
                as={NextLink}
                href="/"
                size="lg"
                className="bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow text-black font-bold text-xl px-10 py-7 shadow-xl hover:scale-105 transition-transform"
              >
                🍰 Browse Our Menu
              </Button>
              <Button
                as={NextLink}
                href="/specials"
                size="lg"
                variant="bordered"
                className="border-2 border-sunny-yellow/60 text-black hover:bg-sunny-yellow/10 font-bold text-lg px-10"
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
    <div className="min-h-screen">
      {/* Beautiful Header */}
      <div className="bg-gradient-to-br from-sunny-yellow/25 via-pure-white/20 to-deep-orange-yellow/25 backdrop-blur-sm border-b-4 border-sunny-yellow shadow-lg">
        <div className="max-w-7xl mx-auto p-8">
          <div className="flex items-center gap-4 animate-slide-right">
            <div className="text-7xl animate-bounce-slow">🛒</div>
            <div>
              <h1 className="text-5xl font-bold text-black mb-2 drop-shadow-lg">Your Cart</h1>
              <p className="text-xl text-black font-semibold">
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
            <Card className="bg-gradient-to-br from-pure-white/90 via-sunny-yellow/10 to-deep-orange-yellow/15 backdrop-blur-lg border-2 border-sunny-yellow/60 shadow-xl animate-slide-up">
              <CardHeader className="p-6 border-b-2 border-sunny-yellow/30">
                <h2 className="text-3xl font-bold text-black flex items-center gap-2 drop-shadow-lg">
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
                    <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-pure-white/95 to-sunny-yellow/10 rounded-2xl hover:scale-[1.02] transition-all border-2 border-sunny-yellow/40 hover:border-sunny-yellow shadow-md">
                      {/* Item Image - Fixed to show actual images */}
                      <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-sunny-yellow/30 to-deep-orange-yellow/30 flex items-center justify-center flex-shrink-0 shadow-inner overflow-hidden">
                        {item.menuItem.image_url ? (
                          <Image
                            src={item.menuItem.image_url}
                            alt={item.menuItem.name}
                            width={96}
                            height={96}
                            className="object-cover w-full h-full"
                            unoptimized
                          />
                        ) : (
                          <div className="text-5xl">
                            {getItemEmoji(item.menuItem.item_type)}
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-black truncate drop-shadow-sm">
                          {item.menuItem.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Chip size="sm" variant="flat" className="bg-sunny-yellow text-black font-semibold border border-sunny-yellow/60 shadow-sm">
                            {item.menuItem.item_type}
                          </Chip>
                          <span className="text-lg font-semibold text-black">
                            ₱{(Number(item.menuItem.current_price) || 0).toFixed(2)} each
                          </span>
                        </div>
                        {item.special_instructions && (
                          <p className="text-sm text-black mt-2 italic">
                            📝 {item.special_instructions}
                          </p>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-3 bg-sunny-yellow/20 rounded-full px-3 py-2 border-2 border-sunny-yellow/50 shadow-md">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            className="rounded-full bg-deep-orange-yellow/40 hover:bg-deep-orange-yellow text-black font-bold transition-all"
                            onClick={() => updateQuantity(item.menuItem.menu_item_id, item.quantity - 1)}
                          >
                            −
                          </Button>
                          <span className="text-xl font-bold text-black min-w-[32px] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            isIconOnly
                            size="sm"
                            className="rounded-full bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow text-black font-bold shadow-lg transition-all hover:scale-110"
                            onClick={() => updateQuantity(item.menuItem.menu_item_id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>

                        {/* Item Total */}
                        <div className="text-center">
                          <p className="text-2xl font-bold text-black drop-shadow-sm">
                            ₱{((Number(item.menuItem.current_price) || 0) * item.quantity).toFixed(2)}
                          </p>
                          <Button
                            size="sm"
                            variant="light"
                            className="text-xs text-black hover:text-black font-semibold underline"
                            onClick={() => removeItem(item.menuItem.menu_item_id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Divider className="my-6 bg-sunny-yellow/30" />

                <Button
                  as={NextLink}
                  href="/"
                  size="lg"
                  variant="bordered"
                  className="w-full border-2 border-sunny-yellow/60 text-black hover:bg-sunny-yellow/10 hover:border-sunny-yellow font-bold text-lg py-6 shadow-md"
                >
                  + Add More Items
                </Button>
              </CardBody>
            </Card>
          </div>

          {/* Checkout Section */}
          <div className="space-y-6">
            {/* Order Information */}
            <Card className="bg-gradient-to-br from-pure-white/90 via-sunny-yellow/10 to-deep-orange-yellow/15 backdrop-blur-lg border-2 border-sunny-yellow/60 shadow-xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="p-6 bg-gradient-to-r from-sunny-yellow/30 to-deep-orange-yellow/30 border-b-2 border-sunny-yellow/50">
                <h2 className="text-2xl font-bold text-black flex items-center gap-2 drop-shadow-lg">
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
                    input: "text-black",
                    label: "text-black font-semibold",
                    inputWrapper: "border-2 border-sunny-yellow/60 hover:border-sunny-yellow bg-pure-white/50 shadow-sm"
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
                    input: "text-black",
                    label: "text-black font-semibold",
                    inputWrapper: "border-2 border-sunny-yellow/60 hover:border-sunny-yellow bg-pure-white/50 shadow-sm"
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
                    label: "text-black font-semibold",
                    value: "text-black font-semibold",
                    trigger: "border-2 border-sunny-yellow/60 hover:border-sunny-yellow bg-pure-white/50 shadow-sm text-black",
                    listboxWrapper: "text-black",
                    popoverContent: "text-black"
                  }}
                >
                  <SelectItem key="dine_in" value="dine_in" className="text-black">🍽️ Dine In</SelectItem>
                  <SelectItem key="takeout" value="takeout" className="text-black">🚗 Takeout</SelectItem>
                  <SelectItem key="delivery" value="delivery" className="text-black">🚚 Delivery</SelectItem>
                </Select>
                <Select
                  label="Payment Method"
                  placeholder="Select payment method"
                  selectedKeys={[paymentMethod]}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  size="lg"
                  variant="bordered"
                  classNames={{
                    label: "text-black font-semibold",
                    value: "text-black font-semibold",
                    trigger: "border-2 border-sunny-yellow/60 hover:border-sunny-yellow bg-pure-white/50 shadow-sm text-black",
                    listboxWrapper: "text-black",
                    popoverContent: "text-black"
                  }}
                >
                  <SelectItem key="cash" value="cash" className="text-black">💵 Cash Payment</SelectItem>
                  <SelectItem key="cashless" value="cashless" className="text-black">📱 Cashless Payment (GCash, PayMaya, Bank)</SelectItem>
                </Select>

                {/* Show QR code and reference number input for cashless payments */}
                {paymentMethod === 'cashless' && (
                  <div className="space-y-4">
                    {/* Show QR Code Button */}
                    {!showReferenceInput && (
                      <Button
                        size="lg"
                        className="w-full bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow text-black font-bold shadow-lg hover:scale-105 transition-all"
                        onPress={handleShowQRCode}
                        isLoading={loadingQR}
                      >
                        {loadingQR ? 'Loading QR Code...' : '📱 Show Payment QR Code'}
                      </Button>
                    )}

                    {/* Reference Number Input - shows after payment */}
                    {showReferenceInput && (
                      <div className="space-y-3">
                        <div className="bg-sunny-yellow/20 p-4 rounded-lg border-2 border-sunny-yellow/60 shadow-md">
                          <p className="text-sm text-black font-semibold">
                            ✅ Payment Complete? Enter your reference number below:
                          </p>
                        </div>
                        <Input
                          label="Reference Number *"
                          placeholder="Enter your payment reference number"
                          value={referenceNumber}
                          onChange={(e) => setReferenceNumber(e.target.value)}
                          size="lg"
                          variant="bordered"
                          required
                          classNames={{
                            input: "text-black",
                            label: "text-black font-semibold",
                            inputWrapper: "border-2 border-sunny-yellow/60 hover:border-sunny-yellow bg-pure-white/50 shadow-sm"
                          }}
                          description="Enter the reference number from your payment confirmation"
                        />
                        <Button
                          size="sm"
                          variant="flat"
                          className="w-full bg-sunny-yellow/20 text-black hover:bg-sunny-yellow/30 font-semibold"
                          onPress={() => setShowReferenceInput(false)}
                        >
                          View QR Code Again
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <Input
                  label="Special Instructions (Optional)"
                  placeholder="Any special requests?"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  size="lg"
                  variant="bordered"
                  classNames={{
                    input: "text-black",
                    label: "text-black font-semibold",
                    inputWrapper: "border-2 border-sunny-yellow/60 hover:border-sunny-yellow bg-pure-white/50 shadow-sm"
                  }}
                />
              </CardBody>
            </Card>

            {/* Order Summary */}
            <Card className="bg-gradient-to-br from-pure-white/90 via-sunny-yellow/10 to-deep-orange-yellow/15 backdrop-blur-lg border-2 border-sunny-yellow/60 shadow-xl animate-slide-up sticky top-24" style={{ animationDelay: '0.3s' }}>
              <CardHeader className="p-6 bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow">
                <h2 className="text-2xl font-bold text-black flex items-center gap-2 drop-shadow-lg">
                  <span className="text-3xl">💰</span>
                  Order Summary
                </h2>
              </CardHeader>
              <CardBody className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-2xl font-bold">
                    <span className="text-black">Total ({getItemCount()} items)</span>
                    <span className="text-black">
                      ₱{getTotal().toFixed(2)}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-500/20 border-2 border-red-500 rounded-xl animate-scale-in">
                    <p className="text-black font-semibold">⚠️ {error}</p>
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full mt-6 bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow text-black font-bold text-xl py-7 shadow-xl hover:scale-105 transition-transform"
                  onClick={handleCheckout}
                  isLoading={isProcessing}
                >
                  {isProcessing ? "Processing..." : `💳 Place Order - ₱${getTotal().toFixed(2)}`}
                </Button>

                <p className="text-xs text-black text-center mt-3 font-semibold">
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
          base: "bg-gradient-to-br from-pure-white/95 via-sunny-yellow/20 to-deep-orange-yellow/25 backdrop-blur-xl border-4 border-sunny-yellow shadow-2xl",
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
                <h2 className="text-4xl font-bold text-black drop-shadow-lg">
                  Order Successful!
                </h2>
              </ModalHeader>
              <ModalBody className="text-center px-8">
                {completedOrder && (
                  <>
                    <p className="text-2xl text-black mb-6 font-semibold">
                      Thank you for your order! 🙏
                    </p>
                    <Card className="bg-gradient-to-br from-pure-white/90 to-sunny-yellow/20 mb-6 animate-scale-in border-2 border-sunny-yellow/60 shadow-lg">
                      <CardBody className="p-8">
                        <p className="text-black text-lg mb-3 font-semibold">
                          Order Number
                        </p>
                        <p className="text-2xl font-bold text-black mb-6 drop-shadow-sm">
                          #{completedOrder.order_number || completedOrder.order_id}
                        </p>

                        <div className="bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow p-6 rounded-2xl mb-4 shadow-xl">
                          <p className="text-black text-sm mb-2 font-semibold">
                            Your Verification Code
                          </p>
                          <p className="text-5xl font-black text-black tracking-wider selectable drop-shadow-lg">
                            {completedOrder.verification_code || completedOrder.order_id.toString().padStart(6, '0')}
                          </p>
                          <p className="text-black text-xs mt-3 font-semibold">
                            📋 Please save this code
                          </p>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-sunny-yellow/20 rounded-xl border-2 border-sunny-yellow/60 shadow-md">
                          <span className="text-black font-semibold">Total Amount</span>
                          <span className="text-2xl font-bold text-black">
                            ₱{completedOrder.final_amount.toFixed(2)}
                          </span>
                        </div>
                      </CardBody>
                    </Card>

                    <div className="bg-sunny-yellow/20 border-2 border-sunny-yellow/60 rounded-xl p-6 mb-4 shadow-md">
                      <p className="text-black font-semibold mb-2">
                        ✨ Your order is being prepared!
                      </p>
                      <p className="text-black text-sm">
                        Present your verification code at the counter when ready
                      </p>
                    </div>
                  </>
                )}
              </ModalBody>
              <ModalFooter className="flex justify-center gap-4 pb-8">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow text-black font-bold px-10 shadow-xl hover:scale-105 transition-all"
                  onClick={handleNewOrder}
                >
                  🏠 Back to Menu
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* QR Code Payment Modal */}
      <Modal
        isOpen={isQROpen}
        onClose={onQRClose}
        size="2xl"
        backdrop="blur"
        classNames={{
          backdrop: "bg-charcoal-gray/90",
          base: "bg-gradient-to-br from-pure-white/95 via-sunny-yellow/20 to-deep-orange-yellow/25 backdrop-blur-xl border-4 border-sunny-yellow shadow-2xl"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold capitalize text-black">{paymentMethod} Payment</h2>
            <p className="text-sm text-black font-normal">
              Scan this QR code with your {paymentMethod === 'gcash' ? 'GCash' : 'PayMaya'} app
            </p>
          </ModalHeader>
          <ModalBody className="py-6">
            {qrCodeUrl ? (
              <div className="space-y-6">
                {/* QR Code Display */}
                <div className="flex justify-center">
                  <div className="relative w-full max-w-md aspect-square bg-pure-white rounded-xl p-6 shadow-lg border-4 border-sunny-yellow">
                    <Image
                      src={qrCodeUrl}
                      alt={`${paymentMethod.toUpperCase()} QR Code`}
                      fill
                      className="object-contain p-4"
                      priority
                    />
                  </div>
                </div>

                {/* Amount Display */}
                <div className="bg-sunny-yellow/20 p-6 rounded-xl border-2 border-sunny-yellow/60 text-center shadow-md">
                  <p className="text-sm text-black mb-2 font-semibold">Amount to Pay:</p>
                  <p className="text-4xl font-bold text-black drop-shadow-sm">
                    ₱{getTotal().toFixed(2)}
                  </p>
                </div>

                {/* Instructions */}
                <div className="bg-gradient-to-br from-pure-white/90 to-sunny-yellow/10 p-4 rounded-lg border-2 border-sunny-yellow/60 shadow-md">
                  <h3 className="font-semibold text-black mb-3">Payment Instructions:</h3>
                  <ol className="text-sm text-black space-y-2 list-decimal list-inside">
                    <li>Open your {paymentMethod === 'gcash' ? 'GCash' : 'PayMaya'} app</li>
                    <li>Tap "Scan QR" in your app</li>
                    <li>Scan the QR code shown above</li>
                    <li>Verify the amount: ₱{getTotal().toFixed(2)}</li>
                    <li>Complete the payment in your app</li>
                    <li>Save the reference number from your receipt</li>
                    <li>Click "I've Paid" below to continue</li>
                  </ol>
                </div>

                <div className="bg-red-500/20 p-3 rounded-lg border-2 border-red-500/60 shadow-md">
                  <p className="text-sm text-black text-center">
                    ⚠️ <strong>Important:</strong> Make sure to complete the payment and get your reference number before clicking "I've Paid"
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-black font-semibold">QR Code not available</p>
                <p className="text-sm text-black mt-2">
                  Please contact staff for assistance with {paymentMethod} payments
                </p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              className="text-black hover:text-black font-semibold"
              onPress={onQRClose}
            >
              Cancel
            </Button>
            <Button
              size="lg"
              className="bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow text-black font-bold shadow-lg hover:scale-105 transition-all"
              onPress={handlePaymentComplete}
              isDisabled={!qrCodeUrl}
            >
              ✅ I've Paid - Enter Reference Number
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Spacer */}
      <div className="h-20"></div>
    </div>
  );
}
