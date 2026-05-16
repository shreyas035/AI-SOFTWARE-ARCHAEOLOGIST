import { PrismaClient } from '@prisma/client';
import logger from '../../config/logger';

interface ComparisonResult {
  repositories: {
    id: string;
    name: string;
    sourceType: string;
    createdAt: Date;
  }[];
  comparison: {
    techStack: TechStackComparison;
    complexity: ComplexityComparison;
    dependencies: DependencyComparison;
    architecture: ArchitectureComparison;
    metrics: MetricsComparison;
  };
  recommendations: string[];
}

interface TechStackComparison {
  languages: {
    repo1: Record<string, number>;
    repo2: Record<string, number>;
    common: string[];
    unique1: string[];
    unique2: string[];
  };
  frameworks: {
    repo1: string[];
    repo2: string[];
    common: string[];
    unique1: string[];
    unique2: string[];
  };
}

interface ComplexityComparison {
  repo1: {
    averageComplexity: number;
    maxComplexity: number;
    filesOverThreshold: number;
  };
  repo2: {
    averageComplexity: number;
    maxComplexity: number;
    filesOverThreshold: number;
  };
  winner: string;
}

interface DependencyComparison {
  repo1: {
    total: number;
    outdated: number;
    vulnerable: number;
  };
  repo2: {
    total: number;
    outdated: number;
    vulnerable: number;
  };
  commonDependencies: string[];
  uniqueDependencies1: string[];
  uniqueDependencies2: string[];
}

interface ArchitectureComparison {
  repo1: {
    layers: number;
    modules: number;
    entryPoints: number;
  };
  repo2: {
    layers: number;
    modules: number;
    entryPoints: number;
  };
  similarityScore: number;
}

interface MetricsComparison {
  repo1: {
    totalFiles: number;
    totalLines: number;
    avgFileSize: number;
    testCoverage?: number;
  };
  repo2: {
    totalFiles: number;
    totalLines: number;
    avgFileSize: number;
    testCoverage?: number;
  };
}

export class RepositoryComparisonService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Compare two repositories side-by-side
   */
  async compareRepositories(
    repositoryId1: string,
    repositoryId2: string,
    userId: string
  ): Promise<ComparisonResult> {
    try {
      // Fetch both repositories
      const [repo1, repo2] = await Promise.all([
        this.prisma.repository.findFirst({
          where: { id: repositoryId1, userId },
          include: {
            analyses: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        }),
        this.prisma.repository.findFirst({
          where: { id: repositoryId2, userId },
          include: {
            analyses: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        }),
      ]);

      if (!repo1 || !repo2) {
        throw new Error('One or both repositories not found');
      }

      // Perform comparison
      const techStack = this.compareTechStack(repo1.metadata as any, repo2.metadata as any);
      const complexity = this.compareComplexity(repo1.metadata as any, repo2.metadata as any);
      const dependencies = this.compareDependencies(repo1.metadata as any, repo2.metadata as any);
      const architecture = this.compareArchitecture(repo1.metadata as any, repo2.metadata as any);
      const metrics = this.compareMetrics(repo1.metadata as any, repo2.metadata as any);

      const recommendations = this.generateRecommendations({
        techStack,
        complexity,
        dependencies,
        architecture,
        metrics,
      });

      logger.info('Repository comparison completed', {
        repositoryId1,
        repositoryId2,
        userId,
      });

      return {
        repositories: [
          {
            id: repo1.id,
            name: repo1.name,
            sourceType: repo1.sourceType,
            createdAt: repo1.createdAt,
          },
          {
            id: repo2.id,
            name: repo2.name,
            sourceType: repo2.sourceType,
            createdAt: repo2.createdAt,
          },
        ],
        comparison: {
          techStack,
          complexity,
          dependencies,
          architecture,
          metrics,
        },
        recommendations,
      };
    } catch (error) {
      logger.error('Repository comparison failed', { error, repositoryId1, repositoryId2 });
      throw error;
    }
  }

  /**
   * Compare multiple repositories (batch comparison)
   */
  async compareMultipleRepositories(
    repositoryIds: string[],
    userId: string
  ): Promise<any> {
    try {
      if (repositoryIds.length < 2) {
        throw new Error('At least 2 repositories required for comparison');
      }

      const repositories = await this.prisma.repository.findMany({
        where: {
          id: { in: repositoryIds },
          userId,
        },
      });

      if (repositories.length !== repositoryIds.length) {
        throw new Error('Some repositories not found');
      }

      // Create comparison matrix
      const matrix: any = {
        repositories: repositories.map((r) => ({
          id: r.id,
          name: r.name,
          sourceType: r.sourceType,
        })),
        metrics: {},
      };

      // Compare each metric across all repositories
      matrix.metrics.languages = repositories.map((r) => ({
        id: r.id,
        languages: (r.metadata as any)?.languages || {},
      }));

      matrix.metrics.frameworks = repositories.map((r) => ({
        id: r.id,
        frameworks: (r.metadata as any)?.frameworks || [],
      }));

      matrix.metrics.fileCount = repositories.map((r) => ({
        id: r.id,
        count: (r.metadata as any)?.fileCount || 0,
      }));

      matrix.metrics.totalLines = repositories.map((r) => ({
        id: r.id,
        lines: (r.metadata as any)?.totalLines || 0,
      }));

      return matrix;
    } catch (error) {
      logger.error('Multiple repository comparison failed', { error, repositoryIds });
      throw error;
    }
  }

  // ============================================
  // COMPARISON METHODS
  // ============================================

  private compareTechStack(metadata1: any, metadata2: any): TechStackComparison {
    const languages1 = metadata1?.languages || {};
    const languages2 = metadata2?.languages || {};
    const frameworks1 = metadata1?.frameworks || [];
    const frameworks2 = metadata2?.frameworks || [];

    const allLanguages = new Set([...Object.keys(languages1), ...Object.keys(languages2)]);
    const commonLanguages = [...allLanguages].filter(
      (lang) => languages1[lang] && languages2[lang]
    );
    const uniqueLanguages1 = Object.keys(languages1).filter((lang) => !languages2[lang]);
    const uniqueLanguages2 = Object.keys(languages2).filter((lang) => !languages1[lang]);

    const commonFrameworks = frameworks1.filter((f: string) => frameworks2.includes(f));
    const uniqueFrameworks1 = frameworks1.filter((f: string) => !frameworks2.includes(f));
    const uniqueFrameworks2 = frameworks2.filter((f: string) => !frameworks1.includes(f));

    return {
      languages: {
        repo1: languages1,
        repo2: languages2,
        common: commonLanguages,
        unique1: uniqueLanguages1,
        unique2: uniqueLanguages2,
      },
      frameworks: {
        repo1: frameworks1,
        repo2: frameworks2,
        common: commonFrameworks,
        unique1: uniqueFrameworks1,
        unique2: uniqueFrameworks2,
      },
    };
  }

  private compareComplexity(metadata1: any, metadata2: any): ComplexityComparison {
    const complexity1 = metadata1?.complexity || { average: 0, max: 0, filesOverThreshold: 0 };
    const complexity2 = metadata2?.complexity || { average: 0, max: 0, filesOverThreshold: 0 };

    const winner =
      complexity1.average < complexity2.average
        ? 'repo1'
        : complexity1.average > complexity2.average
        ? 'repo2'
        : 'tie';

    return {
      repo1: {
        averageComplexity: complexity1.average || 0,
        maxComplexity: complexity1.max || 0,
        filesOverThreshold: complexity1.filesOverThreshold || 0,
      },
      repo2: {
        averageComplexity: complexity2.average || 0,
        maxComplexity: complexity2.max || 0,
        filesOverThreshold: complexity2.filesOverThreshold || 0,
      },
      winner,
    };
  }

  private compareDependencies(metadata1: any, metadata2: any): DependencyComparison {
    const deps1 = metadata1?.dependencies || {};
    const deps2 = metadata2?.dependencies || {};

    const allDeps1 = Object.keys(deps1).flatMap((type) => Object.keys(deps1[type] || {}));
    const allDeps2 = Object.keys(deps2).flatMap((type) => Object.keys(deps2[type] || {}));

    const commonDeps = allDeps1.filter((dep) => allDeps2.includes(dep));
    const uniqueDeps1 = allDeps1.filter((dep) => !allDeps2.includes(dep));
    const uniqueDeps2 = allDeps2.filter((dep) => !allDeps1.includes(dep));

    return {
      repo1: {
        total: allDeps1.length,
        outdated: metadata1?.outdatedDependencies || 0,
        vulnerable: metadata1?.vulnerableDependencies || 0,
      },
      repo2: {
        total: allDeps2.length,
        outdated: metadata2?.outdatedDependencies || 0,
        vulnerable: metadata2?.vulnerableDependencies || 0,
      },
      commonDependencies: commonDeps,
      uniqueDependencies1: uniqueDeps1,
      uniqueDependencies2: uniqueDeps2,
    };
  }

  private compareArchitecture(metadata1: any, metadata2: any): ArchitectureComparison {
    const arch1 = metadata1?.architecture || {};
    const arch2 = metadata2?.architecture || {};

    // Calculate similarity score based on common patterns
    const layers1 = arch1.layers || 0;
    const layers2 = arch2.layers || 0;
    const modules1 = arch1.modules || 0;
    const modules2 = arch2.modules || 0;

    const layerSimilarity = 1 - Math.abs(layers1 - layers2) / Math.max(layers1, layers2, 1);
    const moduleSimilarity = 1 - Math.abs(modules1 - modules2) / Math.max(modules1, modules2, 1);
    const similarityScore = Math.round(((layerSimilarity + moduleSimilarity) / 2) * 100);

    return {
      repo1: {
        layers: layers1,
        modules: modules1,
        entryPoints: (metadata1?.entryPoints || []).length,
      },
      repo2: {
        layers: layers2,
        modules: modules2,
        entryPoints: (metadata2?.entryPoints || []).length,
      },
      similarityScore,
    };
  }

  private compareMetrics(metadata1: any, metadata2: any): MetricsComparison {
    return {
      repo1: {
        totalFiles: metadata1?.fileCount || 0,
        totalLines: metadata1?.totalLines || 0,
        avgFileSize: metadata1?.avgFileSize || 0,
        testCoverage: metadata1?.testCoverage,
      },
      repo2: {
        totalFiles: metadata2?.fileCount || 0,
        totalLines: metadata2?.totalLines || 0,
        avgFileSize: metadata2?.avgFileSize || 0,
        testCoverage: metadata2?.testCoverage,
      },
    };
  }

  private generateRecommendations(comparison: any): string[] {
    const recommendations: string[] = [];

    // Tech stack recommendations
    if (comparison.techStack.languages.common.length > 0) {
      recommendations.push(
        `Both repositories share ${comparison.techStack.languages.common.length} common language(s), making code sharing feasible.`
      );
    }

    // Complexity recommendations
    if (comparison.complexity.winner !== 'tie') {
      const betterRepo = comparison.complexity.winner === 'repo1' ? 'first' : 'second';
      recommendations.push(
        `The ${betterRepo} repository has lower complexity, making it easier to maintain.`
      );
    }

    // Dependency recommendations
    if (comparison.dependencies.commonDependencies.length > 5) {
      recommendations.push(
        `${comparison.dependencies.commonDependencies.length} shared dependencies detected. Consider creating a shared library.`
      );
    }

    // Architecture recommendations
    if (comparison.architecture.similarityScore > 70) {
      recommendations.push(
        `High architectural similarity (${comparison.architecture.similarityScore}%). These repositories could be merged or refactored together.`
      );
    }

    // Size recommendations
    const sizeDiff = Math.abs(
      comparison.metrics.repo1.totalLines - comparison.metrics.repo2.totalLines
    );
    if (sizeDiff > 10000) {
      recommendations.push(
        `Significant size difference detected. Consider splitting the larger repository into smaller modules.`
      );
    }

    return recommendations;
  }
}

// Made with Bob