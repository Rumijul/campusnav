import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';

const sql = neon(process.env.DATABASE_URL!);

// Load geometries
const geometries = {
  "1stfloor": JSON.parse(readFileSync('/tmp/geometry_1stfloor.json', 'utf8')),
  "2ndfloor": JSON.parse(readFileSync('/tmp/geometry_2ndfloor.json', 'utf8')),
  "3rdfloor": JSON.parse(readFileSync('/tmp/geometry_3rdfloor.json', 'utf8')),
};

// Floor mapping: floor_number -> id
// From DB query: floor_number 2 -> id 37, floor_number 1 -> id 38
const floorMap: Record<string, { id: number; floor_number: number }> = {
  "1stfloor": { id: 38, floor_number: 1 },
  "2ndfloor": { id: 37, floor_number: 2 },
  "3rdfloor": { id: null!, floor_number: 3 }, // Will create this one
};

async function uploadGeometry(floorId: number, geometry: object) {
  console.log(`Uploading geometry to floor ${floorId}...`);
  
  try {
    await sql`
      UPDATE floors 
      SET geometry = ${JSON.stringify(geometry)}, 
          updated_at = NOW() 
      WHERE id = ${floorId}
    `;
    console.log(`  ✓ Floor ${floorId} updated`);
    return true;
  } catch (err) {
    console.error(`  ✗ Failed to update floor ${floorId}:`, err);
    return false;
  }
}

async function createFloor(buildingId: number, floorNumber: number) {
  console.log(`Creating floor ${floorNumber} for building ${buildingId}...`);
  
  try {
    const result = await sql`
      INSERT INTO floors (building_id, floor_number, image_path, updated_at)
      VALUES (${buildingId}, ${floorNumber}, 'floor-plan.png', NOW())
      RETURNING id
    `;
    const floorId = result[0]?.id;
    console.log(`  ✓ Created floor with id: ${floorId}`);
    return floorId;
  } catch (err) {
    console.error(`  ✗ Failed to create floor:`, err);
    return null;
  }
}

async function main() {
  console.log('Starting geometry upload...\n');
  
  // Update existing floors
  for (const [name, info] of Object.entries(floorMap)) {
    if (info.id === null) {
      // Create 3rd floor first
      const newId = await createFloor(30, info.floor_number);
      if (newId) {
        floorMap[name].id = newId;
      } else {
        console.log(`Skipping ${name} - could not create floor`);
        continue;
      }
    }
    
    const geometry = geometries[name];
    await uploadGeometry(info.id, geometry);
  }
  
  console.log('\nDone!');
}

main().catch(console.error);