"use client";

import { useState } from "react";
import CreationWizard from "./components/CreationWizard";
import GalleryView from "./components/GalleryView";
import ModificationControls from "./components/ModificationControls";
import FinalDisplay from "./components/FinalDisplay";
import SpaceScene from "./components/SpaceScene";

export default function Home() {
  const [step, setStep] = useState<"generate" | "preview" | "finalize">("generate");
  const [sessionId, setSessionId] = useState<string>("");
  const [images, setImages] = useState<any[]>([]);
  const [finalData, setFinalData] = useState<any>(null);

  const handleModification = (imgs: any[]) => {
    setImages(imgs);
  };

  const handleFinalize = (data: any) => {
    setFinalData(data);
    setStep("finalize");
  };

  return (
    <main className="bg-black text-white selection:bg-amber-500/30 font-sans min-h-screen overflow-x-hidden w-full">
      {/* Global Background Noise Texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

      {step === "generate" && (
        <section className="h-screen w-full relative flex flex-col items-center justify-center overflow-hidden">
          {/* Cosmic background */}
          <div className="absolute inset-0 z-0">
            <SpaceScene />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/85 pointer-events-none" />
          </div>

          <div className="relative z-10 w-full px-6 flex flex-col items-center justify-center h-full">
            <header className="text-center mb-12 animate-fadeIn flex flex-col items-center">
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm tracking-[0.5em] text-amber-300/80 uppercase">Cosmic Atelier</p>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif tracking-[0.2em] text-white drop-shadow-[0_0_25px_rgba(0,220,255,0.25)]">
                  BlinK N blinG
                </h1>
                <p className="text-lg text-white/70 max-w-2xl">Launch exquisite designs from a stellar canvas—generate, refine, and finalize your signature piece.</p>
              </div>
            </header>

            <CreationWizard
              onGenerate={(id, imgs) => {
                setSessionId(id);
                setImages(imgs);
                setStep("preview");
              }}
            />
          </div>
        </section>
      )}

      {step === "preview" && (
        <section className="min-h-screen w-full bg-zinc-950 relative py-20 animate-fadeIn overflow-hidden">
          {/* Starfall Background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute top-0 w-[2px] h-[150px] bg-gradient-to-b from-transparent via-amber-200 to-transparent opacity-0 animate-starfall"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${3 + Math.random() * 4}s`,
                }}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900/90 to-black"></div>
          </div>

          <div className="relative z-10 w-full h-full px-6 md:px-12 flex flex-col">
            <header className="flex items-center justify-between mb-12">
              <h2 className="font-serif text-4xl md:text-5xl text-white">Curated Selection</h2>
              <button
                onClick={() => setStep("generate")}
                className="group flex items-center gap-3 text-zinc-400 hover:text-white transition-colors"
              >
                <span className="font-sans text-sm tracking-widest uppercase">Back to Studio</span>
                <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </header>

            <div className="flex flex-col md:flex-row gap-12 items-start">
              {/* Left: Gallery */}
              <div className="w-full md:w-2/3 animate-slideRight">
                <GalleryView images={images} />
              </div>

              {/* Right: Controls */}
              <div className="w-full md:w-1/3 animate-slideLeft sticky top-24">
                <ModificationControls
                  sessionId={sessionId}
                  onModify={handleModification}
                  onFinalize={handleFinalize}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {step === "finalize" && finalData && (
        <section className="h-screen w-full bg-black overflow-hidden animate-fadeIn">
          <FinalDisplay data={finalData} />

          {/* Floating Back Button */}
          <div className="fixed top-8 left-8 z-50">
            <button
              onClick={() => setStep("preview")}
              className="group flex items-center gap-3 text-white/50 hover:text-white transition-colors bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 hover:border-white/30"
            >
              <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-sans text-xs tracking-widest uppercase">Back</span>
            </button>
          </div>

          {/* Floating New Design Button */}
          <div className="fixed top-8 right-8 z-50">
            <button
              onClick={() => {
                setStep("generate");
                setSessionId("");
                setImages([]);
                setFinalData(null);
              }}
              className="group flex items-center gap-3 text-amber-400 hover:text-amber-300 transition-colors bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-amber-500/20 hover:border-amber-500/50"
            >
              <span className="font-sans text-xs tracking-widest uppercase">New Design</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
