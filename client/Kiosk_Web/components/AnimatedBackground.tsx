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
      {/* Rich Gold & Orange Gradient Base - Luxurious and Warm */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFF8DC] via-[#FFD700]/20 to-[#FF8C00]/10" />

      {/* Layered Gradient Waves - Gold and Orange accents */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#FF8C00]/20 via-transparent to-[#FFD700]/30 animate-wave" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFA500]/25 via-transparent to-[#FFAA00]/15 animate-wave-reverse" />

      {/* Large Animated Orbs - Rich Gold & Orange Tones - PROMINENT */}
      <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#FFD700]/55 to-[#FFA500]/45 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow" />
      <div className="absolute top-1/3 -left-32 w-[500px] h-[500px] bg-gradient-to-br from-[#FFB347]/50 to-[#FFAA00]/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-[#FFA500]/55 to-[#FF8C00]/45 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute bottom-1/4 left-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[#FF8C00]/45 to-[#FFD700]/50 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#FFAA00]/50 to-[#FFA500]/45 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow animation-delay-3000" />

      {/* Gold & Orange Bubbles Rising - VIVID */}
      <div className="absolute inset-0">
        {bubbles.map((bubble, i) => (
          <div
            key={`bubble-${i}`}
            className="absolute bottom-0 rounded-full bg-gradient-to-br from-[#FFD700]/40 to-[#FFA500]/35 backdrop-blur-sm animate-rise-bubble border-2 border-[#FF8C00]/50"
            style={{
              left: `${bubble.left}%`,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              animationDelay: `${bubble.delay}s`,
              animationDuration: `${bubble.duration}s`,
              boxShadow: "0 0 25px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 165, 0, 0.3)",
            }}
          />
        ))}
      </div>

      {/* Floating Café Particles - GOLDEN GLOW */}
      <div className="absolute inset-0">
        {particles.map((particle, i) => (
          <div
            key={`particle-${i}`}
            className="absolute animate-float-gentle opacity-75 hover:opacity-100 transition-opacity duration-700"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              fontSize: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              filter:
                "drop-shadow(0 0 20px rgba(255, 215, 0, 0.7)) drop-shadow(0 0 35px rgba(255, 165, 0, 0.4))",
            }}
          >
            {particle.emoji}
          </div>
        ))}
      </div>

      {/* Gold & Orange Sparkle Effect - BRILLIANT */}
      <div className="absolute inset-0">
        {goldSparkles.map((sparkle, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] animate-twinkle"
            style={{
              left: `${sparkle.left}%`,
              top: `${sparkle.top}%`,
              width: `${sparkle.size}px`,
              height: `${sparkle.size}px`,
              animationDelay: `${sparkle.delay}s`,
              animationDuration: `${sparkle.duration}s`,
              boxShadow:
                "0 0 20px rgba(255, 215, 0, 0.9), 0 0 30px rgba(255, 165, 0, 0.6), 0 0 40px rgba(255, 140, 0, 0.3)",
            }}
          />
        ))}
      </div>

      {/* Elegant Shimmer Overlay - Golden shimmer */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFD700]/10 via-transparent to-transparent animate-shimmer-down" />

      {/* Soft Vignette - Orange/Gold tint */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-[#FF8C00]/12" />

      {/* Bottom Glow - Warm Orange */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#FFA500]/25 to-transparent" />

      {/* Top Glow - Soft Gold */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#FFD700]/15 to-transparent" />
    </div>
  );
};

export default AnimatedBackground;
