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
  fadeDuration: number;
  fadeDelay: number;
}

export const AnimatedBackground: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [orbs, setOrbs] = useState<FloatingOrb[]>([]);

  useEffect(() => {
    setMounted(true);

    // Generate floating orbs - Orange to Yellow spectrum with higher opacity
    const orbColors = [
      "rgba(251, 205, 47, 0.35)",  // Sunny Yellow (#FBCD2F) - more visible
      "rgba(245, 166, 35, 0.3)",   // Deep Orange Yellow (#F5A623)
      "rgba(255, 200, 87, 0.28)",  // Light Orange
      "rgba(255, 185, 75, 0.32)",  // Medium Orange
      "rgba(255, 220, 100, 0.3)",  // Pale Yellow
      "rgba(255, 165, 0, 0.27)",   // Pure Orange
    ];

    // Generate 35 orbs for more dynamic effect
    const generatedOrbs: FloatingOrb[] = [...Array(35)].map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 40 + Math.random() * 100, // Orbs: 40-140px
      duration: 20 + Math.random() * 25, // Movement: 20-45s
      delay: Math.random() * 10,
      color: orbColors[Math.floor(Math.random() * orbColors.length)],
      fadeDuration: 3 + Math.random() * 4, // Fade: 3-7s
      fadeDelay: Math.random() * 8, // Random fade start
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
            radial-gradient(circle at 15% 15%, rgba(251, 205, 47, 0.08) 0%, transparent 35%),
            radial-gradient(circle at 85% 85%, rgba(245, 166, 35, 0.06) 0%, transparent 40%)
          `,
        }}
      />

      {/* Floating Orbs with Fade Animation - Orange to Yellow */}
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="absolute rounded-full mix-blend-normal filter blur-2xl animate-float-smooth animate-orb-fade"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            backgroundColor: orb.color,
            animationDuration: `${orb.duration}s, ${orb.fadeDuration}s`,
            animationDelay: `${orb.delay}s, ${orb.fadeDelay}s`,
          }}
        />
      ))}

      {/* Animated gradient overlay for warmth */}
      <div
        className="absolute inset-0 opacity-25 animate-gradient-shift"
        style={{
          background: `linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.8) 0%,
            rgba(251, 205, 47, 0.12) 33%,
            rgba(245, 166, 35, 0.1) 66%,
            rgba(255, 255, 255, 0.8) 100%
          )`,
          backgroundSize: "400% 400%",
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
