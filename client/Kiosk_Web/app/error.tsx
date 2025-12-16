"use client";

import { useEffect } from "react";
import { Button, Card, CardBody } from "@/components/primitives";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Golden Munch Kiosk Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-white to-caramel-beige flex items-center justify-center p-8">
      <Card className="max-w-md w-full bg-cream-white border-2 border-golden-orange/30 shadow-2xl">
        <CardBody className="p-8 text-center">
          {/* Error Icon */}
          <div className="text-8xl mb-6 animate-bounce-slow">😢</div>

          {/* Error Title */}
          <h1 className="text-3xl font-bold text-chocolate-brown mb-4">
            Oops! Something went wrong
          </h1>

          {/* Error Message */}
          <p className="text-lg text-chocolate-brown/80 mb-6">
            We encountered an unexpected error while processing your request.
            Don't worry, our team of expert bakers is on it!
          </p>

          {/* Error Details (in development) */}
          {process.env.NODE_ENV === "development" && (
            <div className="bg-chocolate-brown/10 p-4 rounded-lg mb-6 text-left">
              <p className="text-xs font-mono text-chocolate-brown/70 break-all">
                {error.message || "Unknown error occurred"}
              </p>
              {error.digest && (
                <p className="text-xs text-chocolate-brown/60 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              size="lg"
              className="w-full bg-golden-orange hover:bg-deep-amber text-chocolate-brown font-bold text-lg"
              onClick={reset}
            >
              🔄 Try Again
            </Button>

            <Button
              size="lg"
              variant="bordered"
              className="w-full border-golden-orange text-chocolate-brown hover:bg-golden-orange/10 font-bold"
              onClick={() => (window.location.href = "/")}
            >
              🏠 Back to Menu
            </Button>

            <Button
              size="md"
              variant="light"
              className="w-full text-chocolate-brown/70 hover:text-chocolate-brown"
              onClick={() => (window.location.href = "/idle")}
            >
              🎮 Go to Idle Screen
            </Button>
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-mint-green/10 rounded-lg">
            <p className="text-sm text-chocolate-brown/70">
              💡 <strong>Need help?</strong> Touch the Help button in the top
              navigation or ask a staff member for assistance.
            </p>
          </div>

          {/* Fun Message */}
          <div className="mt-4 text-chocolate-brown/60">
            <p className="text-sm">
              While you wait, here's a fun fact: 🍰
              <br />
              The average person eats 6kg of baked goods per year!
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
