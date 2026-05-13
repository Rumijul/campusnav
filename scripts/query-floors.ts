import * as dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const floors = await sql`SELECT id, "floorNumber", "imagePath", "buildingId" FROM floors ORDER BY id`;
  console.log(JSON.stringify(floors, null, 2));
}

main().catch(console.error);