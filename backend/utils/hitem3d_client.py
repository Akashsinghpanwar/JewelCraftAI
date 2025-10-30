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
        
        # Try multiple possible base URLs
        self.base_urls = [
            "https://platform.hitem3d.ai/api",
            "https://api.hitem3d.ai",
            "https://platform.hitem3d.ai/v1",
            "https://api.hitem3d.ai/v1"
        ]
        
        if not self.has_credentials:
            print("WARNING: Hitem3D API credentials not found in environment variables")
    
    def _get_auth_headers_variants(self) -> list[Dict[str, str]]:
        """Generate multiple authentication header variants to try"""
        return [
            # Variant 1: Simple header authentication
            {
                "X-Access-Key": self.access_key or '',
                "X-Secret-Key": self.secret_key or '',
                "Content-Type": "application/json"
            },
            # Variant 2: API Key prefixes
            {
                "X-API-Access-Key": self.access_key or '',
                "X-API-Secret-Key": self.secret_key or '',
                "Content-Type": "application/json"
            },
            # Variant 3: Bearer token
            {
                "Authorization": f"Bearer {self.access_key or ''}",
                "X-Secret-Key": self.secret_key or '',
                "Content-Type": "application/json"
            },
            # Variant 4: Basic Auth (base64 encoded)
            {
                "Authorization": f"Basic {base64.b64encode(f'{self.access_key}:{self.secret_key}'.encode()).decode()}",
                "Content-Type": "application/json"
            }
        ]
    
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
            # Try multiple payload variants
            payloads = [
                {
                    "image_url": image_url,
                    "resolution": resolution,
                    "format": "glb"
                },
                {
                    "image": image_url,
                    "resolution": str(resolution),
                    "texture": texture_enabled,
                    "format": "glb"
                },
                {
                    "input_image": image_url,
                    "output_resolution": resolution,
                    "output_format": "glb"
                }
            ]
            
            # Try multiple potential endpoint patterns
            endpoints = [
                "/generate",
                "/3d/generate", 
                "/image-to-3d",
                "/v1/generate",
                "/v1/3d",
                "/api/generate"
            ]
            
            auth_variants = self._get_auth_headers_variants()
            
            # Track unique responses to avoid spam
            logged_responses = set()
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                # Try all combinations of base URLs, endpoints, auth methods, and payloads
                for base_url in self.base_urls:
                    for endpoint in endpoints:
                        for auth_headers in auth_variants:
                            for payload in payloads:
                                try:
                                    url = f"{base_url}{endpoint}"
                                    response_key = f"{base_url}{endpoint}"
                                    
                                    # Only log first attempt per unique URL
                                    if response_key not in logged_responses:
                                        print(f"\n🔍 Trying: {url}")
                                        print(f"   Auth: variant {auth_variants.index(auth_headers) + 1}")
                                        print(f"   Payload keys: {list(payload.keys())}")
                                    
                                    response = await client.post(
                                        url,
                                        headers=auth_headers,
                                        json=payload
                                    )
                                    
                                    # Log response for first attempt per URL
                                    if response_key not in logged_responses:
                                        print(f"   📡 Status: {response.status_code}")
                                        print(f"   📄 Response: {response.text[:300]}")
                                        if response.headers.get("www-authenticate"):
                                            print(f"   🔐 WWW-Authenticate: {response.headers['www-authenticate']}")
                                        logged_responses.add(response_key)
                                    
                                    if response.status_code in [200, 201, 202]:
                                        data = response.json()
                                        print(f"\n✅ SUCCESS! Hitem3D responded from {url}")
                                        print(f"Response data: {data}")
                                        
                                        # Try to extract task ID from various response formats
                                        task_id = (
                                            data.get("task_id") or 
                                            data.get("id") or 
                                            data.get("job_id") or
                                            data.get("uuid") or
                                            data.get("request_id")
                                        )
                                        
                                        if task_id:
                                            print(f"Got task ID: {task_id}")
                                            return str(task_id)
                                        
                                except httpx.ConnectError as e:
                                    if response_key not in logged_responses:
                                        print(f"   ❌ Connection Error: {str(e)[:200]}")
                                        logged_responses.add(response_key)
                                    continue
                                except httpx.TimeoutException as e:
                                    if response_key not in logged_responses:
                                        print(f"   ⏱️ Timeout: {str(e)[:200]}")
                                        logged_responses.add(response_key)
                                    continue
                                except Exception as e:
                                    if response_key not in logged_responses:
                                        print(f"   ⚠️ Error: {type(e).__name__}: {str(e)[:200]}")
                                        logged_responses.add(response_key)
                                    continue
            
            print("All Hitem3D endpoint/auth combinations failed")
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
                f"/job/{task_id}",
                f"/v1/status/{task_id}",
                f"/api/status/{task_id}"
            ]
            
            auth_variants = self._get_auth_headers_variants()
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                while time.time() - start_time < max_wait_time:
                    # Try all combinations of base URLs, endpoints, and auth methods
                    for base_url in self.base_urls:
                        for endpoint in status_endpoints:
                            for auth_headers in auth_variants:
                                try:
                                    url = f"{base_url}{endpoint}"
                                    response = await client.get(url, headers=auth_headers)
                                    
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
                                    
                                    elif response.status_code not in [404, 405]:
                                        # Log non-404/405 errors
                                        print(f"  Poll error {response.status_code}: {response.text[:200]}")
                                        
                                except httpx.ConnectError:
                                    # Connection failed, skip silently
                                    continue
                                except Exception as e:
                                    # Skip other errors silently
                                    continue
                    
                    # Small delay before next poll iteration
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
