"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";

interface Viewer3DProps {
  modelUrl: string;
}

function JewelryModel({ imageUrl }: { imageUrl: string }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!imageUrl || imageUrl.includes('placeholder')) {
      return;
    }

    const proxiedUrl = `/api/proxy?url=${encodeURIComponent(imageUrl)}`;
    const loader = new THREE.TextureLoader();
    
    loader.load(
      proxiedUrl,
      (loadedTexture) => {
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        setTexture(loadedTexture);
      },
      undefined,
      (err) => {
        console.error("Error loading 3D texture:", err);
      }
    );
  }, [imageUrl]);

  if (!texture) {
    return (
      <mesh>
        <boxGeometry args={[2, 2, 0.3]} />
        <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.1} />
      </mesh>
    );
  }

  return (
    <group>
      {/* Front face with jewelry image */}
      <mesh position={[0, 0, 0.15]}>
        <boxGeometry args={[3, 3, 0.3]} />
        <meshStandardMaterial 
          map={texture}
          metalness={0.2}
          roughness={0.4}
        />
      </mesh>

      {/* Back face - metallic gold */}
      <mesh position={[0, 0, -0.15]} rotation={[0, Math.PI, 0]}>
        <boxGeometry args={[3, 3, 0.3]} />
        <meshStandardMaterial 
          color="#FFD700"
          metalness={0.95}
          roughness={0.05}
        />
      </mesh>

      {/* Top edge */}
      <mesh position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[3, 0.3, 0.3]} />
        <meshStandardMaterial color="#C9A961" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Bottom edge */}
      <mesh position={[0, -1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[3, 0.3, 0.3]} />
        <meshStandardMaterial color="#C9A961" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Left edge */}
      <mesh position={[-1.5, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.3, 3, 0.3]} />
        <meshStandardMaterial color="#C9A961" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Right edge */}
      <mesh position={[1.5, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.3, 3, 0.3]} />
        <meshStandardMaterial color="#C9A961" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

export default function Viewer3D({ modelUrl }: Viewer3DProps) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black relative">
      <Canvas shadows camera={{ position: [0, 2, 6], fov: 45 }}>
        <Suspense fallback={null}>
          {/* Lighting setup for realistic jewelry rendering */}
          <ambientLight intensity={0.3} />
          <directionalLight 
            position={[5, 5, 5]} 
            intensity={1.5} 
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <pointLight position={[-5, 5, -5]} intensity={0.8} color="#ffffff" />
          <spotLight 
            position={[0, 10, 0]} 
            intensity={1}
            angle={0.6}
            penumbra={0.5}
            castShadow
          />
          
          <JewelryModel imageUrl={modelUrl} />
          
          <OrbitControls 
            enableZoom={true} 
            enablePan={false}
            minDistance={3}
            maxDistance={10}
            autoRotate
            autoRotateSpeed={1}
          />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 px-4 py-2 rounded-lg text-sm text-white font-medium backdrop-blur-sm">
        🔄 Drag to rotate • Scroll to zoom
      </div>
      <div className="absolute top-4 right-4 bg-amber-500/90 px-3 py-1 rounded text-xs font-bold text-white">
        3D PREVIEW
      </div>
    </div>
  );
}
