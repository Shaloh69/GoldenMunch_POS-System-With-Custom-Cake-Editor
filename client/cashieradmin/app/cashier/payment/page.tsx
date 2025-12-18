"use client";

import type { CustomerOrder, CustomerDiscountType } from "@/types/api";
import { OrderStatus } from "@/types/api";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Tabs, Tab } from "@heroui/tabs";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import {
  ClockIcon,
  CheckCircleIcon,
  BanknotesIcon,
  CreditCardIcon,
  QrCodeIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  PercentBadgeIcon,
} from "@heroicons/react/24/outline";

import { OrderService } from "@/services/order.service";
import { DiscountService } from "@/services/discount.service";
import { printerService } from "@/services/printer.service";

const paymentMethodIcons: Record<string, JSX.Element> = {
  cash: <BanknotesIcon className="h-4 w-4" />,
  gcash: <QrCodeIcon className="h-4 w-4" />,
  paymaya: <QrCodeIcon className="h-4 w-4" />,
  cashless: <CreditCardIcon className="h-4 w-4" />,
};

export default function PaymentPage() {
  const [pendingOrders, setPendingOrders] = useState<CustomerOrder[]>([]);
  const [recentPayments, setRecentPayments] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(
    null,
  );
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Quick search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Payment verification
  const [referenceNumber, setReferenceNumber] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // Reject payment/order
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  // Cash payment handling
  const [amountTendered, setAmountTendered] = useState("");
  const [calculatedChange, setCalculatedChange] = useState(0);

  // Discount handling
  const [discounts, setDiscounts] = useState<CustomerDiscountType[]>([]);
  const [selectedDiscount, setSelectedDiscount] = useState<CustomerDiscountType | null>(null);
  const [discountLoading, setDiscountLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    pendingCount: 0,
    pendingAmount: 0,
    verifiedToday: 0,
    verifiedAmount: 0,
  });

  useEffect(() => {
    loadPaymentData();
    loadDiscounts();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadPaymentData, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadPaymentData = async () => {
    try {
      setLoading(true);

      // Load pending payments (orders with payment_status = 'unpaid')
      const pendingResponse = await OrderService.getOrders();
      console.log('📥 Full API Response:', pendingResponse);

      if (pendingResponse.success && pendingResponse.data) {
        // Server returns { orders: [...], pagination: {...} }
        const orders = (pendingResponse.data as any).orders || [];
        console.log('📦 Total orders received:', orders.length);
        console.log('📋 Orders data:', orders);

        // Log payment status of each order
        orders.forEach((order: CustomerOrder, index: number) => {
          console.log(`Order ${index + 1}: ID=${order.order_id}, Number=${order.order_number}, Payment Status="${order.payment_status}"`);
        });

        const pending = orders.filter(
          (order: CustomerOrder) => order.payment_status === 'unpaid'
        );
        console.log('💰 Filtered unpaid orders:', pending.length);
        console.log('💳 Unpaid orders:', pending);
        setPendingOrders(pending);

        // Calculate pending stats
        const pendingAmount = pending.reduce(
          (sum, order) => sum + Number(order.final_amount || 0),
          0,
        );

        setStats((prev) => ({
          ...prev,
          pendingCount: pending.length,
          pendingAmount,
        }));
      }

      // Load recent verified payments (today's paid orders)
      const allResponse = await OrderService.getOrders();

      if (allResponse.success && allResponse.data) {
        // Server returns { orders: [...], pagination: {...} }
        const orders = (allResponse.data as any).orders || [];
        const today = new Date().toISOString().split('T')[0];
        console.log('📅 Today\'s date for filtering:', today);

        const recentPaid = orders.filter((order: CustomerOrder) => {
          const orderDate = new Date(order.order_datetime).toISOString().split('T')[0];
          const isPaid = order.payment_status === 'paid';
          const isToday = orderDate === today;
          console.log(`Order ${order.order_number}: payment_status="${order.payment_status}", date=${orderDate}, isPaid=${isPaid}, isToday=${isToday}`);
          return isPaid && isToday;
        });
        console.log('✅ Recent paid orders today:', recentPaid.length);
        setRecentPayments(recentPaid.slice(0, 10));  // Show last 10

        // Calculate verified stats
        const verifiedAmount = recentPaid.reduce(
          (sum, order) => sum + Number(order.final_amount || 0),
          0,
        );

        setStats((prev) => ({
          ...prev,
          verifiedToday: recentPaid.length,
          verifiedAmount,
        }));
      }
    } catch (error) {
      console.error("Failed to load payment data:", error);
      addToast({
        title: "Error",
        description: "Failed to load payment data",
        color: "danger",
      });
      console.error('Failed to load payment data:', error);
      addToast({
        title: 'Failed to load payment data',
        icon: <XCircleIcon className="h-5 w-5 text-danger" />
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDiscounts = async () => {
    try {
      setDiscountLoading(true);
      const response = await DiscountService.getActiveDiscountTypes();

      if (response.success && response.data) {
        setDiscounts(response.data);
      }
    } catch (error) {
      console.error('Failed to load discounts:', error);
      // Don't show error toast for discount loading - not critical
    } finally {
      setDiscountLoading(false);
    }
  };

  // Discount calculation functions
  const calculateDiscount = (amount: number, discount: CustomerDiscountType | null): number => {
    if (!discount) return 0;
    return (amount * discount.discount_percentage) / 100;
  };

  const calculateFinalAmount = (): number => {
    if (!selectedOrder) return 0;
    const originalAmount = Number(selectedOrder.final_amount || 0);
    const discountAmount = calculateDiscount(originalAmount, selectedDiscount);
    return originalAmount - discountAmount;
  };

  const handleDiscountChange = (discountId: string) => {
    if (!discountId || discountId === 'none') {
      setSelectedDiscount(null);
      return;
    }

    const discount = discounts.find(d => d.discount_type_id === parseInt(discountId));
    if (discount) {
      setSelectedDiscount(discount);
      // Recalculate change if cash payment
      if (selectedOrder?.payment_method === 'cash' && amountTendered) {
        const finalAmount = Number(selectedOrder.final_amount || 0) - calculateDiscount(Number(selectedOrder.final_amount || 0), discount);
        const change = Number(amountTendered) - finalAmount;
        setCalculatedChange(Math.max(0, change));
      }
    }
  };

  const handleQuickSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError("Please enter an order number or verification code");

      return;
    }

    setSearchLoading(true);
    setSearchError("");

    try {
      // Try searching by order number, verification code, or order ID
      const response = await OrderService.getOrders();

      if (response.success && response.data) {
        const orders = (response.data as any).orders || [];
        const found = orders.find(
          (order: CustomerOrder) =>
            order.order_number === searchQuery.trim() ||
            order.verification_code === searchQuery.trim() ||
            order.order_id.toString() === searchQuery.trim(),
        );

        if (found) {
          setSelectedOrder(found);
          setReferenceNumber(found.gcash_reference_number || "");
          setSearchError("");
          onOpen();
        } else {
          setSearchError("Order not found");
          addToast({
            title: "Error",
            description: "Order is not found",
          });
          setSearchError('Order not found');
          addToast({
            title: 'Order not found',
            icon: <XCircleIcon className="h-5 w-5 text-danger" />
          });
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchError("Failed to search order");
      addToast({
        title: "Error",
        description: "Failed to search order",
        color: "danger",
        timeout: 5000,
      });
      console.error('Search error:', error);
      setSearchError('Failed to search order');
      addToast({
        title: 'Failed to search order',
        icon: <XCircleIcon className="h-5 w-5 text-danger" />
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!selectedOrder) return;

    const finalAmount = calculateFinalAmount(); // Use discounted amount

    // Validate cash payment
    if (selectedOrder.payment_method === "cash") {
      const tendered = Number(amountTendered || 0);

      if (!amountTendered || tendered <= 0) {
        setVerifyError("Please enter amount received from customer");

        return;
      }
      if (tendered < finalAmount) {
        setVerifyError(`Insufficient amount. Need ₱${finalAmount.toFixed(2)}`);

        return;
      }
    }

    // Validate reference number for cashless payments
    if (
      selectedOrder.payment_method === "cashless" &&
      !referenceNumber.trim()
    ) {
      setVerifyError("Please enter the payment reference number");

      return;
    }

    try {
      setVerifying(true);
      setVerifyError("");

      const response = await OrderService.verifyPayment({
        order_id: selectedOrder.order_id,
        payment_method: selectedOrder.payment_method,
        reference_number: referenceNumber.trim() || undefined,
        amount_tendered:
          selectedOrder.payment_method === "cash"
            ? Number(amountTendered)
            : undefined,
        customer_discount_type_id: selectedDiscount?.discount_type_id || undefined,
      });

      if (response.success) {
        // Success - show Toast and refresh
        const paymentMethod = selectedOrder.payment_method.toUpperCase();
        const orderNum =
          selectedOrder.order_number || `#${selectedOrder.order_id}`;

        if (selectedOrder.payment_method === "cash") {
          addToast({
            title: "Success",
            description: `✅ Cash payment verified for ${orderNum}! Change: ₱${calculatedChange.toFixed(2)}`,
            color: "success",
            timeout: 5000,
            icon: <CheckCircleIcon className="h-5 w-5 text-success" />,
          });
        } else {
          addToast({
            title: "Success",
            description: `✅ ${paymentMethod} payment verified for ${orderNum}!`,
            color: "success",
            timeout: 5000,
          });
        }

        // Print receipt after successful payment verification
        try {
          console.log("🖨️ Printing receipt for completed order...");
          const receiptData = printerService.formatOrderForPrint({
            ...selectedOrder,
            final_amount: finalAmount, // Use discounted amount
            discount_amount: selectedDiscount ? calculateDiscount(Number(selectedOrder.final_amount || 0), selectedDiscount) : 0,
          });

          const printResult = await printerService.printReceipt(receiptData);
          if (printResult.success) {
            console.log("✅ Receipt printed successfully");
            addToast({
              title: "Receipt Printed",
              description: `Receipt for ${orderNum} has been printed`,
              color: "success",
              timeout: 3000,
            });
          } else {
            console.warn("⚠️ Receipt printing failed:", printResult.error);
            addToast({
              title: "Printing Warning",
              description: printResult.error || "Receipt printing failed, but payment was successful",
              color: "warning",
              timeout: 5000,
            });
          }
        } catch (printErr) {
          console.error("❌ Receipt printing error:", printErr);
          // Don't block the flow if printing fails
        }

        await loadPaymentData();
        handleCloseModal();
      } else {
        setVerifyError(response.error || "Payment verification failed");
        addToast({
          title: "Error",
          description: response.error || "Payment verification failed",
          color: "danger",
          timeout: 5000,
        });
        setVerifyError(response.error || 'Payment verification failed');
        addToast({
          title: 'Payment verification failed',
          description: response.error,
          icon: <XCircleIcon className="h-5 w-5 text-danger" />
        });
      }
    } catch (error: any) {
      console.error("Payment verification error:", error);
      const errorMsg =
        error.response?.data?.error || "Failed to verify payment";

      setVerifyError(errorMsg);
      addToast({
        title: "Error",
        description: errorMsg,
        color: "danger",
        timeout: 5000,
      });
      addToast({
        title: 'Failed to verify payment',
        description: errorMsg,
        icon: <XCircleIcon className="h-5 w-5 text-danger" />
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedOrder) return;

    try {
      setRejecting(true);

      // Update order status to cancelled or pending based on business logic
      // We'll set it to 'cancelled' to indicate rejected payment
      const response = await OrderService.updateOrderStatus(selectedOrder.order_id, {
        order_status: OrderStatus.CANCELLED
      });

      if (response.success) {
        addToast({
          title: "Payment Rejected",
          description: `Order ${selectedOrder.order_number || `#${selectedOrder.order_id}`} has been cancelled due to wrong reference number.`,
          color: "warning",
          timeout: 5000,
        });

        await loadPaymentData();
        setRejectConfirmOpen(false);
        handleCloseModal();
      } else {
        addToast({
          title: "Error",
          description: response.error || "Failed to reject payment",
          color: "danger",
          timeout: 5000,
        });
      }
    } catch (error: any) {
      console.error("Failed to reject payment:", error);
      addToast({
        title: "Error",
        description: "Failed to reject payment",
        color: "danger",
        timeout: 5000,
      });
    } finally {
      setRejecting(false);
    }
  };

  const handleCloseModal = () => {
    onClose();
    setReferenceNumber("");
    setAmountTendered("");
    setCalculatedChange(0);
    setSelectedOrder(null);
    setSearchQuery("");
    setVerifyError("");
    setSearchError("");
    setRejectConfirmOpen(false);
  };

  const handleAmountTenderedChange = (value: string) => {
    setAmountTendered(value);
    if (selectedOrder && value) {
      const tendered = Number(value);
      const finalAmount = calculateFinalAmount(); // Use discounted amount if discount applied

      setCalculatedChange(tendered >= finalAmount ? tendered - finalAmount : 0);
    } else {
      setCalculatedChange(0);
    }
  };

  const handleQuickCashAmount = (amount: number) => {
    handleAmountTenderedChange(amount.toString());
  };

  const handleSelectOrder = (order: CustomerOrder) => {
    setSelectedOrder(order);
    setReferenceNumber(order.gcash_reference_number || "");
    setVerifyError("");
    setSelectedDiscount(null); // Reset discount for new order
    setAmountTendered(""); // Reset cash amount
    setCalculatedChange(0); // Reset change
    onOpen();
  };

  const formatCurrency = (amount: number) => {
    return `₱${Number(amount || 0).toFixed(2)}`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
            Payment Management
          </h1>
          <p className="text-default-500 mt-1">
            Verify customer payments with cash handling
          </p>
        </div>
        <Button
          color="primary"
          isLoading={loading}
          variant="shadow"
          onPress={loadPaymentData}
        >
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-warning shadow-lg">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Pending Payments</p>
                <p className="text-2xl font-bold text-warning">
                  {stats.pendingCount}
                </p>
                <p className="text-xs text-default-400 mt-1">
                  {formatCurrency(stats.pendingAmount)}
                </p>
              </div>
              <ClockIcon className="h-10 w-10 text-warning opacity-50" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-success shadow-lg">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Verified Today</p>
                <p className="text-2xl font-bold text-success">
                  {stats.verifiedToday}
                </p>
                <p className="text-xs text-default-400 mt-1">
                  {formatCurrency(stats.verifiedAmount)}
                </p>
              </div>
              <CheckCircleIcon className="h-10 w-10 text-success opacity-50" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-primary shadow-lg">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Verification Rate</p>
                <p className="text-2xl font-bold text-primary">
                  {stats.pendingCount + stats.verifiedToday > 0
                    ? Math.round(
                        (stats.verifiedToday /
                          (stats.pendingCount + stats.verifiedToday)) *
                          100,
                      )
                    : 0}
                  %
                </p>
                <p className="text-xs text-default-400 mt-1">Today</p>
              </div>
              <BanknotesIcon className="h-10 w-10 text-primary opacity-50" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-secondary shadow-lg">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Avg Payment</p>
                <p className="text-2xl font-bold text-secondary">
                  {stats.verifiedToday > 0
                    ? formatCurrency(stats.verifiedAmount / stats.verifiedToday)
                    : formatCurrency(0)}
                </p>
                <p className="text-xs text-default-400 mt-1">Per order</p>
              </div>
              <CreditCardIcon className="h-10 w-10 text-secondary opacity-50" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Quick Search */}
      <Card shadow="sm">
        <CardHeader className="p-6 border-b border-default-200 bg-gradient-to-r from-primary-50 to-secondary-50">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <QrCodeIcon className="h-6 w-6 text-primary" />
            Quick Payment Verification
          </h2>
        </CardHeader>
        <CardBody className="p-6">
          <div className="flex gap-4">
            <Input
              classNames={{
                input: "text-lg",
                inputWrapper: "h-14",
              }}
              errorMessage={searchError}
              isInvalid={!!searchError}
              placeholder="Enter order number or verification code..."
              size="lg"
              startContent={
                <MagnifyingGlassIcon className="h-5 w-5 text-default-400" />
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleQuickSearch()}
            />
            <Button
              className="px-8"
              color="primary"
              isLoading={searchLoading}
              size="lg"
              variant="shadow"
              onPress={handleQuickSearch}
            >
              Search
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Tabs for Pending and Recent */}
      <Card shadow="sm">
        <CardBody className="p-6">
          <Tabs
            aria-label="Payment tabs"
            classNames={{
              tabList: "gap-6",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-primary",
            }}
            color="primary"
            variant="underlined"
          >
            <Tab
              key="pending"
              title={
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  <span>Pending Payments ({stats.pendingCount})</span>
                </div>
              }
            >
              <div className="mt-4">
                {loading ? (
                  <div className="flex justify-center p-8">
                    <Spinner color="primary" size="lg" />
                  </div>
                ) : pendingOrders.length === 0 ? (
                  <div className="text-center p-12 text-default-400">
                    <CheckCircleIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No pending payments!</p>
                    <p className="text-sm mt-2">All orders are verified</p>
                  </div>
                ) : (
                  <Table
                    aria-label="Pending payments table"
                    classNames={{
                      th: "bg-default-100",
                    }}
                  >
                    <TableHeader>
                      <TableColumn>ORDER</TableColumn>
                      <TableColumn>CODE</TableColumn>
                      <TableColumn>PAYMENT METHOD</TableColumn>
                      <TableColumn>AMOUNT</TableColumn>
                      <TableColumn>DATE</TableColumn>
                      <TableColumn>ACTION</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {pendingOrders.map((order) => (
                        <TableRow
                          key={order.order_id}
                          className="hover:bg-default-50"
                        >
                          <TableCell>
                            <p className="font-semibold">
                              {order.order_number || `#${order.order_id}`}
                            </p>
                          </TableCell>
                          <TableCell>
                            <code className="bg-warning-100 text-warning-700 px-2 py-1 rounded font-semibold">
                              {order.verification_code}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Chip
                              className="uppercase"
                              color={
                                order.payment_method === "cash"
                                  ? "success"
                                  : "primary"
                              }
                              size="sm"
                              startContent={
                                paymentMethodIcons[order.payment_method]
                              }
                              variant="flat"
                            >
                              {order.payment_method}
                            </Chip>
                          </TableCell>
                          <TableCell className="font-semibold text-lg">
                            {formatCurrency(order.final_amount)}
                          </TableCell>
                          <TableCell className="text-sm text-default-500">
                            {formatDateTime(order.order_datetime)}
                          </TableCell>
                          <TableCell>
                            <Button
                              color="primary"
                              size="sm"
                              startContent={
                                <CheckCircleIcon className="h-4 w-4" />
                              }
                              onPress={() => handleSelectOrder(order)}
                            >
                              Verify
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </Tab>

            <Tab
              key="recent"
              title={
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>Recent Payments ({stats.verifiedToday})</span>
                </div>
              }
            >
              <div className="mt-4">
                {loading ? (
                  <div className="flex justify-center p-8">
                    <Spinner color="success" size="lg" />
                  </div>
                ) : recentPayments.length === 0 ? (
                  <div className="text-center p-12 text-default-400">
                    <ClockIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No payments verified today</p>
                  </div>
                ) : (
                  <Table
                    aria-label="Recent payments table"
                    classNames={{
                      th: "bg-default-100",
                    }}
                  >
                    <TableHeader>
                      <TableColumn>ORDER</TableColumn>
                      <TableColumn>CODE</TableColumn>
                      <TableColumn>PAYMENT METHOD</TableColumn>
                      <TableColumn>AMOUNT</TableColumn>
                      <TableColumn>REFERENCE</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {recentPayments.map((order) => (
                        <TableRow key={order.order_id}>
                          <TableCell>
                            <p className="font-semibold">
                              {order.order_number || `#${order.order_id}`}
                            </p>
                          </TableCell>
                          <TableCell>
                            <code className="bg-default-100 px-2 py-1 rounded">
                              {order.verification_code}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Chip
                              className="uppercase"
                              color={
                                order.payment_method === "cash"
                                  ? "success"
                                  : "primary"
                              }
                              size="sm"
                              startContent={
                                paymentMethodIcons[order.payment_method]
                              }
                              variant="flat"
                            >
                              {order.payment_method}
                            </Chip>
                          </TableCell>
                          <TableCell className="font-semibold text-lg">
                            {formatCurrency(order.final_amount)}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-default-100 px-2 py-1 rounded">
                              {order.gcash_reference_number || "-"}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Chip color="success" size="sm" variant="flat">
                              Paid
                            </Chip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Payment Verification Modal */}
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        size="lg"
        onClose={handleCloseModal}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Verify Payment
            </h3>
            <p className="text-sm font-normal text-default-500">
              Process payment and handle cash transactions
            </p>
          </ModalHeader>
          <ModalBody>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-4 rounded-lg border border-primary-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-default-500">Order Number</p>
                      <p className="text-lg font-bold text-primary">
                        {selectedOrder.order_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-default-500">
                        Verification Code
                      </p>
                      <code className="text-lg font-bold bg-white px-2 py-1 rounded border border-primary-200">
                        {selectedOrder.verification_code}
                      </code>
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Discount Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-default-700 flex items-center gap-2">
                    <PercentBadgeIcon className="h-5 w-5 text-primary" />
                    Apply Discount
                  </label>
                  <Select
                    placeholder="Select discount type (optional)"
                    selectedKeys={selectedDiscount ? [selectedDiscount.discount_type_id.toString()] : []}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                    classNames={{
                      trigger: "border-2 border-primary-200",
                    }}
                  >
                    <SelectItem key="none">No Discount</SelectItem>
                    {(discounts.map((discount) => (
                      <SelectItem key={discount.discount_type_id.toString()}>
                        {discount.name} - {discount.discount_percentage}%
                        {discount.requires_id && ' (Requires ID)'}
                      </SelectItem>
                    )) as any)}
                  </Select>

                  {selectedDiscount && selectedDiscount.requires_id && (
                    <p className="text-xs text-warning flex items-center gap-1">
                      <span>⚠️</span> Please verify customer ID before applying this discount
                    </p>
                  )}
                </div>

                <Divider />

                {/* Amount Summary */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-default-500">Original Amount</p>
                    <p className={`text-lg font-semibold ${selectedDiscount ? 'line-through text-default-400' : 'text-primary'}`}>
                      {formatCurrency(selectedOrder.final_amount)}
                    </p>
                  </div>

                  {selectedDiscount && (
                    <>
                      <div className="flex justify-between items-center text-success">
                        <p className="text-sm flex items-center gap-1">
                          <PercentBadgeIcon className="h-4 w-4" />
                          Discount ({selectedDiscount.discount_percentage}%)
                        </p>
                        <p className="text-lg font-semibold">
                          -{formatCurrency(calculateDiscount(Number(selectedOrder.final_amount), selectedDiscount))}
                        </p>
                      </div>
                      <Divider className="my-2" />
                    </>
                  )}

                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-default-700">
                      {selectedDiscount ? 'Final Amount to Pay' : 'Amount to Verify'}
                    </p>
                    <p className="text-4xl font-bold text-primary">
                      {formatCurrency(calculateFinalAmount())}
                    </p>
                  </div>
                </div>

                <Divider />

                <div>
                  <p className="text-sm text-default-500 mb-2">
                    Payment Method
                  </p>
                  <Chip
                    className="uppercase"
                    color="primary"
                    size="lg"
                    startContent={
                      paymentMethodIcons[selectedOrder.payment_method]
                    }
                    variant="shadow"
                  >
                    {selectedOrder.payment_method}
                  </Chip>
                </div>

                {/* Display customer's inputted reference number */}
                {(selectedOrder.payment_method === "gcash" || selectedOrder.payment_method === "paymaya" || selectedOrder.payment_method === "cashless") &&
                 (selectedOrder.gcash_reference_number || selectedOrder.paymaya_reference_number) && (
                  <div className="bg-primary-50 border-2 border-primary-200 p-4 rounded-lg">
                    <p className="text-sm text-default-500 mb-2 font-medium">
                      Customer Provided Reference Number
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-lg font-bold bg-white px-3 py-2 rounded border-2 border-primary-300 flex-1">
                        {selectedOrder.gcash_reference_number || selectedOrder.paymaya_reference_number}
                      </code>
                    </div>
                    <p className="text-xs text-default-400 mt-2">
                      This is the reference number the customer entered at the kiosk
                    </p>
                  </div>
                )}

                {selectedOrder.payment_method === "cashless" && (
                  <Input
                    isRequired
                    description="The reference number from the customer's payment confirmation (GCash, PayMaya, Bank Transfer, etc.)"
                    errorMessage={verifyError}
                    isInvalid={!!verifyError}
                    label="Reference Number *"
                    placeholder="Enter payment reference number"
                    size="lg"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                  />
                )}

                {selectedOrder.payment_method === "cash" && (
                  <div className="space-y-4">
                    {/* Amount Tendered Input */}
                    <div>
                      <Input
                        isRequired
                        classNames={{
                          input: "text-2xl font-bold",
                        }}
                        description="Enter the cash amount given by the customer"
                        label="Amount Received from Customer *"
                        placeholder="Enter amount"
                        size="lg"
                        startContent={
                          <span className="text-default-500">₱</span>
                        }
                        type="number"
                        value={amountTendered}
                        onChange={(e) =>
                          handleAmountTenderedChange(e.target.value)
                        }
                      />
                    </div>

                    {/* Quick Cash Buttons */}
                    <div>
                      <p className="text-sm text-default-500 mb-2">
                        Quick Amount
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        <Button
                          color="primary"
                          variant="flat"
                          onPress={() =>
                            handleQuickCashAmount(
                              Number(selectedOrder.final_amount || 0),
                            )
                          }
                        >
                          Exact
                        </Button>
                        <Button
                          color="primary"
                          variant="flat"
                          onPress={() => handleQuickCashAmount(100)}
                        >
                          ₱100
                        </Button>
                        <Button
                          color="primary"
                          variant="flat"
                          onPress={() => handleQuickCashAmount(500)}
                        >
                          ₱500
                        </Button>
                        <Button
                          color="primary"
                          variant="flat"
                          onPress={() => handleQuickCashAmount(1000)}
                        >
                          ₱1000
                        </Button>
                      </div>
                    </div>

                    {/* Change Display */}
                    {amountTendered &&
                      Number(amountTendered) >=
                        Number(selectedOrder.final_amount || 0) && (
                        <div className="bg-gradient-to-r from-success-50 to-success-100 p-4 rounded-lg border-2 border-success-300 shadow-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-success-700 font-medium flex items-center gap-2">
                                <CheckCircleIcon className="h-5 w-5" />
                                Change to Return
                              </p>
                              <p className="text-xs text-success-600 mt-1">
                                {formatCurrency(Number(amountTendered))} -{" "}
                                {formatCurrency(
                                  Number(selectedOrder.final_amount || 0),
                                )}
                              </p>
                            </div>
                            <p className="text-4xl font-bold text-success-700">
                              {formatCurrency(calculatedChange)}
                            </p>
                          </div>
                        </div>
                      )}

                    {/* Insufficient Amount Warning */}
                    {amountTendered &&
                      Number(amountTendered) <
                        Number(selectedOrder.final_amount || 0) && (
                        <div className="bg-gradient-to-r from-warning-50 to-warning-100 p-4 rounded-lg border-2 border-warning-300">
                          <p className="text-sm text-warning-700 font-medium flex items-center gap-2">
                            <XCircleIcon className="h-5 w-5" />
                            Insufficient amount. Need{" "}
                            {formatCurrency(
                              Number(selectedOrder.final_amount || 0) -
                                Number(amountTendered),
                            )}{" "}
                            more
                          </p>
                        </div>
                      )}
                  </div>
                )}

                {verifyError && (
                  <div className="bg-danger-50 border-2 border-danger-200 p-3 rounded flex items-start gap-2">
                    <XCircleIcon className="h-5 w-5 text-danger-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-danger-700">{verifyError}</p>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter className="flex justify-between">
            <div>
              <Button
                color="danger"
                variant="flat"
                startContent={<XCircleIcon className="h-5 w-5" />}
                onPress={() => setRejectConfirmOpen(true)}
              >
                Reject Payment
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="light" onPress={handleCloseModal}>
                Cancel
              </Button>
              <Button
                color="success"
                isLoading={verifying}
                size="lg"
                startContent={
                  !verifying && <CheckCircleIcon className="h-5 w-5" />
                }
                variant="shadow"
                onPress={handleVerifyPayment}
              >
                {verifying ? "Verifying..." : "Verify Payment"}
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Reject Payment Confirmation Modal */}
      <Modal
        backdrop="blur"
        isOpen={rejectConfirmOpen}
        size="md"
        onClose={() => setRejectConfirmOpen(false)}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-bold text-danger">Confirm Rejection</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="bg-warning-50 border-2 border-warning-200 p-4 rounded-lg flex items-start gap-3">
                <XCircleIcon className="h-6 w-6 text-warning-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-warning-900 mb-2">
                    Are you sure you want to reject this payment?
                  </p>
                  <p className="text-sm text-warning-700">
                    This action will cancel the order due to an incorrect or invalid reference number.
                  </p>
                </div>
              </div>

              {selectedOrder && (
                <div className="bg-default-100 p-3 rounded-lg">
                  <p className="text-sm text-default-500 mb-1">Order to Cancel</p>
                  <p className="font-bold text-lg">
                    {selectedOrder.order_number || `#${selectedOrder.order_id}`}
                  </p>
                  <p className="text-sm text-default-600 mt-2">
                    Amount: {formatCurrency(selectedOrder.final_amount)}
                  </p>
                </div>
              )}

              <div className="bg-danger-50 border border-danger-200 p-3 rounded-lg">
                <p className="text-sm text-danger-700 font-medium">
                  ⚠️ Before rejecting, please confirm with the customer that the reference number is incorrect.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setRejectConfirmOpen(false)}
            >
              No, Go Back
            </Button>
            <Button
              color="danger"
              isLoading={rejecting}
              startContent={!rejecting && <XCircleIcon className="h-5 w-5" />}
              variant="shadow"
              onPress={handleRejectPayment}
            >
              {rejecting ? "Rejecting..." : "Yes, Reject & Cancel Order"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
