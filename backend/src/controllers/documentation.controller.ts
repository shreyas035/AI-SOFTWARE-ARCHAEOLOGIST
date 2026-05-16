import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';

const prisma = new PrismaClient();

export class DocumentationController {
  /**
   * Get generated documentation for a repository
   * GET /api/v1/documentation/:repositoryId
   */
  getDocumentation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { repositoryId } = req.params;
      const { type } = req.query;

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

      // Get documentation
      const whereClause: any = { repositoryId };
      if (type) {
        whereClause.docType = type;
      }

      const documentation = await prisma.generatedDocumentation.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: documentation,
      });
    } catch (error) {
      logger.error('Failed to get documentation', { error });
      next(error);
    }
  };
}

// Made with Bob