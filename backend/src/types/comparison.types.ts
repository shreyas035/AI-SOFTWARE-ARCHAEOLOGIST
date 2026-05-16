/**
 * Comparison-related type definitions
 */

export interface ComparisonMetrics {
  codebaseSize: number;
  totalFiles: number;
  totalLines: number;
  complexity: number;
  technicalDebtScore: number;
  testCoverage?: number;
  documentationScore?: number;
}

export interface TechStackComparison {
  languages: {
    [key: string]: number;
  };
  frameworks: string[];
  dependencies: {
    name: string;
    version: string;
  }[];
}

export interface ArchitectureComparison {
  patterns: string[];
  layers: string[];
  modularity: number;
  coupling: number;
  cohesion: number;
}

export interface RepositoryComparison {
  repository1: {
    id: string;
    name: string;
    metrics: ComparisonMetrics;
    techStack: TechStackComparison;
    architecture: ArchitectureComparison;
  };
  repository2: {
    id: string;
    name: string;
    metrics: ComparisonMetrics;
    techStack: TechStackComparison;
    architecture: ArchitectureComparison;
  };
  differences: {
    metrics: {
      [key: string]: {
        repo1: number;
        repo2: number;
        difference: number;
        percentageDifference: number;
      };
    };
    techStack: {
      commonLanguages: string[];
      uniqueToRepo1: string[];
      uniqueToRepo2: string[];
      commonFrameworks: string[];
      uniqueFrameworksRepo1: string[];
      uniqueFrameworksRepo2: string[];
    };
    architecture: {
      commonPatterns: string[];
      uniqueToRepo1: string[];
      uniqueToRepo2: string[];
    };
  };
  recommendations: string[];
  similarityScore: number;
  comparedAt: string;
}

export interface MultiRepositoryComparison {
  repositories: Array<{
    id: string;
    name: string;
    metrics: ComparisonMetrics;
    techStack: TechStackComparison;
    architecture: ArchitectureComparison;
  }>;
  aggregateMetrics: {
    averageComplexity: number;
    averageTechnicalDebt: number;
    averageCodebaseSize: number;
    mostCommonLanguage: string;
    mostCommonFramework: string;
  };
  outliers: {
    highestComplexity: string;
    lowestComplexity: string;
    highestTechnicalDebt: string;
    lowestTechnicalDebt: string;
    largestCodebase: string;
    smallestCodebase: string;
  };
  recommendations: string[];
  comparedAt: string;
}

export interface TrendData {
  date: string;
  metrics: ComparisonMetrics;
}

export interface RepositoryTrends {
  repositoryId: string;
  repositoryName: string;
  trends: TrendData[];
  insights: {
    growthRate: number;
    complexityTrend: 'increasing' | 'decreasing' | 'stable';
    technicalDebtTrend: 'increasing' | 'decreasing' | 'stable';
    recommendations: string[];
  };
}

export interface BenchmarkComparison {
  repository: {
    id: string;
    name: string;
    metrics: ComparisonMetrics;
  };
  industryBenchmarks: {
    averageComplexity: number;
    averageTechnicalDebt: number;
    averageTestCoverage: number;
    averageDocumentationScore: number;
  };
  comparison: {
    complexityVsBenchmark: number;
    technicalDebtVsBenchmark: number;
    testCoverageVsBenchmark: number;
    documentationVsBenchmark: number;
  };
  rating: 'Excellent' | 'Above Average' | 'Average' | 'Below Average' | 'Needs Improvement';
  recommendations: string[];
}

export interface ComparisonRequest {
  repository1Id: string;
  repository2Id: string;
}

export interface MultiComparisonRequest {
  repositoryIds: string[];
}

export interface TrendsRequest {
  startDate?: string;
  endDate?: string;
}

// Made with Bob