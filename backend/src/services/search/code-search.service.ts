import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import logger from '../../config/logger';

interface SearchResult {
  file: string;
  line: number;
  column: number;
  content: string;
  context: {
    before: string[];
    after: string[];
  };
  language: string;
}

interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regex?: boolean;
  filePattern?: string;
  excludePattern?: string;
  maxResults?: number;
  contextLines?: number;
}

export class CodeSearchService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Search for code patterns across repository files
   */
  async searchInRepository(
    repositoryId: string,
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    try {
      const repository = await this.prisma.repository.findUnique({
        where: { id: repositoryId },
      });

      if (!repository || !repository.filePath) {
        throw new Error('Repository not found or not processed');
      }

      const {
        caseSensitive = false,
        wholeWord = false,
        regex = false,
        filePattern = '*',
        excludePattern = 'node_modules/**,dist/**,build/**,.git/**',
        maxResults = 100,
        contextLines = 3,
      } = options;

      const results: SearchResult[] = [];
      const searchPattern = this.buildSearchPattern(query, { caseSensitive, wholeWord, regex });

      // Get all files from repository
      const files = await this.getRepositoryFiles(repository.filePath, filePattern, excludePattern);

      for (const file of files) {
        if (results.length >= maxResults) break;

        const fileResults = await this.searchInFile(
          file,
          searchPattern,
          contextLines,
          maxResults - results.length
        );
        results.push(...fileResults);
      }

      logger.info('Code search completed', {
        repositoryId,
        query,
        resultsCount: results.length,
      });

      return results;
    } catch (error) {
      logger.error('Code search failed', { error, repositoryId, query });
      throw error;
    }
  }

  /**
   * Search for function definitions
   */
  async searchFunctions(repositoryId: string, functionName?: string): Promise<SearchResult[]> {
    const patterns = [
      `function\\s+${functionName || '\\w+'}\\s*\\(`,
      `const\\s+${functionName || '\\w+'}\\s*=\\s*\\(`,
      `${functionName || '\\w+'}\\s*:\\s*\\([^)]*\\)\\s*=>`,
      `def\\s+${functionName || '\\w+'}\\s*\\(`,
      `public\\s+\\w+\\s+${functionName || '\\w+'}\\s*\\(`,
    ];

    const allResults: SearchResult[] = [];

    for (const pattern of patterns) {
      const results = await this.searchInRepository(repositoryId, pattern, {
        regex: true,
        maxResults: 50,
      });
      allResults.push(...results);
    }

    return this.deduplicateResults(allResults);
  }

  /**
   * Search for class definitions
   */
  async searchClasses(repositoryId: string, className?: string): Promise<SearchResult[]> {
    const patterns = [
      `class\\s+${className || '\\w+'}`,
      `interface\\s+${className || '\\w+'}`,
      `type\\s+${className || '\\w+'}\\s*=`,
    ];

    const allResults: SearchResult[] = [];

    for (const pattern of patterns) {
      const results = await this.searchInRepository(repositoryId, pattern, {
        regex: true,
        maxResults: 50,
      });
      allResults.push(...results);
    }

    return this.deduplicateResults(allResults);
  }

  /**
   * Search for imports/requires
   */
  async searchImports(repositoryId: string, moduleName?: string): Promise<SearchResult[]> {
    const patterns = [
      `import\\s+.*from\\s+['"]${moduleName || '.*'}['"]`,
      `require\\s*\\(['"]${moduleName || '.*'}['"]\\)`,
      `from\\s+${moduleName || '\\w+'}\\s+import`,
    ];

    const allResults: SearchResult[] = [];

    for (const pattern of patterns) {
      const results = await this.searchInRepository(repositoryId, pattern, {
        regex: true,
        maxResults: 50,
      });
      allResults.push(...results);
    }

    return this.deduplicateResults(allResults);
  }

  /**
   * Search for TODO/FIXME comments
   */
  async searchTodos(repositoryId: string): Promise<SearchResult[]> {
    return this.searchInRepository(repositoryId, '(TODO|FIXME|HACK|XXX|NOTE):', {
      regex: true,
      maxResults: 200,
    });
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private buildSearchPattern(
    query: string,
    options: { caseSensitive?: boolean; wholeWord?: boolean; regex?: boolean }
  ): RegExp {
    let pattern = query;

    if (!options.regex) {
      // Escape special regex characters
      pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    if (options.wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }

    const flags = options.caseSensitive ? 'g' : 'gi';
    return new RegExp(pattern, flags);
  }

  private async getRepositoryFiles(
    basePath: string,
    includePattern: string,
    excludePattern: string
  ): Promise<string[]> {
    const files: string[] = [];
    const excludePatterns = excludePattern.split(',').map((p) => p.trim());

    const traverse = async (dir: string) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(basePath, fullPath);

          // Check if path should be excluded
          if (this.shouldExclude(relativePath, excludePatterns)) {
            continue;
          }

          if (entry.isDirectory()) {
            await traverse(fullPath);
          } else if (entry.isFile()) {
            // Check if file matches include pattern
            if (this.matchesPattern(entry.name, includePattern)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        logger.warn('Failed to read directory', { dir, error });
      }
    };

    await traverse(basePath);
    return files;
  }

  private async searchInFile(
    filePath: string,
    pattern: RegExp,
    contextLines: number,
    maxResults: number
  ): Promise<SearchResult[]> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const results: SearchResult[] = [];

      for (let i = 0; i < lines.length && results.length < maxResults; i++) {
        const line = lines[i];
        const matches = [...line.matchAll(pattern)];

        for (const match of matches) {
          if (results.length >= maxResults) break;

          const beforeLines = lines.slice(Math.max(0, i - contextLines), i);
          const afterLines = lines.slice(i + 1, Math.min(lines.length, i + 1 + contextLines));

          results.push({
            file: filePath,
            line: i + 1,
            column: match.index || 0,
            content: line,
            context: {
              before: beforeLines,
              after: afterLines,
            },
            language: this.detectLanguage(filePath),
          });
        }
      }

      return results;
    } catch (error) {
      logger.warn('Failed to search in file', { filePath, error });
      return [];
    }
  }

  private shouldExclude(relativePath: string, excludePatterns: string[]): boolean {
    return excludePatterns.some((pattern) => {
      const regexPattern = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '.');
      return new RegExp(regexPattern).test(relativePath);
    });
  }

  private matchesPattern(filename: string, pattern: string): boolean {
    if (pattern === '*') return true;

    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${regexPattern}$`).test(filename);
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.go': 'go',
      '.rb': 'ruby',
      '.php': 'php',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.rs': 'rust',
      '.sql': 'sql',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.md': 'markdown',
    };

    return languageMap[ext] || 'plaintext';
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter((result) => {
      const key = `${result.file}:${result.line}:${result.column}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

// Made with Bob