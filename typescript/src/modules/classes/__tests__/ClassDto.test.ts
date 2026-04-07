/// <reference types="jest" />

import { UpdateClassBodySchema, UpdateClassParamsSchema } from '../ClassDto';

describe('ClassDto', () => {
  describe('UpdateClassParamsSchema', () => {
    it('accepts a valid class code', () => {
      const result = UpdateClassParamsSchema.safeParse({ classCode: 'P1-1' });

      expect(result.success).toBe(true);
    });

    it('rejects an empty class code', () => {
      const result = UpdateClassParamsSchema.safeParse({ classCode: '' });

      expect(result.success).toBe(false);
    });
  });

  describe('UpdateClassBodySchema', () => {
    it('accepts a valid class name', () => {
      const result = UpdateClassBodySchema.safeParse({
        className: 'P1 Integrity',
      });

      expect(result.success).toBe(true);
    });

    it('rejects an empty class name', () => {
      const result = UpdateClassBodySchema.safeParse({ className: '' });

      expect(result.success).toBe(false);
    });
  });
});
