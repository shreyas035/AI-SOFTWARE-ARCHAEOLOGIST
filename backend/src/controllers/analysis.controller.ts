import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ArchitectureMapper } from '../services/analysis/architecture-mapper';
import { TechnicalDebtAnalyzer } from '../services/analysis/technical-debt-analyzer';
import logger from '../config/logger';

const prisma = new PrismaClient();

export class AnalysisController {
  private architectureMapper: ArchitectureMapper;
  private technicalDebtAnalyzer: TechnicalDebtAnalyzer;

  constructor() {
    this.architectureMapper = new ArchitectureMapper(prisma);
    this.technicalDebtAnalyzer = new TechnicalDebtAnalyzer(prisma);
  }

  /**
   * Trigger architecture analysis
   * POST /api/v1/analysis/architecture/:repositoryId
   */
  analyzeArchitecture = async (
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

      // Start analysis in background
      this.architectureMapper
        .generateArchitectureMap(repositoryId)
        .then(() => {
          logger.info('Architecture analysis completed', { repositoryId });
        })
        .catch((error: any) => {
          logger.error('Architecture analysis failed', { error, repositoryId });
        });

      res.status(202).json({
        success: true,
        message: 'Architecture analysis started',
      });
    } catch (error) {
      logger.error('Failed to start architecture analysis', { error });
      next(error);
    }
  };

  /**
   * Trigger technical debt analysis
   * POST /api/v1/analysis/debt/:repositoryId
   */
  analyzeTechnicalDebt = async (
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

      // Start analysis in background
      this.technicalDebtAnalyzer
        .analyzeRepository(repositoryId)
        .then(() => {
          logger.info('Technical debt analysis completed', { repositoryId });
        })
        .catch((error) => {
          logger.error('Technical debt analysis failed', { error, repositoryId });
        });

      res.status(202).json({
        success: true,
        message: 'Technical debt analysis started',
      });
    } catch (error) {
      logger.error('Failed to start technical debt analysis', { error });
      next(error);
    }
  };

  /**
   * Get all analyses for a repository
   * GET /api/v1/analysis/:repositoryId
   */
  getAnalyses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const analyses = await prisma.analysis.findMany({
        where: { repositoryId },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: analyses,
      });
    } catch (error) {
      logger.error('Failed to get analyses', { error });
      next(error);
    }
  };

  /**
   * Get a specific analysis
   * GET /api/v1/analysis/:repositoryId/:analysisId
   */
  getAnalysis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { repositoryId, analysisId } = req.params;

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

      const analysis = await prisma.analysis.findFirst({
        where: {
          id: analysisId,
          repositoryId,
        },
      });

      if (!analysis) {
        res.status(404).json({
          success: false,
          message: 'Analysis not found',
        });
        return;
      }

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      logger.error('Failed to get analysis', { error });
      next(error);
    }
  };
}

// Made with Bob