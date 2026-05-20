import { z } from 'zod';

/**
 * Validation schemas for the logs API routes.
 *
 * All limit/offset params are coerced from query string to number and clamped
 * to safe bounds to prevent NaN or excessively large values reaching the database.
 */

const paginationDefaults = {
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
};

const optionalDateString = z
  .string()
  .refine((v) => !isNaN(Date.parse(v)), { message: 'must be a valid date string' })
  .optional();

export const auditLogsQuerySchema = z.object({
  ...paginationDefaults,
  actor: z.string().optional(),
  action: z.string().optional(),
  module: z.string().optional(),
  start_date: optionalDateString,
  end_date: optionalDateString,
});

export const auditStatsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(7),
});

export const auditCleanupQuerySchema = z.object({
  days_to_keep: z.coerce.number().int().min(1).max(3650).default(90),
});

export const logSearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query parameter (q) is required'),
  source: z.string().optional(),
  ...paginationDefaults,
});

export const logsBySourceQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  before_timestamp: z.string().optional(),
});
