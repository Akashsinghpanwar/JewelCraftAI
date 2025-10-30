import os
import httpx
import asyncio
import time
from typing import Optional


class Hitem3DClient:
    """Client for Hitem3D API - converts images to 3D models (.glb format)"""
    
    def __init__(self):
        self.access_key = os.getenv("HITEM3D_ACCESS_KEY")
        self.secret_key = os.getenv("HITEM3D_SECRET_KEY")
        self.enabled = bool(self.access_key and self.secret_key)
        
        if not self.enabled:
            print("⚠️ WARNING: Hitem3D API credentials not found")
    
    async def convert_image_to_3d(
        self, 
        image_url: str, 
        resolution: int = 1024,
        texture_enabled: bool = True,
        max_wait_time: int = 300
    ) -> Optional[str]:
        """Convert a jewelry image to a 3D model (.glb format)"""
        
        if not self.enabled:
            print("⚠️ Hitem3D disabled - no API credentials")
            return None
        
        try:
            print(f"🎨 Starting Hitem3D 3D model generation...")
            
            # Submit generation task
            task_id = await self._submit_task(image_url, resolution, texture_enabled)
            
            if not task_id:
                print("❌ Failed to submit 3D generation task")
                return None
            
            print(f"✅ Task submitted: {task_id}")
            
            # Poll for completion
            model_url = await self._poll_completion(task_id, max_wait_time)
            
            if model_url:
                print(f"✅ 3D model ready: {model_url[:100]}...")
                return model_url
            else:
                print("❌ 3D generation failed or timed out")
                return None
                
        except Exception as e:
            print(f"❌ Hitem3D error: {e}")
            return None
    
    async def _submit_task(
        self, 
        image_url: str, 
        resolution: int,
        texture_enabled: bool
    ) -> Optional[str]:
        """Submit image for 3D generation"""
        
        # Try most common API patterns
        # 405 on platform.hitem3d.ai/api/generate means we need to try different methods/headers
        endpoints = [
            # Try platform.hitem3d.ai with different auth formats (405 means endpoint exists!)
            {
                "url": "https://platform.hitem3d.ai/api/generate",
                "method": "POST",
                "headers": {
                    "access-key": self.access_key,
                    "secret-key": self.secret_key,
                    "Content-Type": "application/json"
                },
                "payload": {
                    "image_url": image_url,
                    "resolution": resolution,
                    "format": "glb"
                }
            },
            {
                "url": "https://platform.hitem3d.ai/api/generate",
                "method": "POST",
                "headers": {
                    "AccessKey": self.access_key,
                    "SecretKey": self.secret_key,
                    "Content-Type": "application/json"
                },
                "payload": {
                    "image_url": image_url,
                    "resolution": resolution,
                    "format": "glb"
                }
            },
            {
                "url": "https://platform.hitem3d.ai/api/generate",
                "method": "POST",
                "headers": {
                    "X-Access-Key": self.access_key,
                    "X-Secret-Key": self.secret_key,
                    "Content-Type": "application/json"
                },
                "payload": {
                    "image_url": image_url,
                    "resolution": resolution,
                    "format": "glb"
                }
            },
            # Try api.hitem3d.ai with variations
            {
                "url": "https://api.hitem3d.ai/v1/generate",
                "method": "POST",
                "headers": {
                    "access-key": self.access_key,
                    "secret-key": self.secret_key,
                    "Content-Type": "application/json"
                },
                "payload": {
                    "image_url": image_url,
                    "resolution": resolution,
                    "format": "glb"
                }
            },
            # Try different paths on platform
            {
                "url": "https://platform.hitem3d.ai/api/v1/generate",
                "method": "POST",
                "headers": {
                    "access-key": self.access_key,
                    "secret-key": self.secret_key,
                    "Content-Type": "application/json"
                },
                "payload": {
                    "image_url": image_url,
                    "resolution": resolution,
                    "format": "glb"
                }
            },
            {
                "url": "https://platform.hitem3d.ai/api/create",
                "method": "POST",
                "headers": {
                    "access-key": self.access_key,
                    "secret-key": self.secret_key,
                    "Content-Type": "application/json"
                },
                "payload": {
                    "image_url": image_url,
                    "resolution": resolution,
                    "format": "glb"
                }
            }
        ]
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            for idx, config in enumerate(endpoints, 1):
                try:
                    print(f"\n🔍 Attempt {idx}: {config['url']}")
                    
                    response = await client.post(
                        config['url'],
                        headers=config['headers'],
                        json=config['payload']
                    )
                    
                    print(f"   Status: {response.status_code}")
                    
                    if response.status_code in [200, 201, 202]:
                        data = response.json()
                        print(f"   Response: {data}")
                        
                        # Extract task ID
                        task_id = (
                            data.get("task_id") or 
                            data.get("id") or 
                            data.get("job_id") or
                            data.get("request_id")
                        )
                        
                        if task_id:
                            return str(task_id)
                    else:
                        print(f"   Response: {response.text[:200]}")
                        
                except Exception as e:
                    print(f"   Error: {str(e)[:150]}")
                    continue
        
        return None
    
    async def _poll_completion(
        self, 
        task_id: str, 
        max_wait_time: int
    ) -> Optional[str]:
        """Poll for task completion"""
        
        start_time = time.time()
        poll_interval = 5
        
        # Try common status endpoint patterns
        status_urls = [
            f"https://api.hitem3d.ai/v1/status/{task_id}",
            f"https://api.hitem3d.com/v1/status/{task_id}",
            f"https://platform.hitem3d.ai/api/task/{task_id}"
        ]
        
        headers = {
            "X-Access-Key": self.access_key,
            "X-Secret-Key": self.secret_key,
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            while time.time() - start_time < max_wait_time:
                for url in status_urls:
                    try:
                        response = await client.get(url, headers=headers)
                        
                        if response.status_code == 200:
                            data = response.json()
                            status = data.get("status", "").lower()
                            
                            print(f"⏳ Task {task_id}: {status}")
                            
                            if status in ["completed", "done", "finished", "success"]:
                                model_url = (
                                    data.get("model_url") or
                                    data.get("glb_url") or
                                    data.get("download_url") or
                                    data.get("url") or
                                    (data.get("result") or {}).get("glb")
                                )
                                
                                if model_url:
                                    return str(model_url)
                            
                            elif status in ["failed", "error"]:
                                error = data.get("error") or "Unknown error"
                                print(f"❌ Generation failed: {error}")
                                return None
                            
                            # Still processing
                            break
                            
                    except Exception:
                        continue
                
                await asyncio.sleep(poll_interval)
        
        print(f"⏱️ Timeout after {max_wait_time}s")
        return None
