import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const logoPath = path.join(__dirname, '..', 'public', 'logo.png');
const SIZES = [180, 192, 512];

function iconsAlreadyPresent() {
  return SIZES.every((size) => fs.existsSync(path.join(iconsDir, `icon-${size}.png`)));
}

async function main() {
  fs.mkdirSync(iconsDir, { recursive: true });

  if (!fs.existsSync(logoPath)) {
    if (iconsAlreadyPresent()) {
      console.log('Missing public/logo.png, but committed PWA icons are present. Skipping generation.');
      return;
    }

    console.error('Missing public/logo.png and no PWA icons found in public/icons/.');
    process.exit(1);
  }

  for (const size of SIZES) {
    const out = path.join(iconsDir, `icon-${size}.png`);
    await sharp(logoPath)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(out);
  }

  console.log('Generated PWA icons (180, 192, 512) from public/logo.png');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
