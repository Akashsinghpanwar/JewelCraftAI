import os
import httpx
import asyncio
import base64
from typing import Optional, Dict, Any
import time

class Hitem3DClient:
    """
    Client for Hitem3D API - converts images to 3D models (.glb format)
    API keys are stored securely in environment variables and never exposed to frontend
    """
    
    def __init__(self):
        self.access_key = os.getenv("HITEM3D_ACCESS_KEY")
        self.secret_key = os.getenv("HITEM3D_SECRET_KEY")
        self.has_credentials = bool(self.access_key and self.secret_key)
        
        # API base URL (assumed based on platform.hitem3d.ai)
        # This may need adjustment based on actual API documentation
        self.base_url = "https://api.hitem3d.ai/v1"
        
        if not self.has_credentials:
            print("WARNING: Hitem3D API credentials not found in environment variables")
    
    def _get_auth_headers(self) -> Dict[str, str]:
        """Generate authentication headers for API requests"""
        # Using Bearer token authentication with access key
        # If this doesn't work, may need to adjust based on actual API docs
        return {
            "Authorization": f"Bearer {self.access_key or ''}",
            "X-Hitem3D-Access-Key": self.access_key or '',
            "X-Hitem3D-Secret-Key": self.secret_key or '',
            "Content-Type": "application/json"
        }
    
    async def convert_image_to_3d(
        self, 
        image_url: str, 
        resolution: int = 1024,
        texture_enabled: bool = True,
        max_wait_time: int = 300
    ) -> str:
        """
        Convert a jewelry image to a 3D model (.glb format)
        
        Args:
            image_url: URL or base64 data URL of the jewelry image
            resolution: Resolution of 3D model (512, 1024, or 1536)
            texture_enabled: Whether to generate textures
            max_wait_time: Maximum time to wait for generation (seconds)
        
        Returns:
            URL to the generated .glb 3D model file
        """
        if not self.has_credentials:
            raise Exception("Hitem3D API credentials not configured")
        
        try:
            print(f"Starting Hitem3D 3D model generation (resolution: {resolution})")
            
            # Step 1: Submit image for 3D generation
            task_id = await self._submit_generation_task(
                image_url, 
                resolution, 
                texture_enabled
            )
            
            if not task_id:
                raise Exception("Failed to submit 3D generation task")
            
            print(f"Hitem3D task submitted: {task_id}")
            
            # Step 2: Poll for completion
            model_url = await self._poll_for_completion(task_id, max_wait_time)
            
            if not model_url:
                raise Exception("3D model generation failed or timed out")
            
            print(f"Hitem3D 3D model generated successfully: {model_url[:100]}...")
            return model_url
            
        except Exception as e:
            print(f"Error in Hitem3D 3D conversion: {e}")
            raise
    
    async def _submit_generation_task(
        self, 
        image_url: str, 
        resolution: int,
        texture_enabled: bool
    ) -> Optional[str]:
        """Submit an image for 3D generation and get task ID"""
        try:
            # Prepare request payload
            payload = {
                "image": image_url,
                "resolution": str(resolution),
                "texture": texture_enabled,
                "format": "glb"
            }
            
            # Try multiple potential endpoint patterns
            endpoints = [
                "/generate",
                "/3d/generate", 
                "/image-to-3d",
                "/v1/generate"
            ]
            
            headers = self._get_auth_headers()
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                for endpoint in endpoints:
                    try:
                        url = f"{self.base_url}{endpoint}"
                        print(f"Trying Hitem3D endpoint: {url}")
                        
                        response = await client.post(
                            url,
                            headers=headers,
                            json=payload
                        )
                        
                        if response.status_code in [200, 201, 202]:
                            data = response.json()
                            print(f"Hitem3D response: {data}")
                            
                            # Try to extract task ID from various response formats
                            task_id = (
                                data.get("task_id") or 
                                data.get("id") or 
                                data.get("job_id") or
                                data.get("uuid")
                            )
                            
                            if task_id:
                                return str(task_id)
                        
                        elif response.status_code == 404:
                            # Endpoint not found, try next one
                            continue
                        else:
                            print(f"Hitem3D API error {response.status_code}: {response.text[:500]}")
                            
                    except httpx.HTTPStatusError as e:
                        print(f"HTTP error for endpoint {endpoint}: {e}")
                        continue
                    except Exception as e:
                        print(f"Error with endpoint {endpoint}: {e}")
                        continue
            
            return None
            
        except Exception as e:
            print(f"Error submitting Hitem3D generation task: {e}")
            return None
    
    async def _poll_for_completion(
        self, 
        task_id: str, 
        max_wait_time: int
    ) -> Optional[str]:
        """Poll for task completion and return model URL"""
        try:
            start_time = time.time()
            poll_interval = 5  # seconds
            
            # Try multiple potential status endpoint patterns
            status_endpoints = [
                f"/status/{task_id}",
                f"/task/{task_id}",
                f"/3d/status/{task_id}",
                f"/job/{task_id}"
            ]
            
            headers = self._get_auth_headers()
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                while time.time() - start_time < max_wait_time:
                    for endpoint in status_endpoints:
                        try:
                            url = f"{self.base_url}{endpoint}"
                            response = await client.get(url, headers=headers)
                            
                            if response.status_code == 200:
                                data = response.json()
                                status = data.get("status", "").lower()
                                
                                print(f"Hitem3D task {task_id} status: {status}")
                                
                                # Check if completed
                                if status in ["completed", "done", "finished", "success"]:
                                    # Try to extract model URL from various response formats
                                    model_url = (
                                        data.get("model_url") or
                                        data.get("glb_url") or
                                        data.get("result_url") or
                                        data.get("download_url") or
                                        data.get("url") or
                                        (data.get("result") or {}).get("glb") or
                                        (data.get("output") or {}).get("model")
                                    )
                                    
                                    if model_url:
                                        return str(model_url)
                                
                                # Check if failed
                                elif status in ["failed", "error"]:
                                    error_msg = data.get("error") or data.get("message") or "Unknown error"
                                    raise Exception(f"Hitem3D generation failed: {error_msg}")
                                
                                # Still processing, wait and continue
                                await asyncio.sleep(poll_interval)
                                break  # Found working endpoint, use this one
                            
                            elif response.status_code == 404:
                                # Endpoint not found, try next one
                                continue
                                
                        except httpx.HTTPStatusError:
                            continue
                        except Exception as e:
                            print(f"Error polling endpoint {endpoint}: {e}")
                            continue
                    
                    # Small delay before next poll
                    await asyncio.sleep(poll_interval)
            
            # Timeout
            print(f"Hitem3D generation timed out after {max_wait_time} seconds")
            return None
            
        except Exception as e:
            print(f"Error polling for Hitem3D completion: {e}")
            return None
    
    async def download_image(self, url: str) -> bytes:
        """Download image from URL"""
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            return response.content
