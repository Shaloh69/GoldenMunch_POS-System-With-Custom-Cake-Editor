'use client';

import React from 'react';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { useRouter } from 'next/navigation';

export default function CustomizeSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-golden-orange/20 to-deep-amber/20 flex items-center justify-center p-4">
      <Card className="max-w-lg">
        <CardBody className="text-center p-12">
          <div className="text-9xl mb-6 animate-bounce">🎉</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent mb-4">
            Design Complete!
          </h1>
          <p className="text-xl text-chocolate-brown mb-6">
            Your custom cake design has been submitted successfully!
          </p>
          <div className="bg-golden-orange/10 border-2 border-golden-orange/30 rounded-lg p-6 mb-6">
            <p className="text-chocolate-brown/80">
              <strong className="text-deep-amber">📱 Next Steps:</strong>
              <br />
              Please return to the kiosk to review your design and complete your order.
            </p>
          </div>
          <div className="space-y-3 text-left text-chocolate-brown/70 bg-white/50 rounded-lg p-4 mb-6">
            <p className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <span>Your design will be reviewed by our team</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-2xl">🎨</span>
              <span>We'll confirm if any adjustments are needed</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-2xl">🍰</span>
              <span>Your custom cake will be freshly baked</span>
            </p>
          </div>
          <Button
            size="lg"
            className="bg-gradient-to-r from-golden-orange to-deep-amber text-white font-bold text-xl px-12 py-6 h-auto"
            onClick={() => router.push('/')}
          >
            Return to Main Menu
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
