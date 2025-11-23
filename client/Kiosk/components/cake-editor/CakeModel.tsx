'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder, Text3D, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import type { CakeDesign } from '@/app/cake-editor/page';

interface CakeModelProps {
  design: CakeDesign;
}

export default function CakeModel({ design }: CakeModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Gentle rotation animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  // Calculate layer sizes (decreasing from bottom to top)
  const getLayerRadius = (layerIndex: number, totalLayers: number): number => {
    const baseRadius = 1.5;
    const reduction = 0.2 * layerIndex;
    return Math.max(baseRadius - reduction, 0.5);
  };

  const getLayerHeight = (): number => 0.4;

  // Frosting color
  const frostingColor = design.frosting_color || '#FFFFFF';

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      {/* Cake Layers */}
      {Array.from({ length: design.num_layers }).map((_, index) => {
        const layerIndex = design.num_layers - 1 - index; // Bottom to top
        const radius = getLayerRadius(index, design.num_layers);
        const height = getLayerHeight();
        const yPosition = index * height;

        return (
          <group key={index} position={[0, yPosition, 0]}>
            {/* Layer Body */}
            <Cylinder args={[radius, radius, height, 32]}>
              <meshStandardMaterial
                color={getFlavorColor(layerIndex, design)}
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

      {/* Candles */}
      {design.candles_count > 0 && (
        <group position={[0, design.num_layers * getLayerHeight(), 0]}>
          {Array.from({ length: Math.min(design.candles_count, 10) }).map((_, i) => {
            const angle = (i / design.candles_count) * Math.PI * 2;
            const radius = getLayerRadius(0, design.num_layers) * 0.7;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            return (
              <group key={i} position={[x, 0, z]}>
                {/* Candle Body */}
                <Cylinder args={[0.05, 0.05, 0.3, 8]} position={[0, 0.15, 0]}>
                  <meshStandardMaterial color="#FFF8DC" />
                </Cylinder>
                {/* Flame */}
                <Sphere args={[0.04, 8, 8]} position={[0, 0.32, 0]}>
                  <meshStandardMaterial
                    color="#FFD700"
                    emissive="#FF4500"
                    emissiveIntensity={2}
                  />
                </Sphere>
              </group>
            );
          })}
        </group>
      )}

      {/* Cake Text */}
      {design.cake_text && (
        <group position={[0, design.num_layers * getLayerHeight() + 0.1, getLayerRadius(0, design.num_layers) + 0.1]}>
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

      {/* 3D Decorations */}
      {design.decorations_3d && design.decorations_3d.map((decoration, i) => (
        <Decoration3D key={i} decoration={decoration} />
      ))}
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

// 3D Decoration Component
function Decoration3D({ decoration }: { decoration: any }) {
  const { type, position, color, scale } = decoration;

  const pos: [number, number, number] = [
    position?.x || 0,
    position?.y || 0,
    position?.z || 0,
  ];

  const scl = scale?.x || 1;

  if (type === 'flower') {
    return (
      <group position={pos}>
        <Sphere args={[0.1 * scl, 8, 8]}>
          <meshStandardMaterial color={color || '#FF69B4'} />
        </Sphere>
      </group>
    );
  }

  if (type === 'star') {
    return (
      <group position={pos}>
        <Sphere args={[0.08 * scl, 5, 5]}>
          <meshStandardMaterial color={color || '#FFD700'} emissive="#FFD700" emissiveIntensity={0.5} />
        </Sphere>
      </group>
    );
  }

  return null;
}
