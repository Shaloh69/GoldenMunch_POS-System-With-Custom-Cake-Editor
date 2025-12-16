
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Cake,
  Smartphone,
  Clock,
  Sparkles,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import {
  CustomCakeService,
  CustomCakeSessionResponse,
} from "@/services/customCake.service";

type QRSession = CustomCakeSessionResponse;

export default function CustomCakePage() {
  const router = useRouter();
  const [qrSession, setQrSession] = useState<QRSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [step, setStep] = useState<
    "welcome" | "generating" | "qr" | "expired" | "success"
  >("welcome");
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate QR Code
  const generateQR = useCallback(async () => {
    setLoading(true);
    setError(null);
    setStep("generating");

    try {
      // Call real API to generate QR session
      const session = await CustomCakeService.generateQRSession("KIOSK-001");

      setQrSession(session);
      setTimeRemaining(session.expiresIn);
      setStep("qr");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to generate QR code",
      );
      setStep("welcome");
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll for QR scan success using useEffect
  useEffect(() => {
    // Only poll when we have a session and are on the QR step
    if (!qrSession?.sessionToken || step !== "qr") {
      // Clear any existing polling interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    // Start polling
    pollIntervalRef.current = setInterval(async () => {
      try {
        const status = await CustomCakeService.pollSessionStatus(
          qrSession.sessionToken,
        );

        if (status.status === "completed") {
          // Clear the polling interval
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }

          setStep("success");

          // Redirect to menu after 5 seconds
          setTimeout(() => {
            router.push("/menu");
          }, 5000);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000); // Poll every 2 seconds

    // Cleanup function
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [qrSession?.sessionToken, step, router]);

  // Countdown timer
  useEffect(() => {
    if (!qrSession || step !== "qr") return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setStep("expired");
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
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {/* Welcome Screen */}
        {step === "welcome" && (
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
                  className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400 rounded-full mb-6 shadow-2xl"
                >
                  <Cake className="w-16 h-16 text-white" />
                </motion.div>

                <motion.h1
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-5xl md:text-6xl font-bold text-foreground mb-4"
                >
                  Design Your Dream Cake
                </motion.h1>

                <motion.p
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl text-foreground/80 font-medium"
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
                className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 text-white py-8 rounded-3xl text-3xl font-bold shadow-2xl hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✨ Start Designing ✨
              </motion.button>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-xl text-foreground text-center font-semibold"
                >
                  {error}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Generating Screen */}
        {step === "generating" && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-md w-full text-center"
          >
            <div className="glass-card rounded-3xl shadow-2xl p-12 bg-white/95 backdrop-blur-xl border-2 border-purple-200">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-400 rounded-full mb-6 shadow-2xl"
              >
                <Cake className="w-16 h-16 text-white" />
              </motion.div>

              <h2 className="text-4xl font-bold text-foreground mb-4">
                Preparing Your Canvas
              </h2>
              <p className="text-foreground/70 text-xl font-medium">
                Setting up your custom cake designer...
              </p>
            </div>
          </motion.div>
        )}

        {/* QR Code Screen */}
        {step === "qr" && qrSession && (
          <motion.div
            key="qr"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="max-w-2xl w-full"
          >
            <div className="glass-card rounded-3xl shadow-2xl p-8 md:p-12 bg-white/95 backdrop-blur-xl border-2 border-purple-200">
              {/* Timer */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center justify-center gap-3 mb-6"
              >
                <Clock className="w-8 h-8 text-purple-600" />
                <span className="text-3xl font-bold text-foreground">
                  {formatTime(timeRemaining)}
                </span>
                <span className="text-foreground/70 text-xl">remaining</span>
              </motion.div>

              {/* Instructions */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-8"
              >
                <div className="inline-flex items-center gap-3 mb-4">
                  <Smartphone className="w-10 h-10 text-pink-600" />
                  <h2 className="text-4xl font-bold text-foreground">
                    Scan with Your Phone
                  </h2>
                </div>
                <p className="text-xl text-foreground/80 font-medium">
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
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute inset-0 border-4 border-purple-400 rounded-3xl blur-sm"
                  />

                  <div className="relative bg-white p-10 rounded-3xl shadow-2xl border-4 border-gradient-to-r from-purple-300 via-pink-300 to-indigo-300">
                    <QRCodeSVG
                      value={qrSession.editorUrl}
                      size={320}
                      level="H"
                      includeMargin
                      fgColor="#000000"
                      bgColor="#FFFFFF"
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
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500"
                    initial={{ width: "100%" }}
                    animate={{
                      width: `${(timeRemaining / qrSession.expiresIn) * 100}%`,
                    }}
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

              {/* Back to Menu button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={() => router.push("/menu")}
                className="w-full mt-6 py-5 flex items-center justify-center gap-3 bg-gradient-to-r from-gray-600 to-gray-800 text-white font-bold text-lg rounded-2xl hover:scale-105 transition-all shadow-xl"
              >
                <ArrowLeft className="w-6 h-6" />
                Back to Menu
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Expired Screen */}
        {step === "expired" && (
          <motion.div
            key="expired"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="max-w-md w-full"
          >
            <div className="glass-card rounded-3xl shadow-2xl p-12 text-center bg-white/95 backdrop-blur-xl border-2 border-red-200">
              <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-red-400 to-orange-500 rounded-full mb-6 shadow-2xl">
                <Clock className="w-16 h-16 text-white" />
              </div>

              <h2 className="text-4xl font-bold text-foreground mb-4">
                Session Expired
              </h2>
              <p className="text-foreground/70 text-xl font-medium mb-8">
                Your QR code session has timed out. Please generate a new one to
                continue.
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    setStep("welcome");
                    setQrSession(null);
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 text-white py-5 rounded-2xl text-xl font-bold shadow-2xl hover:shadow-purple-500/50 transition-all"
                >
                  Generate New QR Code
                </button>

                <button
                  onClick={() => router.push("/menu")}
                  className="w-full py-5 flex items-center justify-center gap-3 bg-gradient-to-r from-gray-600 to-gray-800 text-white font-bold rounded-2xl hover:scale-105 transition-all shadow-xl"
                >
                  <ArrowLeft className="w-6 h-6" />
                  Back to Menu
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Success Screen */}
        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="max-w-2xl w-full"
          >
            <div className="glass-card rounded-3xl shadow-2xl p-12 text-center bg-white/95 backdrop-blur-xl border-2 border-green-200">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="inline-flex items-center justify-center w-40 h-40 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-6 shadow-2xl"
              >
                <CheckCircle className="w-24 h-24 text-white" />
              </motion.div>

              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-5xl font-bold text-foreground mb-4"
              >
                Successfully Scanned!
              </motion.h2>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl text-foreground/80 font-medium mb-8"
              >
                Your custom cake design is now loading on your phone
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-8 mb-8 border-2 border-purple-200"
              >
                <h3 className="text-2xl font-bold text-foreground mb-6">
                  Next Steps:
                </h3>
                <div className="space-y-4 text-left">
                  <p className="text-lg text-foreground flex items-start gap-4">
                    <span className="text-3xl">🎨</span>
                    <span className="font-semibold">
                      Design your perfect cake on your phone
                    </span>
                  </p>
                  <p className="text-lg text-foreground flex items-start gap-4">
                    <span className="text-3xl">🪑</span>
                    <span className="font-semibold">
                      Please take a seat and relax while you design
                    </span>
                  </p>
                  <p className="text-lg text-foreground flex items-start gap-4">
                    <span className="text-3xl">✨</span>
                    <span className="font-semibold">
                      We'll notify you when it's ready for approval
                    </span>
                  </p>
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-foreground/70 text-xl font-medium mb-6"
              >
                Returning to menu in 5 seconds...
              </motion.p>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                onClick={() => router.push("/menu")}
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 text-white font-bold text-xl py-5 px-10 rounded-2xl hover:scale-105 transition-all shadow-2xl hover:shadow-purple-500/50"
              >
                Return to Menu Now
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper Components
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mb-4 shadow-lg">
        {icon}
      </div>
      <h3 className="font-bold text-foreground text-lg mb-2">{title}</h3>
      <p className="text-sm text-foreground/70">{description}</p>
    </div>
  );
}

function StepIndicator({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-xl mb-3 shadow-lg">
        {number}
      </div>
      <span className="text-base text-foreground font-semibold">{text}</span>
    </div>
  );
}
