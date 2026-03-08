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
  const result = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
  if (!result.Body) throw new Error(`R2 object not found: ${key}`)
  // transformToByteArray returns Uint8Array<ArrayBufferLike>; .slice() gives Uint8Array<ArrayBuffer>
  // which satisfies Hono's Data type constraint for c.body().
  const bytes = await result.Body.transformToByteArray()
  return bytes.slice()
}

/** Upload a Buffer to R2 with the given content type. */
export async function r2PutBuffer(key: string, buffer: Buffer, contentType: string): Promise<void> {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  )
}
