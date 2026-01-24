# Icon Setup Guide

The Pantry Champion PWA requires icons in various sizes for optimal display on iOS devices.

## Quick Setup (Placeholder Icons)

1. Open `generate-icons.html` in your web browser
2. Icons will be automatically generated
3. Click "Download" for each icon size
4. Save them to `public/images/icons/` directory

## Professional Icons (Recommended)

For better-looking icons, use one of these methods:

### Method 1: Real Favicon Generator (Easiest)

1. Create or download a 512x512 PNG icon for Pantry Champion
2. Go to https://realfavicongenerator.net/
3. Upload your icon
4. Configure iOS-specific settings
5. Download the generated icon pack
6. Extract the icons to `public/images/icons/`

### Method 2: Manual Creation

Create PNG files in these sizes:
- icon-72.png (72x72)
- icon-96.png (96x96)
- icon-128.png (128x128)
- icon-144.png (144x144)
- icon-152.png (152x152)
- icon-192.png (192x192)
- icon-384.png (384x384)
- icon-512.png (512x512)

Design tips:
- Use the trophy emoji (🏆) or a pantry-related icon
- Primary color: #2c5f8d (blue)
- Keep design simple and recognizable at small sizes
- Ensure good contrast for visibility

### Method 3: Use Existing Icons

If you have design software (Sketch, Figma, Photoshop):

1. Create a 512x512 artboard
2. Design your icon (centered trophy or pantry symbol)
3. Export at all required sizes
4. Use "Export for iOS" if available

## Icon Design Ideas

**Simple Trophy:**
- Blue background (#2c5f8d)
- White or gold trophy icon
- Rounded corners for iOS style

**Pantry Theme:**
- Shelf illustration
- Food items
- Container symbols

**Minimal:**
- Just the trophy emoji 🏆
- Solid background
- Clean and modern

## Verification

After adding icons, check:

1. Files exist in `public/images/icons/`
2. Files are named correctly (icon-72.png, icon-96.png, etc.)
3. Files are PNG format
4. Test on iOS by adding to home screen

## Temporary Solution

If you need to test the app quickly without creating icons:

1. Use the `generate-icons.html` page
2. Or create a simple 512x512 PNG and resize it to all required sizes using an online tool
3. Use tools like:
   - https://www.iloveimg.com/resize-image
   - https://imageresizer.com/

The generated placeholder icons will work, but creating custom icons will make your app look more professional.
