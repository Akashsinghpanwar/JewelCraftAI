"use client";

import { useState } from "react";
import axios from "axios";

interface GenerateFormProps {
  onGenerate: (sessionId: string, images: any[]) => void;
}

export default function GenerateForm({ onGenerate }: GenerateFormProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post("/api/generate", {
        prompt: prompt.trim(),
      }, {
        timeout: 180000, // 3 minutes timeout for image generation
      });

      onGenerate(response.data.session_id, response.data.images);
    } catch (error) {
      console.error("Error generating jewelry:", error);
      alert("Failed to generate jewelry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-10 border-2 border-amber-200/50 hover:border-amber-300/70 transition-all">
        <div className="text-center mb-6">
          <div className="inline-block p-3 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl mb-4">
            <svg className="w-12 h-12 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
            Describe Your Dream Jewelry
          </h2>
          <p className="text-gray-500 text-sm">Tell us what you imagine, and we'll bring it to life</p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., ruby crown ring, diamond necklace, sapphire earrings..."
              className="w-full px-7 py-5 border-2 border-amber-200 rounded-2xl focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 text-lg transition-all placeholder:text-gray-400"
              onKeyPress={(e) => e.key === "Enter" && handleGenerate()}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full py-5 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all shadow-xl relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Your Design...
                </>
              ) : (
                <>
                  ✨ Generate Design
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </div>

        {loading && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-amber-50 rounded-full border border-amber-200">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce delay-200"></div>
              </div>
              <span className="text-sm text-gray-600 font-medium">AI is crafting your jewelry...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
