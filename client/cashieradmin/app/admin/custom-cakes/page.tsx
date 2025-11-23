'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Textarea } from '@heroui/input';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from '@heroui/table';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Chip } from '@heroui/chip';
import { Badge } from '@heroui/badge';
import { Divider } from '@heroui/divider';
import { CustomCakeRequestService, type CustomCakeRequestDetails, type ApproveCustomCakeData, type RejectCustomCakeData } from '@/services/customCakeRequest.service';
import type { CustomCakeRequest } from '@/types/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  CakeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

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
  const [searchTerm, setSearchTerm] = useState('');
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
  const [selectedRequest, setSelectedRequest] = useState<CustomCakeRequest | null>(null);
  const [requestDetails, setRequestDetails] = useState<CustomCakeRequestDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form States
  const [approveForm, setApproveForm] = useState<ApproveCustomCakeData>({
    approved_price: 0,
    preparation_days: 3,
    scheduled_pickup_date: '',
    scheduled_pickup_time: '10:00',
    admin_notes: '',
  });

  const [rejectForm, setRejectForm] = useState<RejectCustomCakeData>({
    rejection_reason: '',
    admin_notes: '',
  });

  // Initial Data Fetch
  useEffect(() => {
    fetchPendingRequests();
  }, []);

  // Calculate Stats
  useEffect(() => {
    const pending = requests.filter(r => r.status === 'pending_review').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;
    const totalValue = requests
      .filter(r => r.estimated_price)
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
    return requests.filter(request => {
      const search = searchTerm.toLowerCase();
      return (
        request.customer_name?.toLowerCase().includes(search) ||
        request.customer_email?.toLowerCase().includes(search) ||
        request.request_id?.toString().includes(search)
      );
    });
  }, [requests, searchTerm]);

  // API Calls
  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const data = await CustomCakeRequestService.getPendingRequests();
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequestDetails = async (requestId: number) => {
    try {
      setDetailsLoading(true);
      const details = await CustomCakeRequestService.getRequestDetails(requestId);
      setRequestDetails(details);
    } catch (error) {
      console.error('Failed to fetch request details:', error);
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

    // Pre-fill form with estimated values
    const estimatedPrice = parseFloat(String(request.estimated_price || 0));
    const today = new Date();
    const pickupDate = new Date(today);
    pickupDate.setDate(pickupDate.getDate() + 3);

    setApproveForm({
      approved_price: estimatedPrice > 0 ? estimatedPrice : CustomCakeRequestService.calculateEstimatedPrice(request),
      preparation_days: 3,
      scheduled_pickup_date: pickupDate.toISOString().split('T')[0],
      scheduled_pickup_time: '10:00',
      admin_notes: '',
    });

    setShowApproveModal(true);
  };

  const handleOpenRejectModal = (request: CustomCakeRequest) => {
    setSelectedRequest(request);
    setRejectForm({
      rejection_reason: '',
      admin_notes: '',
    });
    setShowRejectModal(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      await CustomCakeRequestService.approveRequest(selectedRequest.request_id, approveForm);
      setShowApproveModal(false);
      setSelectedRequest(null);
      await fetchPendingRequests();
      alert('Custom cake request approved successfully!');
    } catch (error: any) {
      console.error('Failed to approve request:', error);
      alert(error?.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectForm.rejection_reason) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      await CustomCakeRequestService.rejectRequest(selectedRequest.request_id, rejectForm);
      setShowRejectModal(false);
      setSelectedRequest(null);
      await fetchPendingRequests();
      alert('Custom cake request rejected');
    } catch (error: any) {
      console.error('Failed to reject request:', error);
      alert(error?.response?.data?.message || 'Failed to reject request');
    }
  };

  // Format Functions
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl">
            <CakeIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Custom Cake Requests</h1>
            <p className="text-gray-600">Review and manage custom cake orders</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6"
      >
        {/* Total Requests */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Requests</p>
                <p className="text-2xl font-bold text-blue-700">{stats.totalRequests}</p>
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
                <p className="text-2xl font-bold text-amber-700">{stats.pendingReview}</p>
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
                <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
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
                <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
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
                  ₱{stats.totalValue.toFixed(0)}
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <Card>
          <CardBody className="p-4">
            <div className="flex gap-4 items-center">
              <Input
                placeholder="Search by customer name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startContent={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />}
                className="flex-1"
              />
              <Button
                color="primary"
                variant="flat"
                onClick={fetchPendingRequests}
                isLoading={loading}
              >
                Refresh
              </Button>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Requests Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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
                items={filteredRequests}
                isLoading={loading}
                emptyContent="No custom cake requests found"
              >
                {(request) => (
                  <TableRow key={request.request_id}>
                    <TableCell>
                      <span className="font-mono text-sm">#{request.request_id}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.customer_name || 'N/A'}</p>
                        <p className="text-sm text-gray-500">{request.customer_email || 'N/A'}</p>
                        {request.customer_phone && (
                          <p className="text-xs text-gray-400">{request.customer_phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">{request.num_layers}</span> layer(s)
                        </p>
                        {request.theme_id && (
                          <Chip size="sm" variant="flat" color="secondary">
                            Themed
                          </Chip>
                        )}
                        {request.cake_text && (
                          <Chip size="sm" variant="flat" color="primary">
                            Custom Text
                          </Chip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{formatDate(request.submitted_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">
                        {CustomCakeRequestService.formatPrice(
                          parseFloat(String(request.estimated_price || 0))
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={CustomCakeRequestService.getStatusColor(request.status) as any}
                        variant="flat"
                      >
                        {CustomCakeRequestService.getStatusLabel(request.status)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          color="default"
                          isIconOnly
                          onClick={() => handleViewDetails(request)}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        {request.status === 'pending_review' && (
                          <>
                            <Button
                              size="sm"
                              variant="flat"
                              color="success"
                              isIconOnly
                              onClick={() => handleOpenApproveModal(request)}
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="flat"
                              color="danger"
                              isIconOnly
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
        onClose={() => setShowDetailsModal(false)}
        size="3xl"
        scrollBehavior="inside"
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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
              </div>
            ) : requestDetails ? (
              <div className="space-y-6">
                {/* Customer Info */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{requestDetails.request.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{requestDetails.request.customer_email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{requestDetails.request.customer_phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Event Type</p>
                      <p className="font-medium">{requestDetails.request.event_type || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Cake Details */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Cake Configuration</h3>
                  <div className="space-y-2">
                    <p><span className="text-gray-500">Layers:</span> <span className="font-medium">{requestDetails.request.num_layers}</span></p>
                    {requestDetails.layers.map((layer, idx) => (
                      <div key={idx} className="pl-4 border-l-2 border-amber-200">
                        <p className="text-sm font-medium">Layer {layer.layer_number}</p>
                        <p className="text-sm text-gray-600">
                          {layer.flavor_name || 'No flavor'} • {layer.size_name || 'No size'} ({layer.diameter_cm}cm)
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
                      <p className="font-medium capitalize">{requestDetails.request.frosting_type?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Frosting Color</p>
                      <p className="font-medium">{requestDetails.request.frosting_color || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Candles</p>
                      <p className="font-medium">{requestDetails.request.candles_count} ({requestDetails.request.candle_type})</p>
                    </div>
                    {requestDetails.request.cake_text && (
                      <div>
                        <p className="text-sm text-gray-500">Cake Text</p>
                        <p className="font-medium">{requestDetails.request.cake_text}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Special Instructions */}
                {requestDetails.request.special_instructions && (
                  <>
                    <Divider />
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Special Instructions</h3>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {requestDetails.request.special_instructions}
                      </p>
                    </div>
                  </>
                )}

                {/* Images */}
                {requestDetails.images.length > 0 && (
                  <>
                    <Divider />
                    <div>
                      <h3 className="font-semibold text-lg mb-3">3D Preview Images</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {requestDetails.images.map((img) => (
                          <div key={img.image_id} className="relative group">
                            <img
                              src={img.image_url}
                              alt={`${img.view_angle} view`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <div className="absolute bottom-2 left-2 right-2">
                              <Chip size="sm" variant="solid" className="bg-black/70 text-white">
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
                <div className="bg-amber-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Estimated Price</span>
                    <span className="text-2xl font-bold text-amber-600">
                      {CustomCakeRequestService.formatPrice(
                        parseFloat(String(requestDetails.request.estimated_price || 0))
                      )}
                    </span>
                  </div>
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
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Approve Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        size="2xl"
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
              <div>
                <label className="text-sm font-medium mb-2 block">Approved Price (₱)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={approveForm.approved_price.toString()}
                  onChange={(e) => setApproveForm({ ...approveForm, approved_price: parseFloat(e.target.value) })}
                  startContent={<CurrencyDollarIcon className="w-4 h-4 text-gray-400" />}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Preparation Days</label>
                <Input
                  type="number"
                  value={approveForm.preparation_days.toString()}
                  onChange={(e) => setApproveForm({ ...approveForm, preparation_days: parseInt(e.target.value) })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Pickup Date</label>
                  <Input
                    type="date"
                    value={approveForm.scheduled_pickup_date}
                    onChange={(e) => setApproveForm({ ...approveForm, scheduled_pickup_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Pickup Time</label>
                  <Input
                    type="time"
                    value={approveForm.scheduled_pickup_time}
                    onChange={(e) => setApproveForm({ ...approveForm, scheduled_pickup_time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Admin Notes (Optional)</label>
                <Textarea
                  placeholder="Add any notes for the customer..."
                  value={approveForm.admin_notes}
                  onChange={(e) => setApproveForm({ ...approveForm, admin_notes: e.target.value })}
                  rows={3}
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
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
      >
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
                <label className="text-sm font-medium mb-2 block">Rejection Reason *</label>
                <Textarea
                  placeholder="Explain why this request is being rejected..."
                  value={rejectForm.rejection_reason}
                  onChange={(e) => setRejectForm({ ...rejectForm, rejection_reason: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Admin Notes (Optional)</label>
                <Textarea
                  placeholder="Add internal notes..."
                  value={rejectForm.admin_notes}
                  onChange={(e) => setRejectForm({ ...rejectForm, admin_notes: e.target.value })}
                  rows={2}
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
    </div>
  );
}
