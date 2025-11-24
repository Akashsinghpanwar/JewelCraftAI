"use client";

import { useEffect, useRef, useState } from "react";

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
  
  // Store tracking instances
  const trackerRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const jewelryImgRef = useRef<HTMLImageElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

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

    const setupAR = async () => {
      try {
        await loadMediaPipe();

        // Load jewelry image
        const img = new Image();
        // Only set crossOrigin for remote URLs, not for data URLs
        if (!jewelryImage.startsWith("data:")) {
          img.crossOrigin = "anonymous";
        }
        img.src = jewelryImage;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = (e) => {
            console.error("Image load error:", e);
            reject(new Error(`Failed to load jewelry image from: ${jewelryImage.substring(0, 100)}...`));
          };
        });
        jewelryImgRef.current = img;

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
        await video.play();

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
        const errorMessage = err instanceof Error ? err.message : "Failed to initialize AR. Please check your camera permissions.";
        setError(errorMessage);
        setIsLoading(false);
      }
    };

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

    const drawFaceJewelry = (canvas: HTMLCanvasElement, results: any) => {
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
    };

    const drawEarrings = (ctx: CanvasRenderingContext2D, landmarks: any[], canvas: HTMLCanvasElement) => {
      if (!jewelryImgRef.current) return;

      const leftEar = landmarks[234];
      const rightEar = landmarks[454];
      const faceWidth = Math.abs(landmarks[234].x - landmarks[454].x) * canvas.width;
      const earringSize = faceWidth * 0.12;

      // Draw left earring
      if (leftEar) {
        const x = leftEar.x * canvas.width;
        const y = leftEar.y * canvas.height;
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.drawImage(jewelryImgRef.current, x - earringSize / 2, y - earringSize * 0.2, earringSize, earringSize);
        ctx.restore();
      }

      // Draw right earring
      if (rightEar) {
        const x = rightEar.x * canvas.width;
        const y = rightEar.y * canvas.height;
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.drawImage(jewelryImgRef.current, x - earringSize / 2, y - earringSize * 0.2, earringSize, earringSize);
        ctx.restore();
      }
    };

    const drawNecklace = (ctx: CanvasRenderingContext2D, landmarks: any[], canvas: HTMLCanvasElement) => {
      if (!jewelryImgRef.current) return;

      const chin = landmarks[152];
      const leftJaw = landmarks[234];
      const rightJaw = landmarks[454];

      if (!chin || !leftJaw || !rightJaw) return;

      const faceWidth = Math.abs(leftJaw.x - rightJaw.x) * canvas.width;
      const necklaceWidth = faceWidth * 1.2;
      const necklaceHeight = necklaceWidth * 0.4;

      const x = chin.x * canvas.width;
      const y = chin.y * canvas.height + faceWidth * 0.15;

      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.drawImage(jewelryImgRef.current, x - necklaceWidth / 2, y - necklaceHeight / 2, necklaceWidth, necklaceHeight);
      ctx.restore();
    };

    const drawHandJewelry = (canvas: HTMLCanvasElement, results: any) => {
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
    };

    const drawRing = (ctx: CanvasRenderingContext2D, landmarks: any[], canvas: HTMLCanvasElement) => {
      if (!jewelryImgRef.current) return;

      const ringFingerBase = landmarks[14];
      if (!ringFingerBase) return;

      const wrist = landmarks[0];
      const handSize = Math.abs(wrist.y - landmarks[12].y) * canvas.height;
      const ringSize = handSize * 0.08;

      const x = ringFingerBase.x * canvas.width;
      const y = ringFingerBase.y * canvas.height;

      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.drawImage(jewelryImgRef.current, x - ringSize / 2, y - ringSize / 2, ringSize, ringSize);
      ctx.restore();
    };

    const drawBracelet = (ctx: CanvasRenderingContext2D, landmarks: any[], canvas: HTMLCanvasElement) => {
      if (!jewelryImgRef.current) return;

      const wrist = landmarks[0];
      if (!wrist) return;

      const handWidth = Math.abs(landmarks[5].x - landmarks[17].x) * canvas.width;
      const braceletWidth = handWidth * 1.3;
      const braceletHeight = braceletWidth * 0.3;

      const x = wrist.x * canvas.width;
      const y = wrist.y * canvas.height;

      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.drawImage(jewelryImgRef.current, x - braceletWidth / 2, y - braceletHeight / 2, braceletWidth, braceletHeight);
      ctx.restore();
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
  }, [jewelryImage, jewelryType]);

  return (
    <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden">
      <video ref={videoRef} className="hidden" playsInline muted />
      
      <canvas ref={canvasRef} className="w-full h-full object-contain" />
      
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
}
