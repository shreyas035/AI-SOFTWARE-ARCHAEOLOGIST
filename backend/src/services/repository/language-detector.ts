import path from 'path';
import fs from 'fs-extra';
import { FileTreeNode } from '../../types/repository.types';
import logger from '../../config/logger';

export interface LanguageStats {
  language: string;
  fileCount: number;
  totalLines: number;
  percentage: number;
}

export interface FrameworkDetection {
  name: string;
  version?: string;
  confidence: 'high' | 'medium' | 'low';
  indicators: string[];
}

export class LanguageDetector {
  /**
   * Detect languages used in repository
   */
  async detectLanguages(fileTree: FileTreeNode, rootPath: string): Promise<LanguageStats[]> {
    try {
      logger.info('Detecting languages', { rootPath });

      const languageCounts: Record<string, { files: number; lines: number }> = {};
      const files = this.getAllFiles(fileTree);

      // Count files and lines per language
      for (const file of files) {
        if (file.language) {
          if (!languageCounts[file.language]) {
            languageCounts[file.language] = { files: 0, lines: 0 };
          }

          languageCounts[file.language].files++;

          // Count lines in file
          try {
            const filePath = path.join(rootPath, file.path);
            const lines = await this.countLines(filePath);
            languageCounts[file.language].lines += lines;
          } catch (error) {
            logger.warn('Failed to count lines', { file: file.path, error });
          }
        }
      }

      // Calculate total lines
      const totalLines = Object.values(languageCounts).reduce((sum, lang) => sum + lang.lines, 0);

      // Convert to stats array
      const stats: LanguageStats[] = Object.entries(languageCounts)
        .map(([language, counts]) => ({
          language,
          fileCount: counts.files,
          totalLines: counts.lines,
          percentage: totalLines > 0 ? (counts.lines / totalLines) * 100 : 0,
        }))
        .sort((a, b) => b.totalLines - a.totalLines);

      logger.info('Language detection completed', {
        rootPath,
        languages: stats.map((s) => s.language),
      });

      return stats;
    } catch (error) {
      logger.error('Language detection failed', { error, rootPath });
      throw new Error(`Failed to detect languages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect frameworks used in repository
   */
  async detectFrameworks(rootPath: string): Promise<FrameworkDetection[]> {
    try {
      logger.info('Detecting frameworks', { rootPath });

      const frameworks: FrameworkDetection[] = [];

      // Check for package.json (Node.js/JavaScript frameworks)
      const packageJsonPath = path.join(rootPath, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        frameworks.push(...this.detectJavaScriptFrameworks(packageJson));
      }

      // Check for requirements.txt (Python frameworks)
      const requirementsPath = path.join(rootPath, 'requirements.txt');
      if (await fs.pathExists(requirementsPath)) {
        const requirements = await fs.readFile(requirementsPath, 'utf-8');
        frameworks.push(...this.detectPythonFrameworks(requirements));
      }

      // Check for Gemfile (Ruby frameworks)
      const gemfilePath = path.join(rootPath, 'Gemfile');
      if (await fs.pathExists(gemfilePath)) {
        const gemfile = await fs.readFile(gemfilePath, 'utf-8');
        frameworks.push(...this.detectRubyFrameworks(gemfile));
      }

      // Check for pom.xml (Java frameworks)
      const pomPath = path.join(rootPath, 'pom.xml');
      if (await fs.pathExists(pomPath)) {
        const pom = await fs.readFile(pomPath, 'utf-8');
        frameworks.push(...this.detectJavaFrameworks(pom));
      }

      // Check for go.mod (Go frameworks)
      const goModPath = path.join(rootPath, 'go.mod');
      if (await fs.pathExists(goModPath)) {
        const goMod = await fs.readFile(goModPath, 'utf-8');
        frameworks.push(...this.detectGoFrameworks(goMod));
      }

      logger.info('Framework detection completed', {
        rootPath,
        frameworks: frameworks.map((f) => f.name),
      });

      return frameworks;
    } catch (error) {
      logger.error('Framework detection failed', { error, rootPath });
      return [];
    }
  }

  /**
   * Detect JavaScript/TypeScript frameworks
   */
  private detectJavaScriptFrameworks(packageJson: any): FrameworkDetection[] {
    const frameworks: FrameworkDetection[] = [];
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    const frameworkPatterns = [
      { name: 'React', packages: ['react', 'react-dom'], confidence: 'high' as const },
      { name: 'Next.js', packages: ['next'], confidence: 'high' as const },
      { name: 'Vue.js', packages: ['vue'], confidence: 'high' as const },
      { name: 'Nuxt.js', packages: ['nuxt'], confidence: 'high' as const },
      { name: 'Angular', packages: ['@angular/core'], confidence: 'high' as const },
      { name: 'Svelte', packages: ['svelte'], confidence: 'high' as const },
      { name: 'Express', packages: ['express'], confidence: 'high' as const },
      { name: 'NestJS', packages: ['@nestjs/core'], confidence: 'high' as const },
      { name: 'Fastify', packages: ['fastify'], confidence: 'high' as const },
      { name: 'Koa', packages: ['koa'], confidence: 'high' as const },
      { name: 'Gatsby', packages: ['gatsby'], confidence: 'high' as const },
      { name: 'Remix', packages: ['@remix-run/react'], confidence: 'high' as const },
      { name: 'Vite', packages: ['vite'], confidence: 'medium' as const },
      { name: 'Webpack', packages: ['webpack'], confidence: 'medium' as const },
    ];

    for (const pattern of frameworkPatterns) {
      const matchedPackages = pattern.packages.filter((pkg) => deps[pkg]);
      if (matchedPackages.length > 0) {
        frameworks.push({
          name: pattern.name,
          version: deps[matchedPackages[0]],
          confidence: pattern.confidence,
          indicators: matchedPackages,
        });
      }
    }

    return frameworks;
  }

  /**
   * Detect Python frameworks
   */
  private detectPythonFrameworks(requirements: string): FrameworkDetection[] {
    const frameworks: FrameworkDetection[] = [];
    const lines = requirements.toLowerCase().split('\n');

    const frameworkPatterns = [
      { name: 'Django', pattern: /django[>=<]/ },
      { name: 'Flask', pattern: /flask[>=<]/ },
      { name: 'FastAPI', pattern: /fastapi[>=<]/ },
      { name: 'Pyramid', pattern: /pyramid[>=<]/ },
      { name: 'Tornado', pattern: /tornado[>=<]/ },
      { name: 'Bottle', pattern: /bottle[>=<]/ },
      { name: 'Sanic', pattern: /sanic[>=<]/ },
    ];

    for (const pattern of frameworkPatterns) {
      const matched = lines.some((line) => pattern.pattern.test(line));
      if (matched) {
        frameworks.push({
          name: pattern.name,
          confidence: 'high',
          indicators: ['requirements.txt'],
        });
      }
    }

    return frameworks;
  }

  /**
   * Detect Ruby frameworks
   */
  private detectRubyFrameworks(gemfile: string): FrameworkDetection[] {
    const frameworks: FrameworkDetection[] = [];
    const lines = gemfile.toLowerCase().split('\n');

    if (lines.some((line) => line.includes("gem 'rails'"))) {
      frameworks.push({
        name: 'Ruby on Rails',
        confidence: 'high',
        indicators: ['Gemfile'],
      });
    }

    if (lines.some((line) => line.includes("gem 'sinatra'"))) {
      frameworks.push({
        name: 'Sinatra',
        confidence: 'high',
        indicators: ['Gemfile'],
      });
    }

    return frameworks;
  }

  /**
   * Detect Java frameworks
   */
  private detectJavaFrameworks(pom: string): FrameworkDetection[] {
    const frameworks: FrameworkDetection[] = [];

    if (pom.includes('spring-boot')) {
      frameworks.push({
        name: 'Spring Boot',
        confidence: 'high',
        indicators: ['pom.xml'],
      });
    }

    if (pom.includes('quarkus')) {
      frameworks.push({
        name: 'Quarkus',
        confidence: 'high',
        indicators: ['pom.xml'],
      });
    }

    return frameworks;
  }

  /**
   * Detect Go frameworks
   */
  private detectGoFrameworks(goMod: string): FrameworkDetection[] {
    const frameworks: FrameworkDetection[] = [];

    if (goMod.includes('gin-gonic/gin')) {
      frameworks.push({
        name: 'Gin',
        confidence: 'high',
        indicators: ['go.mod'],
      });
    }

    if (goMod.includes('gofiber/fiber')) {
      frameworks.push({
        name: 'Fiber',
        confidence: 'high',
        indicators: ['go.mod'],
      });
    }

    if (goMod.includes('echo')) {
      frameworks.push({
        name: 'Echo',
        confidence: 'high',
        indicators: ['go.mod'],
      });
    }

    return frameworks;
  }

  /**
   * Count lines in a file
   */
  private async countLines(filePath: string): Promise<number> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content.split('\n').length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get all files from tree
   */
  private getAllFiles(node: FileTreeNode): FileTreeNode[] {
    const files: FileTreeNode[] = [];

    const traverse = (currentNode: FileTreeNode): void => {
      if (currentNode.type === 'file') {
        files.push(currentNode);
      } else if (currentNode.children) {
        for (const child of currentNode.children) {
          traverse(child);
        }
      }
    };

    traverse(node);
    return files;
  }
}

// Made with Bob
