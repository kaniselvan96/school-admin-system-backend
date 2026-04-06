/// <reference types="jest" />

import {
  ExternalStudentsResponseSchema,
  GetStudentsParamsSchema,
  GetStudentsQuerySchema,
  StudentItemSchema,
} from '../StudentDto';

describe('StudentDto', () => {
  describe('GetStudentsParamsSchema', () => {
    it('accepts a valid class code', () => {
      const result = GetStudentsParamsSchema.safeParse({ classCode: 'P1-1' });

      expect(result.success).toBe(true);
    });

    it('rejects an empty class code', () => {
      const result = GetStudentsParamsSchema.safeParse({ classCode: '' });

      expect(result.success).toBe(false);
    });
  });

  describe('GetStudentsQuerySchema', () => {
    it('applies default pagination values', () => {
      const result = GetStudentsQuerySchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ offset: 0, limit: 20 });
      }
    });

    it('parses valid string query values', () => {
      const result = GetStudentsQuerySchema.safeParse({
        offset: '5',
        limit: '10',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ offset: 5, limit: 10 });
      }
    });

    it('rejects negative offsets', () => {
      const result = GetStudentsQuerySchema.safeParse({ offset: '-1' });

      expect(result.success).toBe(false);
    });

    it('rejects non-positive limits', () => {
      const result = GetStudentsQuerySchema.safeParse({ limit: '0' });

      expect(result.success).toBe(false);
    });
  });

  describe('ExternalStudentsResponseSchema', () => {
    it('accepts a valid external response', () => {
      const result = ExternalStudentsResponseSchema.safeParse({
        count: 1,
        students: [{ id: 1, name: 'Alice', email: 'alice@example.com' }],
      });

      expect(result.success).toBe(true);
    });

    it('rejects invalid student emails', () => {
      const result = ExternalStudentsResponseSchema.safeParse({
        count: 1,
        students: [{ id: 1, name: 'Alice', email: 'invalid-email' }],
      });

      expect(result.success).toBe(false);
    });
  });

  describe('StudentItemSchema', () => {
    it('accepts a valid student item', () => {
      const result = StudentItemSchema.safeParse({
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
        isExternal: false,
      });

      expect(result.success).toBe(true);
    });
  });
});
