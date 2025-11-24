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
      <h2 className="text-3xl font-bold text-center text-gray-800">
        Your Finalized Jewelry Design
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl shadow-2xl p-6 border border-amber-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Multi-Angle Renders
          </h3>
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

        <div className="bg-white rounded-3xl shadow-2xl p-6 border border-amber-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Technical Sketches
          </h3>
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

        <div className="bg-white rounded-3xl shadow-2xl p-6 border border-amber-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>AR Virtual Try-On</span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-white">
              LIVE
            </span>
          </h3>
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
