'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import CakeModel from './CakeModel';
import type { CakeDesign } from '@/app/cake-editor/page';

interface CakeCanvas3DProps {
  design: CakeDesign;
}

export default function CakeCanvas3D({ design }: CakeCanvas3DProps) {
  return (
    <div className="w-full h-full min-h-[400px]">
      <Canvas shadows dpr={[1, 2]}>
        {/* Camera */}
        <PerspectiveCamera makeDefault position={[0, 2, 5]} fov={50} />

        {/* Lights */}
        <ambientLight intensity={0.5} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          intensity={1}
          castShadow
        />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        {/* Environment */}
        <Suspense fallback={null}>
          <Environment preset="sunset" />
        </Suspense>

        {/* Cake Model */}
        <Suspense fallback={null}>
          <CakeModel design={design} />
        </Suspense>

        {/* Ground Shadow */}
        <ContactShadows
          position={[0, -1, 0]}
          opacity={0.4}
          scale={10}
          blur={2.5}
          far={4}
        />

        {/* Controls */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={3}
          maxDistance={8}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}
