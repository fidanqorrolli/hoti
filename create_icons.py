#!/usr/bin/env python3

# Simple icon creation script using PIL
import os
from PIL import Image, ImageDraw

def create_app_icon(size, filename):
    # Create a new image with HotiEnergieTec brand colors
    img = Image.new('RGB', (size, size), color='#2c5aa0')
    draw = ImageDraw.Draw(img)
    
    # Add a simple icon design
    # Draw a house-like shape for heating/home services
    margin = size // 8
    
    # House base (rectangle)
    house_left = margin
    house_right = size - margin
    house_top = size // 2
    house_bottom = size - margin
    
    draw.rectangle([house_left, house_top, house_right, house_bottom], 
                  fill='white', outline='#1e3d6f', width=3)
    
    # House roof (triangle)
    roof_points = [
        (size // 2, margin),  # Top point
        (house_left, house_top),  # Left point
        (house_right, house_top)  # Right point
    ]
    draw.polygon(roof_points, fill='white', outline='#1e3d6f')
    
    # Door
    door_width = size // 6
    door_height = size // 4
    door_left = size // 2 - door_width // 2
    door_right = door_left + door_width
    door_top = house_bottom - door_height
    door_bottom = house_bottom
    
    draw.rectangle([door_left, door_top, door_right, door_bottom], 
                  fill='#1e3d6f')
    
    # Window
    window_size = size // 8
    window_left = house_left + margin // 2
    window_right = window_left + window_size
    window_top = house_top + margin // 2
    window_bottom = window_top + window_size
    
    draw.rectangle([window_left, window_top, window_right, window_bottom], 
                  fill='#4a7bc8', outline='#1e3d6f', width=2)
    
    # Save the image
    img.save(f'/app/frontend/public/{filename}')
    print(f"✅ Created {filename} ({size}x{size})")

# Create different sizes for PWA
create_app_icon(192, 'icon-192.png')
create_app_icon(512, 'icon-512.png')
create_app_icon(180, 'apple-touch-icon.png')  # iOS
create_app_icon(32, 'favicon-32x32.png')
create_app_icon(16, 'favicon-16x16.png')

print("🎉 All icons created successfully!")