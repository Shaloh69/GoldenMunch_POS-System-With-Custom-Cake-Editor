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

interface Sparkle {
  left: number;
  top: number;
  delay: number;
  duration: number;
}

export const AnimatedBackground: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    setMounted(true);

    // Food-themed emojis for particles
    const emojis = ['🍰', '🧁', '🍪', '🥐', '🍩', '☕', '🎂', '🍞', '✨', '⭐'];

    // Generate floating food particles
    const generatedParticles = [...Array(12)].map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 15 + Math.random() * 10,
      size: 20 + Math.random() * 30,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));

    // Generate rising bubbles
    const generatedBubbles = [...Array(15)].map(() => ({
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 8 + Math.random() * 6,
      size: 40 + Math.random() * 100,
    }));

    // Generate sparkles
    const generatedSparkles = [...Array(30)].map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 2,
    }));

    setParticles(generatedParticles);
    setBubbles(generatedBubbles);
    setSparkles(generatedSparkles);
  }, []);

  // Prevent hydration mismatch by not rendering random elements on server
  if (!mounted) {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Base Gradient - Portrait optimized with vertical flow */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base Gradient - Portrait optimized with vertical flow */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50" />

      {/* Animated gradient waves */}
      <div className="absolute inset-0 bg-gradient-to-b from-golden-orange/20 via-transparent to-deep-amber/20 animate-wave" />
      <div className="absolute inset-0 bg-gradient-to-t from-orange-200/20 via-transparent to-amber-200/20 animate-wave-reverse" />

      {/* Large Animated Orbs - Portrait positioned */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-golden-orange/30 to-amber-300/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow" />
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-gradient-to-br from-orange-300/25 to-yellow-300/25 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-gradient-to-br from-amber-400/25 to-orange-200/25 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-yellow-200/20 to-amber-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      <div className="absolute bottom-1/4 -left-24 w-72 h-72 bg-gradient-to-br from-orange-400/30 to-red-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-6000" />
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-deep-amber/30 to-orange-400/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow animation-delay-3000" />

      {/* Rising Bubbles */}
      <div className="absolute inset-0">
        {bubbles.map((bubble, i) => (
          <div
            key={`bubble-${i}`}
            className="absolute bottom-0 rounded-full bg-white/10 backdrop-blur-sm animate-rise-bubble"
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

      {/* Floating Food Particles */}
      <div className="absolute inset-0">
        {particles.map((particle, i) => (
          <div
            key={`particle-${i}`}
            className="absolute animate-float-gentle opacity-40 hover:opacity-100 transition-opacity duration-500"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              fontSize: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          >
            {particle.emoji}
          </div>
        ))}
      </div>

      {/* Sparkle Effect */}
      <div className="absolute inset-0">
        {sparkles.map((sparkle, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute w-1 h-1 bg-golden-orange/40 rounded-full animate-twinkle"
            style={{
              left: `${sparkle.left}%`,
              top: `${sparkle.top}%`,
              animationDelay: `${sparkle.delay}s`,
              animationDuration: `${sparkle.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0iI0ZGQTUwMCIgZmlsbC1vcGFjaXR5PSIwLjAzIiBjeD0iMjAiIGN5PSIyMCIgcj0iMSIvPjwvZz48L3N2Zz4=')] opacity-50" />

      {/* Top Shimmer */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-white/30 via-white/10 to-transparent animate-shimmer-down" />

      {/* Bottom Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-golden-orange/10 to-transparent" />
    </div>
  );
};

export default AnimatedBackground;
