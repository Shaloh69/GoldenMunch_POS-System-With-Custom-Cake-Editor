'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Textarea } from '@heroui/input';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Chip } from '@heroui/chip';
import { Select, SelectItem } from '@heroui/select';
import { useDisclosure } from '@heroui/modal';
import { MenuService } from '@/services/menu.service';
import type { Category, MenuItem } from '@/types/api';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

// Utility function to safely format prices
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isAssignOpen, onOpen: onAssignOpen, onClose: onAssignClose } = useDisclosure();

  const [selectedCategoryForAssign, setSelectedCategoryForAssign] = useState<Category | null>(null);
  const [selectedMenuItems, setSelectedMenuItems] = useState<Set<number>>(new Set());

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [categoriesResponse, itemsResponse] = await Promise.all([
        MenuService.getCategories(),
        MenuService.getMenuItems(),
      ]);

      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data);
      }

      if (itemsResponse.success && itemsResponse.data) {
        setMenuItems(itemsResponse.data);
      }
    } catch (error: any) {
      console.error('Failed to load data:', error);
      setError(error?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      display_order: 0,
      is_active: true,
    });
    setEditingCategory(null);
    setImageFile(null);
    setError(null);
  };

  const handleModalClose = () => {
    resetForm();
    onClose();
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      display_order: category.display_order || 0,
      is_active: category.is_active !== false,
    });
    onOpen();
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name) {
        setError('Category name is required');
        return;
      }

      setSaving(true);
      setError(null);

      let response;
      if (editingCategory) {
        response = await MenuService.updateCategory(
          editingCategory.category_id,
          formData,
          imageFile || undefined
        );
      } else {
        response = await MenuService.createCategory(formData, imageFile || undefined);
      }

      if (response.success) {
        onClose();
        loadData();
        resetForm();
      } else {
        setError(response.message || `Failed to ${editingCategory ? 'update' : 'create'} category`);
      }
    } catch (error: any) {
      console.error('Failed to save category:', error);
      setError(error?.message || 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignOpen = (category: Category) => {
    setSelectedCategoryForAssign(category);

    // Get currently assigned items
    const assignedItems = menuItems
      .filter(item => item.categories?.some(cat => cat.category_id === category.category_id))
      .map(item => item.menu_item_id);

    setSelectedMenuItems(new Set(assignedItems));
    onAssignOpen();
  };

  const handleAssignSubmit = async () => {
    if (!selectedCategoryForAssign) return;

    try {
      setSaving(true);
      setError(null);

      // Assign selected items
      for (const itemId of Array.from(selectedMenuItems)) {
        await MenuService.assignItemToCategory({
          category_id: selectedCategoryForAssign.category_id,
          menu_item_id: itemId,
          display_order: 0,
        });
      }

      onAssignClose();
      loadData();
    } catch (error: any) {
      console.error('Failed to assign items:', error);
      setError(error?.message || 'Failed to assign items');
    } finally {
      setSaving(false);
    }
  };

  const toggleItemSelection = (itemId: number) => {
    const newSelection = new Set(selectedMenuItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedMenuItems(newSelection);
  };

  const toggleCategoryExpansion = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getCategoryItems = (categoryId: number) => {
    return menuItems.filter(item =>
      item.categories?.some(cat => cat.category_id === categoryId)
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-light-caramel via-muted-clay to-light-caramel p-8 rounded-2xl shadow-caramel border-2 border-light-caramel/30">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">Category Management</h1>
            <p className="text-white/90 mt-2">
              Create and manage categories for organizing menu items
            </p>
          </div>
          <Button
            onPress={onOpen}
            size="lg"
            className="bg-white text-muted-clay font-bold hover:bg-cream-white shadow-md hover:shadow-lg transition-all"
          >
            Add Category
          </Button>
        </div>
      </div>

      {error && !isOpen && !isAssignOpen && (
        <div className="p-4 bg-danger-50 border border-danger rounded-lg">
          <p className="text-danger">{error}</p>
        </div>
      )}

      <Card className="shadow-caramel border-2 border-light-caramel/20">
        <CardHeader className="bg-gradient-to-r from-soft-sand/30 to-transparent border-b border-light-caramel/20 p-6">
          <h2 className="text-2xl font-bold text-muted-clay">All Categories ({categories.length})</h2>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-default-400 text-lg">No categories found</p>
              <p className="text-default-300 text-sm mt-2">Create your first category to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => {
                const categoryItems = getCategoryItems(category.category_id);
                const isExpanded = expandedCategories.has(category.category_id);

                return (
                  <div key={category.category_id} className="border border-light-caramel/20 rounded-xl overflow-hidden shadow-sm hover:shadow-caramel transition-all">
                    {/* Category Header */}
                    <div className="bg-gradient-to-r from-cream-white to-soft-sand/50 p-4">
                      <div className="flex items-center gap-4">
                        {/* Image */}
                        <div className="flex-shrink-0">
                          {category.image_url ? (
                            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-light-caramel/30 shadow-sm">
                              <img
                                src={category.image_url}
                                alt={category.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-soft-sand/50 flex items-center justify-center border-2 border-light-caramel/20">
                              <span className="text-warm-beige text-xs font-medium">No image</span>
                            </div>
                          )}
                        </div>

                        {/* Category Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-bold text-muted-clay">{category.name}</h3>
                            <Chip
                              size="sm"
                              color={category.is_active !== false ? 'success' : 'default'}
                              variant="flat"
                            >
                              {category.is_active !== false ? 'Active' : 'Inactive'}
                            </Chip>
                            <Chip size="sm" variant="flat" className="bg-light-caramel/20 text-muted-clay">
                              Order: {category.display_order || 0}
                            </Chip>
                          </div>
                          <p className="text-sm text-warm-beige truncate">
                            {category.description || 'No description'}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Chip size="sm" variant="flat" className="bg-muted-clay/20 text-muted-clay font-semibold">
                            {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}
                          </Chip>
                          <Button
                            size="sm"
                            variant="flat"
                            onPress={() => handleEdit(category)}
                            className="bg-light-caramel/20 hover:bg-light-caramel/30 text-muted-clay"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            color="secondary"
                            onPress={() => handleAssignOpen(category)}
                            className="bg-muted-clay/20 hover:bg-muted-clay/30"
                          >
                            Assign Items
                          </Button>
                          <Button
                            size="sm"
                            isIconOnly
                            variant="flat"
                            onPress={() => toggleCategoryExpansion(category.category_id)}
                            className="bg-soft-sand/50 hover:bg-soft-sand"
                          >
                            {isExpanded ? (
                              <ChevronUpIcon className="h-5 w-5 text-muted-clay" />
                            ) : (
                              <ChevronDownIcon className="h-5 w-5 text-muted-clay" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Items View */}
                    {isExpanded && categoryItems.length > 0 && (
                      <div className="bg-white border-t border-light-caramel/20">
                        <div className="p-4">
                          <h4 className="text-sm font-semibold text-warm-beige uppercase tracking-wide mb-3">
                            Menu Items in this Category
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {categoryItems.map((item) => (
                              <div
                                key={item.menu_item_id}
                                className="flex items-center gap-3 p-3 bg-gradient-to-r from-cream-white to-soft-sand/30 rounded-lg border border-light-caramel/20 hover:shadow-md transition-all"
                              >
                                {item.image_url && (
                                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-light-caramel/30 flex-shrink-0">
                                    <img
                                      src={item.image_url}
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-muted-clay text-sm truncate">{item.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Chip size="sm" variant="flat" className="bg-muted-clay/20 text-muted-clay text-xs">
                                      ₱{formatPrice(item.current_price)}
                                    </Chip>
                                    <span className="text-xs text-warm-beige capitalize">{item.item_type}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Empty State for Expanded Category */}
                    {isExpanded && categoryItems.length === 0 && (
                      <div className="bg-white border-t border-light-caramel/20 p-6 text-center">
                        <p className="text-warm-beige text-sm">No items assigned to this category yet.</p>
                        <Button
                          size="sm"
                          color="secondary"
                          variant="flat"
                          onPress={() => handleAssignOpen(category)}
                          className="mt-3"
                        >
                          Assign Items Now
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Category Modal */}
      <Modal isOpen={isOpen} onClose={handleModalClose} size="lg">
        <ModalContent>
          <ModalHeader>
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </ModalHeader>
          <ModalBody>
            {error && (
              <div className="p-3 bg-danger-50 border border-danger rounded-lg mb-4">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}
            <div className="space-y-4">
              <Input
                label="Category Name"
                placeholder="e.g., Cakes, Pastries, Beverages"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                isRequired
              />
              <Textarea
                label="Description"
                placeholder="Describe this category"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                minRows={3}
              />
              <Input
                label="Display Order"
                type="number"
                placeholder="0"
                value={formData.display_order.toString()}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                description="Lower numbers appear first"
                min="0"
              />
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-default-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-default-300 text-primary focus:ring-2 focus:ring-primary"
                />
                <div>
                  <span className="text-sm font-medium text-default-700">Active</span>
                  <p className="text-xs text-default-500">Show this category in the kiosk</p>
                </div>
              </label>
              {editingCategory?.image_url && !imageFile && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Current Image</p>
                  <div className="relative w-32 h-32 border-2 border-default-200 rounded-lg overflow-hidden">
                    <img
                      src={editingCategory.image_url}
                      alt={editingCategory.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              <Input
                type="file"
                label={editingCategory?.image_url ? 'Replace Image' : 'Category Image'}
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                description="Optional category image"
              />
              {imageFile && (
                <p className="text-sm text-success">
                  Selected: {imageFile.name}
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
              isDisabled={!formData.name}
            >
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Assign Items Modal */}
      <Modal isOpen={isAssignOpen} onClose={onAssignClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            Assign Items to {selectedCategoryForAssign?.name}
          </ModalHeader>
          <ModalBody>
            {error && (
              <div className="p-3 bg-danger-50 border border-danger rounded-lg mb-4">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}
            <p className="text-sm text-default-500 mb-4">
              Select menu items to assign to this category. Items can belong to multiple categories.
            </p>
            <div className="space-y-2">
              {menuItems.map((item) => (
                <label
                  key={item.menu_item_id}
                  className="flex items-center gap-3 p-3 border border-default-200 rounded-lg cursor-pointer hover:bg-default-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedMenuItems.has(item.menu_item_id)}
                    onChange={() => toggleItemSelection(item.menu_item_id)}
                    className="w-4 h-4 rounded border-default-300 text-primary focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex-1 flex items-center gap-3">
                    {item.image_url && (
                      <div className="w-10 h-10 rounded overflow-hidden border border-default-200">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-default-400">{item.item_type}</p>
                    </div>
                  </div>
                  <Chip size="sm" variant="flat">
                    ₱{formatPrice(item.current_price)}
                  </Chip>
                </label>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onAssignClose} isDisabled={saving}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleAssignSubmit}
              isLoading={saving}
            >
              Assign {selectedMenuItems.size} Items
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
