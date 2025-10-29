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
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl p-8 border border-amber-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Describe Your Dream Jewelry
        </h2>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., ruby crown ring, diamond necklace, sapphire earrings..."
          className="w-full px-6 py-4 border-2 border-amber-300 rounded-2xl focus:outline-none focus:border-amber-500 text-lg mb-6"
          onKeyPress={(e) => e.key === "Enter" && handleGenerate()}
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-semibold text-lg hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          {loading ? "Generating..." : "Generate Design"}
        </button>
      </div>
    </div>
  );
}
