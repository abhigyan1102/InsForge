import { z } from 'zod';

/**
 * Validation schemas for the usage API routes.
 */

export const createMCPUsageSchema = z.object({
  tool_name: z.string().min(1, 'tool_name is required'),
  success: z.boolean().default(true),
});

export const getMCPUsageQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(5),
  success: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
});

export const getUsageStatsQuerySchema = z.object({
  start_date: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: 'start_date must be a valid date string',
  }),
  end_date: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: 'end_date must be a valid date string',
  }),
});
