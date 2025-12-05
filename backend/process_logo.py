import os
from rembg import remove
from PIL import Image
import io

input_path = r"C:/Users/akash/.gemini/antigravity/brain/d5fb66e9-2497-4076-92b2-7f3fc057920e/uploaded_image_1764043205000.jpg"
output_path = r"c:/Users/akash/OneDrive - Axess Corrosion/Desktop/blinkg/JewelCraftAI/frontend/public/logo.png"

# Ensure directory exists
os.makedirs(os.path.dirname(output_path), exist_ok=True)

print(f"Processing {input_path}...")

with open(input_path, 'rb') as i:
    input_data = i.read()
    output_data = remove(
        input_data,
        alpha_matting=True,
        alpha_matting_foreground_threshold=240,
        alpha_matting_background_threshold=10,
        alpha_matting_erode_size=10
    )
    
    with open(output_path, 'wb') as o:
        o.write(output_data)

print(f"Saved transparent logo to {output_path}")
