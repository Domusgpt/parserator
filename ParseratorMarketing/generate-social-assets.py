#!/usr/bin/env python3
"""
Generate social media assets for Parserator
"""

from PIL import Image, ImageDraw, ImageFont
import os

def generate_social_assets():
    logo_path = '/mnt/c/Users/millz/ParseratorMarketing/PARSERATOR-LOGO.png'
    output_dir = '/mnt/c/Users/millz/ParseratorMarketing'
    
    # Social media sizes
    social_assets = [
        (400, 400, 'twitter-profile.png'),        # Twitter profile
        (1500, 500, 'twitter-header.png'),        # Twitter header  
        (1200, 630, 'og-image.png'),              # Open Graph
        (1080, 1080, 'instagram-post.png'),       # Instagram post
        (1200, 1200, 'linkedin-post.png'),        # LinkedIn post
    ]
    
    # Open the original logo
    logo = Image.open(logo_path)
    
    # Convert to RGBA if not already
    if logo.mode != 'RGBA':
        logo = logo.convert('RGBA')
    
    # Colors from the brand
    dark_purple = (15, 10, 28, 255)  # Dark purple background
    neon_teal = (0, 217, 255, 255)   # Neon teal
    vapor_pink = (255, 16, 240, 255) # Vapor pink
    
    print("Generating social media assets...")
    
    # Generate each social media asset
    for width, height, filename in social_assets:
        print(f"Generating {filename} ({width}x{height})...")
        
        # Create background with gradient effect
        asset = Image.new('RGBA', (width, height), dark_purple)
        
        # Add gradient overlay
        gradient = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(gradient)
        
        # Create a subtle gradient
        for i in range(height):
            alpha = int(20 * (i / height))  # Subtle gradient
            color = (*dark_purple[:3], alpha)
            draw.line([(0, i), (width, i)], fill=color)
        
        asset = Image.alpha_composite(asset, gradient)
        
        # Calculate logo size based on canvas
        if 'header' in filename:
            # For headers, use smaller logo
            logo_size = min(width // 6, height - 40)
        elif 'profile' in filename:
            # For profile pics, use large logo
            logo_size = min(width - 40, height - 40)
        else:
            # For posts, use medium logo
            logo_size = min(width // 4, height // 4)
        
        # Resize logo
        logo_resized = logo.copy()
        logo_resized.thumbnail((logo_size, logo_size), Image.Resampling.LANCZOS)
        
        # Position logo (center for most, left for header)
        if 'header' in filename:
            # Left side for header
            x = 40
            y = (height - logo_resized.height) // 2
        else:
            # Center for others
            x = (width - logo_resized.width) // 2
            y = (height - logo_resized.height) // 2
        
        # Paste logo with glow effect
        asset.paste(logo_resized, (x, y), logo_resized)
        
        # Add text for some assets
        if 'header' in filename or 'og-image' in filename:
            draw = ImageDraw.Draw(asset)
            
            # Try to load a font (fallback to default if not available)
            try:
                font_large = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 60)
                font_small = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 30)
            except:
                try:
                    font_large = ImageFont.truetype("arial.ttf", 60)
                    font_small = ImageFont.truetype("arial.ttf", 30)
                except:
                    font_large = ImageFont.load_default()
                    font_small = ImageFont.load_default()
            
            if 'header' in filename:
                # Add text to right of logo
                text_x = x + logo_resized.width + 40
                text_y = y - 20
                
                draw.text((text_x, text_y), "PARSERATOR", fill=neon_teal, font=font_large)
                draw.text((text_x, text_y + 80), "AI Agent Data Parsing", fill=(255, 255, 255, 200), font=font_small)
                draw.text((text_x, text_y + 120), "Architect-Extractor Pattern • EMA Compliant", fill=(200, 200, 200, 180), font=font_small)
            
            elif 'og-image' in filename:
                # Center text below logo
                text_y = y + logo_resized.height + 40
                
                # Get text dimensions for centering
                text1 = "PARSERATOR"
                text2 = "Intelligent Data Parsing for AI Agents"
                
                bbox1 = draw.textbbox((0, 0), text1, font=font_large)
                bbox2 = draw.textbbox((0, 0), text2, font=font_small)
                
                text1_width = bbox1[2] - bbox1[0]
                text2_width = bbox2[2] - bbox2[0]
                
                draw.text(((width - text1_width) // 2, text_y), text1, fill=neon_teal, font=font_large)
                draw.text(((width - text2_width) // 2, text_y + 80), text2, fill=(255, 255, 255, 200), font=font_small)
        
        # Save the asset
        output_path = os.path.join(output_dir, filename)
        asset.save(output_path, 'PNG')
        print(f"✅ Generated {filename}")
    
    print("\n🎉 All social media assets generated successfully!")
    print("\nGenerated files:")
    for _, _, filename in social_assets:
        print(f"  - {filename}")

if __name__ == "__main__":
    generate_social_assets()