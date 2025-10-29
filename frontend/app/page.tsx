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
    <main className="min-h-screen bg-gradient-to-br from-white via-amber-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent mb-4">
            AI Jewelry Generator
          </h1>
          <p className="text-gray-600 text-lg">
            Create stunning jewelry designs with AI-powered multi-angle rendering
          </p>
        </header>

        {step === "generate" && (
          <GenerateForm
            onGenerate={(id, imgs) => {
              setSessionId(id);
              setImages(imgs);
              setStep("preview");
            }}
          />
        )}

        {step === "preview" && (
          <div className="space-y-8">
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
          <div>
            <FinalDisplay data={finalData} />
            <div className="text-center mt-8">
              <button
                onClick={() => {
                  setStep("generate");
                  setSessionId("");
                  setImages([]);
                  setFinalData(null);
                }}
                className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg"
              >
                Create New Design
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
