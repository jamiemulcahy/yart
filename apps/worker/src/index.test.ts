import { describe, it, expect } from 'vitest';

// Note: Full integration tests for the Worker and Durable Objects require
// miniflare or wrangler dev, which are covered in e2e tests.
// Unit tests for validation logic are in validation.test.ts
// The Room Durable Object cannot be tested directly with vitest due to
// cloudflare:workers import, so we test the validation module instead.

describe('Worker', () => {
  it('exports validation helpers', async () => {
    const validation = await import('./validation');
    expect(validation.isValidId).toBeDefined();
    expect(validation.isValidText).toBeDefined();
    expect(validation.isValidName).toBeDefined();
    expect(validation.isValidPosition).toBeDefined();
    expect(validation.getCorsOrigin).toBeDefined();
  });
});
