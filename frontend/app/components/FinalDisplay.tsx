"use client";

import { useState, useMemo } from "react";
import ARTryOn from "./ARTryOn";
import { decodeImageUrl } from "../utils/imageUtils";

interface FinalDisplayProps {
  data: any;
}

export default function FinalDisplay({ data }: FinalDisplayProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentSketchIndex, setCurrentSketchIndex] = useState(0);
  const [selectedJewelryIndex, setSelectedJewelryIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"render" | "ar">("render");
  const [isMaximized, setIsMaximized] = useState(false);
  const [maximizedImage, setMaximizedImage] = useState<string | null>(null);

  const [isExpanded, setIsExpanded] = useState(false);

  // Detect jewelry type
  const jewelryType = useMemo(() => {
    const prompt = data.prompt?.toLowerCase() || "";
    if (prompt.includes("earring")) return "earrings";
    if (prompt.includes("necklace") || prompt.includes("pendant")) return "necklace";
    if (prompt.includes("ring")) return "ring";
    if (prompt.includes("bracelet") || prompt.includes("bangle")) return "bracelet";
    return "necklace";
  }, [data.prompt]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const openMaximize = (imgUrl: string) => {
    setMaximizedImage(imgUrl);
    setIsMaximized(true);
  };

  const closeMaximize = () => {
    setIsMaximized(false);
    setMaximizedImage(null);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full max-w-[100vw] bg-black text-white overflow-hidden transition-all duration-500">

      {/* FULLSCREEN MODAL */}
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

      {/* LEFT SIDE: Visual Showcase (Sticky) */}
      <div className={`h-[50vh] lg:h-full relative bg-zinc-900 border-r border-white/5 flex-shrink-0 transition-all duration-700 ease-in-out ${isExpanded ? "w-full lg:w-full" : "w-full lg:w-1/2"}`}>
        {activeTab === "render" ? (
          <div className="w-full h-full flex items-center justify-center p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-black to-black opacity-50"></div>

            {/* Main Image */}
            <img
              src={decodeImageUrl(data.original_images[currentImageIndex]?.url)}
              alt={data.original_images[currentImageIndex]?.angle}
              className="w-full h-full object-contain relative z-10 drop-shadow-2xl transition-transform duration-700 group-hover:scale-105 cursor-zoom-in"
              onClick={toggleExpand}
            />

            {/* Maximize Button (Floating) */}
            <button
              onClick={toggleExpand}
              className="absolute top-8 right-8 z-20 p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>

            <div className="absolute bottom-8 left-8 z-20 pointer-events-none">
              <p className="font-serif text-4xl text-white/90 capitalize">
                {data.original_images[currentImageIndex]?.angle}
              </p>
              <p className="font-sans text-xs text-amber-500 tracking-widest uppercase mt-2">Studio Render</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative z-10">
            <ARTryOn
              jewelryImage={data.original_images[selectedJewelryIndex]?.url}
              jewelryType={jewelryType as any}
            />
          </div>
        )}

        {/* Tab Switcher (Floating) */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 flex gap-2 bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/10">
          <button
            onClick={() => setActiveTab("render")}
            className={`px-6 py-2 rounded-full text-sm font-sans tracking-widest uppercase transition-all ${activeTab === "render" ? "bg-white text-black font-bold" : "text-white/50 hover:text-white"
              }`}
          >
            Render
          </button>
          <button
            onClick={() => setActiveTab("ar")}
            className={`px-6 py-2 rounded-full text-sm font-sans tracking-widest uppercase transition-all ${activeTab === "ar" ? "bg-amber-500 text-black font-bold" : "text-white/50 hover:text-white"
              }`}
          >
            Try On
          </button>
        </div>
      </div>

      {/* RIGHT SIDE: Details & Controls (Scrollable) */}
      <div className={`w-full lg:w-1/2 h-[50vh] lg:h-full overflow-y-auto bg-black p-8 lg:p-16 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex-shrink-0 transition-all duration-500 ${isExpanded ? "lg:w-0 opacity-0 pointer-events-none p-0" : "opacity-100"}`}>
        <div className="max-w-xl mx-auto space-y-16">

          {/* Header */}
          <div className="space-y-6 animate-slideUp">
            <div className="inline-block px-4 py-1 border border-amber-500/30 rounded-full">
              <span className="text-amber-500 text-xs font-sans tracking-[0.2em] uppercase">Bespoke Creation</span>
            </div>
            <h2 className="font-serif text-5xl lg:text-7xl leading-tight text-white">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">Golden</span> Era
            </h2>
            <p className="font-sans text-zinc-400 leading-relaxed text-lg font-light">
              A masterpiece of digital craftsmanship. Every facet, every curve has been generated with precision AI to match your vision.
            </p>
          </div>

          {/* Angle Selector */}
          <div className="space-y-6">
            <h3 className="font-sans text-sm text-white/40 uppercase tracking-widest">Select Perspective</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {data.original_images.map((img: any, idx: number) => (
                <div key={idx} className="relative group flex-shrink-0">
                  <button
                    onClick={() => {
                      setCurrentImageIndex(idx);
                      setSelectedJewelryIndex(idx);
                    }}
                    className={`w-24 h-24 border transition-all duration-300 ${currentImageIndex === idx
                      ? "border-amber-500 opacity-100"
                      : "border-white/10 opacity-40 hover:opacity-80 hover:border-white/30"
                      }`}
                  >
                    <img
                      src={decodeImageUrl(img.url)}
                      alt={img.angle}
                      className="w-full h-full object-cover"
                    />
                  </button>
                  {/* Mini Maximize Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openMaximize(img.url);
                    }}
                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-amber-500 hover:text-black"
                    title="Maximize"
                  >
                    <svg className="w-3 h-3 text-white hover:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Sketches */}
          <div className="space-y-6 pt-8 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-sm text-white/40 uppercase tracking-widest">Technical Blueprints</h3>
              <span className="text-xs text-zinc-600 font-mono">ID: {data.session_id?.substring(0, 8)}</span>
            </div>

            <div className="bg-white p-6 relative group cursor-pointer transition-transform hover:scale-[1.02]" onClick={() => openMaximize(data.sketches?.[currentSketchIndex]?.url || data.sketch)}>
              <div className="absolute top-0 left-0 w-full h-1 bg-zinc-200"></div>
              <img
                src={decodeImageUrl(data.sketches?.[currentSketchIndex]?.url || data.sketch)}
                alt="Technical Sketch"
                className="w-full h-64 object-contain mix-blend-multiply opacity-90"
              />
              <div className="absolute bottom-4 right-4 font-mono text-xs text-black/40">
                SCALE 1:1 • DRAFT
              </div>
              {/* Maximize Icon Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5">
                <div className="p-3 bg-white rounded-full shadow-lg">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            </div>

            {data.sketches && data.sketches.length > 0 && (
              <div className="flex gap-2">
                {data.sketches.map((sketch: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSketchIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${currentSketchIndex === idx ? "bg-white w-8" : "bg-white/20 hover:bg-white/40"
                      }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-12 flex flex-col gap-4">
            <button className="w-full py-5 bg-white text-black font-sans font-bold tracking-widest uppercase hover:bg-amber-400 transition-colors">
              Download Assets
            </button>
            <button className="w-full py-5 border border-white/20 text-white font-sans font-bold tracking-widest uppercase hover:bg-white/5 transition-colors">
              Share Design
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
