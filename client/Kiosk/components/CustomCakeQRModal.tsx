'use client';

import React, { useEffect, useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Button } from '@heroui/button';
import { Spinner } from '@heroui/spinner';
import { Card, CardBody } from '@heroui/card';
import Image from 'next/image';
import { CustomCakeService, CustomCakeSessionResponse } from '@/services/customCake.service';

interface CustomCakeQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (customizationData: any) => void;
  kioskSessionId: string;
  menuItemId?: number;
}

export const CustomCakeQRModal: React.FC<CustomCakeQRModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  kioskSessionId,
  menuItemId,
}) => {
  const [session, setSession] = useState<CustomCakeSessionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(7200); // 2 hours in seconds (matches server session expiry)

  // Create session when modal opens
  useEffect(() => {
    if (isOpen) {
      createSession();
    } else {
      // Clean up when modal closes
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      if (session) {
        // Cancel the session if it wasn't completed
        CustomCakeService.cancelSession(session.sessionToken).catch(console.error);
      }
      setSession(null);
      setIsLoading(true);
      setError(null);
      setTimeRemaining(900);
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || !session) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, session]);

  const createSession = async () => {
    try {
      console.log('🎨 [QR Modal] Creating session...', { kioskSessionId });
      setIsLoading(true);
      setError(null);

      const sessionData = await CustomCakeService.generateQRSession(kioskSessionId);
      console.log('✅ [QR Modal] Session created successfully:', {
        sessionToken: sessionData.sessionToken.substring(0, 30) + '...',
        expiresIn: sessionData.expiresIn,
      });
      setSession(sessionData);

      // Start polling for completion
      console.log('🔄 [QR Modal] Starting polling...');
      startPolling(sessionData.sessionToken);
    } catch (err) {
      console.error('❌ [QR Modal] Failed to create session:', err);
      setError('Failed to create customization session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = (sessionId: string) => {
    const interval = setInterval(async () => {
      try {
        const status = await CustomCakeService.pollSessionStatus(sessionId);

        if (status.status === 'completed' && status.customizationData) {
          // Customization is complete!
          console.log('🎉 [QR Modal] Customization completed!', {
            status: status.status,
            hasData: !!status.customizationData,
          });
          if (pollingInterval) {
            clearInterval(pollingInterval);
          }
          onComplete(status.customizationData);
          onClose();
        } else if (status.status === 'expired') {
          console.warn('⏰ [QR Modal] Session expired');
          handleTimeout();
        }
      } catch (err) {
        console.error('❌ [QR Modal] Polling error:', err);
      }
    }, 2000); // Poll every 2 seconds

    setPollingInterval(interval);
  };

  const handleTimeout = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setError('Session expired. Please try again.');
  };

  const handleCancel = () => {
    if (session && pollingInterval) {
      CustomCakeService.cancelSession(session.sessionToken).catch(console.error);
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      size="2xl"
      backdrop="blur"
      classNames={{
        backdrop: 'bg-gradient-to-t from-purple-900/50 to-pink-900/50',
        base: 'border-2 border-purple-200 bg-white shadow-2xl',
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-2 text-center pt-8">
          <h2 className="text-4xl font-bold text-black">
            🎨 Design Your Custom Cake
          </h2>
          <p className="text-lg text-black/70 font-semibold">
            Scan the QR code with your phone to start customizing
          </p>
        </ModalHeader>
        <ModalBody className="py-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Spinner size="lg" className="mb-6" style={{ color: '#9333ea' }} />
              <p className="text-2xl font-bold text-black mb-4">✨ Creating Your Session...</p>
              <div className="text-base text-black/70 space-y-2 text-center font-medium">
                <p>🎨 Preparing canvas</p>
                <p>🍰 Loading design tools</p>
                <p>📱 Generating QR code</p>
              </div>
            </div>
          ) : error ? (
            <Card className="bg-red-50 border-3 border-red-300 shadow-xl">
              <CardBody>
                <div className="text-center py-8">
                  <p className="text-2xl text-black font-bold mb-4">⚠️ {error}</p>
                  <Button
                    className="bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 text-white font-bold text-lg py-6 px-8"
                    onClick={createSession}
                  >
                    Try Again
                  </Button>
                </div>
              </CardBody>
            </Card>
          ) : session ? (
            <div className="flex flex-col items-center gap-6 py-4">
              {/* QR Code */}
              <Card className="shadow-2xl border-4 border-purple-300 bg-white">
                <CardBody className="p-8">
                  <div className="relative w-80 h-80 bg-white flex items-center justify-center rounded-xl">
                    <Image
                      src={session.qrCodeUrl}
                      alt="Custom Cake QR Code"
                      width={320}
                      height={320}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Instructions */}
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3 text-xl">
                  <span className="text-3xl">⏱️</span>
                  <span className="font-bold text-purple-600 text-2xl">{formatTime(timeRemaining)}</span>
                  <span className="text-black font-semibold">remaining</span>
                </div>

                <div className="space-y-3 text-base text-black font-semibold">
                  <p className="flex items-center justify-center gap-3">
                    <span className="text-2xl">📱</span>
                    <span>Open your phone's camera app</span>
                  </p>
                  <p className="flex items-center justify-center gap-3">
                    <span className="text-2xl">🎯</span>
                    <span>Point it at the QR code above</span>
                  </p>
                  <p className="flex items-center justify-center gap-3">
                    <span className="text-2xl">✨</span>
                    <span>Design your perfect custom cake!</span>
                  </p>
                </div>

                <Card className="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-200 mt-6 shadow-lg">
                  <CardBody className="p-5">
                    <p className="text-sm text-black font-semibold text-center">
                      💡 <strong>Tip:</strong> While you customize on your phone, feel free to let
                      others use the kiosk. We'll notify you when it's ready!
                    </p>
                  </CardBody>
                </Card>
              </div>
            </div>
          ) : null}
        </ModalBody>
        <ModalFooter className="justify-center pb-8">
          <Button
            onPress={handleCancel}
            size="lg"
            className="bg-gradient-to-r from-gray-600 to-gray-800 text-white font-bold text-lg py-6 px-10 rounded-xl hover:scale-105 transition-all shadow-xl"
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CustomCakeQRModal;
