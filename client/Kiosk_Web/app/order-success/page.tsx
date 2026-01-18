"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const prepTime = searchParams.get("prepTime");
  const estimatedMinutes = prepTime ? parseInt(prepTime, 10) : 0;

  const [redirectCountdown, setRedirectCountdown] = useState(10);

  // Redirect to home after countdown
  useEffect(() => {
    if (redirectCountdown === 0) {
      router.push("/");
      return;
    }

    const timer = setInterval(() => {
      setRedirectCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [redirectCountdown, router]);

  // Redirect immediately if no order number
  useEffect(() => {
    if (!orderNumber) {
      router.push("/");
    }
  }, [orderNumber, router]);

  if (!orderNumber) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-primary/10 flex items-center justify-center p-8">
      <div className="max-w-5xl w-full">
        {/* Success Message */}
        <div className="text-center mb-12 animate-fade-in-down">
          <div className="inline-block bg-green-500 rounded-full p-12 mb-8 animate-bounce-in shadow-2xl">
            <svg
              className="w-32 h-32 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-8xl font-black text-gradient mb-6 drop-shadow-lg animate-scale-in">
            You Ordered Successfully!
          </h1>
        </div>

        {/* Order ID Card */}
        <div className="modern-card overflow-hidden shadow-2xl animate-fade-in-up animation-delay-200 bg-white">
          <div className="bg-gradient-to-r from-primary via-secondary to-accent p-8 text-center">
            <h2 className="text-5xl font-black text-black drop-shadow-md">
              📋 This is your Order ID
            </h2>
          </div>

          <div className="p-16 text-center">
            {/* Order Number Display */}
            <div className="mb-12">
              <p className="text-3xl text-black font-bold mb-6">
                Remember it or take a picture with your phone
              </p>
              <div className="inline-block bg-gradient-to-r from-primary/20 to-secondary/20 border-4 border-primary rounded-3xl px-16 py-12 shadow-2xl animate-scale-in animation-delay-500">
                <p className="text-2xl text-black font-semibold mb-4">
                  Order Number
                </p>
                <p className="text-9xl font-black text-gradient tracking-wider selectable">
                  {orderNumber}
                </p>
              </div>
            </div>

            {/* Preparation Time Notification */}
            {estimatedMinutes > 0 && (
              <div className="mb-12">
                <div className="glass-card border-4 border-green-500 rounded-3xl p-10 max-w-3xl mx-auto shadow-2xl animate-pulse-gentle bg-gradient-to-r from-green-50 to-primary/10">
                  <div className="text-center">
                    <div className="text-8xl mb-4">⏱️</div>
                    <p className="text-4xl font-black text-gradient mb-4">
                      Your Order Will Be Ready In
                    </p>
                    <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl px-12 py-8 inline-block shadow-xl">
                      <p className="text-7xl font-black text-black drop-shadow-lg">
                        {estimatedMinutes} {estimatedMinutes === 1 ? "Minute" : "Minutes"}
                      </p>
                    </div>
                    <p className="text-2xl text-black mt-6 font-semibold">
                      ✨ We're preparing your delicious order!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="space-y-6 mb-12">
              <div className="flex items-center justify-center gap-6 text-left bg-primary/10 rounded-2xl p-8 max-w-3xl mx-auto">
                <div className="text-7xl">📸</div>
                <div>
                  <p className="text-3xl font-bold text-black mb-2">
                    1. Remember or photograph this Order ID
                  </p>
                  <p className="text-2xl text-black">
                    You'll need this to track your order
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 text-left bg-secondary/10 rounded-2xl p-8 max-w-3xl mx-auto">
                <div className="text-7xl">💰</div>
                <div>
                  <p className="text-3xl font-bold text-black mb-2">
                    2. Proceed to the Cashier
                  </p>
                  <p className="text-2xl text-black">
                    Show your Order ID to complete payment
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 text-left bg-accent/10 rounded-2xl p-8 max-w-3xl mx-auto">
                <div className="text-7xl">🎉</div>
                <div>
                  <p className="text-3xl font-bold text-black mb-2">
                    3. Wait for your order
                  </p>
                  <p className="text-2xl text-black">
                    We'll call your order number when ready
                  </p>
                </div>
              </div>
            </div>

            {/* Important Message */}
            <div className="bg-gradient-to-r from-primary to-secondary rounded-3xl p-12 mb-8 shadow-xl animate-pulse-gentle">
              <p className="text-4xl font-black text-black mb-4">
                ⚠️ IMPORTANT
              </p>
              <p className="text-3xl font-bold text-black">
                Thank you for ordering!
              </p>
              <p className="text-3xl font-bold text-black">
                Please move forward to the Cashier to process your order
              </p>
            </div>

            {/* Auto-return countdown */}
            <div className="bg-blue-50 border-2 border-blue-500 rounded-2xl p-8 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-4">
                <div className="text-5xl">
                  🏠
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-black mb-2">
                    Kiosk will return to menu automatically
                  </p>
                  <p className="text-lg text-black font-semibold">
                    Returning in {redirectCountdown} seconds...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Return Button */}
        <div className="text-center mt-12 animate-fade-in-up animation-delay-1000">
          <button
            onClick={() => router.push("/")}
            className="btn-gradient text-4xl font-black px-20 py-12 rounded-3xl shadow-2xl touch-target-lg hover:scale-105 transition-transform active:scale-95"
          >
            🏠 Return to Menu Now
          </button>
        </div>
      </div>
    </div>
  );
}
