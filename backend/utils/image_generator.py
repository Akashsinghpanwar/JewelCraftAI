import os
import httpx
import base64
import re
from typing import List

class JewelryImageGenerator:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        if self.api_key:
            self.has_api_key = True
            print("INFO: Using OpenRouter API for image generation")
        else:
            self.has_api_key = False
            print("WARNING: No OPENROUTER_API_KEY set. Using placeholder images.")
    
    async def generate_image(self, prompt: str) -> str:
        if not self.has_api_key:
            import hashlib
            prompt_hash = hashlib.md5(prompt.encode()).hexdigest()[:6]
            return f"https://via.placeholder.com/1024x1024/FFD700/000000?text={prompt[:30].replace(' ', '+')}"
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "google/gemini-2.5-flash-image",
                        "messages": [{
                            "role": "user",
                            "content": prompt
                        }],
                        "modalities": ["image", "text"]
                    }
                )
                
                if response.status_code != 200:
                    print(f"OpenRouter error {response.status_code}: {response.text}")
                    return f"https://via.placeholder.com/1024x1024/FFD700/000000?text=Error+{response.status_code}"
                
                data = response.json()
                
                if "choices" in data and len(data["choices"]) > 0:
                    choice = data["choices"][0]
                    if "message" in choice and "images" in choice["message"]:
                        images = choice["message"]["images"]
                        if images and len(images) > 0:
                            return images[0]
                
                print(f"No images in response: {data}")
                return "https://via.placeholder.com/1024x1024/FFD700/000000?text=No+Image+Generated"
                
        except Exception as e:
            print(f"Error generating image: {e}")
            return f"https://via.placeholder.com/1024x1024/FFD700/000000?text=Error+Generating"
