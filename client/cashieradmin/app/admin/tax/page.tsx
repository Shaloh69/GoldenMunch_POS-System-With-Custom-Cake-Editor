"use client";

import type { TaxRule, CreateTaxRuleRequest, ItemType } from "@/types/api";

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
import { Select, SelectItem } from "@heroui/select";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  DocumentTextIcon,
  CalculatorIcon,
} from "@heroicons/react/24/outline";

import { TaxService } from "@/services/tax.service";
import { TaxType } from "@/types/api";

// Types
interface TaxFormState extends CreateTaxRuleRequest {
  tax_id?: number;
}

interface TaxStats {
  totalRules: number;
  percentageRules: number;
  fixedRules: number;
}

export default function TaxPage() {
  // State Management
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState<TaxStats>({
    totalRules: 0,
    percentageRules: 0,
    fixedRules: 0,
  });

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTaxRule, setSelectedTaxRule] = useState<TaxRule | null>(null);

  // Form State
  const [formState, setFormState] = useState<TaxFormState>({
    tax_name: "",
    tax_type: TaxType.PERCENTAGE,
    tax_value: 0,
    applies_to_item_types: [],
    is_inclusive: false,
    effective_date: new Date().toISOString().split("T")[0],
  });

  // Initial Data Fetch
  useEffect(() => {
    fetchTaxRules();
  }, []);

  // Calculate Stats
  useEffect(() => {
    const percentage = taxRules.filter(
      (t) => t.tax_type === TaxType.PERCENTAGE,
    ).length;
    const fixed = taxRules.filter((t) => t.tax_type === TaxType.FIXED).length;

    setStats({
      totalRules: taxRules.length,
      percentageRules: percentage,
      fixedRules: fixed,
    });
  }, [taxRules]);

  // API Calls
  const fetchTaxRules = async () => {
    try {
      setLoading(true);
      const response = await TaxService.getTaxRules();

      if (response.success) {
        setTaxRules(Array.isArray(response.data) ? response.data : []);
      } else {
        console.error("Failed to fetch tax rules:", response.message);
      }
    } catch (error) {
      console.error("Failed to fetch tax rules:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTaxRule = async () => {
    try {
      const response = await TaxService.createTaxRule(formState);

      if (response.success) {
        setShowCreateModal(false);
        resetForm();
        fetchTaxRules();
      } else {
        console.error("Failed to create tax rule:", response.message);
      }
    } catch (error) {
      console.error("Failed to create tax rule:", error);
    }
  };

  const handleUpdateTaxRule = async () => {
    if (!selectedTaxRule) return;

    try {
      const updateData: Partial<CreateTaxRuleRequest> = { ...formState };

      delete (updateData as any).tax_id;

      const response = await TaxService.updateTaxRule(
        selectedTaxRule.tax_id,
        updateData,
      );

      if (response.success) {
        setShowEditModal(false);
        resetForm();
        fetchTaxRules();
      } else {
        console.error("Failed to update tax rule:", response.message);
      }
    } catch (error) {
      console.error("Failed to update tax rule:", error);
    }
  };

  // Form Handlers
  const resetForm = () => {
    setFormState({
      tax_name: "",
      tax_type: TaxType.PERCENTAGE,
      tax_value: 0,
      applies_to_item_types: [],
      is_inclusive: false,
      effective_date: new Date().toISOString().split("T")[0],
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (taxRule: TaxRule) => {
    setSelectedTaxRule(taxRule);
    setFormState({
      tax_id: taxRule.tax_id,
      tax_name: taxRule.tax_name,
      tax_type: taxRule.tax_type,
      tax_value: taxRule.tax_value,
      applies_to_item_types: taxRule.applies_to_item_types,
      is_inclusive: taxRule.is_inclusive,
      effective_date: taxRule.effective_date,
    });
    setShowEditModal(true);
  };

  // Filtering
  const filteredTaxRules = taxRules.filter((rule) =>
    rule.tax_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Helper Functions
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-PH");
  };

  const formatTaxValue = (type: TaxType, value: number) => {
    if (type === TaxType.PERCENTAGE) {
      return `${value}%`;
    }

    return `₱${parseFloat(value.toString()).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  };

  const itemTypeOptions = [
    "cake",
    "pastry",
    "beverage",
    "coffee",
    "sandwich",
    "bread",
    "dessert",
    "snack",
    "other",
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tax Rules Management</h1>
          <p className="text-default-500 mt-1">Configure tax rules and rates</p>
        </div>
        <Button
          color="primary"
          startContent={<PlusIcon className="h-5 w-5" />}
          onPress={openCreateModal}
        >
          New Tax Rule
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-default-500">Total Tax Rules</p>
                <p className="text-2xl font-bold">{stats.totalRules}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-success/10 rounded-lg">
                <CalculatorIcon className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-default-500">Percentage Rules</p>
                <p className="text-2xl font-bold">{stats.percentageRules}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-warning/10 rounded-lg">
                <CalculatorIcon className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-default-500">Fixed Amount Rules</p>
                <p className="text-2xl font-bold">{stats.fixedRules}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Search */}
      <Input
        className="max-w-md"
        placeholder="Search tax rules by name..."
        startContent={
          <MagnifyingGlassIcon className="h-5 w-5 text-default-400" />
        }
        onValueChange={setSearchTerm}
      />

      {/* Tax Rules Table */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold">All Tax Rules</h3>
        </CardHeader>
        <CardBody>
          {loading ? (
            <p>Loading tax rules...</p>
          ) : (
            <Table aria-label="Tax rules list">
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>TYPE</TableColumn>
                <TableColumn>RATE</TableColumn>
                <TableColumn>APPLIES TO</TableColumn>
                <TableColumn>INCLUSIVE</TableColumn>
                <TableColumn>EFFECTIVE DATE</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No tax rules found">
                {filteredTaxRules.map((rule) => (
                  <TableRow key={rule.tax_id}>
                    <TableCell>
                      <span className="font-semibold">{rule.tax_name}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          rule.tax_type === TaxType.PERCENTAGE
                            ? "bg-primary/10 text-primary"
                            : "bg-success/10 text-success"
                        }`}
                      >
                        {rule.tax_type.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">
                        {formatTaxValue(rule.tax_type, rule.tax_value)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {rule.applies_to_item_types.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {rule.applies_to_item_types
                            .slice(0, 3)
                            .map((type) => (
                              <span
                                key={type}
                                className="px-2 py-0.5 bg-default-100 rounded text-xs"
                              >
                                {type}
                              </span>
                            ))}
                          {rule.applies_to_item_types.length > 3 && (
                            <span className="text-xs text-default-400">
                              +{rule.applies_to_item_types.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-default-400 text-sm">
                          All items
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          rule.is_inclusive
                            ? "bg-success/10 text-success"
                            : "bg-default-100"
                        }`}
                      >
                        {rule.is_inclusive ? "Inclusive" : "Exclusive"}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(rule.effective_date)}</TableCell>
                    <TableCell>
                      <Button
                        isIconOnly
                        color="primary"
                        size="sm"
                        variant="light"
                        onPress={() => openEditModal(rule)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Create Tax Rule Modal */}
      <Modal
        isOpen={showCreateModal}
        size="lg"
        onClose={() => setShowCreateModal(false)}
      >
        <ModalContent>
          <ModalHeader>Create New Tax Rule</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                isRequired
                label="Tax Name"
                placeholder="e.g., VAT, Sales Tax"
                onValueChange={(v) =>
                  setFormState({ ...formState, tax_name: v })
                }
              />

              <Select
                isRequired
                label="Tax Type"
                selectedKeys={[formState.tax_type]}
                onSelectionChange={(keys) => {
                  setFormState({
                    ...formState,
                    tax_type: Array.from(keys)[0] as TaxType,
                  });
                }}
              >
                <SelectItem key={TaxType.PERCENTAGE}>Percentage</SelectItem>
                <SelectItem key={TaxType.FIXED}>Fixed Amount</SelectItem>
              </Select>

              <Input
                isRequired
                label={
                  formState.tax_type === TaxType.PERCENTAGE
                    ? "Tax Rate (%)"
                    : "Tax Amount (₱)"
                }
                placeholder={
                  formState.tax_type === TaxType.PERCENTAGE ? "12" : "50"
                }
                type="number"
                onValueChange={(v) =>
                  setFormState({ ...formState, tax_value: parseFloat(v) || 0 })
                }
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Applies to Item Types (optional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {itemTypeOptions.map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        checked={formState.applies_to_item_types.includes(
                          type as ItemType,
                        )}
                        className="rounded"
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormState({
                              ...formState,
                              applies_to_item_types: [
                                ...formState.applies_to_item_types,
                                type as ItemType,
                              ],
                            });
                          } else {
                            setFormState({
                              ...formState,
                              applies_to_item_types:
                                formState.applies_to_item_types.filter(
                                  (t) => t !== type,
                                ),
                            });
                          }
                        }}
                      />
                      <span className="text-sm capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Input
                isRequired
                label="Effective Date"
                type="date"
                onValueChange={(v) =>
                  setFormState({ ...formState, effective_date: v })
                }
              />

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    checked={formState.is_inclusive}
                    className="rounded"
                    type="checkbox"
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        is_inclusive: e.target.checked,
                      })
                    }
                  />
                  <span className="text-sm">
                    Is Inclusive (included in price)
                  </span>
                </label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleCreateTaxRule}>
              Create Tax Rule
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Tax Rule Modal */}
      <Modal
        isOpen={showEditModal}
        size="lg"
        onClose={() => setShowEditModal(false)}
      >
        <ModalContent>
          <ModalHeader>Edit Tax Rule</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                isRequired
                label="Tax Name"
                placeholder="e.g., VAT, Sales Tax"
                onValueChange={(v) =>
                  setFormState({ ...formState, tax_name: v })
                }
              />

              <Select
                isRequired
                label="Tax Type"
                selectedKeys={[formState.tax_type]}
                onSelectionChange={(keys) => {
                  setFormState({
                    ...formState,
                    tax_type: Array.from(keys)[0] as TaxType,
                  });
                }}
              >
                <SelectItem key={TaxType.PERCENTAGE}>Percentage</SelectItem>
                <SelectItem key={TaxType.FIXED}>Fixed Amount</SelectItem>
              </Select>

              <Input
                isRequired
                label={
                  formState.tax_type === TaxType.PERCENTAGE
                    ? "Tax Rate (%)"
                    : "Tax Amount (₱)"
                }
                placeholder={
                  formState.tax_type === TaxType.PERCENTAGE ? "12" : "50"
                }
                type="number"
                onValueChange={(v) =>
                  setFormState({ ...formState, tax_value: parseFloat(v) || 0 })
                }
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Applies to Item Types (optional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {itemTypeOptions.map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        checked={formState.applies_to_item_types.includes(
                          type as ItemType,
                        )}
                        className="rounded"
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormState({
                              ...formState,
                              applies_to_item_types: [
                                ...formState.applies_to_item_types,
                                type as ItemType,
                              ],
                            });
                          } else {
                            setFormState({
                              ...formState,
                              applies_to_item_types:
                                formState.applies_to_item_types.filter(
                                  (t) => t !== type,
                                ),
                            });
                          }
                        }}
                      />
                      <span className="text-sm capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Input
                isRequired
                label="Effective Date"
                type="date"
                onValueChange={(v) =>
                  setFormState({ ...formState, effective_date: v })
                }
              />

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    checked={formState.is_inclusive}
                    className="rounded"
                    type="checkbox"
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        is_inclusive: e.target.checked,
                      })
                    }
                  />
                  <span className="text-sm">
                    Is Inclusive (included in price)
                  </span>
                </label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleUpdateTaxRule}>
              Update Tax Rule
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
