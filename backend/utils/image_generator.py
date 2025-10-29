import os
import httpx
import base64
from typing import List

class JewelryImageGenerator:
    def __init__(self):
        self.api_key = os.getenv("ARK_API_KEY")
        if self.api_key:
            self.has_api_key = True
            print("INFO: Using Seedream 4.0 API for image generation")
        else:
            self.has_api_key = False
            print("WARNING: No ARK_API_KEY set. Using placeholder images.")
    
    async def generate_image(self, prompt: str) -> str:
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
                        "size": "1024x1024",
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
