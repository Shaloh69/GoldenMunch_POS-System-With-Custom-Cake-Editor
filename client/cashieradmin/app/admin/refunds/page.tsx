'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from '@heroui/table';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Select, SelectItem } from '@heroui/select';
import { RefundService } from '@/services/refund.service';
import type { RefundRequest } from '@/types/api';
import { RefundStatus, RefundMethod } from '@/types/api';
import {
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

// Types
interface RefundStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalAmount: number;
}

export default function RefundsPage() {
  // State Management
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [stats, setStats] = useState<RefundStats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    totalAmount: 0,
  });

  // Modal States
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [completeForm, setCompleteForm] = useState({
    refund_method: RefundMethod.CASH,
    refund_reference: '',
  });

  // Initial Data Fetch
  useEffect(() => {
    fetchRefunds();
  }, [statusFilter]);

  // Calculate Stats
  useEffect(() => {
    const pending = refunds.filter(r => r.refund_status === RefundStatus.PENDING).length;
    const approved = refunds.filter(r => r.refund_status === RefundStatus.APPROVED).length;
    const rejected = refunds.filter(r => r.refund_status === RefundStatus.REJECTED).length;
    const totalAmount = refunds.reduce((sum, r) => sum + r.refund_amount, 0);

    setStats({
      totalRequests: refunds.length,
      pendingRequests: pending,
      approvedRequests: approved,
      rejectedRequests: rejected,
      totalAmount,
    });
  }, [refunds]);

  // API Calls
  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;

      const response = await RefundService.getAllRefunds(params);
      if (response.success) {
        setRefunds(Array.isArray(response.data) ? response.data : []);
      } else {
        console.error('Failed to fetch refunds:', response.message);
      }
    } catch (error) {
      console.error('Failed to fetch refunds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRefund = async () => {
    if (!selectedRefund) return;

    try {
      const response = await RefundService.approveRefund(selectedRefund.refund_id);
      if (response.success) {
        setShowApproveModal(false);
        setSelectedRefund(null);
        fetchRefunds();
      } else {
        console.error('Failed to approve refund:', response.message);
      }
    } catch (error) {
      console.error('Failed to approve refund:', error);
    }
  };

  const handleRejectRefund = async () => {
    if (!selectedRefund) return;

    try {
      const response = await RefundService.rejectRefund(selectedRefund.refund_id, rejectReason);
      if (response.success) {
        setShowRejectModal(false);
        setSelectedRefund(null);
        setRejectReason('');
        fetchRefunds();
      } else {
        console.error('Failed to reject refund:', response.message);
      }
    } catch (error) {
      console.error('Failed to reject refund:', error);
    }
  };

  const handleCompleteRefund = async () => {
    if (!selectedRefund) return;

    try {
      const response = await RefundService.completeRefund(selectedRefund.refund_id, completeForm);
      if (response.success) {
        setShowCompleteModal(false);
        setSelectedRefund(null);
        setCompleteForm({ refund_method: RefundMethod.CASH, refund_reference: '' });
        fetchRefunds();
      } else {
        console.error('Failed to complete refund:', response.message);
      }
    } catch (error) {
      console.error('Failed to complete refund:', error);
    }
  };

  // Modal Handlers
  const openApproveModal = (refund: RefundRequest) => {
    setSelectedRefund(refund);
    setShowApproveModal(true);
  };

  const openRejectModal = (refund: RefundRequest) => {
    setSelectedRefund(refund);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const openCompleteModal = (refund: RefundRequest) => {
    setSelectedRefund(refund);
    setCompleteForm({ refund_method: RefundMethod.CASH, refund_reference: '' });
    setShowCompleteModal(true);
  };

  // Filtering
  const filteredRefunds = refunds.filter(refund =>
    refund.order?.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    refund.detailed_reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper Functions
  const formatCurrency = (value: number) => {
    return `₱${parseFloat(value.toString()).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-PH');
  };

  const getStatusColor = (status: RefundStatus) => {
    const colors: Record<RefundStatus, string> = {
      [RefundStatus.PENDING]: 'bg-warning/10 text-warning',
      [RefundStatus.APPROVED]: 'bg-primary/10 text-primary',
      [RefundStatus.REJECTED]: 'bg-danger/10 text-danger',
      [RefundStatus.COMPLETED]: 'bg-success/10 text-success',
    };
    return colors[status] || 'bg-default-100';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Refunds Management</h1>
          <p className="text-default-500 mt-1">Review and process refund requests</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-default-500">Total Requests</p>
                <p className="text-2xl font-bold">{stats.totalRequests}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-warning/10 rounded-lg">
                <ClockIcon className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-default-500">Pending</p>
                <p className="text-2xl font-bold">{stats.pendingRequests}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-success/10 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-default-500">Approved</p>
                <p className="text-2xl font-bold">{stats.approvedRequests}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-danger/10 rounded-lg">
                <XCircleIcon className="h-6 w-6 text-danger" />
              </div>
              <div>
                <p className="text-sm text-default-500">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejectedRequests}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-secondary/10 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-default-500">Total Amount</p>
                <p className="text-lg font-bold">{formatCurrency(stats.totalAmount)}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search by order number or reason..."
          value={searchTerm}
          onValueChange={setSearchTerm}
          startContent={<MagnifyingGlassIcon className="h-5 w-5 text-default-400" />}
          className="max-w-md"
        />

        <Select
          label="Filter by Status"
          placeholder="All statuses"
          selectedKeys={statusFilter ? [statusFilter] : []}
          onSelectionChange={(keys) => {
            setStatusFilter(Array.from(keys)[0] as string || '');
          }}
          className="max-w-xs"
        >
          <SelectItem key="" value="">All Statuses</SelectItem>
          <SelectItem key={RefundStatus.PENDING} value={RefundStatus.PENDING}>
            Pending
          </SelectItem>
          <SelectItem key={RefundStatus.APPROVED} value={RefundStatus.APPROVED}>
            Approved
          </SelectItem>
          <SelectItem key={RefundStatus.REJECTED} value={RefundStatus.REJECTED}>
            Rejected
          </SelectItem>
          <SelectItem key={RefundStatus.COMPLETED} value={RefundStatus.COMPLETED}>
            Completed
          </SelectItem>
        </Select>

        {statusFilter && (
          <Button
            variant="flat"
            onPress={() => setStatusFilter('')}
          >
            Clear Filter
          </Button>
        )}
      </div>

      {/* Refunds Table */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold">Refund Requests</h3>
        </CardHeader>
        <CardBody>
          {loading ? (
            <p>Loading refund requests...</p>
          ) : (
            <Table aria-label="Refund requests list">
              <TableHeader>
                <TableColumn>ORDER #</TableColumn>
                <TableColumn>TYPE</TableColumn>
                <TableColumn>AMOUNT</TableColumn>
                <TableColumn>REASON</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>REQUESTED BY</TableColumn>
                <TableColumn>REQUESTED AT</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No refund requests found">
                {filteredRefunds.map((refund) => (
                  <TableRow key={refund.refund_id}>
                    <TableCell>
                      <span className="font-mono font-semibold">
                        {refund.order?.order_number || `#${refund.order_id}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-sm">
                        {refund.refund_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-danger">
                        {formatCurrency(refund.refund_amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col max-w-xs">
                        <span className="text-sm font-semibold capitalize">
                          {refund.refund_reason.replace(/_/g, ' ')}
                        </span>
                        {refund.detailed_reason && (
                          <span className="text-xs text-default-400 truncate">
                            {refund.detailed_reason}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(refund.refund_status)}`}
                      >
                        {refund.refund_status.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {refund.cashier ? (
                        <div className="flex flex-col">
                          <span className="text-sm">{refund.cashier.name}</span>
                          <span className="text-xs text-default-400">
                            {refund.cashier.cashier_code}
                          </span>
                        </div>
                      ) : (
                        <span className="text-default-400 text-sm">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-default-400">
                        {formatDateTime(refund.requested_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {refund.refund_status === RefundStatus.PENDING && (
                          <>
                            <Button
                              size="sm"
                              color="success"
                              onPress={() => openApproveModal(refund)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              color="danger"
                              onPress={() => openRejectModal(refund)}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {refund.refund_status === RefundStatus.APPROVED && (
                          <Button
                            size="sm"
                            color="primary"
                            onPress={() => openCompleteModal(refund)}
                          >
                            Complete
                          </Button>
                        )}
                        {refund.refund_status === RefundStatus.REJECTED && refund.rejected_reason && (
                          <span className="text-xs text-danger">{refund.rejected_reason}</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Approve Refund Modal */}
      <Modal isOpen={showApproveModal} onClose={() => setShowApproveModal(false)}>
        <ModalContent>
          <ModalHeader>Approve Refund</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to approve the refund for order{' '}
              <span className="font-bold">{selectedRefund?.order?.order_number}</span>?
            </p>
            <div className="mt-4 p-4 bg-default-50 rounded-lg space-y-2">
              <p className="text-sm">
                <span className="font-semibold">Amount:</span> {formatCurrency(selectedRefund?.refund_amount || 0)}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Type:</span> {selectedRefund?.refund_type}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Reason:</span> {selectedRefund?.refund_reason.replace(/_/g, ' ')}
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowApproveModal(false)}>
              Cancel
            </Button>
            <Button color="success" onPress={handleApproveRefund}>
              Approve Refund
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Reject Refund Modal */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)}>
        <ModalContent>
          <ModalHeader>Reject Refund</ModalHeader>
          <ModalBody>
            <p className="mb-4">
              Please provide a reason for rejecting the refund for order{' '}
              <span className="font-bold">{selectedRefund?.order?.order_number}</span>:
            </p>
            <Input
              label="Rejection Reason"
              placeholder="Enter reason for rejection"
              value={rejectReason}
              onValueChange={setRejectReason}
              isRequired
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleRejectRefund} isDisabled={!rejectReason}>
              Reject Refund
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Complete Refund Modal */}
      <Modal isOpen={showCompleteModal} onClose={() => setShowCompleteModal(false)}>
        <ModalContent>
          <ModalHeader>Complete Refund</ModalHeader>
          <ModalBody>
            <p className="mb-4">
              Complete the refund for order{' '}
              <span className="font-bold">{selectedRefund?.order?.order_number}</span>:
            </p>
            <div className="space-y-4">
              <Select
                label="Refund Method"
                selectedKeys={[completeForm.refund_method]}
                onSelectionChange={(keys) => {
                  setCompleteForm({
                    ...completeForm,
                    refund_method: Array.from(keys)[0] as RefundMethod
                  });
                }}
                isRequired
              >
                <SelectItem key={RefundMethod.CASH} value={RefundMethod.CASH}>
                  Cash
                </SelectItem>
                <SelectItem key={RefundMethod.GCASH} value={RefundMethod.GCASH}>
                  GCash
                </SelectItem>
                <SelectItem key={RefundMethod.PAYMAYA} value={RefundMethod.PAYMAYA}>
                  PayMaya
                </SelectItem>
                <SelectItem key={RefundMethod.CARD} value={RefundMethod.CARD}>
                  Card
                </SelectItem>
                <SelectItem key={RefundMethod.BANK_TRANSFER} value={RefundMethod.BANK_TRANSFER}>
                  Bank Transfer
                </SelectItem>
                <SelectItem key={RefundMethod.STORE_CREDIT} value={RefundMethod.STORE_CREDIT}>
                  Store Credit
                </SelectItem>
              </Select>

              <Input
                label="Reference Number (optional)"
                placeholder="Enter reference number"
                value={completeForm.refund_reference}
                onValueChange={(v) => setCompleteForm({ ...completeForm, refund_reference: v })}
              />

              <div className="p-4 bg-default-50 rounded-lg">
                <p className="text-sm font-semibold">
                  Refund Amount: {formatCurrency(selectedRefund?.refund_amount || 0)}
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowCompleteModal(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleCompleteRefund}>
              Complete Refund
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
