// Simple script to run migration and upload geometry
// Run with: npx tsx --env-file=.env scripts/migrate-and-upload.ts

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('Running migrations...');
  
  // Run migrations
  const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(migrationClient);
  
  await migrate(db, { migrationsFolder: resolve(__dirname, '../drizzle') });
  await migrationClient.end();
  
  console.log('Migrations complete!\n');
  
  // Now upload geometry
  const sql = neon(process.env.DATABASE_URL!);
  
  // Load geometries
  const geometries = {
    "1stfloor": JSON.parse(readFileSync('/tmp/geometry_1stfloor.json', 'utf8')),
    "2ndfloor": JSON.parse(readFileSync('/tmp/geometry_2ndfloor.json', 'utf8')),
    "3rdfloor": JSON.parse(readFileSync('/tmp/geometry_3rdfloor.json', 'utf8')),
  };
  
  // Floor mapping
  const floorMap: Record<string, { id: number; floor_number: number }> = {
    "1stfloor": { id: 38, floor_number: 1 },
    "2ndfloor": { id: 37, floor_number: 2 },
    "3rdfloor": { id: 39, floor_number: 3 },
  };
  
  console.log('Uploading geometries...');
  
  for (const [name, info] of Object.entries(floorMap)) {
    const geometry = geometries[name];
    console.log(`Updating floor ${info.id} (${name})...`);
    
    try {
      await sql`
        UPDATE floors 
        SET geometry = ${JSON.stringify(geometry)}, 
            updated_at = NOW() 
        WHERE id = ${info.id}
      `;
      console.log(`  ✓ Done`);
    } catch (err) {
      console.error(`  ✗ Failed:`, err);
    }
  }
  
  console.log('\nAll done!');
}

main().catch(console.error);