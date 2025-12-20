"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Spinner } from "@heroui/spinner";
import { Divider } from "@heroui/divider";
import { Tabs, Tab } from "@heroui/tabs";
import { addToast } from "@heroui/toast";
import { OrderService } from "@/services/order.service";
import { DiscountService } from "@/services/discount.service";
import { printerService } from "@/services/printer.service";
import type { CustomerOrder, OrderStatus, OrderTimelineEntry, CustomerDiscountType } from "@/types/api";
import {
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon,
  QrCodeIcon,
  CreditCardIcon,
  PercentBadgeIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";

const statusColors: Record<string, "default" | "primary" | "secondary" | "success" | "warning" | "danger"> = {
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

export default function UnifiedCashierPage() {
  // Tab state
  const [selectedTab, setSelectedTab] = useState<string>("pending");

  // Orders state
  const [pendingOrders, setPendingOrders] = useState<CustomerOrder[]>([]);
  const [activeOrders, setActiveOrders] = useState<CustomerOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected order and modals
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
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
  const [selectedDiscount, setSelectedDiscount] = useState<CustomerDiscountType | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Stats
  const [stats, setStats] = useState({
    pendingPayments: 0,
    activeOrders: 0,
    completedToday: 0,
  });

  // Load data on mount and refresh every 10 seconds
  useEffect(() => {
    loadAllData();
    loadDiscounts();

    const interval = setInterval(loadAllData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);

      // Load all orders
      const response = await OrderService.getOrders();
      if (response.success && response.data) {
        const allOrders = (response.data as any).orders || [];

        // Separate orders by status
        const pending = allOrders.filter((o: CustomerOrder) => o.order_status === "pending");
        const active = allOrders.filter((o: CustomerOrder) =>
          ["confirmed", "preparing", "ready"].includes(o.order_status)
        );
        const completed = allOrders.filter((o: CustomerOrder) =>
          ["completed", "cancelled"].includes(o.order_status)
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
          selectedDiscount
        )
      : Number(selectedOrder.final_amount || 0);

    // Validate payment based on method
    if (selectedOrder.payment_method === "cash") {
      const tendered = Number(amountTendered);
      if (!tendered || tendered < finalAmount) {
        setVerifyError(
          `Insufficient amount. Required: ₱${finalAmount.toFixed(2)}, Tendered: ₱${tendered.toFixed(2)}`
        );
        return;
      }
    } else if (["gcash", "paymaya"].includes(selectedOrder.payment_method)) {
      if (!referenceNumber || referenceNumber.trim().length < 5) {
        setVerifyError("Please enter a valid reference number (minimum 5 characters)");
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
      const statusResponse = await OrderService.updateOrderStatus(selectedOrder.order_id, {
        order_status: "confirmed",
        notes: selectedDiscount
          ? `Payment verified with ${selectedDiscount.discount_name} (${selectedDiscount.discount_percentage}% off)`
          : "Payment verified",
      });

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
            ? calculateDiscount(Number(selectedOrder.final_amount || 0), selectedDiscount)
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
      setVerifyError(error.message || "Failed to verify payment. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;

    try {
      const response = await OrderService.updateOrderStatus(selectedOrder.order_id, {
        order_status: newStatus,
        notes: `Status updated to ${newStatus}`,
      });

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
      if (newStatus === "completed") {
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

  const calculateDiscount = (amount: number, discount: CustomerDiscountType): number => {
    return (amount * discount.discount_percentage) / 100;
  };

  const calculateFinalAmount = (amount: number, discount: CustomerDiscountType | null): number => {
    if (!discount) return amount;
    return amount - calculateDiscount(amount, discount);
  };

  const calculateChange = (tendered: number, amount: number): number => {
    return Math.max(0, tendered - amount);
  };

  // Update change when amount tendered changes
  useEffect(() => {
    if (selectedOrder && amountTendered) {
      const finalAmount = calculateFinalAmount(
        Number(selectedOrder.final_amount || 0),
        selectedDiscount
      );
      setCalculatedChange(calculateChange(Number(amountTendered), finalAmount));
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
        order.order_number.toLowerCase().includes(query) ||
        order.name?.toLowerCase().includes(query) ||
        order.phone?.toLowerCase().includes(query)
    );
  };

  const renderOrdersTable = (orders: CustomerOrder[], showPaymentAction: boolean = false) => {
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
            {searchQuery ? "Try a different search term" : "Orders will appear here once placed"}
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
                <span className="font-mono font-bold">{order.order_number}</span>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-semibold">{order.name || "Guest"}</p>
                  <p className="text-xs text-default-500">{order.phone}</p>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-semibold">₱{Number(order.final_amount || 0).toFixed(2)}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {paymentMethodIcons[order.payment_method]}
                  <span className="capitalize">{order.payment_method}</span>
                </div>
              </TableCell>
              <TableCell>
                <Chip color={statusColors[order.order_status]} variant="flat" size="sm">
                  {order.order_status}
                </Chip>
              </TableCell>
              <TableCell>
                <span className="text-sm text-default-600">{formatDate(order.order_datetime)}</span>
              </TableCell>
              <TableCell>
                <Button size="sm" color="primary" variant="flat" onPress={() => handleViewOrder(order)}>
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

    const isPending = selectedOrder.order_status === "pending";
    const isActive = ["confirmed", "preparing", "ready"].includes(selectedOrder.order_status);
    const finalAmount = calculateFinalAmount(
      Number(selectedOrder.final_amount || 0),
      selectedDiscount
    );

    return (
      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Order #{selectedOrder.order_number}</h2>
                <p className="text-sm text-default-500">{formatDate(selectedOrder.order_datetime)}</p>
              </div>
              <Chip color={statusColors[selectedOrder.order_status]} size="lg">
                {selectedOrder.order_status}
              </Chip>
            </div>
          </ModalHeader>
          <ModalBody>
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Customer Information</h3>
              </CardHeader>
              <CardBody className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-default-500">Name</p>
                  <p className="font-semibold">{selectedOrder.name || "Guest"}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Phone</p>
                  <p className="font-semibold">{selectedOrder.phone}</p>
                </div>
              </CardBody>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Order Items</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  {(selectedOrder as any).items?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <p className="font-semibold">{item.menu_item_name}</p>
                        <p className="text-sm text-default-500">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">₱{Number(item.item_total || 0).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <Divider className="my-4" />
                <div className="space-y-2">
                  {selectedDiscount && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-default-600">Subtotal:</span>
                        <span>₱{Number(selectedOrder.final_amount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-success-600">
                        <span>
                          Discount ({selectedDiscount.discount_name} - {selectedDiscount.discount_percentage}%):
                        </span>
                        <span>
                          -₱
                          {calculateDiscount(Number(selectedOrder.final_amount || 0), selectedDiscount).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t-2">
                    <span>Total:</span>
                    <span>₱{finalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Payment Verification (for pending orders) */}
            {isPending && (
              <Card className="border-2 border-warning-200 bg-warning-50">
                <CardHeader>
                  <h3 className="font-semibold text-warning-800">Payment Verification Required</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  {/* Discount Selection */}
                  <Select
                    label="Apply Discount (Optional)"
                    placeholder="Select a discount"
                    selectedKeys={selectedDiscount ? [selectedDiscount.discount_id.toString()] : []}
                    onChange={(e) => {
                      const discount = discounts.find((d) => d.discount_id.toString() === e.target.value);
                      setSelectedDiscount(discount || null);
                    }}
                    startContent={<PercentBadgeIcon className="h-4 w-4" />}
                  >
                    {discounts.map((discount) => (
                      <SelectItem key={discount.discount_id.toString()} value={discount.discount_id.toString()}>
                        {discount.discount_name} - {discount.discount_percentage}% off
                      </SelectItem>
                    ))}
                  </Select>

                  {/* Cash Payment */}
                  {selectedOrder.payment_method === "cash" && (
                    <>
                      <Input
                        type="number"
                        label="Amount Tendered"
                        placeholder="0.00"
                        value={amountTendered}
                        onValueChange={setAmountTendered}
                        startContent={<span className="text-default-400">₱</span>}
                      />
                      {amountTendered && (
                        <div className="bg-success-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">Change:</span>
                            <span className="text-2xl font-bold text-success-700">
                              ₱{calculatedChange.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Digital Payment */}
                  {["gcash", "paymaya"].includes(selectedOrder.payment_method) && (
                    <Input
                      label="Reference Number"
                      placeholder="Enter reference number"
                      value={referenceNumber}
                      onValueChange={setReferenceNumber}
                    />
                  )}

                  {verifyError && (
                    <div className="bg-danger-50 p-3 rounded-lg text-danger-700 text-sm">{verifyError}</div>
                  )}
                </CardBody>
              </Card>
            )}

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Order Timeline</h3>
              </CardHeader>
              <CardBody>
                {loadingTimeline ? (
                  <Spinner size="sm" />
                ) : orderTimeline.length > 0 ? (
                  <div className="space-y-3">
                    {orderTimeline.map((entry, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="min-w-[100px] text-sm text-default-500">
                          {new Date(entry.changed_at).toLocaleTimeString()}
                        </div>
                        <div>
                          <Chip size="sm" variant="flat">
                            {entry.new_status}
                          </Chip>
                          {entry.notes && <p className="text-sm text-default-600 mt-1">{entry.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-default-500">No timeline available</p>
                )}
              </CardBody>
            </Card>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onClose}>
              Close
            </Button>

            {/* Pending: Verify Payment */}
            {isPending && (
              <Button color="success" onPress={handleVerifyPayment} isLoading={verifying}>
                Verify Payment & Confirm Order
              </Button>
            )}

            {/* Active: Update Status */}
            {isActive && (
              <div className="flex gap-2">
                {selectedOrder.order_status === "confirmed" && (
                  <Button color="primary" onPress={() => handleUpdateStatus("preparing")}>
                    Mark as Preparing
                  </Button>
                )}
                {selectedOrder.order_status === "preparing" && (
                  <Button color="success" onPress={() => handleUpdateStatus("ready")}>
                    Mark as Ready
                  </Button>
                )}
                {selectedOrder.order_status === "ready" && (
                  <Button color="success" onPress={() => handleUpdateStatus("completed")}>
                    Mark as Completed
                  </Button>
                )}
              </div>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
          Cashier Orders
        </h1>
        <p className="text-default-600 mt-2">Unified payment verification and order management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-warning-50 to-warning-100 border-warning-200">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 bg-warning-200 rounded-lg">
              <ClockIcon className="h-8 w-8 text-warning-700" />
            </div>
            <div>
              <p className="text-sm text-warning-700 font-semibold">Pending Payments</p>
              <p className="text-3xl font-bold text-warning-900">{stats.pendingPayments}</p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 bg-primary-200 rounded-lg">
              <CheckCircleIcon className="h-8 w-8 text-primary-700" />
            </div>
            <div>
              <p className="text-sm text-primary-700 font-semibold">Active Orders</p>
              <p className="text-3xl font-bold text-primary-900">{stats.activeOrders}</p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-success-50 to-success-100 border-success-200">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 bg-success-200 rounded-lg">
              <CheckCircleIcon className="h-8 w-8 text-success-700" />
            </div>
            <div>
              <p className="text-sm text-success-700 font-semibold">Completed Today</p>
              <p className="text-3xl font-bold text-success-900">{stats.completedToday}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardBody>
          <Input
            placeholder="Search by order number, name, or phone..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            startContent={<MagnifyingGlassIcon className="h-5 w-5 text-default-400" />}
            isClearable
            onClear={() => setSearchQuery("")}
            size="lg"
          />
        </CardBody>
      </Card>

      {/* Tabs */}
      <Card>
        <CardBody className="p-0">
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
            aria-label="Order tabs"
            size="lg"
            color="primary"
            classNames={{
              tabList: "w-full",
              tab: "h-14 text-base font-semibold",
            }}
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
              <div className="p-4">{renderOrdersTable(pendingOrders, true)}</div>
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
