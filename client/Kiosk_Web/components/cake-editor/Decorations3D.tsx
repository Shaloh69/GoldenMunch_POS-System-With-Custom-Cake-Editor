"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Flower Decoration
export function FlowerDecoration({
  position,
  color = "#FF69B4",
  scale = 1,
}: any) {
  return (
    <group position={position} scale={scale}>
      {/* Flower center */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#FFD700" roughness={0.3} />
      </mesh>

      {/* Petals */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * 0.06;
        const z = Math.sin(angle) * 0.06;

        return (
          <mesh key={i} position={[x, 0, z]} rotation={[0, 0, angle]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshStandardMaterial color={color} roughness={0.4} />
          </mesh>
        );
      })}

      {/* Stem (if not on top) */}
      {position[1] > 0.5 && (
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.3, 8]} />
          <meshStandardMaterial color="#228B22" roughness={0.6} />
        </mesh>
      )}
    </group>
  );
}

// Ribbon Decoration
export function RibbonDecoration({
  position,
  color = "#FF1493",
  scale = 1,
}: any) {
  return (
    <group position={position} scale={scale}>
      {/* Main ribbon loop */}
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[0.08, 0.015, 16, 32]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Ribbon tails */}
      <mesh position={[-0.05, -0.08, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.02, 0.12, 0.01]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
      <mesh position={[0.05, -0.08, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.02, 0.12, 0.01]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>

      {/* Ribbon center knot */}
      <mesh>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.2} />
      </mesh>
    </group>
  );
}

// Star Topper
export function StarTopper({ position, color = "#FFD700", scale = 1 }: any) {
  const starRef = useRef<THREE.Group>(null);

  // Gentle rotation animation
  useFrame((state) => {
    if (starRef.current) {
      starRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });

  // Create star shape
  const starPoints = [];
  const outerRadius = 0.12;
  const innerRadius = 0.05;

  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    starPoints.push(
      new THREE.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius),
    );
  }

  const starShape = new THREE.Shape(starPoints);

  return (
    <group ref={starRef} position={position} scale={scale}>
      {/* Star body */}
      <mesh>
        <extrudeGeometry
          args={[
            starShape,
            {
              depth: 0.02,
              bevelEnabled: true,
              bevelThickness: 0.01,
              bevelSize: 0.01,
              bevelSegments: 3,
            },
          ]}
        />
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.8}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Sparkle effect */}
      <pointLight
        position={[0, 0, 0.1]}
        intensity={0.5}
        distance={0.5}
        color={color}
      />
    </group>
  );
}

// Heart Topper
export function HeartTopper({ position, color = "#FF1493", scale = 1 }: any) {
  // Create heart shape
  const heartShape = new THREE.Shape();
  heartShape.moveTo(0, 0);
  heartShape.bezierCurveTo(0, -0.03, -0.05, -0.08, -0.05, -0.08);
  heartShape.bezierCurveTo(-0.05, -0.11, -0.03, -0.12, 0, -0.09);
  heartShape.bezierCurveTo(0.03, -0.12, 0.05, -0.11, 0.05, -0.08);
  heartShape.bezierCurveTo(0.05, -0.08, 0, -0.03, 0, 0);

  return (
    <group position={position} scale={scale} rotation={[Math.PI, 0, 0]}>
      <mesh>
        <extrudeGeometry
          args={[
            heartShape,
            {
              depth: 0.04,
              bevelEnabled: true,
              bevelThickness: 0.01,
              bevelSize: 0.01,
            },
          ]}
        />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.4} />
      </mesh>
    </group>
  );
}

// Butterfly Decoration
export function ButterflyDecoration({
  position,
  color = "#FF69B4",
  scale = 1,
}: any) {
  const butterflyRef = useRef<THREE.Group>(null);

  // Gentle flapping animation
  useFrame((state) => {
    if (butterflyRef.current) {
      const flap = Math.sin(state.clock.elapsedTime * 3) * 0.2;
      butterflyRef.current.children[0].rotation.z = flap;
      butterflyRef.current.children[1].rotation.z = -flap;
    }
  });

  return (
    <group ref={butterflyRef} position={position} scale={scale}>
      {/* Left wing */}
      <mesh position={[-0.04, 0, 0]} rotation={[0, 0, 0.3]}>
        <sphereGeometry args={[0.05, 16, 16, 0, Math.PI]} />
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Right wing */}
      <mesh position={[0.04, 0, 0]} rotation={[0, 0, -0.3]}>
        <sphereGeometry args={[0.05, 16, 16, 0, Math.PI]} />
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Body */}
      <mesh>
        <cylinderGeometry args={[0.01, 0.01, 0.08, 8]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* Antennae */}
      <mesh position={[-0.008, 0.04, 0]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.003, 0.003, 0.03, 4]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <mesh position={[0.008, 0.04, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.003, 0.003, 0.03, 4]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
    </group>
  );
}

// Pearl/Bead Decoration
export function PearlDecoration({
  position,
  color = "#F5F5DC",
  scale = 1,
}: any) {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[0.025, 32, 32]} />
        <meshStandardMaterial
          color={color}
          roughness={0.1}
          metalness={0.9}
          envMapIntensity={1}
        />
      </mesh>
    </group>
  );
}

// Sprinkle Decoration
export function SprinkleDecoration({ position, color, scale = 1 }: any) {
  const randomColor =
    color ||
    ["#FF69B4", "#FFD700", "#00CED1", "#FF1493", "#32CD32"][
      Math.floor(Math.random() * 5)
    ];

  return (
    <group
      position={position}
      scale={scale}
      rotation={[
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      ]}
    >
      <mesh>
        <cylinderGeometry args={[0.008, 0.008, 0.04, 6]} />
        <meshStandardMaterial color={randomColor} roughness={0.3} />
      </mesh>
    </group>
  );
}
