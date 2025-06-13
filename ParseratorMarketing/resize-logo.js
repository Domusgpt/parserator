const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function generateIcons() {
  const logoPath = '/mnt/c/Users/millz/ParseratorMarketing/PARSERATOR-LOGO.png';
  const outputDir = '/mnt/c/Users/millz/ParseratorMarketing/Parserator-2025-06-11-BUILD-REFERENCE-FILES/chrome-extension/assets/icons';
  
  // Icon sizes needed for Chrome extension
  const sizes = [
    { size: 16, name: 'icon-16.png' },
    { size: 32, name: 'icon-32.png' },
    { size: 48, name: 'icon-48.png' },
    { size: 128, name: 'icon-128.png' }
  ];
  
  try {
    // Generate each icon size
    for (const { size, name } of sizes) {
      console.log(`Generating ${name} (${size}x${size})...`);
      
      await sharp(logoPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
        })
        .png()
        .toFile(path.join(outputDir, name));
      
      console.log(`✅ Generated ${name}`);
    }
    
    // Also generate Chrome Web Store promotional images
    console.log('\nGenerating promotional images...');
    
    // Small promo tile (440x280)
    await sharp(logoPath)
      .resize(280, 280, {
        fit: 'contain',
        background: { r: 15, g: 10, b: 28, alpha: 1 } // Dark purple background
      })
      .extend({
        top: 0,
        bottom: 0,
        left: 80,
        right: 80,
        background: { r: 15, g: 10, b: 28, alpha: 1 }
      })
      .png()
      .toFile(path.join(outputDir, '..', 'small-promo-tile.png'));
    
    console.log('✅ Generated small-promo-tile.png');
    
    // Marquee promo tile (1400x560)
    await sharp(logoPath)
      .resize(400, 400, {
        fit: 'contain',
        background: { r: 15, g: 10, b: 28, alpha: 1 } // Dark purple background
      })
      .extend({
        top: 80,
        bottom: 80,
        left: 500,
        right: 500,
        background: { r: 15, g: 10, b: 28, alpha: 1 }
      })
      .png()
      .toFile(path.join(outputDir, '..', 'marquee-promo-tile.png'));
    
    console.log('✅ Generated marquee-promo-tile.png');
    
    console.log('\n🎉 All icons generated successfully!');
    
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

// Check if sharp is available
try {
  require.resolve('sharp');
  generateIcons();
} catch (e) {
  console.log('Sharp not installed. Installing...');
  const { exec } = require('child_process');
  exec('npm install sharp', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error installing sharp: ${error}`);
      return;
    }
    console.log('Sharp installed successfully. Running icon generation...');
    generateIcons();
  });
}