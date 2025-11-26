'use client';

import React, { useState, useEffect } from 'react';

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

    // Luxurious chocolate-themed emojis
    const emojis = ['🍫', '☕', '🍰', '🧁', '🥐', '✨', '⭐', '💎', '🌟'];

    // Generate floating chocolate particles
    const generatedParticles = [...Array(15)].map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 20 + Math.random() * 15,
      size: 25 + Math.random() * 35,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));

    // Generate champagne bubbles
    const generatedBubbles = [...Array(20)].map(() => ({
      left: Math.random() * 100,
      delay: Math.random() * 12,
      duration: 10 + Math.random() * 8,
      size: 30 + Math.random() * 80,
    }));

    // Generate gold sparkles
    const generatedSparkles = [...Array(40)].map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 4,
      duration: 2 + Math.random() * 3,
      size: 2 + Math.random() * 3,
    }));

    setParticles(generatedParticles);
    setBubbles(generatedBubbles);
    setGoldSparkles(generatedSparkles);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3A1F0F] via-[#7B4B28] to-[#662B35]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Rich Chocolate Gradient Base */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#3A1F0F] via-[#7B4B28] to-[#662B35]" />

      {/* Layered Gradient Waves */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#662B35]/40 via-transparent to-[#3A1F0F]/40 animate-wave" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#EAD7B7]/10 via-transparent to-[#7B4B28]/20 animate-wave-reverse" />

      {/* Large Animated Orbs - Champagne Gold & Burgundy */}
      <div className="absolute -top-40 left-1/4 w-96 h-96 bg-gradient-to-br from-[#EAD7B7]/30 to-[#7B4B28]/20 rounded-full mix-blend-soft-light filter blur-3xl animate-pulse-slow" />
      <div className="absolute top-1/3 -left-32 w-80 h-80 bg-gradient-to-br from-[#662B35]/25 to-[#EAD7B7]/15 rounded-full mix-blend-soft-light filter blur-3xl animate-blob" />
      <div className="absolute top-1/3 -right-32 w-80 h-80 bg-gradient-to-br from-[#7B4B28]/30 to-[#EAD7B7]/20 rounded-full mix-blend-soft-light filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-gradient-to-br from-[#EAD7B7]/25 to-[#662B35]/15 rounded-full mix-blend-soft-light filter blur-3xl animate-blob animation-delay-4000" />
      <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-gradient-to-br from-[#7B4B28]/30 to-[#3A1F0F]/20 rounded-full mix-blend-soft-light filter blur-3xl animate-pulse-slow animation-delay-3000" />

      {/* Champagne Bubbles Rising */}
      <div className="absolute inset-0">
        {bubbles.map((bubble, i) => (
          <div
            key={`bubble-${i}`}
            className="absolute bottom-0 rounded-full bg-[#EAD7B7]/15 backdrop-blur-sm animate-rise-bubble border border-[#EAD7B7]/20"
            style={{
              left: `${bubble.left}%`,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              animationDelay: `${bubble.delay}s`,
              animationDuration: `${bubble.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Floating Chocolate Particles */}
      <div className="absolute inset-0">
        {particles.map((particle, i) => (
          <div
            key={`particle-${i}`}
            className="absolute animate-float-gentle opacity-50 hover:opacity-100 transition-opacity duration-700 drop-shadow-lg"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              fontSize: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              filter: 'drop-shadow(0 0 8px rgba(234, 215, 183, 0.3))',
            }}
          >
            {particle.emoji}
          </div>
        ))}
      </div>

      {/* Gold Sparkle Effect */}
      <div className="absolute inset-0">
        {goldSparkles.map((sparkle, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute rounded-full bg-[#EAD7B7] animate-twinkle shadow-[0_0_10px_rgba(234,215,183,0.6)]"
            style={{
              left: `${sparkle.left}%`,
              top: `${sparkle.top}%`,
              width: `${sparkle.size}px`,
              height: `${sparkle.size}px`,
              animationDelay: `${sparkle.delay}s`,
              animationDuration: `${sparkle.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Elegant Shimmer Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FAF7F2]/5 via-transparent to-transparent animate-shimmer-down" />

      {/* Subtle Vignette */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-[#3A1F0F]/40" />

      {/* Bottom Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#662B35]/20 to-transparent" />

      {/* Top Glow */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#3A1F0F]/30 to-transparent" />
    </div>
  );
};

export default AnimatedBackground;
