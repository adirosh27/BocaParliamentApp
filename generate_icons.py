#!/usr/bin/env python3
from PIL import Image
import os

# Icon sizes for Android
sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192
}

# Open the original logo
logo = Image.open('boca-logo.png')

# Create icons for each density
for folder, size in sizes.items():
    # Resize the image
    resized = logo.resize((size, size), Image.Resampling.LANCZOS)

    # Save to the appropriate folder
    output_dir = f'android/app/src/main/res/{folder}'
    os.makedirs(output_dir, exist_ok=True)

    # Save both launcher and round launcher
    resized.save(f'{output_dir}/ic_launcher.png')
    resized.save(f'{output_dir}/ic_launcher_round.png')

    print(f'Created {size}x{size} icons in {folder}')

print('\nAll icons generated successfully!')
