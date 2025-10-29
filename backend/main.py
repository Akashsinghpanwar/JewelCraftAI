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
        
        angles = ["front view", "side view", "top view", "45-degree angled view", "perspective view"]
        images = []
        
        for angle in angles:
            full_prompt = f"{request.prompt}, {angle}, product photography, white background, high quality, professional jewelry render"
            image_url = await image_generator.generate_image(full_prompt)
            images.append({
                "angle": angle,
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
        
        angles = ["front view", "side view", "top view", "45-degree angled view", "perspective view"]
        images = []
        
        for angle in angles:
            full_prompt = f"{session['original_prompt']}, {request.metal} metal, {request.gemstone} gemstone, {request.band_shape} band, {angle}, product photography, white background, high quality, professional jewelry render"
            image_url = await image_generator.generate_image(full_prompt)
            images.append({
                "angle": angle,
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
    uvicorn.run(app, host="0.0.0.0", port=8000)
