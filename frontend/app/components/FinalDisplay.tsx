"use client";

import { useState } from "react";
import Viewer3D from "./Viewer3D";

interface FinalDisplayProps {
  data: any;
}

export default function FinalDisplay({ data }: FinalDisplayProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
          <div className="mb-4 rounded-2xl overflow-hidden border-2 border-amber-300">
            <img
              src={data.original_images[currentImageIndex]?.url}
              alt={data.original_images[currentImageIndex]?.angle}
              className="w-full h-80 object-cover"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {data.original_images.map((img: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                  currentImageIndex === idx
                    ? "border-amber-500"
                    : "border-gray-300"
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

        <div className="bg-white rounded-3xl shadow-2xl p-6 border border-amber-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Sketch / Blueprint
          </h3>
          <div className="rounded-2xl overflow-hidden border-2 border-amber-300">
            <img
              src={data.sketch}
              alt="Sketch version"
              className="w-full h-80 object-cover"
            />
          </div>
          <p className="text-sm text-gray-600 mt-3 text-center">
            Line art technical drawing
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6 border border-amber-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            3D Interactive Model
          </h3>
          <div className="rounded-2xl overflow-hidden border-2 border-amber-300 h-80">
            <Viewer3D modelUrl={data.model_3d} />
          </div>
          <p className="text-sm text-gray-600 mt-3 text-center">
            Click and drag to rotate
          </p>
        </div>
      </div>
    </div>
  );
}
