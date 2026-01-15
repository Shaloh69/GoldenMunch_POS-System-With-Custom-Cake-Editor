"use client";

import type { CustomCakeRequest } from "@/types/api";

import { useEffect, useState, useMemo } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
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
import { motion } from "framer-motion";
import {
  MagnifyingGlassIcon,
  CakeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

import {
  CustomCakeRequestService,
  type CustomCakeRequestDetails,
  type ApproveCustomCakeData,
  type RejectCustomCakeData,
} from "@/services/customCakeRequest.service";
import { MessagingPanel } from "@/components/MessagingPanel";
import { EmailComposer } from "@/components/EmailComposer";

// Stats Interface
interface CustomCakeStats {
  totalRequests: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  totalValue: number;
}

export default function CustomCakesPage() {
  // State Management
  const [requests, setRequests] = useState<CustomCakeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState<CustomCakeStats>({
    totalRequests: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0,
    totalValue: 0,
  });

  // Modal States
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveConfirmModal, setShowApproveConfirmModal] = useState(false);
  const [showRejectConfirmModal, setShowRejectConfirmModal] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<CustomCakeRequest | null>(null);
  const [requestDetails, setRequestDetails] =
    useState<CustomCakeRequestDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form States
  const [approveForm, setApproveForm] = useState<ApproveCustomCakeData>({
    approved_price: 0,
    preparation_days: 3,
    scheduled_pickup_date: "",
    scheduled_pickup_time: "10:00",
    admin_notes: "",
  });

  const [rejectForm, setRejectForm] = useState<RejectCustomCakeData>({
    rejection_reason: "",
    admin_notes: "",
  });

  // Initial Data Fetch
  useEffect(() => {
    fetchAllRequests();
  }, []);

  // Calculate Stats
  useEffect(() => {
    const pending = requests.filter(
      (r) => r.status === "pending_review",
    ).length;
    const approved = requests.filter((r) => r.status === "approved").length;
    const rejected = requests.filter((r) => r.status === "rejected").length;
    const totalValue = requests
      .filter((r) => r.estimated_price)
      .reduce((sum, r) => sum + parseFloat(String(r.estimated_price || 0)), 0);

    setStats({
      totalRequests: requests.length,
      pendingReview: pending,
      approved,
      rejected,
      totalValue,
    });
  }, [requests]);

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    const filtered = requests.filter((request) => {
      const search = searchTerm.toLowerCase();

      return (
        request.customer_name?.toLowerCase().includes(search) ||
        request.customer_email?.toLowerCase().includes(search) ||
        request.request_id?.toString().includes(search)
      );
    });

    // Sort by status: pending_review first, then approved, then completed/rejected last
    return filtered.sort((a, b) => {
      const statusOrder: { [key: string]: number } = {
        'pending_review': 1,
        'approved': 2,
        'completed': 3,
        'rejected': 4,
      };

      const orderA = statusOrder[a.status] || 5;
      const orderB = statusOrder[b.status] || 5;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // Secondary sort by submitted_at (newest first) within same status
      return new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime();
    });
  }, [requests, searchTerm]);

  // API Calls
  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      const data = await CustomCakeRequestService.getAllRequests();

      setRequests(data);
    } catch (error) {
      console.error("Failed to fetch custom cake requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequestDetails = async (requestId: number) => {
    try {
      setDetailsLoading(true);
      const details =
        await CustomCakeRequestService.getRequestDetails(requestId);

      setRequestDetails(details);
    } catch (error) {
      console.error("Failed to fetch request details:", error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewDetails = async (request: CustomCakeRequest) => {
    setSelectedRequest(request);
    await fetchRequestDetails(request.request_id);
    setShowDetailsModal(true);
  };

  const handleOpenApproveModal = (request: CustomCakeRequest) => {
    setSelectedRequest(request);
    setShowApproveConfirmModal(true);
  };

  const handleConfirmApprove = () => {
    setShowApproveConfirmModal(false);

    if (!selectedRequest) return;

    // Pre-fill form with estimated values
    const estimatedPrice = parseFloat(
      String(selectedRequest.estimated_price || 0),
    );
    const today = new Date();
    const pickupDate = new Date(today);

    pickupDate.setDate(pickupDate.getDate() + 3);

    setApproveForm({
      approved_price:
        estimatedPrice > 0
          ? estimatedPrice
          : CustomCakeRequestService.calculateEstimatedPrice(selectedRequest),
      preparation_days: 3,
      scheduled_pickup_date: pickupDate.toISOString().split("T")[0],
      scheduled_pickup_time: "10:00",
      admin_notes: "",
    });

    setShowApproveModal(true);
  };

  const handleOpenRejectModal = (request: CustomCakeRequest) => {
    setSelectedRequest(request);
    setShowRejectConfirmModal(true);
  };

  const handleConfirmReject = () => {
    setShowRejectConfirmModal(false);

    setRejectForm({
      rejection_reason: "",
      admin_notes: "",
    });
    setShowRejectModal(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      await CustomCakeRequestService.approveRequest(
        selectedRequest.request_id,
        approveForm,
      );
      setShowApproveModal(false);
      setSelectedRequest(null);
      await fetchAllRequests();
      alert("Custom cake request approved successfully!");
    } catch (error: any) {
      console.error("Failed to approve request:", error);
      alert(error?.response?.data?.message || "Failed to approve request");
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectForm.rejection_reason) {
      alert("Please provide a rejection reason");

      return;
    }

    try {
      await CustomCakeRequestService.rejectRequest(
        selectedRequest.request_id,
        rejectForm,
      );
      setShowRejectModal(false);
      setSelectedRequest(null);
      await fetchAllRequests();
      alert("Custom cake request rejected");
    } catch (error: any) {
      console.error("Failed to reject request:", error);
      alert(error?.response?.data?.message || "Failed to reject request");
    }
  };

  // Format Functions
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl">
            <CakeIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Custom Cake Requests
            </h1>
            <p className="text-gray-600">
              Review and manage custom cake orders
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.1 }}
      >
        {/* Total Requests */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Requests</p>
                <p className="text-2xl font-bold text-blue-700">
                  {stats.totalRequests}
                </p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <CakeIcon className="w-6 h-6 text-blue-700" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Pending Review */}
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-none">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Review</p>
                <p className="text-2xl font-bold text-amber-700">
                  {stats.pendingReview}
                </p>
              </div>
              <div className="p-3 bg-amber-200 rounded-full">
                <ClockIcon className="w-6 h-6 text-amber-700" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Approved */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Approved</p>
                <p className="text-2xl font-bold text-green-700">
                  {stats.approved}
                </p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <CheckCircleIcon className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Rejected */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-none">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Rejected</p>
                <p className="text-2xl font-bold text-red-700">
                  {stats.rejected}
                </p>
              </div>
              <div className="p-3 bg-red-200 rounded-full">
                <XCircleIcon className="w-6 h-6 text-red-700" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Total Value */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-none">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Value</p>
                <p className="text-2xl font-bold text-purple-700">
                  ₱{Number(stats.totalValue || 0).toFixed(0)}
                </p>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <CurrencyDollarIcon className="w-6 h-6 text-purple-700" />
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        animate={{ opacity: 1 }}
        className="mb-6"
        initial={{ opacity: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardBody className="p-4">
            <div className="flex gap-4 items-center">
              <Input
                className="flex-1"
                placeholder="Search by customer name, email, or ID..."
                startContent={
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button
                color="primary"
                isLoading={loading}
                variant="flat"
                onClick={fetchAllRequests}
              >
                Refresh
              </Button>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Requests Table */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardBody className="p-0">
            <Table aria-label="Custom cake requests table">
              <TableHeader>
                <TableColumn>ID</TableColumn>
                <TableColumn>CUSTOMER</TableColumn>
                <TableColumn>DETAILS</TableColumn>
                <TableColumn>SUBMITTED</TableColumn>
                <TableColumn>ESTIMATED PRICE</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody
                emptyContent="No custom cake requests found"
                isLoading={loading}
                items={filteredRequests}
              >
                {(request) => (
                  <TableRow key={request.request_id}>
                    <TableCell>
                      <span className="font-mono text-sm">
                        #{request.request_id}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {request.customer_name || "N/A"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {request.customer_email || "N/A"}
                        </p>
                        {request.customer_phone && (
                          <p className="text-xs text-gray-400">
                            {request.customer_phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">
                            {request.num_layers}
                          </span>{" "}
                          layer(s)
                        </p>
                        {request.theme_id && (
                          <Chip color="secondary" size="sm" variant="flat">
                            Themed
                          </Chip>
                        )}
                        {request.cake_text && (
                          <Chip color="primary" size="sm" variant="flat">
                            Custom Text
                          </Chip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {formatDate(request.submitted_at)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">
                        {CustomCakeRequestService.formatPrice(
                          parseFloat(String(request.estimated_price || 0)),
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={
                          CustomCakeRequestService.getStatusColor(
                            request.status,
                          ) as any
                        }
                        size="sm"
                        variant="flat"
                      >
                        {CustomCakeRequestService.getStatusLabel(
                          request.status,
                        )}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          isIconOnly
                          color="default"
                          size="sm"
                          variant="flat"
                          className="min-w-[62px] px-2"
                          onClick={() => handleViewDetails(request)}
                        >
                          <EyeIcon className="w-4 h-4" /> View
                        </Button>
                        {request.status === "pending_review" && (
                          <>
                            <Button
                              isIconOnly
                              color="success"
                              size="sm"
                              variant="flat"
                              onClick={() => handleOpenApproveModal(request)}
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              isIconOnly
                              color="danger"
                              size="sm"
                              variant="flat"
                              onClick={() => handleOpenRejectModal(request)}
                            >
                              <XCircleIcon className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </motion.div>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        scrollBehavior="inside"
        size="3xl"
        onClose={() => setShowDetailsModal(false)}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-amber-500" />
              <span>Custom Cake Request Details</span>
            </div>
          </ModalHeader>
          <ModalBody>
            {detailsLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500" />
              </div>
            ) : requestDetails ? (
              <div className="space-y-6">
                {/* Customer Info */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">
                        {requestDetails.request.customer_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">
                        {requestDetails.request.customer_email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">
                        {requestDetails.request.customer_phone || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Event Type</p>
                      <p className="font-medium">
                        {requestDetails.request.event_type || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Cake Details */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Cake Configuration
                  </h3>
                  <div className="space-y-2">
                    <p>
                      <span className="text-gray-500">Layers:</span>{" "}
                      <span className="font-medium">
                        {requestDetails.request.num_layers}
                      </span>
                    </p>
                    {requestDetails.layers.map((layer, idx) => (
                      <div
                        key={idx}
                        className="pl-4 border-l-2 border-amber-200"
                      >
                        <p className="text-sm font-medium">
                          Layer {layer.layer_number}
                        </p>
                        <p className="text-sm text-gray-600">
                          {layer.flavor_name || "No flavor"} •{" "}
                          {layer.size_name || "No size"} ({layer.diameter_cm}cm)
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <Divider />

                {/* Decorations */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Decorations</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Frosting Type</p>
                      <p className="font-medium capitalize">
                        {requestDetails.request.frosting_type?.replace(
                          "_",
                          " ",
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Frosting Color</p>
                      <p className="font-medium">
                        {requestDetails.request.frosting_color || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Candles</p>
                      <p className="font-medium">
                        {requestDetails.request.candles_count} (
                        {requestDetails.request.candle_type})
                      </p>
                    </div>
                    {requestDetails.request.cake_text && (
                      <div>
                        <p className="text-sm text-gray-500">Cake Text</p>
                        <p className="font-medium">
                          {requestDetails.request.cake_text}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Special Instructions */}
                {requestDetails.request.special_instructions && (
                  <>
                    <Divider />
                    <div>
                      <h3 className="font-semibold text-lg mb-2">
                        Special Instructions
                      </h3>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {requestDetails.request.special_instructions}
                      </p>
                    </div>
                  </>
                )}

                {/* Dietary Restrictions */}
                {requestDetails.request.dietary_restrictions && (
                  <>
                    <Divider />
                    <div>
                      <h3 className="font-semibold text-lg mb-2">
                        Dietary Restrictions
                      </h3>
                      <p className="text-gray-700 bg-amber-50 p-3 rounded-lg border-2 border-amber-200">
                        {requestDetails.request.dietary_restrictions}
                      </p>
                    </div>
                  </>
                )}

                {/* Reference Image */}
                {requestDetails.request.reference_image && (
                  <>
                    <Divider />
                    <div>
                      <h3 className="font-semibold text-lg mb-3">
                        Customer Reference Image
                      </h3>
                      <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
                        <p className="text-sm text-amber-800 mb-3 font-medium">
                          📸 Customer provided this reference image for design
                          inspiration
                        </p>
                        <img
                          alt="Customer reference design"
                          className="max-w-full max-h-96 rounded-lg shadow-lg border-2 border-amber-300 mx-auto"
                          src={requestDetails.request.reference_image}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* 3D Preview Images */}
                {requestDetails.images.length > 0 && (
                  <>
                    <Divider />
                    <div>
                      <h3 className="font-semibold text-lg mb-3">
                        3D Preview Images
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        {requestDetails.images.map((img) => (
                          <div key={img.image_id} className="relative group">
                            <img
                              alt={`${img.view_angle} view`}
                              className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                              src={img.image_url}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "/placeholder-cake.png";
                                (e.target as HTMLImageElement).alt =
                                  "Image not available";
                              }}
                            />
                            <div className="absolute bottom-2 left-2 right-2">
                              <Chip
                                className="bg-black/70 text-white"
                                size="sm"
                                variant="solid"
                              >
                                {img.view_angle}
                              </Chip>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Pricing */}
                <Divider />
                <div className="space-y-3">
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">
                        Estimated Price
                      </span>
                      <span className="text-2xl font-bold text-amber-600">
                        {CustomCakeRequestService.formatPrice(
                          parseFloat(
                            String(requestDetails.request.estimated_price || 0),
                          ),
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Final Price (if approved) */}
                  {requestDetails.request.approved_price && (
                    <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-green-800">
                          Final Price (Approved)
                        </span>
                        <span className="text-2xl font-bold text-green-700">
                          {CustomCakeRequestService.formatPrice(
                            parseFloat(
                              String(requestDetails.request.approved_price),
                            ),
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Scheduled Pickup (if approved) */}
                  {requestDetails.request.scheduled_pickup_date && (
                    <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                      <h4 className="font-semibold text-blue-800 mb-2">
                        Scheduled Pickup
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Date</p>
                          <p className="font-medium text-blue-700">
                            {new Date(
                              requestDetails.request.scheduled_pickup_date,
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        {requestDetails.request.scheduled_pickup_time && (
                          <div>
                            <p className="text-sm text-gray-600">Time</p>
                            <p className="font-medium text-blue-700">
                              {requestDetails.request.scheduled_pickup_time}
                            </p>
                          </div>
                        )}
                      </div>
                      {requestDetails.request.preparation_days && (
                        <p className="text-sm text-gray-600 mt-2">
                          Preparation time:{" "}
                          {requestDetails.request.preparation_days} day(s)
                        </p>
                      )}
                    </div>
                  )}

                  {/* Admin Notes (if any) */}
                  {requestDetails.request.admin_notes && (
                    <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-300">
                      <h4 className="font-semibold text-purple-800 mb-2">
                        Admin Notes
                      </h4>
                      <p className="text-gray-700">
                        {requestDetails.request.admin_notes}
                      </p>
                    </div>
                  )}

                  {/* Rejection Reason (if rejected) */}
                  {requestDetails.request.rejection_reason && (
                    <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
                      <h4 className="font-semibold text-red-800 mb-2">
                        Rejection Reason
                      </h4>
                      <p className="text-gray-700">
                        {requestDetails.request.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Messaging Panel */}
                <Divider className="my-6" />
                <div className="mt-6">
                  <MessagingPanel
                    requestId={requestDetails.request.request_id}
                    customerName={requestDetails.request.customer_name}
                  />
                </div>
              </div>
            ) : (
              <p>No details available</p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setShowDetailsModal(false)}>
              Close
            </Button>
            {requestDetails && (
              <Button
                color="primary"
                startContent={<EnvelopeIcon className="w-4 h-4" />}
                onPress={() => setShowEmailComposer(true)}
              >
                Send Email
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Email Composer Modal */}
      <EmailComposer
        defaultCustomerName={selectedRequest?.customer_name}
        defaultRecipient={selectedRequest?.customer_email}
        defaultRequestId={selectedRequest?.request_id}
        isOpen={showEmailComposer}
        onClose={() => setShowEmailComposer(false)}
        onEmailSent={() => {
          alert("Email sent successfully!");
        }}
      />

      {/* Approve Modal */}
      <Modal
        isOpen={showApproveModal}
        size="2xl"
        onClose={() => setShowApproveModal(false)}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-6 h-6 text-green-500" />
              <span>Approve Custom Cake Request</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {/* Estimated vs Final Price Info */}
              {selectedRequest && selectedRequest.estimated_price && (
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800">
                    <span className="font-semibold">Estimated Price:</span>{" "}
                    {CustomCakeRequestService.formatPrice(
                      parseFloat(String(selectedRequest.estimated_price)),
                    )}
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    You can adjust the final price below. This is what the
                    customer will pay.
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Final Price (₱) <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  This is the final amount the customer will be charged
                </p>
                <Input
                  errorMessage={
                    approveForm.approved_price <= 0
                      ? "Price must be greater than 0"
                      : ""
                  }
                  isInvalid={approveForm.approved_price <= 0}
                  min="0"
                  startContent={
                    <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
                  }
                  step="0.01"
                  type="number"
                  value={approveForm.approved_price.toString()}
                  onChange={(e) =>
                    setApproveForm({
                      ...approveForm,
                      approved_price: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Preparation Days
                </label>
                <Input
                  type="number"
                  value={approveForm.preparation_days.toString()}
                  onChange={(e) =>
                    setApproveForm({
                      ...approveForm,
                      preparation_days: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Pickup Date
                  </label>
                  <Input
                    type="date"
                    value={approveForm.scheduled_pickup_date}
                    onChange={(e) =>
                      setApproveForm({
                        ...approveForm,
                        scheduled_pickup_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Pickup Time
                  </label>
                  <Input
                    type="time"
                    value={approveForm.scheduled_pickup_time}
                    onChange={(e) =>
                      setApproveForm({
                        ...approveForm,
                        scheduled_pickup_time: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Admin Notes (Optional)
                </label>
                <Textarea
                  placeholder="Add any notes for the customer..."
                  rows={3}
                  value={approveForm.admin_notes}
                  onChange={(e) =>
                    setApproveForm({
                      ...approveForm,
                      admin_notes: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setShowApproveModal(false)}>
              Cancel
            </Button>
            <Button color="success" onPress={handleApprove}>
              Approve Request
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)}>
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <XCircleIcon className="w-6 h-6 text-red-500" />
              <span>Reject Custom Cake Request</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Rejection Reason *
                </label>
                <Textarea
                  required
                  placeholder="Explain why this request is being rejected..."
                  rows={4}
                  value={rejectForm.rejection_reason}
                  onChange={(e) =>
                    setRejectForm({
                      ...rejectForm,
                      rejection_reason: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Admin Notes (Optional)
                </label>
                <Textarea
                  placeholder="Add internal notes..."
                  rows={2}
                  value={rejectForm.admin_notes}
                  onChange={(e) =>
                    setRejectForm({
                      ...rejectForm,
                      admin_notes: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleReject}>
              Reject Request
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Approve Confirmation Modal */}
      <Modal
        isOpen={showApproveConfirmModal}
        size="md"
        onClose={() => setShowApproveConfirmModal(false)}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-6 h-6 text-amber-500" />
              <span>Customer Contact Confirmation</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
                <p className="text-amber-900 font-medium mb-2">
                  ⚠️ Before approving this request:
                </p>
                <p className="text-amber-800 text-sm">
                  Have you contacted the customer to discuss their custom cake
                  design, confirm availability, and verify the final details?
                </p>
              </div>

              {selectedRequest && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    Customer Contact Info:
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Name:</span>{" "}
                    {selectedRequest.customer_name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Email:</span>{" "}
                    {selectedRequest.customer_email}
                  </p>
                  {selectedRequest.customer_phone && (
                    <p className="text-sm">
                      <span className="font-medium">Phone:</span>{" "}
                      {selectedRequest.customer_phone}
                    </p>
                  )}
                </div>
              )}

              <p className="text-sm text-gray-600">
                Clicking "Yes, Continue" will allow you to set the final price
                and schedule.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => setShowApproveConfirmModal(false)}
            >
              No, Go Back
            </Button>
            <Button color="success" onPress={handleConfirmApprove}>
              Yes, Continue to Approve
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Reject Confirmation Modal */}
      <Modal
        isOpen={showRejectConfirmModal}
        size="md"
        onClose={() => setShowRejectConfirmModal(false)}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <XCircleIcon className="w-6 h-6 text-red-500" />
              <span>Confirm Rejection</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
                <p className="text-red-900 font-medium mb-2">
                  ⚠️ You are about to reject this custom cake request
                </p>
                <p className="text-red-800 text-sm">
                  This action will notify the customer that their request cannot
                  be fulfilled. Please make sure you have a clear reason for
                  rejection.
                </p>
              </div>

              {selectedRequest && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Request Details:</p>
                  <p className="text-sm">
                    <span className="font-medium">Customer:</span>{" "}
                    {selectedRequest.customer_name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Layers:</span>{" "}
                    {selectedRequest.num_layers}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Estimated Price:</span>{" "}
                    {CustomCakeRequestService.formatPrice(
                      parseFloat(String(selectedRequest.estimated_price || 0)),
                    )}
                  </p>
                </div>
              )}

              <p className="text-sm text-gray-600">
                Clicking "Yes, Continue" will allow you to provide a rejection
                reason.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => setShowRejectConfirmModal(false)}
            >
              No, Go Back
            </Button>
            <Button color="danger" onPress={handleConfirmReject}>
              Yes, Continue to Reject
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
