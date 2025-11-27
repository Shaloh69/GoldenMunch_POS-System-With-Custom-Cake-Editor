'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Chip } from '@heroui/chip';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Spinner } from '@heroui/spinner';
import { Divider } from '@heroui/divider';
import { Tabs, Tab } from '@heroui/tabs';
import { OrderService } from '@/services/order.service';
import type { CustomerOrder, PaymentMethod, PaymentStatus } from '@/types/api';
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BanknotesIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';

const paymentMethodIcons: Record<PaymentMethod, React.ReactNode> = {
  cash: <BanknotesIcon className="h-5 w-5" />,
  card: <CreditCardIcon className="h-5 w-5" />,
  gcash: <DevicePhoneMobileIcon className="h-5 w-5" />,
  paymaya: <DevicePhoneMobileIcon className="h-5 w-5" />,
  bank_transfer: <BanknotesIcon className="h-5 w-5" />,
};

const paymentStatusColors: Record<PaymentStatus, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  partial_paid: 'primary',
  paid: 'success',
  failed: 'danger',
  refunded: 'default',
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

      // Load pending payments (orders with payment_status = 'pending')
      const pendingResponse = await OrderService.getOrders();
      if (pendingResponse.success && pendingResponse.data) {
        const pending = pendingResponse.data.filter(
          (order: CustomerOrder) => order.payment_status === 'pending'
        );
        setPendingOrders(pending);

        // Calculate pending stats
        const pendingAmount = pending.reduce((sum, order) => sum + order.final_amount, 0);
        setStats(prev => ({
          ...prev,
          pendingCount: pending.length,
          pendingAmount,
        }));
      }

      // Load recent verified payments (today's paid orders)
      const allResponse = await OrderService.getOrders();
      if (allResponse.success && allResponse.data) {
        const today = new Date().toISOString().split('T')[0];
        const recentPaid = allResponse.data.filter((order: CustomerOrder) => {
          const orderDate = new Date(order.order_datetime).toISOString().split('T')[0];
          return order.payment_status === 'paid' && orderDate === today;
        });
        setRecentPayments(recentPaid.slice(0, 10));  // Show last 10

        // Calculate verified stats
        const verifiedAmount = recentPaid.reduce((sum, order) => sum + order.final_amount, 0);
        setStats(prev => ({
          ...prev,
          verifiedToday: recentPaid.length,
          verifiedAmount,
        }));
      }
    } catch (error) {
      console.error('Failed to load payment data:', error);
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
        const found = response.data.find(
          (order: CustomerOrder) =>
            order.order_number === searchQuery.trim() ||
            order.verification_code === searchQuery.trim() ||
            order.order_id.toString() === searchQuery.trim()
        );

        if (found) {
          setSelectedOrder(found);
          setReferenceNumber(
            found.gcash_reference_number ||
            found.paymaya_reference_number ||
            found.card_transaction_ref ||
            ''
          );
          onOpen();
        } else {
          setSearchError('Order not found');
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Failed to search order');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!selectedOrder) return;

    // Validate reference number for cashless payments
    if (
      (selectedOrder.payment_method === 'gcash' ||
       selectedOrder.payment_method === 'paymaya' ||
       selectedOrder.payment_method === 'card') &&
      !referenceNumber.trim()
    ) {
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
      });

      if (response.success) {
        // Success - refresh data and close modal
        await loadPaymentData();
        onClose();
        setReferenceNumber('');
        setSelectedOrder(null);
        setSearchQuery('');
      } else {
        setVerifyError(response.error || 'Payment verification failed');
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      setVerifyError(error.response?.data?.error || 'Failed to verify payment');
    } finally {
      setVerifying(false);
    }
  };

  const handleSelectOrder = (order: CustomerOrder) => {
    setSelectedOrder(order);
    setReferenceNumber(
      order.gcash_reference_number ||
      order.paymaya_reference_number ||
      order.card_transaction_ref ||
      ''
    );
    setVerifyError('');
    onOpen();
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`;
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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
          Payment Management
        </h1>
        <Button color="primary" onPress={loadPaymentData} isLoading={loading}>
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-warning">
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

        <Card className="border-l-4 border-l-success">
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

        <Card className="border-l-4 border-l-primary">
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

        <Card className="border-l-4 border-l-secondary">
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
      <Card>
        <CardHeader className="p-6 border-b border-default-200">
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
              startContent={<MagnifyingGlassIcon className="h-5 w-5 text-default-400" />}
              size="lg"
              className="flex-1"
              isInvalid={!!searchError}
              errorMessage={searchError}
            />
            <Button
              color="primary"
              size="lg"
              onPress={handleQuickSearch}
              isLoading={searchLoading}
              className="px-8"
            >
              Search & Verify
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Main Content Tabs */}
      <Card>
        <CardBody className="p-0">
          <Tabs aria-label="Payment tabs" className="w-full">
            {/* Pending Payments Tab */}
            <Tab
              key="pending"
              title={
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  <span>Pending ({stats.pendingCount})</span>
                </div>
              }
            >
              <div className="p-6">
                {loading ? (
                  <div className="flex justify-center p-8">
                    <Spinner size="lg" color="primary" />
                  </div>
                ) : pendingOrders.length === 0 ? (
                  <div className="text-center p-12">
                    <CheckCircleIcon className="h-16 w-16 mx-auto text-success opacity-50 mb-4" />
                    <p className="text-lg text-default-500">No pending payments</p>
                    <p className="text-sm text-default-400 mt-2">All payments have been verified!</p>
                  </div>
                ) : (
                  <Table aria-label="Pending payments table">
                    <TableHeader>
                      <TableColumn>ORDER #</TableColumn>
                      <TableColumn>TIME</TableColumn>
                      <TableColumn>PAYMENT METHOD</TableColumn>
                      <TableColumn>AMOUNT</TableColumn>
                      <TableColumn>REFERENCE</TableColumn>
                      <TableColumn>ACTION</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {pendingOrders.map((order) => (
                        <TableRow key={order.order_id}>
                          <TableCell>
                            <div>
                              <p className="font-semibold">{order.order_number || `#${order.order_id}`}</p>
                              <p className="text-xs text-default-400">Code: {order.verification_code || order.order_id.toString().padStart(6, '0')}</p>
                            </div>
                          </TableCell>
                          <TableCell>{formatDateTime(order.order_datetime)}</TableCell>
                          <TableCell>
                            <Chip
                              startContent={paymentMethodIcons[order.payment_method]}
                              variant="flat"
                              size="sm"
                              className="capitalize"
                            >
                              {order.payment_method}
                            </Chip>
                          </TableCell>
                          <TableCell className="font-semibold text-lg">
                            {formatCurrency(order.final_amount)}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-default-100 px-2 py-1 rounded">
                              {order.gcash_reference_number ||
                               order.paymaya_reference_number ||
                               order.card_transaction_ref ||
                               '-'}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Button
                              color="primary"
                              size="sm"
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

            {/* Recent Payments Tab */}
            <Tab
              key="recent"
              title={
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Verified Today ({stats.verifiedToday})</span>
                </div>
              }
            >
              <div className="p-6">
                {loading ? (
                  <div className="flex justify-center p-8">
                    <Spinner size="lg" color="primary" />
                  </div>
                ) : recentPayments.length === 0 ? (
                  <div className="text-center p-12">
                    <ClockIcon className="h-16 w-16 mx-auto text-default-300 mb-4" />
                    <p className="text-lg text-default-500">No payments verified today</p>
                    <p className="text-sm text-default-400 mt-2">Verified payments will appear here</p>
                  </div>
                ) : (
                  <Table aria-label="Recent payments table">
                    <TableHeader>
                      <TableColumn>ORDER #</TableColumn>
                      <TableColumn>TIME</TableColumn>
                      <TableColumn>PAYMENT METHOD</TableColumn>
                      <TableColumn>AMOUNT</TableColumn>
                      <TableColumn>REFERENCE</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {recentPayments.map((order) => (
                        <TableRow key={order.order_id}>
                          <TableCell>
                            <div>
                              <p className="font-semibold">{order.order_number || `#${order.order_id}`}</p>
                              <p className="text-xs text-default-400">Code: {order.verification_code || order.order_id.toString().padStart(6, '0')}</p>
                            </div>
                          </TableCell>
                          <TableCell>{formatDateTime(order.order_datetime)}</TableCell>
                          <TableCell>
                            <Chip
                              startContent={paymentMethodIcons[order.payment_method]}
                              variant="flat"
                              size="sm"
                              className="capitalize"
                            >
                              {order.payment_method}
                            </Chip>
                          </TableCell>
                          <TableCell className="font-semibold text-lg">
                            {formatCurrency(order.final_amount)}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-default-100 px-2 py-1 rounded">
                              {order.gcash_reference_number ||
                               order.paymaya_reference_number ||
                               order.card_transaction_ref ||
                               '-'}
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
      <Modal isOpen={isOpen} onClose={() => {
        onClose();
        setReferenceNumber('');
        setVerifyError('');
      }} size="lg">
        <ModalContent>
          <ModalHeader>Verify Payment</ModalHeader>
          <ModalBody>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="bg-default-100 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-default-500">Order Number</p>
                      <p className="text-lg font-bold">{selectedOrder.order_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-default-500">Verification Code</p>
                      <code className="text-lg font-bold bg-default-200 px-2 py-1 rounded">
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
                    className="capitalize"
                  >
                    {selectedOrder.payment_method}
                  </Chip>
                </div>

                {(selectedOrder.payment_method === 'gcash' ||
                  selectedOrder.payment_method === 'paymaya' ||
                  selectedOrder.payment_method === 'card') && (
                  <Input
                    label="Reference Number *"
                    placeholder="Enter payment reference number"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    size="lg"
                    isRequired
                    description="The reference number from the customer's payment confirmation"
                    errorMessage={verifyError}
                    isInvalid={!!verifyError}
                  />
                )}

                {selectedOrder.payment_method === 'cash' && (
                  <div className="bg-success-50 p-4 rounded-lg border-2 border-success-200">
                    <p className="text-sm text-success-700">
                      ✅ Confirm that you have received {formatCurrency(selectedOrder.final_amount)} in cash from the customer.
                    </p>
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
              onPress={() => {
                onClose();
                setReferenceNumber('');
                setVerifyError('');
              }}
            >
              Cancel
            </Button>
            <Button
              color="success"
              onPress={handleVerifyPayment}
              isLoading={verifying}
              startContent={!verifying && <CheckCircleIcon className="h-5 w-5" />}
              size="lg"
            >
              {verifying ? 'Verifying...' : 'Verify Payment'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
