"use client";

import type { Cashier, CreateCashierRequest } from "@/types/api";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
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
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

import { CashierService } from "@/services/cashier.service";

// Types
interface CashierFormState extends CreateCashierRequest {
  cashier_id?: number;
}

interface CashierStats {
  totalCashiers: number;
  activeCashiers: number;
  inactiveCashiers: number;
}

export default function CashiersPage() {
  // State Management
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState<CashierStats>({
    totalCashiers: 0,
    activeCashiers: 0,
    inactiveCashiers: 0,
  });

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCashier, setSelectedCashier] = useState<Cashier | null>(null);

  // Form State
  const [formState, setFormState] = useState<CashierFormState>({
    name: "",
    cashier_code: "",
    pin: "",
    phone: "",
    email: "",
    hire_date: new Date().toISOString().split("T")[0],
    hourly_rate: 0,
    is_active: true,
  });

  // Initial Data Fetch
  useEffect(() => {
    fetchCashiers();
  }, []);

  // Calculate Stats
  useEffect(() => {
    const active = cashiers.filter((c) => c.is_active).length;
    const inactive = cashiers.filter((c) => !c.is_active).length;

    setStats({
      totalCashiers: cashiers.length,
      activeCashiers: active,
      inactiveCashiers: inactive,
    });
  }, [cashiers]);

  // API Calls
  const fetchCashiers = async () => {
    try {
      setLoading(true);
      const response = await CashierService.getCashiers();

      if (response.success) {
        setCashiers(response.data || []);
      } else {
        console.error("Failed to fetch cashiers:", response.message);
      }
    } catch (error) {
      console.error("Failed to fetch cashiers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCashier = async () => {
    try {
      const response = await CashierService.createCashier(formState);

      if (response.success) {
        setShowCreateModal(false);
        resetForm();
        fetchCashiers();
      } else {
        console.error("Failed to create cashier:", response.message);
      }
    } catch (error) {
      console.error("Failed to create cashier:", error);
    }
  };

  const handleUpdateCashier = async () => {
    if (!selectedCashier) return;

    try {
      const updateData: Partial<CreateCashierRequest> = { ...formState };

      delete (updateData as any).cashier_id;

      const response = await CashierService.updateCashier(
        selectedCashier.cashier_id,
        updateData,
      );

      if (response.success) {
        setShowEditModal(false);
        resetForm();
        fetchCashiers();
      } else {
        console.error("Failed to update cashier:", response.message);
      }
    } catch (error) {
      console.error("Failed to update cashier:", error);
    }
  };

  const handleDeleteCashier = async () => {
    if (!selectedCashier) return;

    try {
      const response = await CashierService.deleteCashier(
        selectedCashier.cashier_id,
      );

      if (response.success) {
        setShowDeleteModal(false);
        setSelectedCashier(null);
        fetchCashiers();
      } else {
        console.error("Failed to delete cashier:", response.message);
      }
    } catch (error) {
      console.error("Failed to delete cashier:", error);
    }
  };

  // Form Handlers
  const resetForm = () => {
    setFormState({
      name: "",
      cashier_code: "",
      pin: "",
      phone: "",
      email: "",
      hire_date: new Date().toISOString().split("T")[0],
      hourly_rate: 0,
      is_active: true,
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (cashier: Cashier) => {
    setSelectedCashier(cashier);
    setFormState({
      cashier_id: cashier.cashier_id,
      name: cashier.name,
      cashier_code: cashier.cashier_code,
      pin: "",
      phone: cashier.phone || "",
      email: cashier.email || "",
      hire_date: cashier.hire_date,
      hourly_rate: cashier.hourly_rate,
      is_active: cashier.is_active,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (cashier: Cashier) => {
    setSelectedCashier(cashier);
    setShowDeleteModal(true);
  };

  // Filtering
  const filteredCashiers = cashiers.filter(
    (cashier) =>
      cashier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cashier.cashier_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cashier.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Helper Functions
  const formatCurrency = (value: number) => {
    return `₱${parseFloat(value.toString()).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-PH");
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cashiers Management</h1>
          <p className="text-default-500 mt-1">
            Manage cashier accounts and access
          </p>
        </div>
        <Button
          color="primary"
          startContent={<PlusIcon className="h-5 w-5" />}
          onPress={openCreateModal}
        >
          New Cashier
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <UserIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-default-500">Total Cashiers</p>
                <p className="text-2xl font-bold">{stats.totalCashiers}</p>
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
                <p className="text-sm text-default-500">Active Cashiers</p>
                <p className="text-2xl font-bold">{stats.activeCashiers}</p>
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
                <p className="text-sm text-default-500">Inactive Cashiers</p>
                <p className="text-2xl font-bold">{stats.inactiveCashiers}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Search */}
      <Input
        className="max-w-md"
        placeholder="Search cashiers by name, code, or email..."
        startContent={
          <MagnifyingGlassIcon className="h-5 w-5 text-default-400" />
        }
        value={searchTerm}
        onValueChange={setSearchTerm}
      />

      {/* Cashiers Table */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold">All Cashiers</h3>
        </CardHeader>
        <CardBody>
          {loading ? (
            <p>Loading cashiers...</p>
          ) : (
            <Table aria-label="Cashiers list">
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>CASHIER CODE</TableColumn>
                <TableColumn>CONTACT</TableColumn>
                <TableColumn>HIRE DATE</TableColumn>
                <TableColumn>HOURLY RATE</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No cashiers found">
                {filteredCashiers.map((cashier) => (
                  <TableRow key={cashier.cashier_id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">{cashier.name}</span>
                        {cashier.email && (
                          <span className="text-xs text-default-400">
                            {cashier.email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {cashier.cashier_code}
                      </span>
                    </TableCell>
                    <TableCell>
                      {cashier.phone || (
                        <span className="text-default-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(cashier.hire_date)}</TableCell>
                    <TableCell>
                      {formatCurrency(cashier.hourly_rate)}/hr
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          cashier.is_active
                            ? "bg-success/10 text-success"
                            : "bg-danger/10 text-danger"
                        }`}
                      >
                        {cashier.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          isIconOnly
                          color="primary"
                          size="sm"
                          variant="light"
                          onPress={() => openEditModal(cashier)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          isIconOnly
                          color="danger"
                          size="sm"
                          variant="light"
                          onPress={() => openDeleteModal(cashier)}
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

      {/* Create Cashier Modal */}
      <Modal
        isOpen={showCreateModal}
        size="lg"
        onClose={() => setShowCreateModal(false)}
      >
        <ModalContent>
          <ModalHeader>Create New Cashier</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                isRequired
                label="Name"
                placeholder="e.g., John Doe"
                value={formState.name}
                onValueChange={(v) => setFormState({ ...formState, name: v })}
              />

              <Input
                isRequired
                label="Cashier Code"
                placeholder="e.g., CASH001"
                value={formState.cashier_code}
                onValueChange={(v) =>
                  setFormState({ ...formState, cashier_code: v })
                }
              />

              <Input
                isRequired
                label="PIN (4-6 digits)"
                placeholder="Enter PIN"
                type="password"
                value={formState.pin}
                onValueChange={(v) => setFormState({ ...formState, pin: v })}
              />

              <Input
                label="Phone (optional)"
                placeholder="e.g., 09123456789"
                value={formState.phone}
                onValueChange={(v) => setFormState({ ...formState, phone: v })}
              />

              <Input
                label="Email (optional)"
                placeholder="e.g., cashier@goldenmunch.com"
                type="email"
                value={formState.email}
                onValueChange={(v) => setFormState({ ...formState, email: v })}
              />

              <Input
                isRequired
                label="Hire Date"
                type="date"
                value={formState.hire_date}
                onValueChange={(v) =>
                  setFormState({ ...formState, hire_date: v })
                }
              />

              <Input
                isRequired
                label="Hourly Rate"
                placeholder="0.00"
                type="number"
                value={formState.hourly_rate.toString()}
                onValueChange={(v) =>
                  setFormState({
                    ...formState,
                    hourly_rate: parseFloat(v) || 0,
                  })
                }
              />

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    checked={formState.is_active ?? true}
                    className="rounded"
                    type="checkbox"
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        is_active: e.target.checked,
                      })
                    }
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
            <Button color="primary" onPress={handleCreateCashier}>
              Create Cashier
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Cashier Modal */}
      <Modal
        isOpen={showEditModal}
        size="lg"
        onClose={() => setShowEditModal(false)}
      >
        <ModalContent>
          <ModalHeader>Edit Cashier</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                isRequired
                label="Name"
                placeholder="e.g., John Doe"
                value={formState.name}
                onValueChange={(v) => setFormState({ ...formState, name: v })}
              />

              <Input
                isRequired
                label="Cashier Code"
                placeholder="e.g., CASH001"
                value={formState.cashier_code}
                onValueChange={(v) =>
                  setFormState({ ...formState, cashier_code: v })
                }
              />

              <Input
                label="New PIN (leave empty to keep current)"
                placeholder="Enter new PIN"
                type="password"
                value={formState.pin}
                onValueChange={(v) => setFormState({ ...formState, pin: v })}
              />

              <Input
                label="Phone (optional)"
                placeholder="e.g., 09123456789"
                value={formState.phone}
                onValueChange={(v) => setFormState({ ...formState, phone: v })}
              />

              <Input
                label="Email (optional)"
                placeholder="e.g., cashier@goldenmunch.com"
                type="email"
                value={formState.email}
                onValueChange={(v) => setFormState({ ...formState, email: v })}
              />

              <Input
                isRequired
                label="Hire Date"
                type="date"
                value={formState.hire_date}
                onValueChange={(v) =>
                  setFormState({ ...formState, hire_date: v })
                }
              />

              <Input
                isRequired
                label="Hourly Rate"
                placeholder="0.00"
                type="number"
                value={formState.hourly_rate.toString()}
                onValueChange={(v) =>
                  setFormState({
                    ...formState,
                    hourly_rate: parseFloat(v) || 0,
                  })
                }
              />

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    checked={formState.is_active ?? true}
                    className="rounded"
                    type="checkbox"
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        is_active: e.target.checked,
                      })
                    }
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
            <Button color="primary" onPress={handleUpdateCashier}>
              Update Cashier
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <ModalContent>
          <ModalHeader>Delete Cashier</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete cashier{" "}
              <span className="font-bold">{selectedCashier?.name}</span>?
            </p>
            <p className="text-sm text-default-500">
              This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleDeleteCashier}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
