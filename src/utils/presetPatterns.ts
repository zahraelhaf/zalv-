export interface PresetPatternDef {
  id: string;
  name: string;
  category: string;
  svgContent: (fgColor: string, bgColor: string) => string;
}

export const PRESET_PATTERNS: PresetPatternDef[] = [
  {
    id: 'botanical_leaves',
    name: 'Botanical Leaves',
    category: 'Nature',
    svgContent: (fg, bg) => `
      <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
        <rect width="60" height="60" fill="${bg}"/>
        <path d="M15 15 C 25 5, 35 15, 30 30 C 20 30, 10 25, 15 15 Z" fill="none" stroke="${fg}" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M15 15 Q 22 22 30 30" stroke="${fg}" stroke-width="0.8" stroke-dasharray="1 2"/>
        <path d="M45 45 C 55 35, 65 45, 60 60 C 50 60, 40 55, 45 45 Z" fill="none" stroke="${fg}" stroke-width="1.2" stroke-linecap="round"/>
        <circle cx="10" cy="50" r="2.5" fill="${fg}" opacity="0.6"/>
        <circle cx="50" cy="15" r="2" fill="${fg}" opacity="0.6"/>
      </svg>
    `,
  },
  {
    id: 'moroccan_lattice',
    name: 'Moroccan Quatrefoil',
    category: 'Geometric',
    svgContent: (fg, bg) => `
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <rect width="48" height="48" fill="${bg}"/>
        <path d="M24 0 C28 8 36 8 40 12 C44 16 44 24 48 24 C44 24 44 32 40 36 C36 40 28 40 24 48 C20 40 12 40 8 36 C4 32 4 24 0 24 C4 24 4 16 8 12 C12 8 20 8 24 0 Z" fill="none" stroke="${fg}" stroke-width="1"/>
      </svg>
    `,
  },
  {
    id: 'art_deco_fan',
    name: 'Art Deco Arch',
    category: 'Vintage',
    svgContent: (fg, bg) => `
      <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
        <rect width="50" height="50" fill="${bg}"/>
        <path d="M0 50 A 25 25 0 0 1 50 50 M10 50 A 15 15 0 0 1 40 50 M20 50 A 5 5 0 0 1 30 50" fill="none" stroke="${fg}" stroke-width="1"/>
        <path d="M-25 0 A 25 25 0 0 1 25 0 M25 0 A 25 25 0 0 1 75 0" fill="none" stroke="${fg}" stroke-width="1"/>
      </svg>
    `,
  },
  {
    id: 'minimal_cross_grid',
    name: 'Architect Cross Grid',
    category: 'Minimalist',
    svgContent: (fg, bg) => `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <rect width="32" height="32" fill="${bg}"/>
        <line x1="16" y1="12" x2="16" y2="20" stroke="${fg}" stroke-width="1"/>
        <line x1="12" y1="16" x2="20" y2="16" stroke="${fg}" stroke-width="1"/>
        <circle cx="0" cy="0" r="1" fill="${fg}"/>
        <circle cx="32" cy="0" r="1" fill="${fg}"/>
        <circle cx="0" cy="32" r="1" fill="${fg}"/>
        <circle cx="32" cy="32" r="1" fill="${fg}"/>
      </svg>
    `,
  },
  {
    id: 'celestial_stars',
    name: 'Celestial Constellation',
    category: 'Cosmic',
    svgContent: (fg, bg) => `
      <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
        <rect width="56" height="56" fill="${bg}"/>
        <polygon points="28,18 30,25 37,28 30,31 28,38 26,31 19,28 26,25" fill="${fg}"/>
        <circle cx="8" cy="12" r="1.5" fill="${fg}"/>
        <circle cx="48" cy="44" r="1.2" fill="${fg}"/>
        <circle cx="44" cy="10" r="1" fill="${fg}"/>
        <circle cx="12" cy="46" r="1.5" fill="${fg}"/>
      </svg>
    `,
  },
  {
    id: 'japanese_asanoha',
    name: 'Japanese Hemp (Asanoha)',
    category: 'Geometric',
    svgContent: (fg, bg) => `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <rect width="40" height="40" fill="${bg}"/>
        <line x1="20" y1="0" x2="20" y2="40" stroke="${fg}" stroke-width="0.8"/>
        <line x1="0" y1="20" x2="40" y2="20" stroke="${fg}" stroke-width="0.8"/>
        <polygon points="20,0 40,20 20,40 0,20" fill="none" stroke="${fg}" stroke-width="0.8"/>
        <line x1="0" y1="0" x2="40" y2="40" stroke="${fg}" stroke-width="0.5"/>
        <line x1="40" y1="0" x2="0" y2="40" stroke="${fg}" stroke-width="0.5"/>
      </svg>
    `,
  },
];

export function svgToDataUrl(svgString: string): string {
  const cleaned = svgString.trim().replace(/\s+/g, ' ');
  return `data:image/svg+xml;utf8,${encodeURIComponent(cleaned)}`;
}

export function createTiledCanvas(
  imgSource: string,
  tileWidth: number,
  tileHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  repeatMode: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat' | 'stagger',
  opacity: number,
  backgroundColor: string
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve('');
      return;
    }

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.save();
      ctx.globalAlpha = opacity;

      if (repeatMode === 'no-repeat') {
        const x = (canvasWidth - tileWidth) / 2;
        const y = (canvasHeight - tileHeight) / 2;
        ctx.drawImage(img, x, y, tileWidth, tileHeight);
      } else if (repeatMode === 'repeat-x') {
        const y = (canvasHeight - tileHeight) / 2;
        for (let x = 0; x < canvasWidth; x += tileWidth) {
          ctx.drawImage(img, x, y, tileWidth, tileHeight);
        }
      } else if (repeatMode === 'repeat-y') {
        const x = (canvasWidth - tileWidth) / 2;
        for (let y = 0; y < canvasHeight; y += tileHeight) {
          ctx.drawImage(img, x, y, tileWidth, tileHeight);
        }
      } else if (repeatMode === 'stagger') {
        let row = 0;
        for (let y = 0; y < canvasHeight; y += tileHeight) {
          const xOffset = row % 2 === 1 ? tileWidth / 2 : 0;
          for (let x = -tileWidth; x < canvasWidth + tileWidth; x += tileWidth) {
            ctx.drawImage(img, x + xOffset, y, tileWidth, tileHeight);
          }
          row++;
        }
      } else {
        // standard repeat
        for (let y = 0; y < canvasHeight; y += tileHeight) {
          for (let x = 0; x < canvasWidth; x += tileWidth) {
            ctx.drawImage(img, x, y, tileWidth, tileHeight);
          }
        }
      }
      ctx.restore();
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      resolve(canvas.toDataURL('image/png'));
    };

    img.src = imgSource;
  });
}
