"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Chip, Divider } from "@/components/primitives";
import { OrderService } from "@/services/order.service";
import type { CustomerOrder } from "@/types/api";

export default function OrderConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (!orderId) {
      router.push("/");
      return;
    }

    // Fetch order details
    const fetchOrder = async () => {
      try {
        const orderData = await OrderService.getOrderById(parseInt(orderId));
        setOrder(orderData);
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-white to-secondary/10">
        <div className="text-center animate-fade-in-up">
          <div className="text-8xl mb-6 animate-pulse-gentle">📋</div>
          <p className="text-3xl font-bold text-black">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-white to-secondary/10">
        <div className="text-center">
          <div className="text-8xl mb-6">❌</div>
          <p className="text-3xl font-bold text-black mb-8">Order not found</p>
          <Button
            size="lg"
            className="btn-gradient text-2xl font-bold px-12 py-8"
            onClick={() => router.push("/")}
          >
            Return to Menu
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-secondary/10 py-12 px-8">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-12 animate-fade-in-down">
          <div className="inline-block bg-green-500 rounded-full p-8 mb-6 animate-bounce-in shadow-2xl">
            <svg
              className="w-24 h-24 text-white"
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
          <h1 className="text-6xl font-black text-gradient mb-4 drop-shadow-lg">
            Order Confirmed!
          </h1>
          <p className="text-3xl text-black font-semibold">
            Thank you for your order
          </p>
        </div>

        {/* Order Slip Card */}
        <div className="modern-card overflow-hidden shadow-2xl animate-fade-in-up animation-delay-200">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-primary via-secondary to-accent p-8 text-center">
            <div className="text-7xl mb-4">🍰</div>
            <h2 className="text-5xl font-black text-black drop-shadow-md">
              Golden Munch
            </h2>
            <p className="text-xl text-black font-semibold mt-2">
              Fresh • Delicious • Made with Love
            </p>
          </div>

          {/* Order Details Section */}
          <div className="bg-white p-10">
            {/* Order Number & Date */}
            <div className="text-center mb-8 pb-8 border-b-2 border-dashed border-primary/30">
              <div className="mb-6">
                <p className="text-lg text-black font-semibold mb-2">
                  Order Number
                </p>
                <p className="text-6xl font-black text-gradient selectable">
                  #{order.order_number}
                </p>
              </div>

              {order.verification_code && (
                <div className="mb-6">
                  <p className="text-lg text-black font-semibold mb-2">
                    Verification Code
                  </p>
                  <p className="text-5xl font-black text-black selectable tracking-wider bg-primary/10 px-6 py-3 rounded-2xl inline-block">
                    {order.verification_code}
                  </p>
                </div>
              )}

              <div className="flex justify-center gap-8 mt-6">
                <div>
                  <p className="text-sm text-black font-medium">Order Type</p>
                  <Chip
                    size="lg"
                    className="bg-secondary text-white font-bold text-lg px-6 py-2 mt-2"
                  >
                    {order.order_type === "dine_in" ? "🍽️ Dine In" : "🚗 Takeout"}
                  </Chip>
                </div>
                <div>
                  <p className="text-sm text-black font-medium">Payment</p>
                  <Chip
                    size="lg"
                    className="bg-accent text-white font-bold text-lg px-6 py-2 mt-2"
                  >
                    {order.payment_method === "cash"
                      ? "💵 Cash"
                      : order.payment_method === "gcash"
                        ? "📱 GCash"
                        : "💳 Card"}
                  </Chip>
                </div>
              </div>

              <p className="text-base text-black mt-6 font-medium">
                {formatDate(order.order_datetime)}
              </p>
            </div>

            {/* Customer Info */}
            {order.customer_name && (
              <div className="mb-8 pb-8 border-b-2 border-dashed border-primary/30">
                <h3 className="text-2xl font-bold text-black mb-4">
                  Customer Information
                </h3>
                <div className="bg-primary/5 rounded-2xl p-6">
                  <p className="text-xl font-semibold text-black">
                    {order.customer_name}
                  </p>
                  {order.customer_phone && (
                    <p className="text-lg text-black mt-2">
                      📞 {order.customer_phone}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-black mb-6">
                Order Items
              </h3>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-start bg-primary/5 rounded-2xl p-6 hover:bg-primary/10 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-xl font-bold text-black mb-2">
                        {item.quantity}x {item.item_name}
                      </p>
                      {item.special_instructions && (
                        <p className="text-base text-black italic mt-2">
                          Note: {item.special_instructions}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm text-black font-medium">
                        ₱{parseFloat(item.unit_price).toFixed(2)} each
                      </p>
                      <p className="text-2xl font-black text-gradient mt-1">
                        ₱{parseFloat(item.subtotal).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Instructions */}
            {order.special_instructions && (
              <div className="mb-8 pb-8 border-b-2 border-dashed border-primary/30">
                <h3 className="text-2xl font-bold text-black mb-4">
                  Special Instructions
                </h3>
                <div className="bg-secondary/10 rounded-2xl p-6">
                  <p className="text-lg text-black italic">
                    {order.special_instructions}
                  </p>
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-xl">
                <span className="font-semibold text-black">Subtotal:</span>
                <span className="font-bold text-black">
                  ₱{parseFloat(order.total_amount).toFixed(2)}
                </span>
              </div>
              {order.discount_amount && parseFloat(order.discount_amount) > 0 && (
                <div className="flex justify-between items-center text-xl">
                  <span className="font-semibold text-black">Discount:</span>
                  <span className="font-bold text-green-600">
                    -₱{parseFloat(order.discount_amount).toFixed(2)}
                  </span>
                </div>
              )}
              {order.tax_amount && parseFloat(order.tax_amount) > 0 && (
                <div className="flex justify-between items-center text-xl">
                  <span className="font-semibold text-black">Tax:</span>
                  <span className="font-bold text-black">
                    ₱{parseFloat(order.tax_amount).toFixed(2)}
                  </span>
                </div>
              )}
              <Divider className="my-4 bg-primary/30" />
              <div className="flex justify-between items-center bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl p-6">
                <span className="text-3xl font-black text-black">TOTAL:</span>
                <span className="text-5xl font-black text-gradient">
                  ₱{parseFloat(order.final_amount).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Footer Message */}
            <div className="text-center pt-8 border-t-2 border-dashed border-primary/30">
              <p className="text-2xl font-bold text-black mb-4">
                🎉 Your order is being prepared!
              </p>
              <p className="text-lg text-black mb-2">
                Please keep your order number for reference
              </p>
              {order.order_type === "dine_in" && (
                <p className="text-lg text-black font-semibold">
                  We'll bring your order to your table shortly
                </p>
              )}
              {order.order_type === "takeout" && (
                <p className="text-lg text-black font-semibold">
                  Please wait at the counter for your order
                </p>
              )}

              {/* Cashier Message */}
              <div className="mt-8 bg-gradient-to-r from-primary to-secondary rounded-2xl p-8">
                <p className="text-3xl font-black text-black">
                  💰 Thank you for ordering!
                </p>
                <p className="text-2xl font-bold text-black mt-2">
                  Please move forward to the Cashier to process your order
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Return Button with Countdown */}
        <div className="text-center mt-12 animate-fade-in-up animation-delay-500">
          <p className="text-xl text-black mb-6 font-semibold">
            Returning to menu in {countdown} seconds...
          </p>
          <Button
            size="lg"
            className="btn-gradient text-3xl font-black px-16 py-10 rounded-3xl shadow-2xl touch-target-lg"
            onClick={() => router.push("/")}
          >
            🏠 Return to Menu Now
          </Button>
        </div>
      </div>
    </div>
  );
}
