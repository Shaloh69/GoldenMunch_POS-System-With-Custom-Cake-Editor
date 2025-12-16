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

    // Generate subtle floating orbs - minimal and elegant
    const orbColors = [
      "rgba(255, 215, 0, 0.08)", // Gold
      "rgba(255, 165, 0, 0.06)", // Orange
      "rgba(255, 140, 0, 0.07)", // Dark Orange
      "rgba(251, 205, 47, 0.09)", // Sunny Yellow
    ];

    const generatedOrbs: FloatingOrb[] = [...Array(8)].map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 200 + Math.random() * 400,
      duration: 20 + Math.random() * 15,
      delay: Math.random() * 5,
      color: orbColors[Math.floor(Math.random() * orbColors.length)],
    }));

    setOrbs(generatedOrbs);
  }, []);

  if (!mounted) {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFF8DC] via-[#FFFBF0] to-[#FFF5E6]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Modern Gradient Base - Clean and Elegant */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFF8DC] via-[#FFFBF0] to-[#FFF5E6]" />

      {/* Mesh Gradient Overlay - Subtle depth */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(at 0% 0%, rgba(255, 215, 0, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(255, 140, 0, 0.12) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(255, 165, 0, 0.13) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(251, 205, 47, 0.14) 0px, transparent 50%)
          `,
        }}
      />

      {/* Floating Gradient Orbs - Subtle and modern */}
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="absolute rounded-full mix-blend-multiply filter blur-3xl animate-float-smooth"
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

      {/* Elegant Flowing Waves - Subtle movement */}
      <div className="absolute inset-0">
        <svg
          className="absolute w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="rgba(255, 215, 0, 0.05)"
            fillOpacity="1"
            d="M0,160L48,149.3C96,139,192,117,288,128C384,139,480,181,576,181.3C672,181,768,139,864,133.3C960,128,1056,160,1152,165.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            className="animate-wave-slow"
          />
        </svg>
        <svg
          className="absolute w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="rgba(255, 165, 0, 0.04)"
            fillOpacity="1"
            d="M0,224L48,208C96,192,192,160,288,160C384,160,480,192,576,197.3C672,203,768,181,864,165.3C960,149,1056,139,1152,149.3C1248,160,1344,192,1392,208L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            className="animate-wave-slower"
          />
        </svg>
      </div>

      {/* Subtle Gradient Overlay - Top to bottom fade */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/20" />

      {/* Soft Vignette Effect */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/[0.02]" />

      {/* Gentle Light Spots - Modern touch */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-[#FFD700]/10 to-transparent rounded-full filter blur-3xl animate-pulse-gentle" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-[#FFA500]/10 to-transparent rounded-full filter blur-3xl animate-pulse-gentle animation-delay-3000" />
    </div>
  );
};

export default AnimatedBackground;
