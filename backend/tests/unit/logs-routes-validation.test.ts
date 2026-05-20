import { describe, expect, it } from 'vitest';
import {
  auditLogsQuerySchema,
  auditStatsQuerySchema,
  auditCleanupQuerySchema,
  logSearchQuerySchema,
  logsBySourceQuerySchema,
} from '../../src/api/routes/logs/schemas';

describe('Logs route schemas', () => {
  describe('auditLogsQuerySchema', () => {
    it('accepts empty query with defaults', () => {
      const result = auditLogsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({ limit: 100, offset: 0 });
    });

    it('coerces string limit and offset to numbers', () => {
      const result = auditLogsQuerySchema.safeParse({ limit: '50', offset: '10' });
      expect(result.success).toBe(true);
      expect(result.data?.limit).toBe(50);
      expect(result.data?.offset).toBe(10);
    });

    it('rejects limit above 1000', () => {
      const result = auditLogsQuerySchema.safeParse({ limit: '1001' });
      expect(result.success).toBe(false);
    });

    it('rejects negative offset', () => {
      const result = auditLogsQuerySchema.safeParse({ offset: '-1' });
      expect(result.success).toBe(false);
    });

    it('rejects non-numeric limit', () => {
      const result = auditLogsQuerySchema.safeParse({ limit: 'abc' });
      expect(result.success).toBe(false);
    });

    it('accepts optional filter strings', () => {
      const result = auditLogsQuerySchema.safeParse({
        actor: 'admin',
        action: 'create',
        module: 'auth',
      });
      expect(result.success).toBe(true);
      expect(result.data?.actor).toBe('admin');
    });

    it('accepts valid date strings', () => {
      const result = auditLogsQuerySchema.safeParse({
        start_date: '2025-01-01',
        end_date: '2025-01-31T23:59:59Z',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid date strings', () => {
      const result = auditLogsQuerySchema.safeParse({
        start_date: 'not-a-date',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('auditStatsQuerySchema', () => {
    it('defaults days to 7', () => {
      const result = auditStatsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data?.days).toBe(7);
    });

    it('coerces string days to number', () => {
      const result = auditStatsQuerySchema.safeParse({ days: '30' });
      expect(result.success).toBe(true);
      expect(result.data?.days).toBe(30);
    });

    it('rejects days below 1', () => {
      const result = auditStatsQuerySchema.safeParse({ days: '0' });
      expect(result.success).toBe(false);
    });

    it('rejects days above 365', () => {
      const result = auditStatsQuerySchema.safeParse({ days: '400' });
      expect(result.success).toBe(false);
    });
  });

  describe('auditCleanupQuerySchema', () => {
    it('defaults days_to_keep to 90', () => {
      const result = auditCleanupQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data?.days_to_keep).toBe(90);
    });

    it('coerces string to number', () => {
      const result = auditCleanupQuerySchema.safeParse({ days_to_keep: '30' });
      expect(result.success).toBe(true);
      expect(result.data?.days_to_keep).toBe(30);
    });

    it('rejects days_to_keep below 1', () => {
      const result = auditCleanupQuerySchema.safeParse({ days_to_keep: '0' });
      expect(result.success).toBe(false);
    });
  });

  describe('logSearchQuerySchema', () => {
    it('accepts valid search query', () => {
      const result = logSearchQuerySchema.safeParse({ q: 'error' });
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({ q: 'error', limit: 100, offset: 0 });
    });

    it('rejects missing q parameter', () => {
      const result = logSearchQuerySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects empty q parameter', () => {
      const result = logSearchQuerySchema.safeParse({ q: '' });
      expect(result.success).toBe(false);
    });

    it('accepts optional source filter', () => {
      const result = logSearchQuerySchema.safeParse({ q: 'error', source: 'backend' });
      expect(result.success).toBe(true);
      expect(result.data?.source).toBe('backend');
    });

    it('coerces limit and offset from strings', () => {
      const result = logSearchQuerySchema.safeParse({ q: 'test', limit: '50', offset: '25' });
      expect(result.success).toBe(true);
      expect(result.data?.limit).toBe(50);
      expect(result.data?.offset).toBe(25);
    });
  });

  describe('logsBySourceQuerySchema', () => {
    it('accepts empty query with defaults', () => {
      const result = logsBySourceQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data?.limit).toBe(100);
    });

    it('accepts optional before_timestamp', () => {
      const result = logsBySourceQuerySchema.safeParse({
        before_timestamp: '2025-01-01T00:00:00Z',
      });
      expect(result.success).toBe(true);
      expect(result.data?.before_timestamp).toBe('2025-01-01T00:00:00Z');
    });

    it('rejects non-numeric limit', () => {
      const result = logsBySourceQuerySchema.safeParse({ limit: 'abc' });
      expect(result.success).toBe(false);
    });
  });
});
