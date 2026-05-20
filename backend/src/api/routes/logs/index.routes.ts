import { Router, Response, NextFunction } from 'express';
import { LogService } from '@/services/logs/log.service.js';
import { AuditService } from '@/services/logs/audit.service.js';
import { AuthRequest, verifyAdmin } from '@/api/middlewares/auth.js';
import { successResponse, paginatedResponse } from '@/utils/response.js';
import { GetLogsResponse } from '@insforge/shared-schemas';
import { AppError } from '@/api/middlewares/error.js';
import { ERROR_CODES } from '@/types/error-constants.js';
import {
  auditLogsQuerySchema,
  auditStatsQuerySchema,
  auditCleanupQuerySchema,
  logSearchQuerySchema,
  logsBySourceQuerySchema,
} from './schemas.js';

const router = Router();

// All logs routes require admin authentication
router.use(verifyAdmin);

// GET /logs/audits - List audit logs
router.get('/audits', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validation = auditLogsQuerySchema.safeParse(req.query);
    if (!validation.success) {
      throw new AppError(
        validation.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
        400,
        ERROR_CODES.INVALID_INPUT
      );
    }

    const { limit, offset, actor, action, module, start_date, end_date } = validation.data;

    const auditService = AuditService.getInstance();

    // Build query parameters for audit service
    const queryParams = {
      limit,
      offset,
      ...(actor && { actor }),
      ...(action && { action }),
      ...(module && { module }),
      ...(start_date && { start_date: new Date(start_date) }),
      ...(end_date && { end_date: new Date(end_date) }),
    };

    // Get audit logs with total count
    const { records, total } = await auditService.query(queryParams);

    paginatedResponse(res, records, total, offset);
  } catch (error) {
    next(error);
  }
});

// GET /logs/audits/stats - Get audit logs statistics
router.get('/audits/stats', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validation = auditStatsQuerySchema.safeParse(req.query);
    if (!validation.success) {
      throw new AppError(
        validation.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
        400,
        ERROR_CODES.INVALID_INPUT
      );
    }

    const auditService = AuditService.getInstance();
    const stats = await auditService.getStats(validation.data.days);

    successResponse(res, stats);
  } catch (error) {
    next(error);
  }
});

// DELETE /logs/audits - Clear audit logs (admin only)
router.delete('/audits', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validation = auditCleanupQuerySchema.safeParse(req.query);
    if (!validation.success) {
      throw new AppError(
        validation.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
        400,
        ERROR_CODES.INVALID_INPUT
      );
    }

    const auditService = AuditService.getInstance();
    const deletedCount = await auditService.cleanup(validation.data.days_to_keep);

    successResponse(res, {
      message: 'Audit logs cleared successfully',
      deleted: deletedCount,
    });
  } catch (error) {
    next(error);
  }
});

// System logs routes
// GET /logs/sources - List all log sources
router.get('/sources', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const logService = LogService.getInstance();
    const sources = await logService.getLogSources();

    successResponse(res, sources);
  } catch (error) {
    next(error);
  }
});

// GET /logs/stats - Get statistics for all log sources
router.get('/stats', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const logService = LogService.getInstance();
    const stats = await logService.getLogSourceStats();

    successResponse(res, stats);
  } catch (error) {
    next(error);
  }
});

// GET /logs/functions/build-logs - Get function build logs from Deno Subhosting
router.get('/functions/build-logs', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { deployment_id } = req.query;

    const logService = LogService.getInstance();
    const result = await logService.getBuildLogs(deployment_id as string | undefined);

    if (!result) {
      throw new AppError(
        'Build logs not available. Deno Subhosting may not be configured or no deployments found.',
        404,
        ERROR_CODES.NOT_FOUND
      );
    }

    successResponse(res, result);
  } catch (error) {
    next(error);
  }
});

// GET /logs/search - Search across all logs or specific source
router.get('/search', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validation = logSearchQuerySchema.safeParse(req.query);
    if (!validation.success) {
      throw new AppError(
        validation.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
        400,
        ERROR_CODES.INVALID_INPUT
      );
    }

    const { q, source, limit, offset } = validation.data;

    const logService = LogService.getInstance();
    const result = await logService.searchLogs(q, source, limit, offset);

    paginatedResponse(res, result.logs, result.total, offset);
  } catch (error) {
    next(error);
  }
});

// GET /logs/:source - Get logs from specific source
router.get('/:source', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { source } = req.params;
    const validation = logsBySourceQuerySchema.safeParse(req.query);
    if (!validation.success) {
      throw new AppError(
        validation.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
        400,
        ERROR_CODES.INVALID_INPUT
      );
    }

    const { limit, before_timestamp } = validation.data;

    const logService = LogService.getInstance();
    const result = await logService.getLogsBySource(source, limit, before_timestamp);

    const response: GetLogsResponse = {
      logs: result.logs,
      total: result.total,
    };

    successResponse(res, response);
  } catch (error) {
    next(error);
  }
});

export { router as logsRouter };
