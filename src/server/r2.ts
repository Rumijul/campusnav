import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

/**
 * Backblaze B2 S3-compatible client.
 *
 * IMPORTANT: requestChecksumCalculation and responseChecksumValidation must be
 * set to 'WHEN_REQUIRED' for compatibility with B2 on AWS SDK v3.729+.
 * Without this, SDK adds x-amz-checksum-crc32 headers that B2 rejects.
 */
export const r2 = new S3Client({
  region: process.env.R2_REGION ?? 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
})

export const BUCKET = process.env.R2_BUCKET_NAME!

/**
 * Download an R2 object as a Node.js Buffer.
 * In AWS SDK v3, Body is a ReadableStream — use transformToByteArray().
 */
export async function r2GetBuffer(key: string): Promise<Uint8Array<ArrayBuffer>> {
  // Try R2 first if credentials are configured
  if (process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID) {
    try {
      const result = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
      if (!result.Body) throw new Error(`R2 object not found: ${key}`)
      const bytes = await result.Body.transformToByteArray()
      return bytes.slice()
    } catch (_err) {
      // Fall through to local fallback
    }
  }

  // Local fallback: serve from src/server/assets/
  try {
    const localPath = join(process.cwd(), 'src/server/assets', key)
    const fs = await import('node:fs')
    const buffer = fs.readFileSync(localPath)
    return new Uint8Array(buffer)
  } catch (_localErr) {
    throw new Error(`R2 object not found: ${key}`)
  }
}

/**
 * Upload a Buffer with the given content type.
 * Primary target is R2; if creds are absent (or the put fails) we fall back
 * to writing the file into src/server/assets/, mirroring r2GetBuffer's local
 * fallback so the admin upload endpoint never 500s on a missing-key deploy.
 */
export async function r2PutBuffer(key: string, buffer: Buffer, contentType: string): Promise<void> {
  if (process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID) {
    try {
      await r2.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        }),
      )
      return
    } catch (err) {
      console.error('R2 upload failed, falling back to local assets:', err)
    }
  }

  // Local fallback: write to src/server/assets/<key>
  const localPath = join(process.cwd(), 'src/server/assets', key)
  await mkdir(dirname(localPath), { recursive: true })
  await writeFile(localPath, buffer)
}
