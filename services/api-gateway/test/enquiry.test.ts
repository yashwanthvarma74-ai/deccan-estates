import { describe, expect, it } from 'vitest';
import { enquiryBody } from '../src/enquiries/enquiries.controller';

describe('enquiry body', () => {
  it('accepts a normal request and treats blanks as missing', () => {
    const r = enquiryBody.parse({ name: 'Asha Rao', phone: '+91 98480 01000', email: '', locality: '', expectedPriceLakh: '', message: '' });
    expect(r.email).toBeUndefined();
    expect(r.expectedPriceLakh).toBeUndefined();
  });
  it('rejects short names, bad phones and a filled honeypot', () => {
    expect(enquiryBody.safeParse({ name: 'A', phone: '+91 98480 01000' }).success).toBe(false);
    expect(enquiryBody.safeParse({ name: 'Asha Rao', phone: 'abc' }).success).toBe(false);
    expect(enquiryBody.safeParse({ name: 'Asha Rao', phone: '9848001000', website: 'http://spam' }).success).toBe(false);
  });
});
