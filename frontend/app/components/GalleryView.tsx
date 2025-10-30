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
  const isBaseView = currentImage.angle === "base view";

  return (
    <div className="bg-gradient-to-br from-white to-amber-50/30 rounded-3xl shadow-2xl p-6 sm:p-8 border-2 border-amber-300/50">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent mb-2">
              {isBaseView ? "Complete Design" : "Detail View"}
            </h2>
            <p className="text-sm text-gray-600">
              {isBaseView 
                ? "Full jewelry design - all detail views are cropped from this same image" 
                : "High-resolution close-up showing fine details and craftsmanship"
              }
            </p>
          </div>
          
          {/* Info Badge */}
          <div className="bg-amber-100 border-2 border-amber-300 rounded-xl px-4 py-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-700 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-xs font-bold text-amber-900">Same Jewelry</p>
              <p className="text-[10px] text-amber-700">All views from one design</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Image Display */}
      <div className="relative">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-amber-400/60 bg-gradient-to-br from-gray-50 to-white">
          <div className="w-full aspect-[4/3] sm:aspect-[16/10] lg:h-[500px] lg:aspect-auto flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-white/80">
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={currentImage.url}
                alt={currentImage.angle}
                className="max-w-full max-h-full w-auto h-auto object-contain drop-shadow-2xl"
                style={{
                  imageRendering: 'high-quality',
                }}
              />
            </div>
          </div>
          
          {/* Image Label */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-900/95 via-amber-900/80 to-transparent p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-lg sm:text-xl font-bold capitalize drop-shadow-lg">
                  {currentImage.angle}
                </p>
                <p className="text-amber-100/90 text-xs sm:text-sm font-medium">
                  View {currentIndex + 1} of {images.length}
                </p>
              </div>
              {!isBaseView && (
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <p className="text-white text-xs font-semibold">DETAIL</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-full p-3 sm:p-4 shadow-xl hover:shadow-2xl transition-all hover:scale-110 active:scale-95 border-2 border-white/30"
              aria-label="Previous image"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
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
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-full p-3 sm:p-4 shadow-xl hover:shadow-2xl transition-all hover:scale-110 active:scale-95 border-2 border-white/30"
              aria-label="Next image"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
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
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">All Views</p>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>
        </div>
        
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-3 px-1 scrollbar-thin scrollbar-thumb-amber-300 scrollbar-track-amber-50">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`group flex-shrink-0 rounded-xl overflow-hidden transition-all duration-300 ${
                idx === currentIndex
                  ? "ring-4 ring-amber-500 shadow-xl scale-105"
                  : "ring-2 ring-gray-200 hover:ring-amber-400 opacity-70 hover:opacity-100 hover:scale-105"
              }`}
            >
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white p-2 flex items-center justify-center">
                  <img
                    src={img.url}
                    alt={img.angle}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 ${
                  idx === currentIndex ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                } transition-opacity`}>
                  <p className="text-white text-[10px] font-semibold truncate text-center">
                    {img.angle.split(' ')[0]}
                  </p>
                </div>
                {idx === currentIndex && (
                  <div className="absolute top-1 right-1 bg-amber-500 rounded-full p-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
