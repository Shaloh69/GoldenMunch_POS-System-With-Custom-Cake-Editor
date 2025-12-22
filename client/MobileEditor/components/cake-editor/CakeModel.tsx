'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder, Text3D, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import type { CakeDesign } from '@/app/page';

interface CakeModelProps {
  design: CakeDesign;
  options?: any;
}

/**
 * Calculate optimal candle positions in a grid pattern within circular boundary
 * @param count - Number of candles
 * @param topRadius - Radius of the top layer (including frosting)
 * @returns Array of [x, z] positions for each candle
 */
function getCandlePositions(count: number, topRadius: number): [number, number][] {
  if (count <= 0) return [];

  const positions: [number, number][] = [];

  // Calculate candle radius based on count (matches Candle3D sizing)
  const sizeScale = count <= 5 ? 1 : Math.max(0.4, 1 - (count - 5) * 0.03);
  const candleRadius = 0.04 * sizeScale;

  // Account for candle physical size - subtract candle radius to keep edges within bounds
  const safeRadius = topRadius * 0.90 - candleRadius;

  // Special cases for small numbers
  if (count === 1) {
    // Single candle in center
    return [[0, 0]];
  }

  if (count === 2) {
    // Two candles opposite each other
    const spacing = safeRadius * 0.5;
    return [[-spacing, 0], [spacing, 0]];
  }

  if (count === 3) {
    // Three candles in triangle
    const r = safeRadius * 0.5;
    return [
      [0, -r],
      [r * Math.cos(Math.PI / 6), r * Math.sin(Math.PI / 6)],
      [-r * Math.cos(Math.PI / 6), r * Math.sin(Math.PI / 6)]
    ];
  }

  if (count === 4) {
    // Four candles in square
    const r = safeRadius * 0.5;
    return [
      [-r, -r], [r, -r],
      [-r, r], [r, r]
    ];
  }

  // For 5+ candles, use adaptive grid within circular boundary
  // Calculate grid size that will fit the desired number of candles
  const gridSize = Math.ceil(Math.sqrt(count));
  const spacing = (safeRadius * 2) / (gridSize + 1);

  // Generate grid positions
  const gridPositions: [number, number][] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const x = -safeRadius + spacing * (col + 1);
      const z = -safeRadius + spacing * (row + 1);

      // Check if position is within circular boundary
      const distanceFromCenter = Math.sqrt(x * x + z * z);
      if (distanceFromCenter <= safeRadius) {
        gridPositions.push([x, z]);
      }
    }
  }

  // If we have more positions than needed, take the first 'count' positions
  // If we have fewer, we'll need to add more in a circular pattern
  if (gridPositions.length >= count) {
    return gridPositions.slice(0, count);
  }

  // If grid didn't generate enough positions, add more in circular rings
  let currentPositions = [...gridPositions];
  let ringRadius = safeRadius * 0.6;
  const ringStep = safeRadius * 0.15;

  while (currentPositions.length < count && ringRadius <= safeRadius) {
    const candlesInRing = Math.min(
      count - currentPositions.length,
      Math.floor(2 * Math.PI * ringRadius / 0.15) // Spacing based on circumference
    );

    for (let i = 0; i < candlesInRing; i++) {
      if (currentPositions.length >= count) break;

      const angle = (i / candlesInRing) * Math.PI * 2;
      const x = Math.cos(angle) * ringRadius;
      const z = Math.sin(angle) * ringRadius;

      // Verify it's within bounds
      if (Math.sqrt(x * x + z * z) <= safeRadius) {
        currentPositions.push([x, z]);
      }
    }

    ringRadius += ringStep;
  }

  return currentPositions.slice(0, count);
}

/**
 * Individual 3D Candle Component with animation
 * @param position - X and Z position on the cake top
 * @param index - Candle index for animation offset
 * @param count - Total number of candles (for sizing)
 */
function Candle3D({ position, index, count }: { position: [number, number]; index: number; count: number }) {
  const flameRef = useRef<THREE.Mesh>(null);

  // Animate flame with slight flicker
  useFrame((state) => {
    if (flameRef.current) {
      const time = state.clock.elapsedTime + index * 0.5; // Offset each flame
      const flicker = Math.sin(time * 8) * 0.02 + Math.sin(time * 15) * 0.01;
      flameRef.current.scale.setScalar(1 + flicker);

      // Slight sway
      flameRef.current.position.x = Math.sin(time * 2) * 0.01;
    }
  });

  // Scale candles based on count - more candles = smaller candles
  // Base size for 1-5 candles, then scale down progressively
  const sizeScale = count <= 5 ? 1 : Math.max(0.4, 1 - (count - 5) * 0.03);

  const candleHeight = 0.3 * sizeScale;
  const candleRadius = 0.04 * sizeScale;
  const wickHeight = 0.05 * sizeScale;
  const flameSize = sizeScale;

  return (
    <group position={[position[0], 0, position[1]]}>
      {/* Candle Body - positioned to sit ON the surface (not floating) */}
      <Cylinder args={[candleRadius, candleRadius * 1.1, candleHeight, 12]} position={[0, candleHeight / 2, 0]}>
        <meshStandardMaterial
          color="#FFF8DC"
          roughness={0.6}
          metalness={0.1}
        />
      </Cylinder>

      {/* Wick */}
      <Cylinder args={[0.005 * sizeScale, 0.005 * sizeScale, wickHeight, 4]} position={[0, candleHeight + wickHeight / 2, 0]}>
        <meshStandardMaterial color="#2C2C2C" />
      </Cylinder>

      {/* Flame */}
      <group position={[0, candleHeight + wickHeight, 0]}>
        {/* Inner flame (bright yellow) */}
        <Sphere ref={flameRef} args={[0.035 * flameSize, 8, 8]} position={[0, 0.02 * flameSize, 0]}>
          <meshStandardMaterial
            color="#FFFF00"
            emissive="#FFD700"
            emissiveIntensity={3}
            transparent
            opacity={0.9}
          />
        </Sphere>

        {/* Outer flame (orange glow) */}
        <Sphere args={[0.045 * flameSize, 8, 8]} position={[0, 0.02 * flameSize, 0]}>
          <meshStandardMaterial
            color="#FFA500"
            emissive="#FF4500"
            emissiveIntensity={2}
            transparent
            opacity={0.6}
          />
        </Sphere>

        {/* Point light for flame glow */}
        <pointLight
          color="#FFD700"
          intensity={0.5 * flameSize}
          distance={0.5}
          decay={2}
          position={[0, 0.02 * flameSize, 0]}
        />
      </group>
    </group>
  );
}

export default function CakeModel({ design, options }: CakeModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Gentle rotation animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  // Get size data from options
  const sizes = options?.sizes || [
    { size_id: 1, size_name: 'Small (6")', diameter_cm: 15, servings: 8, base_price_multiplier: 1.0 },
    { size_id: 2, size_name: 'Medium (8")', diameter_cm: 20, servings: 16, base_price_multiplier: 1.5 },
    { size_id: 3, size_name: 'Large (10")', diameter_cm: 25, servings: 24, base_price_multiplier: 2.0 },
    { size_id: 4, size_name: 'XL (12")', diameter_cm: 30, servings: 36, base_price_multiplier: 2.5 },
  ];

  // Get size_id for a specific layer (1-indexed)
  const getLayerSizeId = (layerNumber: number): number => {
    const key = `layer_${layerNumber}_size_id` as keyof CakeDesign;
    return (design[key] as number) || 2; // Default to size 2 (Medium)
  };

  // Convert size_id to radius based on diameter_cm
  const getSizeRadius = (sizeId: number): number => {
    const size = sizes.find((s: any) => s.size_id === sizeId);
    if (!size) return 1.0; // Default radius

    // Convert diameter in cm to 3D units (scale down for visualization)
    // Using a scale factor of 0.06 to make it look good in the viewport
    const radius = (size.diameter_cm / 2) * 0.06;
    return radius;
  };

  // Calculate layer sizes based on actual size selections
  const getLayerRadius = (layerNumber: number): number => {
    const sizeId = getLayerSizeId(layerNumber);
    return getSizeRadius(sizeId);
  };

  const getLayerHeight = (): number => 0.4;

  // Frosting color
  const frostingColor = design.frosting_color || '#FFFFFF';

  // Calculate total cake height for candle positioning
  const totalCakeHeight = design.num_layers * getLayerHeight();

  // Get the radius of the top layer (for candle positioning)
  // Account for frosting which extends the radius by 0.05
  const topLayerRadius = getLayerRadius(design.num_layers) + 0.05;

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      {/* Cake Layers */}
      {Array.from({ length: design.num_layers }).map((_, index) => {
        const layerNumber = design.num_layers - index; // Layer number from bottom (1-indexed)
        const radius = getLayerRadius(layerNumber);
        const height = getLayerHeight();
        const yPosition = index * height;

        return (
          <group key={index} position={[0, yPosition, 0]}>
            {/* Layer Body */}
            <Cylinder args={[radius, radius, height, 32]}>
              <meshStandardMaterial
                color={getFlavorColor(layerNumber - 1, design)}
                roughness={0.3}
                metalness={0.1}
              />
            </Cylinder>

            {/* Frosting Top */}
            <Cylinder
              args={[radius + 0.05, radius + 0.05, 0.05, 32]}
              position={[0, height / 2, 0]}
            >
              <meshStandardMaterial
                color={frostingColor}
                roughness={0.2}
                metalness={0.3}
              />
            </Cylinder>

            {/* Frosting Sides */}
            <Cylinder
              args={[radius + 0.02, radius + 0.02, height, 32]}
              position={[0, 0, 0]}
            >
              <meshStandardMaterial
                color={frostingColor}
                roughness={0.2}
                metalness={0.2}
                transparent
                opacity={0.6}
              />
            </Cylinder>
          </group>
        );
      })}

      {/* Candles - DISABLED: Baker will add candles to actual cake */}
      {/* {design.candles_count > 0 && (
        <group position={[0, totalCakeHeight, 0]}>
          {getCandlePositions(design.candles_count, topLayerRadius).map((pos, i) => (
            <Candle3D key={i} position={pos} index={i} count={design.candles_count} />
          ))}
        </group>
      )} */}

      {/* Cake Text - positioned on top layer */}
      {design.cake_text && (
        <group position={[0, totalCakeHeight + 0.1, topLayerRadius + 0.1]}>
          <Text3D
            font="/fonts/helvetiker_regular.typeface.json"
            size={0.15}
            height={0.02}
            curveSegments={12}
            bevelEnabled
            bevelThickness={0.01}
            bevelSize={0.01}
            rotation={[0, 0, 0]}
          >
            {design.cake_text}
            <meshStandardMaterial
              color={design.text_color || '#FF1493'}
              roughness={0.2}
              metalness={0.5}
            />
          </Text3D>
        </group>
      )}

      {/* 3D Decorations - DISABLED: Baker will add decorations to actual cake */}
      {/* {design.decorations_3d && design.decorations_3d.map((decoration, i) => (
        <Decoration3D key={i} decoration={decoration} />
      ))} */}
    </group>
  );
}

// Get flavor color (mock)
function getFlavorColor(layerIndex: number, design: CakeDesign): string {
  const flavorId =
    layerIndex === 0 ? design.layer_1_flavor_id :
    layerIndex === 1 ? design.layer_2_flavor_id :
    layerIndex === 2 ? design.layer_3_flavor_id :
    layerIndex === 3 ? design.layer_4_flavor_id :
    design.layer_5_flavor_id;

  // Map flavor IDs to colors
  const flavorColors: Record<number, string> = {
    1: '#8B4513', // Chocolate - brown
    2: '#FFE4B5', // Vanilla - cream
    3: '#FFB6C1', // Strawberry - pink
    4: '#DC143C', // Red Velvet - red
  };

  return flavorColors[flavorId || 1] || '#FFE4B5';
}

// 3D Decoration Component - now supports all decoration types
function Decoration3D({ decoration }: { decoration: any }) {
  const { type, position, color, scale } = decoration;

  const pos: [number, number, number] = [
    position?.x || 0,
    position?.y || 0,
    position?.z || 0,
  ];

  const scl = scale?.x || scale || 1;

  // Basic decorations (for compatibility)
  if (type === 'flower') {
    return (
      <group position={pos} scale={scl}>
        {/* Simple flower representation */}
        <Sphere args={[0.08, 12, 12]}>
          <meshStandardMaterial color={color || '#FF69B4'} roughness={0.4} />
        </Sphere>
        {Array.from({ length: 5 }).map((_, i) => {
          const angle = (i / 5) * Math.PI * 2;
          return (
            <Sphere
              key={i}
              args={[0.04, 8, 8]}
              position={[Math.cos(angle) * 0.06, 0, Math.sin(angle) * 0.06]}
            >
              <meshStandardMaterial color={color || '#FF69B4'} roughness={0.3} />
            </Sphere>
          );
        })}
      </group>
    );
  }

  if (type === 'star') {
    return (
      <group position={pos} scale={scl}>
        <Sphere args={[0.06, 5, 5]}>
          <meshStandardMaterial
            color={color || '#FFD700'}
            emissive={color || '#FFD700'}
            emissiveIntensity={0.5}
            roughness={0.2}
            metalness={0.8}
          />
        </Sphere>
      </group>
    );
  }

  if (type === 'heart') {
    return (
      <group position={pos} scale={scl}>
        <Sphere args={[0.05, 16, 16]}>
          <meshStandardMaterial color={color || '#FF1493'} roughness={0.3} />
        </Sphere>
      </group>
    );
  }

  if (type === 'ribbon') {
    return (
      <group position={pos} scale={scl}>
        <mesh>
          <torusGeometry args={[0.06, 0.012, 12, 24]} />
          <meshStandardMaterial color={color || '#FF1493'} roughness={0.3} metalness={0.2} />
        </mesh>
      </group>
    );
  }

  if (type === 'pearl') {
    return (
      <group position={pos} scale={scl}>
        <Sphere args={[0.02, 24, 24]}>
          <meshStandardMaterial
            color={color || '#F5F5DC'}
            roughness={0.1}
            metalness={0.9}
          />
        </Sphere>
      </group>
    );
  }

  return null;
}
