import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const isNeon = process.env.DATABASE_URL?.includes('neon.tech')
const client = postgres(process.env.DATABASE_URL!, {
  ssl: isNeon || process.env.NODE_ENV === 'production' ? 'require' : false,
  max: 5,
})
export const db = drizzle({ client, schema })
