import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { parse } from '../src/common/zod';
import { listingQuery } from '../src/listings/listings.service';

describe('listingQuery', () => {
  it('applies defaults and coerces numbers', () => {
    const q = parse(listingQuery, { maxPrice: '5000000' });
    expect(q).toMatchObject({ maxPrice: 5_000_000, page: 1, pageSize: 12 });
  });

  it('rejects invalid property types and page sizes', () => {
    expect(() => parse(listingQuery, { type: 'CASTLE' })).toThrow(BadRequestException);
    expect(() => parse(listingQuery, { pageSize: '500' })).toThrow(BadRequestException);
  });
});

describe('listingQuery area and agent filters', () => {
  it('coerces area bounds and keeps the agent id', () => {
    const q = parse(listingQuery, { minArea: '1200', maxArea: '3000', agent: 'abc' });
    expect(q).toMatchObject({ minArea: 1200, maxArea: 3000, agent: 'abc' });
  });
});
