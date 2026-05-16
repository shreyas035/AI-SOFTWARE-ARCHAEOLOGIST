import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';

const prisma = new PrismaClient();

export class OnboardingController {
  /**
   * Get onboarding path for a repository
   * GET /api/v1/onboarding/:repositoryId
   */
  getOnboardingPath = async (
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

      // Get latest onboarding path
      const onboardingPath = await prisma.onboardingPath.findFirst({
        where: { repositoryId },
        orderBy: { createdAt: 'desc' },
      });

      if (!onboardingPath) {
        res.status(404).json({
          success: false,
          message: 'Onboarding path not found. Please run analysis first.',
        });
        return;
      }

      res.json({
        success: true,
        data: onboardingPath,
      });
    } catch (error) {
      logger.error('Failed to get onboarding path', { error });
      next(error);
    }
  };
}

// Made with Bob