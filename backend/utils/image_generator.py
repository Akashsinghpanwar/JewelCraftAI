import os
from typing import List

try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

class JewelryImageGenerator:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key and HAS_OPENAI:
            self.client = OpenAI(api_key=api_key)
            self.has_api_key = True
        else:
            self.client = None
            self.has_api_key = False
            if not api_key:
                print("WARNING: OPENAI_API_KEY not set. Using placeholder images.")
    
    async def generate_image(self, prompt: str) -> str:
        if not self.has_api_key or not self.client:
            import hashlib
            prompt_hash = hashlib.md5(prompt.encode()).hexdigest()[:6]
            return f"https://via.placeholder.com/1024x1024/FFD700/000000?text={prompt[:30].replace(' ', '+')}"
        
        try:
            response = self.client.images.generate(
                model="gpt-image-1",
                prompt=prompt,
                size="1024x1024",
                quality="high",
                n=1,
            )
            
            return response.data[0].url
        except Exception as e:
            print(f"Error generating image with gpt-image-1, falling back to dall-e-3: {e}")
            try:
                response = self.client.images.generate(
                    model="dall-e-3",
                    prompt=prompt,
                    size="1024x1024",
                    quality="hd",
                    n=1,
                )
                return response.data[0].url
            except Exception as e2:
                print(f"Error generating image with dall-e-3: {e2}")
                return f"https://via.placeholder.com/1024x1024/FFD700/000000?text=Error+Generating"
