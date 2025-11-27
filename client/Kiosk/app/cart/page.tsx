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
    if (paymentMethod === 'gcash' || paymentMethod === 'paymaya') {
      fetchQRCode(paymentMethod);
      setShowReferenceInput(false);
    } else {
      setQrCodeUrl(null);
      setShowReferenceInput(false);
    }
  }, [paymentMethod]);

  const fetchQRCode = async (method: 'gcash' | 'paymaya') => {
    setLoadingQR(true);
    try {
      const url = await SettingsService.getPaymentQR(method);
      setQrCodeUrl(url);
    } catch (error) {
      console.error(`Failed to fetch ${method} QR code:`, error);
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

    // ✅ FIX: Validate reference number for cashless payments
    if ((paymentMethod === 'gcash' || paymentMethod === 'paymaya') && !referenceNumber.trim()) {
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
        <Card className="max-w-lg glass-card animate-scale-in">
          <CardBody className="text-center p-12">
            <div className="text-9xl mb-6 animate-float">🛒</div>
            <h1 className="text-5xl font-bold text-[#FAF7F2] mb-4 drop-shadow-lg">
              Your Cart is Empty
            </h1>
            <p className="text-xl text-[#EAD7B7] mb-8">
              Looks like you haven't added any delicious treats yet!
            </p>
            <div className="flex flex-col gap-4">
              <Button
                as={NextLink}
                href="/"
                size="lg"
                className="bg-gradient-to-r from-[#7B4B28] to-[#662B35] text-[#FAF7F2] font-bold text-xl px-10 py-7 shadow-[0_0_30px_rgba(234,215,183,0.4)] hover:scale-105 transition-transform"
              >
                🍰 Browse Our Menu
              </Button>
              <Button
                as={NextLink}
                href="/specials"
                size="lg"
                variant="bordered"
                className="border-2 border-[#EAD7B7]/60 text-[#FAF7F2] hover:bg-[#EAD7B7]/10 font-bold text-lg px-10"
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
      <div className="glass-header border-b-4 border-[#EAD7B7]/30">
        <div className="max-w-7xl mx-auto p-8">
          <div className="flex items-center gap-4 animate-slide-right">
            <div className="text-7xl animate-bounce-slow">🛒</div>
            <div>
              <h1 className="text-5xl font-bold text-[#FAF7F2] mb-2 drop-shadow-lg">Your Cart</h1>
              <p className="text-xl text-[#EAD7B7]">
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
            <Card className="glass-card animate-slide-up">
              <CardHeader className="p-6 border-b border-[#EAD7B7]/20">
                <h2 className="text-3xl font-bold text-[#FAF7F2] flex items-center gap-2 drop-shadow-lg">
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
                    <div className="flex items-center gap-4 p-5 glass-button rounded-2xl hover:scale-[1.02] transition-all border-2 border-[#EAD7B7]/20 hover:border-[#EAD7B7]/40">
                      {/* Item Image */}
                      <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-[#7B4B28]/20 to-[#662B35]/20 flex items-center justify-center flex-shrink-0">
                        <div className="text-5xl">
                          {item.menuItem.image_url || getItemEmoji(item.menuItem.item_type)}
                        </div>
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-[#FAF7F2] truncate drop-shadow-md">
                          {item.menuItem.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Chip size="sm" variant="flat" className="bg-[#EAD7B7]/20 text-[#FAF7F2] border border-[#EAD7B7]/30">
                            {item.menuItem.item_type}
                          </Chip>
                          <span className="text-lg font-semibold text-[#EAD7B7]">
                            ₱{(Number(item.menuItem.current_price) || 0).toFixed(2)} each
                          </span>
                        </div>
                        {item.special_instructions && (
                          <p className="text-sm text-[#EAD7B7]/80 mt-2 italic">
                            📝 {item.special_instructions}
                          </p>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-3 glass-button rounded-full px-3 py-2 border border-[#EAD7B7]/30">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            className="rounded-full bg-[#662B35]/30 hover:bg-[#662B35] text-[#FAF7F2] font-bold transition-all"
                            onClick={() => updateQuantity(item.menuItem.menu_item_id, item.quantity - 1)}
                          >
                            −
                          </Button>
                          <span className="text-xl font-bold text-[#FAF7F2] min-w-[32px] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            isIconOnly
                            size="sm"
                            className="rounded-full bg-gradient-to-r from-[#7B4B28] to-[#662B35] text-[#FAF7F2] font-bold shadow-lg transition-all"
                            onClick={() => updateQuantity(item.menuItem.menu_item_id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>

                        {/* Item Total */}
                        <div className="text-center">
                          <p className="text-2xl font-bold text-[#FAF7F2] drop-shadow-lg">
                            ₱{((Number(item.menuItem.current_price) || 0) * item.quantity).toFixed(2)}
                          </p>
                          <Button
                            size="sm"
                            variant="light"
                            className="text-xs text-[#662B35] hover:text-[#FAF7F2]"
                            onClick={() => removeItem(item.menuItem.menu_item_id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Divider className="my-6 bg-[#EAD7B7]/20" />

                <Button
                  as={NextLink}
                  href="/"
                  size="lg"
                  variant="bordered"
                  className="w-full border-2 border-[#EAD7B7]/60 text-[#FAF7F2] hover:bg-[#EAD7B7]/10 font-bold text-lg py-6"
                >
                  + Add More Items
                </Button>
              </CardBody>
            </Card>
          </div>

          {/* Checkout Section */}
          <div className="space-y-6">
            {/* Order Information */}
            <Card className="glass-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="p-6 bg-gradient-to-r from-[#7B4B28]/20 to-[#662B35]/20 border-b border-[#EAD7B7]/20">
                <h2 className="text-2xl font-bold text-[#FAF7F2] flex items-center gap-2 drop-shadow-lg">
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
                    input: "text-[#FAF7F2]",
                    label: "text-[#EAD7B7] font-semibold",
                    inputWrapper: "border-2 border-[#EAD7B7]/40 hover:border-[#EAD7B7] bg-[#3A1F0F]/20"
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
                    input: "text-[#FAF7F2]",
                    label: "text-[#EAD7B7] font-semibold",
                    inputWrapper: "border-2 border-[#EAD7B7]/40 hover:border-[#EAD7B7] bg-[#3A1F0F]/20"
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
                    label: "text-[#EAD7B7] font-semibold",
                    value: "text-[#FAF7F2]",
                    trigger: "border-2 border-[#EAD7B7]/40 hover:border-[#EAD7B7] bg-[#3A1F0F]/20"
                  }}
                >
                  <SelectItem key="dine_in" value="dine_in">🍽️ Dine In</SelectItem>
                  <SelectItem key="takeout" value="takeout">🚗 Takeout</SelectItem>
                  <SelectItem key="delivery" value="delivery">🚚 Delivery</SelectItem>
                </Select>
                <Select
                  label="Payment Method"
                  placeholder="Select payment method"
                  selectedKeys={[paymentMethod]}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  size="lg"
                  variant="bordered"
                  classNames={{
                    label: "text-[#EAD7B7] font-semibold",
                    value: "text-[#FAF7F2]",
                    trigger: "border-2 border-[#EAD7B7]/40 hover:border-[#EAD7B7] bg-[#3A1F0F]/20"
                  }}
                >
                  <SelectItem key="cash" value="cash">💵 Cash</SelectItem>
                  <SelectItem key="gcash" value="gcash">📱 GCash</SelectItem>
                  <SelectItem key="paymaya" value="paymaya">💳 PayMaya</SelectItem>
                  <SelectItem key="card" value="card">💳 Card</SelectItem>
                </Select>

                {/* ✅ FIX: Show QR code and reference number input for cashless payments */}
                {(paymentMethod === 'gcash' || paymentMethod === 'paymaya') && (
                  <div className="space-y-4">
                    {/* Show QR Code Button */}
                    {!showReferenceInput && (
                      <Button
                        size="lg"
                        className="w-full bg-gradient-to-r from-[#7B4B28] to-[#662B35] text-[#FAF7F2] font-bold"
                        onPress={handleShowQRCode}
                        isLoading={loadingQR}
                      >
                        {loadingQR ? 'Loading QR Code...' : `Show ${paymentMethod.toUpperCase()} QR Code`}
                      </Button>
                    )}

                    {/* Reference Number Input - shows after payment */}
                    {showReferenceInput && (
                      <div className="space-y-3">
                        <div className="glass-button p-4 rounded-lg border-2 border-[#7B4B28]/50">
                          <p className="text-sm text-[#FAF7F2] font-semibold">
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
                            input: "text-[#FAF7F2]",
                            label: "text-[#EAD7B7] font-semibold",
                            inputWrapper: "border-2 border-[#EAD7B7]/40 hover:border-[#EAD7B7] bg-[#3A1F0F]/20"
                          }}
                          description="Enter the reference number from your payment confirmation"
                        />
                        <Button
                          size="sm"
                          variant="flat"
                          className="w-full bg-[#EAD7B7]/20 text-[#FAF7F2]"
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
                    input: "text-[#FAF7F2]",
                    label: "text-[#EAD7B7] font-semibold",
                    inputWrapper: "border-2 border-[#EAD7B7]/40 hover:border-[#EAD7B7] bg-[#3A1F0F]/20"
                  }}
                />
              </CardBody>
            </Card>

            {/* Order Summary */}
            <Card className="glass-card animate-slide-up sticky top-24" style={{ animationDelay: '0.3s' }}>
              <CardHeader className="p-6 bg-gradient-to-r from-[#7B4B28] to-[#662B35]">
                <h2 className="text-2xl font-bold text-[#FAF7F2] flex items-center gap-2 drop-shadow-lg">
                  <span className="text-3xl">💰</span>
                  Order Summary
                </h2>
              </CardHeader>
              <CardBody className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-2xl font-bold">
                    <span className="text-[#FAF7F2]">Total ({getItemCount()} items)</span>
                    <span className="bg-gradient-to-r from-[#EAD7B7] to-[#7B4B28] bg-clip-text text-transparent drop-shadow-lg">
                      ₱{getTotal().toFixed(2)}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-[#662B35]/30 border-2 border-[#662B35] rounded-xl animate-scale-in">
                    <p className="text-[#FAF7F2] font-semibold">⚠️ {error}</p>
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full mt-6 bg-gradient-to-r from-[#7B4B28] to-[#662B35] text-[#FAF7F2] font-bold text-xl py-7 shadow-[0_0_30px_rgba(234,215,183,0.4)] hover:scale-105 transition-transform"
                  onClick={handleCheckout}
                  isLoading={isProcessing}
                >
                  {isProcessing ? "Processing..." : `💳 Place Order - ₱${getTotal().toFixed(2)}`}
                </Button>

                <p className="text-xs text-[#EAD7B7] text-center mt-3">
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
          base: "glass-card",
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
                <h2 className="text-4xl font-bold bg-gradient-to-r from-[#EAD7B7] to-[#7B4B28] bg-clip-text text-transparent drop-shadow-lg">
                  Order Successful!
                </h2>
              </ModalHeader>
              <ModalBody className="text-center px-8">
                {completedOrder && (
                  <>
                    <p className="text-2xl text-[#FAF7F2] mb-6 font-semibold">
                      Thank you for your order! 🙏
                    </p>
                    <Card className="glass-button mb-6 animate-scale-in border-2 border-[#EAD7B7]/30">
                      <CardBody className="p-8">
                        <p className="text-[#EAD7B7] text-lg mb-3">
                          Order Number
                        </p>
                        <p className="text-2xl font-bold text-[#FAF7F2] mb-6 drop-shadow-lg">
                          #{completedOrder.order_number || completedOrder.order_id}
                        </p>

                        <div className="bg-gradient-to-r from-[#7B4B28] to-[#662B35] p-6 rounded-2xl mb-4 shadow-[0_0_30px_rgba(234,215,183,0.3)]">
                          <p className="text-[#EAD7B7] text-sm mb-2">
                            Your Verification Code
                          </p>
                          <p className="text-5xl font-black text-[#FAF7F2] tracking-wider selectable drop-shadow-lg">
                            {completedOrder.verification_code || completedOrder.order_id.toString().padStart(6, '0')}
                          </p>
                          <p className="text-[#EAD7B7] text-xs mt-3">
                            📋 Please save this code
                          </p>
                        </div>

                        <div className="flex items-center justify-between p-4 glass-button rounded-xl border border-[#EAD7B7]/30">
                          <span className="text-[#FAF7F2] font-semibold">Total Amount</span>
                          <span className="text-2xl font-bold bg-gradient-to-r from-[#EAD7B7] to-[#7B4B28] bg-clip-text text-transparent">
                            ₱{completedOrder.final_amount.toFixed(2)}
                          </span>
                        </div>
                      </CardBody>
                    </Card>

                    <div className="glass-button border-2 border-[#7B4B28]/50 rounded-xl p-6 mb-4">
                      <p className="text-[#FAF7F2] font-semibold mb-2">
                        ✨ Your order is being prepared!
                      </p>
                      <p className="text-[#EAD7B7] text-sm">
                        Present your verification code at the counter when ready
                      </p>
                    </div>
                  </>
                )}
              </ModalBody>
              <ModalFooter className="flex justify-center gap-4 pb-8">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#7B4B28] to-[#662B35] text-[#FAF7F2] font-bold px-10 shadow-[0_0_30px_rgba(234,215,183,0.4)]"
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
          backdrop: "bg-[#3A1F0F]/90",
          base: "glass-card"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold capitalize text-[#FAF7F2]">{paymentMethod} Payment</h2>
            <p className="text-sm text-[#EAD7B7] font-normal">
              Scan this QR code with your {paymentMethod === 'gcash' ? 'GCash' : 'PayMaya'} app
            </p>
          </ModalHeader>
          <ModalBody className="py-6">
            {qrCodeUrl ? (
              <div className="space-y-6">
                {/* QR Code Display */}
                <div className="flex justify-center">
                  <div className="relative w-full max-w-md aspect-square bg-[#FAF7F2] rounded-xl p-6 shadow-lg border-4 border-[#7B4B28]">
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
                <div className="glass-button p-6 rounded-xl border-2 border-[#7B4B28]/50 text-center">
                  <p className="text-sm text-[#EAD7B7] mb-2">Amount to Pay:</p>
                  <p className="text-4xl font-bold text-[#FAF7F2] drop-shadow-lg">
                    ₱{getTotal().toFixed(2)}
                  </p>
                </div>

                {/* Instructions */}
                <div className="glass-button p-4 rounded-lg border-2 border-[#EAD7B7]/30">
                  <h3 className="font-semibold text-[#FAF7F2] mb-3">Payment Instructions:</h3>
                  <ol className="text-sm text-[#EAD7B7] space-y-2 list-decimal list-inside">
                    <li>Open your {paymentMethod === 'gcash' ? 'GCash' : 'PayMaya'} app</li>
                    <li>Tap "Scan QR" in your app</li>
                    <li>Scan the QR code shown above</li>
                    <li>Verify the amount: ₱{getTotal().toFixed(2)}</li>
                    <li>Complete the payment in your app</li>
                    <li>Save the reference number from your receipt</li>
                    <li>Click "I've Paid" below to continue</li>
                  </ol>
                </div>

                <div className="glass-button p-3 rounded-lg border-2 border-[#EAD7B7]/30">
                  <p className="text-sm text-[#EAD7B7] text-center">
                    ⚠️ <strong>Important:</strong> Make sure to complete the payment and get your reference number before clicking "I've Paid"
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-[#662B35]">QR Code not available</p>
                <p className="text-sm text-[#EAD7B7] mt-2">
                  Please contact staff for assistance with {paymentMethod} payments
                </p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              className="text-[#EAD7B7]"
              onPress={onQRClose}
            >
              Cancel
            </Button>
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#7B4B28] to-[#662B35] text-[#FAF7F2] font-bold"
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
