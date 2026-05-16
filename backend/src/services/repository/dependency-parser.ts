import path from 'path';
import fs from 'fs-extra';
import { DependencyInfo } from '../../types/repository.types';
import logger from '../../config/logger';

export class DependencyParser {
  /**
   * Parse dependencies from repository
   */
  async parseDependencies(rootPath: string): Promise<DependencyInfo[]> {
    try {
      logger.info('Parsing dependencies', { rootPath });

      const dependencies: DependencyInfo[] = [];

      // Parse Node.js dependencies
      const nodeDepsProd = await this.parsePackageJson(rootPath, 'production');
      const nodeDepsDev = await this.parsePackageJson(rootPath, 'development');
      dependencies.push(...nodeDepsProd, ...nodeDepsDev);

      // Parse Python dependencies
      const pythonDeps = await this.parseRequirementsTxt(rootPath);
      dependencies.push(...pythonDeps);

      // Parse Ruby dependencies
      const rubyDeps = await this.parseGemfile(rootPath);
      dependencies.push(...rubyDeps);

      // Parse Java dependencies
      const javaDeps = await this.parsePomXml(rootPath);
      dependencies.push(...javaDeps);

      // Parse Go dependencies
      const goDeps = await this.parseGoMod(rootPath);
      dependencies.push(...goDeps);

      logger.info('Dependency parsing completed', {
        rootPath,
        totalDependencies: dependencies.length,
      });

      return dependencies;
    } catch (error) {
      logger.error('Dependency parsing failed', { error, rootPath });
      return [];
    }
  }

  /**
   * Parse package.json dependencies
   */
  private async parsePackageJson(
    rootPath: string,
    type: 'production' | 'development'
  ): Promise<DependencyInfo[]> {
    try {
      const packageJsonPath = path.join(rootPath, 'package.json');
      if (!(await fs.pathExists(packageJsonPath))) {
        return [];
      }

      const packageJson = await fs.readJson(packageJsonPath);
      const deps = type === 'production' ? packageJson.dependencies : packageJson.devDependencies;

      if (!deps) {
        return [];
      }

      return Object.entries(deps).map(([name, version]) => ({
        name,
        version: String(version),
        type,
        outdated: false, // Would need npm outdated check
      }));
    } catch (error) {
      logger.warn('Failed to parse package.json', { error, rootPath });
      return [];
    }
  }

  /**
   * Parse requirements.txt dependencies
   */
  private async parseRequirementsTxt(rootPath: string): Promise<DependencyInfo[]> {
    try {
      const requirementsPath = path.join(rootPath, 'requirements.txt');
      if (!(await fs.pathExists(requirementsPath))) {
        return [];
      }

      const content = await fs.readFile(requirementsPath, 'utf-8');
      const lines = content.split('\n').filter((line) => line.trim() && !line.startsWith('#'));

      return lines.map((line) => {
        const match = line.match(/^([a-zA-Z0-9_-]+)([>=<~!]+)?(.+)?$/);
        if (match) {
          return {
            name: match[1],
            version: match[3] || 'latest',
            type: 'production' as const,
            outdated: false,
          };
        }
        return {
          name: line.trim(),
          version: 'latest',
          type: 'production' as const,
          outdated: false,
        };
      });
    } catch (error) {
      logger.warn('Failed to parse requirements.txt', { error, rootPath });
      return [];
    }
  }

  /**
   * Parse Gemfile dependencies
   */
  private async parseGemfile(rootPath: string): Promise<DependencyInfo[]> {
    try {
      const gemfilePath = path.join(rootPath, 'Gemfile');
      if (!(await fs.pathExists(gemfilePath))) {
        return [];
      }

      const content = await fs.readFile(gemfilePath, 'utf-8');
      const lines = content.split('\n').filter((line) => line.trim().startsWith('gem '));

      return lines.map((line) => {
        const match = line.match(/gem\s+['"]([^'"]+)['"]\s*,?\s*['"]?([^'"]*)?['"]?/);
        if (match) {
          return {
            name: match[1],
            version: match[2] || 'latest',
            type: 'production' as const,
            outdated: false,
          };
        }
        return {
          name: line.trim(),
          version: 'latest',
          type: 'production' as const,
          outdated: false,
        };
      });
    } catch (error) {
      logger.warn('Failed to parse Gemfile', { error, rootPath });
      return [];
    }
  }

  /**
   * Parse pom.xml dependencies
   */
  private async parsePomXml(rootPath: string): Promise<DependencyInfo[]> {
    try {
      const pomPath = path.join(rootPath, 'pom.xml');
      if (!(await fs.pathExists(pomPath))) {
        return [];
      }

      const content = await fs.readFile(pomPath, 'utf-8');
      const dependencies: DependencyInfo[] = [];

      // Simple regex-based parsing (for production, use proper XML parser)
      const dependencyPattern = /<dependency>[\s\S]*?<groupId>(.*?)<\/groupId>[\s\S]*?<artifactId>(.*?)<\/artifactId>[\s\S]*?<version>(.*?)<\/version>[\s\S]*?<\/dependency>/g;
      let match;

      while ((match = dependencyPattern.exec(content)) !== null) {
        dependencies.push({
          name: `${match[1]}:${match[2]}`,
          version: match[3],
          type: 'production',
          outdated: false,
        });
      }

      return dependencies;
    } catch (error) {
      logger.warn('Failed to parse pom.xml', { error, rootPath });
      return [];
    }
  }

  /**
   * Parse go.mod dependencies
   */
  private async parseGoMod(rootPath: string): Promise<DependencyInfo[]> {
    try {
      const goModPath = path.join(rootPath, 'go.mod');
      if (!(await fs.pathExists(goModPath))) {
        return [];
      }

      const content = await fs.readFile(goModPath, 'utf-8');
      const lines = content.split('\n').filter((line) => line.trim() && !line.startsWith('//'));

      const dependencies: DependencyInfo[] = [];
      let inRequireBlock = false;

      for (const line of lines) {
        if (line.includes('require (')) {
          inRequireBlock = true;
          continue;
        }

        if (inRequireBlock && line.includes(')')) {
          inRequireBlock = false;
          continue;
        }

        if (inRequireBlock || line.trim().startsWith('require ')) {
          const match = line.match(/([^\s]+)\s+v?([^\s]+)/);
          if (match) {
            dependencies.push({
              name: match[1],
              version: match[2],
              type: 'production',
              outdated: false,
            });
          }
        }
      }

      return dependencies;
    } catch (error) {
      logger.warn('Failed to parse go.mod', { error, rootPath });
      return [];
    }
  }

  /**
   * Check for outdated dependencies (placeholder)
   * In production, this would call npm outdated, pip list --outdated, etc.
   */
  async checkOutdated(dependencies: DependencyInfo[]): Promise<DependencyInfo[]> {
    // This is a placeholder - in production, you'd call actual package managers
    return dependencies.map((dep) => ({
      ...dep,
      outdated: false,
    }));
  }

  /**
   * Check for security vulnerabilities (placeholder)
   * In production, this would call npm audit, safety check, etc.
   */
  async checkVulnerabilities(dependencies: DependencyInfo[]): Promise<DependencyInfo[]> {
    // This is a placeholder - in production, you'd call security scanners
    return dependencies.map((dep) => ({
      ...dep,
      vulnerabilities: 0,
    }));
  }
}

// Made with Bob
