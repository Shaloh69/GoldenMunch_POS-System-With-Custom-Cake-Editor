"use client";

import React, { useState, useEffect } from "react";

interface Particle {
  left: number;
  top: number;
  delay: number;
  duration: number;
  size: number;
  emoji: string;
}

interface Bubble {
  left: number;
  delay: number;
  duration: number;
  size: number;
}

interface GoldSparkle {
  left: number;
  top: number;
  delay: number;
  duration: number;
  size: number;
}

export const AnimatedBackground: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [goldSparkles, setGoldSparkles] = useState<GoldSparkle[]>([]);

  useEffect(() => {
    setMounted(true);

    // Soft, airy café-themed emojis
    const emojis = [
      "☕",
      "🥐",
      "🍰",
      "🧁",
      "🥖",
      "🥨",
      "🍪",
      "🧈",
      "🍯",
      "🌸",
      "✨",
      "🌼",
    ];

    // Generate MORE floating particles for prominence
    const generatedParticles = [...Array(25)].map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 18 + Math.random() * 12,
      size: 35 + Math.random() * 50, // LARGER particles
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));

    // Generate MORE bubbles for better visibility
    const generatedBubbles = [...Array(35)].map(() => ({
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 12 + Math.random() * 10,
      size: 40 + Math.random() * 100, // LARGER bubbles
    }));

    // Generate MORE sparkles
    const generatedSparkles = [...Array(60)].map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 2.5 + Math.random() * 3.5,
      size: 3 + Math.random() * 5, // LARGER sparkles
    }));

    setParticles(generatedParticles);
    setBubbles(generatedBubbles);
    setGoldSparkles(generatedSparkles);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFF9F2] via-[#E8DCC8] to-[#D9B38C]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Sunny Yellow & White Gradient Base - Bright and Clean */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFFFFF] via-[#FFF9E0] to-[#FBCD2F]/20" />

      {/* Layered Gradient Waves - Sunny yellow accents */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#F5A623]/15 via-transparent to-[#FFFFFF]/60 animate-wave" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#FBCD2F]/20 via-transparent to-[#F3F3F3]/30 animate-wave-reverse" />

      {/* Large Animated Orbs - Sunny Yellow Tones - MORE PROMINENT */}
      <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#FBCD2F]/50 to-[#F5A623]/40 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow" />
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-gradient-to-br from-[#F9C41E]/45 to-[#FFF9E0]/35 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-gradient-to-br from-[#FBCD2F]/50 to-[#F5A623]/35 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute bottom-1/4 left-1/2 w-[500px] h-[500px] bg-gradient-to-br from-[#F5A623]/40 to-[#F9C41E]/45 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-gradient-to-br from-[#FFF3C1]/45 to-[#FBCD2F]/40 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow animation-delay-3000" />

      {/* Sunny Yellow Bubbles Rising - MORE VISIBLE */}
      <div className="absolute inset-0">
        {bubbles.map((bubble, i) => (
          <div
            key={`bubble-${i}`}
            className="absolute bottom-0 rounded-full bg-[#FBCD2F]/30 backdrop-blur-sm animate-rise-bubble border-2 border-[#F5A623]/40"
            style={{
              left: `${bubble.left}%`,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              animationDelay: `${bubble.delay}s`,
              animationDuration: `${bubble.duration}s`,
              boxShadow: "0 0 20px rgba(251, 205, 47, 0.4)",
            }}
          />
        ))}
      </div>

      {/* Floating Café Particles - MORE PROMINENT */}
      <div className="absolute inset-0">
        {particles.map((particle, i) => (
          <div
            key={`particle-${i}`}
            className="absolute animate-float-gentle opacity-70 hover:opacity-100 transition-opacity duration-700"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              fontSize: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              filter:
                "drop-shadow(0 0 15px rgba(251, 205, 47, 0.6)) drop-shadow(0 0 25px rgba(245, 166, 35, 0.3))",
            }}
          >
            {particle.emoji}
          </div>
        ))}
      </div>

      {/* Sunny Yellow Sparkle Effect - MORE PROMINENT */}
      <div className="absolute inset-0">
        {goldSparkles.map((sparkle, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute rounded-full bg-[#F5A623] animate-twinkle"
            style={{
              left: `${sparkle.left}%`,
              top: `${sparkle.top}%`,
              width: `${sparkle.size}px`,
              height: `${sparkle.size}px`,
              animationDelay: `${sparkle.delay}s`,
              animationDuration: `${sparkle.duration}s`,
              boxShadow:
                "0 0 15px rgba(245, 166, 35, 0.8), 0 0 25px rgba(251, 205, 47, 0.5)",
            }}
          />
        ))}
      </div>

      {/* Elegant Shimmer Overlay - More visible */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFFFFF]/15 via-transparent to-transparent animate-shimmer-down" />

      {/* Soft Vignette - Lighter */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-[#F5A623]/15" />

      {/* Bottom Glow - Warm Yellow */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#FBCD2F]/20 to-transparent" />

      {/* Top Glow - Soft White */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#FFF9E0]/20 to-transparent" />
    </div>
  );
};

export default AnimatedBackground;
