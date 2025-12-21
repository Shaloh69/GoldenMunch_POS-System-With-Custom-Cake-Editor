"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { Tabs, Tab } from "@heroui/tabs";
import {
  QrCodeIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";

import { SettingsService } from "@/services/settings.service";

type PaymentMethod = "gcash" | "paymaya";

export default function PaymentQRSettingsPage() {
  const [selectedTab, setSelectedTab] = useState<PaymentMethod>("gcash");
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
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const baseUrl = apiUrl.replace("/api", "");

        if (data.gcash) {
          setGcashPreview(`${baseUrl}${data.gcash}`);
        }
        if (data.paymaya) {
          setPaymayaPreview(`${baseUrl}${data.paymaya}`);
        }
      }
    } catch (err) {
      console.error("Failed to load existing QR codes:", err);
    }
  };

  const handleFileSelect = (file: File | undefined, method: PaymentMethod) => {
    // Clear any previous errors
    setError(null);

    if (!file) {
      setError("No file selected. Please choose an image file.");

      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError(
        "Invalid file type. Please select an image file (PNG, JPG, JPEG, GIF, or WebP).",
      );

      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes

    if (file.size > maxSize) {
      setError(
        `File too large. Please select an image smaller than 10MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      );

      return;
    }

    // Read and preview the file
    const reader = new FileReader();

    reader.onerror = () => {
      setError(
        "Failed to read the file. Please try again or choose a different file.",
      );
    };

    reader.onloadend = () => {
      const result = reader.result as string;

      if (method === "gcash") {
        setGcashQR(file);
        setGcashPreview(result);
      } else {
        setPaymayaQR(file);
        setPaymayaPreview(result);
      }
      console.log(
        `✅ File selected for ${method.toUpperCase()}: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`,
      );
    };

    reader.readAsDataURL(file);
  };

  const handleUpload = async (method: PaymentMethod) => {
    const qrFile = method === "gcash" ? gcashQR : paymayaQR;

    if (!qrFile) {
      setError(
        `Please select a ${method.toUpperCase()} QR code image to upload.`,
      );

      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log(`📤 Uploading ${method.toUpperCase()} QR code...`, {
        fileName: qrFile.name,
        fileSize: `${(qrFile.size / 1024).toFixed(2)}KB`,
        fileType: qrFile.type,
      });

      const formData = new FormData();

      formData.append("qr_code", qrFile);
      formData.append("payment_method", method);

      const response = await SettingsService.uploadPaymentQR(formData);

      if (!response.success) {
        throw new Error(response.error || response.message || "Upload failed");
      }

      console.log(`✅ ${method.toUpperCase()} QR code uploaded successfully`);
      setSuccess(
        `${method.toUpperCase()} payment QR code uploaded successfully!`,
      );

      // Clear the file input after successful upload
      if (method === "gcash") {
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
      console.error(`❌ Upload error for ${method.toUpperCase()}:`, err);

      // Provide user-friendly error messages
      let errorMessage = "Failed to upload QR code. ";

      if (err.response) {
        // Server responded with an error
        const serverError =
          err.response.data?.error || err.response.data?.message;

        if (serverError) {
          errorMessage += serverError;
        } else if (err.response.status === 401) {
          errorMessage += "You are not authorized. Please log in again.";
        } else if (err.response.status === 413) {
          errorMessage += "The file is too large. Please use a smaller image.";
        } else if (err.response.status === 500) {
          errorMessage +=
            "Server error. Please try again later or contact support.";
        } else {
          errorMessage += `Server returned error code ${err.response.status}.`;
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage +=
          "No response from server. Please check your internet connection.";
      } else if (err.message) {
        // Something else went wrong
        errorMessage += err.message;
      } else {
        errorMessage += "An unknown error occurred. Please try again.";
      }

      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const clearPreview = (method: PaymentMethod) => {
    if (method === "gcash") {
      setGcashQR(null);
      setGcashPreview(null);
    } else {
      setPaymayaQR(null);
      setPaymayaPreview(null);
    }
    // Don't reload - user wants to clear and upload a new one
  };

  const handleDeleteQR = async (method: PaymentMethod) => {
    if (
      !confirm(
        `Are you sure you want to delete the ${method.toUpperCase()} QR code? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log(`🗑️ Deleting ${method.toUpperCase()} QR code...`);

      const response = await SettingsService.deletePaymentQR(method);

      if (!response.success) {
        throw new Error(response.error || response.message || "Delete failed");
      }

      console.log(`✅ ${method.toUpperCase()} QR code deleted successfully`);
      setSuccess(`${method.toUpperCase()} QR code deleted successfully!`);

      // Clear both preview and file
      if (method === "gcash") {
        setGcashQR(null);
        setGcashPreview(null);
      } else {
        setPaymayaQR(null);
        setPaymayaPreview(null);
      }

      setTimeout(() => {
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      console.error(`❌ Delete error for ${method.toUpperCase()}:`, err);

      // Provide user-friendly error messages
      let errorMessage = "Failed to delete QR code. ";

      if (err.response) {
        const serverError =
          err.response.data?.error || err.response.data?.message;

        if (serverError) {
          errorMessage += serverError;
        } else if (err.response.status === 401) {
          errorMessage += "You are not authorized. Please log in again.";
        } else if (err.response.status === 404) {
          errorMessage +=
            "QR code not found. It may have already been deleted.";
        } else if (err.response.status === 500) {
          errorMessage +=
            "Server error. Please try again later or contact support.";
        } else {
          errorMessage += `Server returned error code ${err.response.status}.`;
        }
      } else if (err.request) {
        errorMessage +=
          "No response from server. Please check your internet connection.";
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += "An unknown error occurred. Please try again.";
      }

      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const renderQRUpload = (method: PaymentMethod) => {
    const qrFile = method === "gcash" ? gcashQR : paymayaQR;
    const preview = method === "gcash" ? gcashPreview : paymayaPreview;
    const color = method === "gcash" ? "blue" : "purple";

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-${color}-100 rounded-lg`}>
              <QrCodeIcon className={`h-6 w-6 text-${color}-600`} />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {method.toUpperCase()} Payment QR Code
              </h2>
              <p className="text-sm text-default-500">
                Upload your {method.toUpperCase()} merchant QR code
              </p>
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-4">
          {/* Preview */}
          {preview ? (
            <div className="space-y-4">
              <div className="relative">
                <div className="aspect-square bg-default-100 rounded-lg overflow-hidden flex items-center justify-center max-w-md mx-auto">
                  <Image
                    unoptimized
                    alt={`${method.toUpperCase()} Payment QR Preview`}
                    className="object-contain"
                    height={400}
                    src={preview}
                    width={400}
                  />
                </div>
                {qrFile && (
                  <Button
                    className="absolute top-2 right-2"
                    color="danger"
                    size="sm"
                    variant="flat"
                    onPress={() => clearPreview(method)}
                  >
                    Remove
                  </Button>
                )}
              </div>

              {/* Replace QR option - show file input when there's an existing QR */}
              {!qrFile && preview && (
                <div className="border-2 border-dashed border-primary-300 rounded-lg p-6 text-center bg-primary-50">
                  <p className="text-sm text-default-700 font-semibold mb-4">
                    Replace with a new QR code
                  </p>
                  <div className="max-w-xs mx-auto">
                    <label className="block w-full">
                      <input
                        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                        className="hidden"
                        id={`file-input-replace-${method}`}
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];

                          handleFileSelect(file, method);
                        }}
                      />
                      <Button
                        as="span"
                        className="w-full font-semibold cursor-pointer"
                        color="primary"
                        size="md"
                        startContent={<QrCodeIcon className="h-5 w-5" />}
                        variant="flat"
                      >
                        Choose New QR Code
                      </Button>
                    </label>
                    <p className="text-xs text-default-500 mt-2">
                      PNG, JPG, GIF, or WebP (Max 10MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed border-default-300 rounded-lg p-12 text-center bg-default-50">
              <QrCodeIcon className="h-20 w-20 mx-auto text-default-400 mb-4" />
              <p className="text-default-600 font-semibold mb-2 text-lg">
                No {method.toUpperCase()} QR code uploaded yet
              </p>
              <p className="text-sm text-default-500 mb-6">
                Upload a QR code image for {method.toUpperCase()} payments
              </p>
              <div className="max-w-xs mx-auto">
                <label className="block w-full">
                  <input
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                    className="hidden"
                    id={`file-input-${method}`}
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];

                      handleFileSelect(file, method);
                    }}
                  />
                  <Button
                    as="span"
                    className="w-full font-semibold cursor-pointer"
                    color="primary"
                    size="lg"
                    startContent={<QrCodeIcon className="h-5 w-5" />}
                  >
                    Choose QR Code Image
                  </Button>
                </label>
                <p className="text-xs text-default-400 mt-3">
                  Supported formats: PNG, JPG, JPEG, GIF, WebP (Max 10MB)
                </p>
              </div>
            </div>
          )}

          <div className={`bg-${color}-50 p-4 rounded-lg`}>
            <p className="text-sm text-default-700">
              <strong>Tip:</strong> This QR code will be displayed to customers
              who select {method.toUpperCase()}
              as their payment method. Make sure it's your valid merchant QR
              code.
            </p>
          </div>

          <Divider />

          {/* Action Buttons */}
          <div className="flex justify-between items-center gap-2">
            {/* Delete button - only show if there's a saved QR (preview but no new file selected) */}
            {preview && !qrFile && (
              <Button
                color="danger"
                isLoading={uploading}
                size="lg"
                startContent={<XCircleIcon className="h-5 w-5" />}
                variant="bordered"
                onPress={() => handleDeleteQR(method)}
              >
                Delete QR Code
              </Button>
            )}

            {/* Upload button - only show if there's a new file selected */}
            {qrFile && (
              <div className="flex gap-2 ml-auto">
                <Button
                  color="default"
                  size="lg"
                  variant="flat"
                  onPress={() => clearPreview(method)}
                >
                  Cancel
                </Button>
                <Button
                  className="font-semibold"
                  color="primary"
                  isLoading={uploading}
                  size="lg"
                  startContent={<QrCodeIcon className="h-5 w-5" />}
                  onPress={() => handleUpload(method)}
                >
                  {uploading
                    ? "Uploading..."
                    : `Upload ${method.toUpperCase()} QR Code`}
                </Button>
              </div>
            )}
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
              <h3 className="font-semibold text-blue-900 mb-2">
                How it works:
              </h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Upload separate QR codes for GCash and PayMaya</li>
                <li>
                  When customers select a payment method, they'll see the
                  corresponding QR code
                </li>
                <li>
                  Customers scan with their payment app and complete payment
                </li>
                <li>
                  Customers enter the reference number they receive after
                  payment
                </li>
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
        classNames={{
          tabList: "w-full",
          tab: "text-lg font-semibold",
        }}
        color="primary"
        selectedKey={selectedTab}
        size="lg"
        onSelectionChange={(key) => setSelectedTab(key as PaymentMethod)}
      >
        <Tab key="gcash" title="GCash">
          <div className="mt-6">{renderQRUpload("gcash")}</div>
        </Tab>
        <Tab key="paymaya" title="PayMaya">
          <div className="mt-6">{renderQRUpload("paymaya")}</div>
        </Tab>
      </Tabs>

      {/* Additional Info Card */}
      <Card className="bg-default-50">
        <CardBody>
          <h3 className="font-semibold mb-3">Payment Methods Supported</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 p-3 bg-blue-100 rounded-lg">
              <div className="w-3 h-3 bg-blue-600 rounded-full" />
              <span className="font-semibold">GCash</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-purple-100 rounded-lg">
              <div className="w-3 h-3 bg-purple-600 rounded-full" />
              <span className="font-semibold">PayMaya/Maya</span>
            </div>
          </div>
          <p className="text-xs text-default-500 mt-4">
            Upload your merchant QR codes for each payment method. Customers
            will see the appropriate QR code based on their selected payment
            method.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
