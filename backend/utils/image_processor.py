import os
from PIL import Image, ImageFilter, ImageOps, ImageEnhance
import io
import httpx
import cv2
import numpy as np
from typing import Optional
import base64

class ImageProcessor:
    def __init__(self):
        self.api_key = os.getenv("ARK_API_KEY")
        self.has_api_key = bool(self.api_key)
    
    async def create_sketch(self, image_url: str) -> str:
        """Create a sketch from a jewelry render using OpenCV edge detection"""
        try:
            img_bytes = await self._download_image(image_url)
            
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            edges = cv2.Canny(blurred, 30, 100)
            
            inverted = cv2.bitwise_not(edges)
            
            _, buffer = cv2.imencode('.png', inverted)
            sketch_base64 = base64.b64encode(buffer).decode('utf-8')
            
            return f"data:image/png;base64,{sketch_base64}"
        except Exception as e:
            print(f"Error creating sketch: {e}")
            return "https://via.placeholder.com/1024x1024/FFFFFF/000000?text=Sketch+Error"
    
    async def _generate_single_sketch(self, prompt: str, metal: str, gemstone: str, band_shape: str, angle: str) -> dict:
        """Generate a single sketch view"""
        try:
            full_prompt = f"Professional jewelry technical blueprint sketch of {prompt}, {metal} metal, {gemstone} gemstone, {band_shape} band, {angle}, SAME EXACT JEWELRY GEOMETRY AND PROPORTIONS across all views, same gemstone placement, same metal form, identical design structure, CENTERED WITHIN A BORDERED RECTANGULAR FRAME, uniform border margins like a technical catalog page, complete jewelry piece FULLY VISIBLE with NO CROPPED EDGES, all parts contained within the frame border, measured and balanced composition, hand-drawn in BLACK AND GRAY PENCIL TONES ONLY, realistic graphite shading, clean precise linework, NO colors whatsoever, NO gradients, NO digital filters, plain white or light gray paper texture background, NO shadows on background, NO props, NO scenery, professional jewelry manufacturer's technical documentation style, production-ready blueprint, CAD-quality measured perspective, realistic pencil sketch on white paper, master jewelry designer hand-drawn blueprint"
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "https://ark.ap-southeast.bytepluses.com/api/v3/images/generations",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "seedream-4-0-250828",
                        "prompt": full_prompt,
                        "size": "1024x1024",
                        "response_format": "url",
                        "watermark": False,
                        "n": 1
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if "data" in data and len(data["data"]) > 0:
                        image_url = data["data"][0].get("url")
                        if image_url:
                            return {"angle": angle, "url": image_url}
                
                return {
                    "angle": angle,
                    "url": f"https://via.placeholder.com/1024x1024/F5F5F5/000000?text={angle.replace(' ', '+')}+Error"
                }
        except Exception as e:
            print(f"Error generating {angle} sketch: {e}")
            return {
                "angle": angle,
                "url": f"https://via.placeholder.com/1024x1024/F5F5F5/000000?text={angle.replace(' ', '+')}+Error"
            }
    
    async def create_multi_view_sketches(self, prompt: str, metal: str, gemstone: str, band_shape: str) -> list:
        """Generate 5-6 realistic pencil-shaded technical sketches using Seedream 4.0 in parallel"""
        if not self.has_api_key:
            return [
                {"angle": "front view", "url": "https://via.placeholder.com/1024x1024/F5F5F5/000000?text=Front+Sketch+(API+Key+Required)"},
                {"angle": "top view", "url": "https://via.placeholder.com/1024x1024/F5F5F5/000000?text=Top+Sketch+(API+Key+Required)"},
                {"angle": "side view", "url": "https://via.placeholder.com/1024x1024/F5F5F5/000000?text=Side+Sketch+(API+Key+Required)"},
                {"angle": "isometric view", "url": "https://via.placeholder.com/1024x1024/F5F5F5/000000?text=Isometric+Sketch+(API+Key+Required)"},
                {"angle": "detail close-up", "url": "https://via.placeholder.com/1024x1024/F5F5F5/000000?text=Detail+Sketch+(API+Key+Required)"},
                {"angle": "profile view", "url": "https://via.placeholder.com/1024x1024/F5F5F5/000000?text=Profile+Sketch+(API+Key+Required)"}
            ]
        
        try:
            import asyncio
            angles = ["front view", "top view", "side view", "isometric view", "detail close-up", "profile view"]
            
            # Generate all sketches in parallel for much faster results
            print(f"Generating {len(angles)} sketches in parallel...")
            tasks = [self._generate_single_sketch(prompt, metal, gemstone, band_shape, angle) for angle in angles]
            sketches = await asyncio.gather(*tasks)
            print(f"Completed generating {len(sketches)} sketches")
            
            return list(sketches)
                
        except Exception as e:
            print(f"Error creating multi-view sketches: {e}")
            import traceback
            traceback.print_exc()
            return [
                {"angle": "front view", "url": "https://via.placeholder.com/1024x1024/F5F5F5/000000?text=Front+Sketch+Error"},
                {"angle": "top view", "url": "https://via.placeholder.com/1024x1024/F5F5F5/000000?text=Top+Sketch+Error"},
                {"angle": "side view", "url": "https://via.placeholder.com/1024x1024/F5F5F5/000000?text=Side+Sketch+Error"},
                {"angle": "isometric view", "url": "https://via.placeholder.com/1024x1024/F5F5F5/000000?text=Isometric+Sketch+Error"},
                {"angle": "detail close-up", "url": "https://via.placeholder.com/1024x1024/F5F5F5/000000?text=Detail+Sketch+Error"},
                {"angle": "profile view", "url": "https://via.placeholder.com/1024x1024/F5F5F5/000000?text=Profile+Sketch+Error"}
            ]
    
    async def create_3d_model(self, prompt: str, metal: str, gemstone: str) -> str:
        """Generate a 3D-style render using Seedream 4.0"""
        if not self.has_api_key:
            return f"https://via.placeholder.com/1024x1024/808080/FFFFFF?text=3D+Model+(API+Key+Required)"
        
        try:
            # Enhanced prompt for 3D/photorealistic rendering
            full_prompt = f"High-quality photorealistic 3D render of {prompt}, {metal} metal material with realistic reflections and PBR materials, {gemstone} gemstone with ray-traced lighting, professional studio lighting setup, PLAIN NEUTRAL BACKGROUND, jewelry ONLY with NO scenery, NO water, NO ocean, NO sky, NO flowers, NO props, isolated product visualization, luxury jewelry photography, isometric view, octane render, 8k detail, sharp focus"
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    "https://ark.ap-southeast.bytepluses.com/api/v3/images/generations",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "seedream-4-0-250828",
                        "prompt": full_prompt,
                        "size": "1024x1024",
                        "response_format": "url",
                        "watermark": False,
                        "n": 1
                    }
                )
                
                if response.status_code != 200:
                    print(f"Seedream API error {response.status_code}: {response.text}")
                    return "https://via.placeholder.com/1024x1024/808080/FFFFFF?text=3D+Model+Error"
                
                data = response.json()
                
                if "data" in data and len(data["data"]) > 0:
                    image_url = data["data"][0].get("url")
                    if image_url:
                        return image_url
                
                return "https://via.placeholder.com/1024x1024/808080/FFFFFF?text=No+3D+Image"
                
        except Exception as e:
            print(f"Error creating 3D model: {e}")
            return "https://via.placeholder.com/1024x1024/808080/FFFFFF?text=3D+Model+Error"
    
    async def _download_image(self, url: str) -> bytes:
        """Download image from URL"""
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            return response.content
