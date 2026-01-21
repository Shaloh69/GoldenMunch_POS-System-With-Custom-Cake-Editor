"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Divider,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
} from "@/components/primitives";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { OrderService } from "@/services/order.service";
import PaymentService from "@/services/payment.service";
import { getImageUrl } from "@/utils/imageUtils";
import { KioskAppSidebar } from "@/components/KioskAppSidebar";
import TouchKeyboard, { TouchKeyboardHandle } from "@/components/TouchKeyboard";
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
    total,
    getOrderItems,
  } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [orderType, setOrderType] = useState<OrderType>(OrderType.TAKEOUT);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<CustomerOrder | null>(
    null
  );
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // Xendit QR Code payment state
  const {
    isOpen: isQROpen,
    onOpen: onQROpen,
    onClose: onQRClose,
  } = useDisclosure();
  const [qrCodeString, setQrCodeString] = useState<string | null>(null);
  const [qrOrderId, setQrOrderId] = useState<number | null>(null);
  const [qrAmount, setQrAmount] = useState<number>(0);
  const [isPollingPayment, setIsPollingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>("pending");

  // Track failed image URLs to show emoji fallback
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Touch Keyboard State
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [layoutName, setLayoutName] = useState("default");
  const keyboardRef = useRef<TouchKeyboardHandle>(null);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleImageError = (imageUrl: string | null) => {
    if (imageUrl) {
      setFailedImages((prev) => new Set(prev).add(imageUrl));
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
      const orderData: CreateOrderRequest = {
        order_type: orderType,
        order_source: OrderSource.KIOSK,
        payment_method: paymentMethod,
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        special_instructions: specialInstructions || undefined,
        items: getOrderItems(),
      };

      const order = await OrderService.createOrder(orderData);

      // If cashless payment, generate QR code and wait for payment
      if (paymentMethod === PaymentMethod.CASHLESS) {
        try {
          // Generate Xendit QR code
          const qrData = await PaymentService.createPaymentQR(
            order.order_id,
            Number(order.total_amount)
          );

          // Validate that we received a QR code image
          if (!qrData.qr_code_image) {
            throw new Error(
              "QR code generation failed: No QR code data received from payment server. " +
              "Please contact staff for assistance or try paying with cash."
            );
          }

          // Store QR code data and show modal
          setQrCodeString(qrData.qr_code_image);
          setQrOrderId(order.order_id);
          setQrAmount(qrData.amount);
          setPaymentStatus("pending");
          setIsProcessing(false);
          onQROpen();

          // Start polling payment status
          setIsPollingPayment(true);
          PaymentService.pollPaymentStatus(
            order.order_id,
            (status) => {
              setPaymentStatus(status.payment_status);
            }
          )
            .then((finalStatus) => {
              // Payment complete - clear cart, close QR and redirect to thank you page
              setIsPollingPayment(false);
              clearCart();
              onQRClose();
              const prepTime = order.estimated_preparation_minutes || 0;
              router.push(
                `/thank-you?orderId=${order.order_id}&orderNumber=${order.order_number}&prepTime=${prepTime}`
              );
            })
            .catch((err) => {
              // Payment failed or timed out - keep modal open, show error
              setIsPollingPayment(false);
              setError(
                err.message ||
                  "Payment verification timed out. Please try again or contact staff for assistance."
              );
            });
        } catch (err: any) {
          console.error("Error generating QR code:", err);
          setError(
            err.message ||
              "Failed to generate payment QR code. Please try again."
          );
          setIsProcessing(false);
        }
      } else {
        // Cash payment - clear cart and redirect immediately
        clearCart();
        const prepTime = order.estimated_preparation_minutes || 0;
        router.push(
          `/order-success?orderId=${order.order_id}&orderNumber=${order.order_number}&prepTime=${prepTime}`
        );
      }
    } catch (err: any) {
      console.error("Error creating order:", err);
      setError(err.message || "Failed to create order. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleCancelPayment = () => {
    setError(null);
    setQrCodeString(null);
    setQrOrderId(null);
    setQrAmount(0);
    setPaymentStatus("pending");
    setIsPollingPayment(false);
    onQRClose();
    clearCart();
    // Navigate back to home after cancelling payment
    setTimeout(() => {
      router.push("/");
    }, 300);
  };

  const handleNewOrder = () => {
    setCustomerName("");
    setCustomerPhone("");
    setSpecialInstructions("");
    setOrderType(OrderType.TAKEOUT);
    setPaymentMethod(PaymentMethod.CASH);
    setQrCodeString(null);
    setQrOrderId(null);
    setQrAmount(0);
    setPaymentStatus("pending");
    setCompletedOrder(null);
    onOpenChange();
    router.push("/");
  };

  const handleCloseSidebar = () => {
    setSelectedItem(null);
  };

  // Touch Keyboard Handlers
  const handleInputFocus = (inputName: string, value: string, event?: React.FocusEvent<HTMLInputElement>) => {
    setActiveInput(inputName);
    setKeyboardVisible(true);
    if (keyboardRef.current) {
      keyboardRef.current.setInput(value);
    }

    // Scroll the input into view after a brief delay to account for keyboard rendering
    if (event?.target) {
      setTimeout(() => {
        event.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  };

  const handleInputBlur = () => {
    // Don't hide keyboard immediately - wait for potential keyboard clicks
    setTimeout(() => {
      setKeyboardVisible(false);
      setActiveInput(null);
    }, 100);
  };

  const handleKeyboardChange = (input: string) => {
    if (!activeInput) return;

    switch (activeInput) {
      case "customerName":
        setCustomerName(input);
        break;
      case "customerPhone":
        setCustomerPhone(input);
        break;
      case "specialInstructions":
        setSpecialInstructions(input);
        break;
    }
  };

  const handleKeyPress = (button: string) => {
    if (button === "{shift}" || button === "{lock}") {
      setLayoutName(layoutName === "default" ? "shift" : "default");
    } else if (button === "{enter}") {
      // Hide keyboard when done
      setKeyboardVisible(false);
      setActiveInput(null);
    }
  };

  if (cartItems.length === 0) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center p-6 animate-fade-in">
          <Card className="max-w-2xl glass-card border-4 border-primary/40 shadow-2xl animate-scale-in">
            <CardBody className="text-center p-16">
              <div className="text-[140px] mb-8 animate-float drop-shadow-2xl">
                🛒
              </div>
              <h1 className="text-6xl font-black text-gradient mb-6 drop-shadow-lg">
                Your Cart is Empty
              </h1>
              <p className="text-2xl text-black mb-10 font-semibold">
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
              </div>
            </CardBody>
          </Card>
        </div>
        <KioskAppSidebar
          selectedItem={selectedItem}
          onClose={handleCloseSidebar}
        />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen flex justify-center animate-fade-in">
        <div className="w-full max-w-7xl">
          {/* Modern Header with Gradient */}
          <div className="sticky top-0 z-40 glass-header border-b-4 border-primary/60 shadow-2xl mb-6 animate-fade-in-down">
            <div className="max-w-7xl mx-auto p-10">
              <div className="flex items-center gap-6 animate-slide-right">
                <div className="text-8xl animate-bounce-slow drop-shadow-lg">
                  🛒
                </div>
                <div>
                  <h1 className="text-6xl font-black text-gradient mb-3 drop-shadow-lg">
                    Your Cart
                  </h1>
                  <p className="text-2xl text-black font-bold">
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
                            <h3 className="text-xl font-bold text-black truncate drop-shadow-sm">
                              {item.menuItem.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Chip
                                size="sm"
                                variant="flat"
                                className="bg-primary text-black font-semibold border border-primary/60 shadow-sm"
                              >
                                {item.menuItem.item_type}
                              </Chip>
                              <span className="text-lg font-semibold text-black">
                                ₱
                                {(
                                  Number(item.menuItem.current_price) || 0
                                ).toFixed(2)}{" "}
                                each
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
                            <div className="flex items-center gap-3 bg-primary/20 rounded-full px-3 py-2 border-2 border-primary/50 shadow-md">
                              <Button
                                size="icon"
                                variant="flat"
                                className="rounded-full bg-secondary/40 hover:bg-secondary text-black font-bold transition-all h-8 w-8"
                                onClick={() =>
                                  updateQuantity(
                                    item.menuItem.menu_item_id,
                                    item.quantity - 1
                                  )
                                }
                              >
                                −
                              </Button>
                              <span className="text-xl font-bold text-black min-w-[32px] text-center">
                                {item.quantity}
                              </span>
                              <Button
                                size="icon"
                                className="rounded-full bg-gradient-to-r from-primary to-secondary text-black font-bold shadow-lg transition-all hover:scale-110 h-8 w-8"
                                onClick={() =>
                                  updateQuantity(
                                    item.menuItem.menu_item_id,
                                    item.quantity + 1
                                  )
                                }
                                disabled={
                                  !item.menuItem.is_infinite_stock &&
                                  item.quantity >= item.menuItem.stock_quantity
                                }
                              >
                                +
                              </Button>
                            </div>
                            {/* Stock Warning */}
                            {!item.menuItem.is_infinite_stock &&
                              item.quantity >= item.menuItem.stock_quantity && (
                                <div className="text-xs text-orange-600 font-semibold">
                                  Max stock reached
                                </div>
                              )}

                            {/* Item Total */}
                            <div className="text-center">
                              <p className="text-2xl font-bold text-black drop-shadow-sm">
                                ₱
                                {(
                                  (Number(item.menuItem.current_price) || 0) *
                                  item.quantity
                                ).toFixed(2)}
                              </p>
                              <Button
                                size="sm"
                                variant="light"
                                className="text-xs text-black hover:text-black font-semibold underline"
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
                      className="w-full border-2 border-primary/60 text-black hover:bg-primary/10 hover:border-primary font-bold text-lg py-6 shadow-md"
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
                      <span className="text-4xl animate-bounce-in animation-delay-200">
                        📋
                      </span>
                      Order Details
                    </h2>
                  </CardHeader>
                  <CardBody className="p-6 space-y-4">
                    <Input
                      label="Your Name (Optional)"
                      placeholder="Enter your name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      onFocus={(e) =>
                        handleInputFocus("customerName", customerName, e)
                      }
                      readOnly
                      size="lg"
                      variant="bordered"
                      classNames={{
                        input: "text-black cursor-pointer",
                        label: "text-black font-semibold",
                        inputWrapper:
                          "border-2 border-primary/60 hover:border-primary bg-card/50 shadow-sm cursor-pointer",
                      }}
                    />
                    <Input
                      label="Phone Number (Optional)"
                      placeholder="For order updates"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      onFocus={(e) =>
                        handleInputFocus("customerPhone", customerPhone, e)
                      }
                      readOnly
                      size="lg"
                      variant="bordered"
                      classNames={{
                        input: "text-black cursor-pointer",
                        label: "text-black font-semibold",
                        inputWrapper:
                          "border-2 border-primary/60 hover:border-primary bg-card/50 shadow-sm cursor-pointer",
                      }}
                    />
                    <Select
                      label="Order Type"
                      placeholder="Select order type"
                      selectedKeys={[orderType]}
                      onChange={(e) =>
                        setOrderType(e.target.value as OrderType)
                      }
                      size="lg"
                      variant="bordered"
                      isRequired
                      classNames={{
                        label: "!text-black font-semibold",
                        value: "!text-black !font-semibold",
                        innerWrapper: "!text-black",
                        trigger:
                          "border-2 border-primary/60 hover:border-primary bg-card/50 shadow-sm !text-black",
                        selectorIcon: "text-black",
                        listboxWrapper: "bg-white",
                        listbox: "bg-white",
                        popoverContent: "bg-white",
                      }}
                      listboxProps={{
                        itemClasses: {
                          base: "text-black data-[hover=true]:bg-primary/20 data-[hover=true]:text-black data-[selected=true]:text-black",
                          title: "text-black font-semibold",
                        },
                      }}
                    >
                      <SelectItem key="dine_in" textValue="Dine In">
                        <span className="text-black font-semibold">
                          🍽️ Dine In
                        </span>
                      </SelectItem>
                      <SelectItem key="takeout" textValue="Takeout">
                        <span className="text-black font-semibold">
                          🚗 Takeout
                        </span>
                      </SelectItem>
                      <SelectItem key="delivery" textValue="Delivery">
                        <span className="text-black font-semibold">
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
                      isRequired
                      classNames={{
                        label: "!text-black font-semibold",
                        value: "!text-black !font-semibold",
                        innerWrapper: "!text-black",
                        trigger:
                          "border-2 border-primary/60 hover:border-primary bg-card/50 shadow-sm !text-black",
                        selectorIcon: "text-black",
                        listboxWrapper: "bg-white",
                        listbox: "bg-white",
                        popoverContent: "bg-white",
                      }}
                      listboxProps={{
                        itemClasses: {
                          base: "text-black data-[hover=true]:bg-primary/20 data-[hover=true]:text-black data-[selected=true]:text-black",
                          title: "text-black font-semibold",
                        },
                      }}
                    >
                      <SelectItem key="cash" textValue="Cash Payment">
                        <span className="text-black font-semibold">
                          💵 Cash Payment
                        </span>
                      </SelectItem>
                      <SelectItem key="cashless" textValue="Cashless Payment">
                        <span className="text-black font-semibold">
                          💳 Cashless (GCash/PayMaya/Cards)
                        </span>
                      </SelectItem>
                    </Select>

                    {/* Payment Instructions for Cashless */}
                    {paymentMethod === "cashless" && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-3 border-blue-400 shadow-lg">
                        <div className="flex items-start gap-4">
                          <div className="text-5xl">📱</div>
                          <div className="flex-1">
                            <h3 className="text-2xl font-black text-black mb-3">
                              💳 Cashless Payment
                            </h3>
                            <p className="text-black text-lg font-semibold">
                              After placing your order, a QR code will appear on
                              screen. Simply scan and pay using GCash, PayMaya,
                              or your card!
                            </p>
                            <p className="text-black text-sm mt-3">
                              ✨ Payment is verified automatically - no reference
                              number needed!
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <Input
                      label="Special Instructions (Optional)"
                      placeholder="Any special requests?"
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      onFocus={(e) =>
                        handleInputFocus(
                          "specialInstructions",
                          specialInstructions,
                          e
                        )
                      }
                      readOnly
                      size="lg"
                      variant="bordered"
                      classNames={{
                        input: "text-black cursor-pointer",
                        label: "text-black font-semibold",
                        inputWrapper:
                          "border-2 border-primary/60 hover:border-primary bg-card/50 shadow-sm cursor-pointer",
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
                      <span className="text-5xl animate-bounce-in animation-delay-500">
                        💰
                      </span>
                      Order Summary
                    </h2>
                  </CardHeader>
                  <CardBody className="p-8">
                    <div className="space-y-6">
                      <div className="glass-card p-6 rounded-2xl border-2 border-primary/40 shadow-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold text-black">
                            Total
                          </span>
                          <span className="text-4xl font-black text-gradient">
                            ₱{total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      className="w-full mt-8 btn-gradient text-2xl py-10 shadow-2xl hover:scale-105 transition-all touch-target-lg"
                      onClick={handleCheckout}
                      isLoading={isProcessing}
                    >
                      {isProcessing
                        ? "Processing..."
                        : `💳 Place Order - ₱${total.toFixed(2)}`}
                    </Button>

                    <p className="text-sm text-black text-center mt-4 font-semibold">
                      🔒 Secure checkout • By placing this order, you agree to
                      our terms
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
                    <div className="text-[120px] mb-6 animate-bounce-slow drop-shadow-2xl">
                      🎉
                    </div>
                    <h2 className="text-5xl font-black text-gradient drop-shadow-lg mb-3">
                      Order Successful!
                    </h2>
                  </ModalHeader>
                  <ModalBody className="text-center px-8">
                    {completedOrder && (
                      <>
                        <p className="text-2xl text-black mb-6 font-semibold">
                          Thank you for your order! 🙏
                        </p>
                        <Card className="glass-card mb-6 animate-scale-in border-2 border-primary/60 shadow-lg">
                          <CardBody className="p-8">
                            <p className="text-black text-lg mb-3 font-semibold">
                              Order Number
                            </p>
                            <p className="text-2xl font-bold text-black mb-6 drop-shadow-sm">
                              #
                              {completedOrder.order_number ||
                                completedOrder.order_id}
                            </p>

                            <div className="bg-gradient-to-r from-primary to-secondary p-6 rounded-2xl mb-4 shadow-xl">
                              <p className="text-black text-sm mb-2 font-semibold">
                                Your Verification Code
                              </p>
                              <p className="text-5xl font-black text-black tracking-wider selectable drop-shadow-lg">
                                {completedOrder.verification_code ||
                                  completedOrder.order_id
                                    .toString()
                                    .padStart(6, "0")}
                              </p>
                              <p className="text-black text-xs mt-3 font-semibold">
                                📋 Please save this code
                              </p>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-primary/20 rounded-xl border-2 border-primary/60 shadow-md">
                              <span className="text-black font-semibold">
                                Total Amount
                              </span>
                              <span className="text-2xl font-bold text-black">
                                ₱{completedOrder.final_amount.toFixed(2)}
                              </span>
                            </div>
                          </CardBody>
                        </Card>

                        <div className="bg-primary/20 border-2 border-primary/60 rounded-xl p-6 mb-4 shadow-md">
                          <p className="text-black font-semibold mb-2">
                            ✨ Your order is being prepared!
                          </p>
                          <p className="text-black text-sm">
                            Present your verification code at the counter when
                            ready
                          </p>
                        </div>
                      </>
                    )}
                  </ModalBody>
                  <ModalFooter className="flex justify-center gap-4 pb-8">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-primary to-secondary text-black font-bold px-10 shadow-xl hover:scale-105 transition-all"
                      onClick={handleNewOrder}
                    >
                      🏠 Back to Menu
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>

          {/* Xendit QR Code Payment Modal */}
          <Modal
            isOpen={isQROpen}
            onClose={onQRClose}
            isDismissable={!isPollingPayment}
            hideCloseButton={isPollingPayment}
            size="2xl"
            classNames={{
              backdrop: "bg-black/60 backdrop-blur-md",
              base: "glass-card border-4 border-primary shadow-2xl",
            }}
          >
            <ModalContent>
              <ModalHeader className="flex flex-col gap-1 text-center pt-8">
                <h2 className="text-4xl font-black text-gradient">
                  💳 Scan to Pay
                </h2>
                <p className="text-lg text-black font-semibold mt-2">
                  GCash • PayMaya • Cards
                </p>
              </ModalHeader>
              <ModalBody className="py-8 px-8">
                {qrCodeString ? (
                  <div className="space-y-6">
                    {/* QR Code Display */}
                    <div className="flex justify-center">
                      <div className="bg-white p-8 rounded-3xl shadow-2xl border-4 border-primary/60 animate-scale-in">
                        <Image
                          src={qrCodeString}
                          alt="Payment QR Code"
                          width={320}
                          height={320}
                          className="rounded-lg"
                          priority
                        />
                      </div>
                    </div>

                    {/* Amount Display */}
                    <div className="bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 p-6 rounded-2xl border-3 border-primary/60 text-center shadow-lg">
                      <p className="text-lg text-black mb-2 font-bold">
                        Amount to Pay:
                      </p>
                      <p className="text-5xl font-black text-gradient drop-shadow-lg">
                        ₱{qrAmount.toFixed(2)}
                      </p>
                    </div>

                    {/* Payment Status */}
                    {isPollingPayment && (
                      <div className="glass-card p-6 rounded-2xl border-3 border-blue-400 shadow-lg animate-pulse-slow">
                        <div className="flex items-center justify-center gap-4">
                          <Spinner size="lg" color="primary" />
                          <div className="text-center">
                            <p className="text-xl font-bold text-black">
                              Waiting for payment...
                            </p>
                            <p className="text-sm text-black mt-2">
                              Payment will be verified automatically
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Error */}
                    {error && !isPollingPayment && qrCodeString && (
                      <div className="bg-red-50 p-6 rounded-2xl border-3 border-red-500 shadow-lg">
                        <div className="flex flex-col items-center gap-4">
                          <div className="text-6xl">⚠️</div>
                          <div className="text-center">
                            <p className="text-xl font-bold text-red-900 mb-2">
                              Payment Issue
                            </p>
                            <p className="text-base text-red-800">
                              {error}
                            </p>
                            <p className="text-sm text-red-700 mt-3">
                              You can try scanning the QR code again or cancel to return to the menu.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Instructions */}
                    <div className="glass-card p-5 rounded-xl border-2 border-primary/50 shadow-md">
                      <h3 className="font-bold text-black mb-3 text-lg">
                        📱 How to Pay:
                      </h3>
                      <ol className="text-black space-y-2 list-decimal list-inside text-base">
                        <li>Open your camera app and scan QR code shown above it will redirect you to an invoice page</li>
                        <li>Download QRPH code and open your desired payment method app GCash/Paymaya/Bank</li>
                        <li>Pay the specified amount</li>
                        <li>Verify the amount and complete payment</li>
                        <li>
                          <strong>This screen will close automatically!</strong>
                        </li>
                      </ol>
                    </div>

                    <div className="bg-green-50 p-4 rounded-xl border-2 border-green-400 shadow-md">
                      <p className="text-sm text-black text-center font-semibold">
                        ✨ No reference number needed - payment is verified
                        automatically!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">⚠️</div>
                    <p className="text-xl text-black font-bold mb-2">
                      QR Code Generation Failed
                    </p>
                    <p className="text-base text-black">
                      Please contact staff for assistance
                    </p>
                  </div>
                )}
              </ModalBody>
              {!isPollingPayment && (
                <ModalFooter className="justify-center pb-6">
                  <Button
                    size="lg"
                    variant="bordered"
                    className="border-2 border-primary/60 text-black hover:bg-primary/10 font-bold"
                    onClick={handleCancelPayment}
                  >
                    Cancel Payment
                  </Button>
                </ModalFooter>
              )}
            </ModalContent>
          </Modal>

          {/* Touch Keyboard - Inline at bottom of page */}
          {keyboardVisible && (
            <div className="w-full max-w-6xl mx-auto px-6 pb-6">
              <TouchKeyboard
                ref={keyboardRef}
                onChange={handleKeyboardChange}
                onKeyPress={handleKeyPress}
                inputName={activeInput || "default"}
                layoutName={layoutName}
                variant="inline"
              />
            </div>
          )}

          {/* Spacer for better spacing */}
          <div className="h-20"></div>
        </div>
      </div>
      <KioskAppSidebar
        selectedItem={selectedItem}
        onClose={handleCloseSidebar}
      />
    </>
  );
}
