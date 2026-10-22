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

describe('listingQuery type-specific filters', () => {
  it('parses plot, flat and villa filters', () => {
    const q = parse(listingQuery, {
      minPlotArea: '200', corner: '1', facing: 'EAST,NORTH', approval: 'DTCP',
      minCarpet: '900', minBaths: '2', furnishing: 'SEMI_FURNISHED', amenities: 'GYM, LIFT',
      possession: 'READY', maxAge: '5', minFloor: '5', gated: 'true',
    });
    expect(q).toMatchObject({
      minPlotArea: 200, corner: true, facing: ['EAST', 'NORTH'], approval: ['DTCP'],
      minCarpet: 900, minBaths: 2, furnishing: ['SEMI_FURNISHED'], amenities: ['GYM', 'LIFT'],
      possession: ['READY'], maxAge: 5, minFloor: 5, gated: true,
    });
  });

  it('rejects unknown enum values', () => {
    expect(() => parse(listingQuery, { facing: 'UP' })).toThrow(BadRequestException);
    expect(() => parse(listingQuery, { furnishing: 'LUXURY' })).toThrow(BadRequestException);
  });

  it('leaves filters off when absent', () => {
    const q = parse(listingQuery, {});
    expect(q.corner).toBeUndefined();
    expect(q.facing).toBeUndefined();
  });
});
