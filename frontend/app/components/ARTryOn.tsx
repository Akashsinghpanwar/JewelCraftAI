"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ARTryOnProps {
  jewelryImage: string;
  jewelryType: "necklace" | "earrings" | "ring" | "bracelet";
}

declare global {
  interface Window {
    FaceMesh: any;
    Hands: any;
    Camera: any;
  }
}

export default function ARTryOn({ jewelryImage, jewelryType }: ARTryOnProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Store tracking instances
  const trackerRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const jewelryImgRef = useRef<HTMLImageElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Store previous states for smoothing
  const prevNecklaceRef = useRef({ x: 0, y: 0, w: 0, h: 0, rot: 0 });
  const prevEarringsRef = useRef({ left: { x: 0, y: 0, s: 0 }, right: { x: 0, y: 0, s: 0 } });
  const prevRingRef = useRef({ x: 0, y: 0, s: 0 });
  const prevBraceletRef = useRef({ x: 0, y: 0, w: 0, h: 0, rot: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load jewelry image separately (doesn't restart camera)
  useEffect(() => {
    const loadImage = async (url: string, retries = 3): Promise<HTMLImageElement> => {
      const cleanUrl = url.replace(/&amp;/g, '&');

      for (let i = 0; i < retries; i++) {
        try {
          const img = new Image();
          if (!cleanUrl.startsWith("data:")) {
            img.crossOrigin = "anonymous";
          }

          await new Promise<void>((resolve, reject) => {
            let timeoutId: NodeJS.Timeout;
            let resolved = false;

            img.onload = () => {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeoutId);
                resolve();
              }
            };

            img.onerror = (e) => {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeoutId);
                console.error(`Image load failed (attempt ${i + 1}/${retries}):`, cleanUrl.substring(0, 100) + '...');
                reject(new Error("Image load failed"));
              }
            };

            img.src = cleanUrl;

            const timeout = cleanUrl.startsWith("data:") ? 30000 : 10000;
            timeoutId = setTimeout(() => {
              if (!resolved) {
                resolved = true;
                console.error(`Image load timeout after ${timeout / 1000}s (attempt ${i + 1}/${retries})`);
                reject(new Error("Image load timeout"));
              }
            }, timeout);
          });

          return img;
        } catch (err) {
          if (i === retries - 1) {
            console.error('All image load attempts failed for:', cleanUrl.substring(0, 100) + '...');
            throw err;
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
      throw new Error("Failed to load image after retries");
    };

    loadImage(jewelryImage)
      .then(img => {
        jewelryImgRef.current = img;
      })
      .catch(err => {
        console.error("Failed to load jewelry image:", err);
        setError("Could not load jewelry image. Please try selecting a different view.");
      });
  }, [jewelryImage]);

  // Setup AR camera and tracking (runs once)
  useEffect(() => {
    let isMounted = true;

    // Physics-based smoothing
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

    // Load MediaPipe scripts with proper load event handling
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Check if script already exists and is loaded
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.crossOrigin = "anonymous";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });
    };

    const loadMediaPipe = async () => {
      if (typeof window === "undefined") return;

      try {
        // Load core MediaPipe utilities
        await Promise.all([
          loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"),
          loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js"),
          loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"),
        ]);

        // Load jewelry-type-specific module
        if (jewelryType === "necklace" || jewelryType === "earrings") {
          await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js");
        } else {
          await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");
        }

        // Wait a bit for modules to be registered on window object
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        throw new Error(`MediaPipe loading failed: ${error}`);
      }
    };

    function drawFaceJewelry(canvas: HTMLCanvasElement, results: any) {
      const ctx = canvas.getContext("2d");
      if (!ctx || !jewelryImgRef.current) return;

      // Clear and draw video frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (videoRef.current) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      }

      if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;

      const landmarks = results.multiFaceLandmarks[0];

      if (jewelryType === "earrings") {
        drawEarrings(ctx, landmarks, canvas);
      } else if (jewelryType === "necklace") {
        drawNecklace(ctx, landmarks, canvas);
      }
    }

    function drawNecklace(ctx: CanvasRenderingContext2D, landmarks: any[], canvas: HTMLCanvasElement) {
      if (!jewelryImgRef.current) return;

      const chin = landmarks[152];
      const leftJaw = landmarks[234];
      const rightJaw = landmarks[454];

      if (!chin || !leftJaw || !rightJaw) return;

      // Calculate dimensions
      const faceWidth = Math.abs(leftJaw.x - rightJaw.x) * canvas.width;
      const targetW = faceWidth * 1.4; // Slightly wider than face
      const targetH = targetW * 0.8; // Aspect ratio of necklace

      // Calculate position (lower on neck)
      const targetX = chin.x * canvas.width;
      const targetY = (chin.y * canvas.height) + (faceWidth * 0.45);

      // Calculate rotation (roll) based on jawline tilt
      const dy = rightJaw.y - leftJaw.y;
      const dx = rightJaw.x - leftJaw.x;
      const targetRot = Math.atan2(dy, dx);

      // Apply smoothing (Lerp)
      const smoothFactor = 0.2;
      const prev = prevNecklaceRef.current;

      // Initialize if first frame
      if (prev.w === 0) {
        prev.x = targetX;
        prev.y = targetY;
        prev.w = targetW;
        prev.h = targetH;
        prev.rot = targetRot;
      }

      const x = lerp(prev.x, targetX, smoothFactor);
      const y = lerp(prev.y, targetY, smoothFactor);
      const w = lerp(prev.w, targetW, smoothFactor);
      const h = lerp(prev.h, targetH, smoothFactor);
      const rot = lerp(prev.rot, targetRot, smoothFactor);

      // Update ref
      prevNecklaceRef.current = { x, y, w, h, rot };

      ctx.save();

      // Add realistic drop shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 10;

      // Apply transformations
      ctx.translate(x, y);
      ctx.rotate(rot);

      // Draw image centered
      ctx.globalAlpha = 0.95;
      ctx.drawImage(jewelryImgRef.current, -w / 2, -h / 2, w, h);

      ctx.restore();
    }

    function drawEarrings(ctx: CanvasRenderingContext2D, landmarks: any[], canvas: HTMLCanvasElement) {
      if (!jewelryImgRef.current) return;

      const leftEar = landmarks[234];
      const rightEar = landmarks[454];
      const faceWidth = Math.abs(landmarks[234].x - landmarks[454].x) * canvas.width;
      const targetSize = faceWidth * 0.15;
      const smoothFactor = 0.2;

      const prev = prevEarringsRef.current;

      // Draw left earring
      if (leftEar) {
        const targetX = leftEar.x * canvas.width;
        const targetY = leftEar.y * canvas.height + (targetSize * 0.5); // Hang below ear

        if (prev.left.s === 0) { prev.left = { x: targetX, y: targetY, s: targetSize }; }

        const x = lerp(prev.left.x, targetX, smoothFactor);
        const y = lerp(prev.left.y, targetY, smoothFactor);
        const s = lerp(prev.left.s, targetSize, smoothFactor);
        prev.left = { x, y, s };

        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 2;
        ctx.drawImage(jewelryImgRef.current, x - s / 2, y, s, s);
        ctx.restore();
      }

      // Draw right earring
      if (rightEar) {
        const targetX = rightEar.x * canvas.width;
        const targetY = rightEar.y * canvas.height + (targetSize * 0.5);

        if (prev.right.s === 0) { prev.right = { x: targetX, y: targetY, s: targetSize }; }

        const x = lerp(prev.right.x, targetX, smoothFactor);
        const y = lerp(prev.right.y, targetY, smoothFactor);
        const s = lerp(prev.right.s, targetSize, smoothFactor);
        prev.right = { x, y, s };

        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 2;
        ctx.drawImage(jewelryImgRef.current, x - s / 2, y, s, s);
        ctx.restore();
      }
    }

    function drawHandJewelry(canvas: HTMLCanvasElement, results: any) {
      const ctx = canvas.getContext("2d");
      if (!ctx || !jewelryImgRef.current) return;

      // Clear and draw video frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (videoRef.current) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      }

      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) return;

      results.multiHandLandmarks.forEach((landmarks: any[]) => {
        if (jewelryType === "ring") {
          drawRing(ctx, landmarks, canvas);
        } else if (jewelryType === "bracelet") {
          drawBracelet(ctx, landmarks, canvas);
        }
      });
    }

    function drawRing(ctx: CanvasRenderingContext2D, landmarks: any[], canvas: HTMLCanvasElement) {
      if (!jewelryImgRef.current) return;

      const ringFingerBase = landmarks[14]; // MCP
      const ringFingerPip = landmarks[13]; // PIP
      if (!ringFingerBase || !ringFingerPip) return;

      const wrist = landmarks[0];
      const handSize = Math.abs(wrist.y - landmarks[12].y) * canvas.height;
      const targetSize = handSize * 0.12;

      // Calculate rotation based on finger direction
      const dy = ringFingerBase.y - ringFingerPip.y;
      const dx = ringFingerBase.x - ringFingerPip.x;
      const targetRot = Math.atan2(dy, dx) + Math.PI / 2;

      const targetX = ringFingerBase.x * canvas.width;
      const targetY = ringFingerBase.y * canvas.height;

      const smoothFactor = 0.3;
      const prev = prevRingRef.current;

      if (prev.s === 0) { prev.x = targetX; prev.y = targetY; prev.s = targetSize; }

      const x = lerp(prev.x, targetX, smoothFactor);
      const y = lerp(prev.y, targetY, smoothFactor);
      const s = lerp(prev.s, targetSize, smoothFactor);
      prev.x = x; prev.y = y; prev.s = s;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(targetRot);
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 4;
      ctx.drawImage(jewelryImgRef.current, -s / 2, -s / 2, s, s);
      ctx.restore();
    }

    function drawBracelet(ctx: CanvasRenderingContext2D, landmarks: any[], canvas: HTMLCanvasElement) {
      if (!jewelryImgRef.current) return;

      const wrist = landmarks[0];
      const indexBase = landmarks[5];
      const pinkyBase = landmarks[17];

      if (!wrist || !indexBase || !pinkyBase) return;

      const handWidth = Math.abs(indexBase.x - pinkyBase.x) * canvas.width;
      const targetW = handWidth * 1.8;
      const targetH = targetW * 0.4;

      // Calculate rotation based on wrist-to-middle-finger
      const middleFinger = landmarks[9];
      const dy = middleFinger.y - wrist.y;
      const dx = middleFinger.x - wrist.x;
      const targetRot = Math.atan2(dy, dx) + Math.PI / 2;

      const targetX = wrist.x * canvas.width;
      const targetY = wrist.y * canvas.height;

      const smoothFactor = 0.2;
      const prev = prevBraceletRef.current;

      if (prev.w === 0) { prev.x = targetX; prev.y = targetY; prev.w = targetW; prev.h = targetH; prev.rot = targetRot; }

      const x = lerp(prev.x, targetX, smoothFactor);
      const y = lerp(prev.y, targetY, smoothFactor);
      const w = lerp(prev.w, targetW, smoothFactor);
      const h = lerp(prev.h, targetH, smoothFactor);
      const rot = lerp(prev.rot, targetRot, smoothFactor);

      prevBraceletRef.current = { x, y, w, h, rot };

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 8;
      ctx.drawImage(jewelryImgRef.current, -w / 2, -h / 2, w, h);
      ctx.restore();
    }

    const setupFaceTracking = async (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      const FaceMesh = (window as any).FaceMesh;
      const Camera = (window as any).Camera;

      if (!FaceMesh || !Camera) {
        throw new Error("MediaPipe FaceMesh not loaded");
      }

      const faceMesh = new FaceMesh({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults((results: any) => {
        if (!isMounted) return;
        drawFaceJewelry(canvas, results);
      });

      trackerRef.current = faceMesh;

      // Start camera
      const camera = new Camera(video, {
        onFrame: async () => {
          if (trackerRef.current && isMounted) {
            await trackerRef.current.send({ image: video });
          }
        },
        width: 1280,
        height: 720,
      });

      await camera.start();
      cameraRef.current = camera;
    };

    const setupHandTracking = async (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      const Hands = (window as any).Hands;
      const Camera = (window as any).Camera;

      if (!Hands || !Camera) {
        throw new Error("MediaPipe Hands not loaded");
      }

      const hands = new Hands({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      hands.onResults((results: any) => {
        if (!isMounted) return;
        drawHandJewelry(canvas, results);
      });

      trackerRef.current = hands;

      // Start camera
      const camera = new Camera(video, {
        onFrame: async () => {
          if (trackerRef.current && isMounted) {
            await trackerRef.current.send({ image: video });
          }
        },
        width: 1280,
        height: 720,
      });

      await camera.start();
      cameraRef.current = camera;
    };

    const setupAR = async () => {
      try {
        await loadMediaPipe();

        // Setup camera
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) {
          throw new Error("Video or canvas element not found");
        }

        // Request camera access
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            },
          });
        } catch (cameraErr: any) {
          if (cameraErr.name === "NotAllowedError" || cameraErr.name === "PermissionDeniedError") {
            throw new Error("Camera access denied. Please allow camera permissions in your browser settings.");
          } else if (cameraErr.name === "NotFoundError") {
            throw new Error("No camera found. Please connect a camera and try again.");
          } else if (cameraErr.name === "NotReadableError") {
            throw new Error("Camera is already in use by another application.");
          } else {
            throw new Error(`Camera access failed: ${cameraErr.message || "Unknown error"}`);
          }
        }

        video.srcObject = stream;

        // Handle video play safely
        try {
          await video.play();
        } catch (playErr: any) {
          // Ignore abort errors caused by new load requests
          if (playErr.name !== "AbortError") {
            throw playErr;
          }
          console.log("Video play interrupted (safe to ignore)");
        }

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        if (!isMounted) return;

        // Initialize tracking based on jewelry type
        if (jewelryType === "necklace" || jewelryType === "earrings") {
          await setupFaceTracking(video, canvas);
        } else if (jewelryType === "ring" || jewelryType === "bracelet") {
          await setupHandTracking(video, canvas);
        }

        setIsLoading(false);
        setIsTracking(true);
      } catch (err) {
        console.error("AR setup error:", err);
        let errorMessage = "Failed to initialize AR.";

        if (err instanceof Error) {
          if (err.message.includes("Camera")) {
            errorMessage = err.message;
          } else if (err.message.includes("MediaPipe")) {
            errorMessage = "Failed to load AR tracking library. Please refresh the page and try again.";
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
        setIsLoading(false);
      }
    };

    setupAR();

    return () => {
      isMounted = false;

      // Cancel any pending animation frames
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Stop MediaPipe camera
      if (cameraRef.current) {
        try {
          if (typeof cameraRef.current.stop === "function") {
            cameraRef.current.stop();
          }
        } catch (err) {
          console.warn("Error stopping MediaPipe camera:", err);
        }
      }

      // Close MediaPipe trackers
      if (trackerRef.current) {
        try {
          if (typeof trackerRef.current.close === "function") {
            trackerRef.current.close();
          }
        } catch (err) {
          console.warn("Error closing MediaPipe tracker:", err);
        }
      }

      // Stop all media streams and tracks
      if (videoRef.current) {
        try {
          // Pause video
          if (!videoRef.current.paused) {
            videoRef.current.pause();
          }

          // Stop all tracks from the media stream
          const stream = videoRef.current.srcObject as MediaStream | null;
          if (stream) {
            stream.getTracks().forEach((track) => {
              track.stop();
            });
            videoRef.current.srcObject = null;
          }
        } catch (err) {
          console.warn("Error stopping video stream:", err);
        }
      }

      // Clear refs
      cameraRef.current = null;
      trackerRef.current = null;
      jewelryImgRef.current = null;
    };
  }, [jewelryType, isFullscreen]); // Re-run when fullscreen toggles to re-attach stream to new video element


  const content = (
    <div className={`relative w-full h-full bg-black overflow-hidden ${isFullscreen ? 'fixed inset-0 z-[9999]' : 'rounded-2xl'}`}>
      <video ref={videoRef} className="hidden" playsInline muted />

      <canvas ref={canvasRef} className="w-full h-full object-contain" />

      {/* Fullscreen Toggle */}
      <button
        onClick={() => setIsFullscreen(!isFullscreen)}
        className="absolute top-4 left-4 z-50 bg-white/20 hover:bg-white/30 backdrop-blur-md p-2 rounded-full text-white transition-all shadow-lg"
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      >
        {isFullscreen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
        )}
      </button>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-900/80 to-amber-700/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
            <p className="text-white font-semibold">Initializing AR Try-On...</p>
            <p className="text-white/80 text-sm mt-2">Please allow camera access</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-900/80 to-red-700/80 backdrop-blur-sm">
          <div className="text-center px-6">
            <div className="text-red-100 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-white font-semibold mb-2">Camera Access Required</p>
            <p className="text-white/80 text-sm">{error}</p>
          </div>
        </div>
      )}

      {isTracking && !error && !isLoading && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-green-500/90 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>Tracking Active</span>
        </div>
      )}

      {isTracking && !error && !isLoading && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-6 py-3 rounded-full text-sm backdrop-blur-sm">
          {jewelryType === "earrings" && "Face the camera to try on earrings"}
          {jewelryType === "necklace" && "Keep your face and neck visible"}
          {jewelryType === "ring" && "Show your hand to the camera"}
          {jewelryType === "bracelet" && "Show your wrist to the camera"}
        </div>
      )}
    </div>
  );

  if (isFullscreen && mounted) {
    return (
      <>
        <div className="w-full h-full bg-black/50 flex items-center justify-center rounded-2xl border-2 border-amber-500/30">
          <p className="text-amber-200/70 font-medium">Active in Fullscreen</p>
        </div>
        {createPortal(content, document.body)}
      </>
    );
  }

  return content;
}
