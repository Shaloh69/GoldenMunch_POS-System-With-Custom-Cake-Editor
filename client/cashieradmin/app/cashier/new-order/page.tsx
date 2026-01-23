"use client";

import type { MenuItem, CustomerDiscountType } from "@/types/api";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { Spinner } from "@heroui/spinner";
import Image from "next/image";
import {
  PlusIcon,
  MinusIcon,
  TrashIcon,
  ShoppingCartIcon,
  PercentBadgeIcon,
  BanknotesIcon,
  UserIcon,
  PhoneIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

import { MenuService } from "@/services/menu.service";
import { DiscountService } from "@/services/discount.service";
import { OrderService } from "@/services/order.service";
import { getImageUrl } from "@/utils/imageUtils";

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  subtotal: number;
}

interface OrderForm {
  customer_name: string;
  customer_phone: string;
  order_type: "dine_in" | "takeout" | "delivery";
  customer_discount_type_id: number | null;
  payment_method: "cash" | "gcash" | "maya";
  amount_paid: number;
}

export default function NewOrderPage() {
  // Menu & Cart State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Discount State
  const [discounts, setDiscounts] = useState<CustomerDiscountType[]>([]);
  const [selectedDiscount, setSelectedDiscount] =
    useState<CustomerDiscountType | null>(null);

  // Order Form State
  const [orderForm, setOrderForm] = useState<OrderForm>({
    customer_name: "",
    customer_phone: "",
    order_type: "takeout",
    customer_discount_type_id: null,
    payment_method: "cash",
    amount_paid: 0,
  });

  // UI State
  const [processingOrder, setProcessingOrder] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);

  // Load menu items and discounts
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load menu items (status=available filters for active items)
      const menuResponse = await MenuService.getMenuItems({
        status: "available",
      });

      if (menuResponse.success && menuResponse.data) {
        setMenuItems(menuResponse.data);
      }

      // Load active discounts
      const discountResponse = await DiscountService.getActiveDiscountTypes();

      if (discountResponse.success && discountResponse.data) {
        setDiscounts(discountResponse.data);
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Cart Operations - Memoized to prevent unnecessary re-renders
  const addToCart = useCallback((item: MenuItem) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (ci) => ci.menuItem.menu_item_id === item.menu_item_id,
      );

      if (existingItem) {
        return prevItems.map((ci) =>
          ci.menuItem.menu_item_id === item.menu_item_id
            ? {
                ...ci,
                quantity: ci.quantity + 1,
                subtotal: Number(ci.menuItem.current_price) * (ci.quantity + 1),
              }
            : ci,
        );
      } else {
        return [
          ...prevItems,
          {
            menuItem: item,
            quantity: 1,
            subtotal: Number(item.current_price),
          },
        ];
      }
    });
  }, []);

  const updateQuantity = useCallback((itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCartItems((prevItems) =>
        prevItems.filter((ci) => ci.menuItem.menu_item_id !== itemId)
      );
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((ci) =>
        ci.menuItem.menu_item_id === itemId
          ? {
              ...ci,
              quantity: newQuantity,
              subtotal: Number(ci.menuItem.current_price) * newQuantity,
            }
          : ci,
      ),
    );
  }, []);

  const removeFromCart = useCallback((itemId: number) => {
    setCartItems((prevItems) =>
      prevItems.filter((ci) => ci.menuItem.menu_item_id !== itemId)
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setOrderForm({
      customer_name: "",
      customer_phone: "",
      order_type: "takeout",
      customer_discount_type_id: null,
      payment_method: "cash",
      amount_paid: 0,
    });
    setSelectedDiscount(null);
  }, []);

  // Calculations - Memoized to prevent recalculation on every render
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cartItems]);

  const discount = useMemo(() => {
    if (!selectedDiscount) return 0;
    return (subtotal * selectedDiscount.discount_percentage) / 100;
  }, [subtotal, selectedDiscount]);

  const total = useMemo(() => {
    return subtotal - discount;
  }, [subtotal, discount]);

  const change = useMemo(() => {
    if (orderForm.payment_method !== "cash") return 0;
    return Math.max(0, orderForm.amount_paid - total);
  }, [orderForm.payment_method, orderForm.amount_paid, total]);

  // Handle discount selection
  const handleDiscountChange = (discountId: string) => {
    if (!discountId || discountId === "none") {
      setSelectedDiscount(null);
      setOrderForm({ ...orderForm, customer_discount_type_id: null });

      return;
    }

    const discount = discounts.find(
      (d) => d.discount_type_id === parseInt(discountId),
    );

    if (discount) {
      setSelectedDiscount(discount);
      setOrderForm({
        ...orderForm,
        customer_discount_type_id: discount.discount_type_id,
      });
    }
  };

  // Handle order submission
  const handleSubmitOrder = async () => {
    // Validation
    if (cartItems.length === 0) {
      setErrorMessage("Please add items to cart");

      return;
    }

    if (!orderForm.customer_name.trim()) {
      setErrorMessage("Please enter customer name");

      return;
    }

    if (
      orderForm.payment_method === "cash" &&
      orderForm.amount_paid < total
    ) {
      setErrorMessage("Amount paid is less than total");

      return;
    }

    try {
      setProcessingOrder(true);
      setErrorMessage("");

      // Prepare order data
      const orderData = {
        customer_name: orderForm.customer_name,
        customer_phone: orderForm.customer_phone || null,
        order_type: orderForm.order_type,
        customer_discount_type_id: orderForm.customer_discount_type_id,
        items: cartItems.map((ci) => ({
          menu_item_id: ci.menuItem.menu_item_id,
          quantity: ci.quantity,
          unit_price: Number(ci.menuItem.current_price),
        })),
        payment_method: orderForm.payment_method,
        amount_paid:
          orderForm.payment_method === "cash"
            ? orderForm.amount_paid
            : total,
        order_source: "cashier",
      };

      const response = await OrderService.createOrder(orderData);

      if (response.success && response.data) {
        const orderId =
          typeof response.data === "object"
            ? (response.data as any).order_id
            : response.data;

        setCreatedOrderId(orderId);
        setSuccessMessage(`Order #${orderId} created successfully!`);
        setShowSuccessModal(true);

        // Clear form after success
        setTimeout(() => {
          clearCart();
          setShowSuccessModal(false);
        }, 3000);
      } else {
        setErrorMessage(response.message || "Failed to create order");
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to create order");
    } finally {
      setProcessingOrder(false);
    }
  };

  // Filter menu items by search - Memoized to prevent filtering on every render
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [menuItems, searchTerm]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-rich-brown mb-2">
          Create New Order
        </h1>
        <p className="text-warm-brown">
          Create walk-in orders with discount support
        </p>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
            exit={{ opacity: 0, y: -20 }}
            initial={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-danger-50 border-2 border-danger">
              <CardBody>
                <p className="text-danger font-medium">{errorMessage}</p>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Menu Items */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-col gap-4 p-6">
              <div className="flex items-center justify-between w-full">
                <h2 className="text-xl font-bold text-rich-brown">
                  Menu Items
                </h2>
              </div>

              {/* Search */}
              <Input
                isClearable
                placeholder="Search menu items..."
                startContent={
                  <MagnifyingGlassIcon className="h-5 w-5 text-default-400" />
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm("")}
              />
            </CardHeader>

            <Divider />

            <CardBody className="p-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredMenuItems.map((item) => (
                    <Card
                      key={item.menu_item_id}
                      isPressable
                      className="hover:scale-105 transition-transform cursor-pointer"
                      onPress={() => addToCart(item)}
                    >
                      <CardBody className="p-0">
                        {/* Image Section */}
                        <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
                          {getImageUrl(item.image_url) ? (
                            <Image
                              fill
                              unoptimized
                              alt={item.name}
                              className="object-cover"
                              sizes="(max-width: 768px) 50vw, 33vw"
                              src={getImageUrl(item.image_url) || ""}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-5xl">🍰</span>
                            </div>
                          )}
                        </div>

                        {/* Info Section */}
                        <div className="p-4">
                          <p className="font-bold text-rich-brown mb-2 line-clamp-2 min-h-[3rem]">
                            {item.name}
                          </p>
                          <p className="text-lg font-bold text-success mb-2">
                            ₱{Number(item.current_price).toFixed(2)}
                          </p>
                          <Chip color="primary" size="sm" variant="flat">
                            {item.item_type}
                          </Chip>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right Column - Cart & Checkout */}
        <div className="space-y-4">
          {/* Cart */}
          <Card className="shadow-lg">
            <CardHeader className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10">
              <div className="flex items-center gap-2">
                <ShoppingCartIcon className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold text-rich-brown">
                  Cart ({cartItems.length})
                </h2>
              </div>
            </CardHeader>

            <Divider />

            <CardBody className="p-4 max-h-[400px] overflow-y-auto">
              {cartItems.length === 0 ? (
                <div className="text-center py-8 text-warm-brown">
                  <ShoppingCartIcon className="h-12 w-12 mx-auto mb-2 text-default-300" />
                  <p>Cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.menuItem.menu_item_id}
                      className="flex items-center gap-3 p-3 bg-cream-white rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-rich-brown">
                          {item.menuItem.name}
                        </p>
                        <p className="text-sm text-warm-brown">
                          ₱{Number(item.menuItem.current_price).toFixed(2)} each
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          onPress={() =>
                            updateQuantity(
                              item.menuItem.menu_item_id,
                              item.quantity - 1,
                            )
                          }
                        >
                          <MinusIcon className="h-4 w-4" />
                        </Button>

                        <span className="w-8 text-center font-bold">
                          {item.quantity}
                        </span>

                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          onPress={() =>
                            updateQuantity(
                              item.menuItem.menu_item_id,
                              item.quantity + 1,
                            )
                          }
                        >
                          <PlusIcon className="h-4 w-4" />
                        </Button>

                        <Button
                          isIconOnly
                          color="danger"
                          size="sm"
                          variant="flat"
                          onPress={() =>
                            removeFromCart(item.menuItem.menu_item_id)
                          }
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Customer & Discount Info */}
          {cartItems.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader className="p-4">
                <h3 className="text-lg font-bold text-rich-brown">
                  Customer Information
                </h3>
              </CardHeader>

              <Divider />

              <CardBody className="p-4 space-y-4">
                {/* Customer Name */}
                <Input
                  isRequired
                  label="Customer Name"
                  placeholder="Enter customer name"
                  startContent={
                    <UserIcon className="h-4 w-4 text-default-400" />
                  }
                  value={orderForm.customer_name}
                  onChange={(e) =>
                    setOrderForm({
                      ...orderForm,
                      customer_name: e.target.value,
                    })
                  }
                />

                {/* Customer Phone */}
                <Input
                  label="Phone Number (Optional)"
                  placeholder="Enter phone number"
                  startContent={
                    <PhoneIcon className="h-4 w-4 text-default-400" />
                  }
                  value={orderForm.customer_phone}
                  onChange={(e) =>
                    setOrderForm({
                      ...orderForm,
                      customer_phone: e.target.value,
                    })
                  }
                />

                {/* Order Type */}
                <div>
                  <label className="block text-sm font-medium text-rich-brown mb-2">
                    Order Type
                  </label>
                  <Select
                    isRequired
                    selectedKeys={[orderForm.order_type]}
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys)[0] as
                        | "dine_in"
                        | "takeout"
                        | "delivery";

                      setOrderForm({ ...orderForm, order_type: value });
                    }}
                  >
                    <SelectItem key="takeout">🚗 Takeout</SelectItem>
                    <SelectItem key="dine_in">🍽️ Dine In</SelectItem>
                    <SelectItem key="delivery">🚚 Delivery</SelectItem>
                  </Select>
                </div>

                {/* Discount Selection */}
                <div>
                  <label className="block text-sm font-medium text-rich-brown mb-2">
                    <div className="flex items-center gap-2">
                      <PercentBadgeIcon className="h-5 w-5" />
                      Apply Discount
                    </div>
                  </label>
                  <Select
                    placeholder="Select discount type"
                    selectedKeys={
                      selectedDiscount
                        ? [selectedDiscount.discount_type_id.toString()]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys)[0] as string;

                      handleDiscountChange(value);
                    }}
                  >
                    <SelectItem key="none">No Discount</SelectItem>
                    {
                      discounts.map((discount) => (
                        <SelectItem key={discount.discount_type_id.toString()}>
                          {discount.name} - {discount.discount_percentage}%
                          {discount.requires_id && " (Requires ID)"}
                        </SelectItem>
                      )) as any
                    }
                  </Select>

                  {selectedDiscount && selectedDiscount.requires_id && (
                    <p className="text-xs text-warning mt-2">
                      ⚠️ Please verify customer ID before applying this discount
                    </p>
                  )}
                </div>

                {/* Payment Method */}
                <div> 
                  <label className="block text-sm font-medium text-rich-brown mb-2">
                    Payment Method -Cashier Only has Cash-
                  </label>
                  <Select
                    isDisabled
                    selectedKeys={[orderForm.payment_method]}
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys)[0] as
                        | "cash"
                        | "gcash"
                        | "maya";

                      setOrderForm({ ...orderForm, payment_method: value });
                    }}
                  >
                    <SelectItem key="cash">Cash</SelectItem>
                    <SelectItem key="gcash">GCash</SelectItem>
                    <SelectItem key="maya">Maya</SelectItem>
                  </Select>
                </div>

                {/* Amount Paid (Cash only) */}
                {orderForm.payment_method === "cash" && (
                  <Input
                    label="Amount Paid"
                    placeholder="0.00"
                    startContent={<span className="text-default-400">₱</span>}
                    type="number"
                    value={orderForm.amount_paid.toString()}
                    onChange={(e) =>
                      setOrderForm({
                        ...orderForm,
                        amount_paid: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                )}
              </CardBody>
            </Card>
          )}

          {/* Order Summary */}
          {cartItems.length > 0 && (
            <Card className="shadow-lg bg-gradient-to-br from-primary/10 to-secondary/10">
              <CardBody className="p-4 space-y-3">
                <h3 className="text-lg font-bold text-rich-brown mb-2">
                  Order Summary
                </h3>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-warm-brown">Subtotal:</span>
                    <span className="font-bold">
                      ₱{subtotal.toFixed(2)}
                    </span>
                  </div>

                  {selectedDiscount && (
                    <div className="flex justify-between text-success">
                      <span>
                        Discount ({selectedDiscount.discount_percentage}%):
                      </span>
                      <span className="font-bold">
                        -₱{discount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <Divider />

                  <div className="flex justify-between text-lg">
                    <span className="font-bold text-rich-brown">Total:</span>
                    <span className="font-bold text-success">
                      ₱{total.toFixed(2)}
                    </span>
                  </div>

                  {orderForm.payment_method === "cash" &&
                    orderForm.amount_paid > 0 && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-warm-brown">Amount Paid:</span>
                          <span>₱{orderForm.amount_paid.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-warm-brown">Change:</span>
                          <span className="font-bold text-warning">
                            ₱{change.toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                </div>

                <Divider />

                <Button
                  className="w-full font-bold"
                  color="success"
                  isLoading={processingOrder}
                  size="lg"
                  startContent={
                    !processingOrder && <BanknotesIcon className="h-5 w-5" />
                  }
                  onPress={handleSubmitOrder}
                >
                  {processingOrder ? "Processing..." : "Complete Order"}
                </Button>

                <Button
                  className="w-full"
                  isDisabled={processingOrder}
                  size="sm"
                  variant="light"
                  onPress={clearCart}
                >
                  Clear Cart
                </Button>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2 text-success">
              <CheckCircleIcon className="h-6 w-6" />
              Order Created Successfully!
            </div>
          </ModalHeader>
          <ModalBody>
            <p className="text-center text-lg">{successMessage}</p>
            {createdOrderId && (
              <p className="text-center text-2xl font-bold text-primary">
                Order #{createdOrderId}
              </p>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
