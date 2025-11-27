'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from '@heroui/table';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Select, SelectItem } from '@heroui/select';
import { PromotionService } from '@/services/promotion.service';
import { PromotionType } from '@/types/api';
import type { PromotionRule, CreatePromotionRequest } from '@/types/api';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

// Types
interface PromotionFormState extends CreatePromotionRequest {
  promotion_id?: number;
}

interface PromotionStats {
  totalPromotions: number;
  activePromotions: number;
  inactivePromotions: number;
  totalUsage: number;
}

export default function PromotionsPage() {
  // State Management
  const [promotions, setPromotions] = useState<PromotionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<PromotionStats>({
    totalPromotions: 0,
    activePromotions: 0,
    inactivePromotions: 0,
    totalUsage: 0,
  });

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionRule | null>(null);

  // Form State
  const [formState, setFormState] = useState<PromotionFormState>({
    promotion_name: '',
    description: '',
    promotion_type: PromotionType.PERCENTAGE,
    discount_value: 0,
    min_purchase_amount: undefined,
    min_quantity: undefined,
    max_quantity: undefined,
    start_date: new Date().toISOString().split('T')[0],
    end_date: undefined,
    start_time: undefined,
    end_time: undefined,
    max_uses_per_customer: undefined,
    total_usage_limit: undefined,
    display_on_kiosk: true,
    is_stackable: false,
    is_active: true,
  });

  // Initial Data Fetch
  useEffect(() => {
    fetchPromotions();
  }, []);

  // Calculate Stats
  useEffect(() => {
    const active = promotions.filter(p => p.is_active).length;
    const inactive = promotions.filter(p => !p.is_active).length;
    const totalUsage = promotions.reduce((sum, p) => sum + (p.current_usage_count || 0), 0);

    setStats({
      totalPromotions: promotions.length,
      activePromotions: active,
      inactivePromotions: inactive,
      totalUsage,
    });
  }, [promotions]);

  // API Calls
  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await PromotionService.getPromotions();
      if (response.success) {
        setPromotions(Array.isArray(response.data) ? response.data : []);
      } else {
        console.error('Failed to fetch promotions:', response.message);
      }
    } catch (error) {
      console.error('Failed to fetch promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePromotion = async () => {
    try {
      const response = await PromotionService.createPromotion(formState as CreatePromotionRequest);
      if (response.success) {
        setShowCreateModal(false);
        resetForm();
        fetchPromotions();
      } else {
        console.error('Failed to create promotion:', response.message);
      }
    } catch (error) {
      console.error('Failed to create promotion:', error);
    }
  };

  const handleUpdatePromotion = async () => {
    if (!selectedPromotion) return;

    try {
      const updateData: Partial<CreatePromotionRequest> = { ...formState };
      delete (updateData as any).promotion_id;

      const response = await PromotionService.updatePromotion(
        selectedPromotion.promotion_id,
        updateData
      );
      if (response.success) {
        setShowEditModal(false);
        resetForm();
        fetchPromotions();
      } else {
        console.error('Failed to update promotion:', response.message);
      }
    } catch (error) {
      console.error('Failed to update promotion:', error);
    }
  };

  const handleDeletePromotion = async () => {
    if (!selectedPromotion) return;

    try {
      const response = await PromotionService.deletePromotion(selectedPromotion.promotion_id);
      if (response.success) {
        setShowDeleteModal(false);
        setSelectedPromotion(null);
        fetchPromotions();
      } else {
        console.error('Failed to delete promotion:', response.message);
      }
    } catch (error) {
      console.error('Failed to delete promotion:', error);
    }
  };

  // Form Handlers
  const resetForm = () => {
    setFormState({
      promotion_name: '',
      description: '',
      promotion_type: PromotionType.PERCENTAGE,
      discount_value: 0,
      min_purchase_amount: undefined,
      min_quantity: undefined,
      max_quantity: undefined,
      start_date: new Date().toISOString().split('T')[0],
      end_date: undefined,
      start_time: undefined,
      end_time: undefined,
      max_uses_per_customer: undefined,
      total_usage_limit: undefined,
      display_on_kiosk: true,
      is_stackable: false,
      is_active: true,
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (promotion: PromotionRule) => {
    setSelectedPromotion(promotion);
    setFormState({
      promotion_id: promotion.promotion_id,
      promotion_name: promotion.promotion_name,
      description: promotion.description,
      promotion_type: promotion.promotion_type,
      discount_value: promotion.discount_value,
      min_purchase_amount: promotion.min_purchase_amount,
      min_quantity: promotion.min_quantity,
      max_quantity: promotion.max_quantity,
      start_date: promotion.start_date,
      end_date: promotion.end_date,
      start_time: promotion.start_time,
      end_time: promotion.end_time,
      max_uses_per_customer: promotion.max_uses_per_customer,
      total_usage_limit: promotion.total_usage_limit,
      display_on_kiosk: promotion.display_on_kiosk,
      is_stackable: promotion.is_stackable,
      is_active: promotion.is_active,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (promotion: PromotionRule) => {
    setSelectedPromotion(promotion);
    setShowDeleteModal(true);
  };

  // Filtering
  const filteredPromotions = promotions.filter(promotion =>
    promotion.promotion_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promotion.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper Functions
  const getPromotionTypeColor = (type: PromotionType) => {
    const colors: Record<PromotionType, string> = {
      [PromotionType.PERCENTAGE]: 'bg-primary/10 text-primary',
      [PromotionType.FIXED_AMOUNT]: 'bg-success/10 text-success',
      [PromotionType.BUY_X_GET_Y]: 'bg-warning/10 text-warning',
      [PromotionType.BUNDLE]: 'bg-info/10 text-info',
      [PromotionType.SEASONAL]: 'bg-secondary/10 text-secondary',
    };
    return colors[type] || 'bg-default-100';
  };

  const formatCurrency = (value: number) => {
    return `₱${parseFloat(value.toString()).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-PH');
  };

  const isPromotionActive = (promotion: PromotionRule) => {
    const now = new Date();
    const startDate = new Date(promotion.start_date);
    const endDate = promotion.end_date ? new Date(promotion.end_date) : null;

    return (
      promotion.is_active &&
      startDate <= now &&
      (!endDate || endDate >= now)
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Promotions Management</h1>
          <p className="text-default-500 mt-1">Create and manage promotional offers</p>
        </div>
        <Button
          color="primary"
          startContent={<PlusIcon className="h-5 w-5" />}
          onPress={openCreateModal}
        >
          New Promotion
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <PlusIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-default-500">Total Promotions</p>
                <p className="text-2xl font-bold">{stats.totalPromotions}</p>
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
                <p className="text-sm text-default-500">Active Promotions</p>
                <p className="text-2xl font-bold">{stats.activePromotions}</p>
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
                <p className="text-sm text-default-500">Inactive Promotions</p>
                <p className="text-2xl font-bold">{stats.inactivePromotions}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-warning/10 rounded-lg">
                <MagnifyingGlassIcon className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-default-500">Total Usage Count</p>
                <p className="text-2xl font-bold">{stats.totalUsage}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Search */}
      <Input
        placeholder="Search promotions by name or description..."
        value={searchTerm}
        onValueChange={setSearchTerm}
        startContent={<MagnifyingGlassIcon className="h-5 w-5 text-default-400" />}
        className="max-w-md"
      />

      {/* Promotions Table */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold">All Promotions</h3>
        </CardHeader>
        <CardBody>
          {loading ? (
            <p>Loading promotions...</p>
          ) : (
            <Table aria-label="Promotions list">
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>TYPE</TableColumn>
                <TableColumn>DISCOUNT VALUE</TableColumn>
                <TableColumn>START DATE</TableColumn>
                <TableColumn>END DATE</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>USAGE</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No promotions found">
                {filteredPromotions.map((promotion) => (
                  <TableRow key={promotion.promotion_id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">{promotion.promotion_name}</span>
                        {promotion.description && (
                          <span className="text-xs text-default-400">{promotion.description}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPromotionTypeColor(promotion.promotion_type)}`}>
                        {promotion.promotion_type.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {promotion.promotion_type === PromotionType.PERCENTAGE
                        ? `${promotion.discount_value}%`
                        : formatCurrency(promotion.discount_value)}
                    </TableCell>
                    <TableCell>{formatDate(promotion.start_date)}</TableCell>
                    <TableCell>
                      {promotion.end_date ? formatDate(promotion.end_date) : <span className="text-default-400">No end date</span>}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          isPromotionActive(promotion)
                            ? 'bg-success/10 text-success'
                            : 'bg-default-200'
                        }`}
                      >
                        {isPromotionActive(promotion) ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {promotion.current_usage_count}
                        {promotion.total_usage_limit && ` / ${promotion.total_usage_limit}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="primary"
                          onPress={() => openEditModal(promotion)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => openDeleteModal(promotion)}
                        >
                          <TrashIcon className="h-4 w-4" />
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

      {/* Create Promotion Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} size="lg" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>Create New Promotion</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Promotion Name"
                placeholder="e.g., Summer Sale"
                value={formState.promotion_name}
                onValueChange={(v) => setFormState({ ...formState, promotion_name: v })}
                isRequired
              />

              <Input
                label="Description"
                placeholder="e.g., 20% off all items"
                value={formState.description || ''}
                onValueChange={(v) => setFormState({ ...formState, description: v })}
              />

              <Select
                label="Promotion Type"
                selectedKeys={[formState.promotion_type]}
                onSelectionChange={(keys) => {
                  setFormState({ ...formState, promotion_type: Array.from(keys)[0] as PromotionType });
                }}
                isRequired
              >
                <SelectItem key={PromotionType.PERCENTAGE} value={PromotionType.PERCENTAGE}>
                  Percentage
                </SelectItem>
                <SelectItem key={PromotionType.FIXED_AMOUNT} value={PromotionType.FIXED_AMOUNT}>
                  Fixed Amount
                </SelectItem>
                <SelectItem key={PromotionType.BUY_X_GET_Y} value={PromotionType.BUY_X_GET_Y}>
                  Buy X Get Y
                </SelectItem>
                <SelectItem key={PromotionType.BUNDLE} value={PromotionType.BUNDLE}>
                  Bundle
                </SelectItem>
                <SelectItem key={PromotionType.SEASONAL} value={PromotionType.SEASONAL}>
                  Seasonal
                </SelectItem>
              </Select>

              <Input
                label="Discount Value"
                type="number"
                placeholder={formState.promotion_type === PromotionType.PERCENTAGE ? "20" : "100"}
                value={formState.discount_value.toString()}
                onValueChange={(v) => setFormState({ ...formState, discount_value: parseFloat(v) || 0 })}
                isRequired
              />

              <Input
                label="Minimum Purchase Amount (optional)"
                type="number"
                placeholder="0"
                value={(formState.min_purchase_amount || '').toString()}
                onValueChange={(v) => setFormState({ ...formState, min_purchase_amount: v ? parseFloat(v) : undefined })}
              />

              <Input
                label="Minimum Quantity (optional)"
                type="number"
                placeholder="1"
                value={(formState.min_quantity || '').toString()}
                onValueChange={(v) => setFormState({ ...formState, min_quantity: v ? parseInt(v) : undefined })}
              />

              <Input
                label="Maximum Quantity (optional)"
                type="number"
                placeholder="No limit"
                value={(formState.max_quantity || '').toString()}
                onValueChange={(v) => setFormState({ ...formState, max_quantity: v ? parseInt(v) : undefined })}
              />

              <Input
                label="Start Date"
                type="date"
                value={formState.start_date}
                onValueChange={(v) => setFormState({ ...formState, start_date: v })}
                isRequired
              />

              <Input
                label="End Date (optional)"
                type="date"
                value={formState.end_date || ''}
                onValueChange={(v) => setFormState({ ...formState, end_date: v || undefined })}
              />

              <Input
                label="Start Time (optional)"
                type="time"
                value={formState.start_time || ''}
                onValueChange={(v) => setFormState({ ...formState, start_time: v || undefined })}
              />

              <Input
                label="End Time (optional)"
                type="time"
                value={formState.end_time || ''}
                onValueChange={(v) => setFormState({ ...formState, end_time: v || undefined })}
              />

              <Input
                label="Max Uses Per Customer (optional)"
                type="number"
                placeholder="Unlimited"
                value={(formState.max_uses_per_customer || '').toString()}
                onValueChange={(v) => setFormState({ ...formState, max_uses_per_customer: v ? parseInt(v) : undefined })}
              />

              <Input
                label="Total Usage Limit (optional)"
                type="number"
                placeholder="Unlimited"
                value={(formState.total_usage_limit || '').toString()}
                onValueChange={(v) => setFormState({ ...formState, total_usage_limit: v ? parseInt(v) : undefined })}
              />

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.display_on_kiosk || false}
                    onChange={(e) => setFormState({ ...formState, display_on_kiosk: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Display on Kiosk</span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.is_stackable || false}
                    onChange={(e) => setFormState({ ...formState, is_stackable: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Is Stackable</span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.is_active ?? true}
                    onChange={(e) => setFormState({ ...formState, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Is Active</span>
                </label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleCreatePromotion}>
              Create Promotion
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Promotion Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} size="lg" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>Edit Promotion</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Promotion Name"
                placeholder="e.g., Summer Sale"
                value={formState.promotion_name}
                onValueChange={(v) => setFormState({ ...formState, promotion_name: v })}
                isRequired
              />

              <Input
                label="Description"
                placeholder="e.g., 20% off all items"
                value={formState.description || ''}
                onValueChange={(v) => setFormState({ ...formState, description: v })}
              />

              <Select
                label="Promotion Type"
                selectedKeys={[formState.promotion_type]}
                onSelectionChange={(keys) => {
                  setFormState({ ...formState, promotion_type: Array.from(keys)[0] as PromotionType });
                }}
                isRequired
              >
                <SelectItem key={PromotionType.PERCENTAGE} value={PromotionType.PERCENTAGE}>
                  Percentage
                </SelectItem>
                <SelectItem key={PromotionType.FIXED_AMOUNT} value={PromotionType.FIXED_AMOUNT}>
                  Fixed Amount
                </SelectItem>
                <SelectItem key={PromotionType.BUY_X_GET_Y} value={PromotionType.BUY_X_GET_Y}>
                  Buy X Get Y
                </SelectItem>
                <SelectItem key={PromotionType.BUNDLE} value={PromotionType.BUNDLE}>
                  Bundle
                </SelectItem>
                <SelectItem key={PromotionType.SEASONAL} value={PromotionType.SEASONAL}>
                  Seasonal
                </SelectItem>
              </Select>

              <Input
                label="Discount Value"
                type="number"
                placeholder={formState.promotion_type === PromotionType.PERCENTAGE ? "20" : "100"}
                value={formState.discount_value.toString()}
                onValueChange={(v) => setFormState({ ...formState, discount_value: parseFloat(v) || 0 })}
                isRequired
              />

              <Input
                label="Minimum Purchase Amount (optional)"
                type="number"
                placeholder="0"
                value={(formState.min_purchase_amount || '').toString()}
                onValueChange={(v) => setFormState({ ...formState, min_purchase_amount: v ? parseFloat(v) : undefined })}
              />

              <Input
                label="Minimum Quantity (optional)"
                type="number"
                placeholder="1"
                value={(formState.min_quantity || '').toString()}
                onValueChange={(v) => setFormState({ ...formState, min_quantity: v ? parseInt(v) : undefined })}
              />

              <Input
                label="Maximum Quantity (optional)"
                type="number"
                placeholder="No limit"
                value={(formState.max_quantity || '').toString()}
                onValueChange={(v) => setFormState({ ...formState, max_quantity: v ? parseInt(v) : undefined })}
              />

              <Input
                label="Start Date"
                type="date"
                value={formState.start_date}
                onValueChange={(v) => setFormState({ ...formState, start_date: v })}
                isRequired
              />

              <Input
                label="End Date (optional)"
                type="date"
                value={formState.end_date || ''}
                onValueChange={(v) => setFormState({ ...formState, end_date: v || undefined })}
              />

              <Input
                label="Start Time (optional)"
                type="time"
                value={formState.start_time || ''}
                onValueChange={(v) => setFormState({ ...formState, start_time: v || undefined })}
              />

              <Input
                label="End Time (optional)"
                type="time"
                value={formState.end_time || ''}
                onValueChange={(v) => setFormState({ ...formState, end_time: v || undefined })}
              />

              <Input
                label="Max Uses Per Customer (optional)"
                type="number"
                placeholder="Unlimited"
                value={(formState.max_uses_per_customer || '').toString()}
                onValueChange={(v) => setFormState({ ...formState, max_uses_per_customer: v ? parseInt(v) : undefined })}
              />

              <Input
                label="Total Usage Limit (optional)"
                type="number"
                placeholder="Unlimited"
                value={(formState.total_usage_limit || '').toString()}
                onValueChange={(v) => setFormState({ ...formState, total_usage_limit: v ? parseInt(v) : undefined })}
              />

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.display_on_kiosk || false}
                    onChange={(e) => setFormState({ ...formState, display_on_kiosk: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Display on Kiosk</span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.is_stackable || false}
                    onChange={(e) => setFormState({ ...formState, is_stackable: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Is Stackable</span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.is_active ?? true}
                    onChange={(e) => setFormState({ ...formState, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Is Active</span>
                </label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleUpdatePromotion}>
              Update Promotion
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <ModalContent>
          <ModalHeader>Delete Promotion</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete the promotion <span className="font-bold">{selectedPromotion?.promotion_name}</span>?
            </p>
            <p className="text-sm text-default-500">This action cannot be undone.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleDeletePromotion}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
