'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Cake, Smartphone, Clock, Sparkles, CheckCircle } from 'lucide-react';
import { CustomCakeService, CustomCakeSessionResponse } from '@/services/customCake.service';

type QRSession = CustomCakeSessionResponse;

export default function CustomCakePage() {
  const [qrSession, setQrSession] = useState<QRSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [step, setStep] = useState<'welcome' | 'generating' | 'qr' | 'expired'>('welcome');

  // Generate QR Code
  const generateQR = useCallback(async () => {
    setLoading(true);
    setError(null);
    setStep('generating');

    try {
      // Call real API to generate QR session
      const session = await CustomCakeService.generateQRSession('KIOSK-001');

      setQrSession(session);
      setTimeRemaining(session.expiresIn);
      setStep('qr');
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to generate QR code');
      setStep('welcome');
    } finally {
      setLoading(false);
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!qrSession || step !== 'qr') return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setStep('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [qrSession, step]);

  // Format time remaining
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {/* Welcome Screen */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="max-w-2xl w-full"
          >
            <div className="glass-card rounded-3xl shadow-[0_0_40px_rgba(234,215,183,0.3)] p-8 md:p-12">
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#7B4B28] to-[#662B35] rounded-full mb-6 shadow-[0_0_30px_rgba(234,215,183,0.4)]"
                >
                  <Cake className="w-12 h-12 text-[#FAF7F2]" />
                </motion.div>

                <motion.h1
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl md:text-5xl font-bold text-[#FAF7F2] mb-4 drop-shadow-lg"
                >
                  Design Your Dream Cake
                </motion.h1>

                <motion.p
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl text-[#EAD7B7]"
                >
                  Create a custom 3D cake design on your phone!
                </motion.p>
              </div>

              {/* Features */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
              >
                <FeatureCard
                  icon={<Sparkles className="w-6 h-6" />}
                  title="3D Editor"
                  description="Interactive cake designer"
                />
                <FeatureCard
                  icon={<Cake className="w-6 h-6" />}
                  title="Custom Layers"
                  description="Up to 5 layers & flavors"
                />
                <FeatureCard
                  icon={<CheckCircle className="w-6 h-6" />}
                  title="Easy Process"
                  description="Design, submit, approve"
                />
              </motion.div>

              {/* CTA Button */}
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={generateQR}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#7B4B28] to-[#662B35] text-[#FAF7F2] py-6 rounded-2xl text-2xl font-bold shadow-[0_0_30px_rgba(234,215,183,0.4)] hover:shadow-[0_0_40px_rgba(234,215,183,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Designing
              </motion.button>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 p-4 glass-button border border-[#662B35] rounded-lg text-[#FAF7F2] text-center"
                >
                  {error}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Generating Screen */}
        {step === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-md w-full text-center"
          >
            <div className="glass-card rounded-3xl shadow-[0_0_40px_rgba(234,215,183,0.3)] p-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#7B4B28] to-[#662B35] rounded-full mb-6 shadow-[0_0_30px_rgba(234,215,183,0.4)]"
              >
                <Cake className="w-12 h-12 text-[#FAF7F2]" />
              </motion.div>

              <h2 className="text-3xl font-bold text-[#FAF7F2] mb-4 drop-shadow-lg">
                Preparing Your Canvas
              </h2>
              <p className="text-[#EAD7B7] text-lg">
                Setting up your custom cake designer...
              </p>
            </div>
          </motion.div>
        )}

        {/* QR Code Screen */}
        {step === 'qr' && qrSession && (
          <motion.div
            key="qr"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="max-w-2xl w-full"
          >
            <div className="glass-card rounded-3xl shadow-[0_0_40px_rgba(234,215,183,0.3)] p-8 md:p-12">
              {/* Timer */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center justify-center gap-3 mb-6"
              >
                <Clock className="w-6 h-6 text-[#EAD7B7]" />
                <span className="text-2xl font-bold text-[#FAF7F2] drop-shadow-lg">
                  {formatTime(timeRemaining)}
                </span>
                <span className="text-[#EAD7B7]">remaining</span>
              </motion.div>

              {/* Instructions */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-8"
              >
                <div className="inline-flex items-center gap-3 mb-4">
                  <Smartphone className="w-8 h-8 text-[#EAD7B7]" />
                  <h2 className="text-3xl font-bold text-[#FAF7F2] drop-shadow-lg">
                    Scan with Your Phone
                  </h2>
                </div>
                <p className="text-lg text-[#EAD7B7]">
                  Open your camera app and point it at the QR code below
                </p>
              </motion.div>

              {/* QR Code */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex justify-center mb-8"
              >
                <div className="relative">
                  {/* Animated corners */}
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 border-4 border-[#EAD7B7] rounded-3xl blur-sm"
                  />

                  <div className="relative bg-[#FAF7F2] p-8 rounded-3xl shadow-xl">
                    <QRCodeSVG
                      value={qrSession.editorUrl}
                      size={300}
                      level="H"
                      includeMargin
                      fgColor="#3A1F0F"
                      bgColor="#FAF7F2"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Progress bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-6"
              >
                <div className="h-2 bg-[#3A1F0F]/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#7B4B28] to-[#662B35]"
                    initial={{ width: '100%' }}
                    animate={{ width: `${(timeRemaining / qrSession.expiresIn) * 100}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </motion.div>

              {/* Steps */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-3 gap-4 text-center"
              >
                <StepIndicator number={1} text="Scan QR" />
                <StepIndicator number={2} text="Design Cake" />
                <StepIndicator number={3} text="Submit" />
              </motion.div>

              {/* Cancel button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={() => setStep('welcome')}
                className="w-full mt-6 py-3 text-[#EAD7B7] hover:text-[#FAF7F2] font-medium transition-colors"
              >
                Cancel & Go Back
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Expired Screen */}
        {step === 'expired' && (
          <motion.div
            key="expired"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="max-w-md w-full"
          >
            <div className="glass-card rounded-3xl shadow-[0_0_40px_rgba(234,215,183,0.3)] p-12 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 glass-button rounded-full mb-6 border-2 border-[#662B35]">
                <Clock className="w-12 h-12 text-[#662B35]" />
              </div>

              <h2 className="text-3xl font-bold text-[#FAF7F2] mb-4 drop-shadow-lg">
                Session Expired
              </h2>
              <p className="text-[#EAD7B7] text-lg mb-8">
                Your QR code session has timed out. Please generate a new one to continue.
              </p>

              <button
                onClick={() => {
                  setStep('welcome');
                  setQrSession(null);
                }}
                className="w-full bg-gradient-to-r from-[#7B4B28] to-[#662B35] text-[#FAF7F2] py-4 rounded-2xl text-xl font-bold shadow-[0_0_30px_rgba(234,215,183,0.4)] hover:shadow-[0_0_40px_rgba(234,215,183,0.6)] transition-all"
              >
                Generate New QR Code
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper Components
function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center p-4">
      <div className="inline-flex items-center justify-center w-12 h-12 glass-button rounded-full mb-3 text-[#EAD7B7] border border-[#EAD7B7]/30">
        {icon}
      </div>
      <h3 className="font-bold text-[#FAF7F2] mb-1 drop-shadow-md">{title}</h3>
      <p className="text-sm text-[#EAD7B7]">{description}</p>
    </div>
  );
}

function StepIndicator({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 bg-gradient-to-br from-[#7B4B28] to-[#662B35] text-[#FAF7F2] rounded-full flex items-center justify-center font-bold mb-2 shadow-lg">
        {number}
      </div>
      <span className="text-sm text-[#EAD7B7]">{text}</span>
    </div>
  );
}
