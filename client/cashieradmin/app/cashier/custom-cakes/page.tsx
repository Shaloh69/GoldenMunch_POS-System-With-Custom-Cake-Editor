"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { motion, AnimatePresence } from "framer-motion";
import {
  CakeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

import {
  CustomCakeCashierService,
  type ApprovedCustomCake,
  type ProcessPaymentData,
} from "@/services/customCakeCashier.service";

export default function CashierCustomCakesPage() {
  // State Management
  const [approvedCakes, setApprovedCakes] = useState<ApprovedCustomCake[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCake, setSelectedCake] = useState<ApprovedCustomCake | null>(
    null,
  );
  const [paymentForm, setPaymentForm] = useState<ProcessPaymentData>({
    payment_method: "cash",
    amount_paid: 0,
  });

  // Initial Data Fetch
  useEffect(() => {
    fetchApprovedCakes();

    // Auto-refresh at optimized interval to reduce API load
    // Increased from 30s to 2 minutes to reduce rate limiting issues
    const interval = setInterval(fetchApprovedCakes, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
        setErrorMessage("");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  // Fetch approved cakes
  const fetchApprovedCakes = async () => {
    try {
      setLoading(true);
      const cakes = await CustomCakeCashierService.getApprovedCakes();

      setApprovedCakes(cakes);
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to load approved custom cakes");
    } finally {
      setLoading(false);
    }
  };

  // Open payment modal
  const openPaymentModal = (cake: ApprovedCustomCake) => {
    setSelectedCake(cake);
    setPaymentForm({
      payment_method: "cash",
      amount_paid: cake.approved_price,
    });
    setShowPaymentModal(true);
  };

  // Close payment modal
  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedCake(null);
    setPaymentForm({ payment_method: "cash", amount_paid: 0 });
  };

  // Process payment
  const handleProcessPayment = async () => {
    if (!selectedCake) return;

    // Validate payment amount
    if (
      !CustomCakeCashierService.isValidPayment(
        paymentForm.amount_paid,
        selectedCake.approved_price,
      )
    ) {
      setErrorMessage(
        "Payment amount must be greater than or equal to the total amount",
      );

      return;
    }

    try {
      setProcessingPayment(true);
      setErrorMessage("");

      const result = await CustomCakeCashierService.processPayment(
        selectedCake.request_id,
        paymentForm,
      );

      setSuccessMessage(
        `Payment processed successfully! Order #${result.order_id} created.`,
      );
      closePaymentModal();
      fetchApprovedCakes(); // Refresh list
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to process payment");
    } finally {
      setProcessingPayment(false);
    }
  };

  // Calculate change
  const calculateChange = () => {
    if (!selectedCake) return 0;

    return CustomCakeCashierService.calculateChange(
      paymentForm.amount_paid,
      selectedCake.approved_price,
    );
  };

  // Filter cakes by search term
  const filteredCakes = approvedCakes.filter((cake) => {
    const search = searchTerm.toLowerCase();

    return (
      cake.customer_name?.toLowerCase().includes(search) ||
      cake.customer_phone?.toLowerCase().includes(search) ||
      cake.request_id.toString().includes(search)
    );
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-rich-brown mb-2">
          Custom Cake Payments
        </h1>
        <p className="text-warm-brown">
          Process payments for approved custom cake orders
        </p>
      </div>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
            exit={{ opacity: 0, y: -20 }}
            initial={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-success-50 border-2 border-success">
              <CardBody className="flex flex-row items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-success" />
                <p className="text-success font-medium">{successMessage}</p>
              </CardBody>
            </Card>
          </motion.div>
        )}

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-warm-beige to-cream-white shadow-lg">
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rich-brown rounded-lg">
                <CakeIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-warm-brown">Awaiting Payment</p>
                <p className="text-2xl font-bold text-rich-brown">
                  {approvedCakes.length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-warm-beige to-cream-white shadow-lg">
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-success rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-warm-brown">Total Value</p>
                <p className="text-2xl font-bold text-rich-brown">
                  {CustomCakeCashierService.formatPrice(
                    approvedCakes.reduce(
                      (sum, cake) => sum + cake.approved_price,
                      0,
                    ),
                  )}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-warm-beige to-cream-white shadow-lg">
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-warning rounded-lg">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-warm-brown">Pickup This Week</p>
                <p className="text-2xl font-bold text-rich-brown">
                  {
                    approvedCakes.filter((cake) => {
                      const pickupDate = new Date(cake.scheduled_pickup_date);
                      const today = new Date();
                      const weekFromNow = new Date();

                      weekFromNow.setDate(today.getDate() + 7);

                      return pickupDate >= today && pickupDate <= weekFromNow;
                    }).length
                  }
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col gap-4 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-rich-brown">
                Approved Custom Cakes
              </h2>
              <p className="text-sm text-warm-brown mt-1">
                Ready for payment processing
              </p>
            </div>
            <Button
              color="primary"
              isLoading={loading}
              size="sm"
              onPress={fetchApprovedCakes}
            >
              Refresh
            </Button>
          </div>

          {/* Search Bar */}
          <div className="w-full md:w-96">
            <Input
              isClearable
              placeholder="Search by customer name, phone, or request ID..."
              startContent={
                <MagnifyingGlassIcon className="h-5 w-5 text-default-400" />
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm("")}
            />
          </div>
        </CardHeader>

        <Divider />

        <CardBody className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rich-brown mx-auto mb-4" />
                <p className="text-warm-brown">Loading approved cakes...</p>
              </div>
            </div>
          ) : filteredCakes.length === 0 ? (
            <div className="text-center py-12">
              <CakeIcon className="h-16 w-16 text-default-300 mx-auto mb-4" />
              <p className="text-lg text-warm-brown">
                {searchTerm
                  ? "No cakes found matching your search"
                  : "No approved cakes awaiting payment"}
              </p>
            </div>
          ) : (
            <Table aria-label="Approved custom cakes">
              <TableHeader>
                <TableColumn>REQUEST ID</TableColumn>
                <TableColumn>CUSTOMER</TableColumn>
                <TableColumn>DETAILS</TableColumn>
                <TableColumn>PICKUP DATE</TableColumn>
                <TableColumn>PRICE</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredCakes.map((cake) => (
                  <TableRow key={cake.request_id}>
                    <TableCell>
                      <Chip color="primary" size="sm" variant="flat">
                        #{cake.request_id}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-default-500" />
                          <span className="font-medium">
                            {cake.customer_name}
                          </span>
                        </div>
                        {cake.customer_phone && (
                          <div className="flex items-center gap-2 text-sm text-default-500">
                            <PhoneIcon className="h-3 w-3" />
                            <span>{cake.customer_phone}</span>
                          </div>
                        )}
                        {cake.customer_email && (
                          <div className="flex items-center gap-2 text-sm text-default-500">
                            <EnvelopeIcon className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">
                              {cake.customer_email}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {cake.num_layers} Layer Cake
                        </p>
                        <p className="text-sm text-default-500">
                          {cake.preparation_days} days prep
                        </p>
                        {cake.special_instructions && (
                          <p className="text-xs text-default-400 italic truncate max-w-[200px]">
                            {cake.special_instructions}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-default-500" />
                        <div>
                          <p className="font-medium">
                            {new Date(
                              cake.scheduled_pickup_date,
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                          {cake.scheduled_pickup_time && (
                            <p className="text-sm text-default-500">
                              {cake.scheduled_pickup_time}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-lg font-bold text-success">
                        {CustomCakeCashierService.formatPrice(
                          cake.approved_price,
                        )}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Button
                        color="success"
                        size="sm"
                        onPress={() => openPaymentModal(cake)}
                      >
                        Process Payment
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        scrollBehavior="inside"
        size="2xl"
        onClose={closePaymentModal}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-bold text-rich-brown">
              Process Payment
            </h3>
            <p className="text-sm text-warm-brown font-normal">
              Request #{selectedCake?.request_id} -{" "}
              {selectedCake?.customer_name}
            </p>
          </ModalHeader>
          <Divider />
          <ModalBody className="py-6">
            {selectedCake && (
              <div className="space-y-6">
                {/* Order Summary */}
                <Card className="bg-cream-white">
                  <CardBody>
                    <h4 className="font-bold text-rich-brown mb-3">
                      Order Summary
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-warm-brown">
                          Custom Cake ({selectedCake.num_layers} layers)
                        </span>
                        <span className="font-medium">
                          {CustomCakeCashierService.formatPrice(
                            selectedCake.approved_price,
                          )}
                        </span>
                      </div>
                      <Divider className="my-2" />
                      <div className="flex justify-between text-lg">
                        <span className="font-bold text-rich-brown">
                          Total Amount
                        </span>
                        <span className="font-bold text-success">
                          {CustomCakeCashierService.formatPrice(
                            selectedCake.approved_price,
                          )}
                        </span>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-rich-brown mb-2">
                    Payment Method
                  </label>
                  <Select
                    selectedKeys={[paymentForm.payment_method]}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        payment_method: e.target.value as any,
                      })
                    }
                  >
                    <SelectItem key="cash">Cash</SelectItem>
                    <SelectItem key="gcash">GCash</SelectItem>
                    <SelectItem key="maya">Maya</SelectItem>
                  </Select>
                </div>

                {/* Amount Paid */}
                <div>
                  <label className="block text-sm font-medium text-rich-brown mb-2">
                    Amount Paid
                  </label>
                  <Input
                    min={0}
                    startContent={<span className="text-default-400">₱</span>}
                    step={0.01}
                    type="number"
                    value={paymentForm.amount_paid.toString()}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        amount_paid: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                {/* Change Calculation */}
                {paymentForm.payment_method === "cash" &&
                  paymentForm.amount_paid > 0 && (
                    <Card className="bg-success-50 border-2 border-success">
                      <CardBody>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-success">
                            Change Due:
                          </span>
                          <span className="text-2xl font-bold text-success">
                            {CustomCakeCashierService.formatPrice(
                              calculateChange(),
                            )}
                          </span>
                        </div>
                      </CardBody>
                    </Card>
                  )}

                {/* Pickup Information */}
                <Card className="bg-warning-50 border-2 border-warning">
                  <CardBody>
                    <h4 className="font-bold text-warning mb-2">
                      Pickup Details
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-medium">Date:</span>{" "}
                        {new Date(
                          selectedCake.scheduled_pickup_date,
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      {selectedCake.scheduled_pickup_time && (
                        <p>
                          <span className="font-medium">Time:</span>{" "}
                          {selectedCake.scheduled_pickup_time}
                        </p>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}
          </ModalBody>
          <Divider />
          <ModalFooter>
            <Button
              isDisabled={processingPayment}
              variant="light"
              onPress={closePaymentModal}
            >
              Cancel
            </Button>
            <Button
              color="success"
              isDisabled={
                !selectedCake ||
                !CustomCakeCashierService.isValidPayment(
                  paymentForm.amount_paid,
                  selectedCake?.approved_price || 0,
                )
              }
              isLoading={processingPayment}
              onPress={handleProcessPayment}
            >
              {processingPayment ? "Processing..." : "Confirm Payment"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
