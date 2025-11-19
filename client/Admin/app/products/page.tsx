"use client";

import { useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";

import { SearchIcon } from "@/components/icons";

export default function ProductsPage() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data
  const products = [
    {
      id: 1,
      name: "Chocolate Cake",
      category: "Cakes",
      price: "$15.00",
      stock: 24,
      status: "active",
      image: "🍫",
    },
    {
      id: 2,
      name: "Croissant",
      category: "Pastries",
      price: "$4.00",
      stock: 45,
      status: "active",
      image: "🥐",
    },
    {
      id: 3,
      name: "Red Velvet Cake",
      category: "Cakes",
      price: "$18.00",
      stock: 12,
      status: "active",
      image: "🎂",
    },
    {
      id: 4,
      name: "Blueberry Muffin",
      category: "Pastries",
      price: "$4.00",
      stock: 0,
      status: "out_of_stock",
      image: "🧁",
    },
    {
      id: 5,
      name: "Espresso",
      category: "Beverages",
      price: "$3.50",
      stock: 100,
      status: "active",
      image: "☕",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "out_of_stock":
        return "danger";
      case "inactive":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Products</h1>
          <p className="text-default-600">Manage your product catalog</p>
        </div>
        <Button
          size="lg"
          className="bg-golden-gradient text-cream-white font-bold shadow-golden"
          onPress={onOpen}
        >
          + Add Product
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <Input
              isClearable
              placeholder="Search products..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<SearchIcon size={20} />}
              className="flex-1"
              size="lg"
            />
            <Dropdown>
              <DropdownTrigger>
                <Button variant="bordered" size="lg">
                  Category: All
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Category filter">
                <DropdownItem key="all">All Categories</DropdownItem>
                <DropdownItem key="cakes">Cakes</DropdownItem>
                <DropdownItem key="pastries">Pastries</DropdownItem>
                <DropdownItem key="beverages">Beverages</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger>
                <Button variant="bordered" size="lg">
                  Status: All
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Status filter">
                <DropdownItem key="all">All Status</DropdownItem>
                <DropdownItem key="active">Active</DropdownItem>
                <DropdownItem key="out_of_stock">Out of Stock</DropdownItem>
                <DropdownItem key="inactive">Inactive</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </CardBody>
      </Card>

      {/* Products Table */}
      <Card className="card-hover">
        <CardBody>
          <Table
            aria-label="Products table"
            className="min-h-[400px]"
          >
            <TableHeader>
              <TableColumn>PRODUCT</TableColumn>
              <TableColumn>CATEGORY</TableColumn>
              <TableColumn>PRICE</TableColumn>
              <TableColumn>STOCK</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{product.image}</div>
                      <span className="font-semibold">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="font-semibold">{product.price}</TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={product.stock > 10 ? "success" : product.stock > 0 ? "warning" : "danger"}
                      variant="flat"
                    >
                      {product.stock} units
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={getStatusColor(product.status)}
                      variant="flat"
                      className="capitalize"
                    >
                      {product.status.replace("_", " ")}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" color="primary" variant="flat">
                        Edit
                      </Button>
                      <Button size="sm" color="danger" variant="flat">
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Add Product Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Add New Product</ModalHeader>
              <ModalBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Product Name" placeholder="Enter product name" size="lg" />
                  <Input label="Category" placeholder="Select category" size="lg" />
                  <Input label="Price" placeholder="0.00" startContent="$" size="lg" />
                  <Input label="Stock" placeholder="0" type="number" size="lg" />
                  <Input label="SKU" placeholder="Enter SKU" size="lg" className="md:col-span-2" />
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      className="w-full p-3 border-2 border-default-200 rounded-lg focus:border-golden-orange outline-none"
                      rows={4}
                      placeholder="Enter product description"
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button className="bg-golden-gradient text-cream-white" onPress={onClose}>
                  Add Product
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
