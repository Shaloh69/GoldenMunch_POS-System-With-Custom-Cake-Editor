'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from '@heroui/table';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Chip } from '@heroui/chip';
import { Select, SelectItem } from '@heroui/select';
import { Textarea } from '@heroui/input';
import { Spinner } from '@heroui/spinner';
import {
  StarIcon,
  ChatBubbleLeftIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { FeedbackService } from '@/services/feedback.service';
import type { CustomerFeedback } from '@/types/api';

// TypeScript Types for Feedback Management
interface FeedbackFilter {
  feedbackType: 'all' | 'positive' | 'neutral' | 'negative';
  startDate: string;
  endDate: string;
  searchTerm: string;
}

interface FeedbackStats {
  totalFeedback: number;
  averageRating: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  respondedCount: number;
  pendingResponseCount: number;
}

export default function AdminFeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<CustomerFeedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<CustomerFeedback | null>(null);
  const [responseText, setResponseText] = useState('');

  const { isOpen, onOpen, onClose } = useDisclosure();

  const [filters, setFilters] = useState<FeedbackFilter>({
    feedbackType: 'all',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    searchTerm: '',
  });

  useEffect(() => {
    loadFeedback();
    loadStats();
  }, [filters]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const params = {
        feedback_type: filters.feedbackType !== 'all' ? filters.feedbackType : undefined,
        start_date: filters.startDate,
        end_date: filters.endDate,
        search: filters.searchTerm || undefined,
      };

      const response = await FeedbackService.getAllFeedback(params);
      if (response.data) {
        const feedback = Array.isArray(response.data) ? response.data : response.data.data || [];
        setFeedbackList(feedback);
      }
    } catch (error) {
      console.error('Failed to load feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await FeedbackService.getFeedbackStats();
      if (response.data) {
        const statsData = response.data.data || response.data;
        setStats({
          totalFeedback: statsData.total_feedback || 0,
          averageRating: statsData.average_rating || 0,
          positiveCount: statsData.positive_count || 0,
          neutralCount: statsData.neutral_count || 0,
          negativeCount: statsData.negative_count || 0,
          respondedCount: statsData.responded_count || 0,
          pendingResponseCount: statsData.pending_response_count || 0,
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleOpenResponse = (feedback: CustomerFeedback) => {
    setSelectedFeedback(feedback);
    setResponseText(feedback.admin_response || '');
    onOpen();
  };

  const handleSubmitResponse = async () => {
    if (!selectedFeedback || !responseText.trim()) {
      return;
    }

    try {
      setResponding(true);
      await FeedbackService.respondToFeedback(selectedFeedback.feedback_id, responseText);
      onClose();
      setResponseText('');
      setSelectedFeedback(null);
      loadFeedback();
      loadStats();
    } catch (error) {
      console.error('Failed to submit response:', error);
    } finally {
      setResponding(false);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'success';
    if (rating >= 3) return 'warning';
    return 'danger';
  };

  const getFeedbackTypeColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'success';
      case 'neutral':
        return 'default';
      case 'negative':
        return 'danger';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
            Customer Feedback Management
          </h1>
          <p className="text-default-500 mt-1">
            Monitor and respond to customer feedback
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <ChatBubbleLeftIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Total Feedback</p>
                  <p className="text-2xl font-bold">{stats.totalFeedback}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-success/10 rounded-lg">
                  <StarIcon className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Average Rating</p>
                  <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}/5</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-warning/10 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Responded</p>
                  <p className="text-2xl font-bold">
                    {stats.respondedCount} / {stats.totalFeedback}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <ClockIcon className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Pending Response</p>
                  <p className="text-2xl font-bold">{stats.pendingResponseCount}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Feedback Type Breakdown */}
      {stats && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold">Feedback Breakdown</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-success/5 rounded-lg border border-success/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-default-500">Positive Feedback</p>
                    <p className="text-2xl font-bold text-success">{stats.positiveCount}</p>
                    <p className="text-xs text-default-400 mt-1">
                      {stats.totalFeedback > 0 ? ((stats.positiveCount / stats.totalFeedback) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-warning/5 rounded-lg border border-warning/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-default-500">Neutral Feedback</p>
                    <p className="text-2xl font-bold text-warning">{stats.neutralCount}</p>
                    <p className="text-xs text-default-400 mt-1">
                      {stats.totalFeedback > 0 ? ((stats.neutralCount / stats.totalFeedback) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-danger/5 rounded-lg border border-danger/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-default-500">Negative Feedback</p>
                    <p className="text-2xl font-bold text-danger">{stats.negativeCount}</p>
                    <p className="text-xs text-default-400 mt-1">
                      {stats.totalFeedback > 0 ? ((stats.negativeCount / stats.totalFeedback) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                type="date"
                label="Start Date"
                value={filters.startDate}
                onValueChange={(v) =>
                  setFilters({ ...filters, startDate: v })
                }
              />
              <Input
                type="date"
                label="End Date"
                value={filters.endDate}
                onValueChange={(v) =>
                  setFilters({ ...filters, endDate: v })
                }
              />
              <Select
                label="Feedback Type"
                selectedKeys={[filters.feedbackType]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setFilters({ ...filters, feedbackType: selected as any });
                }}
              >
                <SelectItem key="all" value="all">
                  All Types
                </SelectItem>
                <SelectItem key="positive" value="positive">
                  Positive
                </SelectItem>
                <SelectItem key="neutral" value="neutral">
                  Neutral
                </SelectItem>
                <SelectItem key="negative" value="negative">
                  Negative
                </SelectItem>
              </Select>
              <Input
                placeholder="Search feedback..."
                value={filters.searchTerm}
                onValueChange={(v) =>
                  setFilters({ ...filters, searchTerm: v })
                }
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Feedback Table */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold">Customer Feedback</h3>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex justify-center p-8">
              <Spinner size="lg" color="primary" />
            </div>
          ) : (
            <Table aria-label="Customer feedback table">
              <TableHeader>
                <TableColumn>RATING</TableColumn>
                <TableColumn>TYPE</TableColumn>
                <TableColumn>FEEDBACK</TableColumn>
                <TableColumn>CUSTOMER</TableColumn>
                <TableColumn>DATE</TableColumn>
                <TableColumn>RESPONSE</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No feedback found">
                {feedbackList.map((feedback) => (
                  <TableRow key={feedback.feedback_id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Chip
                          size="sm"
                          color={getRatingColor(feedback.rating)}
                          className="text-white"
                        >
                          {feedback.rating.toFixed(1)}★
                        </Chip>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={getFeedbackTypeColor(feedback.feedback_type)}
                        className="capitalize"
                      >
                        {feedback.feedback_type}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {feedback.feedback_text || '(No comment)'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {feedback.is_anonymous ? (
                        <span className="text-sm text-default-400">Anonymous</span>
                      ) : (
                        <span className="text-sm">
                          Customer #{feedback.customer_id || 'N/A'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatDate(feedback.created_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {feedback.admin_response ? (
                        <Chip
                          size="sm"
                          color="success"
                          variant="flat"
                        >
                          Responded
                        </Chip>
                      ) : (
                        <Chip
                          size="sm"
                          color="warning"
                          variant="flat"
                        >
                          Pending
                        </Chip>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          color="primary"
                          onPress={() => handleOpenResponse(feedback)}
                        >
                          {feedback.admin_response ? 'Edit' : 'Respond'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Response Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            {selectedFeedback?.admin_response ? 'Edit Response' : 'Respond to Feedback'}
          </ModalHeader>
          <ModalBody>
            {selectedFeedback && (
              <div className="space-y-4">
                {/* Original Feedback */}
                <div className="p-4 bg-default-100 rounded-lg">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-default-500">Rating</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Chip
                          size="sm"
                          color={getRatingColor(selectedFeedback.rating)}
                          className="text-white"
                        >
                          {selectedFeedback.rating.toFixed(1)}★
                        </Chip>
                        <span className="text-sm">
                          {selectedFeedback.service_rating && `Service: ${selectedFeedback.service_rating}★`}
                        </span>
                        <span className="text-sm">
                          {selectedFeedback.food_rating && `Food: ${selectedFeedback.food_rating}★`}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-default-500">Type</p>
                      <Chip
                        size="sm"
                        color={getFeedbackTypeColor(selectedFeedback.feedback_type)}
                        className="capitalize mt-1"
                      >
                        {selectedFeedback.feedback_type}
                      </Chip>
                    </div>
                    <div>
                      <p className="text-sm text-default-500">Customer Comment</p>
                      <p className="text-sm mt-1">
                        {selectedFeedback.feedback_text || '(No comment provided)'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-default-500">Date</p>
                      <p className="text-sm mt-1">
                        {formatDate(selectedFeedback.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Response Form */}
                <div>
                  <label className="text-sm font-semibold mb-2 block">
                    Admin Response *
                  </label>
                  <Textarea
                    placeholder="Type your response here..."
                    value={responseText}
                    onValueChange={setResponseText}
                    minRows={4}
                    maxRows={8}
                  />
                  <p className="text-xs text-default-400 mt-2">
                    Provide a thoughtful response to address the customer's feedback
                  </p>
                </div>

                {selectedFeedback.admin_response && (
                  <div className="p-3 bg-success/5 border border-success/20 rounded-lg">
                    <p className="text-xs text-success font-semibold mb-2">
                      Previously Responded on{' '}
                      {formatDate(selectedFeedback.responded_at || '')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSubmitResponse}
              isLoading={responding}
              isDisabled={!responseText.trim()}
            >
              {selectedFeedback?.admin_response ? 'Update Response' : 'Send Response'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
