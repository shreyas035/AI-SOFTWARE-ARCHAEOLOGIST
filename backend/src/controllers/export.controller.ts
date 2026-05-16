import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ExportService } from '../services/export/export.service';
import logger from '../config/logger';

const prisma = new PrismaClient();

export class ExportController {
  private exportService: ExportService;

  constructor() {
    this.exportService = new ExportService(prisma);
  }

  /**
   * Export repository data and analysis
   * POST /api/v1/export/repository/:repositoryId
   */
  exportRepository = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { repositoryId } = req.params;
      const {
        format = 'json',
        includeAnalysis = true,
        includeArchitecture = true,
        includeTechnicalDebt = true,
        includeChat = false,
      } = req.body;

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

      const { content, filename, mimeType } = await this.exportService.exportRepository(
        repositoryId,
        userId,
        {
          format,
          includeAnalysis,
          includeArchitecture,
          includeTechnicalDebt,
          includeChat,
        }
      );

      // Set headers for file download
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(content);
    } catch (error) {
      logger.error('Repository export failed', { error });
      next(error);
    }
  };

  /**
   * Generate executive summary
   * GET /api/v1/export/summary/:repositoryId
   */
  generateSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const summary = await this.exportService.generateExecutiveSummary(repositoryId, userId);

      res.json({
        success: true,
        data: {
          summary,
        },
      });
    } catch (error) {
      logger.error('Executive summary generation failed', { error });
      next(error);
    }
  };

  /**
   * Create shareable link
   * POST /api/v1/export/share/:repositoryId
   */
  createShareLink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { repositoryId } = req.params;
      const { expiresIn = 7 * 24 * 60 * 60 * 1000 } = req.body; // Default 7 days

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

      const { shareId, expiresAt } = await this.exportService.createShareableLink(
        repositoryId,
        userId,
        expiresIn
      );

      const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/share/${shareId}`;

      res.json({
        success: true,
        data: {
          shareId,
          shareUrl,
          expiresAt,
        },
      });
    } catch (error) {
      logger.error('Share link creation failed', { error });
      next(error);
    }
  };

  /**
   * Export comparison report
   * POST /api/v1/export/comparison
   */
  exportComparison = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { comparisonData, format = 'json' } = req.body;

      if (!comparisonData) {
        res.status(400).json({
          success: false,
          message: 'Comparison data is required',
        });
        return;
      }

      const { content, filename, mimeType } = await this.exportService.exportComparison(
        comparisonData,
        format
      );

      // Set headers for file download
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(content);
    } catch (error) {
      logger.error('Comparison export failed', { error });
      next(error);
    }
  };

  /**
   * Export analysis results
   * GET /api/v1/export/analysis/:analysisId
   */
  exportAnalysis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { analysisId } = req.params;
      const { format = 'json' } = req.query;

      // Get analysis and verify ownership
      const analysis = await prisma.analysis.findFirst({
        where: { id: analysisId },
        include: {
          repository: {
            select: {
              userId: true,
              name: true,
            },
          },
        },
      });

      if (!analysis || analysis.repository.userId !== userId) {
        res.status(404).json({
          success: false,
          message: 'Analysis not found',
        });
        return;
      }

      let content: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          content = JSON.stringify(analysis, null, 2);
          filename = `analysis-${analysisId}.json`;
          mimeType = 'application/json';
          break;
        case 'markdown':
          content = this.formatAnalysisAsMarkdown(analysis);
          filename = `analysis-${analysisId}.md`;
          mimeType = 'text/markdown';
          break;
        default:
          content = JSON.stringify(analysis, null, 2);
          filename = `analysis-${analysisId}.json`;
          mimeType = 'application/json';
      }

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(content);
    } catch (error) {
      logger.error('Analysis export failed', { error });
      next(error);
    }
  };

  /**
   * Bulk export multiple repositories
   * POST /api/v1/export/bulk
   */
  bulkExport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { repositoryIds, format = 'json' } = req.body;

      if (!Array.isArray(repositoryIds) || repositoryIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Repository IDs array is required',
        });
        return;
      }

      if (repositoryIds.length > 20) {
        res.status(400).json({
          success: false,
          message: 'Maximum 20 repositories can be exported at once',
        });
        return;
      }

      // Verify all repositories belong to user
      const repositories = await prisma.repository.findMany({
        where: {
          id: { in: repositoryIds },
          userId,
        },
      });

      if (repositories.length !== repositoryIds.length) {
        res.status(404).json({
          success: false,
          message: 'Some repositories not found',
        });
        return;
      }

      // Export all repositories
      const exports = await Promise.all(
        repositoryIds.map((id) =>
          this.exportService.exportRepository(id, userId, {
            format,
            includeAnalysis: true,
            includeArchitecture: true,
            includeTechnicalDebt: true,
          })
        )
      );

      // Combine all exports
      const combinedData = exports.map((exp, index) => ({
        repository: repositories[index].name,
        data: format === 'json' ? JSON.parse(exp.content) : exp.content,
      }));

      const content =
        format === 'json'
          ? JSON.stringify(combinedData, null, 2)
          : combinedData.map((d) => d.data).join('\n\n---\n\n');

      const filename = `bulk-export-${Date.now()}.${format === 'json' ? 'json' : 'md'}`;
      const mimeType = format === 'json' ? 'application/json' : 'text/markdown';

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(content);
    } catch (error) {
      logger.error('Bulk export failed', { error });
      next(error);
    }
  };

  // ============================================
  // HELPER METHODS
  // ============================================

  private formatAnalysisAsMarkdown(analysis: any): string {
    let markdown = `# Analysis Report\n\n`;
    markdown += `**Type:** ${analysis.analysisType}\n`;
    markdown += `**Status:** ${analysis.status}\n`;
    markdown += `**Created:** ${new Date(analysis.createdAt).toLocaleString()}\n`;
    if (analysis.completedAt) {
      markdown += `**Completed:** ${new Date(analysis.completedAt).toLocaleString()}\n`;
    }
    markdown += `\n---\n\n`;

    markdown += `## Results\n\n`;
    markdown += `\`\`\`json\n${JSON.stringify(analysis.result, null, 2)}\n\`\`\`\n`;

    return markdown;
  }
}

// Made with Bob