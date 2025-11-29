'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Chip } from '@heroui/chip';
import { Divider } from '@heroui/divider';
import { Tabs, Tab } from '@heroui/tabs';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Spinner } from '@heroui/spinner';
import { addToast } from '@heroui/react';
import { OrderService } from '@/services/order.service';
import type { CustomerOrder } from '@/types/api';
import {
  ClockIcon,
  CheckCircleIcon,
  BanknotesIcon,
  CreditCardIcon,
  QrCodeIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

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
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Quick search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Payment verification
  const [referenceNumber, setReferenceNumber] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Cash payment handling
  const [amountTendered, setAmountTendered] = useState('');
  const [calculatedChange, setCalculatedChange] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    pendingCount: 0,
    pendingAmount: 0,
    verifiedToday: 0,
    verifiedAmount: 0,
  });

  useEffect(() => {
    loadPaymentData();
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
        const orders = pendingResponse.data.orders || [];
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
        const pendingAmount = pending.reduce((sum, order) => sum + Number(order.final_amount || 0), 0);
        setStats(prev => ({
          ...prev,
          pendingCount: pending.length,
          pendingAmount,
        }));
      }

      // Load recent verified payments (today's paid orders)
      const allResponse = await OrderService.getOrders();
      if (allResponse.success && allResponse.data) {
        // Server returns { orders: [...], pagination: {...} }
        const orders = allResponse.data.orders || [];
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
        const verifiedAmount = recentPaid.reduce((sum, order) => sum + Number(order.final_amount || 0), 0);
        setStats(prev => ({
          ...prev,
          verifiedToday: recentPaid.length,
          verifiedAmount,
        }));
      }
    } catch (error) {
      console.error('Failed to load payment data:', error);
      addToast({
        title: 'Failed to load payment data',
        icon: <XCircleIcon className="h-5 w-5 text-danger" />
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Please enter an order number or verification code');
      return;
    }

    setSearchLoading(true);
    setSearchError('');

    try {
      // Try searching by order number, verification code, or order ID
      const response = await OrderService.getOrders();
      if (response.success && response.data) {
        const orders = response.data.orders || [];
        const found = orders.find(
          (order: CustomerOrder) =>
            order.order_number === searchQuery.trim() ||
            order.verification_code === searchQuery.trim() ||
            order.order_id.toString() === searchQuery.trim()
        );

        if (found) {
          setSelectedOrder(found);
          setReferenceNumber(found.gcash_reference_number || '');
          setSearchError('');
          onOpen();
        } else {
          setSearchError('Order not found');
          addToast({
            title: 'Order not found',
            icon: <XCircleIcon className="h-5 w-5 text-danger" />
          });
        }
      }
    } catch (error) {
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

    const finalAmount = Number(selectedOrder.final_amount || 0);

    // Validate cash payment
    if (selectedOrder.payment_method === 'cash') {
      const tendered = Number(amountTendered || 0);
      if (!amountTendered || tendered <= 0) {
        setVerifyError('Please enter amount received from customer');
        return;
      }
      if (tendered < finalAmount) {
        setVerifyError(`Insufficient amount. Need ₱${finalAmount.toFixed(2)}`);
        return;
      }
    }

    // Validate reference number for cashless payments
    if (selectedOrder.payment_method === 'cashless' && !referenceNumber.trim()) {
      setVerifyError('Please enter the payment reference number');
      return;
    }

    try {
      setVerifying(true);
      setVerifyError('');

      const response = await OrderService.verifyPayment({
        order_id: selectedOrder.order_id,
        payment_method: selectedOrder.payment_method,
        reference_number: referenceNumber.trim() || undefined,
        amount_tendered: selectedOrder.payment_method === 'cash' ? Number(amountTendered) : undefined,
      });

      if (response.success) {
        // Success - show toast and refresh
        const paymentMethod = selectedOrder.payment_method.toUpperCase();
        const orderNum = selectedOrder.order_number || `#${selectedOrder.order_id}`;

        if (selectedOrder.payment_method === 'cash') {
          addToast({
            title: 'Cash Payment Verified',
            description: `Payment verified for ${orderNum}! Change: ₱${calculatedChange.toFixed(2)}`,
            icon: <CheckCircleIcon className="h-5 w-5 text-success" />,
            timeout: 5000,
          });
        } else {
          addToast({
            title: 'Payment Verified',
            description: `${paymentMethod.toUpperCase()} payment verified for ${orderNum}!`,
            icon: <CheckCircleIcon className="h-5 w-5 text-success" />,
            timeout: 5000,
          });
        }

        await loadPaymentData();
        handleCloseModal();
      } else {
        setVerifyError(response.error || 'Payment verification failed');
        addToast({
          title: 'Payment verification failed',
          description: response.error,
          icon: <XCircleIcon className="h-5 w-5 text-danger" />
        });
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to verify payment';
      setVerifyError(errorMsg);
      addToast({
        title: 'Failed to verify payment',
        description: errorMsg,
        icon: <XCircleIcon className="h-5 w-5 text-danger" />
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleCloseModal = () => {
    onClose();
    setReferenceNumber('');
    setAmountTendered('');
    setCalculatedChange(0);
    setSelectedOrder(null);
    setSearchQuery('');
    setVerifyError('');
    setSearchError('');
  };

  const handleAmountTenderedChange = (value: string) => {
    setAmountTendered(value);
    if (selectedOrder && value) {
      const tendered = Number(value);
      const finalAmount = Number(selectedOrder.final_amount || 0);
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
    setReferenceNumber(order.gcash_reference_number || '');
    setVerifyError('');
    onOpen();
  };

  const formatCurrency = (amount: number) => {
    return `₱${Number(amount || 0).toFixed(2)}`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
          <p className="text-default-500 mt-1">Verify customer payments with cash handling</p>
        </div>
        <Button color="primary" onPress={loadPaymentData} isLoading={loading} variant="shadow">
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
                <p className="text-2xl font-bold text-warning">{stats.pendingCount}</p>
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
                <p className="text-2xl font-bold text-success">{stats.verifiedToday}</p>
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
                    ? Math.round((stats.verifiedToday / (stats.pendingCount + stats.verifiedToday)) * 100)
                    : 0}%
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
              placeholder="Enter order number or verification code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleQuickSearch()}
              size="lg"
              startContent={<MagnifyingGlassIcon className="h-5 w-5 text-default-400" />}
              classNames={{
                input: "text-lg",
                inputWrapper: "h-14"
              }}
              isInvalid={!!searchError}
              errorMessage={searchError}
            />
            <Button
              color="primary"
              size="lg"
              onPress={handleQuickSearch}
              isLoading={searchLoading}
              className="px-8"
              variant="shadow"
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
            color="primary"
            variant="underlined"
            classNames={{
              tabList: "gap-6",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-primary"
            }}
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
                    <Spinner size="lg" color="primary" />
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
                        <TableRow key={order.order_id} className="hover:bg-default-50">
                          <TableCell>
                            <p className="font-semibold">{order.order_number || `#${order.order_id}`}</p>
                          </TableCell>
                          <TableCell>
                            <code className="bg-warning-100 text-warning-700 px-2 py-1 rounded font-semibold">
                              {order.verification_code}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Chip
                              startContent={paymentMethodIcons[order.payment_method]}
                              color={order.payment_method === 'cash' ? 'success' : 'primary'}
                              variant="flat"
                              size="sm"
                              className="uppercase"
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
                              onPress={() => handleSelectOrder(order)}
                              startContent={<CheckCircleIcon className="h-4 w-4" />}
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
                    <Spinner size="lg" color="success" />
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
                            <p className="font-semibold">{order.order_number || `#${order.order_id}`}</p>
                          </TableCell>
                          <TableCell>
                            <code className="bg-default-100 px-2 py-1 rounded">
                              {order.verification_code}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Chip
                              startContent={paymentMethodIcons[order.payment_method]}
                              color={order.payment_method === 'cash' ? 'success' : 'primary'}
                              variant="flat"
                              size="sm"
                              className="uppercase"
                            >
                              {order.payment_method}
                            </Chip>
                          </TableCell>
                          <TableCell className="font-semibold text-lg">
                            {formatCurrency(order.final_amount)}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-default-100 px-2 py-1 rounded">
                              {order.gcash_reference_number || '-'}
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
      <Modal isOpen={isOpen} onClose={handleCloseModal} size="lg" backdrop="blur">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Verify Payment
            </h3>
            <p className="text-sm font-normal text-default-500">Process payment and handle cash transactions</p>
          </ModalHeader>
          <ModalBody>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-4 rounded-lg border border-primary-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-default-500">Order Number</p>
                      <p className="text-lg font-bold text-primary">{selectedOrder.order_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-default-500">Verification Code</p>
                      <code className="text-lg font-bold bg-white px-2 py-1 rounded border border-primary-200">
                        {selectedOrder.verification_code}
                      </code>
                    </div>
                  </div>
                </div>

                <Divider />

                <div>
                  <p className="text-sm text-default-500 mb-2">Amount to Verify</p>
                  <p className="text-4xl font-bold text-primary">
                    {formatCurrency(selectedOrder.final_amount)}
                  </p>
                </div>

                <Divider />

                <div>
                  <p className="text-sm text-default-500 mb-2">Payment Method</p>
                  <Chip
                    startContent={paymentMethodIcons[selectedOrder.payment_method]}
                    color="primary"
                    size="lg"
                    className="uppercase"
                    variant="shadow"
                  >
                    {selectedOrder.payment_method}
                  </Chip>
                </div>

                {selectedOrder.payment_method === 'cashless' && (
                  <Input
                    label="Reference Number *"
                    placeholder="Enter payment reference number"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    size="lg"
                    isRequired
                    description="The reference number from the customer's payment confirmation (GCash, PayMaya, Bank Transfer, etc.)"
                    errorMessage={verifyError}
                    isInvalid={!!verifyError}
                  />
                )}

                {selectedOrder.payment_method === 'cash' && (
                  <div className="space-y-4">
                    {/* Amount Tendered Input */}
                    <div>
                      <Input
                        label="Amount Received from Customer *"
                        placeholder="Enter amount"
                        type="number"
                        value={amountTendered}
                        onChange={(e) => handleAmountTenderedChange(e.target.value)}
                        size="lg"
                        isRequired
                        startContent={<span className="text-default-500">₱</span>}
                        description="Enter the cash amount given by the customer"
                        classNames={{
                          input: "text-2xl font-bold",
                        }}
                      />
                    </div>

                    {/* Quick Cash Buttons */}
                    <div>
                      <p className="text-sm text-default-500 mb-2">Quick Amount</p>
                      <div className="grid grid-cols-4 gap-2">
                        <Button
                          color="primary"
                          variant="flat"
                          onPress={() => handleQuickCashAmount(Number(selectedOrder.final_amount || 0))}
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
                    {amountTendered && Number(amountTendered) >= Number(selectedOrder.final_amount || 0) && (
                      <div className="bg-gradient-to-r from-success-50 to-success-100 p-4 rounded-lg border-2 border-success-300 shadow-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-success-700 font-medium flex items-center gap-2">
                              <CheckCircleIcon className="h-5 w-5" />
                              Change to Return
                            </p>
                            <p className="text-xs text-success-600 mt-1">
                              {formatCurrency(Number(amountTendered))} - {formatCurrency(Number(selectedOrder.final_amount || 0))}
                            </p>
                          </div>
                          <p className="text-4xl font-bold text-success-700">
                            {formatCurrency(calculatedChange)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Insufficient Amount Warning */}
                    {amountTendered && Number(amountTendered) < Number(selectedOrder.final_amount || 0) && (
                      <div className="bg-gradient-to-r from-warning-50 to-warning-100 p-4 rounded-lg border-2 border-warning-300">
                        <p className="text-sm text-warning-700 font-medium flex items-center gap-2">
                          <XCircleIcon className="h-5 w-5" />
                          Insufficient amount. Need {formatCurrency(Number(selectedOrder.final_amount || 0) - Number(amountTendered))} more
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
          <ModalFooter>
            <Button
              variant="light"
              onPress={handleCloseModal}
            >
              Cancel
            </Button>
            <Button
              color="success"
              onPress={handleVerifyPayment}
              isLoading={verifying}
              startContent={!verifying && <CheckCircleIcon className="h-5 w-5" />}
              size="lg"
              variant="shadow"
            >
              {verifying ? 'Verifying...' : 'Verify Payment'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
