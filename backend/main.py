from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from typing import List, Dict
import uuid
import asyncio
import base64
import httpx
from dotenv import load_dotenv
from rembg import remove
from utils.image_generator import JewelryImageGenerator
from utils.image_processor import ImageProcessor

# Load environment variables from .env file
load_dotenv()


app = FastAPI(title="AI Jewelry Generator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

image_generator = JewelryImageGenerator()
image_processor = ImageProcessor()

sessions = {}

class GenerateRequest(BaseModel):
    prompt: str

class ModifyRequest(BaseModel):
    session_id: str
    metal: str = "gold"
    gemstone: str = "ruby"
    band_shape: str = "thin"
    custom_instruction: str = None

class FinalizeRequest(BaseModel):
    session_id: str

@app.get("/")
async def root():
    return {"message": "AI Jewelry Generator API", "status": "running"}

@app.post("/generate")
async def generate_jewelry(request: GenerateRequest):
    try:
        import asyncio
        session_id = str(uuid.uuid4())
        
        # Step 1: Generate ONE ultra-high-resolution base image (2K)
        base_prompt = f"ONLY ONE jewelry item: {request.prompt}, EXACTLY ONE single piece ONLY, NO other jewelry, NO rings unless specified, NO extra objects, centered professional product photography, single isolated jewelry item on PLAIN WHITE BACKGROUND, NO scenery, NO water, NO ocean, NO sky, NO flowers, NO props, NO background elements, ultra-high resolution, studio lighting, perfect clarity, best quality"
        
        print(f"Generating base image in 2K resolution...")
        base_image_url = await image_generator.generate_image(base_prompt, size="2K")
        print(f"Base image generated: {base_image_url}")
        
        # Step 2: Crop regions from the base image
        print(f"Cropping jewelry regions...")
        jewelry_type = request.prompt.lower()
        cropped_regions = await image_processor.crop_jewelry_regions(base_image_url, jewelry_type)
        print(f"Cropped {len(cropped_regions)} regions: {list(cropped_regions.keys())}")
        
        # Step 3: Enhance each cropped region using image-to-image
        enhancement_prompt = "Enhance this cropped jewelry image to ultra-high resolution. Keep the exact same design, shape, proportions, and metal texture as in the input image. Do not modify, redraw, or hallucinate any new parts. Simply upscale and refine for realistic clarity, sharpness, and lighting. Maintain identical gemstone color, chain thickness, reflections, and polished metal finish. Treat this as a photo enhancement task, not generation. Output must look like the same jewelry captured with a macro camera on a white or transparent background."
        
        print(f"Enhancing cropped regions...")
        enhanced_details = []
        
        # Enhance crops in parallel
        async def enhance_region(region_name: str, crop_data: str) -> dict:
            try:
                enhanced_url = await image_generator.enhance_image(crop_data, enhancement_prompt)
                return {
                    "angle": f"{region_name} detail",
                    "url": enhanced_url
                }
            except Exception as e:
                print(f"Error enhancing {region_name}: {e}")
                return {
                    "angle": f"{region_name} detail",
                    "url": crop_data  # Fallback to cropped version
                }
        
        enhancement_tasks = [enhance_region(name, crop) for name, crop in cropped_regions.items()]
        enhanced_details = await asyncio.gather(*enhancement_tasks)
        print(f"Enhanced {len(enhanced_details)} detail crops")
        
        # Step 4: Combine base image + enhanced detail crops
        images = [
            {"angle": "base view", "url": base_image_url}
        ] + enhanced_details
        
        sessions[session_id] = {
            "original_prompt": request.prompt,
            "images": images,
            "base_image": base_image_url,
            "metal": "gold",
            "gemstone": "ruby",
            "band_shape": "thin"
        }
        
        return {
            "session_id": session_id,
            "images": images
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/modify")
async def modify_jewelry(request: ModifyRequest):
    try:
        import asyncio
        if request.session_id not in sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = sessions[request.session_id]
        session["metal"] = request.metal
        session["gemstone"] = request.gemstone
        session["band_shape"] = request.band_shape
        
        # Get the original base image from the session
        original_base_image = session["images"][0]["url"]
        
        # Step 1: Use image-to-image to MODIFY the existing jewelry (NOT create new one)
        # This preserves the exact design, shape, and structure - only changes materials
        if request.custom_instruction:
            modification_prompt = f"Modify this jewelry according to these instructions: {request.custom_instruction}. CRITICAL: Keep the EXACT SAME design, shape, structure, proportions, and geometry as the input image. DO NOT change the jewelry type. DO NOT redesign. Maintain the same camera angle, lighting, and white background. This is a material/style swap only - preserve all design elements perfectly."
        else:
            modification_prompt = f"Transform this jewelry to {request.metal} metal with {request.gemstone} gemstone and {request.band_shape} band. CRITICAL: Keep the EXACT SAME design, shape, structure, proportions, and geometry as the input image. DO NOT change the jewelry type (necklace stays necklace, ring stays ring, etc). DO NOT redesign or create different jewelry. ONLY update the metal finish to {request.metal} color/texture and gemstone to {request.gemstone} color. The band should be {request.band_shape}. Maintain the same camera angle, lighting, and white background. This is a material swap only - preserve all design elements perfectly."
        
        print(f"Modifying materials on existing jewelry (image-to-image)...")
        base_image_url = await image_generator.enhance_image(original_base_image, modification_prompt)
        print(f"Modified base image generated: {base_image_url}")
        
        # Step 2: Crop regions from the base image
        print(f"Cropping jewelry regions from modified base...")
        jewelry_type = session['original_prompt'].lower()
        cropped_regions = await image_processor.crop_jewelry_regions(base_image_url, jewelry_type)
        print(f"Cropped {len(cropped_regions)} regions: {list(cropped_regions.keys())}")
        
        # Step 3: Enhance each cropped region
        enhancement_prompt = f"Enhance this {request.metal} jewelry with {request.gemstone} to ultra-high resolution. Keep the exact same design, shape, proportions, and metal texture as in the input image. Do not modify, redraw, or hallucinate any new parts. Simply upscale and refine for realistic clarity, sharpness, and lighting. Maintain the {request.metal} metal finish and {request.gemstone} gemstone color. Treat this as a photo enhancement task. Output must look like the same jewelry captured with a macro camera on a white or transparent background."
        
        print(f"Enhancing modified cropped regions...")
        
        async def enhance_region(region_name: str, crop_data: str) -> dict:
            try:
                enhanced_url = await image_generator.enhance_image(crop_data, enhancement_prompt)
                return {
                    "angle": f"{region_name} detail",
                    "url": enhanced_url
                }
            except Exception as e:
                print(f"Error enhancing {region_name}: {e}")
                return {
                    "angle": f"{region_name} detail",
                    "url": crop_data
                }
        
        enhancement_tasks = [enhance_region(name, crop) for name, crop in cropped_regions.items()]
        enhanced_details = await asyncio.gather(*enhancement_tasks)
        print(f"Enhanced {len(enhanced_details)} detail crops")
        
        # Step 4: Combine base image + enhanced detail crops
        images = [
            {"angle": "base view", "url": base_image_url}
        ] + enhanced_details
        
        session["images"] = images
        
        return {
            "session_id": request.session_id,
            "images": images
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/finalize")
async def finalize_jewelry(request: FinalizeRequest):
    try:
        if request.session_id not in sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = sessions[request.session_id]
        
        # Convert the finalized jewelry images to pencil sketches using image-to-image
        print(f"Converting {len(session['images'])} finalized jewelry images to pencil sketches...")
        sketches = await image_processor.convert_images_to_sketches(session["images"])
        print(f"Sketch conversion complete")
        
        async def convert_to_base64(img_dict, client, apply_rembg=True):
            """Convert a single image dict to base64 if it's a remote URL"""
            if img_dict["url"].startswith("data:"):
                return img_dict
            else:
                try:
                    response = await client.get(img_dict["url"], timeout=30.0)
                    if response.status_code == 200:
                        original_data = response.content
                        img_data = original_data
                        
                        # Remove background for AR transparency (only for non-sketches)
                        if apply_rembg:
                            try:
                                print(f"Removing background for {img_dict['angle']}...")
                                # Enable alpha matting for better edge detection
                                no_bg_data = await asyncio.to_thread(
                                    remove, 
                                    original_data, 
                                    alpha_matting=True,
                                    alpha_matting_foreground_threshold=240,
                                    alpha_matting_background_threshold=10,
                                    alpha_matting_erode_size=10
                                )
                                
                                if len(no_bg_data) > 100:
                                    img_data = no_bg_data
                                    print(f"Background removed for {img_dict['angle']}")
                                else:
                                    print(f"Background removal failed (empty), keeping original")
                            except Exception as e:
                                print(f"Background removal error: {e}")
                        
                        base64_data = base64.b64encode(img_data).decode('utf-8')
                        return {
                            "url": f"data:image/png;base64,{base64_data}",
                            "angle": img_dict["angle"]
                        }
                    else:
                        return img_dict
                except Exception as e:
                    print(f"Failed to convert {img_dict['angle']}: {e}")
                    return img_dict
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            images_tasks = [convert_to_base64(img, client, apply_rembg=True) for img in session["images"]]
            sketches_tasks = [convert_to_base64(sketch, client, apply_rembg=False) for sketch in sketches]
            
            images_for_ar = await asyncio.gather(*images_tasks)
            sketches_for_ar = await asyncio.gather(*sketches_tasks)
        
        return {
            "session_id": request.session_id,
            "original_images": images_for_ar,
            "sketches": sketches_for_ar,
            "prompt": session.get("original_prompt", "")
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, timeout_keep_alive=300)
