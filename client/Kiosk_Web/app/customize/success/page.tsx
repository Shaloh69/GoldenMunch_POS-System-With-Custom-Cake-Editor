'use client';

import React from 'react';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { useRouter } from 'next/navigation';

export default function CustomizeSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-lg card-transparent shadow-2xl-golden">
        <CardBody className="text-center p-12">
          <div className="text-9xl mb-6 animate-bounce">🎉</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent mb-4">
            Design Complete!
          </h1>
          <p className="text-xl text-chocolate-brown mb-4">
            Your custom cake design has been submitted successfully!
          </p>
          <p className="text-md text-chocolate-brown/70 mb-6">
            ✨ Our team is excited to bring your vision to life!
          </p>
          <div className="bg-gradient-to-br from-golden-orange/20 to-deep-amber/20 border-2 border-golden-orange/30 rounded-xl p-6 mb-6 backdrop-blur-sm">
            <p className="text-chocolate-brown/90 font-semibold mb-3 text-lg">
              📱 Next Steps:
            </p>
            <p className="text-chocolate-brown/80">
              Return to the kiosk to review your design and complete your order. You can also continue browsing our menu!
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
