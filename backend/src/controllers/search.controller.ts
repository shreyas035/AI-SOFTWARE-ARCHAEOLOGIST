import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { CodeSearchService } from '../services/search/code-search.service';
import logger from '../config/logger';

const prisma = new PrismaClient();

export class SearchController {
  private searchService: CodeSearchService;

  constructor() {
    this.searchService = new CodeSearchService(prisma);
  }

  /**
   * Search for code patterns in a repository
   * POST /api/v1/search/code/:repositoryId
   */
  searchCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { repositoryId } = req.params;
      const { query, options } = req.body;

      if (!query) {
        res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
        return;
      }

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

      const results = await this.searchService.searchInRepository(repositoryId, query, options);

      res.json({
        success: true,
        data: {
          query,
          resultsCount: results.length,
          results,
        },
      });
    } catch (error) {
      logger.error('Code search failed', { error });
      next(error);
    }
  };

  /**
   * Search for function definitions
   * GET /api/v1/search/functions/:repositoryId
   */
  searchFunctions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { repositoryId } = req.params;
      const { name } = req.query;

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

      const results = await this.searchService.searchFunctions(
        repositoryId,
        name as string | undefined
      );

      res.json({
        success: true,
        data: {
          resultsCount: results.length,
          results,
        },
      });
    } catch (error) {
      logger.error('Function search failed', { error });
      next(error);
    }
  };

  /**
   * Search for class definitions
   * GET /api/v1/search/classes/:repositoryId
   */
  searchClasses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { repositoryId } = req.params;
      const { name } = req.query;

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

      const results = await this.searchService.searchClasses(
        repositoryId,
        name as string | undefined
      );

      res.json({
        success: true,
        data: {
          resultsCount: results.length,
          results,
        },
      });
    } catch (error) {
      logger.error('Class search failed', { error });
      next(error);
    }
  };

  /**
   * Search for imports
   * GET /api/v1/search/imports/:repositoryId
   */
  searchImports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { repositoryId } = req.params;
      const { module } = req.query;

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

      const results = await this.searchService.searchImports(
        repositoryId,
        module as string | undefined
      );

      res.json({
        success: true,
        data: {
          resultsCount: results.length,
          results,
        },
      });
    } catch (error) {
      logger.error('Import search failed', { error });
      next(error);
    }
  };

  /**
   * Search for TODO/FIXME comments
   * GET /api/v1/search/todos/:repositoryId
   */
  searchTodos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const results = await this.searchService.searchTodos(repositoryId);

      res.json({
        success: true,
        data: {
          resultsCount: results.length,
          results,
        },
      });
    } catch (error) {
      logger.error('TODO search failed', { error });
      next(error);
    }
  };

  /**
   * Advanced repository search with filters
   * GET /api/v1/search/repositories
   */
  searchRepositories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const {
        query,
        language,
        framework,
        status,
        sourceType,
        dateFrom,
        dateTo,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 20,
      } = req.query;

      // Build filter conditions
      const where: any = { userId };

      if (query) {
        where.name = {
          contains: query as string,
          mode: 'insensitive',
        };
      }

      if (status) {
        where.status = status;
      }

      if (sourceType) {
        where.sourceType = sourceType;
      }

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          where.createdAt.gte = new Date(dateFrom as string);
        }
        if (dateTo) {
          where.createdAt.lte = new Date(dateTo as string);
        }
      }

      // Filter by language or framework in metadata
      if (language || framework) {
        const metadataFilter: any = {};
        
        if (language) {
          metadataFilter.path = ['languages', language as string];
          metadataFilter.not = null;
        }
        
        if (framework) {
          metadataFilter.path = ['frameworks'];
          metadataFilter.array_contains = framework;
        }

        where.metadata = metadataFilter;
      }

      // Pagination
      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      // Execute query
      const [repositories, total] = await Promise.all([
        prisma.repository.findMany({
          where,
          orderBy: { [sortBy as string]: sortOrder },
          skip,
          take,
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
        }),
        prisma.repository.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          repositories,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logger.error('Repository search failed', { error });
      next(error);
    }
  };

  /**
   * Get search suggestions
   * GET /api/v1/search/suggestions/:repositoryId
   */
  getSearchSuggestions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { repositoryId } = req.params;
      const { query } = req.query;

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
      const suggestions: string[] = [];

      // Add language suggestions
      if (metadata?.languages) {
        Object.keys(metadata.languages).forEach((lang) => {
          if (!query || lang.toLowerCase().includes((query as string).toLowerCase())) {
            suggestions.push(`language:${lang}`);
          }
        });
      }

      // Add framework suggestions
      if (metadata?.frameworks) {
        metadata.frameworks.forEach((fw: string) => {
          if (!query || fw.toLowerCase().includes((query as string).toLowerCase())) {
            suggestions.push(`framework:${fw}`);
          }
        });
      }

      // Add file type suggestions
      const commonExtensions = ['.js', '.ts', '.py', '.java', '.cpp', '.go', '.rb', '.php'];
      commonExtensions.forEach((ext) => {
        if (!query || ext.includes(query as string)) {
          suggestions.push(`file:*${ext}`);
        }
      });

      res.json({
        success: true,
        data: {
          suggestions: suggestions.slice(0, 10),
        },
      });
    } catch (error) {
      logger.error('Search suggestions failed', { error });
      next(error);
    }
  };
}

// Made with Bob