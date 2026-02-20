/**
 * CLI utility to bcrypt-hash a plain-text password for use in .env.
 *
 * Usage:
 *   npx tsx scripts/hash-password.ts 'your-password'
 *
 * Output:
 *   ADMIN_PASSWORD_HASH=$2b$12$...
 *
 * Paste the output value into your .env file as ADMIN_PASSWORD_HASH.
 */

import * as bcrypt from 'bcryptjs'

const password = process.argv[2]

if (!password) {
  console.error('Usage: npx tsx scripts/hash-password.ts <password>')
  console.error('')
  console.error('Example:')
  console.error("  npx tsx scripts/hash-password.ts 'my-secure-password'")
  process.exit(1)
}

const hash = await bcrypt.hash(password, 12)
console.log(`ADMIN_PASSWORD_HASH=${hash}`)
