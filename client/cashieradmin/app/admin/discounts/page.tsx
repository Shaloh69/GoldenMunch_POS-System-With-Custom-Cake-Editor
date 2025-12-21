"use client";

import type { CustomerDiscountType } from "@/types/api";

import { useEffect, useState } from "react";
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
  useDisclosure,
} from "@heroui/modal";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Switch } from "@heroui/switch";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PercentBadgeIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

import {
  DiscountService,
  CreateDiscountTypeRequest,
} from "@/services/discount.service";

export default function DiscountsPage() {
  // State Management
  const [discounts, setDiscounts] = useState<CustomerDiscountType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal States
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
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [selectedDiscount, setSelectedDiscount] =
    useState<CustomerDiscountType | null>(null);

  // Form State
  const [formState, setFormState] = useState<CreateDiscountTypeRequest>({
    name: "",
    description: "",
    discount_percentage: 0,
    requires_id: true,
    is_active: true,
  });

  // Stats
  const stats = {
    total: discounts.length,
    active: discounts.filter((d) => d.is_active).length,
    inactive: discounts.filter((d) => !d.is_active).length,
    avgPercentage:
      discounts.length > 0
        ? (
            discounts.reduce(
              (sum, d) => sum + Number(d.discount_percentage),
              0,
            ) / discounts.length
          ).toFixed(2)
        : "0.00",
  };

  // Initial Data Fetch
  useEffect(() => {
    fetchDiscounts();
  }, [includeInactive]);

  // API Calls
  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await DiscountService.getDiscountTypes({
        include_inactive: includeInactive,
      });

      if (response.success && response.data) {
        setDiscounts(Array.isArray(response.data) ? response.data : []);
      } else {
        setError(response.message || "Failed to fetch discounts");
      }
    } catch (err: any) {
      console.error("Failed to fetch discounts:", err);
      setError(err?.message || "An error occurred while fetching discounts");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiscount = async () => {
    try {
      setError(null);
      const response = await DiscountService.createDiscountType(formState);

      if (response.success) {
        setSuccessMessage("Discount created successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        onCreateClose();
        resetForm();
        fetchDiscounts();
      } else {
        setError(response.message || "Failed to create discount");
      }
    } catch (err: any) {
      console.error("Failed to create discount:", err);
      setError(err?.message || "An error occurred while creating discount");
    }
  };

  const handleUpdateDiscount = async () => {
    if (!selectedDiscount) return;

    try {
      setError(null);
      const response = await DiscountService.updateDiscountType(
        selectedDiscount.discount_type_id,
        formState,
      );

      if (response.success) {
        setSuccessMessage("Discount updated successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        onEditClose();
        setSelectedDiscount(null);
        resetForm();
        fetchDiscounts();
      } else {
        setError(response.message || "Failed to update discount");
      }
    } catch (err: any) {
      console.error("Failed to update discount:", err);
      setError(err?.message || "An error occurred while updating discount");
    }
  };

  const handleDeleteDiscount = async () => {
    if (!selectedDiscount) return;

    try {
      setError(null);
      const response = await DiscountService.deleteDiscountType(
        selectedDiscount.discount_type_id,
      );

      if (response.success) {
        setSuccessMessage("Discount deactivated successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        onDeleteClose();
        setSelectedDiscount(null);
        fetchDiscounts();
      } else {
        setError(response.message || "Failed to deactivate discount");
      }
    } catch (err: any) {
      console.error("Failed to deactivate discount:", err);
      setError(err?.message || "An error occurred while deactivating discount");
    }
  };

  const openEditModal = (discount: CustomerDiscountType) => {
    setSelectedDiscount(discount);
    setFormState({
      name: discount.name,
      description: discount.description || "",
      discount_percentage: Number(discount.discount_percentage),
      requires_id: discount.requires_id,
      is_active: discount.is_active,
    });
    onEditOpen();
  };

  const openDeleteModal = (discount: CustomerDiscountType) => {
    setSelectedDiscount(discount);
    onDeleteOpen();
  };

  const resetForm = () => {
    setFormState({
      name: "",
      description: "",
      discount_percentage: 0,
      requires_id: true,
      is_active: true,
    });
    setError(null);
  };

  // Filter discounts based on search
  const filteredDiscounts = discounts.filter(
    (discount) =>
      discount.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discount.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
            Customer Discounts
          </h1>
          <p className="text-default-600 mt-1">
            Manage student, senior, and other customer discounts
          </p>
        </div>
        <Button
          color="primary"
          startContent={<PlusIcon className="h-5 w-5" />}
          onPress={onCreateOpen}
        >
          Add Discount Type
        </Button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <Card className="bg-success-50 border-success">
          <CardBody>
            <p className="text-success">{successMessage}</p>
          </CardBody>
        </Card>
      )}

      {error && (
        <Card className="bg-danger-50 border-danger">
          <CardBody>
            <p className="text-danger">{error}</p>
          </CardBody>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Total Discounts</p>
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
              </div>
              <div className="p-3 bg-primary-100 rounded-full">
                <PercentBadgeIcon className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Active</p>
                <p className="text-2xl font-bold text-success">
                  {stats.active}
                </p>
              </div>
              <div className="p-3 bg-success-100 rounded-full">
                <CheckCircleIcon className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Inactive</p>
                <p className="text-2xl font-bold text-warning">
                  {stats.inactive}
                </p>
              </div>
              <div className="p-3 bg-warning-100 rounded-full">
                <XCircleIcon className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Avg Discount</p>
                <p className="text-2xl font-bold text-secondary">
                  {stats.avgPercentage}%
                </p>
              </div>
              <div className="p-3 bg-secondary-100 rounded-full">
                <UserGroupIcon className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody>
          <div className="flex gap-4 items-center">
            <Input
              isClearable
              className="flex-1"
              placeholder="Search discounts..."
              startContent={<PlusIcon className="h-5 w-5 text-default-400" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm("")}
            />
            <Switch
              isSelected={includeInactive}
              onValueChange={setIncludeInactive}
            >
              Show Inactive
            </Switch>
          </div>
        </CardBody>
      </Card>

      {/* Discounts Table */}
      <Card>
        <CardBody>
          {loading ? (
            <div className="flex justify-center p-8">
              <Spinner color="primary" size="lg" />
            </div>
          ) : filteredDiscounts.length === 0 ? (
            <div className="text-center p-8 text-default-500">
              <UserGroupIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No discounts found</p>
              {discounts.length === 0 && (
                <Button
                  className="mt-4"
                  color="primary"
                  size="sm"
                  startContent={<PlusIcon className="h-4 w-4" />}
                  onPress={onCreateOpen}
                >
                  Create Your First Discount
                </Button>
              )}
            </div>
          ) : (
            <Table aria-label="Customer discounts table">
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>DESCRIPTION</TableColumn>
                <TableColumn>DISCOUNT</TableColumn>
                <TableColumn>REQUIRES ID</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredDiscounts.map((discount) => (
                  <TableRow key={discount.discount_type_id}>
                    <TableCell>
                      <div className="font-semibold">{discount.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-default-500 max-w-xs truncate">
                        {discount.description || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip color="primary" size="sm" variant="flat">
                        {Number(discount.discount_percentage).toFixed(2)}%
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={discount.requires_id ? "warning" : "default"}
                        size="sm"
                        variant="flat"
                      >
                        {discount.requires_id ? "Yes" : "No"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={discount.is_active ? "success" : "default"}
                        size="sm"
                        variant="flat"
                      >
                        {discount.is_active ? "Active" : "Inactive"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          isIconOnly
                          color="primary"
                          size="sm"
                          variant="flat"
                          onPress={() => openEditModal(discount)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          isIconOnly
                          color="danger"
                          isDisabled={!discount.is_active}
                          size="sm"
                          variant="flat"
                          onPress={() => openDeleteModal(discount)}
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

      {/* Create Discount Modal */}
      <Modal
        isOpen={isCreateOpen}
        size="2xl"
        onClose={() => {
          onCreateClose();
          resetForm();
        }}
      >
        <ModalContent>
          <ModalHeader>Add New Discount Type</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                isRequired
                label="Discount Name"
                placeholder="e.g., Student Discount, Senior Citizen Discount"
                value={formState.name}
                onChange={(e) =>
                  setFormState({ ...formState, name: e.target.value })
                }
              />

              <Textarea
                label="Description"
                minRows={3}
                placeholder="Describe who can get this discount..."
                value={formState.description}
                onChange={(e) =>
                  setFormState({ ...formState, description: e.target.value })
                }
              />

              <Input
                isRequired
                endContent={<span className="text-default-400">%</span>}
                label="Discount Percentage"
                max="100"
                min="0"
                placeholder="0.00"
                step="0.01"
                type="number"
                value={formState.discount_percentage.toString()}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    discount_percentage: parseFloat(e.target.value) || 0,
                  })
                }
              />

              <div className="space-y-2">
                <Switch
                  isSelected={formState.requires_id}
                  onValueChange={(checked) =>
                    setFormState({ ...formState, requires_id: checked })
                  }
                >
                  Requires ID Verification
                </Switch>
                <p className="text-xs text-default-500 ml-12">
                  Enable this if cashier should verify customer ID before
                  applying discount
                </p>
              </div>

              <div className="space-y-2">
                <Switch
                  isSelected={formState.is_active}
                  onValueChange={(checked) =>
                    setFormState({ ...formState, is_active: checked })
                  }
                >
                  Active
                </Switch>
                <p className="text-xs text-default-500 ml-12">
                  Only active discounts can be applied to orders
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                onCreateClose();
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              isDisabled={!formState.name || formState.discount_percentage <= 0}
              onPress={handleCreateDiscount}
            >
              Create Discount
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Discount Modal */}
      <Modal
        isOpen={isEditOpen}
        size="2xl"
        onClose={() => {
          onEditClose();
          setSelectedDiscount(null);
          resetForm();
        }}
      >
        <ModalContent>
          <ModalHeader>Edit Discount Type</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                isRequired
                label="Discount Name"
                placeholder="e.g., Student Discount, Senior Citizen Discount"
                value={formState.name}
                onChange={(e) =>
                  setFormState({ ...formState, name: e.target.value })
                }
              />

              <Textarea
                label="Description"
                minRows={3}
                placeholder="Describe who can get this discount..."
                value={formState.description}
                onChange={(e) =>
                  setFormState({ ...formState, description: e.target.value })
                }
              />

              <Input
                isRequired
                endContent={<span className="text-default-400">%</span>}
                label="Discount Percentage"
                max="100"
                min="0"
                placeholder="0.00"
                step="0.01"
                type="number"
                value={formState.discount_percentage.toString()}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    discount_percentage: parseFloat(e.target.value) || 0,
                  })
                }
              />

              <div className="space-y-2">
                <Switch
                  isSelected={formState.requires_id}
                  onValueChange={(checked) =>
                    setFormState({ ...formState, requires_id: checked })
                  }
                >
                  Requires ID Verification
                </Switch>
                <p className="text-xs text-default-500 ml-12">
                  Enable this if cashier should verify customer ID before
                  applying discount
                </p>
              </div>

              <div className="space-y-2">
                <Switch
                  isSelected={formState.is_active}
                  onValueChange={(checked) =>
                    setFormState({ ...formState, is_active: checked })
                  }
                >
                  Active
                </Switch>
                <p className="text-xs text-default-500 ml-12">
                  Only active discounts can be applied to orders
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                onEditClose();
                setSelectedDiscount(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              isDisabled={!formState.name || formState.discount_percentage <= 0}
              onPress={handleUpdateDiscount}
            >
              Update Discount
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        size="md"
        onClose={() => {
          onDeleteClose();
          setSelectedDiscount(null);
        }}
      >
        <ModalContent>
          <ModalHeader className="text-danger">Deactivate Discount</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to deactivate{" "}
              <strong>{selectedDiscount?.name}</strong>?
            </p>
            <p className="text-sm text-default-500 mt-2">
              This discount will no longer be available for cashiers to apply.
              You can reactivate it later by editing the discount.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                onDeleteClose();
                setSelectedDiscount(null);
              }}
            >
              Cancel
            </Button>
            <Button color="danger" onPress={handleDeleteDiscount}>
              Deactivate
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
