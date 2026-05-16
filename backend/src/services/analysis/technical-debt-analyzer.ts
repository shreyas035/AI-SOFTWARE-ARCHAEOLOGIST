import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import logger from '../../config/logger';

export interface TechnicalDebtIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'complexity' | 'duplication' | 'dependencies' | 'maintainability' | 'security';
  file: string;
  line?: number;
  description: string;
  recommendation: string;
  estimatedEffort: string;
  impact: string;
}

export interface TechnicalDebtScore {
  overall: number; // 0-100 (100 = perfect)
  complexity: number;
  duplication: number;
  dependencies: number;
  maintainability: number;
  security: number;
}

export interface TechnicalDebtReport {
  repositoryId: string;
  score: TechnicalDebtScore;
  issues: TechnicalDebtIssue[];
  metrics: {
    totalFiles: number;
    totalLines: number;
    averageComplexity: number;
    duplicationPercentage: number;
    outdatedDependencies: number;
    securityVulnerabilities: number;
  };
  summary: {
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    totalDebtHours: number;
  };
  recommendations: string[];
}

export class TechnicalDebtAnalyzer {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Analyze technical debt for a repository
   */
  async analyzeRepository(repositoryId: string): Promise<TechnicalDebtReport> {
    try {
      logger.info('Analyzing technical debt', { repositoryId });

      // Get repository data
      const repository = await this.prisma.repository.findUnique({
        where: { id: repositoryId },
      });

      if (!repository || !repository.filePath) {
        throw new Error('Repository not found or not processed');
      }

      const metadata = repository.metadata as any;
      const rootPath = repository.filePath;

      // Run all analyses
      const [
        complexityIssues,
        duplicationIssues,
        dependencyIssues,
        maintainabilityIssues,
        securityIssues,
      ] = await Promise.all([
        this.analyzeComplexity(rootPath, metadata),
        this.analyzeDuplication(rootPath, metadata),
        this.analyzeDependencies(metadata),
        this.analyzeMaintainability(rootPath, metadata),
        this.analyzeSecurity(rootPath, metadata),
      ]);

      // Combine all issues
      const allIssues = [
        ...complexityIssues,
        ...duplicationIssues,
        ...dependencyIssues,
        ...maintainabilityIssues,
        ...securityIssues,
      ];

      // Calculate scores
      const score = this.calculateScores(allIssues);

      // Calculate metrics
      const metrics = await this.calculateMetrics(rootPath, metadata, allIssues);

      // Generate summary
      const summary = this.generateSummary(allIssues);

      // Generate recommendations
      const recommendations = this.generateRecommendations(allIssues, score);

      const report: TechnicalDebtReport = {
        repositoryId,
        score,
        issues: allIssues,
        metrics,
        summary,
        recommendations,
      };

      // Save to database
      await this.saveReport(repositoryId, report);

      logger.info('Technical debt analysis completed', {
        repositoryId,
        overallScore: score.overall,
        totalIssues: allIssues.length,
      });

      return report;
    } catch (error) {
      logger.error('Failed to analyze technical debt', { error, repositoryId });
      throw error;
    }
  }

  /**
   * Analyze code complexity
   */
  private async analyzeComplexity(rootPath: string, metadata: any): Promise<TechnicalDebtIssue[]> {
    const issues: TechnicalDebtIssue[] = [];
    const fileTree = metadata.fileTree || [];

    for (const file of fileTree) {
      if (this.isCodeFile(file.path)) {
        try {
          const filePath = path.join(rootPath, file.path);
          const content = await fs.readFile(filePath, 'utf-8');
          const lines = content.split('\n');

          // Check file length
          if (lines.length > 500) {
            issues.push({
              id: `complexity-${file.path}-length`,
              severity: lines.length > 1000 ? 'high' : 'medium',
              category: 'complexity',
              file: file.path,
              description: `File is too long (${lines.length} lines)`,
              recommendation: 'Consider splitting this file into smaller, more focused modules',
              estimatedEffort: '2-4 hours',
              impact: 'Reduces maintainability and increases cognitive load',
            });
          }

          // Check function complexity (simple heuristic)
          const functionComplexity = this.estimateFunctionComplexity(content);
          if (functionComplexity > 10) {
            issues.push({
              id: `complexity-${file.path}-function`,
              severity: functionComplexity > 20 ? 'high' : 'medium',
              category: 'complexity',
              file: file.path,
              description: `High cyclomatic complexity detected (estimated: ${functionComplexity})`,
              recommendation: 'Refactor complex functions into smaller, testable units',
              estimatedEffort: '4-8 hours',
              impact: 'Makes code harder to test and maintain',
            });
          }

          // Check nesting depth
          const maxNesting = this.calculateMaxNesting(content);
          if (maxNesting > 4) {
            issues.push({
              id: `complexity-${file.path}-nesting`,
              severity: maxNesting > 6 ? 'high' : 'medium',
              category: 'complexity',
              file: file.path,
              description: `Deep nesting detected (${maxNesting} levels)`,
              recommendation: 'Reduce nesting by extracting functions or using early returns',
              estimatedEffort: '1-2 hours',
              impact: 'Reduces code readability',
            });
          }
        } catch (error) {
          // Skip files that can't be read
          continue;
        }
      }
    }

    return issues;
  }

  /**
   * Analyze code duplication
   */
  private async analyzeDuplication(rootPath: string, metadata: any): Promise<TechnicalDebtIssue[]> {
    const issues: TechnicalDebtIssue[] = [];
    const fileTree = metadata.fileTree || [];
    const codeBlocks = new Map<string, string[]>();

    // Collect code blocks from all files
    for (const file of fileTree) {
      if (this.isCodeFile(file.path)) {
        try {
          const filePath = path.join(rootPath, file.path);
          const content = await fs.readFile(filePath, 'utf-8');
          const blocks = this.extractCodeBlocks(content);
          codeBlocks.set(file.path, blocks);
        } catch (error) {
          continue;
        }
      }
    }

    // Find duplicates (simple approach - exact matches)
    const blockMap = new Map<string, string[]>();
    for (const [filePath, blocks] of codeBlocks) {
      for (const block of blocks) {
        if (block.length > 100) {
          // Only check substantial blocks
          const files = blockMap.get(block) || [];
          files.push(filePath);
          blockMap.set(block, files);
        }
      }
    }

    // Report duplicates
    for (const [block, files] of blockMap) {
      if (files.length > 1) {
        issues.push({
          id: `duplication-${files.join('-')}`,
          severity: files.length > 3 ? 'high' : 'medium',
          category: 'duplication',
          file: files[0],
          description: `Code duplication detected across ${files.length} files`,
          recommendation: 'Extract common code into a shared utility or base class',
          estimatedEffort: '2-4 hours',
          impact: 'Increases maintenance burden and risk of inconsistent changes',
        });
      }
    }

    return issues;
  }

  /**
   * Analyze dependencies
   */
  private async analyzeDependencies(metadata: any): Promise<TechnicalDebtIssue[]> {
    const issues: TechnicalDebtIssue[] = [];
    const dependencies = metadata.dependencies || {};

    // Check for outdated dependencies (simplified - would need actual version checking)
    for (const [name, version] of Object.entries(dependencies)) {
      // Heuristic: versions starting with 0.x are potentially unstable
      if (typeof version === 'string' && version.startsWith('0.')) {
        issues.push({
          id: `dependency-${name}-unstable`,
          severity: 'medium',
          category: 'dependencies',
          file: 'package.json',
          description: `Dependency "${name}" is on an unstable version (${version})`,
          recommendation: 'Consider upgrading to a stable version (1.x or higher)',
          estimatedEffort: '1-2 hours',
          impact: 'May introduce breaking changes or bugs',
        });
      }
    }

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(metadata);
    for (const cycle of circularDeps) {
      issues.push({
        id: `dependency-circular-${cycle.join('-')}`,
        severity: 'high',
        category: 'dependencies',
        file: cycle[0],
        description: `Circular dependency detected: ${cycle.join(' → ')}`,
        recommendation: 'Refactor to remove circular dependencies',
        estimatedEffort: '4-8 hours',
        impact: 'Can cause initialization issues and makes code harder to understand',
      });
    }

    return issues;
  }

  /**
   * Analyze maintainability
   */
  private async analyzeMaintainability(
    rootPath: string,
    metadata: any
  ): Promise<TechnicalDebtIssue[]> {
    const issues: TechnicalDebtIssue[] = [];
    const fileTree = metadata.fileTree || [];

    for (const file of fileTree) {
      if (this.isCodeFile(file.path)) {
        try {
          const filePath = path.join(rootPath, file.path);
          const content = await fs.readFile(filePath, 'utf-8');

          // Check for TODO/FIXME comments
          const todoMatches = content.match(/\/\/\s*(TODO|FIXME|HACK|XXX):/gi);
          if (todoMatches && todoMatches.length > 3) {
            issues.push({
              id: `maintainability-${file.path}-todos`,
              severity: 'low',
              category: 'maintainability',
              file: file.path,
              description: `Multiple TODO/FIXME comments found (${todoMatches.length})`,
              recommendation: 'Address or document these technical debt items',
              estimatedEffort: '1-4 hours',
              impact: 'Indicates incomplete or temporary solutions',
            });
          }

          // Check for magic numbers
          const magicNumbers = this.findMagicNumbers(content);
          if (magicNumbers.length > 5) {
            issues.push({
              id: `maintainability-${file.path}-magic`,
              severity: 'low',
              category: 'maintainability',
              file: file.path,
              description: `Multiple magic numbers found (${magicNumbers.length})`,
              recommendation: 'Extract magic numbers into named constants',
              estimatedEffort: '1-2 hours',
              impact: 'Reduces code clarity and maintainability',
            });
          }

          // Check for long parameter lists
          const longParamLists = this.findLongParameterLists(content);
          if (longParamLists > 0) {
            issues.push({
              id: `maintainability-${file.path}-params`,
              severity: 'medium',
              category: 'maintainability',
              file: file.path,
              description: `Functions with long parameter lists detected (${longParamLists})`,
              recommendation: 'Consider using parameter objects or builder pattern',
              estimatedEffort: '2-4 hours',
              impact: 'Makes functions harder to use and test',
            });
          }
        } catch (error) {
          continue;
        }
      }
    }

    return issues;
  }

  /**
   * Analyze security issues
   */
  private async analyzeSecurity(rootPath: string, metadata: any): Promise<TechnicalDebtIssue[]> {
    const issues: TechnicalDebtIssue[] = [];
    const fileTree = metadata.fileTree || [];

    for (const file of fileTree) {
      if (this.isCodeFile(file.path)) {
        try {
          const filePath = path.join(rootPath, file.path);
          const content = await fs.readFile(filePath, 'utf-8');

          // Check for hardcoded credentials
          const credentialPatterns = [
            /password\s*=\s*['"][^'"]+['"]/gi,
            /api[_-]?key\s*=\s*['"][^'"]+['"]/gi,
            /secret\s*=\s*['"][^'"]+['"]/gi,
            /token\s*=\s*['"][^'"]+['"]/gi,
          ];

          for (const pattern of credentialPatterns) {
            if (pattern.test(content)) {
              issues.push({
                id: `security-${file.path}-credentials`,
                severity: 'critical',
                category: 'security',
                file: file.path,
                description: 'Potential hardcoded credentials detected',
                recommendation: 'Move sensitive data to environment variables',
                estimatedEffort: '30 minutes',
                impact: 'Critical security vulnerability',
              });
              break;
            }
          }

          // Check for SQL injection risks
          if (content.includes('SELECT') && content.includes('+')) {
            issues.push({
              id: `security-${file.path}-sql`,
              severity: 'high',
              category: 'security',
              file: file.path,
              description: 'Potential SQL injection vulnerability',
              recommendation: 'Use parameterized queries or ORM',
              estimatedEffort: '1-2 hours',
              impact: 'High security risk',
            });
          }

          // Check for eval usage
          if (content.includes('eval(')) {
            issues.push({
              id: `security-${file.path}-eval`,
              severity: 'high',
              category: 'security',
              file: file.path,
              description: 'Use of eval() detected',
              recommendation: 'Avoid eval() - use safer alternatives',
              estimatedEffort: '2-4 hours',
              impact: 'Code injection vulnerability',
            });
          }
        } catch (error) {
          continue;
        }
      }
    }

    return issues;
  }

  /**
   * Calculate overall scores
   */
  private calculateScores(issues: TechnicalDebtIssue[]): TechnicalDebtScore {
    const severityWeights = {
      critical: 25,
      high: 15,
      medium: 5,
      low: 1,
    };

    const categoryIssues = {
      complexity: issues.filter((i) => i.category === 'complexity'),
      duplication: issues.filter((i) => i.category === 'duplication'),
      dependencies: issues.filter((i) => i.category === 'dependencies'),
      maintainability: issues.filter((i) => i.category === 'maintainability'),
      security: issues.filter((i) => i.category === 'security'),
    };

    const calculateCategoryScore = (categoryIssues: TechnicalDebtIssue[]): number => {
      const totalPenalty = categoryIssues.reduce(
        (sum, issue) => sum + severityWeights[issue.severity],
        0
      );
      return Math.max(0, 100 - totalPenalty);
    };

    const scores = {
      complexity: calculateCategoryScore(categoryIssues.complexity),
      duplication: calculateCategoryScore(categoryIssues.duplication),
      dependencies: calculateCategoryScore(categoryIssues.dependencies),
      maintainability: calculateCategoryScore(categoryIssues.maintainability),
      security: calculateCategoryScore(categoryIssues.security),
      overall: 0,
    };

    // Calculate weighted overall score
    scores.overall = Math.round(
      (scores.complexity * 0.25 +
        scores.duplication * 0.15 +
        scores.dependencies * 0.2 +
        scores.maintainability * 0.2 +
        scores.security * 0.2)
    );

    return scores;
  }

  /**
   * Calculate metrics
   */
  private async calculateMetrics(
    rootPath: string,
    metadata: any,
    issues: TechnicalDebtIssue[]
  ): Promise<TechnicalDebtReport['metrics']> {
    const fileTree = metadata.fileTree || [];
    let totalLines = 0;
    let totalComplexity = 0;
    let fileCount = 0;

    for (const file of fileTree) {
      if (this.isCodeFile(file.path)) {
        try {
          const filePath = path.join(rootPath, file.path);
          const content = await fs.readFile(filePath, 'utf-8');
          const lines = content.split('\n').length;
          totalLines += lines;
          totalComplexity += this.estimateFunctionComplexity(content);
          fileCount++;
        } catch (error) {
          continue;
        }
      }
    }

    return {
      totalFiles: fileCount,
      totalLines,
      averageComplexity: fileCount > 0 ? Math.round(totalComplexity / fileCount) : 0,
      duplicationPercentage: this.calculateDuplicationPercentage(issues),
      outdatedDependencies: issues.filter(
        (i) => i.category === 'dependencies' && i.description.includes('outdated')
      ).length,
      securityVulnerabilities: issues.filter((i) => i.category === 'security').length,
    };
  }

  /**
   * Generate summary
   */
  private generateSummary(issues: TechnicalDebtIssue[]): TechnicalDebtReport['summary'] {
    const effortMap: Record<string, number> = {
      '30 minutes': 0.5,
      '1-2 hours': 1.5,
      '2-4 hours': 3,
      '4-8 hours': 6,
      '1-2 days': 12,
    };

    const totalDebtHours = issues.reduce((sum, issue) => {
      return sum + (effortMap[issue.estimatedEffort] || 2);
    }, 0);

    return {
      criticalIssues: issues.filter((i) => i.severity === 'critical').length,
      highIssues: issues.filter((i) => i.severity === 'high').length,
      mediumIssues: issues.filter((i) => i.severity === 'medium').length,
      lowIssues: issues.filter((i) => i.severity === 'low').length,
      totalDebtHours: Math.round(totalDebtHours),
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    issues: TechnicalDebtIssue[],
    score: TechnicalDebtScore
  ): string[] {
    const recommendations: string[] = [];

    if (score.security < 70) {
      recommendations.push('🔴 URGENT: Address security vulnerabilities immediately');
    }

    if (score.complexity < 60) {
      recommendations.push('Refactor complex code to improve maintainability');
    }

    if (score.duplication < 70) {
      recommendations.push('Reduce code duplication by extracting common functionality');
    }

    if (score.dependencies < 70) {
      recommendations.push('Update outdated dependencies and resolve circular dependencies');
    }

    if (score.maintainability < 70) {
      recommendations.push('Improve code quality by addressing TODO items and magic numbers');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Code quality is good! Continue maintaining best practices');
    }

    return recommendations;
  }

  /**
   * Save report to database
   */
  private async saveReport(repositoryId: string, report: TechnicalDebtReport): Promise<void> {
    await this.prisma.technicalDebtReport.create({
      data: {
        repositoryId,
        overallScore: report.score.overall,
        issues: report.issues as any,
        metrics: report.metrics as any,
      },
    });
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private isCodeFile(filePath: string): boolean {
    const codeExtensions = ['.ts', '.js', '.py', '.java', '.go', '.rb', '.php', '.cs', '.cpp', '.c'];
    return codeExtensions.some((ext) => filePath.endsWith(ext));
  }

  private estimateFunctionComplexity(content: string): number {
    // Simple heuristic: count control flow statements
    const controlFlowKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch'];
    let complexity = 1;

    for (const keyword of controlFlowKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = content.match(regex);
      complexity += matches ? matches.length : 0;
    }

    return complexity;
  }

  private calculateMaxNesting(content: string): number {
    let maxNesting = 0;
    let currentNesting = 0;

    for (const char of content) {
      if (char === '{') {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (char === '}') {
        currentNesting--;
      }
    }

    return maxNesting;
  }

  private extractCodeBlocks(content: string): string[] {
    // Simple approach: split by functions/methods
    const blocks: string[] = [];
    const lines = content.split('\n');
    let currentBlock: string[] = [];

    for (const line of lines) {
      if (line.trim().startsWith('function') || line.trim().startsWith('const ')) {
        if (currentBlock.length > 0) {
          blocks.push(currentBlock.join('\n'));
        }
        currentBlock = [line];
      } else {
        currentBlock.push(line);
      }
    }

    if (currentBlock.length > 0) {
      blocks.push(currentBlock.join('\n'));
    }

    return blocks;
  }

  private detectCircularDependencies(metadata: any): string[][] {
    // Simplified circular dependency detection
    const cycles: string[][] = [];
    // Would need actual dependency graph analysis
    return cycles;
  }

  private findMagicNumbers(content: string): number[] {
    const numbers: number[] = [];
    const regex = /\b(\d+)\b/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const num = parseInt(match[1]);
      if (num > 1 && num !== 0 && num !== 100) {
        // Exclude common values
        numbers.push(num);
      }
    }

    return numbers;
  }

  private findLongParameterLists(content: string): number {
    const functionRegex = /function\s+\w+\s*\(([^)]+)\)/g;
    let count = 0;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      const params = match[1].split(',');
      if (params.length > 5) {
        count++;
      }
    }

    return count;
  }

  private calculateDuplicationPercentage(issues: TechnicalDebtIssue[]): number {
    const duplicationIssues = issues.filter((i) => i.category === 'duplication');
    // Simplified calculation
    return Math.min(100, duplicationIssues.length * 5);
  }
}

// Made with Bob