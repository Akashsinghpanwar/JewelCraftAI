"use client";

import { useState } from "react";
import GenerateForm from "./components/GenerateForm";
import GalleryView from "./components/GalleryView";
import ModificationControls from "./components/ModificationControls";
import FinalDisplay from "./components/FinalDisplay";

export default function Home() {
  const [step, setStep] = useState<"generate" | "preview" | "finalize">("generate");
  const [sessionId, setSessionId] = useState<string>("");
  const [images, setImages] = useState<any[]>([]);
  const [finalData, setFinalData] = useState<any>(null);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 relative overflow-hidden">
      {/* Animated background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-amber-200/30 to-orange-300/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-pink-200/30 to-purple-300/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <header className="text-center mb-12 animate-fadeIn">
          <div className="inline-block mb-4 px-6 py-2 bg-white/80 backdrop-blur-sm rounded-full border-2 border-amber-300/50 shadow-lg">
            <span className="text-amber-600 font-semibold text-sm tracking-wider">✨ AI-POWERED DESIGN ✨</span>
          </div>
          <h1 className="text-7xl font-extrabold bg-gradient-to-r from-amber-600 via-orange-500 to-pink-500 bg-clip-text text-transparent mb-4 drop-shadow-lg">
            Jewelry Designer AI
          </h1>
          <p className="text-gray-700 text-xl max-w-2xl mx-auto font-light">
            Transform your ideas into stunning 3D jewelry designs with our advanced AI technology
          </p>
        </header>

        {step === "generate" && (
          <div className="animate-slideUp">
            <GenerateForm
              onGenerate={(id, imgs) => {
                setSessionId(id);
                setImages(imgs);
                setStep("preview");
              }}
            />
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-8 animate-slideUp">
            {/* Back button */}
            <button
              onClick={() => setStep("generate")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-full hover:bg-white transition-all shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Design
            </button>
            
            <GalleryView images={images} />
            <ModificationControls
              sessionId={sessionId}
              onModify={(imgs) => setImages(imgs)}
              onFinalize={(data) => {
                setFinalData(data);
                setStep("finalize");
              }}
            />
          </div>
        )}

        {step === "finalize" && finalData && (
          <div className="animate-slideUp">
            {/* Back button */}
            <button
              onClick={() => setStep("preview")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-full hover:bg-white transition-all shadow-md hover:shadow-lg mb-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Gallery
            </button>

            <FinalDisplay data={finalData} />
            
            <div className="text-center mt-12">
              <button
                onClick={() => {
                  setStep("generate");
                  setSessionId("");
                  setImages([]);
                  setFinalData(null);
                }}
                className="px-10 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white rounded-full font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all shadow-xl"
              >
                🎨 Create New Design
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.6s ease-out;
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </main>
  );
}
