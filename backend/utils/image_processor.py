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
    
    async def create_3d_model(self, prompt: str, metal: str, gemstone: str) -> str:
        """Generate a 3D-style render using Seedream 4.0"""
        if not self.has_api_key:
            return f"https://via.placeholder.com/1024x1024/808080/FFFFFF?text=3D+Model+(API+Key+Required)"
        
        try:
            # Enhanced prompt for 3D/photorealistic rendering
            full_prompt = f"High-quality photorealistic 3D render of {prompt}, {metal} metal material with realistic reflections and PBR materials, {gemstone} gemstone with ray-traced lighting, professional studio lighting setup, neutral gray background, product visualization, luxury jewelry photography, isometric view, octane render, 8k detail, sharp focus"
            
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
