"use client";

import React, { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Divider } from "@heroui/divider";
import {
  BanknotesIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  CreditCardIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";

import { OrderService } from "@/services/order.service";
import { CustomerOrder } from "@/types/api";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<CustomerOrder[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    CustomerOrder[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [selectedTransaction, setSelectedTransaction] =
    useState<CustomerOrder | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [
    transactions,
    searchTerm,
    paymentMethodFilter,
    paymentStatusFilter,
    dateFrom,
    dateTo,
  ]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await OrderService.getOrders();

      if (response.success && response.data) {
        // Get orders data (handle both array and paginated response)
        const orders = Array.isArray(response.data)
          ? response.data
          : (response.data as any).orders || [];

        // Only show paid orders as transactions
        const completedOrders = orders.filter(
          (order: CustomerOrder) => order.payment_status === "paid",
        );

        // Fetch full details for each transaction including items
        const detailedTransactions = await Promise.all(
          completedOrders.map(async (order: CustomerOrder) => {
            try {
              const detailResponse = await OrderService.getOrderById(
                order.order_id,
              );

              return detailResponse.success && detailResponse.data
                ? detailResponse.data
                : order;
            } catch {
              return order;
            }
          }),
        );

        setTransactions(detailedTransactions);
      }
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.order_id.toString().includes(searchTerm) ||
          t.verification_code?.includes(searchTerm),
      );
    }

    // Payment method filter
    if (paymentMethodFilter !== "all") {
      filtered = filtered.filter(
        (t) => t.payment_method === paymentMethodFilter,
      );
    }

    // Payment status filter
    if (paymentStatusFilter !== "all") {
      filtered = filtered.filter(
        (t) => t.payment_status === paymentStatusFilter,
      );
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(
        (t) => new Date(t.order_datetime) >= new Date(dateFrom),
      );
    }
    if (dateTo) {
      filtered = filtered.filter(
        (t) => new Date(t.order_datetime) <= new Date(dateTo + "T23:59:59"),
      );
    }

    setFilteredTransactions(filtered);
  };

  const toggleRow = (orderId: number) => {
    const newExpanded = new Set(expandedRows);

    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedRows(newExpanded);
  };

  const exportToCSV = () => {
    const headers = [
      // Order Identification
      "Order ID",
      "Order Number",
      "Verification Code",
      "Order Date & Time",

      // Order Details
      "Order Type",
      "Order Source",
      "Order Status",
      "Is Pre-order",
      "Scheduled Pickup",
      "Actual Pickup",

      // Customer Information
      "Customer Name",
      "Customer Phone",
      "Customer Discount Type",
      "Customer Discount %",

      // Items Summary
      "Total Items",
      "Items Detail",

      // Payment Information
      "Payment Method",
      "Payment Status",
      "Subtotal",
      "Discount Amount",
      "Final Amount",
      "Amount Paid",
      "Change Amount",

      // Payment References
      "GCash Reference",
      "PayMaya Reference",
      "Card Transaction Ref",

      // Cashier & Verification
      "Cashier Name",
      "Cashier ID",
      "Payment Verified By",
      "Payment Verified At",

      // Additional Info
      "Special Instructions",
      "Is Printed",
      "Created At",
      "Updated At",
    ];

    const rows = filteredTransactions.map((t) => {
      const transaction = t as any;
      const itemsDetail = t.items
        ?.map((item) => {
          const itemData = item as any;
          return `${itemData.item_name || "Item"} (₱${Number(item.unit_price || 0).toFixed(2)} x${item.quantity} = ₱${Number(item.item_total || Number(item.unit_price || 0) * Number(item.quantity || 0)).toFixed(2)})`;
        })
        .join(" | ") || "N/A";

      return [
        // Order Identification
        t.order_id,
        t.order_number || "N/A",
        t.verification_code || "N/A",
        new Date(t.order_datetime).toLocaleString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),

        // Order Details
        t.order_type?.replace("_", " ").toUpperCase() || "N/A",
        t.order_source?.toUpperCase() || "N/A",
        t.order_status?.toUpperCase() || "N/A",
        t.is_preorder ? "Yes" : "No",
        t.scheduled_pickup_datetime
          ? new Date(t.scheduled_pickup_datetime).toLocaleString()
          : "N/A",
        t.actual_pickup_datetime
          ? new Date(t.actual_pickup_datetime).toLocaleString()
          : "N/A",

        // Customer Information
        t.customer?.name || "Walk-in Customer",
        t.customer?.phone || t.phone || "N/A",
        t.customer_discount?.name || "None",
        t.customer_discount_percentage
          ? Number(t.customer_discount_percentage).toFixed(2) + "%"
          : "0%",

        // Items Summary
        t.items?.length || 0,
        itemsDetail,

        // Payment Information
        t.payment_method?.toUpperCase() || "N/A",
        t.payment_status?.toUpperCase() || "N/A",
        Number(t.total_amount || 0).toFixed(2),
        Number(t.discount_amount || 0).toFixed(2),
        Number(t.final_amount || 0).toFixed(2),
        Number(transaction.amount_paid || 0).toFixed(2),
        Number(transaction.change_amount || 0).toFixed(2),

        // Payment References
        t.gcash_reference_number || "N/A",
        t.paymaya_reference_number || "N/A",
        t.card_transaction_ref || "N/A",

        // Cashier & Verification
        transaction.cashier?.name || "N/A",
        t.cashier_id || "N/A",
        transaction.payment_verified_by || "N/A",
        t.payment_verified_at
          ? new Date(t.payment_verified_at).toLocaleString()
          : "N/A",

        // Additional Info
        t.special_instructions || "None",
        t.is_printed ? "Yes" : "No",
        new Date(t.created_at).toLocaleString(),
        new Date(t.updated_at).toLocaleString(),
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // Add BOM for Excel UTF-8 compatibility
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const dateRange =
      dateFrom && dateTo
        ? `${dateFrom}_to_${dateTo}`
        : new Date().toISOString().split("T")[0];

    link.href = url;
    link.download = `GoldenMunch_Transactions_${dateRange}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getTotalAmount = () => {
    return filteredTransactions.reduce(
      (sum, t) => sum + Number(t.final_amount || 0),
      0,
    );
  };

  const getTotalCashCollected = () => {
    return filteredTransactions
      .filter((t) => t.payment_method === "cash")
      .reduce((sum, t) => sum + Number((t as any).amount_paid || 0), 0);
  };

  const getTotalChangeGiven = () => {
    return filteredTransactions
      .filter((t) => t.payment_method === "cash")
      .reduce((sum, t) => sum + Number((t as any).change_amount || 0), 0);
  };

  const formatCurrency = (amount: number | string) => {
    return `₱${Number(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleViewDetails = (transaction: CustomerOrder) => {
    setSelectedTransaction(transaction);
    onOpen();
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
            Detailed view of all completed transactions with items and payment
            info
          </p>
        </div>
        <Button
          color="primary"
          isDisabled={filteredTransactions.length === 0}
          startContent={<DocumentArrowDownIcon className="h-5 w-5" />}
          onPress={exportToCSV}
        >
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-100 rounded-lg">
                <BanknotesIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-default-500">Total Sales</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(getTotalAmount())}
                </p>
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
                <p className="text-2xl font-bold">
                  {filteredTransactions.length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-warning-100 rounded-lg">
                <FunnelIcon className="h-6 w-6 text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-default-500">Average Per Sale</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    filteredTransactions.length > 0
                      ? getTotalAmount() / filteredTransactions.length
                      : 0,
                  )}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-secondary-100 rounded-lg">
                <CreditCardIcon className="h-6 w-6 text-secondary-600" />
              </div>
              <div>
                <p className="text-sm text-default-500">Cash Collected</p>
                <p className="text-lg font-bold">
                  {formatCurrency(getTotalCashCollected())}
                </p>
                <p className="text-xs text-default-400">
                  Change: {formatCurrency(getTotalChangeGiven())}
                </p>
              </div>
            </div>
          </CardBody>
        </Card> */}
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              classNames={{ input: "text-sm" }}
              placeholder="Search order..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />

            <Select
              label="Payment Method"
              selectedKeys={[paymentMethodFilter]}
              size="sm"
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
            >
              <SelectItem key="all">All Methods</SelectItem>
              <SelectItem key="cash">Cash</SelectItem>
              <SelectItem key="cashless">Cashless</SelectItem>
              <SelectItem key="gcash">GCash</SelectItem>
              <SelectItem key="paymaya">PayMaya</SelectItem>
            </Select>

            <Select
              label="Payment Status"
              selectedKeys={[paymentStatusFilter]}
              size="sm"
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
            >
              <SelectItem key="all">All Status</SelectItem>
              <SelectItem key="paid">Paid</SelectItem>
              <SelectItem key="pending">Pending</SelectItem>
              <SelectItem key="refunded">Refunded</SelectItem>
            </Select>

            <Input
              label="From"
              size="sm"
              type="date"
              value={dateFrom}
              onValueChange={setDateFrom}
            />

            <Input
              label="To"
              size="sm"
              type="date"
              value={dateTo}
              onValueChange={setDateTo}
            />
          </div>
        </CardBody>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-default-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-default-600 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-default-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-default-600 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-default-600 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-default-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-default-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-default-200">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-default-400"
                      colSpan={6}
                    >
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => {
                    const isExpanded = expandedRows.has(transaction.order_id);
                    const itemsCount = transaction.items?.length || 0;

                    return (
                      <React.Fragment key={transaction.order_id}>
                        <tr className="hover:bg-default-50">
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <p className="font-semibold text-sm">
                                {transaction.order_number ||
                                  `#${transaction.order_id}`}
                              </p>
                              <p className="text-xs text-default-500">
                                {formatDate(transaction.order_datetime)}
                              </p>
                              {transaction.verification_code && (
                                <code className="text-xs text-default-400 bg-default-100 px-1 rounded">
                                  {transaction.verification_code}
                                </code>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">
                                {transaction.customer?.name || "Walk-in"}
                              </p>
                              {transaction.customer_discount && (
                                <Chip
                                  color="secondary"
                                  size="sm"
                                  variant="flat"
                                >
                                  {transaction.customer_discount.name} -{" "}
                                  {Number(
                                    transaction.customer_discount_percentage ||
                                      0,
                                  ).toFixed(1)}
                                  %
                                </Chip>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <ShoppingBagIcon className="h-4 w-4 text-default-400" />
                              <span className="text-sm">
                                {itemsCount} item{itemsCount !== 1 ? "s" : ""}
                              </span>
                              {itemsCount > 0 && (
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="flat"
                                  onPress={() =>
                                    toggleRow(transaction.order_id)
                                  }
                                >
                                  {isExpanded ? (
                                    <ChevronUpIcon className="h-4 w-4" />
                                  ) : (
                                    <ChevronDownIcon className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-2">
                              <Chip
                                className="uppercase"
                                color={
                                  transaction.payment_method === "cash"
                                    ? "success"
                                    : "primary"
                                }
                                size="sm"
                                variant="flat"
                              >
                                {transaction.payment_method}
                              </Chip> 
                              {transaction.payment_method === "cash" && 
                                (transaction as any).change_amount &&
                                Number((transaction as any).change_amount) >
                                  0 && (
                                  <p className="text-xs text-default-500">
                                    Change:{" "}
                                    {formatCurrency(
                                      (transaction as any).change_amount,
                                    )}
                                  </p>
                                )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="space-y-1">
                              {transaction.discount_amount &&
                                Number(transaction.discount_amount) > 0 && (
                                  <p className="text-xs text-default-500 line-through">
                                    {formatCurrency(
                                      Number(transaction.total_amount) +
                                        Number(transaction.discount_amount),
                                    )}
                                  </p>
                                )}
                              <p className="font-bold text-lg">
                                {formatCurrency(transaction.final_amount)}
                              </p>
                              {transaction.payment_method === "cash" &&
                                (transaction as any).amount_paid &&
                                Number((transaction as any).amount_paid) >
                                  0 && (
                                  <p className="text-xs text-success">
                                    Paid:{" "}
                                    {formatCurrency(
                                      (transaction as any).amount_paid,
                                    )}
                                  </p>
                                )}
                              {transaction.payment_method === "cash" &&
                                (transaction as any).change_amount &&
                                Number((transaction as any).change_amount) >
                                  0 && (
                                  <p className="text-xs text-warning">
                                    Change:{" "}
                                    {formatCurrency(
                                      (transaction as any).change_amount,
                                    )}
                                  </p>
                                )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <Button
                              color="primary"
                              size="sm"
                              startContent={<EyeIcon className="h-4 w-4" />}
                              variant="flat"
                              onPress={() => handleViewDetails(transaction)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>

                        {/* Expanded Row - Items Detail */}
                        {isExpanded &&
                          transaction.items &&
                          transaction.items.length > 0 && (
                            <tr>
                              <td
                                className="px-4 py-4 bg-default-50"
                                colSpan={6}
                              >
                                <div className="space-y-2">
                                  <p className="text-sm font-semibold text-default-700 mb-3">
                                    Order Items:
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {transaction.items.map((item) => (
                                      <div
                                        key={item.order_item_id}
                                        className="flex justify-between items-center bg-white p-3 rounded border border-default-200"
                                      >
                                        <div className="flex-1">
                                          <p className="font-medium text-sm">
                                            {(item as any).item_name || "Item"}
                                          </p>
                                          <p className="text-xs text-default-500">
                                            {formatCurrency(item.unit_price)} ×{" "}
                                            {item.quantity}
                                          </p>
                                        </div>
                                        <p className="font-semibold text-sm">
                                          {formatCurrency(
                                            item.item_total ||
                                              Number(item.unit_price || 0) *
                                                Number(item.quantity || 0),
                                          )}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Transaction Details Modal */}
      <Modal
        isOpen={isOpen}
        scrollBehavior="inside"
        size="3xl"
        onClose={onClose}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3>Transaction Details</h3>
            <p className="text-sm font-normal text-default-500">
              {selectedTransaction?.order_number ||
                `Order #${selectedTransaction?.order_id}`}
            </p>
          </ModalHeader>
          <ModalBody>
            {selectedTransaction && (
              <div className="space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-default-500">Order Number</p>
                    <p className="font-semibold">
                      {selectedTransaction.order_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">
                      Verification Code
                    </p>
                    <code className="font-semibold bg-default-100 px-2 py-1 rounded">
                      {selectedTransaction.verification_code}
                    </code>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Order Date</p>
                    <p className="font-semibold">
                      {formatDate(selectedTransaction.order_datetime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Order Type</p>
                    <p className="font-semibold capitalize">
                      {selectedTransaction.order_type?.replace("_", " ")}
                    </p>
                  </div>
                </div>

                <Divider />

                {/* Items */}
                <div>
                  <p className="text-sm font-semibold text-default-700 mb-3">
                    Items Purchased:
                  </p>
                  <div className="space-y-2">
                    {selectedTransaction.items?.map((item) => (
                      <div
                        key={item.order_item_id}
                        className="flex justify-between items-start p-3 bg-default-50 rounded"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {(item as any).item_name || "Item"}
                          </p>
                          <p className="text-sm text-default-500">
                            {formatCurrency(item.unit_price)} × {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold">
                          {formatCurrency(
                            item.item_total ||
                              Number(item.unit_price || 0) *
                                Number(item.quantity || 0),
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <Divider />

                {/* Payment Breakdown */}
                <div>
                  <p className="text-sm font-semibold text-default-700 mb-3">
                    Payment Details:
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>
                        {formatCurrency(selectedTransaction.total_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>
                        {formatCurrency(selectedTransaction.tax_amount)}
                      </span>
                    </div>
                    {Number(selectedTransaction.discount_amount || 0) > 0 && (
                      <div className="flex justify-between text-success">
                        <span>Discount:</span>
                        <span>
                          -{formatCurrency(selectedTransaction.discount_amount)}
                        </span>
                      </div>
                    )}
                    <Divider />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Final Amount:</span>
                      <span>
                        {formatCurrency(selectedTransaction.final_amount)}
                      </span>
                    </div>

                    {/* Cash Handling Details */}
                    {selectedTransaction.payment_method === "cash" && (
                      <>
                        <Divider />
                        <div className="bg-success-50 p-4 rounded-lg space-y-2">
                          <p className="font-semibold text-sm text-success-700">
                            Cash Payment Details
                          </p>
                          <div className="flex justify-between">
                            <span className="text-sm">Amount Received:</span>
                            <span className="font-semibold">
                              {formatCurrency(
                                (selectedTransaction as any).amount_paid ||
                                  selectedTransaction.final_amount,
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Change Given:</span>
                            <span className="font-semibold">
                              {formatCurrency(
                                (selectedTransaction as any).change_amount,
                              )}
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Cashless Payment Details */}
                    {selectedTransaction.payment_method !== "cash" && (
                      <>
                        <Divider />
                        <div className="bg-primary-50 p-4 rounded-lg">
                          <p className="font-semibold text-sm text-primary-700 mb-2">
                            Payment Reference
                          </p>
                          <code className="text-sm bg-white px-2 py-1 rounded">
                            {selectedTransaction.gcash_reference_number ||
                              selectedTransaction.paymaya_reference_number ||
                              selectedTransaction.card_transaction_ref ||
                              "N/A"}
                          </code>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Divider />

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-default-500">Payment Method</p>
                    <Chip
                      className="uppercase mt-1"
                      color="primary"
                      variant="flat"
                    >
                      {selectedTransaction.payment_method}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Payment Status</p>
                    <Chip
                      className="capitalize mt-1"
                      color="success"
                      variant="flat"
                    >
                      {selectedTransaction.payment_status}
                    </Chip>
                  </div>
                  {(selectedTransaction as any).cashier && (
                    <div>
                      <p className="text-sm text-default-500">Processed By</p>
                      <p className="font-semibold">
                        {(selectedTransaction as any).cashier.name || "Cashier"}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-default-500">Order Status</p>
                    <Chip
                      className="capitalize mt-1"
                      color="default"
                      variant="flat"
                    >
                      {selectedTransaction.order_status}
                    </Chip>
                  </div>
                </div>

                {selectedTransaction.special_instructions && (
                  <>
                    <Divider />
                    <div>
                      <p className="text-sm text-default-500 mb-2">
                        Special Instructions
                      </p>
                      <p className="text-sm bg-warning-50 p-3 rounded">
                        {selectedTransaction.special_instructions}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
