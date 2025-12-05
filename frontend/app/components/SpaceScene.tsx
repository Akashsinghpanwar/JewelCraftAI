"use client";

import { useEffect, useRef, useState } from "react";

type SpaceSceneProps = {
  autoStopMs?: number;
};

// Animated deep-space backdrop with blurred sun/orbit, loader trail, and comet tails
export default function SpaceScene({ autoStopMs = 3000 }: SpaceSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isLoadingRef = useRef(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx: CanvasRenderingContext2D = context;

    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let loadingAngle = 0;

    const stars: Star[] = [];
    const cometTrail: CometParticle[] = [];
    const mouse = { x: undefined as number | undefined, y: undefined as number | undefined };
    let solarSystem: SolarSystem;

    function resize() {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initWorld();
    }

    function initWorld() {
      stars.length = 0;
      const numberOfStars = Math.max(80, Math.floor((width * height) / 8000));
      for (let i = 0; i < numberOfStars; i++) {
        stars.push(new Star());
      }
    }

    class SolarSystem {
      sunRadius = 40;
      earthDist = 200;
      earthAngle = 0;
      moonDist = 40;
      moonAngle = 0;

      update() {
        this.earthAngle += 0.005;
        this.moonAngle += 0.05;
      }

      draw() {
        const cx = width / 2;
        const cy = height / 2;

        ctx.save();
        ctx.filter = "blur(0.6px)";

        // Orbit line
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.arc(cx, cy, this.earthDist, 0, Math.PI * 2);
        ctx.stroke();

        // Sun glow
        const sunGlow = ctx.createRadialGradient(
          cx,
          cy,
          this.sunRadius * 0.5,
          cx,
          cy,
          this.sunRadius * 3
        );
        sunGlow.addColorStop(0, "rgba(255, 200, 50, 0.8)");
        sunGlow.addColorStop(0.4, "rgba(255, 100, 0, 0.2)");
        sunGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, this.sunRadius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Sun core
        ctx.fillStyle = "#ffaa00";
        ctx.beginPath();
        ctx.arc(cx, cy, this.sunRadius, 0, Math.PI * 2);
        ctx.fill();

        // Earth position
        const ex = cx + Math.cos(this.earthAngle) * this.earthDist;
        const ey = cy + Math.sin(this.earthAngle) * this.earthDist;

        ctx.restore();

        // Earth + shadow
        ctx.save();
        ctx.translate(ex, ey);
        ctx.beginPath();
        ctx.fillStyle = "#1a75ff";
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = "#2d8f3e";
        ctx.arc(-3, -2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.rotate(this.earthAngle);
        ctx.beginPath();
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.arc(0, 0, 12, Math.PI / 2, Math.PI * 1.5, false);
        ctx.fill();
        ctx.restore();

        // Moon
        const mx = ex + Math.cos(this.moonAngle) * this.moonDist;
        const my = ey + Math.sin(this.moonAngle) * this.moonDist;
        ctx.beginPath();
        ctx.fillStyle = "#cccccc";
        ctx.arc(mx, my, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    class Star {
      x = Math.random() * width;
      y = Math.random() * height;
      size = Math.random() * 2;
      baseX = this.x;
      baseY = this.y;
      density = Math.random() * 30 + 1;
      blinkSpeed = Math.random() * 0.05;
      alpha = Math.random();

      update() {
        this.alpha += this.blinkSpeed;
        if (this.alpha > 1 || this.alpha < 0.2) this.blinkSpeed *= -1;

        const dx = (mouse.x ?? 0) - this.x;
        const dy = (mouse.y ?? 0) - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 150;

        if (mouse.x !== undefined && mouse.y !== undefined && distance < maxDistance) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (maxDistance - distance) / maxDistance;
          const directionX = forceDirectionX * force * this.density;
          const directionY = forceDirectionY * force * this.density;
          this.x -= directionX;
          this.y -= directionY;
        } else {
          if (this.x !== this.baseX) {
            const delta = this.x - this.baseX;
            this.x -= delta / 20;
          }
          if (this.y !== this.baseY) {
            const delta = this.y - this.baseY;
            this.y -= delta / 20;
          }
        }
      }

      draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    class CometParticle {
      x: number;
      y: number;
      size = Math.random() * 4 + 1;
      speedX = Math.random() * 2 - 1;
      speedY = Math.random() * 2 - 1;
      life = 1;
      color = `hsl(${170 + Math.random() * 40}, 100%, 60%)`;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 0.02;
        if (this.size > 0.1) this.size -= 0.1;
      }

      draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    function drawLoading() {
      const cx = width / 2;
      const cy = height / 2;
      const radius = 50;

      ctx.fillStyle = "rgba(5, 5, 5, 0.25)";
      ctx.fillRect(0, 0, width, height);

      loadingAngle += 0.15;

      for (let i = 0; i < 20; i++) {
        const angle = loadingAngle - i * 0.2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        const size = 5 - i * 0.2;
        const opacity = 1 - i * 0.05;
        if (size > 0 && opacity > 0) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(0, 220, 255, ${opacity})`;
          ctx.shadowBlur = 15;
          ctx.shadowColor = "rgba(0, 220, 255, 0.8)";
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      ctx.fillStyle = "rgba(0, 220, 255, 0.8)";
      ctx.font = "16px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("AI Thinking...", cx, cy + 80);
    }

    function animate() {
      if (isLoadingRef.current) {
        drawLoading();
      } else {
        ctx.clearRect(0, 0, width, height);
        for (const star of stars) {
          star.update();
          star.draw();
        }
        solarSystem.update();
        solarSystem.draw();
        for (let i = 0; i < cometTrail.length; i++) {
          cometTrail[i].update();
          cometTrail[i].draw();
          if (cometTrail[i].life <= 0 || cometTrail[i].size <= 0) {
            cometTrail.splice(i, 1);
            i--;
          }
        }
      }
      animationFrame = requestAnimationFrame(animate);
    }

    function handleMouse(e: MouseEvent | TouchEvent) {
      if ("touches" in e) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      } else {
        mouse.x = e.x;
        mouse.y = e.y;
      }
      if (!isLoadingRef.current && mouse.x !== undefined && mouse.y !== undefined) {
        for (let i = 0; i < 3; i++) {
          cometTrail.push(new CometParticle(mouse.x, mouse.y));
        }
      }
    }

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouse);
    window.addEventListener("touchmove", handleMouse);

    solarSystem = new SolarSystem();
    resize();
    animationFrame = requestAnimationFrame(animate);
    const timeout = setTimeout(() => setIsLoading(false), autoStopMs);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearTimeout(timeout);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("touchmove", handleMouse);
    };
  }, [autoStopMs]);

  const toggle = () => setIsLoading((prev) => !prev);

  return (
    <div className="absolute inset-0">
      <canvas ref={canvasRef} className="w-full h-full block" aria-hidden="true" />
      <div className="ui-layer pointer-events-none absolute inset-0">
        <div className="absolute top-5 left-5 flex items-center gap-3 pointer-events-auto">
          <button
            onClick={toggle}
            className="bg-white/5 border border-white/20 text-white px-4 py-2 rounded-full backdrop-blur-md transition hover:bg-white/10 hover:border-cyan-300/60"
          >
            {isLoading ? "Stop Loading" : "Show Loading"}
          </button>
        </div>
        <div className="instruction absolute bottom-7 w-full text-center text-white/60 select-none">
          Move cursor to paint comet trails
        </div>
      </div>
    </div>
  );
}
