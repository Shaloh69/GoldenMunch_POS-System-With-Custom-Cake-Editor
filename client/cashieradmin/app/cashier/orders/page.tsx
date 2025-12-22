"use client";

import type {
  CustomerOrder,
  OrderTimelineEntry,
  CustomerDiscountType,
} from "@/types/api";

import { useEffect, useState, useRef } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
} from "@heroui/drawer";
import { useDisclosure } from "@heroui/modal";
import { Spinner } from "@heroui/spinner";
import { Divider } from "@heroui/divider";
import { Tabs, Tab } from "@heroui/tabs";
import { addToast } from "@heroui/toast";
import {
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  BanknotesIcon,
  QrCodeIcon,
  CreditCardIcon,
  PercentBadgeIcon,
  UserIcon,
  PhoneIcon,
  ShoppingBagIcon,
  ReceiptPercentIcon,
  CalendarDaysIcon,
  PrinterIcon,
  ExclamationTriangleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

import { OrderService } from "@/services/order.service";
import { DiscountService } from "@/services/discount.service";
import { printerService } from "@/services/printer.service";
import { OrderStatus } from "@/types/api";

const statusColors: Record<
  string,
  "default" | "primary" | "secondary" | "success" | "warning" | "danger"
> = {
  pending: "warning",
  confirmed: "primary",
  preparing: "secondary",
  ready: "success",
  completed: "default",
  cancelled: "danger",
};

const paymentMethodIcons: Record<string, JSX.Element> = {
  cash: <BanknotesIcon className="h-4 w-4" />,
  gcash: <QrCodeIcon className="h-4 w-4" />,
  paymaya: <QrCodeIcon className="h-4 w-4" />,
  cashless: <CreditCardIcon className="h-4 w-4" />,
};

// Helper function to safely parse numeric values from database (returns as strings)
const parseAmount = (value: any): number => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const parsed = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(parsed) ? 0 : parsed;
};

export default function UnifiedCashierPage() {
  // Tab state
  const [selectedTab, setSelectedTab] = useState<string>("pending");

  // Orders state
  const [pendingOrders, setPendingOrders] = useState<CustomerOrder[]>([]);
  const [activeOrders, setActiveOrders] = useState<CustomerOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected order and modals
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(
    null,
  );
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Order timeline
  const [orderTimeline, setOrderTimeline] = useState<OrderTimelineEntry[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Payment verification
  const [referenceNumber, setReferenceNumber] = useState("");
  const [amountTendered, setAmountTendered] = useState("");
  const [calculatedChange, setCalculatedChange] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // Discounts
  const [discounts, setDiscounts] = useState<CustomerDiscountType[]>([]);
  const [selectedDiscount, setSelectedDiscount] =
    useState<CustomerDiscountType | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Stats
  const [stats, setStats] = useState({
    pendingPayments: 0,
    activeOrders: 0,
    completedToday: 0,
  });

  // Printer status
  const [printerStatus, setPrinterStatus] = useState<{
    available: boolean;
    connected: boolean;
    printerName?: string;
  }>({
    available: false,
    connected: false,
  });
  const [loadingPrinterStatus, setLoadingPrinterStatus] = useState(true);

  // Delete order
  const [deleting, setDeleting] = useState(false);

  // Track first load to prevent loading state on auto-refresh
  const isFirstLoad = useRef(true);

  // Load data on mount and refresh every 10 seconds
  useEffect(() => {
    loadAllData();
    loadDiscounts();
    loadPrinterStatus();

    const interval = setInterval(() => loadAllData(false), 10000);
    const printerInterval = setInterval(loadPrinterStatus, 30000); // Check printer every 30 seconds

    return () => {
      clearInterval(interval);
      clearInterval(printerInterval);
    };
  }, []);

  const loadAllData = async (showLoading = true) => {
    try {
      // Only show loading spinner on first load or manual refresh
      if (showLoading && isFirstLoad.current) {
        setLoading(true);
        isFirstLoad.current = false;
      }

      // Load all orders
      const response = await OrderService.getOrders();

      if (response.success && response.data) {
        const allOrders = (response.data as any).orders || [];

        // Separate orders by status
        const pending = allOrders.filter(
          (o: CustomerOrder) => o.order_status === OrderStatus.PENDING,
        );
        const active = allOrders.filter((o: CustomerOrder) =>
          [
            OrderStatus.CONFIRMED,
            OrderStatus.PREPARING,
            OrderStatus.READY,
          ].includes(o.order_status as OrderStatus),
        );
        const completed = allOrders.filter((o: CustomerOrder) =>
          [OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(
            o.order_status as OrderStatus,
          ),
        );

        setPendingOrders(pending);
        setActiveOrders(active);
        setCompletedOrders(completed);

        // Update stats
        setStats({
          pendingPayments: pending.length,
          activeOrders: active.length,
          completedToday: completed.filter((o: CustomerOrder) => {
            const orderDate = new Date(o.order_datetime);
            const today = new Date();

            return orderDate.toDateString() === today.toDateString();
          }).length,
        });
      }
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDiscounts = async () => {
    try {
      const response = await DiscountService.getActiveDiscountTypes();

      if (response.success && response.data) {
        setDiscounts(response.data);
      }
    } catch (error) {
      console.error("Failed to load discounts:", error);
    }
  };

  const loadPrinterStatus = async () => {
    try {
      const status = await printerService.getStatus();

      setPrinterStatus({
        available: status.available,
        connected: status.connected,
        printerName: status.config?.printerName || status.config?.name || "Default Printer",
      });
    } catch (error) {
      console.error("Failed to load printer status:", error);
      setPrinterStatus({
        available: false,
        connected: false,
      });
    } finally {
      setLoadingPrinterStatus(false);
    }
  };

  const handleTestPrint = async () => {
    try {
      const result = await printerService.printTest();

      if (result.success) {
        addToast({
          title: "Test Print Sent",
          description: "Test receipt has been sent to the printer",
          color: "success",
          timeout: 3000,
        });
      } else {
        addToast({
          title: "Print Failed",
          description: result.error || "Failed to print test receipt",
          color: "danger",
          timeout: 5000,
        });
      }
    } catch (error) {
      console.error("Test print error:", error);
      addToast({
        title: "Print Error",
        description: "An error occurred while testing the printer",
        color: "danger",
        timeout: 5000,
      });
    }
  };

  const loadOrderTimeline = async (orderId: number) => {
    try {
      setLoadingTimeline(true);
      const response = await OrderService.getOrderTimeline(orderId);

      if (response.success && response.data) {
        setOrderTimeline(response.data);
      }
    } catch (error) {
      console.error("Failed to load timeline:", error);
      setOrderTimeline([]);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const handleViewOrder = async (order: CustomerOrder) => {
    try {
      const response = await OrderService.getOrderById(order.order_id);

      if (response.success && response.data) {
        // Debug logging to diagnose total display issues
        console.log('📊 Order data received:', {
          order_id: response.data.order_id,
          subtotal: response.data.subtotal,
          total_amount: response.data.total_amount,
          final_amount: response.data.final_amount,
          subtotal_type: typeof response.data.subtotal,
          total_type: typeof response.data.total_amount,
          final_type: typeof response.data.final_amount,
        });

        setSelectedOrder(response.data);
        loadOrderTimeline(order.order_id);
        setVerifyError("");
        setReferenceNumber("");
        setAmountTendered("");
        setSelectedDiscount(null);
        onOpen();
      }
    } catch (error) {
      console.error("Failed to load order details:", error);
    }
  };

  const handleVerifyPayment = async () => {
    if (!selectedOrder) return;

    const finalAmount = selectedDiscount
      ? calculateFinalAmount(
          Number(selectedOrder.final_amount || 0),
          selectedDiscount,
        )
      : Number(selectedOrder.final_amount || 0);

    // Validate payment based on method
    if (selectedOrder.payment_method === "cash") {
      const tendered = Number(amountTendered);

      if (!tendered || tendered < finalAmount) {
        setVerifyError(
          `Insufficient amount. Required: ₱${finalAmount.toFixed(2)}, Tendered: ₱${tendered.toFixed(2)}`,
        );

        return;
      }
    } else if (["gcash", "paymaya"].includes(selectedOrder.payment_method)) {
      if (!referenceNumber || referenceNumber.trim().length < 5) {
        setVerifyError(
          "Please enter a valid reference number (minimum 5 characters)",
        );

        return;
      }
    }

    setVerifying(true);
    setVerifyError("");

    try {
      const response = await OrderService.verifyPayment({
        order_id: selectedOrder.order_id,
        payment_method: selectedOrder.payment_method,
        reference_number: referenceNumber || undefined,
      });

      if (!response.success) {
        throw new Error(response.error || "Payment verification failed");
      }

      // Update order status to confirmed
      const statusResponse = await OrderService.updateOrderStatus(
        selectedOrder.order_id,
        {
          order_status: OrderStatus.CONFIRMED,
          notes: selectedDiscount
            ? `Payment verified with ${selectedDiscount.name} (${selectedDiscount.discount_percentage}% off)`
            : "Payment verified",
        },
      );

      if (!statusResponse.success) {
        throw new Error("Failed to update order status");
      }

      // Print receipt
      try {
        console.log("🖨️ Printing receipt for completed order...");
        const receiptData = printerService.formatOrderForPrint({
          ...selectedOrder,
          final_amount: finalAmount,
          discount_amount: selectedDiscount
            ? calculateDiscount(
                Number(selectedOrder.final_amount || 0),
                selectedDiscount,
              )
            : 0,
        });

        const printResult = await printerService.printReceipt(receiptData);

        if (printResult.success) {
          addToast({
            title: "Receipt Printed",
            description: `Receipt for Order #${selectedOrder.order_number} has been printed`,
            color: "success",
            timeout: 3000,
          });
        }
      } catch (printError) {
        console.error("Print error (non-blocking):", printError);
      }

      addToast({
        title: "Payment Verified",
        description: `Order #${selectedOrder.order_number} confirmed and moved to Active Orders`,
        color: "success",
        timeout: 3000,
      });

      onClose();
      loadAllData();
      setSelectedTab("active"); // Switch to active orders tab
    } catch (error: any) {
      console.error("Payment verification error:", error);
      setVerifyError(
        error.message || "Failed to verify payment. Please try again.",
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;

    try {
      const response = await OrderService.updateOrderStatus(
        selectedOrder.order_id,
        {
          order_status: newStatus,
          notes: `Status updated to ${newStatus}`,
        },
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to update status");
      }

      addToast({
        title: "Status Updated",
        description: `Order #${selectedOrder.order_number} is now ${newStatus}`,
        color: "success",
        timeout: 3000,
      });

      onClose();
      loadAllData();

      // Auto-switch to appropriate tab
      if (newStatus === OrderStatus.COMPLETED) {
        setSelectedTab("completed");
      }
    } catch (error: any) {
      console.error("Status update error:", error);
      addToast({
        title: "Error",
        description: error.message || "Failed to update status",
        color: "danger",
        timeout: 3000,
      });
    }
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete Order #${selectedOrder.order_number}? This action cannot be undone.`,
    );

    if (!confirmDelete) return;

    try {
      setDeleting(true);

      const response = await OrderService.deleteOrder(selectedOrder.order_id);

      if (!response.success) {
        throw new Error(response.error || "Failed to delete order");
      }

      addToast({
        title: "Order Deleted",
        description: `Order #${selectedOrder.order_number} has been deleted successfully`,
        color: "success",
        timeout: 3000,
      });

      onClose();
      loadAllData();
    } catch (error: any) {
      console.error("Delete order error:", error);
      addToast({
        title: "Error",
        description: error.message || "Failed to delete order",
        color: "danger",
        timeout: 5000,
      });
    } finally {
      setDeleting(false);
    }
  };

  const calculateDiscount = (
    amount: number,
    discount: CustomerDiscountType,
  ): number => {
    return (amount * discount.discount_percentage) / 100;
  };

  const calculateFinalAmount = (
    amount: number,
    discount: CustomerDiscountType | null,
  ): number => {
    if (!discount) return amount;

    return amount - calculateDiscount(amount, discount);
  };

  const calculateChange = (tendered: number, amount: number): number => {
    return Math.max(0, tendered - amount);
  };

  // Update change when amount tendered changes
  useEffect(() => {
    if (selectedOrder && amountTendered) {
      const orderTotal = parseAmount(selectedOrder.final_amount) ||
                        parseAmount(selectedOrder.total_amount) ||
                        parseAmount(selectedOrder.subtotal) || 0;
      const finalAmount = selectedDiscount
        ? calculateFinalAmount(orderTotal, selectedDiscount)
        : orderTotal;

      setCalculatedChange(calculateChange(parseAmount(amountTendered), finalAmount));
    } else {
      setCalculatedChange(0);
    }
  }, [amountTendered, selectedOrder, selectedDiscount]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filterOrders = (orders: CustomerOrder[]) => {
    if (!searchQuery) return orders;

    const query = searchQuery.toLowerCase();

    return orders.filter(
      (order) =>
        order.order_number?.toLowerCase().includes(query) ||
        order.name?.toLowerCase().includes(query) ||
        order.phone?.toLowerCase().includes(query),
    );
  };

  const renderOrdersTable = (
    orders: CustomerOrder[],
    showPaymentAction: boolean = false,
  ) => {
    const filteredOrders = filterOrders(orders);

    if (loading) {
      return (
        <div className="flex justify-center items-center p-12">
          <Spinner size="lg" />
        </div>
      );
    }

    if (filteredOrders.length === 0) {
      return (
        <div className="text-center p-12 text-default-500">
          <ClockIcon className="h-16 w-16 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-semibold">No orders found</p>
          <p className="text-sm">
            {searchQuery
              ? "Try a different search term"
              : "Orders will appear here once placed"}
          </p>
        </div>
      );
    }

    return (
      <Table aria-label="Orders table">
        <TableHeader>
          <TableColumn>ORDER #</TableColumn>
          <TableColumn>CUSTOMER</TableColumn>
          <TableColumn>AMOUNT</TableColumn>
          <TableColumn>PAYMENT</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>TIME</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody>
          {filteredOrders.map((order) => (
            <TableRow key={order.order_id}>
              <TableCell>
                <span className="font-mono font-bold">
                  {order.order_number}
                </span>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-semibold">{order.name || "Guest"}</p>
                  <p className="text-xs text-default-500">{order.phone}</p>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-semibold">
                  ₱{Number(order.final_amount || 0).toFixed(2)}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {paymentMethodIcons[order.payment_method]}
                  <span className="capitalize">{order.payment_method}</span>
                </div>
              </TableCell>
              <TableCell>
                <Chip
                  color={statusColors[order.order_status]}
                  size="sm"
                  variant="flat"
                >
                  {order.order_status}
                </Chip>
              </TableCell>
              <TableCell>
                <span className="text-sm text-default-600">
                  {formatDate(order.order_datetime)}
                </span>
              </TableCell>
              <TableCell>
                <Button
                  color="primary"
                  size="sm"
                  variant="flat"
                  onPress={() => handleViewOrder(order)}
                >
                  {showPaymentAction ? "Verify Payment" : "View Details"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderOrderDetailsModal = () => {
    if (!selectedOrder) return null;

    const isPending = selectedOrder.order_status === OrderStatus.PENDING;
    const isActive = [
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.READY,
    ].includes(selectedOrder.order_status as OrderStatus);

    // Calculate final amount with robust parsing for database string values
    const orderTotal = parseAmount(selectedOrder.final_amount) ||
                      parseAmount(selectedOrder.total_amount) ||
                      parseAmount(selectedOrder.subtotal) || 0;
    const finalAmount = selectedDiscount
      ? calculateFinalAmount(orderTotal, selectedDiscount)
      : orderTotal;

    // Debug logging for total calculation
    console.log('💰 Total calculation:', {
      final_amount: selectedOrder.final_amount,
      total_amount: selectedOrder.total_amount,
      subtotal: selectedOrder.subtotal,
      parsed_final: parseAmount(selectedOrder.final_amount),
      parsed_total: parseAmount(selectedOrder.total_amount),
      parsed_subtotal: parseAmount(selectedOrder.subtotal),
      orderTotal,
      finalAmount,
      hasDiscount: !!selectedDiscount,
    });

    return (
      <Drawer isOpen={isOpen} size="4xl" onClose={onClose}>
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="flex flex-col gap-1 bg-gradient-to-br from-golden-orange/10 via-deep-amber/5 to-transparent border-b-2 border-golden-orange/20 pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-golden-orange to-deep-amber rounded-xl shadow-lg">
                      <ReceiptPercentIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
                        Order #{selectedOrder.order_number}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <CalendarDaysIcon className="h-4 w-4 text-default-400" />
                        <p className="text-sm text-default-600 font-medium">
                          {formatDate(selectedOrder.order_datetime)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Chip
                    color={statusColors[selectedOrder.order_status]}
                    size="lg"
                    variant="shadow"
                    className="font-bold uppercase tracking-wide"
                  >
                    {selectedOrder.order_status}
                  </Chip>
                </div>
              </DrawerHeader>
              <DrawerBody className="gap-6 py-6">{/* Phase 1: Customer Information */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-1 bg-gradient-to-b from-golden-orange to-deep-amber rounded-full" />
                    <h3 className="text-xl font-black text-default-900 uppercase tracking-wide">
                      Phase 1: Customer Details
                    </h3>
                  </div>
                  <Card className="border-2 border-default-200 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-default-200">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-5 w-5 text-blue-600" />
                        <h3 className="font-bold text-lg">
                          Customer Information
                        </h3>
                      </div>
                    </CardHeader>
                    <CardBody className="grid grid-cols-2 gap-6 p-6">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <UserIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-default-500 uppercase tracking-wide font-semibold mb-1">
                            Name
                          </p>
                          <p className="font-bold text-lg text-default-900">
                            {selectedOrder.name || "Guest"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <PhoneIcon className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-default-500 uppercase tracking-wide font-semibold mb-1">
                            Phone
                          </p>
                          <p className="font-bold text-lg text-default-900">
                            {selectedOrder.phone || "N/A"}
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>

                {/* Divider */}
                <Divider className="my-4 bg-gradient-to-r from-transparent via-golden-orange/30 to-transparent h-0.5" />

                {/* Phase 2: Order Items */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-1 bg-gradient-to-b from-golden-orange to-deep-amber rounded-full" />
                    <h3 className="text-xl font-black text-default-900 uppercase tracking-wide">
                      Phase 2: Order Items & Pricing
                    </h3>
                  </div>
            <Card className="border-2 border-default-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-default-200">
                <div className="flex items-center gap-2">
                  <ShoppingBagIcon className="h-5 w-5 text-green-600" />
                  <h3 className="font-bold text-lg">Order Items</h3>
                </div>
              </CardHeader>
              <CardBody className="p-6">
                <div className="space-y-3">
                  {(selectedOrder as any).items &&
                  (selectedOrder as any).items.length > 0 ? (
                    (selectedOrder as any).items.map(
                      (item: any, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-4 bg-gradient-to-r from-default-50 to-default-100 rounded-xl hover:shadow-md transition-all duration-200 border border-default-200"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-lg shadow-sm">
                              <ShoppingBagIcon className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <p className="font-bold text-lg text-default-900">
                                {item.menu_item_name || "Unknown Item"}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Chip
                                  size="sm"
                                  variant="flat"
                                  color="primary"
                                  className="font-semibold"
                                >
                                  Qty: {item.quantity || 0}
                                </Chip>
                                <span className="text-sm text-default-500">
                                  @ ₱{Number(item.unit_price || 0).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            ₱{Number(item.item_total || 0).toFixed(2)}
                          </p>
                        </div>
                      ),
                    )
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingBagIcon className="h-16 w-16 text-default-300 mx-auto mb-3" />
                      <p className="text-default-500 font-medium">
                        No items found
                      </p>
                    </div>
                  )}
                </div>
                <Divider className="my-6" />
                <div className="space-y-3 bg-gradient-to-br from-default-50 to-default-100 p-6 rounded-xl border-2 border-default-200">
                  {selectedDiscount && (
                    <>
                      <div className="flex justify-between items-center text-default-700">
                        <span className="font-medium">Subtotal:</span>
                        <span className="font-semibold text-lg">
                          ₱{Number(selectedOrder.final_amount || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-success-50 rounded-lg border border-success-200">
                        <div className="flex items-center gap-2">
                          <PercentBadgeIcon className="h-5 w-5 text-success-600" />
                          <span className="font-semibold text-success-700">
                            Discount ({selectedDiscount.name} -{" "}
                            {selectedDiscount.discount_percentage}%)
                          </span>
                        </div>
                        <span className="font-bold text-lg text-success-700">
                          -₱
                          {calculateDiscount(
                            Number(selectedOrder.final_amount || 0),
                            selectedDiscount,
                          ).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                  <Divider />
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-2xl font-black text-default-900">
                      Total:
                    </span>
                    <span className="text-3xl font-black bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
                      ₱{(finalAmount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                  </CardBody>
                </Card>
              </div>

              {/* Divider */}
              <Divider className="my-4 bg-gradient-to-r from-transparent via-golden-orange/30 to-transparent h-0.5" />

              {/* Phase 3: Payment Verification (for pending orders) */}
              {isPending && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-1 bg-gradient-to-b from-golden-orange to-deep-amber rounded-full" />
                    <h3 className="text-xl font-black text-default-900 uppercase tracking-wide">
                      Phase 3: Payment Verification
                    </h3>
                  </div>
                  <Card className="border-3 border-warning-400 bg-gradient-to-br from-warning-50 to-yellow-50 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-warning-100 to-yellow-100 border-b-3 border-warning-300">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-warning-500 rounded-xl shadow-lg animate-pulse">
                      <BanknotesIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-black text-xl text-warning-900">
                        Payment Verification Required
                      </h3>
                      <p className="text-sm text-warning-700 font-medium">
                        Complete payment verification to confirm order
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="space-y-5 p-6">
                  {/* Discount Selection */}
                  <Select
                    label="Apply Discount (Optional)"
                    placeholder="Select a discount"
                    selectedKeys={
                      selectedDiscount
                        ? [selectedDiscount.discount_type_id.toString()]
                        : []
                    }
                    startContent={<PercentBadgeIcon className="h-4 w-4" />}
                    onChange={(e) => {
                      const discount = discounts.find(
                        (d) => d.discount_type_id.toString() === e.target.value,
                      );

                      setSelectedDiscount(discount || null);
                    }}
                  >
                    {discounts.map((discount) => (
                      <SelectItem key={discount.discount_type_id.toString()}>
                        {discount.name} - {discount.discount_percentage}% off
                      </SelectItem>
                    ))}
                  </Select>

                  {/* Cash Payment */}
                  {selectedOrder.payment_method === "cash" && (
                    <>
                      <Input
                        label="Amount Tendered"
                        placeholder="0.00"
                        size="lg"
                        variant="bordered"
                        classNames={{
                          input: "text-lg font-bold",
                          inputWrapper:
                            "border-2 border-default-300 hover:border-primary-500 focus-within:!border-primary-500",
                        }}
                        startContent={
                          <span className="text-default-600 text-lg font-bold">
                            ₱
                          </span>
                        }
                        type="number"
                        value={amountTendered}
                        onValueChange={setAmountTendered}
                      />
                      {amountTendered && (
                        <div className="bg-gradient-to-br from-success-50 to-green-100 p-6 rounded-2xl border-3 border-success-300 shadow-lg">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-success-500 rounded-xl">
                                <BanknotesIcon className="h-6 w-6 text-white" />
                              </div>
                              <span className="text-xl font-bold text-success-900">
                                Change:
                              </span>
                            </div>
                            <span className="text-4xl font-black bg-gradient-to-r from-success-600 to-green-600 bg-clip-text text-transparent">
                              ₱{calculatedChange.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Digital Payment */}
                  {["gcash", "paymaya"].includes(
                    selectedOrder.payment_method,
                  ) && (
                    <Input
                      label="Reference Number"
                      placeholder="Enter reference number"
                      size="lg"
                      variant="bordered"
                      classNames={{
                        input: "text-lg font-semibold",
                        inputWrapper:
                          "border-2 border-default-300 hover:border-primary-500 focus-within:!border-primary-500",
                      }}
                      startContent={<QrCodeIcon className="h-5 w-5" />}
                      value={referenceNumber}
                      onValueChange={setReferenceNumber}
                    />
                  )}

                  {verifyError && (
                    <div className="bg-gradient-to-r from-danger-50 to-red-100 p-5 rounded-xl border-2 border-danger-300 shadow-md">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-danger-500 rounded-lg">
                          <ClockIcon className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-danger-800 font-semibold flex-1">
                          {verifyError}
                        </p>
                      </div>
                    </div>
                  )}
                    </CardBody>
                  </Card>
                </div>
              )}

              {/* Divider */}
              <Divider className="my-4 bg-gradient-to-r from-transparent via-golden-orange/30 to-transparent h-0.5" />

              {/* Phase 4: Order Timeline */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-1 bg-gradient-to-b from-golden-orange to-deep-amber rounded-full" />
                  <h3 className="text-xl font-black text-default-900 uppercase tracking-wide">
                    {isPending
                      ? "Phase 4: Order History"
                      : "Order Processing Timeline"}
                  </h3>
                </div>
            <Card className="border-2 border-default-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-default-200">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-purple-600" />
                  <h3 className="font-bold text-lg">Order Timeline</h3>
                </div>
              </CardHeader>
              <CardBody className="p-6">
                {loadingTimeline ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="lg" color="primary" />
                  </div>
                ) : orderTimeline.length > 0 ? (
                  <div className="relative space-y-6">
                    {/* Vertical line */}
                    <div className="absolute left-[17px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-purple-300 via-pink-300 to-purple-300" />

                    {orderTimeline.map((entry, index) => (
                      <div key={index} className="flex items-start gap-5 relative">
                        {/* Timeline dot */}
                        <div className="relative z-10">
                          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg">
                            <CheckCircleIcon className="h-5 w-5 text-white" />
                          </div>
                        </div>

                        <div className="flex-1 bg-gradient-to-r from-default-50 to-default-100 p-4 rounded-xl border-2 border-default-200 shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <Chip
                              color={statusColors[entry.status]}
                              size="md"
                              variant="flat"
                              className="font-bold uppercase"
                            >
                              {entry.status}
                            </Chip>
                            <div className="flex items-center gap-2 text-default-500">
                              <ClockIcon className="h-4 w-4" />
                              <span className="text-sm font-semibold">
                                {new Date(entry.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                          {entry.notes && (
                            <p className="text-sm text-default-700 font-medium mt-2 pl-2 border-l-3 border-purple-300">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ClockIcon className="h-16 w-16 text-default-300 mx-auto mb-3" />
                    <p className="text-default-500 font-medium">
                      No timeline available
                    </p>
                  </div>
                )}
                  </CardBody>
                </Card>
              </div>
            </DrawerBody>
            <DrawerFooter className="bg-gradient-to-r from-default-50 to-default-100 border-t-2 border-default-200 gap-3 p-6">
            <div className="flex gap-3 flex-1 justify-between">
              {/* Delete Button (left side, only for non-completed orders) */}
              {selectedOrder.order_status !== OrderStatus.COMPLETED &&
                selectedOrder.order_status !== OrderStatus.CANCELLED && (
                  <Button
                    color="danger"
                    variant="light"
                    size="lg"
                    className="font-semibold"
                    isLoading={deleting}
                    startContent={!deleting && <TrashIcon className="h-5 w-5" />}
                    onPress={handleDeleteOrder}
                  >
                    Delete Order
                  </Button>
                )}

              {/* Right side buttons */}
              <div className="flex gap-3">
                <Button
                  color="default"
                  variant="bordered"
                  size="lg"
                  className="font-semibold"
                  onPress={onClose}
                >
                  Close
                </Button>

                {/* Pending: Verify Payment */}
            {isPending && (
              <Button
                color="success"
                size="lg"
                className="font-bold shadow-lg"
                isLoading={verifying}
                startContent={
                  !verifying && <CheckCircleIcon className="h-5 w-5" />
                }
                onPress={handleVerifyPayment}
              >
                Verify Payment & Confirm Order
              </Button>
            )}

            {/* Active: Update Status */}
            {isActive && (
              <div className="flex gap-3">
                {selectedOrder.order_status === OrderStatus.CONFIRMED && (
                  <Button
                    color="primary"
                    size="lg"
                    className="font-bold shadow-lg"
                    startContent={<ClockIcon className="h-5 w-5" />}
                    onPress={() => handleUpdateStatus(OrderStatus.PREPARING)}
                  >
                    Mark as Preparing
                  </Button>
                )}
                {selectedOrder.order_status === OrderStatus.PREPARING && (
                  <Button
                    color="success"
                    size="lg"
                    className="font-bold shadow-lg"
                    startContent={<CheckCircleIcon className="h-5 w-5" />}
                    onPress={() => handleUpdateStatus(OrderStatus.READY)}
                  >
                    Mark as Ready
                  </Button>
                )}
                {selectedOrder.order_status === OrderStatus.READY && (
                  <Button
                    color="success"
                    size="lg"
                    className="font-bold shadow-lg"
                    startContent={<CheckCircleIcon className="h-5 w-5" />}
                    onPress={() => handleUpdateStatus(OrderStatus.COMPLETED)}
                  >
                    Mark as Completed
                  </Button>
                )}
              </div>
                )}
              </div>
            </div>
          </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
            Cashier Orders
          </h1>
          <p className="text-default-600 mt-2">
            Unified payment verification and order management
          </p>
        </div>

        {/* Printer Status */}
        <Card className="border-2 border-default-200 shadow-lg min-w-[280px]">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              {loadingPrinterStatus ? (
                <Spinner size="sm" />
              ) : (
                <div
                  className={`p-2 rounded-lg ${
                    printerStatus.connected
                      ? "bg-success-100"
                      : printerStatus.available
                        ? "bg-warning-100"
                        : "bg-danger-100"
                  }`}
                >
                  <PrinterIcon
                    className={`h-6 w-6 ${
                      printerStatus.connected
                        ? "text-success-600"
                        : printerStatus.available
                          ? "text-warning-600"
                          : "text-danger-600"
                    }`}
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-default-900">
                    Printer Status
                  </p>
                  {!loadingPrinterStatus && (
                    <Chip
                      size="sm"
                      variant="flat"
                      color={
                        printerStatus.connected
                          ? "success"
                          : printerStatus.available
                            ? "warning"
                            : "danger"
                      }
                      startContent={
                        printerStatus.connected ? (
                          <CheckCircleIcon className="h-3 w-3" />
                        ) : (
                          <ExclamationTriangleIcon className="h-3 w-3" />
                        )
                      }
                      className="font-semibold"
                    >
                      {printerStatus.connected
                        ? "Connected"
                        : printerStatus.available
                          ? "Available"
                          : "Not Available"}
                    </Chip>
                  )}
                </div>
                {!loadingPrinterStatus && printerStatus.printerName && (
                  <div className="mt-1">
                    <p className="text-xs font-semibold text-default-600">
                      {printerStatus.printerName}
                    </p>
                    {printerStatus.printerName === "Web Browser Mode" && (
                      <p className="text-xs text-warning-600 mt-0.5">
                        Run in Electron for printing
                      </p>
                    )}
                  </div>
                )}
              </div>
              {printerStatus.connected && (
                <Button
                  size="sm"
                  variant="flat"
                  color="primary"
                  startContent={<PrinterIcon className="h-4 w-4" />}
                  onPress={handleTestPrint}
                >
                  Test
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-warning-50 to-warning-100 border-warning-200">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 bg-warning-200 rounded-lg">
              <ClockIcon className="h-8 w-8 text-warning-700" />
            </div>
            <div>
              <p className="text-sm text-warning-700 font-semibold">
                Pending Payments
              </p>
              <p className="text-3xl font-bold text-warning-900">
                {stats.pendingPayments}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 bg-primary-200 rounded-lg">
              <CheckCircleIcon className="h-8 w-8 text-primary-700" />
            </div>
            <div>
              <p className="text-sm text-primary-700 font-semibold">
                Active Orders
              </p>
              <p className="text-3xl font-bold text-primary-900">
                {stats.activeOrders}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-success-50 to-success-100 border-success-200">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 bg-success-200 rounded-lg">
              <CheckCircleIcon className="h-8 w-8 text-success-700" />
            </div>
            <div>
              <p className="text-sm text-success-700 font-semibold">
                Completed Today
              </p>
              <p className="text-3xl font-bold text-success-900">
                {stats.completedToday}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardBody>
          <Input
            isClearable
            placeholder="Search by order number, name, or phone..."
            size="lg"
            startContent={
              <MagnifyingGlassIcon className="h-5 w-5 text-default-400" />
            }
            value={searchQuery}
            onClear={() => setSearchQuery("")}
            onValueChange={setSearchQuery}
          />
        </CardBody>
      </Card>

      {/* Tabs */}
      <Card>
        <CardBody className="p-0">
          <Tabs
            aria-label="Order tabs"
            classNames={{
              tabList: "w-full",
              tab: "h-14 text-base font-semibold",
            }}
            color="primary"
            selectedKey={selectedTab}
            size="lg"
            onSelectionChange={(key) => setSelectedTab(key as string)}
          >
            <Tab
              key="pending"
              title={
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  <span>Pending Payments ({stats.pendingPayments})</span>
                </div>
              }
            >
              <div className="p-4">
                {renderOrdersTable(pendingOrders, true)}
              </div>
            </Tab>

            <Tab
              key="active"
              title={
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>Active Orders ({stats.activeOrders})</span>
                </div>
              }
            >
              <div className="p-4">{renderOrdersTable(activeOrders)}</div>
            </Tab>

            <Tab
              key="completed"
              title={
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>Completed ({stats.completedToday})</span>
                </div>
              }
            >
              <div className="p-4">{renderOrdersTable(completedOrders)}</div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Order Details Modal */}
      {renderOrderDetailsModal()}
    </div>
  );
}
