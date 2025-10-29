from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from typing import List, Dict
import uuid
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
        session_id = str(uuid.uuid4())
        
        # Generate 3 main angle views + 2 detail close-ups for better consistency
        views = [
            {"type": "angle", "name": "front view", "description": "front view"},
            {"type": "angle", "name": "side view", "description": "side profile view"},
            {"type": "angle", "name": "angled view", "description": "45-degree angled perspective"},
            {"type": "detail", "name": "gemstone detail", "description": "extreme close-up macro shot of gemstone/crystal showing facets and reflections"},
            {"type": "detail", "name": "chain/metal detail", "description": "extreme close-up macro shot of chain links and metal texture"}
        ]
        images = []
        
        for view in views:
            if view["type"] == "angle":
                full_prompt = f"ONLY ONE jewelry item: {request.prompt}, EXACTLY ONE single piece ONLY, NO other jewelry, NO rings unless specified, NO extra objects, {view['description']}, same jewelry design, single isolated jewelry item on PLAIN WHITE BACKGROUND, NO scenery, NO water, NO ocean, NO sky, NO flowers, NO props, NO background elements, professional jewelry product photography, studio lighting, high quality"
            else:  # detail shot
                full_prompt = f"ONLY ONE jewelry item detail: {request.prompt}, {view['description']}, macro photography, ultra-detailed, showing intricate craftsmanship, professional jewelry photography, PLAIN WHITE BACKGROUND, NO other objects, high resolution detail shot, studio lighting"
            
            image_url = await image_generator.generate_image(full_prompt)
            images.append({
                "angle": view["name"],
                "url": image_url
            })
        
        sessions[session_id] = {
            "original_prompt": request.prompt,
            "images": images,
            "metal": "gold",
            "gemstone": "ruby",
            "band_shape": "thin"
        }
        
        return {
            "session_id": session_id,
            "images": images
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/modify")
async def modify_jewelry(request: ModifyRequest):
    try:
        if request.session_id not in sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = sessions[request.session_id]
        session["metal"] = request.metal
        session["gemstone"] = request.gemstone
        session["band_shape"] = request.band_shape
        
        # Generate 3 main angle views + 2 detail close-ups with material updates
        views = [
            {"type": "angle", "name": "front view", "description": "front view"},
            {"type": "angle", "name": "side view", "description": "side profile view"},
            {"type": "angle", "name": "angled view", "description": "45-degree angled perspective"},
            {"type": "detail", "name": "gemstone detail", "description": "extreme close-up macro shot of gemstone/crystal showing facets and reflections"},
            {"type": "detail", "name": "chain/metal detail", "description": "extreme close-up macro shot of chain links and metal texture"}
        ]
        images = []
        
        for view in views:
            if view["type"] == "angle":
                full_prompt = f"ONLY ONE jewelry item with material update: {session['original_prompt']}, EXACTLY ONE single piece ONLY, NO other jewelry, NO rings unless specified, {view['description']}, material: {request.metal} metal, {request.gemstone} gemstone, {request.band_shape} band, same base design, single isolated jewelry item on PLAIN WHITE BACKGROUND, NO scenery, NO water, NO ocean, NO sky, NO flowers, NO props, professional jewelry product photography, studio lighting, high quality"
            else:  # detail shot
                full_prompt = f"ONLY ONE jewelry item detail with material update: {session['original_prompt']}, {view['description']}, material: {request.metal} metal, {request.gemstone} gemstone, macro photography, ultra-detailed craftsmanship, professional jewelry photography, PLAIN WHITE BACKGROUND, NO other objects, high resolution detail shot, studio lighting"
            
            image_url = await image_generator.generate_image(full_prompt)
            images.append({
                "angle": view["name"],
                "url": image_url
            })
        
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
        
        # Generate professional technical blueprint sketches
        sketches = await image_processor.create_multi_view_sketches(
            session["original_prompt"],
            session["metal"],
            session["gemstone"],
            session["band_shape"]
        )
        
        model_url = await image_processor.create_3d_model(
            session["original_prompt"],
            session["metal"],
            session["gemstone"]
        )
        
        return {
            "session_id": request.session_id,
            "original_images": session["images"],
            "sketches": sketches,
            "model_3d": model_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, timeout_keep_alive=300)
