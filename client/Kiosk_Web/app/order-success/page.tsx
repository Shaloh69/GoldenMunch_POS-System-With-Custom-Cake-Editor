"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "qrcode";

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const orderNumber = searchParams.get("orderNumber");

  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [countdown, setCountdown] = useState(15);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!orderId) {
      router.push("/");
      return;
    }

    // Generate QR code
    const generateQR = async () => {
      try {
        const orderConfirmationUrl = `${window.location.origin}/order-confirmation?orderId=${orderId}`;

        // Generate QR code as data URL
        const url = await QRCode.toDataURL(orderConfirmationUrl, {
          width: 400,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });

        setQrCodeUrl(url);
      } catch (error) {
        console.error("Error generating QR code:", error);
      }
    };

    generateQR();
  }, [orderId]);

  // Countdown timer to return to menu
  useEffect(() => {
    if (countdown === 0) {
      router.push("/");
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, router]);

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
            Order Successful!
          </h1>
          <p className="text-4xl text-black font-bold mb-4">
            Order #{orderNumber}
          </p>
          <p className="text-3xl text-black font-semibold">
            Thank you for your order!
          </p>
        </div>

        {/* QR Code Card */}
        <div className="modern-card overflow-hidden shadow-2xl animate-fade-in-up animation-delay-200 bg-white">
          <div className="bg-gradient-to-r from-primary via-secondary to-accent p-8 text-center">
            <h2 className="text-5xl font-black text-black drop-shadow-md">
              📱 Scan to View Your Receipt
            </h2>
          </div>

          <div className="p-16 text-center">
            {/* QR Code */}
            {qrCodeUrl && (
              <div className="inline-block bg-white p-8 rounded-3xl shadow-2xl mb-8 border-4 border-primary/30 animate-scale-in animation-delay-500">
                <img
                  src={qrCodeUrl}
                  alt="Order Receipt QR Code"
                  className="w-96 h-96"
                />
              </div>
            )}

            {/* Instructions */}
            <div className="space-y-6 mb-12">
              <div className="flex items-center justify-center gap-6 text-left bg-primary/10 rounded-2xl p-8 max-w-3xl mx-auto">
                <div className="text-7xl">📱</div>
                <div>
                  <p className="text-3xl font-bold text-black mb-2">
                    1. Scan the QR code with your phone
                  </p>
                  <p className="text-2xl text-black">
                    Use your camera app to scan this code
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 text-left bg-secondary/10 rounded-2xl p-8 max-w-3xl mx-auto">
                <div className="text-7xl">📋</div>
                <div>
                  <p className="text-3xl font-bold text-black mb-2">
                    2. View your digital receipt
                  </p>
                  <p className="text-2xl text-black">
                    Your order details will open on your phone
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 text-left bg-accent/10 rounded-2xl p-8 max-w-3xl mx-auto">
                <div className="text-7xl">💰</div>
                <div>
                  <p className="text-3xl font-bold text-black mb-2">
                    3. Proceed to the cashier
                  </p>
                  <p className="text-2xl text-black">
                    Complete your payment at the counter
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

            {/* Countdown */}
            <div className="bg-primary/5 rounded-2xl p-8 max-w-2xl mx-auto">
              <p className="text-2xl text-black font-semibold mb-4">
                Returning to menu in
              </p>
              <p className="text-8xl font-black text-gradient animate-pulse-gentle">
                {countdown}
              </p>
              <p className="text-xl text-black font-medium mt-4">
                seconds
              </p>
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
