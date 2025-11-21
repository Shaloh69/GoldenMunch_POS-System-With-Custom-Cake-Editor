'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Spinner } from '@heroui/spinner';
import { Select, SelectItem } from '@heroui/select';
import { Textarea } from '@heroui/input';
import { Input } from '@heroui/input';
import { Chip } from '@heroui/chip';
import { MenuService } from '@/services/menu.service';
import { CustomCakeService } from '@/services/customCake.service';
import type { CakeFlavor, CakeSize, CustomCakeTheme } from '@/types/api';

export default function CustomizeCakePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  // Customization options
  const [flavors, setFlavors] = useState<CakeFlavor[]>([]);
  const [sizes, setSizes] = useState<CakeSize[]>([]);
  const [themes, setThemes] = useState<CustomCakeTheme[]>([]);

  // Selected values
  const [selectedFlavor, setSelectedFlavor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [frostingColor, setFrostingColor] = useState('');
  const [frostingType, setFrostingType] = useState('');
  const [decorationDetails, setDecorationDetails] = useState('');
  const [cakeText, setCakeText] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [designComplexity, setDesignComplexity] = useState('simple');

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get session details
      const sessionData = await CustomCakeService.getSession(sessionId);
      setSession(sessionData);

      // Load customization options (using a dummy menu item ID or generic options)
      // In production, you might want to load these based on the specific cake type
      const itemDetails = await MenuService.getItemDetails(sessionData.menuItemId || 1);

      if (itemDetails.flavors) setFlavors(itemDetails.flavors);
      if (itemDetails.sizes) setSizes(itemDetails.sizes);
      if (itemDetails.themes) setThemes(itemDetails.themes);
    } catch (err: any) {
      console.error('Error loading session:', err);
      setError(err.message || 'Failed to load session. It may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFlavor || !selectedSize) {
      alert('Please select at least a flavor and size for your cake.');
      return;
    }

    try {
      setSaving(true);

      const customizationData = {
        flavor_id: parseInt(selectedFlavor),
        size_id: parseInt(selectedSize),
        theme_id: selectedTheme ? parseInt(selectedTheme) : undefined,
        frosting_color: frostingColor || undefined,
        frosting_type: frostingType || undefined,
        decoration_details: decorationDetails || undefined,
        cake_text: cakeText || undefined,
        special_instructions: specialInstructions || undefined,
        design_complexity: designComplexity,
      };

      await CustomCakeService.completeCustomization(sessionId, customizationData);

      // Show success message
      alert('🎉 Your custom cake design has been submitted! Please return to the kiosk.');

      // Redirect to a success page
      router.push('/customize/success');
    } catch (err: any) {
      console.error('Error submitting customization:', err);
      alert('Failed to submit your design. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-golden-orange/20 to-deep-amber/20 flex items-center justify-center p-4">
        <div className="text-center">
          <Spinner size="lg" color="warning" />
          <p className="mt-4 text-chocolate-brown text-xl">Loading customization options...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-golden-orange/20 to-deep-amber/20 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardBody className="text-center p-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-chocolate-brown mb-2">Session Error</h2>
            <p className="text-chocolate-brown/70 mb-4">{error}</p>
            <Button
              color="warning"
              onClick={() => router.push('/')}
            >
              Return to Kiosk
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-golden-orange/20 to-deep-amber/20 p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-golden-orange to-deep-amber text-white">
          <CardHeader className="flex flex-col items-center text-center p-6">
            <div className="text-6xl mb-2">🎨</div>
            <h1 className="text-3xl font-bold">Design Your Dream Cake</h1>
            <p className="text-white/90 mt-2">Create something special just for you</p>
          </CardHeader>
        </Card>

        {/* Flavor Selection */}
        {flavors.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-chocolate-brown flex items-center gap-2">
                <span>🍰</span> Choose Your Flavor
              </h2>
            </CardHeader>
            <CardBody>
              <Select
                label="Cake Flavor"
                placeholder="Select a flavor"
                value={selectedFlavor}
                onChange={(e) => setSelectedFlavor(e.target.value)}
                size="lg"
                isRequired
              >
                {flavors.map((flavor) => (
                  <SelectItem key={flavor.flavor_id.toString()} value={flavor.flavor_id.toString()}>
                    {flavor.flavor_name} {flavor.additional_cost > 0 && `(+$${Number(flavor.additional_cost).toFixed(2)})`}
                  </SelectItem>
                ))}
              </Select>
            </CardBody>
          </Card>
        )}

        {/* Size Selection */}
        {sizes.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-chocolate-brown flex items-center gap-2">
                <span>📏</span> Choose Your Size
              </h2>
            </CardHeader>
            <CardBody>
              <Select
                label="Cake Size"
                placeholder="Select a size"
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                size="lg"
                isRequired
              >
                {sizes.map((size) => (
                  <SelectItem key={size.size_id.toString()} value={size.size_id.toString()}>
                    {size.size_name} {size.serves_people && `(Serves ${size.serves_people})`}
                  </SelectItem>
                ))}
              </Select>
            </CardBody>
          </Card>
        )}

        {/* Theme Selection */}
        {themes.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-chocolate-brown flex items-center gap-2">
                <span>🎭</span> Choose a Theme (Optional)
              </h2>
            </CardHeader>
            <CardBody>
              <Select
                label="Cake Theme"
                placeholder="Select a theme"
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                size="lg"
              >
                {themes.map((theme) => (
                  <SelectItem key={theme.theme_id.toString()} value={theme.theme_id.toString()}>
                    {theme.theme_name} {theme.base_additional_cost > 0 && `(+$${Number(theme.base_additional_cost).toFixed(2)})`}
                  </SelectItem>
                ))}
              </Select>
            </CardBody>
          </Card>
        )}

        {/* Frosting Details */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold text-chocolate-brown flex items-center gap-2">
              <span>🎨</span> Frosting Details
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Frosting Color"
              placeholder="e.g., Pink, Blue, White"
              value={frostingColor}
              onChange={(e) => setFrostingColor(e.target.value)}
              size="lg"
            />
            <Select
              label="Frosting Type"
              placeholder="Select frosting type"
              value={frostingType}
              onChange={(e) => setFrostingType(e.target.value)}
              size="lg"
            >
              <SelectItem key="buttercream" value="buttercream">Buttercream</SelectItem>
              <SelectItem key="fondant" value="fondant">Fondant</SelectItem>
              <SelectItem key="whipped_cream" value="whipped_cream">Whipped Cream</SelectItem>
              <SelectItem key="ganache" value="ganache">Ganache</SelectItem>
              <SelectItem key="cream_cheese" value="cream_cheese">Cream Cheese</SelectItem>
            </Select>
          </CardBody>
        </Card>

        {/* Customization Details */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold text-chocolate-brown flex items-center gap-2">
              <span>✨</span> Additional Details
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Cake Text"
              placeholder="e.g., Happy Birthday!"
              value={cakeText}
              onChange={(e) => setCakeText(e.target.value)}
              size="lg"
              maxLength={50}
            />
            <Textarea
              label="Decoration Details"
              placeholder="Describe your desired decorations..."
              value={decorationDetails}
              onChange={(e) => setDecorationDetails(e.target.value)}
              size="lg"
              rows={3}
            />
            <Textarea
              label="Special Instructions"
              placeholder="Any additional requests or dietary restrictions..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              size="lg"
              rows={3}
            />
            <Select
              label="Design Complexity"
              value={designComplexity}
              onChange={(e) => setDesignComplexity(e.target.value)}
              size="lg"
            >
              <SelectItem key="simple" value="simple">Simple</SelectItem>
              <SelectItem key="moderate" value="moderate">Moderate</SelectItem>
              <SelectItem key="complex" value="complex">Complex</SelectItem>
              <SelectItem key="intricate" value="intricate">Intricate</SelectItem>
            </Select>
          </CardBody>
        </Card>

        {/* Submit Button */}
        <Card className="bg-gradient-to-r from-golden-orange to-deep-amber">
          <CardBody className="p-6">
            <Button
              size="lg"
              className="w-full bg-white text-deep-amber font-bold text-xl py-8 h-auto"
              onClick={handleSubmit}
              isLoading={saving}
              disabled={!selectedFlavor || !selectedSize}
            >
              {saving ? 'Submitting...' : '✨ Complete Design & Return to Kiosk'}
            </Button>
            {(!selectedFlavor || !selectedSize) && (
              <p className="text-white text-center mt-4 text-sm">
                * Flavor and Size are required
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
