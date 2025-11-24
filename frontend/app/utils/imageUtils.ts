/**
 * Decode HTML entities in image URLs
 * Fixes &amp; to & and other common HTML entities
 */
export function decodeImageUrl(url: string): string {
  if (!url) return url;
  
  return url
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Preload an image with retry logic
 */
export async function preloadImage(url: string, retries = 3): Promise<HTMLImageElement> {
  const cleanUrl = decodeImageUrl(url);
  
  for (let i = 0; i < retries; i++) {
    try {
      const img = new Image();
      
      // Only set crossOrigin for remote URLs, not for data URLs
      if (!cleanUrl.startsWith("data:")) {
        img.crossOrigin = "anonymous";
      }
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = cleanUrl;
        
        // Timeout after 10 seconds
        setTimeout(() => reject(new Error("Image load timeout")), 10000);
      });
      
      return img;
    } catch (err) {
      if (i === retries - 1) throw err;
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  throw new Error("Failed to load image after retries");
}
