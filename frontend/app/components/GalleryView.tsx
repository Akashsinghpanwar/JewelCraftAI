"use client";

import { useState } from "react";

interface GalleryViewProps {
  images: any[];
}

export default function GalleryView({ images }: GalleryViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 border border-amber-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Multi-Angle Views
      </h2>
      
      {/* Main Image Display */}
      <div className="relative">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-amber-200 bg-gray-50">
          <div className="w-full h-[600px] flex items-center justify-center p-8">
            <img
              src={currentImage.url}
              alt={currentImage.angle}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
            <p className="text-white text-xl font-semibold capitalize">
              {currentImage.angle}
            </p>
            <p className="text-white/70 text-sm">
              {currentIndex + 1} of {images.length}
            </p>
          </div>
        </div>

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-4 shadow-xl hover:shadow-2xl transition-all hover:scale-110"
              aria-label="Previous image"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-4 shadow-xl hover:shadow-2xl transition-all hover:scale-110"
              aria-label="Next image"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Navigation */}
      <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`flex-shrink-0 rounded-lg overflow-hidden border-3 transition-all ${
              idx === currentIndex
                ? "border-amber-500 shadow-lg scale-105"
                : "border-gray-200 hover:border-amber-300 opacity-60 hover:opacity-100"
            }`}
          >
            <img
              src={img.url}
              alt={img.angle}
              className="w-24 h-24 object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
