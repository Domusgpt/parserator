#!/usr/bin/env python3
"""
Resize Parserator logo for Chrome extension icons and promotional images
"""

from PIL import Image
import os

def generate_icons():
    logo_path = '/mnt/c/Users/millz/ParseratorMarketing/PARSERATOR-LOGO.png'
    chrome_icons_dir = '/mnt/c/Users/millz/ParseratorMarketing/Parserator-2025-06-11-BUILD-REFERENCE-FILES/chrome-extension/assets/icons'
    chrome_ext_dir = '/mnt/c/Users/millz/ParseratorMarketing/Parserator-2025-06-11-BUILD-REFERENCE-FILES/chrome-extension'
    
    # Icon sizes for Chrome extension
    icon_sizes = [
        (16, 'icon-16.png'),
        (32, 'icon-32.png'),
        (48, 'icon-48.png'),
        (128, 'icon-128.png')
    ]
    
    # Open the original logo
    logo = Image.open(logo_path)
    
    # Convert to RGBA if not already
    if logo.mode != 'RGBA':
        logo = logo.convert('RGBA')
    
    # Generate each icon size
    for size, filename in icon_sizes:
        print(f"Generating {filename} ({size}x{size})...")
        
        # Create a copy and resize
        icon = logo.copy()
        icon.thumbnail((size, size), Image.Resampling.LANCZOS)
        
        # Create a new image with exact dimensions
        final_icon = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        
        # Paste the resized logo centered
        x = (size - icon.width) // 2
        y = (size - icon.height) // 2
        final_icon.paste(icon, (x, y))
        
        # Save the icon
        output_path = os.path.join(chrome_icons_dir, filename)
        final_icon.save(output_path, 'PNG')
        print(f"✅ Generated {filename}")
    
    # Generate promotional images
    print("\nGenerating promotional images...")
    
    # Small promo tile (440x280)
    dark_purple = (15, 10, 28, 255)  # Dark purple background
    
    small_promo = Image.new('RGBA', (440, 280), dark_purple)
    logo_resized = logo.copy()
    logo_resized.thumbnail((200, 200), Image.Resampling.LANCZOS)
    
    # Center the logo
    x = (440 - logo_resized.width) // 2
    y = (280 - logo_resized.height) // 2
    small_promo.paste(logo_resized, (x, y), logo_resized)
    
    small_promo_path = os.path.join(chrome_ext_dir, 'small-promo-tile.png')
    small_promo.save(small_promo_path, 'PNG')
    print("✅ Generated small-promo-tile.png")
    
    # Marquee promo tile (1400x560)
    marquee_promo = Image.new('RGBA', (1400, 560), dark_purple)
    logo_large = logo.copy()
    logo_large.thumbnail((400, 400), Image.Resampling.LANCZOS)
    
    # Center the logo
    x = (1400 - logo_large.width) // 2
    y = (560 - logo_large.height) // 2
    marquee_promo.paste(logo_large, (x, y), logo_large)
    
    marquee_promo_path = os.path.join(chrome_ext_dir, 'marquee-promo-tile.png')
    marquee_promo.save(marquee_promo_path, 'PNG')
    print("✅ Generated marquee-promo-tile.png")
    
    print("\n🎉 All icons generated successfully!")

if __name__ == "__main__":
    try:
        from PIL import Image
        generate_icons()
    except ImportError:
        print("Pillow not installed. Please install it with: pip install Pillow")
        print("Or run: python -m pip install Pillow")