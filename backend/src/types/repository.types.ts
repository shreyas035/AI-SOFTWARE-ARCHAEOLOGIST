import { Repository, RepositorySource, RepositoryStatus } from '@prisma/client';

// ============================================
// REPOSITORY TYPES
// ============================================

export interface LanguageStat {
  language: string;
  fileCount: number;
  totalLines: number;
  percentage: number;
}

export interface RepositoryMetadata {
  languages: string[];
  languageStats?: LanguageStat[];
  frameworks: string[];
  fileCount: number;
  totalLines: number;
  dependencies: Record<string, string>;
  entryPoints: string[];
  packageManager?: 'npm' | 'yarn' | 'pnpm';
  buildTool?: string;
  testFramework?: string;
  summary?: string;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  extension?: string;
  language?: string;
  children?: FileTreeNode[];
}

export interface DependencyInfo {
  name: string;
  version: string;
  type: 'production' | 'development';
  outdated: boolean;
  latestVersion?: string;
  vulnerabilities?: number;
}

export interface ImportRelationship {
  sourceFile: string;
  targetFile: string;
  importType: 'default' | 'named' | 'namespace' | 'dynamic';
  importedSymbols: string[];
}

export interface RepositoryAnalysisResult {
  fileTree: FileTreeNode;
  metadata: RepositoryMetadata;
  dependencies: DependencyInfo[];
  imports: ImportRelationship[];
  entryPoints: string[];
  criticalFiles: string[];
}

export interface CreateRepositoryDto {
  name: string;
  description?: string;
  sourceType: RepositorySource;
  sourceUrl?: string;
  file?: Express.Multer.File;
}

export interface UpdateRepositoryDto {
  name?: string;
  description?: string;
  status?: RepositoryStatus;
}

export type RepositoryWithRelations = Repository & {
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
  _count?: {
    analyses: number;
    chatConversations: number;
    architectureMaps: number;
    debtReports: number;
    generatedDocs: number;
  };
};

// Made with Bob
