"use client";

import { useState, useRef, useEffect } from "react";

interface CreationWizardProps {
    onGenerate: (sessionId: string, images: any[]) => void;
}

export default function CreationWizard({ onGenerate }: CreationWizardProps) {
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || isGenerating) return;

        setIsGenerating(true);
        try {
            const response = await fetch("http://localhost:8000/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) throw new Error("Generation failed");

            const data = await response.json();
            onGenerate(data.session_id, data.images);
        } catch (error) {
            console.error("Error:", error);
            setIsGenerating(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto px-6">
            <form onSubmit={handleSubmit} className="relative">
                <div className="relative group">
                    <input
                        ref={inputRef}
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe your dream jewelry..."
                        className="w-full bg-transparent border-b-2 border-white/20 text-4xl md:text-6xl font-serif text-white placeholder-white/20 py-8 focus:outline-none focus:border-amber-500 transition-all duration-500"
                        disabled={isGenerating}
                    />
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-700"></div>
                </div>

                <div className="mt-12 flex items-center justify-between opacity-0 animate-fadeIn" style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}>
                    <div className="flex gap-4 text-white/40 text-sm font-sans tracking-widest uppercase">
                        <span>Try:</span>
                        <button type="button" onClick={() => setPrompt("Gold necklace with ruby pendant")} className="hover:text-amber-400 transition-colors">Ruby Necklace</button>
                        <button type="button" onClick={() => setPrompt("Diamond engagement ring platinum")} className="hover:text-amber-400 transition-colors">Diamond Ring</button>
                        <button type="button" onClick={() => setPrompt("Emerald earrings vintage style")} className="hover:text-amber-400 transition-colors">Emerald Earrings</button>
                    </div>

                    <button
                        type="submit"
                        disabled={!prompt.trim() || isGenerating}
                        className={`group flex items-center gap-4 px-8 py-4 rounded-full transition-all duration-500 ${prompt.trim() ? "bg-white text-black hover:bg-amber-400" : "bg-white/10 text-white/30 cursor-not-allowed"
                            }`}
                    >
                        <span className="font-sans font-bold tracking-widest uppercase text-sm">
                            {isGenerating ? "Crafting..." : "Begin Creation"}
                        </span>
                        {isGenerating ? (
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        )}
                    </button>
                </div>

                {isGenerating && (
                    <div className="mt-10 flex items-center gap-4 text-amber-200/90">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-full border border-cyan-300/40 animate-ping" />
                            <div className="absolute inset-2 rounded-full border border-amber-400/70 animate-spin [animation-duration:3s]" />
                            <div className="absolute inset-4 rounded-full bg-cyan-300/20 blur-md animate-pulse" />
                            <div className="absolute inset-5 rounded-full bg-amber-400/50" />
                        </div>
                        <div className="flex flex-col">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">AI ignition</p>
                            <p className="text-sm text-white/60">Warping through ideas to form your design...</p>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
