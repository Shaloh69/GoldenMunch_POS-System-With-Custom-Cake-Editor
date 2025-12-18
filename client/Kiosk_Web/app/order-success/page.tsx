"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { OrderService } from "@/services/order.service";
import type { CustomerOrder } from "@/types/api";

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const orderNumber = searchParams.get("orderNumber");

  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [qrScanned, setQrScanned] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate QR code
  useEffect(() => {
    if (!orderId) {
      router.push("/");
      return;
    }

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
  }, [orderId, router]);

  // Poll order status to detect when order is completed
  useEffect(() => {
    if (!orderId || qrScanned) return;

    const checkOrderStatus = async () => {
      try {
        const orderData = await OrderService.getOrderById(parseInt(orderId));
        setOrder(orderData);

        // Only redirect when order is COMPLETED (customer has paid and received order)
        if (orderData.order_status === "completed") {
          setQrScanned(true);
        }
      } catch (error) {
        console.error("Error fetching order status:", error);
      }
    };

    // Initial check
    checkOrderStatus();

    // Poll every 3 seconds
    const pollInterval = setInterval(checkOrderStatus, 3000);

    return () => clearInterval(pollInterval);
  }, [orderId, qrScanned]);

  // Countdown to redirect after QR is scanned
  useEffect(() => {
    if (!qrScanned) return;

    if (redirectCountdown === 0) {
      router.push("/");
      return;
    }

    const timer = setInterval(() => {
      setRedirectCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [qrScanned, redirectCountdown, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-primary/10 flex items-center justify-center p-8">
      <div className="max-w-5xl w-full">
        {/* Order Completed Success Modal */}
        {qrScanned && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-gradient-to-br from-green-400 via-green-500 to-green-600 rounded-3xl p-12 max-w-2xl mx-4 shadow-2xl animate-scale-in">
              <div className="text-center">
                <div className="text-9xl mb-6 animate-bounce">🎉</div>
                <h2 className="text-6xl font-black text-white mb-6 drop-shadow-lg">
                  Order Completed Successfully!
                </h2>
                <p className="text-3xl text-white font-bold mb-8">
                  Kiosk is ready for the next customer
                </p>
                <p className="text-xl text-white font-semibold bg-black/20 px-6 py-3 rounded-2xl inline-block">
                  Returning to menu in {redirectCountdown} seconds...
                </p>
              </div>
            </div>
          </div>
        )}

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

            {/* Status Message - Show current order status */}
            <div className="bg-blue-50 border-2 border-blue-500 rounded-2xl p-8 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-4">
                <div className="text-5xl animate-pulse-gentle">
                  {order?.order_status === "pending" && "⏳"}
                  {order?.order_status === "confirmed" && "✅"}
                  {order?.order_status === "preparing" && "👨‍🍳"}
                  {order?.order_status === "ready" && "🎉"}
                  {!order && "📱"}
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-black mb-2">
                    {order?.order_status === "pending" && "Waiting for cashier confirmation..."}
                    {order?.order_status === "confirmed" && "Order confirmed - Being prepared"}
                    {order?.order_status === "preparing" && "Your order is being prepared"}
                    {order?.order_status === "ready" && "Order ready for pickup!"}
                    {!order && "Processing..."}
                  </p>
                  <p className="text-lg text-black">
                    Page will auto-return when order is completed
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
