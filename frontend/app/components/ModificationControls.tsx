"use client";

import { useState } from "react";
import axios from "axios";

interface ModificationControlsProps {
  sessionId: string;
  onModify: (images: any[]) => void;
  onFinalize: (data: any) => void;
}

export default function ModificationControls({
  sessionId,
  onModify,
  onFinalize,
}: ModificationControlsProps) {
  const [metal, setMetal] = useState("gold");
  const [gemstone, setGemstone] = useState("ruby");
  const [bandShape, setBandShape] = useState("thin");
  const [customPrompt, setCustomPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleModify = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8000/modify", {
        session_id: sessionId,
        metal,
        gemstone,
        band_shape: bandShape,
        custom_instruction: customPrompt,
      }, {
        timeout: 180000,
      });

      onModify(response.data.images);
      setCustomPrompt(""); // Clear prompt after success
    } catch (error) {
      console.error("Error modifying jewelry:", error);
      alert("Failed to modify jewelry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8000/finalize", {
        session_id: sessionId,
      }, {
        timeout: 180000,
      });

      onFinalize(response.data);
    } catch (error) {
      console.error("Error finalizing jewelry:", error);
      alert("Failed to finalize jewelry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/10 relative overflow-hidden group">
      {/* Glow Effect */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-colors duration-700"></div>

      <h2 className="text-2xl font-serif text-white mb-6 relative z-10">
        Refine Your Masterpiece
      </h2>

      {/* Custom Prompt Input */}
      <div className="mb-8 relative z-10">
        <label className="block text-sm font-sans tracking-widest text-zinc-400 uppercase mb-3">
          Magic Edit
        </label>
        <div className="relative">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Describe changes (e.g., 'Make it rose gold with a sapphire')"
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="w-5 h-5 text-amber-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          AI will attempt to follow your instructions while preserving the design structure.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
        <div>
          <label className="block text-xs font-sans tracking-widest text-zinc-500 uppercase mb-2">
            Metal
          </label>
          <select
            value={metal}
            onChange={(e) => setMetal(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
          >
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
            <option value="rose-gold">Rose Gold</option>
            <option value="platinum">Platinum</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-sans tracking-widest text-zinc-500 uppercase mb-2">
            Gemstone
          </label>
          <select
            value={gemstone}
            onChange={(e) => setGemstone(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
          >
            <option value="ruby">Ruby</option>
            <option value="emerald">Emerald</option>
            <option value="sapphire">Sapphire</option>
            <option value="diamond">Diamond</option>
            <option value="amethyst">Amethyst</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-sans tracking-widest text-zinc-500 uppercase mb-2">
            Band Shape
          </label>
          <select
            value={bandShape}
            onChange={(e) => setBandShape(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
          >
            <option value="thin">Thin</option>
            <option value="thick">Thick</option>
            <option value="curved">Curved</option>
            <option value="braided">Braided</option>
          </select>
        </div>
      </div>

      <div className="flex gap-4 relative z-10">
        <button
          onClick={handleModify}
          disabled={loading}
          className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-sans font-bold tracking-widest uppercase hover:bg-white/10 hover:border-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Refining..." : "Update Design"}
        </button>
        <button
          onClick={handleFinalize}
          disabled={loading}
          className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black rounded-xl font-sans font-bold tracking-widest uppercase hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/20"
        >
          Finalize Design
        </button>
      </div>
    </div>
  );
}
