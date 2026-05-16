import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { RepositoryIngestionService } from '../services/repository/ingestion.service';
import logger from '../config/logger';

const prisma = new PrismaClient();

export class RepositoryController {
  private ingestionService: RepositoryIngestionService;

  constructor() {
    this.ingestionService = new RepositoryIngestionService(prisma);
  }

  /**
   * Upload and process a repository (ZIP file)
   * POST /api/v1/repositories/upload
   */
  uploadRepository = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const file = req.file;

      if (!file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
        return;
      }

      const { name } = req.body;

      // Create repository record
      const repository = await prisma.repository.create({
        data: {
          userId,
          name: name || file.originalname,
          sourceType: 'ZIP',
          filePath: file.path,
          status: 'PROCESSING',
        },
      });

      // Start processing in background
      this.ingestionService
        .processRepository(repository.id)
        .then(() => {
          logger.info('Repository processed successfully', { repositoryId: repository.id });
        })
        .catch((error: any) => {
          logger.error('Repository processing failed', { error, repositoryId: repository.id });
        });

      res.status(202).json({
        success: true,
        message: 'Repository upload started',
        data: repository,
      });
    } catch (error) {
      logger.error('Repository upload failed', { error });
      next(error);
    }
  };

  /**
   * Clone a repository from GitHub
   * POST /api/v1/repositories/clone
   */
  cloneRepository = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { url, name, branch } = req.body;

      if (!url) {
        res.status(400).json({
          success: false,
          message: 'Repository URL is required',
        });
        return;
      }

      // Create repository record
      const repository = await prisma.repository.create({
        data: {
          userId,
          name: name || this.extractRepoName(url),
          sourceType: 'GITHUB',
          sourceUrl: url,
          filePath: '', // Will be updated after cloning
          status: 'PROCESSING',
        },
      });

      // Start cloning in background
      this.ingestionService
        .processRepository(repository.id)
        .then(() => {
          logger.info('Repository cloned successfully', { repositoryId: repository.id });
        })
        .catch((error: any) => {
          logger.error('Repository cloning failed', { error, repositoryId: repository.id });
        });

      res.status(202).json({
        success: true,
        message: 'Repository cloning started',
        data: repository,
      });
    } catch (error) {
      logger.error('Repository clone failed', { error });
      next(error);
    }
  };

  /**
   * Get all repositories for the authenticated user
   * GET /api/v1/repositories
   */
  getRepositories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;

      const repositories = await prisma.repository.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          sourceType: true,
          sourceUrl: true,
          status: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json({
        success: true,
        data: repositories,
      });
    } catch (error) {
      logger.error('Failed to get repositories', { error });
      next(error);
    }
  };

  /**
   * Get a specific repository by ID
   * GET /api/v1/repositories/:id
   */
  getRepository = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const repository = await prisma.repository.findFirst({
        where: {
          id,
          userId,
        },
        include: {
          analyses: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          chatConversations: {
            orderBy: { updatedAt: 'desc' },
            take: 5,
          },
        },
      });

      if (!repository) {
        res.status(404).json({
          success: false,
          message: 'Repository not found',
        });
        return;
      }

      res.json({
        success: true,
        data: repository,
      });
    } catch (error) {
      logger.error('Failed to get repository', { error });
      next(error);
    }
  };

  /**
   * Get repository status
   * GET /api/v1/repositories/:id/status
   */
  getRepositoryStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const repository = await prisma.repository.findFirst({
        where: {
          id,
          userId,
        },
        select: {
          id: true,
          status: true,
          metadata: true,
        },
      });

      if (!repository) {
        res.status(404).json({
          success: false,
          message: 'Repository not found',
        });
        return;
      }

      res.json({
        success: true,
        data: repository,
      });
    } catch (error) {
      logger.error('Failed to get repository status', { error });
      next(error);
    }
  };

  /**
   * Get repository summary
   * GET /api/v1/repositories/:id/summary
   */
  getRepositorySummary = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const repository = await prisma.repository.findFirst({
        where: {
          id,
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

      const metadata = repository.metadata as any;

      const summary = {
        name: repository.name,
        status: repository.status,
        languages: metadata?.languages || [],
        frameworks: metadata?.frameworks || [],
        totalFiles: metadata?.fileCount || 0,
        totalLines: metadata?.totalLines || 0,
        dependencies: metadata?.dependencies || {},
        entryPoints: metadata?.entryPoints || [],
      };

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      logger.error('Failed to get repository summary', { error });
      next(error);
    }
  };

  /**
   * Delete a repository
   * DELETE /api/v1/repositories/:id
   */
  deleteRepository = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const repository = await prisma.repository.findFirst({
        where: {
          id,
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

      // Delete repository (cascade will delete related data)
      await prisma.repository.delete({
        where: { id },
      });

      logger.info('Repository deleted', { repositoryId: id, userId });

      res.json({
        success: true,
        message: 'Repository deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete repository', { error });
      next(error);
    }
  };

  // ============================================
  // HELPER METHODS
  // ============================================

  private extractRepoName(url: string): string {
    const match = url.match(/\/([^\/]+?)(?:\.git)?$/);
    return match ? match[1] : 'repository';
  }
}

// Made with Bob