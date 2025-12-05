"use client";

import { useState, useRef, useEffect } from "react";
import { decodeImageUrl } from "../utils/imageUtils";

interface GalleryViewProps {
  images: any[];
}

export default function GalleryView({ images }: GalleryViewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMaximized, setIsMaximized] = useState(false);
  const [maximizedImage, setMaximizedImage] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const scrollLeft = scrollContainerRef.current.scrollLeft;
    const itemWidth = scrollContainerRef.current.offsetWidth * 0.8;
    const index = Math.round(scrollLeft / itemWidth);
    setActiveIndex(Math.min(Math.max(0, index), images.length - 1));
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [images]);

  const openMaximize = (imgUrl: string) => {
    setMaximizedImage(imgUrl);
    setIsMaximized(true);
  };

  const closeMaximize = () => {
    setIsMaximized(false);
    setMaximizedImage(null);
  };

  if (images.length === 0) return null;

  return (
    <div className="w-full py-12 relative">
      {/* Fullscreen Modal */}
      {isMaximized && maximizedImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
          <button
            onClick={closeMaximize}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={decodeImageUrl(maximizedImage)}
            alt="Full Screen View"
            className="max-w-full max-h-full object-contain drop-shadow-2xl"
          />
        </div>
      )}

      <div className="flex items-center justify-between mb-8 px-6">
        <div>
          <h2 className="font-serif text-3xl md:text-4xl text-white">Curated Selection</h2>
          <p className="font-sans text-zinc-500 text-sm tracking-widest uppercase mt-2">
            Swipe to explore angles
          </p>
        </div>
        <div className="flex gap-2">
          {images.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${activeIndex === idx ? "bg-amber-500 w-8" : "bg-white/20"
                }`}
            />
          ))}
        </div>
      </div>

      {/* Horizontal Scroll Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-8 overflow-x-auto px-6 md:px-12 pb-12 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollBehavior: "smooth" }}
      >
        {images.map((img, idx) => (
          <div
            key={idx}
            className={`relative flex-shrink-0 w-[85vw] md:w-[600px] aspect-[4/3] snap-center rounded-3xl overflow-hidden group transition-all duration-500 ${activeIndex === idx ? "scale-100 opacity-100" : "scale-95 opacity-50"
              }`}
          >
            {/* Glass Background */}
            <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-md border border-white/10 group-hover:border-amber-500/30 transition-colors"></div>

            {/* Image */}
            <div className="absolute inset-0 flex items-center justify-center p-8 cursor-zoom-in" onClick={() => openMaximize(img.url)}>
              <img
                src={decodeImageUrl(img.url)}
                alt={img.angle}
                className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-105"
              />
            </div>

            {/* Maximize Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                openMaximize(img.url);
              }}
              className="absolute top-6 right-6 p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:bg-amber-500 hover:text-black hover:scale-110 z-20"
            >
              <svg className="w-6 h-6 text-white hover:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>

            {/* Overlay Info */}
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <p className="font-serif text-3xl text-white capitalize">{img.angle}</p>
              <p className="font-sans text-amber-500 text-xs tracking-widest uppercase mt-1">
                {img.angle === "base view" ? "Master Render" : "Detail Shot"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
