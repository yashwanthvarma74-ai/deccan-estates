import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { StorageService, UPLOAD_DIR } from '../src/posting/storage.service';

const name = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.jpg';
afterEach(() => { delete process.env.S3_BUCKET; rmSync(path.join(UPLOAD_DIR, name), { force: true }); });

describe('StorageService', () => {
  it('keeps photos on local disk when no bucket is configured, and removes them', async () => {
    const s = new StorageService();
    expect(s.remote).toBe(false);
    await s.put(name, Buffer.from('x'));
    expect(existsSync(path.join(UPLOAD_DIR, name))).toBe(true);
    await s.remove(`/uploads/${name}`);
    expect(existsSync(path.join(UPLOAD_DIR, name))).toBe(false);
  });

  it('writes to the bucket under uploads/ with the right type and a long cache time', async () => {
    process.env.S3_BUCKET = 'photos';
    const s = new StorageService();
    const sent: { constructor: { name: string }; input: Record<string, unknown> }[] = [];
    (s as unknown as { s3: { send: (c: (typeof sent)[number]) => Promise<void> } }).s3 = { send: async (c) => { sent.push(c); } };
    expect(s.remote).toBe(true);
    await s.put(name, Buffer.from('x'));
    await s.remove(`/uploads/${name}`);
    expect(sent.map((c) => c.constructor.name)).toEqual(['PutObjectCommand', 'DeleteObjectCommand']);
    expect(sent[0].input).toMatchObject({ Bucket: 'photos', Key: `uploads/${name}`, ContentType: 'image/jpeg' });
    expect(String(sent[0].input.CacheControl)).toContain('immutable');
    expect(sent[1].input).toMatchObject({ Bucket: 'photos', Key: `uploads/${name}` });
    expect(existsSync(path.join(UPLOAD_DIR, name))).toBe(false);
  });

  it('does not fail a delete when the store is unreachable', async () => {
    process.env.S3_BUCKET = 'photos';
    const s = new StorageService();
    (s as unknown as { s3: { send: () => Promise<void> } }).s3 = { send: async () => { throw new Error('offline'); } };
    await expect(s.remove(`/uploads/${name}`)).resolves.toBeUndefined();
  });
});
