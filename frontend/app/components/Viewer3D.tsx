"use client";

import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";

interface Viewer3DProps {
  modelUrl: string;
}

function ImageMesh({ imageUrl }: { imageUrl: string }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!imageUrl || imageUrl.includes('placeholder')) {
      setError(true);
      return;
    }

    const proxiedUrl = `/api/proxy?url=${encodeURIComponent(imageUrl)}`;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    
    loader.load(
      proxiedUrl,
      (loadedTexture) => {
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        setTexture(loadedTexture);
        setError(false);
      },
      undefined,
      (err) => {
        console.error("Error loading texture from:", imageUrl);
        console.error("Error details:", err);
        setError(true);
      }
    );
  }, [imageUrl]);

  if (error || !texture) {
    return (
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
      </mesh>
    );
  }

  return (
    <mesh>
      <planeGeometry args={[4, 4]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function Viewer3D({ modelUrl }: Viewer3DProps) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 relative">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <spotLight position={[0, 5, 0]} intensity={0.5} />
          
          <ImageMesh imageUrl={modelUrl} />
          
          <OrbitControls enableZoom={true} enablePan={false} />
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
      <div className="absolute bottom-2 right-2 bg-white/80 px-3 py-1 rounded text-xs text-gray-600">
        Drag to rotate
      </div>
    </div>
  );
}
