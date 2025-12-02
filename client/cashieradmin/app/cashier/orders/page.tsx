'use client';

import { useEffect, useState } from 'react';
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
import type { CustomerOrder, OrderStatus, OrderTimelineEntry, PaymentMethod } from '@/types/api';
import { MagnifyingGlassIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  confirmed: 'primary',
  preparing: 'secondary',
  ready: 'success',
  completed: 'default',
  cancelled: 'danger',
};

export default function CashierOrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [orderTimeline, setOrderTimeline] = useState<OrderTimelineEntry[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isPaymentModalOpen, onOpen: onPaymentModalOpen, onClose: onPaymentModalClose } = useDisclosure();
  const [updating, setUpdating] = useState(false);

  // Payment verification state
  const [referenceNumber, setReferenceNumber] = useState('');
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    loadOrders();

    // ✅ FIX: Auto-refresh orders every 10 seconds to see new orders in real-time
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing orders...');
      loadOrders();
    }, 10000); // Refresh every 10 seconds

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await OrderService.getOrders(statusFilter || undefined);
      if (response.success && response.data) {
        // Server returns { orders: [...], pagination: {...} }
        setOrders((response.data as any).orders || []);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
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
      console.error('Failed to load order timeline:', error);
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
        onOpen();
      }
    } catch (error) {
      console.error('Failed to load order details:', error);
    }
  };

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;

    try {
      setUpdating(true);
      const response = await OrderService.updateOrderStatus(selectedOrder.order_id, {
        order_status: newStatus,
      });

      if (response.success) {
        onClose();
        loadOrders();
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!selectedOrder) return;

    // Validate reference number for cashless payments
    if ((selectedOrder.payment_method === 'gcash' || selectedOrder.payment_method === 'paymaya') && !referenceNumber.trim()) {
      setPaymentError('Please enter the payment reference number');
      return;
    }

    try {
      setVerifyingPayment(true);
      setPaymentError('');

      const response = await OrderService.verifyPayment({
        order_id: selectedOrder.order_id,
        payment_method: selectedOrder.payment_method,
        reference_number: referenceNumber || undefined,
      });

      if (response.success) {
        onPaymentModalClose();
        onClose();
        loadOrders();
        setReferenceNumber('');
      } else {
        setPaymentError(response.error || 'Payment verification failed');
      }
    } catch (error: any) {
      console.error('Failed to verify payment:', error);
      setPaymentError(error.response?.data?.error || 'Failed to verify payment');
    } finally {
      setVerifyingPayment(false);
    }
  };

  const needsPaymentVerification = (order: CustomerOrder) => {
    return order.payment_status === 'pending' &&
           (order.payment_method === 'gcash' || order.payment_method === 'paymaya' || order.payment_method === 'card');
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredOrders = orders.filter(order =>
    order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.verification_code?.includes(searchTerm) ||
    order.order_id.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
          Orders Management
        </h1>
        <Button color="primary" onPress={loadOrders}>
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex gap-4">
            <Input
              placeholder="Search by order number or verification code..."
             
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<MagnifyingGlassIcon className="h-5 w-5 text-default-400" />}
              className="max-w-md"
            />
            <Select
              placeholder="Filter by status"
              selectedKeys={statusFilter ? [statusFilter] : []}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="max-w-xs"
            >
              <SelectItem key="">All Status</SelectItem>
              <SelectItem key="pending">Pending</SelectItem>
              <SelectItem key="confirmed">Confirmed</SelectItem>
              <SelectItem key="preparing">Preparing</SelectItem>
              <SelectItem key="ready">Ready</SelectItem>
              <SelectItem key="completed">Completed</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardBody>
          {loading ? (
            <div className="flex justify-center p-8">
              <Spinner size="lg" color="primary" />
            </div>
          ) : (
            <Table aria-label="Orders table">
              <TableHeader>
                <TableColumn>ORDER NUMBER</TableColumn>
                <TableColumn>VERIFICATION CODE</TableColumn>
                <TableColumn>TYPE</TableColumn>
                <TableColumn>PAYMENT</TableColumn>
                <TableColumn>REFERENCE #</TableColumn>
                <TableColumn>AMOUNT</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>DATE</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No orders found">
                {filteredOrders.map((order) => (
                  <TableRow key={order.order_id}>
                    <TableCell>{order.order_number || `#${order.order_id}`}</TableCell>
                    <TableCell>
                      <code className="bg-default-100 px-2 py-1 rounded">
                        {order.verification_code || order.order_id.toString().padStart(6, '0')}
                      </code>
                    </TableCell>
                    <TableCell className="capitalize">{order.order_type.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs uppercase">{order.payment_method}</span>
                        <Chip
                          size="sm"
                          color={order.payment_status === 'paid' ? 'success' : 'warning'}
                          variant="flat"
                        >
                          {order.payment_status}
                        </Chip>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.gcash_reference_number || order.paymaya_reference_number ? (
                        <code className="text-xs bg-default-100 px-2 py-1 rounded">
                          {order.gcash_reference_number || order.paymaya_reference_number}
                        </code>
                      ) : (
                        <span className="text-xs text-default-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>₱{Number(order.final_amount || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip color={statusColors[order.order_status]} size="sm" className="capitalize">
                        {order.order_status}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {new Date(order.order_datetime).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        onPress={() => handleViewOrder(order)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Order Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>Order Details - {selectedOrder?.order_number}</ModalHeader>
          <ModalBody>
            {selectedOrder && (
              <Tabs aria-label="Order details tabs">
                <Tab key="details" title="Details">
                  <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-default-500">Verification Code</p>
                        <code className="text-lg font-bold bg-default-100 px-2 py-1 rounded">
                          {selectedOrder.verification_code}
                        </code>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Status</p>
                        <Chip color={statusColors[selectedOrder.order_status]} className="capitalize mt-1">
                          {selectedOrder.order_status}
                        </Chip>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Order Type</p>
                        <p className="font-semibold capitalize">
                          {selectedOrder.order_type.replace('_', ' ')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Payment Method</p>
                        <p className="font-semibold uppercase">{selectedOrder.payment_method}</p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Payment Status</p>
                        <Chip
                          color={selectedOrder.payment_status === 'paid' ? 'success' : 'warning'}
                          className="capitalize mt-1"
                        >
                          {selectedOrder.payment_status}
                        </Chip>
                      </div>
                      {(selectedOrder.gcash_reference_number || selectedOrder.paymaya_reference_number) && (
                        <div>
                          <p className="text-sm text-default-500">Reference Number</p>
                          <code className="text-sm bg-default-100 px-2 py-1 rounded">
                            {selectedOrder.gcash_reference_number || selectedOrder.paymaya_reference_number}
                          </code>
                        </div>
                      )}
                    </div>

                    <Divider />

                    <div>
                      <p className="text-sm text-default-500 mb-2 font-semibold">Items</p>
                      {selectedOrder.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between p-3 bg-default-50 rounded mb-2">
                          <div>
                            <span className="font-medium">{item.item_name || item.menu_item?.name || 'Item'}</span>
                            <span className="text-sm text-default-500 ml-2">x{item.quantity}</span>
                          </div>
                          <span className="font-semibold">₱{Number(item.item_total || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between mb-2">
                        <span>Subtotal:</span>
                        <span>₱{Number(selectedOrder.total_amount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span>Tax:</span>
                        <span>₱{Number(selectedOrder.tax_amount || 0).toFixed(2)}</span>
                      </div>
                      {selectedOrder.discount_amount > 0 && (
                        <div className="flex justify-between mb-2 text-success">
                          <span>Discount:</span>
                          <span>-₱{Number(selectedOrder.discount_amount || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>₱{Number(selectedOrder.final_amount || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    {selectedOrder.special_instructions && (
                      <div>
                        <p className="text-sm text-default-500 mb-1">Special Instructions</p>
                        <p className="text-sm bg-warning-50 p-3 rounded">
                          {selectedOrder.special_instructions}
                        </p>
                      </div>
                    )}
                  </div>
                </Tab>

                <Tab key="timeline" title={
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4" />
                    <span>Timeline</span>
                  </div>
                }>
                  <div className="pt-4">
                    {loadingTimeline ? (
                      <div className="flex justify-center p-8">
                        <Spinner size="md" />
                      </div>
                    ) : orderTimeline.length > 0 ? (
                      <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-default-200" />

                        {/* Timeline entries */}
                        <div className="space-y-4">
                          {orderTimeline.map((entry, idx) => (
                            <div key={entry.timeline_id} className="relative flex gap-4 items-start">
                              {/* Timeline dot */}
                              <div className={`
                                relative z-10 flex items-center justify-center w-8 h-8 rounded-full
                                ${idx === orderTimeline.length - 1
                                  ? 'bg-primary-500 ring-4 ring-primary-100'
                                  : 'bg-default-300'
                                }
                              `}>
                                {idx === orderTimeline.length - 1 ? (
                                  <CheckCircleIcon className="h-5 w-5 text-white" />
                                ) : (
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                )}
                              </div>

                              {/* Timeline content */}
                              <div className="flex-1 pb-4">
                                <div className="bg-default-50 p-3 rounded-lg">
                                  <div className="flex items-center justify-between mb-1">
                                    <Chip
                                      size="sm"
                                      color={statusColors[entry.status]}
                                      className="capitalize"
                                    >
                                      {entry.status}
                                    </Chip>
                                    <span className="text-xs text-default-400">
                                      {formatTimestamp(entry.timestamp)}
                                    </span>
                                  </div>
                                  {entry.changed_by_name && (
                                    <p className="text-sm text-default-600 mt-1">
                                      By: {entry.changed_by_name}
                                    </p>
                                  )}
                                  {entry.notes && (
                                    <p className="text-sm text-default-500 mt-2 italic">
                                      {entry.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-8 text-default-400">
                        <ClockIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No timeline history available</p>
                      </div>
                    )}
                  </div>
                </Tab>
              </Tabs>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>Close</Button>

            {/* Payment Verification Button */}
            {selectedOrder && needsPaymentVerification(selectedOrder) && (
              <Button
                color="warning"
                onPress={onPaymentModalOpen}
                startContent={<CheckCircleIcon className="h-5 w-5" />}
              >
                Verify Payment
              </Button>
            )}

            {/* Status Update Buttons */}
            {selectedOrder && selectedOrder.order_status !== 'completed' && selectedOrder.order_status !== 'cancelled' && (
              <div className="flex gap-2">
                {selectedOrder.order_status === 'pending' && (
                  <Button
                    color="primary"
                    onPress={() => handleUpdateStatus('confirmed' as OrderStatus)}
                    isLoading={updating}
                  >
                    Confirm Order
                  </Button>
                )}
                {selectedOrder.order_status === 'confirmed' && (
                  <Button
                    color="primary"
                    onPress={() => handleUpdateStatus('preparing' as OrderStatus)}
                    isLoading={updating}
                  >
                    Start Preparing
                  </Button>
                )}
                {selectedOrder.order_status === 'preparing' && (
                  <Button
                    color="success"
                    onPress={() => handleUpdateStatus('ready' as OrderStatus)}
                    isLoading={updating}
                  >
                    Mark as Ready
                  </Button>
                )}
                {selectedOrder.order_status === 'ready' && (
                  <Button
                    color="success"
                    onPress={() => handleUpdateStatus('completed' as OrderStatus)}
                    isLoading={updating}
                  >
                    Complete Order
                  </Button>
                )}
              </div>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Payment Verification Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={onPaymentModalClose} size="md">
        <ModalContent>
          <ModalHeader>Verify Payment</ModalHeader>
          <ModalBody>
            {selectedOrder && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-default-500">Order Number</p>
                  <p className="text-lg font-bold">{selectedOrder.order_number}</p>
                </div>

                <div>
                  <p className="text-sm text-default-500">Amount</p>
                  <p className="text-2xl font-bold text-primary">
                    ₱{Number(selectedOrder.final_amount || 0).toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-default-500">Payment Method</p>
                  <Chip size="lg" color="primary" className="uppercase">
                    {selectedOrder.payment_method}
                  </Chip>
                </div>

                {(selectedOrder.payment_method === 'gcash' || selectedOrder.payment_method === 'paymaya') && (
                  <Input
                    label="Reference Number"
                    placeholder="Enter payment reference number"
                   
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    isRequired
                    size="lg"
                    description="The reference number from the customer's payment confirmation"
                    errorMessage={paymentError}
                    isInvalid={!!paymentError}
                  />
                )}

                {selectedOrder.payment_method === 'card' && (
                  <div className="bg-warning-50 p-3 rounded">
                    <p className="text-sm text-warning-700">
                      Verify that the card payment was successfully processed through your POS terminal.
                    </p>
                  </div>
                )}

                {selectedOrder.payment_method === 'cash' && (
                  <div className="bg-success-50 p-3 rounded">
                    <p className="text-sm text-success-700">
                      Confirm that you have received ₱{Number(selectedOrder.final_amount || 0).toFixed(2)} in cash from the customer.
                    </p>
                  </div>
                )}

                {paymentError && (
                  <div className="bg-danger-50 border-2 border-danger-200 p-3 rounded flex items-start gap-2">
                    <XCircleIcon className="h-5 w-5 text-danger-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-danger-700">{paymentError}</p>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                onPaymentModalClose();
                setPaymentError('');
                setReferenceNumber('');
              }}
            >
              Cancel
            </Button>
            <Button
              color="success"
              onPress={handleVerifyPayment}
              isLoading={verifyingPayment}
              startContent={!verifyingPayment && <CheckCircleIcon className="h-5 w-5" />}
            >
              Verify Payment
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
