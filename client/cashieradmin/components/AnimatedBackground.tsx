'use client';

import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Enhanced particle system with more variety
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      color: string;
      angle: number;
      angleSpeed: number;
      pulseSpeed: number;
      pulsePhase: number;
      canvasWidth: number;
      canvasHeight: number;

      constructor(canvasWidth: number, canvasHeight: number) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.size = Math.random() * 5 + 2;
        this.speedX = Math.random() * 0.8 - 0.4;
        this.speedY = Math.random() * 0.8 - 0.4;
        this.opacity = Math.random() * 0.4 + 0.2;
        this.angle = Math.random() * Math.PI * 2;
        this.angleSpeed = (Math.random() - 0.5) * 0.02;
        this.pulseSpeed = Math.random() * 0.02 + 0.01;
        this.pulsePhase = Math.random() * Math.PI * 2;

        // Light Caramel & Cream color palette
        const colors = [
          'rgba(217, 179, 140, ', // Light Caramel
          'rgba(255, 249, 242, ', // Cream White
          'rgba(232, 220, 200, ', // Soft Sand
          'rgba(201, 184, 165, ', // Warm Beige
          'rgba(198, 123, 87, ',  // Muted Clay
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        // Add wave-like motion
        this.angle += this.angleSpeed;
        this.x += this.speedX + Math.cos(this.angle) * 0.5;
        this.y += this.speedY + Math.sin(this.angle) * 0.5;

        // Pulsing opacity
        this.pulsePhase += this.pulseSpeed;
        const pulseOpacity = Math.sin(this.pulsePhase) * 0.2;

        // Wrap around edges with smooth transition
        if (this.x > this.canvasWidth + 50) this.x = -50;
        if (this.x < -50) this.x = this.canvasWidth + 50;
        if (this.y > this.canvasHeight + 50) this.y = -50;
        if (this.y < -50) this.y = this.canvasHeight + 50;

        return pulseOpacity;
      }

      draw(pulseOpacity: number) {
        if (!ctx) return;

        // Draw glowing effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color + (this.opacity + pulseOpacity) + ')';

        ctx.fillStyle = this.color + (this.opacity + pulseOpacity) + ')';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
      }
    }

    // Create more particles for a fuller effect
    const particles: Particle[] = [];
    const particleCount = 80;
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(canvas.width, canvas.height));
    }

    // Gradient animation with smoother transitions
    let gradientOffset = 0;
    let time = 0;

    const animate = () => {
      if (!ctx) return;

      time += 0.005;
      gradientOffset += 0.0008;

      // Create multi-layered animated gradient background
      const gradient1 = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);

      // Light Caramel & Cream gradient with subtle animation
      const offset = Math.sin(gradientOffset * Math.PI * 2) * 0.1;
      gradient1.addColorStop(0, '#FFF9F2');       // Cream White
      gradient1.addColorStop(0.3 + offset, '#F5EFE6');
      gradient1.addColorStop(0.6 + offset, '#E8DCC8'); // Soft Sand
      gradient1.addColorStop(1, '#D9B38C');       // Light Caramel

      ctx.fillStyle = gradient1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add animated radial gradient overlay
      const radialGradient = ctx.createRadialGradient(
        canvas.width / 2 + Math.cos(time) * 100,
        canvas.height / 2 + Math.sin(time * 0.8) * 100,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) / 1.5
      );
      radialGradient.addColorStop(0, 'rgba(255, 249, 242, 0.4)');
      radialGradient.addColorStop(0.5, 'rgba(232, 220, 200, 0.2)');
      radialGradient.addColorStop(1, 'rgba(217, 179, 140, 0.1)');
      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add warm glow overlay at corners
      const cornerGlow1 = ctx.createRadialGradient(0, 0, 0, 0, 0, canvas.width * 0.6);
      cornerGlow1.addColorStop(0, 'rgba(198, 123, 87, 0.15)');
      cornerGlow1.addColorStop(1, 'rgba(198, 123, 87, 0)');
      ctx.fillStyle = cornerGlow1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cornerGlow2 = ctx.createRadialGradient(
        canvas.width, canvas.height, 0,
        canvas.width, canvas.height, canvas.width * 0.6
      );
      cornerGlow2.addColorStop(0, 'rgba(217, 179, 140, 0.15)');
      cornerGlow2.addColorStop(1, 'rgba(217, 179, 140, 0)');
      ctx.fillStyle = cornerGlow2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach(particle => {
        const pulseOpacity = particle.update();
        particle.draw(pulseOpacity);
      });

      // Draw enhanced connecting lines between nearby particles
      ctx.lineWidth = 1;
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 180) {
            const opacity = 0.25 * (1 - distance / 180);
            ctx.strokeStyle = `rgba(217, 179, 140, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ background: 'linear-gradient(135deg, #FFF9F2 0%, #E8DCC8 50%, #D9B38C 100%)' }}
    />
  );
}
