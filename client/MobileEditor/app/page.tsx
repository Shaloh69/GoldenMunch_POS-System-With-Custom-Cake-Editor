'use client';

import { useEffect, useState, Suspense, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardBody } from '@nextui-org/card';
import { Button } from '@nextui-org/button';
import { Progress } from '@nextui-org/progress';
import { Spinner } from '@nextui-org/spinner';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { Popover, PopoverTrigger, PopoverContent } from '@nextui-org/popover';
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

  // Reference Image
  reference_image?: string; // Base64 or URL
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

  const [sessionValid, setSessionValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    // Debug mode bypass - skip session validation in development
    if (debugMode && process.env.NODE_ENV !== 'production') {
      console.log('🔧 DEBUG MODE: Bypassing session validation');
      setSessionValid(true);
      setLoading(false);
      return;
    }

    if (!sessionToken) {
      setSessionValid(false);
      setLoading(false);
      return;
    }

    validateSession();
  }, [sessionToken, debugMode]);

  const validateSession = async () => {
    if (!sessionToken) {
      setSessionValid(false);
      setLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      console.log('🔍 Validating session token:', sessionToken.substring(0, 20) + '...');
      console.log('🌐 API URL:', apiUrl);
      console.log('⚙️  Environment:', process.env.NODE_ENV);

      if (!process.env.NEXT_PUBLIC_API_URL) {
        console.warn('⚠️  WARNING: NEXT_PUBLIC_API_URL not set! Using default:', apiUrl);
        console.warn('⚠️  This may cause session validation to fail if API is on different server');
      }

      // Call real API to validate session
      const response = await fetch(`${apiUrl}/api/custom-cake/session/${sessionToken}`);

      console.log('📡 Session validation response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Session validation data:', data);

        if (data.success) {
          setSessionValid(true);
          console.log('✅ Session is valid!');
        } else {
          console.warn('❌ Session validation failed:', data);
          setSessionValid(false);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Session validation HTTP error:', response.status, errorData);
        setSessionValid(false);
      }
    } catch (error) {
      console.error('❌ Session validation exception:', error);
      setSessionValid(false);
    } finally {
      setLoading(false);
    }
  };

  // Loading state - EARLY RETURN BEFORE OTHER HOOKS
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
        <Card className="max-w-lg">
          <CardBody className="text-center p-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-5xl">❌</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-3">Session Expired</h1>
            <p className="text-gray-600 mb-4">
              Your design session has expired or is invalid.
            </p>
            <p className="text-gray-600 mb-6">
              Please generate a new QR code from the kiosk.
            </p>

            {/* Help Instructions */}
            <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-lg mb-6 text-left">
              <p className="text-sm font-semibold text-amber-900 mb-2">📍 How to get a new QR code:</p>
              <ol className="text-sm text-gray-700 space-y-1 ml-4 list-decimal">
                <li>Go back to the kiosk</li>
                <li>Select "Custom Cake" from the menu</li>
                <li>Tap "Design Your Cake"</li>
                <li>Scan the new QR code with your phone</li>
              </ol>
            </div>

            {/* Debug Info */}
            {sessionToken && (
              <details className="text-left mb-6 bg-gray-50 p-3 rounded border">
                <summary className="text-xs font-medium text-gray-600 cursor-pointer">▶ Debug Info (for staff)</summary>
                <div className="mt-2 text-xs font-mono text-gray-500 space-y-1">
                  <p><strong>Session Token:</strong> {sessionToken.substring(0, 40)}...</p>
                  <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api (DEFAULT - NOT CONFIGURED!)'}</p>
                  <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
                  <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
                  <p><strong>Timezone:</strong> {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
                  {!process.env.NEXT_PUBLIC_API_URL && (
                    <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
                      <p className="text-red-700 font-semibold">⚠️ CONFIGURATION ISSUE:</p>
                      <p className="text-red-600">NEXT_PUBLIC_API_URL environment variable is not set!</p>
                      <p className="text-red-600 mt-1">Session validation may fail if API server is on a different host.</p>
                    </div>
                  )}
                </div>
              </details>
            )}

            <Button
              color="warning"
              size="lg"
              className="w-full"
              onClick={() => window.location.href = '/'}
            >
              Return to Kiosk
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Session is valid - render main editor
  // TypeScript: sessionToken is guaranteed to be non-null here due to early returns above
  return <CakeEditorMain sessionToken={sessionToken!} debugMode={debugMode} />;
}

// Separate component for main editor to avoid hook ordering issues
function CakeEditorMain({ sessionToken, debugMode }: { sessionToken: string; debugMode: boolean }) {
  const canvasRef = useRef<any>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestId, setRequestId] = useState<number | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showFullscreenTip, setShowFullscreenTip] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);

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

  // Fetch design options on mount (session already validated by parent)
  useEffect(() => {
    fetchDesignOptions();
  }, []);

  const fetchDesignOptions = async () => {
    try {
      // Fetch real options from API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/custom-cake/options`);

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

  // Auto-save design with longer debounce for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sessionToken && currentStep > 0) {
        saveDraft();
      }
    }, 5000); // Auto-save after 5 seconds of inactivity (increased from 3s)

    return () => clearTimeout(timer);
  }, [design, currentStep, sessionToken]);

  const saveDraft = async (): Promise<number | null> => {
    // Skip saving in debug mode
    if (debugMode && process.env.NODE_ENV !== 'production') {
      console.log('🔧 DEBUG MODE: Skipping draft save');
      return null;
    }

    if (!sessionToken) return null;

    try {
      setSaving(true);

      // Call real API to save draft
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/custom-cake/save-draft`, {
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
      if (data.data && data.data.request_id) {
        const newRequestId = data.data.request_id;
        setRequestId(newRequestId);
        return newRequestId; // Return the request_id for immediate use
      }

      return null;
    } catch (error) {
      console.error('Failed to save draft:', error);
      // Don't show error to user for auto-save
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Memoized navigation handlers
  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const captureScreenshots = async (): Promise<string[]> => {
    const screenshots: string[] = [];

    if (!canvasRef.current) {
      console.warn('⚠️ Canvas ref not available - cannot capture screenshots');
      return screenshots;
    }

    if (!canvasRef.current.captureScreenshot) {
      console.warn('⚠️ captureScreenshot method not available on canvas');
      return screenshots;
    }

    try {
      // Capture from different angles
      const angles = ['front', 'side', 'top', '3d_perspective'];
      console.log('📸 Capturing 3D screenshots from', angles.length, 'angles...');

      for (const angle of angles) {
        console.log(`  📷 Capturing ${angle} view...`);
        const screenshot = await canvasRef.current.captureScreenshot(angle);
        if (screenshot) {
          const sizeKB = Math.round((screenshot.length * 3) / 4 / 1024);
          console.log(`  ✅ ${angle} captured (${sizeKB} KB)`);
          screenshots.push(screenshot);
        } else {
          console.warn(`  ⚠️ ${angle} capture returned null`);
        }
      }

      console.log(`✅ Total screenshots captured: ${screenshots.length}/${angles.length}`);
    } catch (error) {
      console.error('❌ Failed to capture screenshots:', error);
    }

    return screenshots;
  };

  const handleSubmitClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    await handleSubmit();
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

        setSubmitting(false);
        setShowSuccessModal(true);
        return;
      }

      // Step 1: Save final draft to get request_id
      let finalRequestId = requestId;
      if (!finalRequestId) {
        const savedRequestId = await saveDraft();
        if (!savedRequestId) {
          throw new Error('Failed to save draft and get request ID');
        }
        finalRequestId = savedRequestId;
      }

      // Step 2: Capture 3D screenshots
      const screenshots = await captureScreenshots();

      // Step 3: Upload images (if we have them)
      if (screenshots.length > 0 && finalRequestId) {
        try {
          const imageUploads = screenshots.map((dataUrl, index) => ({
            url: dataUrl,
            type: '3d_render',
            view_angle: ['front', 'side', 'top', '3d_perspective'][index] || 'front',
          }));

          console.log(`📤 Uploading ${imageUploads.length} images to server...`);

          const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/custom-cake/upload-images`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              request_id: finalRequestId,
              images: imageUploads,
            }),
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({ message: 'Upload failed' }));
            console.error('❌ Image upload failed:', errorData);
            console.warn('⚠️ Continuing without images - admin won\'t see preview');
          } else {
            const uploadResult = await uploadResponse.json();
            console.log('✅ Images uploaded successfully:', uploadResult);
          }
        } catch (error) {
          console.error('❌ Failed to upload images:', error);
          console.warn('⚠️ Continuing without images - admin won\'t see preview');
        }
      } else if (screenshots.length === 0) {
        console.warn('⚠️ No screenshots captured - admin won\'t see 3D preview');
      }

      // Step 4: Submit for review
      const submitResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/custom-cake/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: finalRequestId,
        }),
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to submit request');
      }

      const result = await submitResponse.json();

      // Success! Show confirmation modal
      setShowSuccessModal(true);

      // Auto-close window after 8 seconds
      setTimeout(() => {
        window.close();
        // Fallback if window.close() doesn't work (e.g., not opened by script)
        // Redirect to a closing page or show a message
        if (!window.closed) {
          window.location.href = 'about:blank';
        }
      }, 8000);

    } catch (error: any) {
      console.error('Failed to submit:', error);
      alert(`❌ Failed to submit request: ${error.message || 'Unknown error'}\n\nPlease try again or contact staff for assistance.`);
    } finally {
      setSubmitting(false);
    }
  };

  // Memoized design update function
  const updateDesign = useCallback((updates: Partial<CakeDesign>) => {
    setDesign((prev) => ({ ...prev, ...updates }));
  }, []);

  const tutorialSteps = [
    {
      title: "Welcome! 🎂",
      content: "Let's explore the new mobile-friendly cake designer!",
      target: "welcome",
      placement: "top" as const
    },
    {
      title: "Live Pricing",
      content: "Your estimated price updates automatically as you customize! Tap to see details.",
      target: "price",
      placement: "top" as const
    },
    {
      title: "Hide Control Panel",
      content: "Swipe down on the drag handle, tap the X button, or use the toggle button to hide this panel for a full 3D cake view!",
      target: "panel",
      placement: "top" as const
    },
    {
      title: "Important Note! ⚠️",
      content: "This 3D cake is just a preview. The actual cake may differ. Wait for final verification from our team!",
      target: "disclaimer",
      placement: "top" as const
    }
  ];

  const handleNextTutorialStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setShowTutorial(false);
      localStorage.setItem('cakeEditorTutorialCompleted', 'true');
      // Show disclaimer modal after completing tutorial
      setShowDisclaimerModal(true);
    }
  };

  const handleSkipTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('cakeEditorTutorialCompleted', 'true');
    // Show disclaimer modal when tutorial is skipped
    setShowDisclaimerModal(true);
  };

  // Check if user has seen tutorial
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('cakeEditorTutorialCompleted');
    if (hasSeenTutorial === 'true') {
      setShowTutorial(false);
    }
  }, []);

  const CurrentStepComponent = STEPS[currentStep].component;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  // Memoize calculated price to prevent recalculation on every render
  const estimatedPrice = useMemo(() => calculatePrice(design), [design]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 overflow-hidden">
      {/* Full Screen 3D Canvas */}
      <div className="absolute inset-0 z-0">
        <CakeCanvas3D ref={canvasRef} design={design} options={options} />
      </div>

      {/* Toggle Controls Button - Floats above panel when visible, center when hidden */}
      {!showControls && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          {showTutorial && tutorialStep === 0 ? (
            <Popover
              isOpen={true}
              placement={tutorialSteps[0].placement}
              showArrow
            >
              <PopoverTrigger>
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  onClick={() => setShowControls(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full shadow-2xl hover:scale-105 transition-all active:scale-95 min-w-[64px] min-h-[64px] flex items-center justify-center gap-3 touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  aria-label="Show controls"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                  </svg>
                  <span className="text-base font-bold">Show Panel</span>
                </motion.button>
              </PopoverTrigger>
              <PopoverContent className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-2 border-white max-w-xs">
                <div className="p-3">
                  <div className="text-base font-bold mb-2">{tutorialSteps[0].title}</div>
                  <div className="text-sm mb-3">{tutorialSteps[0].content}</div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSkipTutorial}
                      className="flex-1 bg-white/20 text-white font-bold"
                    >
                      Skip
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleNextTutorialStep}
                      className="flex-1 bg-white text-purple-600 font-bold"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={() => setShowControls(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full shadow-2xl hover:scale-105 transition-all active:scale-95 min-w-[64px] min-h-[64px] flex items-center justify-center gap-3 touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Show controls"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
              </svg>
              <span className="text-base font-bold">Show Panel</span>
            </motion.button>
          )}
        </div>
      )}


      {/* Help Button (restart tutorial) - Moved to top right */}
      {!showTutorial && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => {
            setShowTutorial(true);
            setTutorialStep(0);
          }}
          className="fixed top-2 right-2 sm:top-3 sm:right-3 z-50 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-full shadow-2xl hover:scale-110 transition-all min-w-[48px] min-h-[48px] flex items-center justify-center"
          aria-label="Restart tutorial"
        >
          <QuestionMarkCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </motion.button>
      )}

      {/* Fullscreen Tip - Show after tutorial */}
      <AnimatePresence>
        {showFullscreenTip && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-16 left-1/2 transform -translate-x-1/2 z-50 max-w-sm"
          >
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-xl shadow-2xl border-2 border-white">
              <p className="text-sm font-bold text-center">
                💡 Tip: For best experience, click the fullscreen button on your browser!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hideable Controls Footer Panel */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 300 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              // If dragged down more than 100px or with sufficient velocity, hide panel
              if (offset.y > 100 || velocity.y > 500) {
                setShowControls(false);
              }
            }}
            className="fixed left-0 right-0 bottom-0 bg-white/98 backdrop-blur-xl shadow-2xl z-40 rounded-t-3xl border-t-4 border-purple-300 max-h-[75vh] flex flex-col touch-pan-y"
          >
            {/* Drag Handle - Now functional! */}
            <div className="flex justify-center pt-4 pb-3 cursor-grab active:cursor-grabbing touch-manipulation" style={{ WebkitTapHighlightColor: 'transparent' }}>
              <div className="w-20 h-2 bg-gray-400 rounded-full"></div>
            </div>

            {/* Header with Price, Progress, and Close Button */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <h1 className="text-base sm:text-lg font-bold">🎂 Customize Your Cake</h1>
                  <p className="text-xs opacity-90">Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].name}</p>
                </div>

                {/* Price Display */}
                <Popover
                  isOpen={showTutorial && tutorialStep === 1}
                  placement="top"
                  showArrow
                >
                  <PopoverTrigger>
                    <div className="bg-white/20 backdrop-blur-md rounded-lg px-3 py-2 ml-2">
                      <p className="text-xs font-bold">Est. Price</p>
                      <p className="text-lg sm:text-xl font-bold">₱{estimatedPrice}</p>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-2 border-white max-w-xs">
                    <div className="p-3">
                      <div className="text-base font-bold mb-2">{tutorialSteps[1].title}</div>
                      <div className="text-sm mb-3">{tutorialSteps[1].content}</div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSkipTutorial}
                          className="flex-1 bg-white/20 text-white font-bold"
                        >
                          Skip
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleNextTutorialStep}
                          className="flex-1 bg-white text-purple-600 font-bold"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Close Button */}
                <button
                  onClick={() => setShowControls(false)}
                  className="ml-2 p-3 hover:bg-white/20 rounded-full transition-colors active:scale-95 min-w-[52px] min-h-[52px] flex items-center justify-center touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  aria-label="Hide panel"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <Progress value={progress} className="mt-1" classNames={{ indicator: 'bg-white' }} size="sm" />
              {saving && (
                <div className="flex items-center gap-2 text-xs mt-2">
                  <Spinner size="sm" color="white" />
                  <span>Saving...</span>
                </div>
              )}
            </div>

            {/* Tutorial Popover for Panel */}
            <Popover
              isOpen={showTutorial && tutorialStep === 2}
              placement="top"
              showArrow
            >
              <PopoverTrigger>
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-1 z-10"></div>
              </PopoverTrigger>
              <PopoverContent className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-2 border-white max-w-xs">
                <div className="p-3">
                  <div className="text-base font-bold mb-2">{tutorialSteps[2].title}</div>
                  <div className="text-sm mb-3">{tutorialSteps[2].content}</div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSkipTutorial}
                      className="flex-1 bg-white/20 text-white font-bold"
                    >
                      Skip
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleNextTutorialStep}
                      className="flex-1 bg-white text-purple-600 font-bold"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Scrollable Step Content */}
            <div className="overflow-y-auto flex-1 px-4 py-3">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CurrentStepComponent
                  design={design}
                  updateDesign={updateDesign}
                  options={options}
                />
              </motion.div>

              {/* Disclaimer Tutorial Step */}
              {showTutorial && tutorialStep === 3 && (
                <div className="mt-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white border-2 border-white rounded-lg shadow-2xl p-3">
                  <div className="text-base font-bold mb-2">{tutorialSteps[3].title}</div>
                  <div className="text-sm mb-3">{tutorialSteps[3].content}</div>
                  <Button
                    size="sm"
                    onClick={handleNextTutorialStep}
                    className="w-full bg-white text-purple-600 font-bold"
                  >
                    Got it!
                  </Button>
                </div>
              )}
            </div>

            {/* Navigation Buttons - Sticky at bottom */}
            <div className="flex-shrink-0 bg-white border-t-2 border-gray-200 px-4 py-3 safe-area-inset-bottom">
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button
                    onClick={handlePrevious}
                    startContent={<ArrowLeftIcon className="w-4 h-4" />}
                    className="flex-1 bg-gray-600 text-white font-bold text-sm py-5 min-h-[48px]"
                  >
                    Previous
                  </Button>
                )}
                {currentStep < STEPS.length - 1 ? (
                  <Button
                    onClick={handleNext}
                    endContent={<ArrowRightIcon className="w-4 h-4" />}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm py-5 min-h-[48px]"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitClick}
                    isLoading={submitting}
                    endContent={<CheckCircleIcon className="w-5 h-5" />}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-base py-5 min-h-[48px]"
                  >
                    Submit
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-black mb-3">Are you Finished?</h2>
                <p className="text-lg text-black/90 mb-4 font-semibold">
                  Ready to submit your custom cake design for review?
                </p>

                {/* Important Disclaimer */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-300 mb-6 text-left">
                  <h4 className="font-bold text-amber-900 mb-3 text-base">⚠️ Important Disclaimer</h4>
                  <div className="space-y-2 text-sm text-black/80">
                    <p className="font-semibold">
                      • The 3D cake is <span className="text-amber-700 font-bold">for reference purposes only</span>
                    </p>
                    <p className="font-semibold">
                      • Admin will contact you for further details and finalizations
                    </p>
                    <p className="font-semibold">
                      • <span className="text-red-600 font-bold">Make sure you inputted the right credentials</span> for this exact purpose or we will not be able to contact you
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 bg-gray-600 text-white font-bold py-4 text-base"
                  >
                    Go Back
                  </Button>
                  <Button
                    onClick={handleConfirmSubmit}
                    isLoading={submitting}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-4 text-base"
                  >
                    Yes, Submit!
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disclaimer Modal - Shown after tutorial completion or skip */}
      <AnimatePresence>
        {showDisclaimerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowDisclaimerModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center">
                  <span className="text-4xl">⚠️</span>
                </div>
                <h2 className="text-2xl font-bold text-black mb-3">Important Reminder</h2>

                {/* Important Disclaimer */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-300 mb-4 text-left">
                  <h4 className="font-bold text-amber-900 mb-3 text-base">📋 Please Note:</h4>
                  <div className="space-y-2 text-sm text-black/80">
                    <p className="font-semibold">
                      • The 3D cake preview is <span className="text-amber-700 font-bold">for reference purposes only</span>
                    </p>
                    <p className="font-semibold">
                      • The actual cake may differ from the preview
                    </p>
                    <p className="font-semibold">
                      • <span className="text-amber-700 font-bold">Candles and decorations</span> will be added by our baker
                    </p>
                    <p className="font-semibold">
                      • Admin will contact you for further details and final verification
                    </p>
                    <p className="font-semibold">
                      • <span className="text-red-600 font-bold">Ensure your contact information is correct</span> so we can reach you
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => setShowDisclaimerModal(false)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 text-base"
                >
                  I Understand
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center"
                >
                  <CheckCircleIcon className="w-12 h-12 text-white" />
                </motion.div>

                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-black mb-3"
                >
                  Success! 🎉
                </motion.h2>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-3 mb-6"
                >
                  <p className="text-lg text-black font-semibold">
                    Your cake will be up for checking and verification
                  </p>
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 border-2 border-purple-200">
                    <p className="text-base text-black font-bold mb-2">📧 What's Next?</p>
                    <ul className="text-left text-black/80 space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-lg">✉️</span>
                        <span className="font-semibold">Check your email for further information about your order</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-lg">⏱️</span>
                        <span className="font-semibold">Typical response time is a few hours to a day</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-lg">💰</span>
                        <span className="font-semibold">We'll send you the final pricing and confirmation</span>
                      </li>
                    </ul>
                  </div>

                  {/* Important Disclaimer */}
                  <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-4 border-2 border-amber-300 mt-3">
                    <p className="text-base text-black font-bold mb-2">⚠️ Important Note</p>
                    <p className="text-black/80 font-semibold text-xs">
                      The 3D cake preview is just a visualization. The actual cake may differ from what you see.
                      Please wait for final verification and approval from our team before your cake is prepared.
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    onClick={() => window.location.reload()}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 text-base"
                  >
                    Create Another Cake
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
