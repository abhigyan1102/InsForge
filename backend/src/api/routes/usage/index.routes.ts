import { Router, NextFunction, Response } from 'express';
import {
  verifyCloudBackend,
  verifyApiKey,
  verifyAdmin,
  AuthRequest,
} from '@/api/middlewares/auth.js';
import { SocketManager } from '@/infra/socket/socket.manager.js';
import { ServerEvents } from '@/types/socket.js';
import { UsageService } from '@/services/usage/usage.service.js';
import { successResponse } from '@/utils/response.js';
import { AppError } from '@/api/middlewares/error.js';
import { ERROR_CODES } from '@/types/error-constants.js';
import {
  createMCPUsageSchema,
  getMCPUsageQuerySchema,
  getUsageStatsQuerySchema,
} from './schemas.js';

export const usageRouter = Router();
const usageService = UsageService.getInstance();

// Create MCP tool usage record
usageRouter.post(
  '/mcp',
  verifyApiKey,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const validation = createMCPUsageSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          validation.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
          400,
          ERROR_CODES.INVALID_INPUT
        );
      }

      const { tool_name, success } = validation.data;

      // Create MCP usage record via service
      const result = await usageService.recordMCPUsage(tool_name, success);

      // Broadcast MCP tool usage to frontend via socket
      const socketService = SocketManager.getInstance();

      socketService.broadcastToRoom(
        'role:project_admin',
        ServerEvents.MCP_CONNECTED,
        { tool_name, created_at: result.created_at },
        'system'
      );

      successResponse(res, { success: true });
    } catch (error) {
      next(error);
    }
  }
);

// Get MCP usage records
usageRouter.get(
  '/mcp',
  verifyAdmin,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const validation = getMCPUsageQuerySchema.safeParse(req.query);
      if (!validation.success) {
        throw new AppError(
          validation.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
          400,
          ERROR_CODES.INVALID_INPUT
        );
      }

      const { limit, success } = validation.data;

      // Get MCP usage records via service
      const records = await usageService.getMCPUsage(limit, success);

      successResponse(res, { records });
    } catch (error) {
      next(error);
    }
  }
);

// Get usage statistics (called by cloud backend)
usageRouter.get(
  '/stats',
  verifyCloudBackend,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const validation = getUsageStatsQuerySchema.safeParse(req.query);
      if (!validation.success) {
        throw new AppError(
          validation.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
          400,
          ERROR_CODES.INVALID_INPUT
        );
      }

      const { start_date, end_date } = validation.data;

      // Get usage statistics via service
      const stats = await usageService.getUsageStats(
        new Date(start_date),
        new Date(end_date)
      );

      successResponse(res, stats);
    } catch (error) {
      next(error);
    }
  }
);
