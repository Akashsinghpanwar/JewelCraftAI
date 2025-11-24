from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from typing import List, Dict
import uuid
import asyncio
from utils.image_generator import JewelryImageGenerator
from utils.image_processor import ImageProcessor

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
    metal: str
    gemstone: str
    band_shape: str

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
        # This ensures sketches look identical to the final jewelry design
        print(f"Converting {len(session['images'])} finalized jewelry images to pencil sketches...")
        sketches = await image_processor.convert_images_to_sketches(session["images"])
        print(f"Sketch conversion complete")
        
        print(f"Generating 3D model using Hitem3D API...")
        try:
            # Get the base view image URL (first image in the session)
            base_image_url = session["images"][0]["url"] if session["images"] else None
            
            if not base_image_url:
                raise Exception("No base image found for 3D conversion")
            
            # Convert to 3D using Hitem3D API (increased timeout for API processing)
            model_url = await asyncio.wait_for(
                image_processor.create_3d_model(base_image_url),
                timeout=350.0  # 5-6 minutes for Hitem3D processing
            )
            print(f"3D model generated: {model_url[:100]}...")
        except asyncio.TimeoutError:
            print(f"3D model generation timed out after 350 seconds")
            model_url = "https://via.placeholder.com/1024x1024/808080/FFFFFF?text=3D+Model+Timeout"
        except Exception as e:
            print(f"Error generating 3D model: {e}")
            import traceback
            traceback.print_exc()
            model_url = "https://via.placeholder.com/1024x1024/808080/FFFFFF?text=3D+Model+Error"
        
        print(f"Preparing response with {len(sketches)} sketches and 3D model")
        
        # Convert remote image URLs to base64 to avoid CORS issues in AR
        print(f"Converting remote URLs to base64 for AR compatibility...")
        images_for_ar = []
        async with httpx.AsyncClient(timeout=30.0) as client:
            for img in session["images"]:
                if img["url"].startswith("data:"):
                    # Already base64
                    images_for_ar.append(img)
                else:
                    # Convert remote URL to base64
                    try:
                        response = await client.get(img["url"])
                        if response.status_code == 200:
                            img_data = response.content
                            base64_data = base64.b64encode(img_data).decode('utf-8')
                            images_for_ar.append({
                                "url": f"data:image/jpeg;base64,{base64_data}",
                                "angle": img["angle"]
                            })
                            print(f"Converted {img['angle']} to base64 ({len(base64_data)} chars)")
                        else:
                            print(f"Failed to fetch {img['angle']}: HTTP {response.status_code}")
                            images_for_ar.append(img)
                    except Exception as e:
                        print(f"Failed to convert {img['angle']} to base64: {e}")
                        images_for_ar.append(img)
        
        response_data = {
            "session_id": request.session_id,
            "original_images": images_for_ar,  # Use base64 versions for AR
            "sketches": sketches,
            "model_3d": model_url,
            "prompt": session.get("original_prompt", "")
        }
        
        print(f"Response data prepared, returning to client...")
        return response_data
    except Exception as e:
        import traceback
        print(f"ERROR in /finalize endpoint: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, timeout_keep_alive=300)
