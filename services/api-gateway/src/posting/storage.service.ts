import { Injectable } from '@nestjs/common';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads'));

const TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

/**
 * Where uploaded photos live. With S3_BUCKET set (Cloudflare R2, Supabase Storage, AWS S3 or anything S3-compatible)
 * they go to that bucket under `uploads/<file>`; otherwise they are written to a local folder and served by the API.
 * Either way a listing stores the path "/uploads/<file>", and clients get PUBLIC_UPLOADS_BASE + that path
 * (for a bucket, set PUBLIC_UPLOADS_BASE to the bucket's public address).
 */
@Injectable()
export class StorageService {
  private s3: S3Client | null = null;
  private bucket = process.env.S3_BUCKET;

  constructor() {
    if (this.bucket) {
      this.s3 = new S3Client({
        region: process.env.S3_REGION ?? 'auto',
        endpoint: process.env.S3_ENDPOINT,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === '1',
        credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '', secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '' },
      });
    }
  }

  /** True when photos go to a bucket instead of the local folder. */
  get remote() {
    return this.s3 !== null;
  }

  async put(name: string, body: Buffer) {
    if (this.s3) {
      const ext = name.split('.').pop() ?? 'jpg';
      await this.s3.send(
        new PutObjectCommand({ Bucket: this.bucket, Key: `uploads/${name}`, Body: body, ContentType: TYPES[ext] ?? 'application/octet-stream', CacheControl: 'public, max-age=31536000, immutable' }),
      );
      return;
    }
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, name), body, { flag: 'wx' });
  }

  async remove(name: string) {
    const file = path.basename(name);
    try {
      if (this.s3) await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: `uploads/${file}` }));
      else await unlink(path.join(UPLOAD_DIR, file));
    } catch {
      // already gone, or the store is unreachable: the listing is removed either way
    }
  }
}
