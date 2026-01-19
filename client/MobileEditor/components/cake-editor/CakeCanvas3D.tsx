'use client';

import React, { Suspense, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import CakeModel from './CakeModel';
import type { CakeDesign } from '@/app/page';

interface CakeCanvas3DProps {
  design: CakeDesign;
  options?: any;
}

// Camera angle configurations for different views
const CAMERA_ANGLES = {
  front: { position: [0, 2, 5], target: [0, 0, 0] },
  side: { position: [5, 2, 0], target: [0, 0, 0] },
  top: { position: [0, 6, 0.1], target: [0, 0, 0] },
  '3d_perspective': { position: [3.5, 3, 3.5], target: [0, 0, 0] },
};

// Component to handle camera positioning and screenshot capture
function ScreenshotHelper({
  onCapture,
  onCameraRef
}: {
  onCapture: (capture: () => string) => void;
  onCameraRef: (cameraRef: THREE.Camera | null) => void;
}) {
  const { gl, camera } = useThree();

  // Expose camera and capture function to parent
  useEffect(() => {
    onCameraRef(camera);
    onCapture(() => gl.domElement.toDataURL('image/png'));
  }, [gl, camera, onCapture, onCameraRef]);

  return null;
}

const CakeCanvas3D = forwardRef<any, CakeCanvas3DProps>(({ design, options }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureRef = useRef<() => string>();
  const cameraRef = useRef<THREE.Camera | null>(null);
  const controlsRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    captureScreenshot: async (angle: string) => {
      if (!captureRef.current || !cameraRef.current) {
        console.warn('Screenshot capture not ready');
        return null;
      }

      const camera = cameraRef.current;
      const controls = controlsRef.current;

      // Save current camera position
      const originalPosition = camera.position.clone();
      const originalTarget = controls ? controls.target.clone() : new THREE.Vector3(0, 0, 0);

      try {
        // Get camera configuration for the requested angle
        const angleConfig = CAMERA_ANGLES[angle as keyof typeof CAMERA_ANGLES] || CAMERA_ANGLES.front;

        // Set camera to the specified angle
        camera.position.set(
          angleConfig.position[0],
          angleConfig.position[1],
          angleConfig.position[2]
        );

        // Update controls target if available
        if (controls) {
          controls.target.set(
            angleConfig.target[0],
            angleConfig.target[1],
            angleConfig.target[2]
          );
          controls.update();
        }

        // Make camera look at target
        camera.lookAt(new THREE.Vector3(
          angleConfig.target[0],
          angleConfig.target[1],
          angleConfig.target[2]
        ));

        // Wait a frame for rendering to update
        await new Promise(resolve => setTimeout(resolve, 100));

        // Capture the screenshot
        const screenshot = captureRef.current();

        // Restore original camera position
        camera.position.copy(originalPosition);
        if (controls) {
          controls.target.copy(originalTarget);
          controls.update();
        }
        camera.lookAt(originalTarget);

        return screenshot;
      } catch (error) {
        console.error('Error capturing screenshot:', error);

        // Restore camera position even on error
        camera.position.copy(originalPosition);
        if (controls) {
          controls.target.copy(originalTarget);
          controls.update();
        }

        return null;
      }
    },
  }));

  const handleCaptureReady = (captureFn: () => string) => {
    captureRef.current = captureFn;
  };

  const handleCameraRef = (camera: THREE.Camera | null) => {
    cameraRef.current = camera;
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
          <CakeModel design={design} options={options} />
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
          ref={controlsRef}
          enablePan={false}
          enableZoom={true}
          minDistance={3}
          maxDistance={8}
          maxPolarAngle={Math.PI / 2}
        />

        {/* Screenshot Helper */}
        <ScreenshotHelper onCapture={handleCaptureReady} onCameraRef={handleCameraRef} />
      </Canvas>
    </div>
  );
});

CakeCanvas3D.displayName = 'CakeCanvas3D';

export default CakeCanvas3D;
