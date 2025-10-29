import os
from PIL import Image, ImageFilter, ImageOps, ImageEnhance
import io
import httpx
import cv2
import numpy as np
from typing import Optional
import base64

try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

class ImageProcessor:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key and HAS_OPENAI:
            self.client = OpenAI(api_key=api_key)
            self.has_api_key = True
        else:
            self.client = None
            self.has_api_key = False
    
    async def create_sketch(self, image_url: str) -> str:
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
        if not self.has_api_key or not self.client:
            return f"https://via.placeholder.com/1024x1024/808080/FFFFFF?text=3D+Model+(API+Key+Required)"
        
        try:
            full_prompt = f"High-quality 3D render of {prompt}, {metal} metal material, {gemstone} gemstone, photorealistic PBR materials, studio lighting, neutral gray background, product visualization, jewelry render, isometric view"
            
            response = self.client.images.generate(
                model="gpt-image-1",
                prompt=full_prompt,
                size="1024x1024",
                quality="high",
                n=1,
            )
            
            return response.data[0].url
        except Exception as e:
            print(f"Error creating 3D model with gpt-image-1, trying dall-e-3: {e}")
            try:
                response = self.client.images.generate(
                    model="dall-e-3",
                    prompt=full_prompt,
                    size="1024x1024",
                    quality="hd",
                    n=1,
                )
                return response.data[0].url
            except Exception as e2:
                print(f"Error creating 3D model: {e2}")
                return "https://via.placeholder.com/1024x1024/808080/FFFFFF?text=3D+Model+Error"
    
    async def _download_image(self, url: str) -> bytes:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            return response.content
