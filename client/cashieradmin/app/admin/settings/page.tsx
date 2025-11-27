'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from '@heroui/table';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Select, SelectItem } from '@heroui/select';
import { SettingsService } from '@/services/settings.service';
import type { KioskSetting } from '@/types/api';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

type SettingType = 'string' | 'number' | 'boolean' | 'json';

interface SettingFormState {
  setting_key: string;
  setting_value: string;
  setting_type: SettingType;
  description: string;
}

interface SettingsStats {
  totalSettings: number;
  stringSettings: number;
  numberSettings: number;
  booleanSettings: number;
}

export default function SettingsPage() {
  // State Management
  const [settings, setSettings] = useState<KioskSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<SettingsStats>({
    totalSettings: 0,
    stringSettings: 0,
    numberSettings: 0,
    booleanSettings: 0,
  });

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<KioskSetting | null>(null);

  // Form State
  const [formState, setFormState] = useState<SettingFormState>({
    setting_key: '',
    setting_value: '',
    setting_type: 'string',
    description: '',
  });

  // Initial Data Fetch
  useEffect(() => {
    fetchSettings();
  }, []);

  // Calculate Stats
  useEffect(() => {
    const stringSettings = settings.filter(s => s.setting_type === 'string').length;
    const numberSettings = settings.filter(s => s.setting_type === 'number').length;
    const booleanSettings = settings.filter(s => s.setting_type === 'boolean').length;

    setStats({
      totalSettings: settings.length,
      stringSettings,
      numberSettings,
      booleanSettings,
    });
  }, [settings]);

  // API Calls
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await SettingsService.getAllSettings();
      if (response.success) {
        setSettings(Array.isArray(response.data) ? response.data : []);
      } else {
        console.error('Failed to fetch settings:', response.message);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSetting = async () => {
    try {
      const response = await SettingsService.createSetting(formState);
      if (response.success) {
        setShowCreateModal(false);
        resetForm();
        fetchSettings();
      } else {
        console.error('Failed to create setting:', response.message);
      }
    } catch (error) {
      console.error('Failed to create setting:', error);
    }
  };

  const handleUpdateSetting = async () => {
    if (!selectedSetting) return;

    try {
      const response = await SettingsService.updateSetting(selectedSetting.setting_key, {
        setting_value: formState.setting_value,
        description: formState.description,
      });
      if (response.success) {
        setShowEditModal(false);
        resetForm();
        fetchSettings();
      } else {
        console.error('Failed to update setting:', response.message);
      }
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  // Form Handlers
  const resetForm = () => {
    setFormState({
      setting_key: '',
      setting_value: '',
      setting_type: 'string',
      description: '',
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (setting: KioskSetting) => {
    setSelectedSetting(setting);
    setFormState({
      setting_key: setting.setting_key,
      setting_value: setting.setting_value,
      setting_type: setting.setting_type,
      description: setting.description || '',
    });
    setShowEditModal(true);
  };

  // Filtering
  const filteredSettings = settings.filter(setting =>
    setting.setting_key?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    setting.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper Functions
  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-PH');
  };

  const getTypeColor = (type: SettingType) => {
    const colors: Record<SettingType, string> = {
      string: 'bg-primary/10 text-primary',
      number: 'bg-success/10 text-success',
      boolean: 'bg-warning/10 text-warning',
      json: 'bg-secondary/10 text-secondary',
    };
    return colors[type] || 'bg-default-100';
  };

  const formatValue = (value: string, type: SettingType) => {
    if (type === 'boolean') {
      return value === 'true' ? 'Yes' : 'No';
    }
    if (type === 'json') {
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch {
        return value;
      }
    }
    return value;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Kiosk Settings</h1>
          <p className="text-default-500 mt-1">Configure kiosk system settings</p>
        </div>
        <Button
          color="primary"
          startContent={<PlusIcon className="h-5 w-5" />}
          onPress={openCreateModal}
        >
          New Setting
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Cog6ToothIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-default-500">Total Settings</p>
                <p className="text-2xl font-bold">{stats.totalSettings}</p>
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
                <p className="text-sm text-default-500">String Settings</p>
                <p className="text-2xl font-bold">{stats.stringSettings}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-warning/10 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-default-500">Number Settings</p>
                <p className="text-2xl font-bold">{stats.numberSettings}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-danger/10 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-danger" />
              </div>
              <div>
                <p className="text-sm text-default-500">Boolean Settings</p>
                <p className="text-2xl font-bold">{stats.booleanSettings}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Search */}
      <Input
        placeholder="Search settings by key or description..."
        value={searchTerm}
        onValueChange={setSearchTerm}
        startContent={<MagnifyingGlassIcon className="h-5 w-5 text-default-400" />}
        className="max-w-md"
      />

      {/* Settings Table */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold">All Settings</h3>
        </CardHeader>
        <CardBody>
          {loading ? (
            <p>Loading settings...</p>
          ) : (
            <Table aria-label="Settings list">
              <TableHeader>
                <TableColumn>KEY</TableColumn>
                <TableColumn>VALUE</TableColumn>
                <TableColumn>TYPE</TableColumn>
                <TableColumn>DESCRIPTION</TableColumn>
                <TableColumn>LAST UPDATED</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No settings found">
                {filteredSettings.map((setting) => (
                  <TableRow key={setting.setting_id}>
                    <TableCell>
                      <span className="font-mono font-semibold text-sm">
                        {setting.setting_key}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {setting.setting_type === 'boolean' ? (
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              setting.setting_value === 'true'
                                ? 'bg-success/10 text-success'
                                : 'bg-danger/10 text-danger'
                            }`}
                          >
                            {formatValue(setting.setting_value, setting.setting_type)}
                          </span>
                        ) : setting.setting_type === 'json' ? (
                          <pre className="text-xs overflow-auto max-h-20 p-2 bg-default-100 rounded">
                            {formatValue(setting.setting_value, setting.setting_type)}
                          </pre>
                        ) : (
                          <span className="text-sm">
                            {formatValue(setting.setting_value, setting.setting_type)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(setting.setting_type)}`}
                      >
                        {setting.setting_type.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-default-500">
                        {setting.description || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-default-400">
                        {formatDateTime(setting.updated_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="primary"
                        onPress={() => openEditModal(setting)}
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

      {/* Create Setting Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} size="lg">
        <ModalContent>
          <ModalHeader>Create New Setting</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Setting Key"
                placeholder="e.g., max_order_items, enable_notifications"
                value={formState.setting_key}
                onValueChange={(v) => setFormState({ ...formState, setting_key: v })}
                description="Use lowercase with underscores (snake_case)"
                isRequired
              />

              <Select
                label="Setting Type"
                selectedKeys={[formState.setting_type]}
                onSelectionChange={(keys) => {
                  setFormState({ ...formState, setting_type: Array.from(keys)[0] as SettingType });
                }}
                isRequired
              >
                <SelectItem key="string" value="string">
                  String
                </SelectItem>
                <SelectItem key="number" value="number">
                  Number
                </SelectItem>
                <SelectItem key="boolean" value="boolean">
                  Boolean
                </SelectItem>
                <SelectItem key="json" value="json">
                  JSON
                </SelectItem>
              </Select>

              {formState.setting_type === 'boolean' ? (
                <Select
                  label="Setting Value"
                  selectedKeys={[formState.setting_value]}
                  onSelectionChange={(keys) => {
                    setFormState({ ...formState, setting_value: Array.from(keys)[0] as string });
                  }}
                  isRequired
                >
                  <SelectItem key="true" value="true">
                    True
                  </SelectItem>
                  <SelectItem key="false" value="false">
                    False
                  </SelectItem>
                </Select>
              ) : formState.setting_type === 'number' ? (
                <Input
                  label="Setting Value"
                  type="number"
                  placeholder="Enter number value"
                  value={formState.setting_value}
                  onValueChange={(v) => setFormState({ ...formState, setting_value: v })}
                  isRequired
                />
              ) : formState.setting_type === 'json' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Setting Value (JSON)</label>
                  <textarea
                    className="w-full min-h-[100px] p-2 rounded-lg border border-default-200 font-mono text-sm"
                    placeholder='{"key": "value"}'
                    value={formState.setting_value}
                    onChange={(e) => setFormState({ ...formState, setting_value: e.target.value })}
                  />
                </div>
              ) : (
                <Input
                  label="Setting Value"
                  placeholder="Enter value"
                  value={formState.setting_value}
                  onValueChange={(v) => setFormState({ ...formState, setting_value: v })}
                  isRequired
                />
              )}

              <Input
                label="Description (optional)"
                placeholder="Brief description of this setting"
                value={formState.description}
                onValueChange={(v) => setFormState({ ...formState, description: v })}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleCreateSetting}>
              Create Setting
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Setting Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} size="lg">
        <ModalContent>
          <ModalHeader>Edit Setting</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Setting Key"
                value={formState.setting_key}
                isReadOnly
                description="Key cannot be changed"
              />

              <div className="p-3 bg-default-50 rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold">Type:</span>{' '}
                  <span className="capitalize">{formState.setting_type}</span>
                </p>
              </div>

              {formState.setting_type === 'boolean' ? (
                <Select
                  label="Setting Value"
                  selectedKeys={[formState.setting_value]}
                  onSelectionChange={(keys) => {
                    setFormState({ ...formState, setting_value: Array.from(keys)[0] as string });
                  }}
                  isRequired
                >
                  <SelectItem key="true" value="true">
                    True
                  </SelectItem>
                  <SelectItem key="false" value="false">
                    False
                  </SelectItem>
                </Select>
              ) : formState.setting_type === 'number' ? (
                <Input
                  label="Setting Value"
                  type="number"
                  placeholder="Enter number value"
                  value={formState.setting_value}
                  onValueChange={(v) => setFormState({ ...formState, setting_value: v })}
                  isRequired
                />
              ) : formState.setting_type === 'json' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Setting Value (JSON)</label>
                  <textarea
                    className="w-full min-h-[100px] p-2 rounded-lg border border-default-200 font-mono text-sm"
                    placeholder='{"key": "value"}'
                    value={formState.setting_value}
                    onChange={(e) => setFormState({ ...formState, setting_value: e.target.value })}
                  />
                </div>
              ) : (
                <Input
                  label="Setting Value"
                  placeholder="Enter value"
                  value={formState.setting_value}
                  onValueChange={(v) => setFormState({ ...formState, setting_value: v })}
                  isRequired
                />
              )}

              <Input
                label="Description (optional)"
                placeholder="Brief description of this setting"
                value={formState.description}
                onValueChange={(v) => setFormState({ ...formState, description: v })}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleUpdateSetting}>
              Update Setting
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
