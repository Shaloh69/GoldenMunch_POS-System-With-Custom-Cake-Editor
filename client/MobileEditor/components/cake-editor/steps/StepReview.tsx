'use client';

import { useState } from 'react';
import { Card, CardBody } from '@nextui-org/card';
import { Chip } from '@nextui-org/chip';
import { Textarea } from '@nextui-org/input';
import { Button } from '@nextui-org/button';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { CakeDesign } from '@/app/page';

interface StepReviewProps {
  design: CakeDesign;
  updateDesign: (updates: Partial<CakeDesign>) => void;
  options: any;
}

export default function StepReview({ design, updateDesign, options }: StepReviewProps) {
  const flavors = options?.flavors || [];
  const sizes = options?.sizes || [];
  const themes = options?.themes || [];
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setUploadingImage(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateDesign({ reference_image: base64String });
        setUploadingImage(false);
      };
      reader.onerror = () => {
        alert('Failed to read image file');
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
      setUploadingImage(false);
    }
  };

  const removeReferenceImage = () => {
    updateDesign({ reference_image: undefined });
  };

  const getFlavorName = (flavorId?: number) => {
    if (!flavorId) return 'Not selected';
    const flavor = flavors.find((f: any) => f.flavor_id === flavorId);
    return flavor?.flavor_name || 'Unknown';
  };

  const getSizeName = (sizeId?: number) => {
    if (!sizeId) return 'Not selected';
    const size = sizes.find((s: any) => s.size_id === sizeId);
    return size?.size_name || 'Unknown';
  };

  const getThemeName = (themeId?: number) => {
    if (!themeId) return 'None';
    const theme = themes.find((t: any) => t.theme_id === themeId);
    return theme?.theme_name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Review Your Design</h2>
        <p className="text-gray-600">Check everything looks perfect before submitting</p>
      </div>

      {/* Customer Info */}
      <Card>
        <CardBody className="p-4">
          <h3 className="font-semibold text-lg mb-3">Customer Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{design.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{design.customer_email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone:</span>
              <span className="font-medium">{design.customer_phone}</span>
            </div>
            {design.event_type && (
              <div className="flex justify-between">
                <span className="text-gray-600">Event:</span>
                <span className="font-medium capitalize">{design.event_type.replace('_', ' ')}</span>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Cake Structure */}
      <Card>
        <CardBody className="p-4">
          <h3 className="font-semibold text-lg mb-3">Cake Structure</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Chip color="warning" variant="flat">
                {design.num_layers} Layer(s)
              </Chip>
            </div>
            {Array.from({ length: design.num_layers }).map((_, index) => {
              const layerNum = index + 1;
              const flavorId = design[`layer_${layerNum}_flavor_id` as keyof CakeDesign] as number | undefined;
              const sizeId = design[`layer_${layerNum}_size_id` as keyof CakeDesign] as number | undefined;

              return (
                <div key={layerNum} className="pl-4 border-l-2 border-amber-200">
                  <p className="font-medium text-sm">Layer {layerNum}</p>
                  <p className="text-sm text-gray-600">
                    Flavor: {getFlavorName(flavorId)} • Size: {getSizeName(sizeId)}
                  </p>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Frosting & Decorations */}
      <Card>
        <CardBody className="p-4">
          <h3 className="font-semibold text-lg mb-3">Frosting & Decorations</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Frosting Type:</span>
              <span className="font-medium capitalize">{design.frosting_type?.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Frosting Color:</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border-2"
                  style={{ backgroundColor: design.frosting_color }}
                />
                <span className="font-medium">{design.frosting_color}</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Theme:</span>
              <span className="font-medium">{getThemeName(design.theme_id)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Candles:</span>
              <span className="font-medium">
                {design.candles_count} ({design.candle_type})
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Cake Text */}
      {design.cake_text && (
        <Card>
          <CardBody className="p-4">
            <h3 className="font-semibold text-lg mb-3">Cake Text</h3>
            <div className="p-4 bg-amber-50 rounded-lg">
              <p
                className="text-2xl font-bold text-center"
                style={{ color: design.text_color || '#FF1493' }}
              >
                "{design.cake_text}"
              </p>
              <p className="text-sm text-gray-600 text-center mt-2">
                Font: {design.text_font} • Position: {design.text_position}
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Special Instructions */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Special Instructions or Notes (Optional)
        </label>
        <Textarea
          placeholder="Any dietary restrictions or special requests..."
          value={design.special_instructions || ''}
          onChange={(e) => updateDesign({ special_instructions: e.target.value })}
          rows={4}
          variant="bordered"
        />
      </div>

      {/* Dietary Restrictions */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Dietary Restrictions (Optional)
        </label>
        <Textarea
          placeholder="Allergies, vegetarian, vegan, etc..."
          value={design.dietary_restrictions || ''}
          onChange={(e) => updateDesign({ dietary_restrictions: e.target.value })}
          rows={2}
          variant="bordered"
        />
      </div>

      {/* Reference Image Upload */}
      <Card className="border-2 border-dashed border-amber-300 bg-amber-50/30">
        <CardBody className="p-4">
          <div className="text-center">
            <PhotoIcon className="w-12 h-12 mx-auto mb-3 text-amber-600" />
            <h4 className="font-semibold text-lg mb-2 text-gray-800">Not sure of your design?</h4>
            <p className="text-sm text-gray-600 mb-4">
              You can upload a reference image here!
            </p>

            {!design.reference_image ? (
              <div>
                <input
                  type="file"
                  id="reference-image"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
                <label htmlFor="reference-image">
                  <Button
                    as="span"
                    color="warning"
                    variant="flat"
                    className="cursor-pointer"
                    isLoading={uploadingImage}
                  >
                    {uploadingImage ? 'Uploading...' : 'Upload Reference Image'}
                  </Button>
                </label>
                <p className="text-xs text-gray-500 mt-2">Max size: 5MB • Supported: JPG, PNG, GIF</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative inline-block">
                  <img
                    src={design.reference_image}
                    alt="Reference cake design"
                    className="max-w-full max-h-64 rounded-lg border-2 border-amber-300 shadow-lg"
                  />
                  <button
                    onClick={removeReferenceImage}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    aria-label="Remove image"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-green-600 font-medium">✓ Reference image uploaded</p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Important Note */}
      <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">📋 Next Steps</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Your design will be submitted to our team for review</li>
          <li>We'll contact you within 24 hours with pricing and availability</li>
          <li>Once approved, you can proceed with payment at the counter</li>
          <li>Typical preparation time is 3-7 days depending on complexity</li>
        </ul>
      </div>
    </div>
  );
}
