"use client";

import { useEffect, useRef } from "react";

interface Viewer3DProps {
  modelUrl: string;
}

// Extend JSX to include model-viewer element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

export default function Viewer3D({ modelUrl }: Viewer3DProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Load model-viewer script dynamically
    if (typeof window !== 'undefined' && !document.getElementById('model-viewer-script')) {
      const script = document.createElement('script');
      script.id = 'model-viewer-script';
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';
      document.head.appendChild(script);
    }
  }, []);
  
  // Check if modelUrl is a .glb file
  const isGlbModel = modelUrl && (
    modelUrl.endsWith('.glb') || 
    modelUrl.endsWith('.gltf') ||
    modelUrl.includes('/3d/') ||
    modelUrl.includes('hitem3d')
  );
  
  // If it's a placeholder or not a .glb file, show a message
  if (!modelUrl || modelUrl.includes('placeholder') || !isGlbModel) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black relative flex items-center justify-center">
        <div className="text-center px-6">
          <div className="mb-4 text-6xl">💎</div>
          <h3 className="text-xl font-bold text-white mb-2">3D Model Viewer</h3>
          <p className="text-gray-400 text-sm">
            {modelUrl && modelUrl.includes('Timeout') 
              ? "3D generation timed out. Please try again."
              : modelUrl && modelUrl.includes('Error')
              ? "Failed to generate 3D model."
              : "3D model will be generated when you finalize the design"}
          </p>
        </div>
        <div className="absolute top-4 right-4 bg-amber-500/90 px-3 py-1 rounded text-xs font-bold text-white">
          3D PREVIEW
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black relative" ref={viewerRef}>
      <model-viewer
        src={modelUrl}
        alt="3D jewelry model"
        auto-rotate
        camera-controls
        shadow-intensity="1"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'transparent'
        }}
        exposure="1.2"
        shadow-softness="0.5"
        camera-orbit="0deg 75deg 105%"
        min-camera-orbit="auto auto 50%"
        max-camera-orbit="auto auto 200%"
        interpolation-decay="200"
      >
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50" slot="poster">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent mb-4"></div>
            <p className="text-white text-sm">Loading 3D Model...</p>
          </div>
        </div>
      </model-viewer>
      
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 px-4 py-2 rounded-lg text-sm text-white font-medium backdrop-blur-sm pointer-events-none">
        🔄 Drag to rotate • Scroll to zoom
      </div>
      
      <div className="absolute top-4 right-4 bg-amber-500/90 px-3 py-1 rounded text-xs font-bold text-white">
        REAL 3D MODEL
      </div>
      
      <div className="absolute top-4 left-4 bg-green-500/90 px-3 py-1 rounded text-xs font-bold text-white">
        .GLB FORMAT
      </div>
    </div>
  );
}
