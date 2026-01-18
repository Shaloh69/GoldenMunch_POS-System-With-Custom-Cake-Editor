"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ThankYouPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const orderNumber = searchParams.get("orderNumber");
  const prepTime = searchParams.get("prepTime");

  const [countdown, setCountdown] = useState(4);

  // Redirect to order success after countdown
  useEffect(() => {
    if (!orderId || !orderNumber) {
      router.push("/");
      return;
    }

    if (countdown === 0) {
      router.push(
        `/order-success?orderId=${orderId}&orderNumber=${orderNumber}&prepTime=${prepTime || 0}`
      );
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, router, orderId, orderNumber, prepTime]);

  if (!orderId || !orderNumber) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-primary/10 to-secondary/10 flex items-center justify-center p-8 overflow-hidden">
      <div className="max-w-6xl w-full text-center">
        {/* Animated Success Icon */}
        <div className="mb-12 animate-scale-in">
          <div className="inline-block relative">
            {/* Pulsing background circles */}
            <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
            <div className="absolute inset-0 bg-green-300 rounded-full animate-pulse opacity-30"></div>

            {/* Main checkmark circle */}
            <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-full p-16 shadow-2xl animate-bounce-in">
              <svg
                className="w-48 h-48 text-white animate-draw-check"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={4}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Thank You Message */}
        <div className="space-y-8 animate-fade-in-up animation-delay-300">
          <h1 className="text-9xl font-black text-gradient drop-shadow-2xl animate-scale-in animation-delay-500">
            Payment Successful!
          </h1>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border-4 border-green-400 animate-fade-in-up animation-delay-700">
            <div className="text-8xl mb-6 animate-bounce-slow">🎉</div>
            <h2 className="text-6xl font-black text-gradient mb-4">
              Thank You!
            </h2>
            <p className="text-4xl text-black font-bold mb-6">
              Your payment has been received
            </p>
            <p className="text-3xl text-gray-700">
              Preparing your order details...
            </p>
          </div>

          {/* Order Number Preview */}
          <div className="bg-gradient-to-r from-primary via-secondary to-accent rounded-2xl p-8 shadow-xl animate-fade-in-up animation-delay-1000">
            <p className="text-3xl font-bold text-black mb-2">
              Order #{orderNumber}
            </p>
            <p className="text-2xl text-black">
              ✨ Your delicious order is being prepared!
            </p>
          </div>

          {/* Countdown indicator */}
          <div className="flex items-center justify-center gap-4 animate-fade-in-up animation-delay-1200">
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    i < countdown
                      ? "bg-green-500 scale-100"
                      : "bg-gray-300 scale-75"
                  }`}
                  style={{
                    animation: i === countdown - 1 ? "pulse 1s infinite" : "none",
                  }}
                ></div>
              ))}
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-20 left-20 text-8xl animate-float opacity-30">
            🎊
          </div>
          <div className="absolute top-40 right-32 text-8xl animate-float-delayed opacity-30">
            🎉
          </div>
          <div className="absolute bottom-32 left-32 text-8xl animate-float opacity-30">
            ✨
          </div>
          <div className="absolute bottom-20 right-20 text-8xl animate-float-delayed opacity-30">
            🌟
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes draw-check {
          0% {
            stroke-dasharray: 0 100;
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dasharray: 100 100;
            stroke-dashoffset: 0;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-30px) rotate(10deg);
          }
        }

        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-40px) rotate(-10deg);
          }
        }

        .animate-draw-check {
          animation: draw-check 0.8s ease-in-out 0.3s forwards;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 3.5s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce 2s ease-in-out infinite;
        }

        .animate-pulse-gentle {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
