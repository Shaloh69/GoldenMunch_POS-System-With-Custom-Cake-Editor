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

    // Generate subtle floating orbs - White, Gold, Teal palette
    const orbColors = [
      "rgba(255, 255, 255, 0.4)", // White
      "rgba(255, 215, 0, 0.15)", // Gold
      "rgba(72, 209, 204, 0.2)", // Medium Turquoise
      "rgba(64, 224, 208, 0.18)", // Turquoise
      "rgba(32, 178, 170, 0.16)", // Light Sea Green
    ];

    const generatedOrbs: FloatingOrb[] = [...Array(12)].map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 250 + Math.random() * 500,
      duration: 25 + Math.random() * 20,
      delay: Math.random() * 8,
      color: orbColors[Math.floor(Math.random() * orbColors.length)],
    }));

    setOrbs(generatedOrbs);
  }, []);

  if (!mounted) {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-[#F0FFFF] to-[#E0F8F7]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base - Clean White with Turquoise tint */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-[#F0FFFF] to-[#E0F8F7]" />

      {/* Animated Gradient Waves - White to Turquoise */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background: `
            radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.8) 0%, transparent 40%),
            radial-gradient(circle at 80% 80%, rgba(72, 209, 204, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 70%, rgba(64, 224, 208, 0.25) 0%, transparent 45%),
            radial-gradient(circle at 70% 30%, rgba(255, 215, 0, 0.2) 0%, transparent 40%)
          `,
        }}
      />

      {/* Floating Gradient Orbs - Subtle animation */}
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="absolute rounded-full mix-blend-normal filter blur-3xl animate-float-smooth"
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

      {/* Elegant Flowing Waves - Turquoise */}
      <div className="absolute inset-0 opacity-30">
        <svg
          className="absolute w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="rgba(72, 209, 204, 0.4)"
            fillOpacity="1"
            d="M0,160L48,149.3C96,139,192,117,288,128C384,139,480,181,576,181.3C672,181,768,139,864,133.3C960,128,1056,160,1152,165.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            className="animate-wave-slow"
          />
        </svg>
      </div>

      {/* Second Wave - White */}
      <div className="absolute inset-0 opacity-40">
        <svg
          className="absolute w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="rgba(255, 255, 255, 0.6)"
            fillOpacity="1"
            d="M0,224L48,208C96,192,192,160,288,160C384,160,480,192,576,197.3C672,203,768,181,864,165.3C960,149,1056,139,1152,149.3C1248,160,1344,192,1392,208L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            className="animate-wave-slower"
          />
        </svg>
      </div>

      {/* Animated Gradient Overlay - Smooth color shift */}
      <div
        className="absolute inset-0 animate-gradient-shift"
        style={{
          background: `linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.6) 0%,
            rgba(72, 209, 204, 0.2) 25%,
            rgba(255, 215, 0, 0.15) 50%,
            rgba(64, 224, 208, 0.25) 75%,
            rgba(255, 255, 255, 0.5) 100%
          )`,
          backgroundSize: "400% 400%",
        }}
      />

      {/* Gentle Light Spots */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-radial from-white/30 to-transparent rounded-full filter blur-3xl animate-pulse-gentle" />
      <div className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-gradient-radial from-[#48D1CC]/20 to-transparent rounded-full filter blur-3xl animate-pulse-gentle animation-delay-3000" />
    </div>
  );
};

export default AnimatedBackground;
