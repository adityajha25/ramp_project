import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const logoPath = path.join(__dirname, '..', 'public', 'logo.png');

fs.mkdirSync(iconsDir, { recursive: true });

if (!fs.existsSync(logoPath)) {
  console.error('Missing public/logo.png — cannot generate PWA icons.');
  process.exit(1);
}

for (const size of [180, 192, 512]) {
  const out = path.join(iconsDir, `icon-${size}.png`);
  execSync(`sips -z ${size} ${size} "${logoPath}" --out "${out}"`, { stdio: 'inherit' });
}

console.log('Generated PWA icons (180, 192, 512) from public/logo.png');
