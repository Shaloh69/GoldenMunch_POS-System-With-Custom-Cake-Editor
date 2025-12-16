"use client";

import Link from "next/link";

// Force this page to be dynamic (no static generation)
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-cream-white to-caramel-beige">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-4">🍰</div>
        <h2 className="text-2xl font-bold mb-3">Page Not Found</h2>
        <p className="text-gray-600 mb-6">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-gradient-to-r from-golden-orange to-deep-amber text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
        >
          Return to Menu
        </Link>
      </div>
    </div>
  );
}
