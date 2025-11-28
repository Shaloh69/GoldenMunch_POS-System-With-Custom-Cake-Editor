'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { OrderService } from '@/services/order.service';
import { CustomerOrder, PaymentMethod, PaymentStatus } from '@/types/api';
import {
  BanknotesIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<CustomerOrder[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, paymentMethodFilter, paymentStatusFilter, dateFrom, dateTo]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await OrderService.getOrders();
      if (response.success && response.data) {
        // Only show completed/paid orders as transactions
        const completedOrders = response.data.filter(
          order => order.payment_status === 'paid' || order.order_status === 'completed'
        );
        setTransactions(completedOrders);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.order_id.toString().includes(searchTerm) ||
        t.verification_code?.includes(searchTerm)
      );
    }

    // Payment method filter
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(t => t.payment_method === paymentMethodFilter);
    }

    // Payment status filter
    if (paymentStatusFilter !== 'all') {
      filtered = filtered.filter(t => t.payment_status === paymentStatusFilter);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(t => new Date(t.order_datetime) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(t => new Date(t.order_datetime) <= new Date(dateTo + 'T23:59:59'));
    }

    setFilteredTransactions(filtered);
  };

  const exportToCSV = () => {
    const headers = ['Order ID', 'Date', 'Payment Method', 'Status', 'Amount'];
    const rows = filteredTransactions.map(t => [
      t.order_number || t.order_id,
      new Date(t.order_datetime).toLocaleString(),
      t.payment_method,
      t.payment_status,
      `₱${parseFloat(t.final_amount).toFixed(2)}`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getTotalAmount = () => {
    return filteredTransactions.reduce((sum, t) => sum + parseFloat(t.final_amount), 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
            Transaction History
          </h1>
          <p className="text-default-500 mt-1">
            View and export all completed transactions
          </p>
        </div>
        <Button
          color="primary"
          startContent={<DocumentArrowDownIcon className="h-5 w-5" />}
          onPress={exportToCSV}
          isDisabled={filteredTransactions.length === 0}
        >
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-100 rounded-lg">
                <BanknotesIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-default-500">Total Revenue</p>
                <p className="text-2xl font-bold">₱{getTotalAmount().toFixed(2)}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-success-100 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-default-500">Total Transactions</p>
                <p className="text-2xl font-bold">{filteredTransactions.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-warning-100 rounded-lg">
                <FunnelIcon className="h-6 w-6 text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-default-500">Average Amount</p>
                <p className="text-2xl font-bold">
                  ₱{filteredTransactions.length > 0 ? (getTotalAmount() / filteredTransactions.length).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Search order..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              classNames={{ input: "text-sm" }}
            />

            <Select
              label="Payment Method"
              selectedKeys={[paymentMethodFilter]}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              size="sm"
            >
              <SelectItem key="all" value="all">All Methods</SelectItem>
              <SelectItem key="cash" value="cash">Cash</SelectItem>
              <SelectItem key="cashless" value="cashless">Cashless</SelectItem>
            </Select>

            <Select
              label="Payment Status"
              selectedKeys={[paymentStatusFilter]}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              size="sm"
            >
              <SelectItem key="all" value="all">All Status</SelectItem>
              <SelectItem key="paid" value="paid">Paid</SelectItem>
              <SelectItem key="pending" value="pending">Pending</SelectItem>
              <SelectItem key="refunded" value="refunded">Refunded</SelectItem>
            </Select>

            <Input
              type="date"
              label="From"
              value={dateFrom}
              onValueChange={setDateFrom}
              size="sm"
            />

            <Input
              type="date"
              label="To"
              value={dateTo}
              onValueChange={setDateTo}
              size="sm"
            />
          </div>
        </CardBody>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardBody className="p-0">
          <Table aria-label="Transactions table">
            <TableHeader>
              <TableColumn>ORDER ID</TableColumn>
              <TableColumn>DATE</TableColumn>
              <TableColumn>PAYMENT METHOD</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>AMOUNT</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No transactions found">
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.order_id}>
                  <TableCell>
                    <div>
                      <p className="font-semibold">{transaction.order_number || `#${transaction.order_id}`}</p>
                      {transaction.verification_code && (
                        <code className="text-xs text-default-400">
                          {transaction.verification_code}
                        </code>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(transaction.order_datetime)}</TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={transaction.payment_method === 'cash' ? 'success' : 'primary'}
                      className="uppercase"
                    >
                      {transaction.payment_method}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={
                        transaction.payment_status === 'paid' ? 'success' :
                        transaction.payment_status === 'refunded' ? 'danger' :
                        'warning'
                      }
                      variant="flat"
                      className="capitalize"
                    >
                      {transaction.payment_status.replace('_', ' ')}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">₱{parseFloat(transaction.final_amount).toFixed(2)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
