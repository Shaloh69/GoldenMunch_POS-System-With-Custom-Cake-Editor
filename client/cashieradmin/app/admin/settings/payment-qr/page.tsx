'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Divider } from '@heroui/divider';
import { Tabs, Tab } from '@heroui/tabs';
import { SettingsService } from '@/services/settings.service';
import { QrCodeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

type PaymentMethod = 'gcash' | 'paymaya';

export default function PaymentQRSettingsPage() {
  const [selectedTab, setSelectedTab] = useState<PaymentMethod>('gcash');
  const [gcashQR, setGcashQR] = useState<File | null>(null);
  const [paymayaQR, setPaymayaQR] = useState<File | null>(null);
  const [gcashPreview, setGcashPreview] = useState<string | null>(null);
  const [paymayaPreview, setPaymayaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load existing QR codes
  useEffect(() => {
    loadExistingQRs();
  }, []);

  const loadExistingQRs = async () => {
    try {
      const response = await SettingsService.getAllPaymentQR();
      if (response.success && response.data) {
        const data = response.data as any;
        // Get base URL without /api suffix
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const baseUrl = apiUrl.replace('/api', '');

        if (data.gcash) {
          setGcashPreview(`${baseUrl}${data.gcash}`);
        }
        if (data.paymaya) {
          setPaymayaPreview(`${baseUrl}${data.paymaya}`);
        }
      }
    } catch (err) {
      console.error('Failed to load existing QR codes:', err);
    }
  };

  const handleFileSelect = (file: File, method: PaymentMethod) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (method === 'gcash') {
          setGcashQR(file);
          setGcashPreview(result);
        } else {
          setPaymayaQR(file);
          setPaymayaPreview(result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setError('Please select a valid image file (PNG, JPG)');
    }
  };

  const handleUpload = async (method: PaymentMethod) => {
    const qrFile = method === 'gcash' ? gcashQR : paymayaQR;

    if (!qrFile) {
      setError(`Please select a ${method.toUpperCase()} QR code to upload`);
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('qr_code', qrFile);
      formData.append('payment_method', method);

      await SettingsService.uploadPaymentQR(formData);

      setSuccess(`${method.toUpperCase()} payment QR code uploaded successfully!`);

      // Clear the file input after successful upload
      if (method === 'gcash') {
        setGcashQR(null);
      } else {
        setPaymayaQR(null);
      }

      // Reload QR codes to show the uploaded one
      setTimeout(() => {
        loadExistingQRs();
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to upload QR code');
    } finally {
      setUploading(false);
    }
  };

  const clearPreview = (method: PaymentMethod) => {
    if (method === 'gcash') {
      setGcashQR(null);
      setGcashPreview(null);
    } else {
      setPaymayaQR(null);
      setPaymayaPreview(null);
    }
    loadExistingQRs(); // Reload to show saved QR if any
  };

  const renderQRUpload = (method: PaymentMethod) => {
    const qrFile = method === 'gcash' ? gcashQR : paymayaQR;
    const preview = method === 'gcash' ? gcashPreview : paymayaPreview;
    const color = method === 'gcash' ? 'blue' : 'purple';

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-${color}-100 rounded-lg`}>
              <QrCodeIcon className={`h-6 w-6 text-${color}-600`} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{method.toUpperCase()} Payment QR Code</h2>
              <p className="text-sm text-default-500">Upload your {method.toUpperCase()} merchant QR code</p>
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-4">
          {/* Preview */}
          {preview ? (
            <div className="relative">
              <div className="aspect-square bg-default-100 rounded-lg overflow-hidden flex items-center justify-center max-w-md mx-auto">
                <Image
                  src={preview}
                  alt={`${method.toUpperCase()} Payment QR Preview`}
                  width={400}
                  height={400}
                  className="object-contain"
                  unoptimized
                />
              </div>
              {qrFile && (
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  className="absolute top-2 right-2"
                  onPress={() => clearPreview(method)}
                >
                  Remove
                </Button>
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed border-default-300 rounded-lg p-12 text-center">
              <QrCodeIcon className="h-20 w-20 mx-auto text-default-400 mb-4" />
              <p className="text-default-600 font-semibold mb-2">
                No {method.toUpperCase()} QR code uploaded yet
              </p>
              <p className="text-sm text-default-500 mb-6">
                Upload a QR code image for {method.toUpperCase()} payments
              </p>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, method);
                }}
                className="max-w-xs mx-auto"
              />
            </div>
          )}

          <div className={`bg-${color}-50 p-4 rounded-lg`}>
            <p className="text-sm text-default-700">
              <strong>Tip:</strong> This QR code will be displayed to customers who select {method.toUpperCase()}
              as their payment method. Make sure it's your valid merchant QR code.
            </p>
          </div>

          <Divider />

          {/* Upload Button */}
          <div className="flex justify-end gap-2">
            {preview && !qrFile && (
              <Button
                color="danger"
                variant="flat"
                size="lg"
                onPress={() => clearPreview(method)}
              >
                Clear
              </Button>
            )}
            <Button
              color="primary"
              size="lg"
              onPress={() => handleUpload(method)}
              isLoading={uploading}
              isDisabled={!qrFile}
              startContent={<QrCodeIcon className="h-5 w-5" />}
              className="font-semibold"
            >
              {uploading ? 'Uploading...' : `Upload ${method.toUpperCase()} QR Code`}
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
            Payment QR Codes
          </h1>
          <p className="text-default-500 mt-1">
            Upload QR codes for cashless payments (GCash & PayMaya)
          </p>
        </div>
      </div>

      {/* Instructions Card */}
      <Card className="bg-blue-50 border-2 border-blue-200">
        <CardBody>
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="p-3 bg-blue-100 rounded-full">
                <QrCodeIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Upload separate QR codes for GCash and PayMaya</li>
                <li>When customers select a payment method, they'll see the corresponding QR code</li>
                <li>Customers scan with their payment app and complete payment</li>
                <li>Customers enter the reference number they receive after payment</li>
                <li>Cashier verifies the payment using the reference number</li>
              </ol>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Success/Error Messages */}
      {success && (
        <Card className="bg-success-50 border-2 border-success-200">
          <CardBody>
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="h-6 w-6 text-success-600" />
              <p className="text-success-700 font-semibold">{success}</p>
            </div>
          </CardBody>
        </Card>
      )}

      {error && (
        <Card className="bg-danger-50 border-2 border-danger-200">
          <CardBody>
            <div className="flex items-center gap-3">
              <XCircleIcon className="h-6 w-6 text-danger-600" />
              <p className="text-danger-700 font-semibold">{error}</p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tabs for GCash and PayMaya */}
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as PaymentMethod)}
        size="lg"
        color="primary"
        classNames={{
          tabList: "w-full",
          tab: "text-lg font-semibold"
        }}
      >
        <Tab key="gcash" title="GCash">
          <div className="mt-6">
            {renderQRUpload('gcash')}
          </div>
        </Tab>
        <Tab key="paymaya" title="PayMaya">
          <div className="mt-6">
            {renderQRUpload('paymaya')}
          </div>
        </Tab>
      </Tabs>

      {/* Additional Info Card */}
      <Card className="bg-default-50">
        <CardBody>
          <h3 className="font-semibold mb-3">Payment Methods Supported</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 p-3 bg-blue-100 rounded-lg">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span className="font-semibold">GCash</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-purple-100 rounded-lg">
              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
              <span className="font-semibold">PayMaya/Maya</span>
            </div>
          </div>
          <p className="text-xs text-default-500 mt-4">
            Upload your merchant QR codes for each payment method. Customers will see the appropriate QR code based on their selected payment method.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
