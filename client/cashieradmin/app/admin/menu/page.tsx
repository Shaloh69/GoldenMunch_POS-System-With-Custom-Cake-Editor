'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { Select, SelectItem } from '@heroui/select';
import { Textarea } from '@heroui/input';
import { MenuService } from '@/services/menu.service';
import { ProtectedRoute } from '@/components/protected-route';
import type { MenuItem, CreateMenuItemRequest } from '@/types/api';
import { PlusIcon } from '@heroicons/react/24/outline';

// Utility function to safely format price
const formatPrice = (price: any): string => {
  if (price === null || price === undefined || price === '') {
    return '0.00';
  }
  const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
  if (isNaN(numPrice)) {
    return '0.00';
  }
  return numPrice.toFixed(2);
};

// Utility function to safely convert to number
const toNumber = (value: any, defaultValue: number = 0): number => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? defaultValue : num;
};

// Utility function to safely get display value for stock
const formatStock = (item: MenuItem): string => {
  if (item.is_infinite_stock) {
    return '∞';
  }
  return toNumber(item.stock_quantity, 0).toString();
};

export default function AdminMenuPage() {
  return (
    <ProtectedRoute adminOnly>
      <MenuManagementContent />
    </ProtectedRoute>
  );
}

function MenuManagementContent() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState<Partial<CreateMenuItemRequest>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await MenuService.getMenuItems();
      if (response.success && response.data) {
        setItems(response.data);
      } else {
        setError(response.message || 'Failed to load menu items');
      }
    } catch (error: any) {
      console.error('Failed to load menu items:', error);
      setError(error?.message || 'An error occurred while loading menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.item_type) {
        setError('Name and Item Type are required');
        return;
      }

      setSaving(true);
      setError(null);

      // Ensure numeric fields are properly typed
      const sanitizedData: CreateMenuItemRequest = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        item_type: formData.item_type,
        unit_of_measure: formData.unit_of_measure?.trim() || 'piece',
        stock_quantity: toNumber(formData.stock_quantity, 0),
        min_stock_level: toNumber(formData.min_stock_level, 0),
        is_infinite_stock: formData.is_infinite_stock || false,
        can_customize: formData.can_customize || false,
        can_preorder: formData.can_preorder || false,
        preparation_time_minutes: toNumber(formData.preparation_time_minutes, 0),
        allergen_info: formData.allergen_info?.trim(),
        nutritional_info: formData.nutritional_info?.trim(),
      };

      const response = await MenuService.createMenuItem(sanitizedData, imageFile || undefined);

      if (response.success) {
        onClose();
        loadMenuItems();
        resetForm();
      } else {
        setError(response.message || 'Failed to create menu item');
      }
    } catch (error: any) {
      console.error('Failed to create menu item:', error);
      setError(error?.message || 'An error occurred while creating the menu item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        setError(null);
        const response = await MenuService.deleteMenuItem(id);
        if (response.success) {
          loadMenuItems();
        } else {
          setError(response.message || 'Failed to delete item');
        }
      } catch (error: any) {
        console.error('Failed to delete item:', error);
        setError(error?.message || 'An error occurred while deleting the item');
      }
    }
  };

  const resetForm = () => {
    setFormData({});
    setImageFile(null);
    setError(null);
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

      {error && (
        <Card className="bg-danger-50 border-danger">
          <CardBody>
            <p className="text-danger">{error}</p>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          {loading ? (
            <div className="flex justify-center p-8">
              <Spinner size="lg" color="primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center p-8 text-default-500">
              <p>No menu items found</p>
              <Button
                color="primary"
                size="sm"
                className="mt-4"
                startContent={<PlusIcon className="h-4 w-4" />}
                onPress={onOpen}
              >
                Add Your First Item
              </Button>
            </div>
          ) : (
            <Table aria-label="Menu items table">
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>TYPE</TableColumn>
                <TableColumn>PRICE</TableColumn>
                <TableColumn>STOCK</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.menu_item_id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">{item.name || 'N/A'}</span>
                        {item.description && (
                          <span className="text-xs text-default-500 line-clamp-1">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{item.item_type || 'N/A'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">₱{formatPrice(item.current_price)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{formatStock(item)}</span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={
                          item.status === 'available'
                            ? 'success'
                            : item.status === 'unavailable'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                        variant="flat"
                        className="capitalize"
                      >
                        {item.status || 'unknown'}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          onPress={() => handleDelete(item.menu_item_id)}
                        >
                          Delete
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

      {/* Add Item Modal */}
      <Modal isOpen={isOpen} onClose={handleModalClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>Add New Menu Item</ModalHeader>
          <ModalBody>
            {error && (
              <div className="p-3 bg-danger-50 border border-danger rounded-lg mb-4">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}
            <div className="space-y-4">
              <Input
                label="Name"
                placeholder="Enter item name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                isRequired
                errorMessage={!formData.name && 'Name is required'}
              />
              <Textarea
                label="Description"
                placeholder="Enter item description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                minRows={3}
              />
              <Select
                label="Item Type"
                placeholder="Select item type"
                selectedKeys={formData.item_type ? [formData.item_type] : []}
                onChange={(e) => setFormData({ ...formData, item_type: e.target.value as any })}
                isRequired
                errorMessage={!formData.item_type && 'Item type is required'}
              >
                <SelectItem key="cake" value="cake">Cake</SelectItem>
                <SelectItem key="pastry" value="pastry">Pastry</SelectItem>
                <SelectItem key="beverage" value="beverage">Beverage</SelectItem>
                <SelectItem key="coffee" value="coffee">Coffee</SelectItem>
                <SelectItem key="sandwich" value="sandwich">Sandwich</SelectItem>
                <SelectItem key="bread" value="bread">Bread</SelectItem>
                <SelectItem key="dessert" value="dessert">Dessert</SelectItem>
                <SelectItem key="snack" value="snack">Snack</SelectItem>
                <SelectItem key="other" value="other">Other</SelectItem>
              </Select>
              <Input
                label="Unit of Measure"
                placeholder="e.g., piece, slice, cup, gram"
                value={formData.unit_of_measure || ''}
                onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
              />
              <Input
                label="Stock Quantity"
                type="number"
                placeholder="Enter stock quantity"
                value={formData.stock_quantity?.toString() || '0'}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    stock_quantity: value === '' ? 0 : parseInt(value, 10) || 0
                  });
                }}
                min="0"
                step="1"
              />
              <Input
                label="Minimum Stock Level"
                type="number"
                placeholder="Enter minimum stock level for alerts"
                value={formData.min_stock_level?.toString() || '0'}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    min_stock_level: value === '' ? 0 : parseInt(value, 10) || 0
                  });
                }}
                min="0"
                step="1"
              />
              <Input
                label="Preparation Time (minutes)"
                type="number"
                placeholder="Enter preparation time in minutes"
                value={formData.preparation_time_minutes?.toString() || '0'}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    preparation_time_minutes: value === '' ? 0 : parseInt(value, 10) || 0
                  });
                }}
                min="0"
                step="1"
              />
              <Textarea
                label="Allergen Information"
                placeholder="e.g., Contains nuts, eggs, dairy"
                value={formData.allergen_info || ''}
                onChange={(e) => setFormData({ ...formData, allergen_info: e.target.value })}
                minRows={2}
              />
              <Textarea
                label="Nutritional Information"
                placeholder="e.g., Calories: 250, Protein: 5g, Carbs: 30g"
                value={formData.nutritional_info || ''}
                onChange={(e) => setFormData({ ...formData, nutritional_info: e.target.value })}
                minRows={2}
              />
              <Input
                type="file"
                label="Item Image"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                description="Upload an image of the menu item (JPG, PNG, max 10MB)"
              />
              {imageFile && (
                <p className="text-sm text-success">
                  Selected: {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleModalClose} isDisabled={saving}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={saving}
              isDisabled={!formData.name || !formData.item_type}
            >
              {saving ? 'Creating...' : 'Create Item'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
