"use client";

import { useState, useMemo } from "react";
import ARTryOn from "./ARTryOn";

interface FinalDisplayProps {
  data: any;
}

export default function FinalDisplay({ data }: FinalDisplayProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentSketchIndex, setCurrentSketchIndex] = useState(0);
  const [selectedJewelryIndex, setSelectedJewelryIndex] = useState(0);

  // Detect jewelry type from the prompt or image angles
  const jewelryType = useMemo(() => {
    const prompt = data.prompt?.toLowerCase() || "";
    
    if (prompt.includes("earring")) return "earrings";
    if (prompt.includes("necklace") || prompt.includes("pendant")) return "necklace";
    if (prompt.includes("ring")) return "ring";
    if (prompt.includes("bracelet") || prompt.includes("bangle")) return "bracelet";
    
    // Default to necklace if unclear
    return "necklace";
  }, [data.prompt]);

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-block px-6 py-2 bg-gradient-to-r from-amber-100 to-pink-100 rounded-full mb-4">
          <span className="text-amber-700 font-semibold text-sm">🎉 DESIGN COMPLETE</span>
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-pink-500 bg-clip-text text-transparent">
          Your Stunning Jewelry Design
        </h2>
        <p className="text-gray-600 mt-2">Explore every angle and try it on with AR!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border-2 border-amber-200/50 hover:border-amber-300 transition-all">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">
              Multi-Angle Renders
            </h3>
          </div>
          <div className="mb-4 rounded-2xl overflow-hidden border-2 border-amber-300 bg-white flex items-center justify-center">
            <img
              src={data.original_images[currentImageIndex]?.url}
              alt={data.original_images[currentImageIndex]?.angle}
              className="w-full h-80 object-contain"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {data.original_images.map((img: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  currentImageIndex === idx
                    ? "border-amber-500 scale-105"
                    : "border-gray-300 hover:border-amber-300"
                }`}
              >
                <img
                  src={img.url}
                  alt={img.angle}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center capitalize">
            {data.original_images[currentImageIndex]?.angle}
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border-2 border-amber-200/50 hover:border-amber-300 transition-all">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">
              Technical Sketches
            </h3>
          </div>
          <div className="mb-4 rounded-2xl overflow-hidden border-2 border-amber-300 bg-white flex items-center justify-center">
            <img
              src={data.sketches?.[currentSketchIndex]?.url || data.sketch}
              alt={data.sketches?.[currentSketchIndex]?.angle || "Sketch version"}
              className="w-full h-80 object-contain"
            />
          </div>
          {data.sketches && data.sketches.length > 0 && (
            <>
              <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
                {data.sketches.map((sketch: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSketchIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all bg-white ${
                      currentSketchIndex === idx
                        ? "border-amber-500 scale-105"
                        : "border-gray-300 hover:border-amber-300"
                    }`}
                  >
                    <img
                      src={sketch.url}
                      alt={sketch.angle}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center capitalize">
                {data.sketches[currentSketchIndex]?.angle}
              </p>
            </>
          )}
          <p className="text-sm text-gray-600 mt-3 text-center">
            Hand-drawn pencil technical sketches
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border-2 border-pink-200/50 hover:border-pink-300 transition-all">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-pink-100 rounded-lg">
              <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">
              AR Virtual Try-On
            </h3>
            <span className="ml-auto inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md animate-pulse">
              LIVE
            </span>
          </div>
          <div className="rounded-2xl overflow-hidden border-2 border-amber-300 h-80">
            <ARTryOn
              jewelryImage={data.original_images[selectedJewelryIndex]?.url}
              jewelryType={jewelryType as any}
            />
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-600 mb-2 text-center font-semibold">Select View to Try On:</p>
            <div className="flex gap-2 justify-center overflow-x-auto pb-2">
              {data.original_images.map((img: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedJewelryIndex(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedJewelryIndex === idx
                      ? "border-amber-500 scale-110 shadow-lg"
                      : "border-gray-300 hover:border-amber-300 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.angle}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
