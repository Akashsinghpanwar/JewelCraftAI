import os
from typing import List

try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

class JewelryImageGenerator:
    def __init__(self):
        api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
        if api_key and HAS_OPENAI:
            if os.getenv("OPENROUTER_API_KEY"):
                self.client = OpenAI(
                    api_key=api_key,
                    base_url="https://openrouter.ai/api/v1"
                )
                self.using_openrouter = True
                print("INFO: Using OpenRouter API")
            else:
                self.client = OpenAI(api_key=api_key)
                self.using_openrouter = False
                print("INFO: Using OpenAI API")
            self.has_api_key = True
        else:
            self.client = None
            self.has_api_key = False
            self.using_openrouter = False
            if not api_key:
                print("WARNING: No API key set. Using placeholder images.")
    
    async def generate_image(self, prompt: str) -> str:
        if not self.has_api_key or not self.client:
            import hashlib
            prompt_hash = hashlib.md5(prompt.encode()).hexdigest()[:6]
            return f"https://via.placeholder.com/1024x1024/FFD700/000000?text={prompt[:30].replace(' ', '+')}"
        
        try:
            if self.using_openrouter:
                response = self.client.images.generate(
                    model="openai/dall-e-3",
                    prompt=prompt,
                    n=1,
                    size="1024x1024",
                )
            else:
                response = self.client.images.generate(
                    model="gpt-image-1",
                    prompt=prompt,
                    size="1024x1024",
                    quality="high",
                    n=1,
                )
            
            return response.data[0].url
        except Exception as e:
            print(f"Error generating image: {e}")
            try:
                response = self.client.images.generate(
                    model="dall-e-3" if not self.using_openrouter else "openai/dall-e-3",
                    prompt=prompt,
                    size="1024x1024",
                    n=1,
                )
                return response.data[0].url
            except Exception as e2:
                print(f"Error with fallback model: {e2}")
                return f"https://via.placeholder.com/1024x1024/FFD700/000000?text=Error+Generating"
