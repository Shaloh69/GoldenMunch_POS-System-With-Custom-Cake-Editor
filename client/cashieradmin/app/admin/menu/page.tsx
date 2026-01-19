"use client";

import type { MenuItem, CreateMenuItemRequest, Category, MenuItemType, UnitOfMeasure } from "@/types/api";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Card, CardBody } from "@heroui/card";
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
  FunnelIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { Checkbox } from "@heroui/checkbox";

import { MenuService } from "@/services/menu.service";
import { getImageUrl } from "@/utils/imageUtils";

// Dynamically import modals
const AddItemTypeModal = dynamic(
  () => import("@/components/admin/menu/AddItemTypeModal"),
  { ssr: false }
);
const AddUnitModal = dynamic(
  () => import("@/components/admin/menu/AddUnitModal"),
  { ssr: false }
);

// Utility function to safely format price
const formatPrice = (price: any): string => {
  if (price === null || price === undefined || price === "") {
    return "0.00";
  }
  const numPrice =
    typeof price === "string" ? parseFloat(price) : Number(price);

  if (isNaN(numPrice)) {
    return "0.00";
  }

  return numPrice.toFixed(2);
};

// Utility function to safely convert to number
const toNumber = (value: any, defaultValue: number = 0): number => {
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }
  const num = typeof value === "string" ? parseFloat(value) : Number(value);

  return isNaN(num) ? defaultValue : num;
};

// Utility function to safely get display value for stock
const formatStock = (item: MenuItem): string => {
  if (item.is_infinite_stock) {
    return "∞";
  }

  return toNumber(item.stock_quantity, 0).toString();
};

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState<Partial<CreateMenuItemRequest>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    item: MenuItem | null;
  }>({ isOpen: false, item: null });
  const [itemTypes, setItemTypes] = useState<MenuItemType[]>([]);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [isAddItemTypeModalOpen, setIsAddItemTypeModalOpen] = useState(false);
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [bulkDeleteConfirmModal, setBulkDeleteConfirmModal] = useState(false);
  const [stockAdjusting, setStockAdjusting] = useState<Record<number, boolean>>(
    {},
  );
  const [priceModalItem, setPriceModalItem] = useState<MenuItem | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [initialPrice, setInitialPrice] = useState<string>("");

  // Search, Filter, and Pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "name" | "price" | "stock" | "popularity"
  >("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => {
    loadMenuItems();
    loadCategories();
    loadItemTypes();
    loadUnits();
  }, []);

  // Analytics stats
  const analytics = useMemo(() => {
    const totalItems = items.length;
    const lowStockItems = items.filter(
      (item) =>
        !item.is_infinite_stock &&
        toNumber(item.stock_quantity, 0) <= item.min_stock_level,
    ).length;
    const totalValue = items.reduce(
      (sum, item) =>
        sum +
        toNumber(item.current_price, 0) * toNumber(item.stock_quantity, 0),
      0,
    );
    const avgPrice =
      items.length > 0
        ? items.reduce(
            (sum, item) => sum + toNumber(item.current_price, 0),
            0,
          ) / items.length
        : 0;
    const outOfStock = items.filter(
      (item) => item.status === "sold_out",
    ).length;

    return {
      totalItems,
      lowStockItems,
      totalValue,
      avgPrice,
      outOfStock,
    };
  }, [items]);

  // Filtered and paginated items
  const filteredAndPaginatedItems = useMemo(() => {
    // Filter
    let filtered = items.filter((item) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Type filter
      const matchesType = filterType === "all" || item.item_type === filterType;

      // Status filter
      const matchesStatus =
        filterStatus === "all" || item.status === filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      // Always put sold_out and discontinued items last, regardless of sort
      const aOutOfStock = a.status === "sold_out" || a.status === "discontinued";
      const bOutOfStock = b.status === "sold_out" || b.status === "discontinued";

      if (aOutOfStock && !bOutOfStock) return 1; // a goes to end
      if (!aOutOfStock && bOutOfStock) return -1; // b goes to end
      // If both same status, continue with normal sort

      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "price":
          comparison =
            toNumber(a.current_price, 0) - toNumber(b.current_price, 0);
          break;
        case "stock":
          comparison =
            toNumber(a.stock_quantity, 0) - toNumber(b.stock_quantity, 0);
          break;
        case "popularity":
          comparison = (a.popularity_score || 0) - (b.popularity_score || 0);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    // Paginate
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return {
      items: filtered.slice(startIndex, endIndex),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / itemsPerPage),
    };
  }, [
    items,
    searchQuery,
    filterType,
    filterStatus,
    sortBy,
    sortOrder,
    currentPage,
    itemsPerPage,
  ]);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await MenuService.getMenuItems();

      if (response.success && response.data) {
        setItems(response.data);
      } else {
        setError(response.message || "Failed to load menu items");
      }
    } catch (error: any) {
      console.error("Failed to load menu items:", error);
      setError(error?.message || "An error occurred while loading menu items");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await MenuService.getCategories();

      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error: any) {
      console.error("Failed to load categories:", error);
    }
  };

  const loadItemTypes = async () => {
    try {
      const response = await MenuService.getItemTypes();

      if (response.success && response.data) {
        setItemTypes(response.data);
      }
    } catch (error: any) {
      console.error("Failed to load item types:", error);
    }
  };

  const loadUnits = async () => {
    try {
      const response = await MenuService.getUnits();

      if (response.success && response.data) {
        setUnits(response.data);
      }
    } catch (error: any) {
      console.error("Failed to load units:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.item_type_id || !formData.unit_of_measure_id || formData.preparation_time_minutes === undefined) {
        setError("Name, Item Type, Unit of Measure, and Preparation Time are required");
        return;
      }

      // Validate image for new items
      if (!editingItem && !imageFile) {
        setError("Image is required for new menu items");
        return;
      }

      setSaving(true);
      setError(null);

      // Ensure numeric fields are properly typed
      const sanitizedData: any = {
        name: formData.name.trim(),
        description: formData.description?.trim() || "",
        item_type_id: formData.item_type_id,
        unit_of_measure_id: formData.unit_of_measure_id || (units.length > 0 ? units[0].unit_id : 1),
        stock_quantity: toNumber(formData.stock_quantity, 0),
        min_stock_level: toNumber(formData.min_stock_level, 0),
        is_infinite_stock: Boolean(formData.is_infinite_stock),
        can_customize: false, // Always false - feature disabled
        can_preorder: false, // Always false - feature disabled
        is_featured: Boolean(formData.is_featured),
        preparation_time_minutes: toNumber(
          formData.preparation_time_minutes,
          0,
        ),
        // Send null for empty strings to avoid JSON parsing errors in database
        allergen_info: formData.allergen_info?.trim() || null,
        nutritional_info: formData.nutritional_info?.trim() || null,
      };

      let response;

      if (editingItem) {
        // Update existing item
        response = await MenuService.updateMenuItem(
          editingItem.menu_item_id,
          sanitizedData,
          imageFile || undefined,
        );
      } else {
        // Create new item
        response = await MenuService.createMenuItem(
          sanitizedData,
          imageFile || undefined,
        );
      }

      if (response.success) {
        const itemId = editingItem?.menu_item_id || response.data?.menu_item_id;

        // Assign categories
        if (itemId && selectedCategoryIds.size > 0) {
          try {
            // If editing, first unassign all existing categories
            if (editingItem && editingItem.categories) {
              for (const category of editingItem.categories) {
                try {
                  await MenuService.unassignItemFromCategory({
                    menu_item_id: itemId,
                    category_id: category.category_id,
                  });
                } catch (err) {
                  console.error("Failed to unassign category:", err);
                }
              }
            }

            // Assign selected categories
            for (const categoryId of selectedCategoryIds) {
              try {
                await MenuService.assignItemToCategory({
                  menu_item_id: itemId,
                  category_id: categoryId,
                });
              } catch (err: any) {
                console.error("Failed to assign category:", err);
              }
            }
          } catch (categoryError: any) {
            console.error("Failed to assign categories:", categoryError);
            setError(
              "Item saved but failed to assign categories: " +
                (categoryError?.message || "Unknown error"),
            );
          }
        }

        setSuccessMessage(
          editingItem
            ? "Menu item updated successfully!"
            : "Menu item created successfully!",
        );
        setTimeout(() => setSuccessMessage(null), 5000);

        // If creating a new item with an initial price, set the price
        if (
          !editingItem &&
          initialPrice &&
          parseFloat(initialPrice) > 0 &&
          response.data?.menu_item_id
        ) {
          try {
            const menuItemId = (response.data as any).menu_item_id;
            const today = new Date().toISOString().split("T")[0];
            const nextYear = new Date();

            nextYear.setFullYear(nextYear.getFullYear() + 1);
            const validUntil = nextYear.toISOString().split("T")[0];

            console.log("Creating initial price:", {
              menu_item_id: menuItemId,
              unit_price: parseFloat(initialPrice),
              valid_from: today,
              valid_until: validUntil,
              price_type: "base",
              is_active: true,
            });

            const priceResponse = await MenuService.addMenuItemPrice({
              menu_item_id: menuItemId,
              unit_price: parseFloat(initialPrice),
              valid_from: today,
              valid_until: validUntil,
              price_type: "base",
              is_active: true,
            });

            console.log("Price creation response:", priceResponse);

            if (!priceResponse.success) {
              throw new Error(
                priceResponse.message || "Failed to create price",
              );
            }
          } catch (priceError: any) {
            console.error("Failed to set initial price:", priceError);
            setError(
              "Item created but failed to set price: " +
                (priceError?.message || "Unknown error"),
            );
            // Don't return early - still close modal and refresh
          }
        }

        onClose();
        await loadMenuItems();
        resetForm();
      } else {
        setError(
          response.message ||
            `Failed to ${editingItem ? "update" : "create"} menu item`,
        );
      }
    } catch (error: any) {
      console.error(
        `Failed to ${editingItem ? "update" : "create"} menu item:`,
        error,
      );
      setError(
        error?.message ||
          `An error occurred while ${editingItem ? "updating" : "creating"} the menu item`,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      item_type_id: item.item_type_id,
      unit_of_measure_id: item.unit_of_measure_id,
      stock_quantity: item.stock_quantity,
      min_stock_level: item.min_stock_level,
      is_infinite_stock: item.is_infinite_stock,
      can_customize: false, // Disabled feature
      can_preorder: false, // Disabled feature
      is_featured: item.is_featured,
      preparation_time_minutes: item.preparation_time_minutes,
      allergen_info: item.allergen_info,
      nutritional_info: item.nutritional_info,
    });
    // Set selected categories
    if (item.categories && item.categories.length > 0) {
      setSelectedCategoryIds(
        new Set(item.categories.map((cat) => cat.category_id)),
      );
    } else {
      setSelectedCategoryIds(new Set());
    }
    onOpen();
  };

  const handleDelete = async (item: MenuItem) => {
    setDeleteConfirmModal({ isOpen: true, item });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmModal.item) return;

    try {
      setError(null);
      const response = await MenuService.deleteMenuItem(
        deleteConfirmModal.item.menu_item_id,
      );

      if (response.success) {
        setSuccessMessage("Menu item deleted successfully!");
        setTimeout(() => setSuccessMessage(null), 5000);
        await loadMenuItems();
      } else {
        setError(response.message || "Failed to delete item");
      }
    } catch (error: any) {
      console.error("Failed to delete item:", error);
      setError(error?.message || "An error occurred while deleting the item");
    } finally {
      setDeleteConfirmModal({ isOpen: false, item: null });
    }
  };

  const handleStockAdjust = async (itemId: number, adjustment: number) => {
    setStockAdjusting((prev) => ({ ...prev, [itemId]: true }));
    try {
      const item = items.find((i) => i.menu_item_id === itemId);

      if (!item) return;

      const newStock = Math.max(
        0,
        toNumber(item.stock_quantity, 0) + adjustment,
      );

      // Prepare update data
      const updateData: any = {
        stock_quantity: newStock,
      };

      // Auto-set status to sold_out when stock reaches 0
      // Auto-set status back to available when stock increases from 0
      if (newStock === 0 && item.status === "available") {
        updateData.status = "sold_out";
      } else if (newStock > 0 && item.status === "sold_out") {
        updateData.status = "available";
      }

      const response = await MenuService.updateMenuItem(itemId, updateData);

      if (response.success) {
        const statusChanged = updateData.status ? ` (${updateData.status})` : "";
        setSuccessMessage(`Stock updated to ${newStock}${statusChanged}`);
        setTimeout(() => setSuccessMessage(null), 3000);
        await loadMenuItems();
      } else {
        setError(response.message || "Failed to update stock");
      }
    } catch (error: any) {
      console.error("Failed to update stock:", error);
      setError(error?.message || "An error occurred while updating stock");
    } finally {
      setStockAdjusting((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const handleStatusToggle = async (itemId: number, currentStatus: string) => {
    const item = items.find((i) => i.menu_item_id === itemId);
    if (!item) return;

    const stock = toNumber(item.stock_quantity, 0);
    const newStatus =
      currentStatus === "available" ? "sold_out" : "available";

    // Prevent marking as sold_out when stock > 0 (unless infinite stock)
    if (newStatus === "sold_out" && stock > 0 && !item.is_infinite_stock) {
      setError("Cannot mark as Sold Out while stock is available. Reduce stock to 0 first.");
      setTimeout(() => setError(null), 4000);
      return;
    }

    // Prevent marking as available when stock is 0 (unless infinite stock)
    if (newStatus === "available" && stock === 0 && !item.is_infinite_stock) {
      setError("Cannot mark as Available while stock is 0. Increase stock first.");
      setTimeout(() => setError(null), 4000);
      return;
    }

    try {
      const response = await MenuService.updateMenuItem(itemId, {
        status: newStatus,
      });

      if (response.success) {
        setSuccessMessage(`Status updated to ${newStatus === "sold_out" ? "Sold Out" : "Available"}`);
        setTimeout(() => setSuccessMessage(null), 3000);
        await loadMenuItems();
      } else {
        setError(response.message || "Failed to update status");
      }
    } catch (error: any) {
      console.error("Failed to update status:", error);
      setError(error?.message || "An error occurred while updating status");
    }
  };

  const handlePriceUpdate = async () => {
    if (!priceModalItem || !newPrice) return;

    const priceValue = parseFloat(newPrice);

    if (isNaN(priceValue) || priceValue < 0) {
      setError("Please enter a valid price");

      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Add new price to price history
      const today = new Date().toISOString().split("T")[0];
      const nextYear = new Date();

      nextYear.setFullYear(nextYear.getFullYear() + 1);
      const validUntil = nextYear.toISOString().split("T")[0];

      const response = await MenuService.addMenuItemPrice({
        menu_item_id: priceModalItem.menu_item_id,
        unit_price: priceValue,
        valid_from: today,
        valid_until: validUntil,
        price_type: "base",
        is_active: true,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to update price");
      }

      setSuccessMessage("Price updated successfully!");
      setTimeout(() => setSuccessMessage(null), 5000);
      setPriceModalItem(null);
      setNewPrice("");
      await loadMenuItems();
    } catch (error: any) {
      console.error("Failed to update price:", error);
      setError(error?.message || "An error occurred while updating price");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(
        filteredAndPaginatedItems.items.map((item) => item.menu_item_id),
      );

      setSelectedItems(allIds);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);

    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    setBulkDeleteConfirmModal(true);
  };

  const confirmBulkDelete = async () => {
    try {
      setError(null);
      const promises = (Array.from(selectedItems) as number[]).map((id) =>
        MenuService.deleteMenuItem(id),
      );

      await Promise.all(promises);
      setSuccessMessage(`Successfully deleted ${selectedItems.size} items`);
      setTimeout(() => setSuccessMessage(null), 5000);
      setSelectedItems(new Set());
      await loadMenuItems();
    } catch (error: any) {
      console.error("Failed to delete items:", error);
      setError(error?.message || "An error occurred while deleting items");
    } finally {
      setBulkDeleteConfirmModal(false);
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    if (selectedItems.size === 0) return;

    try {
      setError(null);
      const promises = (Array.from(selectedItems) as number[]).map((id) =>
        MenuService.updateMenuItem(id, { status: status as any }),
      );

      await Promise.all(promises);
      setSuccessMessage(
        `Successfully updated ${selectedItems.size} items to ${status}`,
      );
      setTimeout(() => setSuccessMessage(null), 5000);
      setSelectedItems(new Set());
      await loadMenuItems();
    } catch (error: any) {
      console.error("Failed to update status:", error);
      setError(error?.message || "An error occurred while updating status");
    }
  };

  const resetForm = () => {
    setFormData({
      unit_of_measure_id: units.length > 0 ? units[0].unit_id : undefined,
      preparation_time_minutes: 0,
    });
    setImageFile(null);
    setError(null);
    setSuccessMessage(null);
    setEditingItem(null);
    setInitialPrice("");
    setSelectedCategoryIds(new Set());
  };

  const handleModalClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
          Menu Management
        </h1>
        <Button
          color="primary"
          startContent={<PlusIcon className="h-5 w-5" />}
          onPress={onOpen}
        >
          Add Menu Item
        </Button>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Total Items</p>
                <p className="text-2xl font-bold text-primary">
                  {analytics.totalItems}
                </p>
              </div>
              <div className="p-3 bg-primary-100 rounded-full">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Inventory Value</p>
                <p className="text-2xl font-bold text-success">
                  ₱{formatPrice(analytics.totalValue)}
                </p>
              </div>
              <div className="p-3 bg-success-100 rounded-full">
                <svg
                  className="h-6 w-6 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Low Stock</p>
                <p className="text-2xl font-bold text-warning">
                  {analytics.lowStockItems}
                </p>
              </div>
              <div className="p-3 bg-warning-100 rounded-full">
                <svg
                  className="h-6 w-6 text-warning"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Avg Price</p>
                <p className="text-2xl font-bold text-secondary">
                  ₱{formatPrice(analytics.avgPrice)}
                </p>
              </div>
              <div className="p-3 bg-secondary-100 rounded-full">
                <svg
                  className="h-6 w-6 text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card> */}
      </div>

      {error && (
        <Card className="bg-danger-50 border-danger">
          <CardBody>
            <p className="text-danger">{error}</p>
          </CardBody>
        </Card>
      )}

      {successMessage && (
        <Card className="bg-success-50 border-success">
          <CardBody>
            <p className="text-success">{successMessage}</p>
          </CardBody>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex gap-4 items-end">
              <Input
                isClearable
                className="flex-1"
                placeholder="Search by name or description..."
                startContent={
                  <MagnifyingGlassIcon className="h-5 w-5 text-default-400" />
                }
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                onClear={() => setSearchQuery("")}
              />
              <Select
                className="w-32"
                label="Items per page"
                selectedKeys={[itemsPerPage.toString()]}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <SelectItem key="10">10</SelectItem>
                <SelectItem key="25">25</SelectItem>
                <SelectItem key="50">50</SelectItem>
                <SelectItem key="100">100</SelectItem>
              </Select>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex items-center gap-2">
                <FunnelIcon className="h-5 w-5 text-default-500" />
                <span className="text-sm font-medium text-default-600">
                  Filters:
                </span>
              </div>
              <Select
                className="w-40"
                label="Type"
                selectedKeys={[filterType]}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <SelectItem key="all">All Types</SelectItem>
                <SelectItem key="cake">Cake</SelectItem>
                <SelectItem key="pastry">Pastry</SelectItem>
                <SelectItem key="beverage">Beverage</SelectItem>
                <SelectItem key="coffee">Coffee</SelectItem>
                <SelectItem key="sandwich">Sandwich</SelectItem>
                <SelectItem key="bread">Bread</SelectItem>
                <SelectItem key="dessert">Dessert</SelectItem>
                <SelectItem key="snack">Snack</SelectItem>
                <SelectItem key="other">Other</SelectItem>
              </Select>
              <Select
                className="w-40"
                label="Status"
                selectedKeys={[filterStatus]}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <SelectItem key="all">All Status</SelectItem>
                <SelectItem key="available">Available</SelectItem>
                <SelectItem key="sold_out">Sold Out</SelectItem>
                <SelectItem key="discontinued">Discontinued</SelectItem>
              </Select>
              <Select
                className="w-40"
                label="Sort By"
                selectedKeys={[sortBy]}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <SelectItem key="name">Name</SelectItem>
                <SelectItem key="price">Price</SelectItem>
                <SelectItem key="stock">Stock</SelectItem>
                <SelectItem key="popularity">Popularity</SelectItem>
              </Select>
              <Button
                size="sm"
                variant="flat"
                onPress={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
              >
                {sortOrder === "asc" ? "↑ Ascending" : "↓ Descending"}
              </Button>
            </div>

            {/* Results Summary */}
            <div className="text-sm text-default-500">
              Showing {filteredAndPaginatedItems.items.length} of{" "}
              {filteredAndPaginatedItems.total} items
              {(searchQuery ||
                filterType !== "all" ||
                filterStatus !== "all") && (
                <Button
                  className="ml-2"
                  size="sm"
                  variant="light"
                  onPress={() => {
                    setSearchQuery("");
                    setFilterType("all");
                    setFilterStatus("all");
                    setCurrentPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {loading ? (
            <div className="flex justify-center p-8">
              <Spinner color="primary" size="lg" />
            </div>
          ) : filteredAndPaginatedItems.total === 0 ? (
            <div className="text-center p-8 text-default-500">
              <p>No menu items found</p>
              {items.length === 0 ? (
                <Button
                  className="mt-4"
                  color="primary"
                  size="sm"
                  startContent={<PlusIcon className="h-4 w-4" />}
                  onPress={onOpen}
                >
                  Add Your First Item
                </Button>
              ) : (
                <p className="mt-2 text-sm">
                  Try adjusting your search or filters
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Bulk Actions Toolbar */}
              {selectedItems.size > 0 && (
                <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      isSelected={true}
                      onChange={() => setSelectedItems(new Set())}
                    />
                    <span className="font-medium">
                      {selectedItems.size} item
                      {selectedItems.size > 1 ? "s" : ""} selected
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      color="success"
                      size="sm"
                      startContent={<CheckCircleIcon className="h-4 w-4" />}
                      variant="flat"
                      onPress={() => handleBulkStatusChange("available")}
                    >
                      Set Available
                    </Button>
                    <Button
                      color="warning"
                      size="sm"
                      startContent={<XCircleIcon className="h-4 w-4" />}
                      variant="flat"
                      onPress={() => handleBulkStatusChange("sold_out")}
                    >
                      Set Sold Out
                    </Button>
                    <Button
                      color="danger"
                      size="sm"
                      startContent={<TrashIcon className="h-4 w-4" />}
                      variant="flat"
                      onPress={handleBulkDelete}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}

              <Table aria-label="Menu items table">
                <TableHeader>
                  <TableColumn width={50}>
                    <Checkbox
                      isSelected={
                        selectedItems.size ===
                          filteredAndPaginatedItems.items.length &&
                        filteredAndPaginatedItems.items.length > 0
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableColumn>
                  <TableColumn>NAME</TableColumn>
                  <TableColumn width={120}>TYPE</TableColumn>
                  <TableColumn width={100}>PRICE</TableColumn>
                  <TableColumn width={160}>STOCK</TableColumn>
                  <TableColumn width={130}>STATUS</TableColumn>
                  <TableColumn width={260}>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {filteredAndPaginatedItems.items.map((item) => (
                    <TableRow key={item.menu_item_id}>
                      <TableCell>
                        <Checkbox
                          isSelected={selectedItems.has(item.menu_item_id)}
                          onChange={(e) =>
                            handleSelectItem(
                              item.menu_item_id,
                              e.target.checked,
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold">
                            {item.name || "N/A"}
                          </span>
                          {item.description && (
                            <span className="text-xs text-default-500 line-clamp-1">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">
                          {item.item_type || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          ₱{formatPrice(item.current_price)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {item.is_infinite_stock ? (
                            <span className="font-medium text-primary text-xl">∞</span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <Button
                                isIconOnly
                                className="min-w-7 h-7 w-7"
                                color="danger"
                                isDisabled={
                                  stockAdjusting[item.menu_item_id] ||
                                  toNumber(item.stock_quantity, 0) <= 0
                                }
                                size="sm"
                                variant="flat"
                                onPress={() =>
                                  handleStockAdjust(item.menu_item_id, -1)
                                }
                              >
                                −
                              </Button>
                              <span
                                className={`font-semibold min-w-12 text-center text-base ${
                                  toNumber(item.stock_quantity, 0) <=
                                  item.min_stock_level
                                    ? "text-danger"
                                    : ""
                                }`}
                              >
                                {formatStock(item)}
                              </span>
                              <Button
                                isIconOnly
                                className="min-w-7 h-7 w-7"
                                color="success"
                                isDisabled={stockAdjusting[item.menu_item_id]}
                                size="sm"
                                variant="flat"
                                onPress={() =>
                                  handleStockAdjust(item.menu_item_id, 1)
                                }
                              >
                                +
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const stock = toNumber(item.stock_quantity, 0);
                          const minStock = item.min_stock_level || 0;
                          const isLowStock = !item.is_infinite_stock && stock > 0 && stock <= minStock;
                          const isSoldOut = item.status === "sold_out" || (!item.is_infinite_stock && stock === 0);

                          // Determine display status
                          let displayStatus: string;
                          let chipColor: "success" | "warning" | "danger" | "default";

                          if (item.status === "discontinued") {
                            displayStatus = "Discontinued";
                            chipColor = "danger";
                          } else if (isSoldOut) {
                            displayStatus = "Sold Out";
                            chipColor = "warning";
                          } else if (isLowStock) {
                            displayStatus = "Low Stock";
                            chipColor = "default";
                          } else {
                            displayStatus = "Available";
                            chipColor = "success";
                          }

                          return (
                            <Chip
                              className="capitalize cursor-pointer"
                              color={chipColor}
                              size="sm"
                              variant="flat"
                              onClick={() =>
                                handleStatusToggle(item.menu_item_id, item.status)
                              }
                            >
                              {displayStatus}
                            </Chip>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1.5 items-center justify-start">
                          <Button
                            color="primary"
                            size="sm"
                            variant="flat"
                            className="min-w-[56px] px-2"
                            onPress={() => handleEdit(item)}
                          >
                            Edit
                          </Button>
                          <Button
                            color="secondary"
                            size="sm"
                            variant="flat"
                            className="min-w-[56px] px-2"
                            onPress={() => {
                              setPriceModalItem(item);
                              setNewPrice(formatPrice(item.current_price));
                            }}
                          >
                            Price
                          </Button>
                          <Button
                            color="danger"
                            size="sm"
                            variant="flat"
                            className="min-w-[60px] px-2"
                            onPress={() => handleDelete(item)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {filteredAndPaginatedItems.totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 px-2">
                  <div className="text-sm text-default-500">
                    Page {currentPage} of {filteredAndPaginatedItems.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      isDisabled={currentPage === 1}
                      size="sm"
                      variant="flat"
                      onPress={() => setCurrentPage(1)}
                    >
                      First
                    </Button>
                    <Button
                      isDisabled={currentPage === 1}
                      size="sm"
                      variant="flat"
                      onPress={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      isDisabled={
                        currentPage === filteredAndPaginatedItems.totalPages
                      }
                      size="sm"
                      variant="flat"
                      onPress={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                    <Button
                      isDisabled={
                        currentPage === filteredAndPaginatedItems.totalPages
                      }
                      size="sm"
                      variant="flat"
                      onPress={() =>
                        setCurrentPage(filteredAndPaginatedItems.totalPages)
                      }
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Item Modal */}
      <Modal
        isOpen={isOpen}
        scrollBehavior="inside"
        size="2xl"
        onClose={handleModalClose}
      >
        <ModalContent>
          <ModalHeader>
            {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
          </ModalHeader>
          <ModalBody>
            {error && (
              <div className="p-3 bg-danger-50 border border-danger rounded-lg mb-4">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}
            <div className="space-y-4">
              <Input
                isRequired
                required
                errorMessage={!formData.name && "Name is required"}
                label="Name"
                placeholder="Enter item name"
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <Textarea
                label="Description"
                minRows={3}
                placeholder="Enter item description"
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
              <Select
                isRequired
                errorMessage={!formData.item_type_id && "Item type is required"}
                label="Item Type"
                placeholder="Select item type"
                selectedKeys={formData.item_type_id ? [formData.item_type_id.toString()] : []}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "add_new") {
                    setIsAddItemTypeModalOpen(true);
                  } else {
                    setFormData({ ...formData, item_type_id: parseInt(value) });
                  }
                }}
              >
                {[
                  <SelectItem key="add_new" className="text-primary font-semibold">
                    + Add New Item Type
                  </SelectItem>,
                  ...itemTypes.map((type) => (
                    <SelectItem key={type.type_id.toString()}>
                      {type.display_name}
                    </SelectItem>
                  ))
                ]}
              </Select>
              <Select
                isRequired
                label="Unit of Measure"
                placeholder="Select unit of measure"
                selectedKeys={formData.unit_of_measure_id ? [formData.unit_of_measure_id.toString()] : []}
                errorMessage={!formData.unit_of_measure_id && "Unit of measure is required"}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "add_new") {
                    setIsAddUnitModalOpen(true);
                  } else {
                    setFormData({ ...formData, unit_of_measure_id: parseInt(value) });
                  }
                }}
              >
                {[
                  <SelectItem key="add_new" className="text-primary font-semibold">
                    + Add New Unit of Measure
                  </SelectItem>,
                  ...units.map((unit) => (
                    <SelectItem key={unit.unit_id.toString()}>
                      {unit.display_name} {unit.abbreviation ? `(${unit.abbreviation})` : ""}
                    </SelectItem>
                  ))
                ]}
              </Select>

              {/* Categories Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-default-700">
                  Categories
                </label>
                <p className="text-xs text-default-500 mb-2">
                  Select which categories this item belongs to
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-default-50 rounded-lg border border-default-200">
                  {categories.length === 0 ? (
                    <p className="text-sm text-default-400 col-span-2">
                      No categories available. Create categories first.
                    </p>
                  ) : (
                    categories.map((category) => (
                      <label
                        key={category.category_id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          checked={selectedCategoryIds.has(
                            category.category_id,
                          )}
                          className="w-4 h-4 rounded border-default-300 text-primary focus:ring-2 focus:ring-primary"
                          type="checkbox"
                          onChange={(e) => {
                            const newSet = new Set(selectedCategoryIds);

                            if (e.target.checked) {
                              newSet.add(category.category_id);
                            } else {
                              newSet.delete(category.category_id);
                            }
                            setSelectedCategoryIds(newSet);
                          }}
                        />
                        <span className="text-sm text-default-700">
                          {category.name}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                {selectedCategoryIds.size > 0 && (
                  <p className="text-xs text-primary">
                    {selectedCategoryIds.size}{" "}
                    {selectedCategoryIds.size === 1 ? "category" : "categories"}{" "}
                    selected
                  </p>
                )}
              </div>

              {!editingItem && (
                <Input
                  description="Set the base price for this item. You can adjust it later."
                  label="Selling Price (₱)"
                  min="0"
                  placeholder="Enter price (e.g., 99.00)"
                  startContent={
                    <span className="text-default-400 text-sm">₱</span>
                  }
                  step="0.01"
                  type="number"
                  onChange={(e) => setInitialPrice(e.target.value)}
                />
              )}
              {!formData.is_infinite_stock && (
                <>
                  <Input
                    label="Stock Quantity"
                    min="0"
                    placeholder="Enter stock quantity"
                    step="1"
                    type="number"
                    value={formData.stock_quantity?.toString() || "0"}
                    onChange={(e) => {
                      const value = e.target.value;

                      setFormData({
                        ...formData,
                        stock_quantity:
                          value === "" ? 0 : parseInt(value, 10) || 0,
                      });
                    }}
                  />
                  <Input
                    description="Alert threshold for low stock notifications"
                    label="Minimum Stock Level"
                    min="0"
                    placeholder="Enter minimum stock level for alerts"
                    step="1"
                    type="number"
                    value={formData.min_stock_level?.toString() || "0"}
                    onChange={(e) => {
                      const value = e.target.value;

                      setFormData({
                        ...formData,
                        min_stock_level:
                          value === "" ? 0 : parseInt(value, 10) || 0,
                      });
                    }}
                  />
                </>
              )}

              {/* Feature Toggles */}
              <div className="space-y-3 p-4 bg-default-50 rounded-lg border border-default-200">
                <p className="text-sm font-semibold text-default-700">
                  Item Features
                </p>
                <div className="space-y-2">
                  {/* <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      checked={formData.is_infinite_stock || false}
                      className="w-4 h-4 rounded border-default-300 text-primary focus:ring-2 focus:ring-primary"
                      type="checkbox"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_infinite_stock: e.target.checked,
                        })
                      }
                    />
                    <div>
                      <span className="text-sm font-medium text-default-700">
                        Infinite Stock
                      </span>
                      <p className="text-xs text-default-500">
                        Item is always available regardless of stock quantity
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-not-allowed opacity-50">
                    <input
                      disabled
                      checked={false}
                      className="w-4 h-4 rounded border-default-300 text-primary focus:ring-2 focus:ring-primary cursor-not-allowed"
                      type="checkbox"
                    />
                    <div>
                      <span className="text-sm font-medium text-default-500">
                        Customizable
                      </span>
                      <p className="text-xs text-default-400">
                        Feature disabled - Allow customers to customize this
                        item
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-not-allowed opacity-50">
                    <input
                      disabled
                      checked={false}
                      className="w-4 h-4 rounded border-default-300 text-primary focus:ring-2 focus:ring-primary cursor-not-allowed"
                      type="checkbox"
                    />
                    <div>
                      <span className="text-sm font-medium text-default-500">
                        Pre-order Available
                      </span>
                      <p className="text-xs text-default-400">
                        Feature disabled - Enable pre-ordering for this item
                      </p>
                    </div>
                  </label> */}

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      checked={formData.is_featured || false}
                      className="w-4 h-4 rounded border-default-300 text-primary focus:ring-2 focus:ring-primary"
                      type="checkbox"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_featured: e.target.checked,
                        })
                      }
                    />
                    <div>
                      <span className="text-sm font-medium text-default-700">
                        Featured Item
                      </span>
                      <p className="text-xs text-default-500">
                        Display prominently on the kiosk home screen
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <Input
                isRequired
                label="Preparation Time (minutes)"
                min="0"
                placeholder="Enter preparation time in minutes (e.g., 5)"
                step="1"
                type="number"
                value={formData.preparation_time_minutes?.toString() || "0"}
                errorMessage={formData.preparation_time_minutes === undefined && "Preparation time is required"}
                onChange={(e) => {
                  const value = e.target.value;

                  setFormData({
                    ...formData,
                    preparation_time_minutes:
                      value === "" ? 0 : parseInt(value, 10) || 0,
                  });
                }}
              />
              <Textarea
                label="Allergen Information"
                minRows={2}
                placeholder="e.g., Contains nuts, eggs, dairy"
                onChange={(e) =>
                  setFormData({ ...formData, allergen_info: e.target.value })
                }
              />
              <Textarea
                label="Nutritional Information"
                minRows={2}
                placeholder="e.g., Calories: 250, Protein: 5g, Carbs: 30g"
                onChange={(e) =>
                  setFormData({ ...formData, nutritional_info: e.target.value })
                }
              />
              {editingItem?.image_url && !imageFile && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Current Image</p>
                  <div className="relative w-32 h-32 border-2 border-default-200 rounded-lg overflow-hidden">
                    <img
                      alt={editingItem.name}
                      className="w-full h-full object-cover"
                      src={getImageUrl(editingItem.image_url) || ""}
                    />
                  </div>
                </div>
              )}
              <Input
                accept="image/*"
                description="Upload an image of the menu item (JPG, PNG, max 10MB)"
                label={editingItem?.image_url ? "Replace Image (Optional)" : "Item Image"}
                type="file"
                isRequired={!editingItem?.image_url}
                errorMessage={!editingItem?.image_url && !imageFile && "Image is required for new items"}
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              {imageFile && (
                <p className="text-sm text-success">
                  Selected: {imageFile.name} (
                  {(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              isDisabled={saving}
              variant="light"
              onPress={handleModalClose}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              isDisabled={
                !formData.name ||
                !formData.item_type_id ||
                !formData.unit_of_measure_id ||
                formData.preparation_time_minutes === undefined ||
                (!editingItem && !imageFile)
              }
              isLoading={saving}
              onPress={handleSubmit}
            >
              {saving
                ? editingItem
                  ? "Updating..."
                  : "Creating..."
                : editingItem
                  ? "Update Item"
                  : "Create Item"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Price Management Modal */}
      <Modal
        isOpen={!!priceModalItem}
        size="md"
        onClose={() => {
          setPriceModalItem(null);
          setNewPrice("");
          setError(null);
        }}
      >
        <ModalContent>
          <ModalHeader>Update Price - {priceModalItem?.name}</ModalHeader>
          <ModalBody>
            {error && (
              <div className="p-3 bg-danger-50 border border-danger rounded-lg mb-4">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}
            <div className="space-y-4">
              <div className="p-4 bg-default-100 rounded-lg">
                <p className="text-sm text-default-600">Current Price</p>
                <p className="text-2xl font-bold text-primary">
                  ₱{priceModalItem && formatPrice(priceModalItem.current_price)}
                </p>
              </div>
              <Input
                label="New Price"
                min="0"
                placeholder="Enter new price"
                startContent={
                  <span className="text-default-400 text-sm">₱</span>
                }
                step="0.01"
                type="number"
                onChange={(e) => setNewPrice(e.target.value)}
              />
              <p className="text-xs text-default-500">
                This will add a new price entry starting today and update the
                current price.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              isDisabled={saving}
              variant="light"
              onPress={() => {
                setPriceModalItem(null);
                setNewPrice("");
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              isDisabled={!newPrice || parseFloat(newPrice) < 0}
              isLoading={saving}
              onPress={handlePriceUpdate}
            >
              {saving ? "Updating..." : "Update Price"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmModal.isOpen}
        size="md"
        onClose={() => setDeleteConfirmModal({ isOpen: false, item: null })}
      >
        <ModalContent>
          <ModalHeader className="text-danger">Confirm Delete</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete{" "}
              <strong>{deleteConfirmModal.item?.name}</strong>?
            </p>
            <p className="text-sm text-default-500 mt-2">
              This action cannot be undone. The item will be marked as
              discontinued.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() =>
                setDeleteConfirmModal({ isOpen: false, item: null })
              }
            >
              Cancel
            </Button>
            <Button color="danger" onPress={confirmDelete}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={bulkDeleteConfirmModal}
        size="md"
        onClose={() => setBulkDeleteConfirmModal(false)}
      >
        <ModalContent>
          <ModalHeader className="text-danger">Confirm Bulk Delete</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete{" "}
              <strong>{selectedItems.size} items</strong>?
            </p>
            <p className="text-sm text-default-500 mt-2">
              This action cannot be undone. All selected items will be marked as
              discontinued.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setBulkDeleteConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button color="danger" onPress={confirmBulkDelete}>
              Delete {selectedItems.size} Items
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Item Type Modal */}
      <AddItemTypeModal
        isOpen={isAddItemTypeModalOpen}
        onClose={() => setIsAddItemTypeModalOpen(false)}
        onSuccess={(typeId) => {
          loadItemTypes();
          if (typeId) {
            setFormData({ ...formData, item_type_id: typeId });
          }
        }}
      />

      {/* Add Unit Modal */}
      <AddUnitModal
        isOpen={isAddUnitModalOpen}
        onClose={() => setIsAddUnitModalOpen(false)}
        onSuccess={(unitId) => {
          loadUnits();
          if (unitId) {
            setFormData({ ...formData, unit_of_measure_id: unitId });
          }
        }}
      />
    </div>
  );
}
