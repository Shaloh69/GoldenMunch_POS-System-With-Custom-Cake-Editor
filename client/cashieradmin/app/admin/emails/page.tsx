"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Tabs, Tab } from "@heroui/tabs";
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
import { motion } from "framer-motion";
import {
  EnvelopeIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

import { EmailService, type EmailRecord } from "@/services/email.service";
import { EmailComposer } from "@/components/EmailComposer";

interface EmailStats {
  total_emails: number;
  sent_count: number;
  pending_count: number;
  failed_count: number;
  submission_emails: number;
  approved_emails: number;
  rejected_emails: number;
  pickup_emails: number;
  reminder_emails: number;
}

export default function EmailManagementPage() {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "sent" | "pending" | "failed">("all");
  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 50;

  useEffect(() => {
    fetchEmails();
    fetchStats();
  }, [filter, page]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const response = await EmailService.getAllEmails({
        limit,
        offset: page * limit,
        status: filter === "all" ? undefined : filter,
      });

      if (response.data) {
        setEmails(response.data.emails);
        setHasMore(response.data.has_more);
      }
    } catch (error) {
      console.error("Failed to fetch emails:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await EmailService.getEmailStats();
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch email stats:", error);
    }
  };

  const filteredEmails = useMemo(() => {
    return emails.filter((email) => {
      const search = searchTerm.toLowerCase();
      return (
        email.recipient_email?.toLowerCase().includes(search) ||
        email.subject?.toLowerCase().includes(search) ||
        email.customer_name?.toLowerCase().includes(search)
      );
    });
  }, [emails, searchTerm]);

  const handleViewDetails = (email: EmailRecord) => {
    setSelectedEmail(email);
    setShowDetailsModal(true);
  };

  const handleRetryEmail = async (id: number) => {
    try {
      await EmailService.retryEmail(id);
      alert("Email retry initiated successfully!");
      fetchEmails();
      fetchStats();
    } catch (error: any) {
      console.error("Failed to retry email:", error);
      alert(error?.response?.data?.message || "Failed to retry email");
    }
  };

  const handleDeleteEmail = async (id: number) => {
    if (!confirm("Are you sure you want to delete this email record?")) return;

    try {
      await EmailService.deleteEmail(id);
      alert("Email deleted successfully!");
      fetchEmails();
      fetchStats();
    } catch (error: any) {
      console.error("Failed to delete email:", error);
      alert(error?.response?.data?.message || "Failed to delete email");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
              <EnvelopeIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Email Management</h1>
              <p className="text-gray-600">View and manage email history</p>
            </div>
          </div>
          <Button
            color="primary"
            startContent={<PencilSquareIcon className="w-5 h-5" />}
            onClick={() => setShowComposeModal(true)}
          >
            Compose Email
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Emails</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.total_emails}</p>
                </div>
                <div className="p-3 bg-blue-200 rounded-full">
                  <EnvelopeIcon className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Sent</p>
                  <p className="text-2xl font-bold text-green-700">{stats.sent_count}</p>
                </div>
                <div className="p-3 bg-green-200 rounded-full">
                  <CheckCircleIcon className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-none">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-amber-700">{stats.pending_count}</p>
                </div>
                <div className="p-3 bg-amber-200 rounded-full">
                  <ClockIcon className="w-6 h-6 text-amber-700" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-none">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Failed</p>
                  <p className="text-2xl font-bold text-red-700">{stats.failed_count}</p>
                </div>
                <div className="p-3 bg-red-200 rounded-full">
                  <XCircleIcon className="w-6 h-6 text-red-700" />
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        animate={{ opacity: 1 }}
        className="mb-6"
        initial={{ opacity: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardBody className="p-4">
            <div className="flex gap-4 items-center mb-4">
              <Input
                className="flex-1"
                placeholder="Search by email, subject, or customer name..."
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
                onClick={fetchEmails}
              >
                Refresh
              </Button>
            </div>
            <Tabs
              selectedKey={filter}
              onSelectionChange={(key) => {
                setFilter(key as typeof filter);
                setPage(0);
              }}
            >
              <Tab key="all" title="All Emails" />
              <Tab key="sent" title="Sent" />
              <Tab key="pending" title="Pending" />
              <Tab key="failed" title="Failed" />
            </Tabs>
          </CardBody>
        </Card>
      </motion.div>

      {/* Emails Table */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardBody className="p-0">
            <Table aria-label="Emails table">
              <TableHeader>
                <TableColumn>DATE/TIME</TableColumn>
                <TableColumn>RECIPIENT</TableColumn>
                <TableColumn>SUBJECT</TableColumn>
                <TableColumn>TYPE</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody
                emptyContent="No emails found"
                isLoading={loading}
                items={filteredEmails}
              >
                {(email) => (
                  <TableRow key={email.notification_id}>
                    <TableCell>
                      <div className="text-sm">
                        {EmailService.formatDateTime(email.sent_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{email.recipient_email}</p>
                        {email.customer_name && (
                          <p className="text-sm text-gray-500">{email.customer_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">{email.subject}</div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={EmailService.getNotificationTypeColor(email.notification_type) as any}
                        size="sm"
                        variant="flat"
                      >
                        {EmailService.getNotificationTypeLabel(email.notification_type)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={EmailService.getStatusColor(email.status) as any}
                        size="sm"
                        variant="flat"
                      >
                        {email.status.toUpperCase()}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          isIconOnly
                          color="default"
                          size="sm"
                          variant="flat"
                          onClick={() => handleViewDetails(email)}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        {email.status === "failed" && (
                          <Button
                            isIconOnly
                            color="warning"
                            size="sm"
                            variant="flat"
                            onClick={() => handleRetryEmail(email.notification_id)}
                          >
                            <ArrowPathIcon className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          isIconOnly
                          color="danger"
                          size="sm"
                          variant="flat"
                          onClick={() => handleDeleteEmail(email.notification_id)}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        {/* Pagination */}
        {(page > 0 || hasMore) && (
          <div className="flex justify-center gap-2 mt-4">
            <Button
              isDisabled={page === 0}
              variant="flat"
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="px-4 py-2">Page {page + 1}</span>
            <Button
              isDisabled={!hasMore}
              variant="flat"
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </motion.div>

      {/* Email Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        scrollBehavior="inside"
        size="3xl"
        onClose={() => setShowDetailsModal(false)}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <EnvelopeIcon className="w-6 h-6 text-blue-500" />
              <span>Email Details</span>
            </div>
          </ModalHeader>
          <ModalBody>
            {selectedEmail && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Chip
                      color={EmailService.getStatusColor(selectedEmail.status) as any}
                      variant="flat"
                    >
                      {selectedEmail.status.toUpperCase()}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <Chip
                      color={EmailService.getNotificationTypeColor(selectedEmail.notification_type) as any}
                      variant="flat"
                    >
                      {EmailService.getNotificationTypeLabel(selectedEmail.notification_type)}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Recipient</p>
                    <p className="font-medium">{selectedEmail.recipient_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sent At</p>
                    <p className="font-medium">
                      {EmailService.formatDateTime(selectedEmail.sent_at)}
                    </p>
                  </div>
                  {selectedEmail.customer_name && (
                    <div>
                      <p className="text-sm text-gray-500">Customer</p>
                      <p className="font-medium">{selectedEmail.customer_name}</p>
                    </div>
                  )}
                  {selectedEmail.request_id && (
                    <div>
                      <p className="text-sm text-gray-500">Request ID</p>
                      <p className="font-medium">#{selectedEmail.request_id}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Subject</p>
                  <p className="font-semibold text-lg">{selectedEmail.subject}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Message Body</p>
                  <div
                    className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-96 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.message_body }}
                  />
                </div>

                {selectedEmail.error_message && (
                  <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                    <p className="text-sm text-red-600 font-semibold mb-1">Error Message:</p>
                    <p className="text-sm text-red-800">{selectedEmail.error_message}</p>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setShowDetailsModal(false)}>
              Close
            </Button>
            {selectedEmail?.status === "failed" && (
              <Button
                color="warning"
                onPress={() => {
                  handleRetryEmail(selectedEmail.notification_id);
                  setShowDetailsModal(false);
                }}
              >
                Retry Email
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Compose Email Modal */}
      <EmailComposer
        isOpen={showComposeModal}
        onClose={() => setShowComposeModal(false)}
        onEmailSent={() => {
          fetchEmails();
          fetchStats();
        }}
      />
    </div>
  );
}
