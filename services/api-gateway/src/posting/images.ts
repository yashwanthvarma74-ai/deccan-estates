import { BadRequestException } from '@nestjs/common';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Identifies the real file type from its first bytes; the browser-supplied type and name are not trusted. */
export function sniffImage(buf: Buffer): { ext: 'jpg' | 'png' | 'webp' } | null {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: 'jpg' };
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: 'png' };
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return { ext: 'webp' };
  return null;
}

export function assertImage(file: { buffer: Buffer; size: number } | undefined) {
  if (!file) throw new BadRequestException('Choose a photo to upload');
  if (file.size > MAX_IMAGE_BYTES) throw new BadRequestException('Each photo must be under 5 MB');
  const kind = sniffImage(file.buffer);
  if (!kind) throw new BadRequestException('Only JPG, PNG or WebP photos are allowed');
  return kind;
}
