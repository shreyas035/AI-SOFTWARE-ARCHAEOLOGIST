import { PrismaClient, RepositoryStatus } from '@prisma/client';
import { ZipExtractor } from './zip-extractor';
import { GitHubCloner } from './github-cloner';
import { FileTreeBuilder } from './file-tree-builder';
import { LanguageDetector } from './language-detector';
import { DependencyParser } from './dependency-parser';
import { SummaryGenerator } from './summary-generator';
import { RepositoryMetadata, RepositoryAnalysisResult } from '../../types/repository.types';
import logger from '../../config/logger';

export class RepositoryIngestionService {
  private prisma: PrismaClient;
  private zipExtractor: ZipExtractor;
  private githubCloner: GitHubCloner;
  private fileTreeBuilder: FileTreeBuilder;
  private languageDetector: LanguageDetector;
  private dependencyParser: DependencyParser;
  private summaryGenerator: SummaryGenerator;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.zipExtractor = new ZipExtractor();
    this.githubCloner = new GitHubCloner();
    this.fileTreeBuilder = new FileTreeBuilder();
    this.languageDetector = new LanguageDetector();
    this.dependencyParser = new DependencyParser();
    this.summaryGenerator = new SummaryGenerator();
  }

  /**
   * Process a repository (ZIP or GitHub)
   */
  async processRepository(repositoryId: string): Promise<RepositoryAnalysisResult> {
    try {
      logger.info('Starting repository processing', { repositoryId });

      // Get repository from database
      const repository = await this.prisma.repository.findUnique({
        where: { id: repositoryId },
      });

      if (!repository) {
        throw new Error('Repository not found');
      }

      // Update status to processing
      await this.prisma.repository.update({
        where: { id: repositoryId },
        data: { status: RepositoryStatus.PROCESSING },
      });

      let rootPath: string;

      // Extract or clone repository
      if (repository.sourceType === 'ZIP') {
        const extractionResult = await this.zipExtractor.extract(repository.filePath, repositoryId);
        rootPath = extractionResult.rootDirectory;
      } else if (repository.sourceType === 'GITHUB') {
        const cloneResult = await this.githubCloner.clone(
          repository.sourceUrl!,
          repositoryId
        );
        rootPath = cloneResult.clonedPath;
      } else {
        throw new Error(`Unsupported source type: ${repository.sourceType}`);
      }

      // Build file tree
      const fileTree = await this.fileTreeBuilder.buildTree(rootPath);

      // Detect languages
      const languages = await this.languageDetector.detectLanguages(fileTree, rootPath);

      // Detect frameworks
      const frameworks = await this.languageDetector.detectFrameworks(rootPath);

      // Parse dependencies
      const dependencies = await this.dependencyParser.parseDependencies(rootPath);

      // Build metadata
      const metadata: RepositoryMetadata = {
        languages: languages.map((l) => l.language),
        languageStats: languages,
        frameworks: frameworks.map((f) => f.name),
        fileCount: this.fileTreeBuilder.getAllFiles(fileTree).length,
        totalLines: languages.reduce((sum, l) => sum + l.totalLines, 0),
        dependencies: dependencies.reduce((acc, dep) => {
          acc[dep.name] = dep.version;
          return acc;
        }, {} as Record<string, string>),
        entryPoints: this.detectEntryPoints(fileTree),
      };

      // Detect package manager
      if (await this.fileExists(rootPath, 'package-lock.json')) {
        metadata.packageManager = 'npm';
      } else if (await this.fileExists(rootPath, 'yarn.lock')) {
        metadata.packageManager = 'yarn';
      } else if (await this.fileExists(rootPath, 'pnpm-lock.yaml')) {
        metadata.packageManager = 'pnpm';
      }

      // Generate summary from metadata
      try {
        const repo = await this.prisma.repository.findUnique({ where: { id: repositoryId } });
        metadata.summary = this.summaryGenerator.generateSummary(repo?.name || 'Repository', metadata);
        logger.info('Summary generated successfully', { repositoryId });
      } catch (error) {
        logger.error('Failed to generate summary', { error, repositoryId });
        metadata.summary = `This repository contains ${metadata.fileCount} files with ${metadata.totalLines} lines of code in ${metadata.languages.join(', ')}.`;
      }

      // Update repository with metadata
      await this.prisma.repository.update({
        where: { id: repositoryId },
        data: {
          status: RepositoryStatus.COMPLETED,
          metadata: metadata as any,
          processedAt: new Date(),
        },
      });

      logger.info('Repository processing completed', {
        repositoryId,
        fileCount: metadata.fileCount,
        languages: metadata.languages,
      });

      const result: RepositoryAnalysisResult = {
        fileTree,
        metadata,
        dependencies,
        imports: [], // Will be populated by import analyzer
        entryPoints: metadata.entryPoints,
        criticalFiles: this.identifyCriticalFiles(fileTree, metadata),
      };

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error('Repository processing failed', {
        error: errorMessage,
        stack: errorStack,
        repositoryId
      });

      // Update status to failed
      await this.prisma.repository.update({
        where: { id: repositoryId },
        data: {
          status: RepositoryStatus.FAILED,
        },
      });

      throw error;
    }
  }

  /**
   * Detect entry points in the repository
   */
  private detectEntryPoints(fileTree: any): string[] {
    const entryPoints: string[] = [];
    const allFiles = this.fileTreeBuilder.getAllFiles(fileTree);

    const entryPointPatterns = [
      'index.js',
      'index.ts',
      'main.js',
      'main.ts',
      'app.js',
      'app.ts',
      'server.js',
      'server.ts',
      'index.html',
      'main.py',
      'app.py',
      '__init__.py',
      'Main.java',
      'Application.java',
      'main.go',
    ];

    for (const file of allFiles) {
      if (entryPointPatterns.some((pattern) => file.name === pattern)) {
        entryPoints.push(file.path);
      }
    }

    return entryPoints;
  }

  /**
   * Identify critical files (config, entry points, etc.)
   */
  private identifyCriticalFiles(fileTree: any, metadata: RepositoryMetadata): string[] {
    const criticalFiles: string[] = [];
    const allFiles = this.fileTreeBuilder.getAllFiles(fileTree);

    const criticalPatterns = [
      'package.json',
      'tsconfig.json',
      'webpack.config.js',
      'vite.config.ts',
      'next.config.js',
      '.env',
      '.env.example',
      'docker-compose.yml',
      'Dockerfile',
      'README.md',
      'requirements.txt',
      'Gemfile',
      'pom.xml',
      'go.mod',
      'Cargo.toml',
    ];

    for (const file of allFiles) {
      if (criticalPatterns.some((pattern) => file.name === pattern)) {
        criticalFiles.push(file.path);
      }
    }

    // Add entry points
    criticalFiles.push(...metadata.entryPoints);

    return [...new Set(criticalFiles)]; // Remove duplicates
  }

  /**
   * Check if a file exists in the repository
   */
  private async fileExists(rootPath: string, fileName: string): Promise<boolean> {
    const fs = await import('fs-extra');
    const path = await import('path');
    return fs.pathExists(path.join(rootPath, fileName));
  }

  /**
   * Clean up repository files
   */
  async cleanup(repositoryId: string): Promise<void> {
    try {
      await this.zipExtractor.cleanup(repositoryId);
      await this.githubCloner.cleanup(repositoryId);
      logger.info('Repository cleanup completed', { repositoryId });
    } catch (error) {
      logger.error('Repository cleanup failed', { error, repositoryId });
    }
  }

  /**
   * Get repository analysis summary
   */
  async getAnalysisSummary(repositoryId: string): Promise<any> {
    const repository = await this.prisma.repository.findUnique({
      where: { id: repositoryId },
      include: {
        _count: {
          select: {
            analyses: true,
            chatConversations: true,
            architectureMaps: true,
            debtReports: true,
          },
        },
      },
    });

    if (!repository) {
      throw new Error('Repository not found');
    }

    return {
      id: repository.id,
      name: repository.name,
      status: repository.status,
      metadata: repository.metadata,
      processedAt: repository.processedAt,
      counts: repository._count,
    };
  }
}

// Made with Bob
