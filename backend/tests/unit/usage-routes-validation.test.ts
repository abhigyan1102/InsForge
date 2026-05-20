import { describe, expect, it } from 'vitest';
import {
  createMCPUsageSchema,
  getMCPUsageQuerySchema,
  getUsageStatsQuerySchema,
} from '../../src/api/routes/usage/schemas';

describe('Usage route schemas', () => {
  describe('createMCPUsageSchema', () => {
    it('accepts valid body with tool_name and success', () => {
      const result = createMCPUsageSchema.safeParse({
        tool_name: 'read_file',
        success: true,
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ tool_name: 'read_file', success: true });
    });

    it('defaults success to true when omitted', () => {
      const result = createMCPUsageSchema.safeParse({ tool_name: 'write_file' });
      expect(result.success).toBe(true);
      expect(result.data?.success).toBe(true);
    });

    it('rejects missing tool_name', () => {
      const result = createMCPUsageSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects empty tool_name', () => {
      const result = createMCPUsageSchema.safeParse({ tool_name: '' });
      expect(result.success).toBe(false);
    });

    it('rejects non-boolean success', () => {
      const result = createMCPUsageSchema.safeParse({
        tool_name: 'read_file',
        success: 'yes',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('getMCPUsageQuerySchema', () => {
    it('accepts valid query with defaults', () => {
      const result = getMCPUsageQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ limit: 5, success: true });
    });

    it('parses string limit to number', () => {
      const result = getMCPUsageQuerySchema.safeParse({ limit: '10' });
      expect(result.success).toBe(true);
      expect(result.data?.limit).toBe(10);
    });

    it('rejects limit above 100', () => {
      const result = getMCPUsageQuerySchema.safeParse({ limit: '101' });
      expect(result.success).toBe(false);
    });

    it('rejects limit below 1', () => {
      const result = getMCPUsageQuerySchema.safeParse({ limit: '0' });
      expect(result.success).toBe(false);
    });

    it('rejects non-numeric limit', () => {
      const result = getMCPUsageQuerySchema.safeParse({ limit: 'abc' });
      expect(result.success).toBe(false);
    });

    it('parses success=false correctly', () => {
      const result = getMCPUsageQuerySchema.safeParse({ success: 'false' });
      expect(result.success).toBe(true);
      expect(result.data?.success).toBe(false);
    });

    it('rejects invalid success values', () => {
      const result = getMCPUsageQuerySchema.safeParse({ success: 'yes' });
      expect(result.success).toBe(false);
    });
  });

  describe('getUsageStatsQuerySchema', () => {
    it('accepts valid ISO date strings', () => {
      const result = getUsageStatsQuerySchema.safeParse({
        start_date: '2025-01-01T00:00:00Z',
        end_date: '2025-01-31T23:59:59Z',
      });
      expect(result.success).toBe(true);
    });

    it('accepts YYYY-MM-DD date strings', () => {
      const result = getUsageStatsQuerySchema.safeParse({
        start_date: '2025-01-01',
        end_date: '2025-01-31',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing start_date', () => {
      const result = getUsageStatsQuerySchema.safeParse({
        end_date: '2025-01-31',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing end_date', () => {
      const result = getUsageStatsQuerySchema.safeParse({
        start_date: '2025-01-01',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid date strings', () => {
      const result = getUsageStatsQuerySchema.safeParse({
        start_date: 'not-a-date',
        end_date: '2025-01-31',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty strings', () => {
      const result = getUsageStatsQuerySchema.safeParse({
        start_date: '',
        end_date: '',
      });
      expect(result.success).toBe(false);
    });
  });
});
