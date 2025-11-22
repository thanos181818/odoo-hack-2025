import { Router } from 'express';
import { z } from 'zod';
import { stockOracle } from '../../agent/oracle';
import { memoryManager } from '../../agent/memory';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { logger } from '../../utils/logger';

const router = Router();

// Validation schemas
const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  conversationId: z.string().uuid().optional(),
  context: z.any().optional(),
});

const executeSchema = z.object({
  operationId: z.string().uuid(),
  approved: z.boolean(),
});

/**
 * POST /api/chat
 * Main chat endpoint for interacting with Stock Oracle
 */
router.post(
  '/',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { message, conversationId, context } = chatSchema.parse(req.body);

    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    logger.info(`Chat request from ${req.user.email}: "${message}"`);

    const response = await stockOracle.chat({
      message,
      conversationId,
      userId: req.user.id,
      context,
    });

    res.json({
      success: true,
      data: response,
    });
  })
);

/**
 * POST /api/chat/execute
 * Execute a draft operation after user approval
 */
router.post(
  '/execute',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { operationId, approved } = executeSchema.parse(req.body);

    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    if (!approved) {
      return res.json({
        success: true,
        message: 'Operation cancelled',
      });
    }

    const result = await stockOracle.executeOperation(operationId, req.user.id);

    res.json({
      success: true,
      message: result,
    });
  })
);

/**
 * GET /api/chat/history
 * Get conversation history for current user
 */
router.get(
  '/history',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { limit = '10' } = req.query;

    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    const conversations = await memoryManager.getRecentConversations(
      req.user.id,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: conversations,
    });
  })
);

export default router;