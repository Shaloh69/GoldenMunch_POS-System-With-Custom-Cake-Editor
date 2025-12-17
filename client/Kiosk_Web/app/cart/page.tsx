
"use client";

import { useState, useEffect } from "react";
import {
  Card, CardBody, CardHeader,
  Button,
  Chip,
  Divider,
  Input,
  Select, SelectItem,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure
} from "@/components/primitives";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { OrderService } from "@/services/order.service";
import { printerService } from "@/services/printer.service";
import { SettingsService } from "@/services/settings.service";
import { getImageUrl } from "@/utils/imageUtils";
import { KioskAppSidebar } from "@/components/KioskAppSidebar";
import {
  OrderType,
  OrderSource,
  PaymentMethod,
  CreateOrderRequest,
  CustomerOrder,
} from "@/types/api";

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
    getOrderItems,
  } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [orderType, setOrderType] = useState<OrderType>(OrderType.TAKEOUT);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<CustomerOrder | null>(
    null,
  );
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // QR Code state
  const {
    isOpen: isQROpen,
    onOpen: onQROpen,
    onClose: onQRClose,
  } = useDisclosure();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");

  // Track failed image URLs to show emoji fallback
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageError = (imageUrl: string | null) => {
    if (imageUrl) {
      setFailedImages((prev) => new Set(prev).add(imageUrl));
    }
  };

  // Fetch QR code when payment method changes to GCash or PayMaya
  useEffect(() => {
    if (paymentMethod === "gcash" || paymentMethod === "paymaya") {
      fetchQRCode();
    } else {
      setQrCodeUrl(null);
      setReferenceNumber(""); // Clear reference number when switching away from digital payments
    }
  }, [paymentMethod]);

  const fetchQRCode = async () => {
    setLoadingQR(true);
    try {
      // Fetch QR code for the selected payment method
      const url = await SettingsService.getPaymentQR(
        paymentMethod as "gcash" | "paymaya",
      );
      setQrCodeUrl(url);
    } catch (error) {
      console.error(`Failed to fetch ${paymentMethod} payment QR code:`, error);
      setQrCodeUrl(null);
    } finally {
      setLoadingQR(false);
    }
  };

  const handleShowQRCode = () => {
    if (qrCodeUrl) {
      onQROpen();
    } else {
      setError(
        `No ${paymentMethod.toUpperCase()} QR code configured. Please contact staff.`,
      );
    }
  };

  const getItemEmoji = (itemType: string): string => {
    const emojiMap: Record<string, string> = {
      cake: "🍰",
      pastry: "🥐",
      beverage: "☕",
      snack: "🍪",
      main_dish: "🍽️",
      appetizer: "🥗",
      dessert: "🍨",
      bread: "🍞",
      other: "🍴",
    };
    return emojiMap[itemType] || "🍴";
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Validate reference number for GCash and PayMaya
      if (
        (paymentMethod === "gcash" || paymentMethod === "paymaya") &&
        !referenceNumber.trim()
      ) {
        setError(
          `Please enter your ${paymentMethod.toUpperCase()} reference number`,
        );
        setIsProcessing(false);
        return;
      }

      const orderData: CreateOrderRequest = {
        order_type: orderType,
        order_source: OrderSource.KIOSK,
        payment_method: paymentMethod,
        special_instructions: specialInstructions || undefined,
        items: getOrderItems(),
      };

      // Add reference number based on payment method
      if (paymentMethod === "gcash" && referenceNumber.trim()) {
        orderData.gcash_reference_number = referenceNumber.trim();
      } else if (paymentMethod === "paymaya" && referenceNumber.trim()) {
        orderData.paymaya_reference_number = referenceNumber.trim();
      }

      const order = await OrderService.createOrder(orderData);
      setCompletedOrder(order);
      clearCart();
      onOpen();

      // ✅ FIX: Print receipt after successful order creation
      try {
        console.log("🖨️ Attempting to print receipt...");
        const receiptData = printerService.formatOrderForPrint({
          ...order,
          items: cartItems.map((item) => ({
            name: item.menuItem.name,
            quantity: item.quantity,
            unit_price: item.menuItem.current_price,
            special_instructions: item.special_instructions,
          })),
          total_amount: getSubtotal(),
          tax_amount: getTax(),
          final_amount: getTotal(),
          discount_amount: 0,
        });

        const printResult = await printerService.printReceipt(receiptData);
        if (printResult.success) {
          console.log("✅ Receipt printed successfully");
        } else {
          console.warn("⚠️ Receipt printing failed:", printResult.error);
          // Don't block order completion if printing fails
        }
      } catch (printErr) {
        console.error("❌ Receipt printing error:", printErr);
        // Don't block order completion if printing fails
      }
    } catch (err: any) {
      console.error("Error creating order:", err);
      setError(err.message || "Failed to create order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewOrder = () => {
    setCustomerName("");
    setCustomerPhone("");
    setSpecialInstructions("");
    setOrderType(OrderType.TAKEOUT);
    setPaymentMethod(PaymentMethod.CASH);
    setReferenceNumber("");
    setCompletedOrder(null);
    onOpenChange();
    router.push("/");
  };

  const handleCloseSidebar = () => {
    setSelectedItem(null);
  };

  if (cartItems.length === 0) {
    return (
      <>
      <div className="min-h-screen flex items-center justify-center p-6 animate-fade-in">
        <Card className="max-w-2xl glass-card border-4 border-primary/40 shadow-2xl animate-scale-in">
          <CardBody className="text-center p-16">
            <div className="text-[140px] mb-8 animate-float drop-shadow-2xl">🛒</div>
            <h1 className="text-6xl font-black text-gradient mb-6 drop-shadow-lg">
              Your Cart is Empty
            </h1>
            <p className="text-2xl text-foreground/80 mb-10 font-semibold">
              Looks like you haven't added any delicious treats yet!
            </p>
            <div className="flex flex-col gap-5">
              <Button
                as={NextLink}
                href="/"
                size="lg"
                className="btn-gradient text-2xl px-14 py-9 shadow-2xl hover:scale-105 transition-all touch-target-lg"
              >
                🍰 Browse Our Menu
              </Button>
              <Button
                as={NextLink}
                href="/specials"
                size="lg"
                className="glass-button border-3 border-primary/60 text-foreground hover:bg-primary/20 font-bold text-xl px-14 py-8 touch-target"
              >
                ⭐ View Today's Specials
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
      <KioskAppSidebar selectedItem={selectedItem} onClose={handleCloseSidebar} />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen flex justify-center pr-[35vw] max-pr-[500px] animate-fade-in">
        <div className="w-full max-w-7xl">
      {/* Modern Header with Gradient */}
      <div className="sticky top-0 z-40 glass-header border-b-4 border-primary/60 shadow-2xl mb-6 animate-fade-in-down">
        <div className="max-w-7xl mx-auto p-10">
          <div className="flex items-center gap-6 animate-slide-right">
            <div className="text-8xl animate-bounce-slow drop-shadow-lg">🛒</div>
            <div>
              <h1 className="text-6xl font-black text-gradient mb-3 drop-shadow-lg">
                Your Cart
              </h1>
              <p className="text-2xl text-foreground/90 font-bold">
                {getItemCount()} {getItemCount() === 1 ? "item" : "items"} •
                Ready to checkout? 🎉
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 md:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Cart Items - Takes 3 columns on large screens */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="glass-card border-3 border-primary/50 shadow-2xl animate-slide-up">
              <CardHeader className="p-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-b-3 border-primary/40">
                <h2 className="text-4xl font-black text-gradient flex items-center gap-3 drop-shadow-lg">
                  <span className="text-5xl animate-bounce-in">📦</span>
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
                    <div className="flex items-center gap-5 p-6 glass-card rounded-2xl hover:scale-[1.02] transition-all border-3 border-primary/30 hover:border-primary/60 shadow-lg hover:shadow-xl">
                      {/* Item Image - Fixed to show actual images */}
                      <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
                        {getImageUrl(item.menuItem.image_url) &&
                        item.menuItem.image_url &&
                        !failedImages.has(item.menuItem.image_url) ? (
                          <Image
                            src={getImageUrl(item.menuItem.image_url) ?? ""}
                            alt={item.menuItem.name}
                            width={96}
                            height={96}
                            className="object-cover w-full h-full"
                            unoptimized
                            onError={() =>
                              handleImageError(item.menuItem.image_url)
                            }
                          />
                        ) : (
                          <div className="text-5xl">
                            {getItemEmoji(item.menuItem.item_type)}
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-foreground truncate drop-shadow-sm">
                          {item.menuItem.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Chip
                            size="sm"
                            variant="flat"
                            className="bg-primary text-foreground font-semibold border border-primary/60 shadow-sm"
                          >
                            {item.menuItem.item_type}
                          </Chip>
                          <span className="text-lg font-semibold text-foreground">
                            ₱
                            {(Number(item.menuItem.current_price) || 0).toFixed(
                              2,
                            )}{" "}
                            each
                          </span>
                        </div>
                        {item.special_instructions && (
                          <p className="text-sm text-foreground mt-2 italic">
                            📝 {item.special_instructions}
                          </p>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-3 bg-primary/20 rounded-full px-3 py-2 border-2 border-primary/50 shadow-md">
                          <Button
                            size="icon"
                            variant="flat"
                            className="rounded-full bg-secondary/40 hover:bg-secondary text-foreground font-bold transition-all h-8 w-8"
                            onClick={() =>
                              updateQuantity(
                                item.menuItem.menu_item_id,
                                item.quantity - 1,
                              )
                            }
                          >
                            −
                          </Button>
                          <span className="text-xl font-bold text-foreground min-w-[32px] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            size="icon"
                            className="rounded-full bg-gradient-to-r from-primary to-secondary text-foreground font-bold shadow-lg transition-all hover:scale-110 h-8 w-8"
                            onClick={() =>
                              updateQuantity(
                                item.menuItem.menu_item_id,
                                item.quantity + 1,
                              )
                            }
                          >
                            +
                          </Button>
                        </div>

                        {/* Item Total */}
                        <div className="text-center">
                          <p className="text-2xl font-bold text-foreground drop-shadow-sm">
                            ₱
                            {(
                              (Number(item.menuItem.current_price) || 0) *
                              item.quantity
                            ).toFixed(2)}
                          </p>
                          <Button
                            size="sm"
                            variant="light"
                            className="text-xs text-foreground hover:text-foreground font-semibold underline"
                            onClick={() =>
                              removeItem(item.menuItem.menu_item_id)
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Divider className="my-6 bg-primary/30" />

                <Button
                  as={NextLink}
                  href="/"
                  size="lg"
                  variant="bordered"
                  className="w-full border-2 border-primary/60 text-foreground hover:bg-primary/10 hover:border-primary font-bold text-lg py-6 shadow-md"
                >
                  + Add More Items
                </Button>
              </CardBody>
            </Card>
          </div>

          {/* Checkout Section - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Information */}
            <Card
              className="glass-card border-3 border-primary/50 shadow-2xl animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              <CardHeader className="p-7 bg-gradient-to-r from-primary/10 to-secondary/10 border-b-3 border-primary/40">
                <h2 className="text-3xl font-black text-gradient flex items-center gap-3 drop-shadow-lg">
                  <span className="text-4xl animate-bounce-in animation-delay-200">📋</span>
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
                    input: "text-foreground",
                    label: "text-foreground font-semibold",
                    inputWrapper:
                      "border-2 border-primary/60 hover:border-primary bg-card/50 shadow-sm",
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
                    input: "text-foreground",
                    label: "text-foreground font-semibold",
                    inputWrapper:
                      "border-2 border-primary/60 hover:border-primary bg-card/50 shadow-sm",
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
                    label: "!text-foreground font-semibold",
                    value: "!text-foreground !font-semibold",
                    innerWrapper: "!text-foreground",
                    trigger:
                      "border-2 border-primary/60 hover:border-primary bg-card/50 shadow-sm !text-foreground",
                    selectorIcon: "text-foreground",
                    listboxWrapper: "bg-white",
                    listbox: "bg-white",
                    popoverContent: "bg-white",
                  }}
                  listboxProps={{
                    itemClasses: {
                      base: "text-foreground data-[hover=true]:bg-primary/20 data-[hover=true]:text-foreground data-[selected=true]:text-foreground",
                      title: "text-foreground font-semibold",
                    },
                  }}
                >
                  <SelectItem key="dine_in" textValue="Dine In">
                    <span className="text-foreground font-semibold">🍽️ Dine In</span>
                  </SelectItem>
                  <SelectItem key="takeout" textValue="Takeout">
                    <span className="text-foreground font-semibold">🚗 Takeout</span>
                  </SelectItem>
                  <SelectItem key="delivery" textValue="Delivery">
                    <span className="text-foreground font-semibold">
                      🚚 Delivery
                    </span>
                  </SelectItem>
                </Select>
                <Select
                  label="Payment Method"
                  placeholder="Select payment method"
                  selectedKeys={[paymentMethod]}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as PaymentMethod)
                  }
                  size="lg"
                  variant="bordered"
                  classNames={{
                    label: "!text-foreground font-semibold",
                    value: "!text-foreground !font-semibold",
                    innerWrapper: "!text-foreground",
                    trigger:
                      "border-2 border-primary/60 hover:border-primary bg-card/50 shadow-sm !text-foreground",
                    selectorIcon: "text-foreground",
                    listboxWrapper: "bg-white",
                    listbox: "bg-white",
                    popoverContent: "bg-white",
                  }}
                  listboxProps={{
                    itemClasses: {
                      base: "text-foreground data-[hover=true]:bg-primary/20 data-[hover=true]:text-foreground data-[selected=true]:text-foreground",
                      title: "text-foreground font-semibold",
                    },
                  }}
                >
                  <SelectItem key="cash" textValue="Cash Payment">
                    <span className="text-foreground font-semibold">
                      💵 Cash Payment
                    </span>
                  </SelectItem>
                  <SelectItem key="gcash" textValue="GCash Payment">
                    <span className="text-foreground font-semibold">
                      📱 GCash Payment
                    </span>
                  </SelectItem>
                  <SelectItem key="paymaya" textValue="PayMaya Payment">
                    <span className="text-foreground font-semibold">
                      💳 PayMaya Payment
                    </span>
                  </SelectItem>
                </Select>

                {/* Show QR code for GCash and PayMaya payments */}
                {(paymentMethod === "gcash" || paymentMethod === "paymaya") && (
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-primary to-secondary text-foreground font-bold shadow-lg hover:scale-105 transition-all"
                    onClick={handleShowQRCode}
                    isLoading={loadingQR}
                  >
                    {loadingQR
                      ? "Loading QR Code..."
                      : "📱 Show Payment QR Code"}
                  </Button>
                )}

                <Input
                  label="Special Instructions (Optional)"
                  placeholder="Any special requests?"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  size="lg"
                  variant="bordered"
                  classNames={{
                    input: "text-foreground",
                    label: "text-foreground font-semibold",
                    inputWrapper:
                      "border-2 border-primary/60 hover:border-primary bg-card/50 shadow-sm",
                  }}
                />
              </CardBody>
            </Card>

            {/* Order Summary */}
            <Card
              className="glass-card border-4 border-primary/60 shadow-2xl animate-slide-up sticky top-24"
              style={{ animationDelay: "0.3s" }}
            >
              <CardHeader className="p-8 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 border-b-3 border-primary/50">
                <h2 className="text-3xl font-black text-gradient flex items-center gap-3 drop-shadow-lg">
                  <span className="text-5xl animate-bounce-in animation-delay-500">💰</span>
                  Order Summary
                </h2>
              </CardHeader>
              <CardBody className="p-8">
                <div className="space-y-6">
                  <div className="glass-card p-6 rounded-2xl border-2 border-primary/40 shadow-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-foreground">
                        Total ({getItemCount()} items)
                      </span>
                      <span className="text-4xl font-black text-gradient">₱{getTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mt-6 p-5 bg-red-500/20 border-3 border-red-500 rounded-2xl animate-scale-in shadow-lg">
                    <p className="text-foreground font-bold text-lg">⚠️ {error}</p>
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full mt-8 btn-gradient text-2xl py-10 shadow-2xl hover:scale-105 transition-all touch-target-lg"
                  onClick={handleCheckout}
                  isLoading={isProcessing}
                >
                  {isProcessing
                    ? "Processing..."
                    : `💳 Place Order - ₱${getTotal().toFixed(2)}`}
                </Button>

                <p className="text-sm text-foreground/80 text-center mt-4 font-semibold">
                  🔒 Secure checkout • By placing this order, you agree to our
                  terms
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      {/* Success Modal with Confetti Effect */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent
          size="2xl"
          classNames={{
            base: "glass-card border-4 border-primary/60 shadow-2xl",
            header: "border-b-0",
            body: "py-10",
            footer: "border-t-0",
          }}
        >
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-center pt-10">
                <div className="text-[120px] mb-6 animate-bounce-slow drop-shadow-2xl">🎉</div>
                <h2 className="text-5xl font-black text-gradient drop-shadow-lg mb-3">
                  Order Successful!
                </h2>
              </ModalHeader>
              <ModalBody className="text-center px-8">
                {completedOrder && (
                  <>
                    <p className="text-2xl text-foreground mb-6 font-semibold">
                      Thank you for your order! 🙏
                    </p>
                    <Card className="glass-card mb-6 animate-scale-in border-2 border-primary/60 shadow-lg">
                      <CardBody className="p-8">
                        <p className="text-foreground text-lg mb-3 font-semibold">
                          Order Number
                        </p>
                        <p className="text-2xl font-bold text-foreground mb-6 drop-shadow-sm">
                          #
                          {completedOrder.order_number ||
                            completedOrder.order_id}
                        </p>

                        <div className="bg-gradient-to-r from-primary to-secondary p-6 rounded-2xl mb-4 shadow-xl">
                          <p className="text-foreground text-sm mb-2 font-semibold">
                            Your Verification Code
                          </p>
                          <p className="text-5xl font-black text-foreground tracking-wider selectable drop-shadow-lg">
                            {completedOrder.verification_code ||
                              completedOrder.order_id
                                .toString()
                                .padStart(6, "0")}
                          </p>
                          <p className="text-foreground text-xs mt-3 font-semibold">
                            📋 Please save this code
                          </p>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-primary/20 rounded-xl border-2 border-primary/60 shadow-md">
                          <span className="text-foreground font-semibold">
                            Total Amount
                          </span>
                          <span className="text-2xl font-bold text-foreground">
                            ₱{completedOrder.final_amount.toFixed(2)}
                          </span>
                        </div>
                      </CardBody>
                    </Card>

                    <div className="bg-primary/20 border-2 border-primary/60 rounded-xl p-6 mb-4 shadow-md">
                      <p className="text-foreground font-semibold mb-2">
                        ✨ Your order is being prepared!
                      </p>
                      <p className="text-foreground text-sm">
                        Present your verification code at the counter when ready
                      </p>
                    </div>
                  </>
                )}
              </ModalBody>
              <ModalFooter className="flex justify-center gap-4 pb-8">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-secondary text-foreground font-bold px-10 shadow-xl hover:scale-105 transition-all"
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
      <Modal isOpen={isQROpen} onOpenChange={(open) => { if (!open) onQRClose(); }}>
        <ModalContent
          size="2xl"
          classNames={{
            backdrop: "bg-charcoal-gray/90",
            base: "glass-card border-4 border-primary shadow-2xl",
          }}
        >
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold capitalize text-foreground">
              {paymentMethod} Payment
            </h2>
            <p className="text-sm text-foreground font-normal">
              Scan this QR code with your{" "}
              {paymentMethod === "gcash" ? "GCash" : "PayMaya"} app
            </p>
          </ModalHeader>
          <ModalBody className="py-6">
            {qrCodeUrl ? (
              <div className="space-y-6">
                {/* QR Code Display */}
                <div className="flex justify-center">
                  <div className="relative w-full max-w-md aspect-square bg-card rounded-xl p-6 shadow-lg border-4 border-primary">
                    <Image
                      src={getImageUrl(qrCodeUrl) || ""}
                      alt={`${paymentMethod.toUpperCase()} QR Code`}
                      fill
                      className="object-contain p-4"
                      priority
                      unoptimized
                    />
                  </div>
                </div>

                {/* Amount Display */}
                <div className="bg-primary/20 p-6 rounded-xl border-2 border-primary/60 text-center shadow-md">
                  <p className="text-sm text-foreground mb-2 font-semibold">
                    Amount to Pay:
                  </p>
                  <p className="text-4xl font-bold text-foreground drop-shadow-sm">
                    ₱{getTotal().toFixed(2)}
                  </p>
                </div>

                {/* Instructions */}
                <div className="glass-card p-4 rounded-lg border-2 border-primary/60 shadow-md">
                  <h3 className="font-semibold text-foreground mb-3">
                    Payment Instructions:
                  </h3>
                  <ol className="text-sm text-foreground space-y-2 list-decimal list-inside">
                    <li>
                      Open your{" "}
                      {paymentMethod === "gcash" ? "GCash" : "PayMaya"} app
                    </li>
                    <li>Tap "Scan QR" in your app</li>
                    <li>Scan the QR code shown above</li>
                    <li>Verify the amount: ₱{getTotal().toFixed(2)}</li>
                    <li>Complete the payment in your app</li>
                    <li>
                      <strong>
                        Copy the reference number from your payment confirmation
                      </strong>
                    </li>
                    <li>Enter the reference number below</li>
                  </ol>
                </div>

                {/* Reference Number Input */}
                <div className="glass-card p-6 rounded-xl border-2 border-primary/60 shadow-lg">
                  <Input
                    label={`${paymentMethod === "gcash" ? "GCash" : "PayMaya"} Reference Number`}
                    placeholder="Enter your reference number"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    size="lg"
                    variant="bordered"
                    isRequired
                    classNames={{
                      input: "text-foreground font-semibold text-lg",
                      label: "text-foreground font-bold text-base",
                      inputWrapper:
                        "border-3 border-primary/80 hover:border-primary bg-card shadow-md h-14",
                    }}
                    startContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-2xl mr-2">📱</span>
                      </div>
                    }
                  />
                  <p className="text-xs text-foreground mt-2 font-medium">
                    ⚠️ This reference number is required to complete your order
                  </p>
                </div>

                <div className="bg-yellow-500/20 p-3 rounded-lg border-2 border-yellow-500/60 shadow-md">
                  <p className="text-sm text-foreground text-center">
                    ℹ️ <strong>Note:</strong> Please complete your payment and
                    enter the reference number above. The cashier will verify
                    this reference number when you pick up your order.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-foreground font-semibold">
                  QR Code not available
                </p>
                <p className="text-sm text-foreground mt-2">
                  Please contact staff for assistance with {paymentMethod}{" "}
                  payments
                </p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary text-foreground font-bold shadow-lg hover:scale-105 transition-all"
              onClick={onQRClose}
              isDisabled={!qrCodeUrl || !referenceNumber.trim()}
            >
              ✓ I've Entered My Reference Number
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Spacer */}
      <div className="h-20"></div>
        </div>
        </div>
      </div>
      <KioskAppSidebar selectedItem={selectedItem} onClose={handleCloseSidebar} />
    </>
  );
}
