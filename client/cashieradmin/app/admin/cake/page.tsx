'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from '@heroui/table';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Tabs, Tab } from '@heroui/tabs';
import { CakeService } from '@/services/cake.service';
import type { CakeFlavor, CakeSize, CustomCakeTheme } from '@/types/api';
import {
  PlusIcon,
  PencilIcon,
  CakeIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

type TabKey = 'flavors' | 'sizes' | 'themes';

export default function CakePage() {
  const [selectedTab, setSelectedTab] = useState<TabKey>('flavors');

  // Flavors State
  const [flavors, setFlavors] = useState<CakeFlavor[]>([]);
  const [showFlavorModal, setShowFlavorModal] = useState(false);
  const [editingFlavor, setEditingFlavor] = useState<CakeFlavor | null>(null);
  const [flavorForm, setFlavorForm] = useState({
    flavor_name: '',
    description: '',
    additional_cost: 0,
    display_order: 0,
    is_available: true,
  });

  // Sizes State
  const [sizes, setSizes] = useState<CakeSize[]>([]);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [editingSize, setEditingSize] = useState<CakeSize | null>(null);
  const [sizeForm, setSizeForm] = useState({
    size_name: '',
    serves_people: 0,
    diameter_inches: 0,
    size_multiplier: 1,
    display_order: 0,
    is_available: true,
  });

  // Themes State
  const [themes, setThemes] = useState<CustomCakeTheme[]>([]);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [editingTheme, setEditingTheme] = useState<CustomCakeTheme | null>(null);
  const [themeForm, setThemeForm] = useState({
    theme_name: '',
    description: '',
    base_additional_cost: 0,
    preparation_days: 1,
    display_order: 0,
    is_available: true,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchFlavors(),
      fetchSizes(),
      fetchThemes(),
    ]);
    setLoading(false);
  };

  // Flavors Functions
  const fetchFlavors = async () => {
    try {
      const response = await CakeService.getFlavors();
      if (response.success) {
        setFlavors(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch flavors:', error);
    }
  };

  const handleSaveFlavor = async () => {
    try {
      if (editingFlavor) {
        await CakeService.updateFlavor(editingFlavor.flavor_id, flavorForm);
      } else {
        await CakeService.createFlavor(flavorForm);
      }
      setShowFlavorModal(false);
      resetFlavorForm();
      fetchFlavors();
    } catch (error) {
      console.error('Failed to save flavor:', error);
    }
  };

  const openFlavorModal = (flavor?: CakeFlavor) => {
    if (flavor) {
      setEditingFlavor(flavor);
      setFlavorForm({
        flavor_name: flavor.flavor_name,
        description: flavor.description || '',
        additional_cost: flavor.additional_cost,
        display_order: flavor.display_order,
        is_available: flavor.is_available,
      });
    } else {
      resetFlavorForm();
    }
    setShowFlavorModal(true);
  };

  const resetFlavorForm = () => {
    setEditingFlavor(null);
    setFlavorForm({
      flavor_name: '',
      description: '',
      additional_cost: 0,
      display_order: 0,
      is_available: true,
    });
  };

  // Sizes Functions
  const fetchSizes = async () => {
    try {
      const response = await CakeService.getSizes();
      if (response.success) {
        setSizes(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch sizes:', error);
    }
  };

  const handleSaveSize = async () => {
    try {
      if (editingSize) {
        await CakeService.updateSize(editingSize.size_id, sizeForm);
      } else {
        await CakeService.createSize(sizeForm);
      }
      setShowSizeModal(false);
      resetSizeForm();
      fetchSizes();
    } catch (error) {
      console.error('Failed to save size:', error);
    }
  };

  const openSizeModal = (size?: CakeSize) => {
    if (size) {
      setEditingSize(size);
      setSizeForm({
        size_name: size.size_name,
        serves_people: size.serves_people,
        diameter_inches: size.diameter_inches,
        size_multiplier: size.size_multiplier,
        display_order: size.display_order,
        is_available: size.is_available,
      });
    } else {
      resetSizeForm();
    }
    setShowSizeModal(true);
  };

  const resetSizeForm = () => {
    setEditingSize(null);
    setSizeForm({
      size_name: '',
      serves_people: 0,
      diameter_inches: 0,
      size_multiplier: 1,
      display_order: 0,
      is_available: true,
    });
  };

  // Themes Functions
  const fetchThemes = async () => {
    try {
      const response = await CakeService.getThemes();
      if (response.success) {
        setThemes(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch themes:', error);
    }
  };

  const handleSaveTheme = async () => {
    try {
      if (editingTheme) {
        await CakeService.updateTheme(editingTheme.theme_id, themeForm);
      } else {
        await CakeService.createTheme(themeForm);
      }
      setShowThemeModal(false);
      resetThemeForm();
      fetchThemes();
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const openThemeModal = (theme?: CustomCakeTheme) => {
    if (theme) {
      setEditingTheme(theme);
      setThemeForm({
        theme_name: theme.theme_name,
        description: theme.description || '',
        base_additional_cost: theme.base_additional_cost,
        preparation_days: theme.preparation_days,
        display_order: theme.display_order,
        is_available: theme.is_available,
      });
    } else {
      resetThemeForm();
    }
    setShowThemeModal(true);
  };

  const resetThemeForm = () => {
    setEditingTheme(null);
    setThemeForm({
      theme_name: '',
      description: '',
      base_additional_cost: 0,
      preparation_days: 1,
      display_order: 0,
      is_available: true,
    });
  };

  // Helper Functions
  const formatCurrency = (value: number) => {
    return `₱${parseFloat(value.toString()).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cake Customization</h1>
          <p className="text-default-500 mt-1">Manage cake flavors, sizes, and themes</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <CakeIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-default-500">Flavors</p>
                <p className="text-2xl font-bold">{flavors.length}</p>
                <p className="text-xs text-default-400">
                  {flavors.filter(f => f.is_available).length} available
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-success/10 rounded-lg">
                <CakeIcon className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-default-500">Sizes</p>
                <p className="text-2xl font-bold">{sizes.length}</p>
                <p className="text-xs text-default-400">
                  {sizes.filter(s => s.is_available).length} available
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-warning/10 rounded-lg">
                <CakeIcon className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-default-500">Themes</p>
                <p className="text-2xl font-bold">{themes.length}</p>
                <p className="text-xs text-default-400">
                  {themes.filter(t => t.is_available).length} available
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardBody>
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as TabKey)}
            aria-label="Cake customization options"
          >
            {/* Flavors Tab */}
            <Tab key="flavors" title="Flavors">
              <div className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Cake Flavors</h3>
                  <Button
                    color="primary"
                    startContent={<PlusIcon className="h-5 w-5" />}
                    onPress={() => openFlavorModal()}
                  >
                    Add Flavor
                  </Button>
                </div>

                {loading ? (
                  <p>Loading flavors...</p>
                ) : (
                  <Table aria-label="Cake flavors">
                    <TableHeader>
                      <TableColumn>NAME</TableColumn>
                      <TableColumn>DESCRIPTION</TableColumn>
                      <TableColumn>ADDITIONAL COST</TableColumn>
                      <TableColumn>DISPLAY ORDER</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                      <TableColumn>ACTIONS</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent="No flavors found">
                      {flavors.map((flavor) => (
                        <TableRow key={flavor.flavor_id}>
                          <TableCell>
                            <span className="font-semibold">{flavor.flavor_name}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{flavor.description || 'N/A'}</span>
                          </TableCell>
                          <TableCell>{formatCurrency(flavor.additional_cost)}</TableCell>
                          <TableCell>{flavor.display_order}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                flavor.is_available
                                  ? 'bg-success/10 text-success'
                                  : 'bg-danger/10 text-danger'
                              }`}
                            >
                              {flavor.is_available ? 'Available' : 'Unavailable'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="primary"
                              onPress={() => openFlavorModal(flavor)}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </Tab>

            {/* Sizes Tab */}
            <Tab key="sizes" title="Sizes">
              <div className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Cake Sizes</h3>
                  <Button
                    color="primary"
                    startContent={<PlusIcon className="h-5 w-5" />}
                    onPress={() => openSizeModal()}
                  >
                    Add Size
                  </Button>
                </div>

                {loading ? (
                  <p>Loading sizes...</p>
                ) : (
                  <Table aria-label="Cake sizes">
                    <TableHeader>
                      <TableColumn>NAME</TableColumn>
                      <TableColumn>SERVES</TableColumn>
                      <TableColumn>DIAMETER</TableColumn>
                      <TableColumn>MULTIPLIER</TableColumn>
                      <TableColumn>DISPLAY ORDER</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                      <TableColumn>ACTIONS</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent="No sizes found">
                      {sizes.map((size) => (
                        <TableRow key={size.size_id}>
                          <TableCell>
                            <span className="font-semibold">{size.size_name}</span>
                          </TableCell>
                          <TableCell>{size.serves_people} people</TableCell>
                          <TableCell>{size.diameter_inches}&quot;</TableCell>
                          <TableCell>x{size.size_multiplier}</TableCell>
                          <TableCell>{size.display_order}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                size.is_available
                                  ? 'bg-success/10 text-success'
                                  : 'bg-danger/10 text-danger'
                              }`}
                            >
                              {size.is_available ? 'Available' : 'Unavailable'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="primary"
                              onPress={() => openSizeModal(size)}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </Tab>

            {/* Themes Tab */}
            <Tab key="themes" title="Themes">
              <div className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Cake Themes</h3>
                  <Button
                    color="primary"
                    startContent={<PlusIcon className="h-5 w-5" />}
                    onPress={() => openThemeModal()}
                  >
                    Add Theme
                  </Button>
                </div>

                {loading ? (
                  <p>Loading themes...</p>
                ) : (
                  <Table aria-label="Cake themes">
                    <TableHeader>
                      <TableColumn>NAME</TableColumn>
                      <TableColumn>DESCRIPTION</TableColumn>
                      <TableColumn>BASE COST</TableColumn>
                      <TableColumn>PREP DAYS</TableColumn>
                      <TableColumn>DISPLAY ORDER</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                      <TableColumn>ACTIONS</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent="No themes found">
                      {themes.map((theme) => (
                        <TableRow key={theme.theme_id}>
                          <TableCell>
                            <span className="font-semibold">{theme.theme_name}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{theme.description || 'N/A'}</span>
                          </TableCell>
                          <TableCell>{formatCurrency(theme.base_additional_cost)}</TableCell>
                          <TableCell>{theme.preparation_days} days</TableCell>
                          <TableCell>{theme.display_order}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                theme.is_available
                                  ? 'bg-success/10 text-success'
                                  : 'bg-danger/10 text-danger'
                              }`}
                            >
                              {theme.is_available ? 'Available' : 'Unavailable'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="primary"
                              onPress={() => openThemeModal(theme)}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Flavor Modal */}
      <Modal isOpen={showFlavorModal} onClose={() => setShowFlavorModal(false)} size="lg">
        <ModalContent>
          <ModalHeader>{editingFlavor ? 'Edit' : 'Add'} Flavor</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Flavor Name"
                placeholder="e.g., Chocolate, Vanilla"
                value={flavorForm.flavor_name}
                onValueChange={(v) => setFlavorForm({ ...flavorForm, flavor_name: v })}
                isRequired
              />
              <Input
                label="Description (optional)"
                placeholder="Brief description"
                value={flavorForm.description}
                onValueChange={(v) => setFlavorForm({ ...flavorForm, description: v })}
              />
              <Input
                label="Additional Cost"
                type="number"
                placeholder="0.00"
                value={flavorForm.additional_cost.toString()}
                onValueChange={(v) => setFlavorForm({ ...flavorForm, additional_cost: parseFloat(v) || 0 })}
                isRequired
              />
              <Input
                label="Display Order"
                type="number"
                placeholder="0"
                value={flavorForm.display_order.toString()}
                onValueChange={(v) => setFlavorForm({ ...flavorForm, display_order: parseInt(v) || 0 })}
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={flavorForm.is_available}
                  onChange={(e) => setFlavorForm({ ...flavorForm, is_available: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Is Available</span>
              </label>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowFlavorModal(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSaveFlavor}>
              {editingFlavor ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Size Modal */}
      <Modal isOpen={showSizeModal} onClose={() => setShowSizeModal(false)} size="lg">
        <ModalContent>
          <ModalHeader>{editingSize ? 'Edit' : 'Add'} Size</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Size Name"
                placeholder="e.g., Small, Medium, Large"
                value={sizeForm.size_name}
                onValueChange={(v) => setSizeForm({ ...sizeForm, size_name: v })}
                isRequired
              />
              <Input
                label="Serves People"
                type="number"
                placeholder="0"
                value={sizeForm.serves_people.toString()}
                onValueChange={(v) => setSizeForm({ ...sizeForm, serves_people: parseInt(v) || 0 })}
                isRequired
              />
              <Input
                label="Diameter (inches)"
                type="number"
                placeholder="0"
                value={sizeForm.diameter_inches.toString()}
                onValueChange={(v) => setSizeForm({ ...sizeForm, diameter_inches: parseFloat(v) || 0 })}
                isRequired
              />
              <Input
                label="Size Multiplier"
                type="number"
                placeholder="1.0"
                value={sizeForm.size_multiplier.toString()}
                onValueChange={(v) => setSizeForm({ ...sizeForm, size_multiplier: parseFloat(v) || 1 })}
                isRequired
              />
              <Input
                label="Display Order"
                type="number"
                placeholder="0"
                value={sizeForm.display_order.toString()}
                onValueChange={(v) => setSizeForm({ ...sizeForm, display_order: parseInt(v) || 0 })}
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sizeForm.is_available}
                  onChange={(e) => setSizeForm({ ...sizeForm, is_available: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Is Available</span>
              </label>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowSizeModal(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSaveSize}>
              {editingSize ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Theme Modal */}
      <Modal isOpen={showThemeModal} onClose={() => setShowThemeModal(false)} size="lg">
        <ModalContent>
          <ModalHeader>{editingTheme ? 'Edit' : 'Add'} Theme</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Theme Name"
                placeholder="e.g., Birthday, Wedding"
                value={themeForm.theme_name}
                onValueChange={(v) => setThemeForm({ ...themeForm, theme_name: v })}
                isRequired
              />
              <Input
                label="Description (optional)"
                placeholder="Brief description"
                value={themeForm.description}
                onValueChange={(v) => setThemeForm({ ...themeForm, description: v })}
              />
              <Input
                label="Base Additional Cost"
                type="number"
                placeholder="0.00"
                value={themeForm.base_additional_cost.toString()}
                onValueChange={(v) => setThemeForm({ ...themeForm, base_additional_cost: parseFloat(v) || 0 })}
                isRequired
              />
              <Input
                label="Preparation Days"
                type="number"
                placeholder="1"
                value={themeForm.preparation_days.toString()}
                onValueChange={(v) => setThemeForm({ ...themeForm, preparation_days: parseInt(v) || 1 })}
                isRequired
              />
              <Input
                label="Display Order"
                type="number"
                placeholder="0"
                value={themeForm.display_order.toString()}
                onValueChange={(v) => setThemeForm({ ...themeForm, display_order: parseInt(v) || 0 })}
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={themeForm.is_available}
                  onChange={(e) => setThemeForm({ ...themeForm, is_available: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Is Available</span>
              </label>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowThemeModal(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSaveTheme}>
              {editingTheme ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
