import path from 'path';
import fs from 'fs-extra';
import { PrismaClient } from '@prisma/client';
import { FileTreeNode } from '../../types/repository.types';
import logger from '../../config/logger';

export interface CodeContext {
  repositoryName: string;
  fileTree: string;
  relevantFiles: FileContext[];
  metadata: {
    languages: string[];
    frameworks: string[];
    totalFiles: number;
    totalLines: number;
  };
}

export interface FileContext {
  path: string;
  language: string;
  content: string;
  lineCount: number;
  relevance: number; // 0-1 score
}

export class ContextBuilder {
  private prisma: PrismaClient;
  private readonly maxFilesInContext = 10;
  private readonly maxLinesPerFile = 500;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Build context for AI query
   */
  async buildContext(
    repositoryId: string,
    query: string,
    rootPath: string
  ): Promise<CodeContext> {
    try {
      logger.info('Building AI context', { repositoryId, query });

      // Get repository metadata
      const repository = await this.prisma.repository.findUnique({
        where: { id: repositoryId },
      });

      if (!repository || !repository.metadata) {
        throw new Error('Repository not found or not processed');
      }

      const metadata = repository.metadata as any;

      // Find relevant files based on query
      const relevantFiles = await this.findRelevantFiles(rootPath, query, metadata);

      // Build file tree representation
      const fileTree = await this.buildFileTreeString(rootPath);

      const context: CodeContext = {
        repositoryName: repository.name,
        fileTree,
        relevantFiles,
        metadata: {
          languages: metadata.languages || [],
          frameworks: metadata.frameworks || [],
          totalFiles: metadata.fileCount || 0,
          totalLines: metadata.totalLines || 0,
        },
      };

      logger.info('Context built successfully', {
        repositoryId,
        relevantFilesCount: relevantFiles.length,
      });

      return context;
    } catch (error) {
      logger.error('Failed to build context', { error, repositoryId, query });
      throw error;
    }
  }

  /**
   * Find files relevant to the query
   */
  private async findRelevantFiles(
    rootPath: string,
    query: string,
    metadata: any
  ): Promise<FileContext[]> {
    const queryLower = query.toLowerCase();
    const relevantFiles: FileContext[] = [];

    // Keywords to search for in query
    const keywords = this.extractKeywords(queryLower);

    // Search for files matching keywords
    const files = await this.getAllFiles(rootPath);

    for (const file of files) {
      const relevance = this.calculateRelevance(file, keywords, queryLower);

      if (relevance > 0.3) {
        try {
          const content = await this.readFileWithLimit(file, this.maxLinesPerFile);
          const lineCount = content.split('\n').length;

          relevantFiles.push({
            path: path.relative(rootPath, file),
            language: this.detectLanguage(file),
            content,
            lineCount,
            relevance,
          });
        } catch (error) {
          logger.warn('Failed to read file', { file, error });
        }
      }
    }

    // Sort by relevance and limit
    return relevantFiles
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, this.maxFilesInContext);
  }

  /**
   * Calculate file relevance score
   */
  private calculateRelevance(filePath: string, keywords: string[], query: string): number {
    let score = 0;
    const fileName = path.basename(filePath).toLowerCase();
    const dirName = path.dirname(filePath).toLowerCase();

    // Check if filename contains keywords
    for (const keyword of keywords) {
      if (fileName.includes(keyword)) {
        score += 0.5;
      }
      if (dirName.includes(keyword)) {
        score += 0.3;
      }
    }

    // Boost score for common important files
    const importantPatterns = [
      'auth',
      'config',
      'route',
      'controller',
      'service',
      'model',
      'schema',
      'middleware',
      'util',
      'helper',
    ];

    for (const pattern of importantPatterns) {
      if (query.includes(pattern) && fileName.includes(pattern)) {
        score += 0.4;
      }
    }

    // Boost for entry points
    if (
      fileName === 'index.ts' ||
      fileName === 'index.js' ||
      fileName === 'main.ts' ||
      fileName === 'app.ts'
    ) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Extract keywords from query
   */
  private extractKeywords(query: string): string[] {
    // Remove common words
    const stopWords = new Set([
      'how',
      'does',
      'work',
      'what',
      'is',
      'the',
      'a',
      'an',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
    ]);

    return query
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word))
      .map((word) => word.replace(/[^a-z0-9]/g, ''));
  }

  /**
   * Read file with line limit
   */
  private async readFileWithLimit(filePath: string, maxLines: number): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    if (lines.length <= maxLines) {
      return content;
    }

    // Return first maxLines with truncation notice
    return lines.slice(0, maxLines).join('\n') + '\n\n// ... (truncated)';
  }

  /**
   * Build file tree string representation
   */
  private async buildFileTreeString(rootPath: string): Promise<string> {
    const tree: string[] = [];
    const maxDepth = 3; // Limit depth for readability

    const buildTree = async (dir: string, prefix: string = '', depth: number = 0): Promise<void> => {
      if (depth > maxDepth) return;

      const entries = await fs.readdir(dir, { withFileTypes: true });
      const filtered = entries.filter(
        (entry) =>
          !entry.name.startsWith('.') &&
          entry.name !== 'node_modules' &&
          entry.name !== 'dist' &&
          entry.name !== 'build'
      );

      for (let i = 0; i < filtered.length; i++) {
        const entry = filtered[i];
        const isLast = i === filtered.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const relativePath = path.relative(rootPath, path.join(dir, entry.name));

        tree.push(`${prefix}${connector}${entry.name}`);

        if (entry.isDirectory() && depth < maxDepth) {
          const newPrefix = prefix + (isLast ? '    ' : '│   ');
          await buildTree(path.join(dir, entry.name), newPrefix, depth + 1);
        }
      }
    };

    await buildTree(rootPath);
    return tree.join('\n');
  }

  /**
   * Get all files in directory recursively
   */
  private async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    const traverse = async (currentDir: string): Promise<void> => {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        // Skip ignored directories
        if (
          entry.name === 'node_modules' ||
          entry.name === '.git' ||
          entry.name === 'dist' ||
          entry.name === 'build'
        ) {
          continue;
        }

        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          await traverse(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    };

    await traverse(dir);
    return files;
  }

  /**
   * Detect language from file extension
   */
  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.py': 'Python',
      '.java': 'Java',
      '.go': 'Go',
      '.rs': 'Rust',
      '.rb': 'Ruby',
      '.php': 'PHP',
      '.cs': 'C#',
      '.cpp': 'C++',
      '.c': 'C',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
    };

    return languageMap[ext] || 'Unknown';
  }
}

// Made with Bob
