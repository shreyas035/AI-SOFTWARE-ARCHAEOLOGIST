import { Analysis, AnalysisType, AnalysisStatus } from '@prisma/client';

// ============================================
// ANALYSIS TYPES
// ============================================

export interface ComplexityMetrics {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  nestingDepth: number;
  linesOfCode: number;
  maintainabilityIndex: number;
}

export interface FileComplexity {
  filePath: string;
  metrics: ComplexityMetrics;
  functions: FunctionComplexity[];
}

export interface FunctionComplexity {
  name: string;
  line: number;
  complexity: number;
  parameters: number;
  linesOfCode: number;
}

export interface DuplicationInstance {
  files: string[];
  lines: { file: string; startLine: number; endLine: number }[];
  duplicatedLines: number;
  similarity: number;
  code: string;
}

export interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  file: string;
  line: number;
  description: string;
  cwe?: string;
  recommendation: string;
}

export interface DependencyVulnerability {
  package: string;
  version: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  vulnerabilityId: string;
  description: string;
  fixedIn?: string;
}

export interface ArchitectureAnalysisResult {
  layers: string[];
  patterns: string[];
  technologies: string[];
  modules: ModuleInfo[];
  dependencies: ModuleDependency[];
  entryPoints: string[];
  criticalModules: string[];
}

export interface ModuleInfo {
  id: string;
  name: string;
  path: string;
  type: 'frontend' | 'backend' | 'shared' | 'external';
  linesOfCode: number;
  files: string[];
  exports: string[];
  importance: number;
}

export interface ModuleDependency {
  source: string;
  target: string;
  type: 'import' | 'api-call' | 'database-query';
  weight: number;
}

export interface TechnicalDebtAnalysisResult {
  overallScore: number;
  complexityScore: number;
  duplicationScore: number;
  dependencyScore: number;
  maintainabilityScore: number;
  securityScore: number;
  issues: TechnicalDebtIssue[];
  metrics: TechnicalDebtMetrics;
}

export interface TechnicalDebtIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  file: string;
  line: number;
  description: string;
  recommendation: string;
  estimatedEffort: string;
}

export interface TechnicalDebtMetrics {
  totalFiles: number;
  totalLines: number;
  averageComplexity: number;
  duplicationPercentage: number;
  testCoverage: number;
  outdatedDependencies: number;
  securityVulnerabilities: number;
  codeSmells: number;
}

export interface CreateAnalysisDto {
  repositoryId: string;
  analysisType: AnalysisType;
}

export type AnalysisWithRepository = Analysis & {
  repository: {
    id: string;
    name: string;
  };
};

// Made with Bob
