#!/usr/bin/env python3
"""
Generate favicons for the Parserator website
"""

from PIL import Image
import os

def generate_favicons():
    logo_path = '/mnt/c/Users/millz/ParseratorMarketing/PARSERATOR-LOGO.png'
    website_dir = '/mnt/c/Users/millz/ParseratorMarketing/website'
    
    # Favicon sizes
    favicon_sizes = [
        (16, 'favicon-16x16.png'),
        (32, 'favicon-32x32.png'),
        (48, 'favicon-48x48.png'),
        (64, 'favicon-64x64.png'),
        (128, 'favicon-128x128.png'),
        (180, 'apple-touch-icon.png'),  # Apple touch icon
        (192, 'android-chrome-192x192.png'),  # Android
        (512, 'android-chrome-512x512.png')   # Android large
    ]
    
    # Open the original logo
    logo = Image.open(logo_path)
    
    # Convert to RGBA if not already
    if logo.mode != 'RGBA':
        logo = logo.convert('RGBA')
    
    print("Generating website favicons...")
    
    # Generate each favicon size
    for size, filename in favicon_sizes:
        print(f"Generating {filename} ({size}x{size})...")
        
        # Create a copy and resize
        favicon = logo.copy()
        favicon.thumbnail((size, size), Image.Resampling.LANCZOS)
        
        # Create a new image with exact dimensions
        final_favicon = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        
        # Paste the resized logo centered
        x = (size - favicon.width) // 2
        y = (size - favicon.height) // 2
        final_favicon.paste(favicon, (x, y))
        
        # Save the favicon
        output_path = os.path.join(website_dir, filename)
        final_favicon.save(output_path, 'PNG')
        print(f"✅ Generated {filename}")
    
    # Generate ICO file for favicon.ico
    print("Generating favicon.ico...")
    
    # Create multiple sizes for the ICO file
    ico_sizes = [16, 32, 48, 64]
    ico_images = []
    
    for size in ico_sizes:
        favicon = logo.copy()
        favicon.thumbnail((size, size), Image.Resampling.LANCZOS)
        
        final_favicon = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        x = (size - favicon.width) // 2
        y = (size - favicon.height) // 2
        final_favicon.paste(favicon, (x, y))
        
        ico_images.append(final_favicon)
    
    # Save as ICO file
    ico_path = os.path.join(website_dir, 'favicon.ico')
    ico_images[0].save(ico_path, format='ICO', sizes=[(img.width, img.height) for img in ico_images])
    print("✅ Generated favicon.ico")
    
    print("\n🎉 All favicons generated successfully!")

if __name__ == "__main__":
    generate_favicons()