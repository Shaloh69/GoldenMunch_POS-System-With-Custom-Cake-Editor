'use client';

import React, { Suspense, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import CakeModel from './CakeModel';
import type { CakeDesign } from '@/app/cake-editor/page';

interface CakeCanvas3DProps {
  design: CakeDesign;
}

// Component to expose screenshot functionality
function ScreenshotHelper({ onCapture }: { onCapture: (capture: () => string) => void }) {
  const { gl } = useThree();

  // Expose capture function to parent
  useEffect(() => {
    onCapture(() => gl.domElement.toDataURL('image/png'));
  }, [gl, onCapture]);

  return null;
}

const CakeCanvas3D = forwardRef<any, CakeCanvas3DProps>(({ design }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureRef = useRef<() => string>();

  useImperativeHandle(ref, () => ({
    captureScreenshot: async (angle: string) => {
      // In a real implementation, you would rotate the camera to different angles
      // For now, we'll just capture the current view
      if (captureRef.current) {
        return captureRef.current();
      }
      return null;
    },
  }));

  const handleCaptureReady = (captureFn: () => string) => {
    captureRef.current = captureFn;
  };

  return (
    <div className="w-full h-full min-h-[400px]">
      <Canvas ref={canvasRef as any} shadows dpr={[1, 2]}>
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

        {/* Screenshot Helper */}
        <ScreenshotHelper onCapture={handleCaptureReady} />
      </Canvas>
    </div>
  );
});

CakeCanvas3D.displayName = 'CakeCanvas3D';

export default CakeCanvas3D;
