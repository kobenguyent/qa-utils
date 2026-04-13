import { describe, it, expect } from 'vitest';
import { decodeJwt } from '../lib/tools.js';

// A real HS256 JWT with payload { sub: "1234567890", name: "John Doe", iat: 1516239022 }
// (no exp claim — taken from jwt.io example)
const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ' +
  '.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

// An expired JWT (exp in the past)
function makeExpiredJwt(): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ sub: 'test', exp: 1000000000 }),
  ).toString('base64url');
  return `${header}.${payload}.fakesignature`;
}

// A non-expired JWT (exp far in the future)
function makeFutureJwt(): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ sub: 'test', exp: 9999999999 }),
  ).toString('base64url');
  return `${header}.${payload}.fakesignature`;
}

describe('decodeJwt', () => {
  it('decodes a valid JWT and returns header and payload', () => {
    const result = decodeJwt(SAMPLE_JWT);
    expect(result.error).toBeUndefined();
    expect(result.header).toMatchObject({ alg: 'HS256', typ: 'JWT' });
    expect(result.payload).toMatchObject({
      sub: '1234567890',
      name: 'John Doe',
    });
  });

  it('sets expired to null when there is no exp claim', () => {
    const result = decodeJwt(SAMPLE_JWT);
    expect(result.expired).toBeNull();
  });

  it('sets expired to true for an expired token', () => {
    const result = decodeJwt(makeExpiredJwt());
    expect(result.expired).toBe(true);
  });

  it('sets expired to false for a non-expired token', () => {
    const result = decodeJwt(makeFutureJwt());
    expect(result.expired).toBe(false);
  });

  it('returns an error for a string that is not a JWT', () => {
    const result = decodeJwt('not.a.jwt.at.all.nope');
    expect(result.error).toBeDefined();
    expect(result.header).toBeNull();
  });

  it('returns an error for a 2-part token', () => {
    const result = decodeJwt('header.payload');
    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/3 parts/);
  });

  it('handles whitespace around the token', () => {
    const result = decodeJwt(`  ${SAMPLE_JWT}  `);
    expect(result.error).toBeUndefined();
    expect(result.header).toBeTruthy();
  });

  it('includes the signature field', () => {
    const result = decodeJwt(SAMPLE_JWT);
    expect(typeof result.signature).toBe('string');
    expect(result.signature).toBeTruthy();
    expect(typeof result.signature).toBe('string');
  });
});
