"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Suspense } from "react";

interface Viewer3DProps {
  modelUrl: string;
}

function JewelryModel() {
  return (
    <group>
      {/* Main necklace ring/pendant */}
      <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.15, 32, 64]} />
        <meshStandardMaterial 
          color="#FFD700"
          metalness={0.95}
          roughness={0.05}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Center gemstone */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshPhysicalMaterial 
          color="#DC143C"
          metalness={0}
          roughness={0}
          transmission={0.9}
          thickness={0.5}
          envMapIntensity={2}
          clearcoat={1}
          clearcoatRoughness={0}
        />
      </mesh>

      {/* Chain links - left side */}
      {[...Array(8)].map((_, i) => (
        <mesh 
          key={`left-${i}`} 
          position={[-1.2 - i * 0.3, 0.5 + Math.sin(i * 0.5) * 0.1, 0]}
          rotation={[Math.PI / 2, 0, Math.PI / 4]}
        >
          <torusGeometry args={[0.12, 0.04, 16, 32]} />
          <meshStandardMaterial 
            color="#FFD700"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      ))}

      {/* Chain links - right side */}
      {[...Array(8)].map((_, i) => (
        <mesh 
          key={`right-${i}`} 
          position={[1.2 + i * 0.3, 0.5 + Math.sin(i * 0.5) * 0.1, 0]}
          rotation={[Math.PI / 2, 0, Math.PI / 4]}
        >
          <torusGeometry args={[0.12, 0.04, 16, 32]} />
          <meshStandardMaterial 
            color="#FFD700"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      ))}

      {/* Display stand */}
      <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.8, 0.2, 64]} />
        <meshStandardMaterial 
          color="#2C2C2C"
          metalness={0.3}
          roughness={0.7}
        />
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
          
          <JewelryModel />
          
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
