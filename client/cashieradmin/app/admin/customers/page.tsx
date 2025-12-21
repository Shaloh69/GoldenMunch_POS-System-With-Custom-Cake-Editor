"use client";

import type {
  Customer,
  CreateCustomerRequest,
  CustomerOrder,
} from "@/types/api";

import { useEffect, useState, useMemo } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Pagination } from "@heroui/pagination";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

import { CustomerService } from "@/services/customer.service";

// Types
interface CustomerWithStats extends Customer {
  orderCount: number;
  totalSpent: number;
}

interface CustomerModalData {
  phone: string;
  name?: string;
  email?: string;
  dateOfBirth?: string;
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export default function AdminCustomersPage() {
  // State
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(
    null,
  );

  const pageSize = 10;

  // Modals
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isOrdersOpen,
    onOpen: onOrdersOpen,
    onClose: onOrdersClose,
  } = useDisclosure();

  // Form state
  const [formData, setFormData] = useState<CustomerModalData>({
    phone: "",
    name: "",
    email: "",
    dateOfBirth: "",
  });

  // Load customers
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await CustomerService.getCustomers({
        page: currentPage,
        pageSize: pageSize,
      });

      if (response.data) {
        const customerData = Array.isArray(response.data)
          ? response.data
          : [response.data];
        const enrichedCustomers = customerData.map((customer: Customer) => ({
          ...customer,
          orderCount: customer.total_orders || 0,
          totalSpent: customer.total_spent || 0,
        }));

        setCustomers(enrichedCustomers);
      }
    } catch (error) {
      console.error("Failed to load customers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Search and filter
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const searchLower = searchTerm.toLowerCase();

      return (
        customer.phone.toLowerCase().includes(searchLower) ||
        customer.name?.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower)
      );
    });
  }, [customers, searchTerm]);

  // Pagination
  const paginatedCustomers = useMemo(() => {
    const startIndex = 0;

    return filteredCustomers.slice(startIndex, startIndex + pageSize);
  }, [filteredCustomers]);

  const totalPages = Math.ceil(filteredCustomers.length / pageSize);

  // Create customer
  const handleCreateClick = () => {
    setFormData({
      phone: "",
      name: "",
      email: "",
      dateOfBirth: "",
    });
    setEditingCustomerId(null);
    onCreateOpen();
  };

  // Edit customer
  const handleEditClick = (customer: Customer) => {
    setFormData({
      phone: customer.phone,
      name: customer.name || "",
      email: customer.email || "",
      dateOfBirth: customer.date_of_birth || "",
    });
    setEditingCustomerId(customer.customer_id);
    onEditOpen();
  };

  // View orders
  const handleViewOrders = async (customer: Customer) => {
    try {
      setSelectedCustomer(customer);
      setOrdersLoading(true);

      // In a real scenario, you'd fetch orders for this specific customer
      // For now, we'll show the orders from the customer object
      const response = await CustomerService.getCustomerById(
        customer.customer_id,
      );

      if (response.data) {
        const customerData = response.data as any;

        setCustomerOrders(customerData.orders || []);
      }

      onOrdersOpen();
    } catch (error) {
      console.error("Failed to load customer orders:", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Submit create/edit form
  const handleSubmit = async () => {
    if (!formData.phone.trim()) {
      alert("Phone number is required");

      return;
    }

    try {
      setIsSaving(true);
      const submitData: CreateCustomerRequest = {
        phone: formData.phone,
        name: formData.name || undefined,
        email: formData.email || undefined,
        date_of_birth: formData.dateOfBirth || undefined,
      };

      if (editingCustomerId) {
        // Update
        await CustomerService.updateCustomer(editingCustomerId, submitData);
      } else {
        // Create
        await CustomerService.createCustomer(submitData);
      }

      loadCustomers();
      onCreateClose();
      onEditClose();
      setFormData({
        phone: "",
        name: "",
        email: "",
        dateOfBirth: "",
      });
    } catch (error) {
      console.error("Failed to save customer:", error);
      alert("Failed to save customer. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete customer
  const handleDelete = async (customerId: number) => {
    if (!confirm("Are you sure you want to delete this customer?")) {
      return;
    }

    try {
      setLoading(true);
      // Assuming deleteCustomer method exists in CustomerService
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadCustomers();
      } else {
        alert("Failed to delete customer");
      }
    } catch (error) {
      console.error("Failed to delete customer:", error);
      alert("Failed to delete customer");
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const averageOrderValue =
    customers.length > 0
      ? totalRevenue / customers.reduce((sum, c) => sum + c.orderCount, 0)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
            Customer Management
          </h1>
          <p className="text-default-500 mt-1">
            Manage and track customer information and orders
          </p>
        </div>
        <Button
          color="primary"
          startContent={<PlusIcon className="h-5 w-5" />}
          onPress={handleCreateClick}
        >
          Add Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Total Customers</p>
                <p className="text-2xl font-bold">{totalCustomers}</p>
              </div>
              <div className="text-4xl opacity-10">👥</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Total Revenue</p>
                <p className="text-2xl font-bold">
                  ₱{Number(totalRevenue || 0).toFixed(2)}
                </p>
              </div>
              <div className="text-4xl opacity-10">💰</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Avg. Order Value</p>
                <p className="text-2xl font-bold">
                  ₱{Number(averageOrderValue || 0).toFixed(2)}
                </p>
              </div>
              <div className="text-4xl opacity-10">📊</div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Search */}
      <Input
        className="max-w-md"
        placeholder="Search by name, email, or phone..."
        startContent={
          <MagnifyingGlassIcon className="h-5 w-5 text-default-400" />
        }
        value={searchTerm}
        onValueChange={setSearchTerm}
      />

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Customers List</h3>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex justify-center p-8">
              <Spinner color="primary" size="lg" />
            </div>
          ) : (
            <>
              <Table aria-label="Customers table">
                <TableHeader>
                  <TableColumn>NAME</TableColumn>
                  <TableColumn>EMAIL</TableColumn>
                  <TableColumn>PHONE</TableColumn>
                  <TableColumn>TOTAL ORDERS</TableColumn>
                  <TableColumn>TOTAL SPENT</TableColumn>
                  <TableColumn>LOYALTY POINTS</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No customers found">
                  {paginatedCustomers.map((customer) => (
                    <TableRow key={customer.customer_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {customer.name || "N/A"}
                          </p>
                          <p className="text-sm text-default-400">
                            ID: {customer.customer_id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <EnvelopeIcon className="h-4 w-4 text-default-400" />
                          {customer.email ? (
                            <a
                              className="text-blue-500 hover:underline"
                              href={`mailto:${customer.email}`}
                            >
                              {customer.email}
                            </a>
                          ) : (
                            <span className="text-default-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <PhoneIcon className="h-4 w-4 text-default-400" />
                          <a
                            className="text-blue-500 hover:underline"
                            href={`tel:${customer.phone}`}
                          >
                            {customer.phone}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={
                            customer.orderCount > 5 ? "success" : "default"
                          }
                          size="sm"
                          variant="flat"
                        >
                          {customer.orderCount}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold">
                          ₱{Number(customer.totalSpent || 0).toFixed(2)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Chip color="secondary" size="sm" variant="flat">
                          {customer.loyalty_points}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            isIconOnly
                            color="primary"
                            size="sm"
                            title="View Orders"
                            variant="flat"
                            onPress={() => handleViewOrders(customer)}
                          >
                            <MagnifyingGlassIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            isIconOnly
                            color="warning"
                            size="sm"
                            title="Edit"
                            variant="flat"
                            onPress={() => handleEditClick(customer)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            isIconOnly
                            color="danger"
                            size="sm"
                            title="Delete"
                            variant="flat"
                            onPress={() => handleDelete(customer.customer_id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination
                    showControls
                    className="gap-2"
                    initialPage={1}
                    total={totalPages}
                    onChange={(page) => setCurrentPage(page)}
                  />
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Customer Modal */}
      <Modal
        isOpen={isCreateOpen || isEditOpen}
        size="lg"
        onClose={editingCustomerId ? onEditClose : onCreateClose}
      >
        <ModalContent>
          <ModalHeader>
            {editingCustomerId ? "Edit Customer" : "Add New Customer"}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                isRequired
                description="Phone number is required"
                label="Phone Number *"
                placeholder="Enter phone number"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
              <Input
                label="Full Name"
                placeholder="Enter customer name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <Input
                label="Email"
                placeholder="Enter email address"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              <Input
                label="Date of Birth"
                placeholder="YYYY-MM-DD"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfBirth: e.target.value })
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={editingCustomerId ? onEditClose : onCreateClose}
            >
              Cancel
            </Button>
            <Button color="primary" isLoading={isSaving} onPress={handleSubmit}>
              {editingCustomerId ? "Update Customer" : "Create Customer"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Customer Orders Modal */}
      <Modal
        isOpen={isOrdersOpen}
        scrollBehavior="inside"
        size="3xl"
        onClose={onOrdersClose}
      >
        <ModalContent>
          <ModalHeader>
            Order History - {selectedCustomer?.name || selectedCustomer?.phone}
          </ModalHeader>
          <ModalBody>
            {ordersLoading ? (
              <div className="flex justify-center p-8">
                <Spinner color="primary" size="lg" />
              </div>
            ) : customerOrders && customerOrders.length > 0 ? (
              <div className="space-y-4">
                {customerOrders.map((order) => (
                  <Card
                    key={order.order_id}
                    className="border-l-4 border-primary"
                  >
                    <CardBody>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-default-500">Order #</p>
                          <p className="font-semibold">
                            {order.order_number || `#${order.order_id}`}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-default-500">Status</p>
                          <Chip
                            color={
                              order.order_status === "completed"
                                ? "success"
                                : order.order_status === "pending"
                                  ? "warning"
                                  : order.order_status === "cancelled"
                                    ? "danger"
                                    : "default"
                            }
                            size="sm"
                          >
                            {order.order_status}
                          </Chip>
                        </div>
                        <div>
                          <p className="text-sm text-default-500">Order Date</p>
                          <p className="font-medium">
                            {new Date(
                              order.order_datetime,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-default-500">Amount</p>
                          <p className="font-semibold">
                            ₱{Number(order.final_amount || 0).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-default-500">Order Type</p>
                          <Chip className="capitalize" size="sm" variant="flat">
                            {order.order_type}
                          </Chip>
                        </div>
                        <div>
                          <p className="text-sm text-default-500">Payment</p>
                          <Chip
                            className="capitalize"
                            color={
                              order.payment_status === "paid"
                                ? "success"
                                : "warning"
                            }
                            size="sm"
                            variant="flat"
                          >
                            {order.payment_status}
                          </Chip>
                        </div>
                      </div>

                      {/* Order Items */}
                      {order.items && order.items.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-semibold mb-2">Items:</p>
                          <div className="space-y-1">
                            {order.items.map((item) => (
                              <div
                                key={item.order_item_id}
                                className="flex justify-between text-sm"
                              >
                                <span>
                                  {item.menu_item?.name || "Unknown Item"}
                                </span>
                                <span className="text-default-500">
                                  x{item.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-default-500">
                  No orders found for this customer
                </p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={onOrdersClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
