import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as schema from './schema'

const __dirname = dirname(fileURLToPath(import.meta.url))
// DB lives in /data/campus.db at project root (two levels up from src/server/db/)
const dbDir = resolve(__dirname, '../../../data')
const dbPath = resolve(dbDir, 'campus.db')

// Ensure /data/ directory exists (first run)
mkdirSync(dbDir, { recursive: true })

const sqlite = new Database(dbPath)
export const db = drizzle(sqlite, { schema })
