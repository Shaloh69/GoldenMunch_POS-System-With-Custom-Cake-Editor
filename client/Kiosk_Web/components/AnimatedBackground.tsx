"use client";

import React, { useState, useEffect } from "react";

interface FloatingOrb {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

export const AnimatedBackground: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [orbs, setOrbs] = useState<FloatingOrb[]>([]);

  useEffect(() => {
    setMounted(true);

    // Generate tiny floating orbs - Orange to Yellow spectrum
    const orbColors = [
      "rgba(251, 205, 47, 0.15)",  // Sunny Yellow (#FBCD2F)
      "rgba(245, 166, 35, 0.12)",  // Deep Orange Yellow (#F5A623)
      "rgba(255, 200, 87, 0.1)",   // Light Orange
      "rgba(255, 185, 75, 0.13)",  // Medium Orange
      "rgba(255, 220, 100, 0.11)", // Pale Yellow
    ];

    // Generate 20 tiny orbs for subtle effect
    const generatedOrbs: FloatingOrb[] = [...Array(20)].map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 30 + Math.random() * 80, // Tiny orbs: 30-110px
      duration: 20 + Math.random() * 25, // Slower movement: 20-45s
      delay: Math.random() * 10,
      color: orbColors[Math.floor(Math.random() * orbColors.length)],
    }));

    setOrbs(generatedOrbs);
  }, []);

  if (!mounted) {
    return (
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-white" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Base - Pure White Background */}
      <div className="absolute inset-0 bg-white" />

      {/* Subtle gradient overlay for depth */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `
            radial-gradient(circle at 15% 15%, rgba(251, 205, 47, 0.05) 0%, transparent 35%),
            radial-gradient(circle at 85% 85%, rgba(245, 166, 35, 0.04) 0%, transparent 40%)
          `,
        }}
      />

      {/* Tiny Floating Orbs - Orange to Yellow */}
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="absolute rounded-full mix-blend-normal filter blur-2xl animate-float-smooth"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            backgroundColor: orb.color,
            animationDuration: `${orb.duration}s`,
            animationDelay: `${orb.delay}s`,
          }}
        />
      ))}

      {/* Very subtle animated gradient for warmth */}
      <div
        className="absolute inset-0 opacity-20 animate-gradient-shift"
        style={{
          background: `linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.8) 0%,
            rgba(251, 205, 47, 0.08) 33%,
            rgba(245, 166, 35, 0.06) 66%,
            rgba(255, 255, 255, 0.8) 100%
          )`,
          backgroundSize: "400% 400%",
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
