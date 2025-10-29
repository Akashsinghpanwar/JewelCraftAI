import os
import httpx
import base64
from typing import List, Optional
from PIL import Image
import io

class JewelryImageGenerator:
    def __init__(self):
        self.api_key = os.getenv("ARK_API_KEY")
        if self.api_key:
            self.has_api_key = True
            print("INFO: Using Seedream 4.0 API for image generation")
        else:
            self.has_api_key = False
            print("WARNING: No ARK_API_KEY set. Using placeholder images.")
    
    async def generate_image(self, prompt: str, size: str = "1024x1024") -> str:
        """Generate a single jewelry image using Seedream 4.0"""
        if not self.has_api_key:
            import hashlib
            prompt_hash = hashlib.md5(prompt.encode()).hexdigest()[:6]
            return f"https://via.placeholder.com/1024x1024/FFD700/000000?text={prompt[:30].replace(' ', '+')}"
        
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    "https://ark.ap-southeast.bytepluses.com/api/v3/images/generations",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "seedream-4-0-250828",
                        "prompt": prompt,
                        "size": size,
                        "response_format": "url",
                        "watermark": False,
                        "n": 1
                    }
                )
                
                if response.status_code != 200:
                    error_text = response.text
                    print(f"Seedream API error {response.status_code}: {error_text}")
                    return f"https://via.placeholder.com/1024x1024/FFD700/000000?text=Error+{response.status_code}"
                
                data = response.json()
                
                if "data" in data and len(data["data"]) > 0:
                    image_url = data["data"][0].get("url")
                    if image_url:
                        return image_url
                
                print(f"No images in Seedream response: {data}")
                return "https://via.placeholder.com/1024x1024/FFD700/000000?text=No+Image+Generated"
                
        except Exception as e:
            print(f"Error generating image with Seedream: {e}")
            return f"https://via.placeholder.com/1024x1024/FFD700/000000?text=Error+Generating"
    
    async def enhance_image(self, image_url: str, prompt: str) -> str:
        """Enhance an existing image using Seedream 4.0 image-to-image"""
        if not self.has_api_key:
            return image_url  # Return original if no API key
        
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    "https://ark.ap-southeast.bytepluses.com/api/v3/images/generations",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "seedream-4-0-250828",
                        "prompt": prompt,
                        "image": image_url,
                        "size": "2K",
                        "response_format": "url",
                        "watermark": False,
                        "sequential_image_generation": "disabled"
                    }
                )
                
                if response.status_code != 200:
                    error_text = response.text
                    print(f"Seedream enhancement error {response.status_code}: {error_text}")
                    return image_url  # Return original on error
                
                data = response.json()
                
                if "data" in data and len(data["data"]) > 0:
                    enhanced_url = data["data"][0].get("url")
                    if enhanced_url:
                        return enhanced_url
                
                print(f"No enhanced image in response: {data}")
                return image_url  # Return original if no enhanced image
                
        except Exception as e:
            print(f"Error enhancing image with Seedream: {e}")
            return image_url  # Return original on error
    
    async def download_image(self, url: str) -> Image.Image:
        """Download an image from URL and return as PIL Image"""
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            image_bytes = response.content
            return Image.open(io.BytesIO(image_bytes))
