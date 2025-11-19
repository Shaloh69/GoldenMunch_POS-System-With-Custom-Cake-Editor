"use client";

import { useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";

import { SearchIcon } from "@/components/icons";

export default function OrdersPage() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<string | number>("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Mock data
  const orders = [
    {
      id: "#1234",
      customer: "John Doe",
      date: "2024-01-15 14:30",
      items: 3,
      total: "$45.90",
      status: "completed",
      paymentMethod: "Card",
    },
    {
      id: "#1235",
      customer: "Jane Smith",
      date: "2024-01-15 14:25",
      items: 2,
      total: "$32.50",
      status: "pending",
      paymentMethod: "Cash",
    },
    {
      id: "#1236",
      customer: "Bob Johnson",
      date: "2024-01-15 14:20",
      items: 5,
      total: "$87.20",
      status: "processing",
      paymentMethod: "E-wallet",
    },
    {
      id: "#1237",
      customer: "Alice Brown",
      date: "2024-01-15 14:15",
      items: 1,
      total: "$15.00",
      status: "completed",
      paymentMethod: "Card",
    },
    {
      id: "#1238",
      customer: "Charlie Wilson",
      date: "2024-01-15 14:10",
      items: 4,
      total: "$62.80",
      status: "cancelled",
      paymentMethod: "Cash",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "processing":
        return "warning";
      case "pending":
        return "default";
      case "cancelled":
        return "danger";
      default:
        return "default";
    }
  };

  const viewOrderDetails = (order: any) => {
    setSelectedOrder(order);
    onOpen();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Orders</h1>
          <p className="text-default-600">View and manage customer orders</p>
        </div>
        <Button
          size="lg"
          className="bg-golden-gradient text-cream-white font-bold shadow-golden"
        >
          + New Order
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
            <Tabs
              size="lg"
              selectedKey={selectedTab}
              onSelectionChange={setSelectedTab}
              classNames={{
                tabList: "bg-default-100",
                cursor: "bg-golden-gradient",
                tab: "font-semibold",
              }}
            >
              <Tab key="all" title="All Orders" />
              <Tab key="pending" title="Pending" />
              <Tab key="processing" title="Processing" />
              <Tab key="completed" title="Completed" />
              <Tab key="cancelled" title="Cancelled" />
            </Tabs>

            <Input
              isClearable
              placeholder="Search orders by ID or customer..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<SearchIcon size={20} />}
              size="lg"
            />
          </div>
        </CardBody>
      </Card>

      {/* Orders Table */}
      <Card className="card-hover">
        <CardBody>
          <Table
            aria-label="Orders table"
            className="min-h-[500px]"
          >
            <TableHeader>
              <TableColumn>ORDER ID</TableColumn>
              <TableColumn>CUSTOMER</TableColumn>
              <TableColumn>DATE & TIME</TableColumn>
              <TableColumn>ITEMS</TableColumn>
              <TableColumn>TOTAL</TableColumn>
              <TableColumn>PAYMENT</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-bold text-primary">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell className="text-sm">{order.date}</TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat">
                      {order.items} items
                    </Chip>
                  </TableCell>
                  <TableCell className="font-semibold text-lg">{order.total}</TableCell>
                  <TableCell>{order.paymentMethod}</TableCell>
                  <TableCell>
                    <Chip
                      color={getStatusColor(order.status)}
                      size="sm"
                      variant="flat"
                      className="capitalize"
                    >
                      {order.status}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        onPress={() => viewOrderDetails(order)}
                      >
                        View
                      </Button>
                      {order.status !== "completed" && order.status !== "cancelled" && (
                        <Button size="sm" color="success" variant="flat">
                          Complete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Order Details Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="3xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Order Details {selectedOrder?.id}
              </ModalHeader>
              <ModalBody>
                {selectedOrder && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-default-600">Customer</p>
                        <p className="font-semibold">{selectedOrder.customer}</p>
                      </div>
                      <div>
                        <p className="text-sm text-default-600">Date & Time</p>
                        <p className="font-semibold">{selectedOrder.date}</p>
                      </div>
                      <div>
                        <p className="text-sm text-default-600">Payment Method</p>
                        <p className="font-semibold">{selectedOrder.paymentMethod}</p>
                      </div>
                      <div>
                        <p className="text-sm text-default-600">Status</p>
                        <Chip
                          color={getStatusColor(selectedOrder.status)}
                          className="capitalize"
                        >
                          {selectedOrder.status}
                        </Chip>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-bold mb-3">Order Items</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 bg-default-100 rounded-lg">
                          <div>
                            <p className="font-semibold">Chocolate Cake</p>
                            <p className="text-sm text-default-600">Qty: 2</p>
                          </div>
                          <p className="font-bold">$30.00</p>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-default-100 rounded-lg">
                          <div>
                            <p className="font-semibold">Croissant</p>
                            <p className="text-sm text-default-600">Qty: 1</p>
                          </div>
                          <p className="font-bold">$4.00</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">{selectedOrder.total}</span>
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button className="bg-golden-gradient text-cream-white">
                  Print Receipt
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
