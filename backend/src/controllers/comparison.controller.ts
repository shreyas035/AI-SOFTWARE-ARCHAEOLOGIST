import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { RepositoryComparisonService } from '../services/comparison/repository-comparison.service';
import logger from '../config/logger';

const prisma = new PrismaClient();

export class ComparisonController {
  private comparisonService: RepositoryComparisonService;

  constructor() {
    this.comparisonService = new RepositoryComparisonService(prisma);
  }

  /**
   * Compare two repositories
   * POST /api/v1/comparison/compare
   */
  compareRepositories = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { repositoryId1, repositoryId2 } = req.body;

      if (!repositoryId1 || !repositoryId2) {
        res.status(400).json({
          success: false,
          message: 'Both repository IDs are required',
        });
        return;
      }

      if (repositoryId1 === repositoryId2) {
        res.status(400).json({
          success: false,
          message: 'Cannot compare a repository with itself',
        });
        return;
      }

      const comparison = await this.comparisonService.compareRepositories(
        repositoryId1,
        repositoryId2,
        userId
      );

      res.json({
        success: true,
        data: comparison,
      });
    } catch (error) {
      logger.error('Repository comparison failed', { error });
      next(error);
    }
  };

  /**
   * Compare multiple repositories (batch comparison)
   * POST /api/v1/comparison/compare-multiple
   */
  compareMultiple = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { repositoryIds } = req.body;

      if (!Array.isArray(repositoryIds) || repositoryIds.length < 2) {
        res.status(400).json({
          success: false,
          message: 'At least 2 repository IDs are required',
        });
        return;
      }

      if (repositoryIds.length > 10) {
        res.status(400).json({
          success: false,
          message: 'Maximum 10 repositories can be compared at once',
        });
        return;
      }

      const comparison = await this.comparisonService.compareMultipleRepositories(
        repositoryIds,
        userId
      );

      res.json({
        success: true,
        data: comparison,
      });
    } catch (error) {
      logger.error('Multiple repository comparison failed', { error });
      next(error);
    }
  };

  /**
   * Get comparison history
   * GET /api/v1/comparison/history
   */
  getComparisonHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 20 } = req.query;

      // In a real implementation, you'd store comparison history in the database
      // For now, we'll return an empty array
      const history: any[] = [];

      res.json({
        success: true,
        data: {
          history,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            totalPages: 0,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to get comparison history', { error });
      next(error);
    }
  };

  /**
   * Compare repository metrics over time
   * GET /api/v1/comparison/trends/:repositoryId
   */
  getRepositoryTrends = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { repositoryId } = req.params;
      const { metric = 'complexity', period = '30d' } = req.query;

      // Verify repository ownership
      const repository = await prisma.repository.findFirst({
        where: { id: repositoryId, userId },
      });

      if (!repository) {
        res.status(404).json({
          success: false,
          message: 'Repository not found',
        });
        return;
      }

      // Get historical analyses
      const analyses = await prisma.analysis.findMany({
        where: { repositoryId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          analysisType: true,
          result: true,
          createdAt: true,
        },
      });

      // Extract trend data based on metric
      const trendData = analyses.map((analysis) => {
        const result = analysis.result as any;
        let value = 0;

        switch (metric) {
          case 'complexity':
            value = result?.complexity?.average || 0;
            break;
          case 'debt':
            value = result?.overallScore || 0;
            break;
          case 'files':
            value = result?.fileCount || 0;
            break;
          case 'lines':
            value = result?.totalLines || 0;
            break;
          default:
            value = 0;
        }

        return {
          date: analysis.createdAt,
          value,
          analysisType: analysis.analysisType,
        };
      });

      res.json({
        success: true,
        data: {
          metric,
          period,
          trends: trendData,
        },
      });
    } catch (error) {
      logger.error('Failed to get repository trends', { error });
      next(error);
    }
  };

  /**
   * Compare repository with industry benchmarks
   * GET /api/v1/comparison/benchmark/:repositoryId
   */
  getBenchmarkComparison = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { repositoryId } = req.params;

      // Verify repository ownership
      const repository = await prisma.repository.findFirst({
        where: { id: repositoryId, userId },
      });

      if (!repository) {
        res.status(404).json({
          success: false,
          message: 'Repository not found',
        });
        return;
      }

      const metadata = repository.metadata as any;

      // Industry benchmarks (these would typically come from a database or external service)
      const benchmarks = {
        complexity: {
          excellent: { min: 0, max: 10 },
          good: { min: 10, max: 20 },
          fair: { min: 20, max: 30 },
          poor: { min: 30, max: 100 },
        },
        fileSize: {
          excellent: { min: 0, max: 200 },
          good: { min: 200, max: 500 },
          fair: { min: 500, max: 1000 },
          poor: { min: 1000, max: 10000 },
        },
        testCoverage: {
          excellent: { min: 80, max: 100 },
          good: { min: 60, max: 80 },
          fair: { min: 40, max: 60 },
          poor: { min: 0, max: 40 },
        },
      };

      // Get latest technical debt report
      const debtReport = await prisma.technicalDebtReport.findFirst({
        where: { repositoryId },
        orderBy: { createdAt: 'desc' },
      });

      const currentMetrics = {
        complexity: metadata?.complexity?.average || 0,
        fileSize: metadata?.avgFileSize || 0,
        testCoverage: metadata?.testCoverage || 0,
        debtScore: debtReport?.overallScore || 0,
      };

      // Calculate ratings
      const ratings = {
        complexity: this.getRating(currentMetrics.complexity, benchmarks.complexity),
        fileSize: this.getRating(currentMetrics.fileSize, benchmarks.fileSize),
        testCoverage: this.getRating(currentMetrics.testCoverage, benchmarks.testCoverage),
      };

      res.json({
        success: true,
        data: {
          currentMetrics,
          benchmarks,
          ratings,
          overallRating: this.calculateOverallRating(ratings),
        },
      });
    } catch (error) {
      logger.error('Failed to get benchmark comparison', { error });
      next(error);
    }
  };

  // ============================================
  // HELPER METHODS
  // ============================================

  private getRating(
    value: number,
    benchmark: { excellent: any; good: any; fair: any; poor: any }
  ): string {
    if (value >= benchmark.excellent.min && value <= benchmark.excellent.max) {
      return 'excellent';
    } else if (value >= benchmark.good.min && value <= benchmark.good.max) {
      return 'good';
    } else if (value >= benchmark.fair.min && value <= benchmark.fair.max) {
      return 'fair';
    } else {
      return 'poor';
    }
  }

  private calculateOverallRating(ratings: Record<string, string>): string {
    const ratingScores: Record<string, number> = {
      excellent: 4,
      good: 3,
      fair: 2,
      poor: 1,
    };

    const values = Object.values(ratings);
    const totalScore = values.reduce((sum, rating) => sum + ratingScores[rating], 0);
    const avgScore = totalScore / values.length;

    if (avgScore >= 3.5) return 'excellent';
    if (avgScore >= 2.5) return 'good';
    if (avgScore >= 1.5) return 'fair';
    return 'poor';
  }
}

// Made with Bob