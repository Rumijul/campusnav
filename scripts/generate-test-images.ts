/**
 * Generate test floor plan images for development.
 * Run: npx tsx scripts/generate-test-images.ts
 */

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const assetsDir = resolve(__dirname, '../src/server/assets')

const FULL_WIDTH = 1600
const FULL_HEIGHT = 1000
const THUMB_WIDTH = 400

/**
 * Build an SVG string that resembles a basic floor plan.
 * Uses colored rectangles for rooms, lines for hallways, and text labels.
 */
function buildFloorPlanSVG(w: number, h: number): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <!-- Background -->
  <rect width="${w}" height="${h}" fill="#f9fafb"/>
  
  <!-- Building outline -->
  <rect x="80" y="60" width="${w - 160}" height="${h - 120}" fill="none" stroke="#374151" stroke-width="3"/>
  
  <!-- Main horizontal hallway -->
  <rect x="80" y="${h * 0.42}" width="${w - 160}" height="${h * 0.16}" fill="#e5e7eb" stroke="#9ca3af" stroke-width="1"/>
  
  <!-- Left vertical hallway -->
  <rect x="${w * 0.28}" y="60" width="${w * 0.08}" height="${h - 120}" fill="#e5e7eb" stroke="#9ca3af" stroke-width="1"/>
  
  <!-- Right vertical hallway -->
  <rect x="${w * 0.64}" y="60" width="${w * 0.08}" height="${h - 120}" fill="#e5e7eb" stroke="#9ca3af" stroke-width="1"/>

  <!-- Top-left rooms -->
  <rect x="100" y="80" width="${w * 0.12}" height="${h * 0.15}" fill="#dbeafe" stroke="#3b82f6" stroke-width="2" rx="4"/>
  <text x="${100 + (w * 0.12) / 2}" y="${80 + (h * 0.15) / 2}" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="${Math.round(w * 0.012)}" fill="#1e40af">Room 101</text>
  
  <rect x="${100 + w * 0.14}" y="80" width="${w * 0.12}" height="${h * 0.15}" fill="#dbeafe" stroke="#3b82f6" stroke-width="2" rx="4"/>
  <text x="${100 + w * 0.14 + (w * 0.12) / 2}" y="${80 + (h * 0.15) / 2}" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="${Math.round(w * 0.012)}" fill="#1e40af">Room 102</text>

  <!-- Top-right rooms -->
  <rect x="${w * 0.72 + 20}" y="80" width="${w * 0.12}" height="${h * 0.15}" fill="#dcfce7" stroke="#22c55e" stroke-width="2" rx="4"/>
  <text x="${w * 0.72 + 20 + (w * 0.12) / 2}" y="${80 + (h * 0.15) / 2}" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="${Math.round(w * 0.012)}" fill="#15803d">Lab A</text>
  
  <rect x="${w * 0.86 + 10}" y="80" width="${w * 0.12}" height="${h * 0.15}" fill="#dcfce7" stroke="#22c55e" stroke-width="2" rx="4"/>
  <text x="${w * 0.86 + 10 + (w * 0.12) / 2}" y="${80 + (h * 0.15) / 2}" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="${Math.round(w * 0.012)}" fill="#15803d">Lab B</text>

  <!-- Bottom-left rooms -->
  <rect x="100" y="${h * 0.62}" width="${w * 0.12}" height="${h * 0.15}" fill="#fef3c7" stroke="#f59e0b" stroke-width="2" rx="4"/>
  <text x="${100 + (w * 0.12) / 2}" y="${h * 0.62 + (h * 0.15) / 2}" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="${Math.round(w * 0.012)}" fill="#92400e">Room 201</text>
  
  <rect x="${100 + w * 0.14}" y="${h * 0.62}" width="${w * 0.12}" height="${h * 0.15}" fill="#fef3c7" stroke="#f59e0b" stroke-width="2" rx="4"/>
  <text x="${100 + w * 0.14 + (w * 0.12) / 2}" y="${h * 0.62 + (h * 0.15) / 2}" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="${Math.round(w * 0.012)}" fill="#92400e">Room 202</text>

  <!-- Bottom-right rooms -->
  <rect x="${w * 0.72 + 20}" y="${h * 0.62}" width="${w * 0.12}" height="${h * 0.15}" fill="#ede9fe" stroke="#8b5cf6" stroke-width="2" rx="4"/>
  <text x="${w * 0.72 + 20 + (w * 0.12) / 2}" y="${h * 0.62 + (h * 0.15) / 2}" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="${Math.round(w * 0.012)}" fill="#6d28d9">Office 301</text>
  
  <rect x="${w * 0.86 + 10}" y="${h * 0.62}" width="${w * 0.12}" height="${h * 0.15}" fill="#ede9fe" stroke="#8b5cf6" stroke-width="2" rx="4"/>
  <text x="${w * 0.86 + 10 + (w * 0.12) / 2}" y="${h * 0.62 + (h * 0.15) / 2}" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="${Math.round(w * 0.012)}" fill="#6d28d9">Office 302</text>

  <!-- Center area - Lobby -->
  <rect x="${w * 0.36 + 10}" y="${h * 0.12}" width="${w * 0.26}" height="${h * 0.25}" fill="#fce7f3" stroke="#ec4899" stroke-width="2" rx="8"/>
  <text x="${w * 0.36 + 10 + (w * 0.26) / 2}" y="${h * 0.12 + (h * 0.25) / 2}" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="${Math.round(w * 0.018)}" font-weight="bold" fill="#9d174d">Main Lobby</text>

  <!-- Center area - Cafeteria -->
  <rect x="${w * 0.36 + 10}" y="${h * 0.62}" width="${w * 0.26}" height="${h * 0.25}" fill="#ccfbf1" stroke="#14b8a6" stroke-width="2" rx="8"/>
  <text x="${w * 0.36 + 10 + (w * 0.26) / 2}" y="${h * 0.62 + (h * 0.25) / 2}" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="${Math.round(w * 0.018)}" font-weight="bold" fill="#0f766e">Cafeteria</text>

  <!-- Entrance markers -->
  <rect x="${w / 2 - 30}" y="${h - 62}" width="60" height="8" fill="#ef4444" rx="2"/>
  <text x="${w / 2}" y="${h - 30}" text-anchor="middle" font-family="Arial" font-size="${Math.round(w * 0.01)}" font-weight="bold" fill="#ef4444">ENTRANCE</text>

  <!-- Elevator icon (top-right area) -->
  <rect x="${w * 0.62}" y="75" width="30" height="30" fill="#6366f1" rx="4"/>
  <text x="${w * 0.62 + 15}" y="96" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="white">E</text>
  <text x="${w * 0.62 + 15}" y="120" text-anchor="middle" font-family="Arial" font-size="${Math.round(w * 0.008)}" fill="#6366f1">Elevator</text>

  <!-- Stairs icon -->
  <rect x="${w * 0.28 + 5}" y="75" width="30" height="30" fill="#f97316" rx="4"/>
  <text x="${w * 0.28 + 20}" y="96" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="white">S</text>
  <text x="${w * 0.28 + 20}" y="120" text-anchor="middle" font-family="Arial" font-size="${Math.round(w * 0.008)}" fill="#f97316">Stairs</text>

  <!-- Restroom icons -->
  <rect x="${w * 0.48}" y="${h * 0.42 + 5}" width="24" height="24" fill="#64748b" rx="3"/>
  <text x="${w * 0.48 + 12}" y="${h * 0.42 + 22}" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="white">WC</text>

  <!-- Floor label -->
  <text x="${w / 2}" y="40" text-anchor="middle" font-family="Arial" font-size="${Math.round(w * 0.016)}" font-weight="bold" fill="#374151">Engineering Building — Floor 1</text>
</svg>`
}

async function main() {
  console.log('Generating test floor plan images...')

  const svg = buildFloorPlanSVG(FULL_WIDTH, FULL_HEIGHT)
  const svgBuffer = Buffer.from(svg)

  // Full-size PNG
  await sharp(svgBuffer)
    .resize(FULL_WIDTH, FULL_HEIGHT)
    .png()
    .toFile(resolve(assetsDir, 'floor-plan.png'))

  console.log(`✓ floor-plan.png (${FULL_WIDTH}x${FULL_HEIGHT})`)

  // Thumbnail JPEG
  const thumbHeight = Math.round(FULL_HEIGHT * (THUMB_WIDTH / FULL_WIDTH))
  await sharp(svgBuffer)
    .resize(THUMB_WIDTH, thumbHeight)
    .jpeg({ quality: 70 })
    .toFile(resolve(assetsDir, 'floor-plan-thumb.jpg'))

  console.log(`✓ floor-plan-thumb.jpg (${THUMB_WIDTH}x${thumbHeight})`)
  console.log('Done!')
}

main().catch((err) => {
  console.error('Failed to generate images:', err)
  process.exit(1)
})
