'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardBody } from '@nextui-org/card';
import { Button } from '@nextui-org/button';
import { Progress } from '@nextui-org/progress';
import { Spinner } from '@nextui-org/spinner';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import StepCustomerInfo from '@/components/cake-editor/steps/StepCustomerInfo';
import StepLayers from '@/components/cake-editor/steps/StepLayers';
import StepFlavor from '@/components/cake-editor/steps/StepFlavor';
import StepSize from '@/components/cake-editor/steps/StepSize';
import StepFrosting from '@/components/cake-editor/steps/StepFrosting';
import StepDecorations from '@/components/cake-editor/steps/StepDecorations';
import StepText from '@/components/cake-editor/steps/StepText';
import StepReview from '@/components/cake-editor/steps/StepReview';
import { CustomCakeService } from '@/services/customCake.service';

// Dynamic import for 3D canvas to prevent SSR issues
const CakeCanvas3D = dynamic(() => import('@/components/cake-editor/CakeCanvas3D'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96"><Spinner size="lg" /></div>,
});

// Design Data Interface
export interface CakeDesign {
  // Customer
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  event_type?: string;
  event_date?: string;

  // Structure
  num_layers: number;
  layer_1_flavor_id?: number;
  layer_2_flavor_id?: number;
  layer_3_flavor_id?: number;
  layer_4_flavor_id?: number;
  layer_5_flavor_id?: number;
  layer_1_size_id?: number;
  layer_2_size_id?: number;
  layer_3_size_id?: number;
  layer_4_size_id?: number;
  layer_5_size_id?: number;

  // Decorations
  theme_id?: number;
  frosting_type: string;
  frosting_color: string;
  candles_count: number;
  candle_type: string;
  candle_numbers?: string;

  // Text
  cake_text?: string;
  text_color?: string;
  text_font?: string;
  text_position?: string;

  // 3D
  decorations_3d?: any[];

  // Notes
  special_instructions?: string;
  dietary_restrictions?: string;
}

// Editor Steps
const STEPS = [
  { id: 1, name: 'Customer Info', component: StepCustomerInfo },
  { id: 2, name: 'Layers', component: StepLayers },
  { id: 3, name: 'Flavors', component: StepFlavor },
  { id: 4, name: 'Sizes', component: StepSize },
  { id: 5, name: 'Frosting', component: StepFrosting },
  { id: 6, name: 'Decorations', component: StepDecorations },
  { id: 7, name: 'Text', component: StepText },
  { id: 8, name: 'Review', component: StepReview },
];

function CakeEditorContent() {
  const searchParams = useSearchParams();
  const sessionToken = searchParams?.get('session');
  const debugMode = searchParams?.get('debug') === 'true';
  const canvasRef = useRef<any>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestId, setRequestId] = useState<number | null>(null);

  // Design Options from API
  const [options, setOptions] = useState<any>(null);

  // Cake Design State
  const [design, setDesign] = useState<CakeDesign>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    num_layers: 1,
    frosting_type: 'buttercream',
    frosting_color: '#FFFFFF',
    candles_count: 0,
    candle_type: 'regular',
    decorations_3d: [],
  });

  // Validate session on mount
  useEffect(() => {
    // Debug mode bypass - skip session validation in development
    if (debugMode && process.env.NODE_ENV !== 'production') {
      console.log('🔧 DEBUG MODE: Bypassing session validation');
      setSessionValid(true);
      setLoading(false);
      fetchDesignOptions();
      return;
    }

    if (!sessionToken) {
      setSessionValid(false);
      setLoading(false);
      return;
    }

    validateSession();
    fetchDesignOptions();
  }, [sessionToken, debugMode]);

  const validateSession = async () => {
    if (!sessionToken) {
      setSessionValid(false);
      setLoading(false);
      return;
    }

    try {
      // Call real API to validate session
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/custom-cake/session/${sessionToken}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSessionValid(true);
        } else {
          setSessionValid(false);
        }
      } else {
        setSessionValid(false);
      }
    } catch (error) {
      console.error('Session validation failed:', error);
      setSessionValid(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchDesignOptions = async () => {
    try {
      // Fetch real options from API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/custom-cake/options`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setOptions(data.data);
        } else {
          // Fallback to mock data
          useMockData();
        }
      } else {
        useMockData();
      }
    } catch (error) {
      console.error('Failed to fetch design options:', error);
      useMockData();
    }
  };

  const useMockData = () => {
    setOptions({
      flavors: [
        { flavor_id: 1, flavor_name: 'Chocolate', description: 'Rich chocolate', base_price_per_tier: 100 },
        { flavor_id: 2, flavor_name: 'Vanilla', description: 'Classic vanilla', base_price_per_tier: 80 },
        { flavor_id: 3, flavor_name: 'Strawberry', description: 'Fresh strawberry', base_price_per_tier: 90 },
        { flavor_id: 4, flavor_name: 'Red Velvet', description: 'Velvety smooth', base_price_per_tier: 120 },
      ],
      sizes: [
        { size_id: 1, size_name: 'Small (6")', diameter_cm: 15, servings: 8, base_price_multiplier: 1.0 },
        { size_id: 2, size_name: 'Medium (8")', diameter_cm: 20, servings: 16, base_price_multiplier: 1.5 },
        { size_id: 3, size_name: 'Large (10")', diameter_cm: 25, servings: 24, base_price_multiplier: 2.0 },
        { size_id: 4, size_name: 'XL (12")', diameter_cm: 30, servings: 36, base_price_multiplier: 2.5 },
      ],
      themes: [
        { theme_id: 1, theme_name: 'Birthday', base_additional_cost: 200 },
        { theme_id: 2, theme_name: 'Wedding', base_additional_cost: 500 },
        { theme_id: 3, theme_name: 'Anniversary', base_additional_cost: 300 },
      ],
      frostingTypes: ['buttercream', 'fondant', 'whipped_cream', 'ganache', 'cream_cheese'],
      candleTypes: ['number', 'regular', 'sparkler', 'none'],
      textFonts: ['script', 'bold', 'elegant', 'playful', 'modern'],
      textPositions: ['top', 'center', 'bottom'],
    });
  };

  // Auto-save design
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sessionToken && sessionValid && currentStep > 0) {
        saveDraft();
      }
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(timer);
  }, [design, currentStep]);

  const saveDraft = async () => {
    // Skip saving in debug mode
    if (debugMode && process.env.NODE_ENV !== 'production') {
      console.log('🔧 DEBUG MODE: Skipping draft save');
      return;
    }

    if (!sessionToken || !sessionValid) return;

    try {
      setSaving(true);

      // Call real API to save draft
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/custom-cake/save-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_token: sessionToken,
          ...design,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save draft');
      }

      const data = await response.json();
      console.log('Draft saved successfully:', data);

      // Store request_id if returned
      if (data.data && data.data.request_id && !requestId) {
        setRequestId(data.data.request_id);
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
      // Don't show error to user for auto-save
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const captureScreenshots = async (): Promise<string[]> => {
    const screenshots: string[] = [];

    if (canvasRef.current && canvasRef.current.captureScreenshot) {
      try {
        // Capture from different angles
        const angles = ['front', 'side', 'top', '3d_perspective'];

        for (const angle of angles) {
          const screenshot = await canvasRef.current.captureScreenshot(angle);
          if (screenshot) {
            screenshots.push(screenshot);
          }
        }
      } catch (error) {
        console.error('Failed to capture screenshots:', error);
      }
    }

    return screenshots;
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // Debug mode - just show success message without API calls
      if (debugMode && process.env.NODE_ENV !== 'production') {
        console.log('🔧 DEBUG MODE: Simulating submission');
        console.log('Design data:', design);

        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        alert(`🔧 DEBUG MODE - Design Preview:\n\nCustomer: ${design.customer_name}\nEmail: ${design.customer_email}\nPhone: ${design.customer_phone}\nLayers: ${design.num_layers}\nFrosting: ${design.frosting_type}\nColor: ${design.frosting_color}\n\n(This is a debug preview - no actual submission occurred)`);

        setSubmitting(false);
        return;
      }

      // Step 1: Save final draft to get request_id
      if (!requestId) {
        await saveDraft();
      }

      // Step 2: Capture 3D screenshots
      const screenshots = await captureScreenshots();

      // Step 3: Upload images (if we have them)
      if (screenshots.length > 0 && requestId) {
        try {
          const imageUploads = screenshots.map((dataUrl, index) => ({
            url: dataUrl,
            type: '3d_render',
            view_angle: ['front', 'side', 'top', '3d_perspective'][index] || 'front',
          }));

          await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/custom-cake/upload-images`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              request_id: requestId,
              images: imageUploads,
            }),
          });
        } catch (error) {
          console.error('Failed to upload images:', error);
          // Continue even if image upload fails
        }
      }

      // Step 4: Submit for review
      const submitResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/custom-cake/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
        }),
      });

      if (!submitResponse.ok) {
        throw new Error('Failed to submit request');
      }

      const result = await submitResponse.json();

      // Success! Show confirmation
      alert(`✅ Success! Your custom cake request has been submitted!\n\nRequest ID: ${requestId}\n\nWe'll review your design and contact you at ${design.customer_email} within 24 hours with pricing and availability.`);

      // Optionally redirect to a success page
      // window.location.href = '/custom-cake/success';

    } catch (error: any) {
      console.error('Failed to submit:', error);
      alert(`❌ Failed to submit request: ${error.message || 'Unknown error'}\n\nPlease try again or contact staff for assistance.`);
    } finally {
      setSubmitting(false);
    }
  };

  const updateDesign = (updates: Partial<CakeDesign>) => {
    setDesign({ ...design, ...updates });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="text-center">
          <Spinner size="lg" color="warning" />
          <p className="mt-4 text-gray-600">Loading cake editor...</p>
        </div>
      </div>
    );
  }

  // No session token - show landing page (unless in debug mode)
  if (!sessionToken && !(debugMode && process.env.NODE_ENV !== 'production')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 p-4">
        <Card className="max-w-md">
          <CardBody className="text-center p-8">
            <div className="w-20 h-20 mx-auto mb-4">
              <span className="text-6xl">🎂</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">GoldenMunch</h1>
            <h2 className="text-xl font-semibold text-amber-600 mb-4">Custom Cake Designer</h2>
            <p className="text-gray-600 mb-6">
              Please scan the QR code from our kiosk to start designing your custom cake!
            </p>
            <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
              <p className="text-sm text-gray-700">
                📍 Visit our kiosk and select "Custom Cake" to get started
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Invalid session
  if (!sessionValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
        <Card className="max-w-md">
          <CardBody className="text-center p-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Session Expired</h1>
            <p className="text-gray-600 mb-6">
              Your design session has expired or is invalid. Please generate a new QR code from the kiosk.
            </p>
            <Button color="warning" onClick={() => window.location.href = '/'}>
              Start Over
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const CurrentStepComponent = STEPS[currentStep].component;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50">
      {/* Debug Mode Banner */}
      {debugMode && process.env.NODE_ENV !== 'production' && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 text-center text-sm font-semibold shadow-lg">
          🔧 DEBUG MODE ACTIVE - Session validation bypassed | No data will be saved
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">🎂 Custom Cake Designer</h1>
              <p className="text-sm text-gray-600">Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].name}</p>
            </div>
            {saving && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Spinner size="sm" />
                <span>Saving...</span>
              </div>
            )}
          </div>
          <Progress value={progress} color="warning" className="max-w-full" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 3D Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="order-2 lg:order-1"
          >
            <Card className="sticky top-24">
              <CardBody className="p-6">
                <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden">
                  <CakeCanvas3D ref={canvasRef} design={design} options={options} />
                </div>
                <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                  <p className="text-sm font-medium text-amber-900">Estimated Price</p>
                  <p className="text-2xl font-bold text-amber-600">₱{calculatePrice(design)}</p>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Step Content */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="order-1 lg:order-2"
          >
            <Card>
              <CardBody className="p-6">
                <CurrentStepComponent
                  design={design}
                  updateDesign={updateDesign}
                  options={options}
                />

                {/* Navigation */}
                <div className="flex gap-3 mt-8">
                  {currentStep > 0 && (
                    <Button
                      variant="flat"
                      onClick={handlePrevious}
                      startContent={<ArrowLeftIcon className="w-4 h-4" />}
                      className="flex-1"
                    >
                      Previous
                    </Button>
                  )}
                  {currentStep < STEPS.length - 1 ? (
                    <Button
                      color="primary"
                      onClick={handleNext}
                      endContent={<ArrowRightIcon className="w-4 h-4" />}
                      className="flex-1"
                    >
                      Next Step
                    </Button>
                  ) : (
                    <Button
                      color="success"
                      onClick={handleSubmit}
                      isLoading={submitting}
                      endContent={<CheckCircleIcon className="w-5 h-5" />}
                      className="flex-1"
                    >
                      Submit for Review
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Price Calculator
function calculatePrice(design: CakeDesign): number {
  const BASE_PRICE = 500;
  const LAYER_PRICE = 150;
  const DECORATION_PRICE = 100;

  let total = BASE_PRICE;
  total += (design.num_layers - 1) * LAYER_PRICE;
  if (design.decorations_3d && design.decorations_3d.length > 0) {
    total += DECORATION_PRICE;
  }

  return total;
}

// Main export with Suspense
export default function CakeEditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    }>
      <CakeEditorContent />
    </Suspense>
  );
}
