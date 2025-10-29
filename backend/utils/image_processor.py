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
    
    async def crop_jewelry_regions(self, image_url: str, jewelry_type: str = "necklace") -> dict:
        """Crop specific regions from the base jewelry image for detail enhancement"""
        try:
            # Download the image
            img_bytes = await self._download_image(image_url)
            img = Image.open(io.BytesIO(img_bytes))
            width, height = img.size
            
            # Define crop regions based on jewelry type
            # Format: (left, top, right, bottom) as percentages of image size
            # Ensuring aspect ratios between 0.33 and 3.00 (Seedream API requirement)
            if "necklace" in jewelry_type.lower() or "pendant" in jewelry_type.lower():
                crops = {
                    "pendant": (0.30, 0.25, 0.70, 0.65),   # Square-ish pendant area (1:1 ratio)
                    "chain": (0.35, 0.10, 0.65, 0.40),     # Chain section (1:1 ratio)
                    "clasp": (0.35, 0.65, 0.65, 0.90)      # Clasp area (1:1 ratio)
                }
            elif "ring" in jewelry_type.lower():
                crops = {
                    "gemstone": (0.30, 0.25, 0.70, 0.65),  # Center gemstone (1:1 ratio)
                    "band": (0.30, 0.45, 0.70, 0.75),      # Ring band (4:3 ratio)
                    "side_detail": (0.25, 0.30, 0.60, 0.70) # Side profile (1:1 ratio)
                }
            elif "bracelet" in jewelry_type.lower():
                crops = {
                    "center_link": (0.30, 0.30, 0.70, 0.70),  # Center link (1:1 ratio)
                    "clasp": (0.60, 0.35, 0.90, 0.65),        # Clasp (1:1 ratio)
                    "pattern": (0.25, 0.35, 0.60, 0.70)       # Pattern detail (1:1 ratio)
                }
            else:
                # Default: square crops for safety (1:1 ratio)
                crops = {
                    "center": (0.25, 0.25, 0.75, 0.75),      # Main center (1:1)
                    "detail_1": (0.30, 0.30, 0.70, 0.70),    # Detail 1 (1:1)
                    "detail_2": (0.35, 0.35, 0.65, 0.65)     # Detail 2 (1:1)
                }
            
            # Perform crops and convert to base64
            cropped_images = {}
            for region_name, (left_pct, top_pct, right_pct, bottom_pct) in crops.items():
                left = int(width * left_pct)
                top = int(height * top_pct)
                right = int(width * right_pct)
                bottom = int(height * bottom_pct)
                
                crop_width = right - left
                crop_height = bottom - top
                
                # Validate aspect ratio (must be between 0.33 and 3.00)
                if crop_width > 0 and crop_height > 0:
                    aspect_ratio = crop_width / crop_height
                    if aspect_ratio < 0.33 or aspect_ratio > 3.00:
                        print(f"Warning: Crop '{region_name}' has invalid aspect ratio {aspect_ratio:.2f}, adjusting to 1:1")
                        # Adjust to square (1:1) to be safe
                        size = min(crop_width, crop_height)
                        center_x = (left + right) // 2
                        center_y = (top + bottom) // 2
                        left = center_x - size // 2
                        right = center_x + size // 2
                        top = center_y - size // 2
                        bottom = center_y + size // 2
                
                cropped = img.crop((left, top, right, bottom))
                
                # Convert to base64 data URL for API
                buffer = io.BytesIO()
                cropped.save(buffer, format="PNG")
                img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                
                cropped_images[region_name] = f"data:image/png;base64,{img_base64}"
                
                # Log the crop for debugging
                print(f"Cropped '{region_name}': {cropped.size[0]}x{cropped.size[1]} (aspect ratio: {cropped.size[0]/cropped.size[1]:.2f})")
            
            return cropped_images
        except Exception as e:
            print(f"Error cropping jewelry regions: {e}")
            import traceback
            traceback.print_exc()
            return {}
    
    async def create_sketch(self, image_url: str) -> str:
        """Create a sketch from a jewelry render using OpenCV edge detection"""
        try:
            img_bytes = await self._download_image(image_url)
            
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Apply Gaussian blur for smoother edges
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # Apply adaptive thresholding for better sketch effect
            thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                          cv2.THRESH_BINARY, 11, 2)
            
            # Detect edges using Canny
            edges = cv2.Canny(blurred, 30, 100)
            
            # Combine threshold and edges for pencil sketch effect
            sketch = cv2.bitwise_and(thresh, cv2.bitwise_not(edges))
            
            # Encode as PNG
            _, buffer = cv2.imencode('.png', sketch)
            sketch_base64 = base64.b64encode(buffer).decode('utf-8')
            
            return f"data:image/png;base64,{sketch_base64}"
        except Exception as e:
            print(f"Error creating sketch: {e}")
            return "https://via.placeholder.com/1024x1024/FFFFFF/000000?text=Sketch+Error"
    
    async def create_sketches_from_renders(self, images: list) -> list:
        """Create sketches from existing rendered images using OpenCV edge detection"""
        try:
            import asyncio
            
            async def convert_single_render(img_data: dict) -> dict:
                """Convert a single render to sketch"""
                try:
                    sketch_url = await self.create_sketch(img_data["url"])
                    return {
                        "angle": img_data["angle"],
                        "url": sketch_url
                    }
                except Exception as e:
                    print(f"Error converting {img_data['angle']} to sketch: {e}")
                    return {
                        "angle": img_data["angle"],
                        "url": f"https://via.placeholder.com/1024x1024/F5F5F5/000000?text={img_data['angle'].replace(' ', '+')}+Sketch+Error"
                    }
            
            print(f"Converting {len(images)} renders to sketches...")
            tasks = [convert_single_render(img) for img in images]
            sketches = await asyncio.gather(*tasks)
            print(f"Completed converting {len(sketches)} renders to sketches")
            
            return list(sketches)
        except Exception as e:
            print(f"Error creating sketches from renders: {e}")
            import traceback
            traceback.print_exc()
            # Return placeholder sketches
            return [
                {"angle": img["angle"], "url": f"https://via.placeholder.com/1024x1024/F5F5F5/000000?text={img['angle'].replace(' ', '+')}+Error"}
                for img in images
            ]
    
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
