"use client";

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
  ExclamationTriangleIcon,
  CheckIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

import { InventoryService } from "@/services/inventory.service";

export default function InventoryPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [reasons, setReasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [adjustmentForm, setAdjustmentForm] = useState({
    menu_item_id: 0,
    quantity: 0,
    reason_id: 0,
    notes: "",
  });

  const [reasonForm, setReasonForm] = useState({
    reason_name: "",
    requires_approval: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [alertsRes, reasonsRes] = await Promise.all([
        InventoryService.getLowStockAlerts(),
        InventoryService.getAdjustmentReasons(),
      ]);

      if (alertsRes.success) {
        setAlerts(alertsRes.data || []);
      }

      if (reasonsRes.success) {
        setReasons(reasonsRes.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch inventory data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: number) => {
    try {
      await InventoryService.acknowledgeAlert(alertId);
      fetchData(); // Refresh
    } catch (error) {
      console.error("Failed to acknowledge alert:", error);
    }
  };

  const handleAdjustStock = async () => {
    try {
      await InventoryService.adjustStock(adjustmentForm);
      setShowAdjustModal(false);
      setAdjustmentForm({
        menu_item_id: 0,
        quantity: 0,
        reason_id: 0,
        notes: "",
      });
      fetchData();
    } catch (error) {
      console.error("Failed to adjust stock:", error);
    }
  };

  const handleCreateReason = async () => {
    try {
      await InventoryService.createAdjustmentReason(reasonForm);
      setShowReasonModal(false);
      setReasonForm({ reason_name: "", requires_approval: false });
      fetchData();
    } catch (error) {
      console.error("Failed to create reason:", error);
    }
  };

  const openAdjustModal = (item: any) => {
    setSelectedItem(item);
    setAdjustmentForm({
      ...adjustmentForm,
      menu_item_id: item.menu_item_id,
    });
    setShowAdjustModal(true);
  };

  const filteredAlerts = alerts.filter((alert) =>
    alert.item_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-default-500 mt-1">
            Monitor stock levels and adjust inventory
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            color="secondary"
            startContent={<PlusIcon className="h-5 w-5" />}
            onPress={() => setShowReasonModal(true)}
          >
            New Reason
          </Button>
          <Button
            color="primary"
            startContent={<PlusIcon className="h-5 w-5" />}
            onPress={() => setShowAdjustModal(true)}
          >
            Adjust Stock
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-danger/10 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-danger" />
              </div>
              <div>
                <p className="text-sm text-default-500">Low Stock Alerts</p>
                <p className="text-2xl font-bold">
                  {alerts.filter((a) => !a.acknowledged_at).length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-success/10 rounded-lg">
                <CheckIcon className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-default-500">Acknowledged</p>
                <p className="text-2xl font-bold">
                  {alerts.filter((a) => a.acknowledged_at).length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <MagnifyingGlassIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-default-500">Adjustment Reasons</p>
                <p className="text-2xl font-bold">{reasons.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Search */}
      <Input
        className="max-w-md"
        placeholder="Search items..."
        startContent={
          <MagnifyingGlassIcon className="h-5 w-5 text-default-400" />
        }
        onValueChange={setSearchTerm}
      />

      {/* Low Stock Alerts Table */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold">Low Stock Alerts</h3>
        </CardHeader>
        <CardBody>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <Table aria-label="Low stock alerts">
              <TableHeader>
                <TableColumn>ITEM</TableColumn>
                <TableColumn>CURRENT STOCK</TableColumn>
                <TableColumn>MIN LEVEL</TableColumn>
                <TableColumn>ALERT TYPE</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No low stock alerts">
                {filteredAlerts.map((alert) => (
                  <TableRow key={alert.alert_id}>
                    <TableCell>{alert.item_name}</TableCell>
                    <TableCell>
                      <span
                        className={
                          alert.current_stock < alert.minimum_stock_level
                            ? "text-danger font-semibold"
                            : ""
                        }
                      >
                        {alert.current_stock}
                      </span>
                    </TableCell>
                    <TableCell>{alert.minimum_stock_level}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          alert.alert_type === "critical"
                            ? "bg-danger text-white"
                            : alert.alert_type === "low"
                              ? "bg-warning text-white"
                              : "bg-default-200"
                        }`}
                      >
                        {alert.alert_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      {alert.acknowledged_at ? (
                        <span className="text-success text-sm">
                          Acknowledged
                        </span>
                      ) : (
                        <span className="text-danger text-sm">Pending</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          color="primary"
                          size="sm"
                          onPress={() => openAdjustModal(alert)}
                        >
                          Adjust
                        </Button>
                        {!alert.acknowledged_at && (
                          <Button
                            color="success"
                            size="sm"
                            onPress={() =>
                              handleAcknowledgeAlert(alert.alert_id)
                            }
                          >
                            Acknowledge
                          </Button>
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

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={showAdjustModal}
        size="lg"
        onClose={() => setShowAdjustModal(false)}
      >
        <ModalContent>
          <ModalHeader>Adjust Stock</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Menu Item ID"
                type="number"
                onValueChange={(v) =>
                  setAdjustmentForm({
                    ...adjustmentForm,
                    menu_item_id: parseInt(v) || 0,
                  })
                }
              />
              <Input
                label="Quantity Change (use negative for decrease)"
                type="number"
                onValueChange={(v) =>
                  setAdjustmentForm({
                    ...adjustmentForm,
                    quantity: parseInt(v) || 0,
                  })
                }
              />
              <Select
                label="Reason"
                placeholder="Select a reason"
                selectedKeys={
                  adjustmentForm.reason_id
                    ? [adjustmentForm.reason_id.toString()]
                    : []
                }
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0];

                  setAdjustmentForm({
                    ...adjustmentForm,
                    reason_id: parseInt(selected as string) || 0,
                  });
                }}
              >
                {reasons.map((reason) => (
                  <SelectItem key={reason.reason_id}>
                    {reason.reason_name}
                  </SelectItem>
                ))}
              </Select>
              <Input
                label="Notes (optional)"
                onValueChange={(v) =>
                  setAdjustmentForm({ ...adjustmentForm, notes: v })
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowAdjustModal(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleAdjustStock}>
              Adjust Stock
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create Reason Modal */}
      <Modal isOpen={showReasonModal} onClose={() => setShowReasonModal(false)}>
        <ModalContent>
          <ModalHeader>Create Adjustment Reason</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Reason Name"
                onValueChange={(v) =>
                  setReasonForm({ ...reasonForm, reason_name: v })
                }
              />
              <label className="flex items-center gap-2">
                <input
                  checked={reasonForm.requires_approval}
                  type="checkbox"
                  onChange={(e) =>
                    setReasonForm({
                      ...reasonForm,
                      requires_approval: e.target.checked,
                    })
                  }
                />
                <span>Requires Approval</span>
              </label>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowReasonModal(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleCreateReason}>
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
