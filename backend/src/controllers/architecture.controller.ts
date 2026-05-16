import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';

const prisma = new PrismaClient();

export class ArchitectureController {
  /**
   * Get architecture map for a repository
   * GET /api/v1/architecture/:repositoryId
   */
  getArchitectureMap = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { repositoryId } = req.params;

      // Verify repository ownership
      const repository = await prisma.repository.findFirst({
        where: {
          id: repositoryId,
          userId,
        },
      });

      if (!repository) {
        res.status(404).json({
          success: false,
          message: 'Repository not found',
        });
        return;
      }

      // Get latest architecture map
      const architectureMap = await prisma.architectureMap.findFirst({
        where: { repositoryId },
        orderBy: { createdAt: 'desc' },
      });

      if (!architectureMap) {
        res.status(404).json({
          success: false,
          message: 'Architecture map not found. Please run analysis first.',
        });
        return;
      }

      res.json({
        success: true,
        data: architectureMap,
      });
    } catch (error) {
      logger.error('Failed to get architecture map', { error });
      next(error);
    }
  };
}

// Made with Bob