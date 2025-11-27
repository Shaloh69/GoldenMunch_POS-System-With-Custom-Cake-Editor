'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Divider } from '@heroui/divider';
import { SettingsService } from '@/services/settings.service';
import { QrCodeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function PaymentQRSettingsPage() {
  const [cashlessQR, setCashlessQR] = useState<File | null>(null);
  const [cashlessPreview, setCashlessPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCashlessQR(file);
        setCashlessPreview(result);
      };
      reader.readAsDataURL(file);
    } else {
      setError('Please select a valid image file (PNG, JPG)');
    }
  };

  const handleUpload = async () => {
    if (!cashlessQR) {
      setError('Please select a QR code to upload');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('qr_code', cashlessQR);
      formData.append('payment_method', 'cashless');

      await SettingsService.uploadPaymentQR(formData);

      setSuccess('Cashless payment QR code uploaded successfully!');
      // Clear after successful upload
      setTimeout(() => {
        setCashlessQR(null);
        setCashlessPreview(null);
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload QR code');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
            Payment QR Code
          </h1>
          <p className="text-default-500 mt-1">
            Upload QR code for cashless payments (GCash, PayMaya, Bank Transfer, etc.)
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
                <li>Upload your merchant QR code image (supports GCash, PayMaya, Bank QR, etc.)</li>
                <li>When customers select cashless payment, they'll see your QR code</li>
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

      {/* Cashless QR Upload */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <QrCodeIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Cashless Payment QR Code</h2>
              <p className="text-sm text-default-500">Upload your merchant QR code</p>
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-4">
          {/* Preview */}
          {cashlessPreview ? (
            <div className="relative">
              <div className="aspect-square bg-default-100 rounded-lg overflow-hidden flex items-center justify-center max-w-md mx-auto">
                <Image
                  src={cashlessPreview}
                  alt="Cashless Payment QR Preview"
                  width={400}
                  height={400}
                  className="object-contain"
                />
              </div>
              <Button
                size="sm"
                color="danger"
                variant="flat"
                className="absolute top-2 right-2"
                onPress={() => {
                  setCashlessQR(null);
                  setCashlessPreview(null);
                }}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-default-300 rounded-lg p-12 text-center">
              <QrCodeIcon className="h-20 w-20 mx-auto text-default-400 mb-4" />
              <p className="text-default-600 font-semibold mb-2">
                No QR code uploaded yet
              </p>
              <p className="text-sm text-default-500 mb-6">
                Upload a QR code image for cashless payments
              </p>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="max-w-xs mx-auto"
              />
            </div>
          )}

          <div className="bg-warning-50 p-4 rounded-lg">
            <p className="text-sm text-warning-700">
              <strong>Important:</strong> This QR code will be displayed to all customers who select cashless payment.
              Make sure it's your valid merchant QR code that accepts payments to your account.
            </p>
          </div>

          <Divider />

          {/* Upload Button */}
          <div className="flex justify-end">
            <Button
              color="primary"
              size="lg"
              onPress={handleUpload}
              isLoading={uploading}
              isDisabled={!cashlessQR}
              startContent={<QrCodeIcon className="h-5 w-5" />}
              className="font-semibold"
            >
              {uploading ? 'Uploading...' : 'Upload QR Code'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Additional Info Card */}
      <Card className="max-w-2xl mx-auto bg-default-50">
        <CardBody>
          <h3 className="font-semibold mb-3">Supported Payment Methods</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>GCash</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>PayMaya/Maya</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Bank QR (InstaPay/PESONet)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Other e-wallets</span>
            </div>
          </div>
          <p className="text-xs text-default-500 mt-4">
            Customers can use any cashless payment method that can scan your uploaded QR code.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
