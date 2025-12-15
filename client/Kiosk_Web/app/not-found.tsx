"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import NextLink from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md">
        <CardBody className="text-center p-8">
          <div className="text-6xl mb-4">🍰</div>
          <h2 className="text-2xl font-bold mb-3">Page Not Found</h2>
          <p className="text-gray-600 mb-6">
            Sorry, we couldn&apos;t find the page you&apos;re looking for.
          </p>
          <Button
            as={NextLink}
            href="/"
            size="lg"
            className="bg-gradient-to-r from-golden-orange to-deep-amber text-white font-bold"
          >
            Return to Menu
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
