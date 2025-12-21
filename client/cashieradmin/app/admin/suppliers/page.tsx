"use client";

import type { Supplier, CreateSupplierRequest } from "@/types/api";

import { useEffect, useState } from "react";
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
import { Select, SelectItem } from "@heroui/select";
import { Textarea } from "@heroui/input";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

import { SupplierService } from "@/services/supplier.service";

// Types
interface SupplierFormData extends Partial<CreateSupplierRequest> {
  is_active?: boolean;
}

interface FilterOptions {
  status: "all" | "active" | "inactive";
}

// Main Page Component
export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({ status: "all" });

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

  const [formData, setFormData] = useState<SupplierFormData>({});
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Load suppliers on mount
  useEffect(() => {
    loadSuppliers();
  }, []);

  // Load all suppliers
  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const response = await SupplierService.getSuppliers();

      if (response.success && response.data) {
        setSuppliers(response.data);
      }
    } catch (error) {
      console.error("Failed to load suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter suppliers based on search and filters
  const filteredSuppliers = suppliers.filter((supplier) => {
    // Search filter
    const matchesSearch =
      supplier.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact_person
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus =
      filters.status === "all" ||
      (filters.status === "active" && supplier.is_active) ||
      (filters.status === "inactive" && !supplier.is_active);

    return matchesSearch && matchesStatus;
  });

  // Create new supplier
  const handleCreate = async () => {
    if (!formData.supplier_name?.trim()) {
      alert("Supplier name is required");

      return;
    }

    try {
      setSaving(true);
      const response = await SupplierService.createSupplier(
        formData as CreateSupplierRequest,
      );

      if (response.success) {
        onCreateClose();
        setFormData({});
        loadSuppliers();
      } else {
        alert(response.message || "Failed to create supplier");
      }
    } catch (error) {
      console.error("Failed to create supplier:", error);
      alert("Error creating supplier. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Open edit modal
  const handleEditOpen = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      supplier_name: supplier.supplier_name,
      contact_person: supplier.contact_person,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      is_active: supplier.is_active,
    });
    onEditOpen();
  };

  // Update existing supplier
  const handleUpdate = async () => {
    if (!editingSupplier) return;

    if (!formData.supplier_name?.trim()) {
      alert("Supplier name is required");

      return;
    }

    try {
      setSaving(true);
      const response = await SupplierService.updateSupplier(
        editingSupplier.supplier_id,
        formData as Partial<CreateSupplierRequest>,
      );

      if (response.success) {
        onEditClose();
        setFormData({});
        setEditingSupplier(null);
        loadSuppliers();
      } else {
        alert(response.message || "Failed to update supplier");
      }
    } catch (error) {
      console.error("Failed to update supplier:", error);
      alert("Error updating supplier. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Delete supplier
  const handleDelete = async (supplierId: number) => {
    if (!confirm("Are you sure you want to delete this supplier?")) {
      return;
    }

    try {
      setSaving(true);
      const response = await SupplierService.deleteSupplier(supplierId);

      if (response.success) {
        loadSuppliers();
      } else {
        alert(response.message || "Failed to delete supplier");
      }
    } catch (error) {
      console.error("Failed to delete supplier:", error);
      alert("Error deleting supplier. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Reset form and close modals
  const handleCreateClose = () => {
    setFormData({});
    onCreateClose();
  };

  const handleEditClose = () => {
    setFormData({});
    setEditingSupplier(null);
    onEditClose();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
            Suppliers Management
          </h1>
          <p className="text-default-500 mt-1">
            Manage supplier information and contacts
          </p>
        </div>
        <Button
          color="primary"
          startContent={<PlusIcon className="h-5 w-5" />}
          onPress={onCreateOpen}
        >
          Add Supplier
        </Button>
      </div>

      {/* Search and Filter Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          isClearable
          placeholder="Search by name, contact, email, or phone..."
          startContent={
            <MagnifyingGlassIcon className="h-5 w-5 text-default-400" />
          }
          onClear={() => setSearchTerm("")}
          onValueChange={setSearchTerm}
        />
        <Select
          label="Status Filter"
          selectedKeys={[filters.status]}
          onChange={(e) =>
            setFilters({ status: e.target.value as FilterOptions["status"] })
          }
        >
          <SelectItem key="all">All Suppliers</SelectItem>
          <SelectItem key="active">Active</SelectItem>
          <SelectItem key="inactive">Inactive</SelectItem>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <div>
              <p className="text-sm text-default-500">Total Suppliers</p>
              <p className="text-2xl font-bold">{suppliers.length}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div>
              <p className="text-sm text-default-500">Active Suppliers</p>
              <p className="text-2xl font-bold">
                {suppliers.filter((s) => s.is_active).length}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div>
              <p className="text-sm text-default-500">Inactive Suppliers</p>
              <p className="text-2xl font-bold">
                {suppliers.filter((s) => !s.is_active).length}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Suppliers Table Card */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Suppliers List</h2>
          <span className="text-sm text-default-500">
            {filteredSuppliers.length} results
          </span>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex justify-center p-8">
              <Spinner color="primary" size="lg" />
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-default-500">No suppliers found</p>
              <p className="text-sm text-default-400 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table aria-label="Suppliers table">
                <TableHeader>
                  <TableColumn>SUPPLIER NAME</TableColumn>
                  <TableColumn>CONTACT PERSON</TableColumn>
                  <TableColumn>EMAIL</TableColumn>
                  <TableColumn>PHONE</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.supplier_id}>
                      <TableCell className="font-medium">
                        {supplier.supplier_name}
                      </TableCell>
                      <TableCell>{supplier.contact_person || "-"}</TableCell>
                      <TableCell>
                        {supplier.email ? (
                          <a
                            className="text-blue-500 hover:underline"
                            href={`mailto:${supplier.email}`}
                          >
                            {supplier.email}
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {supplier.phone ? (
                          <a
                            className="text-blue-500 hover:underline"
                            href={`tel:${supplier.phone}`}
                          >
                            {supplier.phone}
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          className="capitalize"
                          color={supplier.is_active ? "success" : "default"}
                          size="sm"
                        >
                          {supplier.is_active ? "Active" : "Inactive"}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            isIconOnly
                            color="primary"
                            size="sm"
                            variant="flat"
                            onPress={() => handleEditOpen(supplier)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            isIconOnly
                            color="danger"
                            isDisabled={saving}
                            size="sm"
                            variant="flat"
                            onPress={() => handleDelete(supplier.supplier_id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create Supplier Modal */}
      <Modal
        isOpen={isCreateOpen}
        scrollBehavior="inside"
        size="2xl"
        onClose={handleCreateClose}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Add New Supplier
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                isRequired
                description="The official name of the supplier"
                label="Supplier Name"
                placeholder="Enter supplier name"
                onChange={(e) =>
                  setFormData({ ...formData, supplier_name: e.target.value })
                }
              />

              <Input
                description="Name of the primary contact"
                label="Contact Person"
                placeholder="Enter contact person name"
                onChange={(e) =>
                  setFormData({ ...formData, contact_person: e.target.value })
                }
              />

              <Input
                description="Business email address"
                label="Email"
                placeholder="Enter email address"
                type="email"
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />

              <Input
                description="Business phone number"
                label="Phone"
                placeholder="Enter phone number"
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />

              <Textarea
                description="Full business address"
                label="Address"
                placeholder="Enter supplier address"
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />

              <div className="flex items-center gap-2 pt-2">
                <input
                  checked={formData.is_active !== false}
                  className="rounded"
                  id="is_active"
                  type="checkbox"
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                />
                <label className="text-sm" htmlFor="is_active">
                  Active Supplier
                </label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleCreateClose}>
              Cancel
            </Button>
            <Button color="primary" isLoading={saving} onPress={handleCreate}>
              Create Supplier
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Supplier Modal */}
      <Modal
        isOpen={isEditOpen}
        scrollBehavior="inside"
        size="2xl"
        onClose={handleEditClose}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Edit Supplier - {editingSupplier?.supplier_name}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                isRequired
                description="The official name of the supplier"
                label="Supplier Name"
                placeholder="Enter supplier name"
                onChange={(e) =>
                  setFormData({ ...formData, supplier_name: e.target.value })
                }
              />

              <Input
                description="Name of the primary contact"
                label="Contact Person"
                placeholder="Enter contact person name"
                onChange={(e) =>
                  setFormData({ ...formData, contact_person: e.target.value })
                }
              />

              <Input
                description="Business email address"
                label="Email"
                placeholder="Enter email address"
                type="email"
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />

              <Input
                description="Business phone number"
                label="Phone"
                placeholder="Enter phone number"
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />

              <Textarea
                description="Full business address"
                label="Address"
                placeholder="Enter supplier address"
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />

              <div className="flex items-center gap-2 pt-2">
                <input
                  checked={formData.is_active !== false}
                  className="rounded"
                  id="edit_is_active"
                  type="checkbox"
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                />
                <label className="text-sm" htmlFor="edit_is_active">
                  Active Supplier
                </label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleEditClose}>
              Cancel
            </Button>
            <Button color="primary" isLoading={saving} onPress={handleUpdate}>
              Update Supplier
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
