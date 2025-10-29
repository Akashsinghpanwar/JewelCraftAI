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
  const [loading, setLoading] = useState(false);

  const handleModify = async () => {
    setLoading(true);
    try {
      const response = await axios.post("/api/modify", {
        session_id: sessionId,
        metal,
        gemstone,
        band_shape: bandShape,
      });

      onModify(response.data.images);
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
      const response = await axios.post("/api/finalize", {
        session_id: sessionId,
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
    <div className="bg-white rounded-3xl shadow-2xl p-8 border border-amber-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Customize Your Design
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Metal Type
          </label>
          <select
            value={metal}
            onChange={(e) => setMetal(e.target.value)}
            className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:outline-none focus:border-amber-500"
          >
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
            <option value="rose-gold">Rose Gold</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gemstone
          </label>
          <select
            value={gemstone}
            onChange={(e) => setGemstone(e.target.value)}
            className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:outline-none focus:border-amber-500"
          >
            <option value="ruby">Ruby</option>
            <option value="emerald">Emerald</option>
            <option value="sapphire">Sapphire</option>
            <option value="diamond">Diamond</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Band Shape
          </label>
          <select
            value={bandShape}
            onChange={(e) => setBandShape(e.target.value)}
            className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:outline-none focus:border-amber-500"
          >
            <option value="thin">Thin</option>
            <option value="thick">Thick</option>
            <option value="curved">Curved</option>
          </select>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleModify}
          disabled={loading}
          className="flex-1 py-3 bg-amber-100 text-amber-700 rounded-xl font-semibold hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Updating..." : "Update Design"}
        </button>
        <button
          onClick={handleFinalize}
          disabled={loading}
          className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          Finalize Design
        </button>
      </div>
    </div>
  );
}
