const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const generateSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Fond doré avec dégradé -->
  <defs>
    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#D4AF6A;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#B39562;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
      <feOffset dx="0" dy="2" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.3"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Fond principal -->
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#goldGradient)"/>

  <!-- Bordure subtile -->
  <rect x="${size * 0.05}" y="${size * 0.05}" width="${size * 0.9}" height="${size * 0.9}"
        rx="${size * 0.12}" fill="none" stroke="#FFFFFF" stroke-width="${size * 0.01}" opacity="0.3"/>

  <!-- Texte DPM -->
  <text x="50%" y="50%"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${size * 0.35}"
        font-weight="bold"
        fill="#FFFFFF"
        text-anchor="middle"
        dominant-baseline="central"
        filter="url(#shadow)">
    DPM
  </text>

  <!-- Accent décoratif -->
  <circle cx="${size * 0.85}" cy="${size * 0.15}" r="${size * 0.05}" fill="#FFFFFF" opacity="0.4"/>
  <circle cx="${size * 0.15}" cy="${size * 0.85}" r="${size * 0.03}" fill="#FFFFFF" opacity="0.3"/>
</svg>`;

console.log('🎨 Génération des icônes PWA...\n');

sizes.forEach(size => {
  const svg = generateSVG(size);
  const filename = `icon-${size}x${size}.png`;
  const svgPath = path.join(__dirname, 'public', `icon-${size}x${size}.svg`);

  fs.writeFileSync(svgPath, svg);
  console.log(`✅ Créé: ${filename} (SVG temporaire)`);
});

console.log('\n📦 Icônes SVG créées dans /public');
console.log('💡 Pour convertir en PNG de haute qualité:');
console.log('   1. Ouvrez chaque SVG dans un navigateur');
console.log('   2. Faites clic droit > Enregistrer l\'image sous... > PNG');
console.log('   OU utilisez un outil comme ImageMagick/Inkscape\n');

const faviconSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#D4AF6A;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#B39562;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="5" fill="url(#goldGradient)"/>
  <text x="50%" y="50%"
        font-family="Arial, sans-serif"
        font-size="14"
        font-weight="bold"
        fill="#FFFFFF"
        text-anchor="middle"
        dominant-baseline="central">
    D
  </text>
</svg>`;

fs.writeFileSync(path.join(__dirname, 'public', 'favicon.svg'), faviconSVG);
console.log('✅ Créé: favicon.svg\n');

console.log('🎉 Génération terminée !');
