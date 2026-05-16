/**
 * Export-related type definitions
 */

export interface ExportOptions {
  format: 'json' | 'markdown' | 'html';
  includeAnalysis?: boolean;
  includeArchitecture?: boolean;
  includeTechnicalDebt?: boolean;
  includeChat?: boolean;
}

export interface ReportData {
  repository: any;
  analysis?: any;
  architecture?: any;
  technicalDebt?: any;
  chatHistory?: any;
  generatedAt: string;
}

export interface ExportResult {
  content: string;
  filename: string;
  mimeType: string;
}

export interface ShareLinkData {
  shareId: string;
  shareUrl: string;
  expiresAt: Date;
}

export interface ExportRequest {
  format?: 'json' | 'markdown' | 'html';
  includeAnalysis?: boolean;
  includeArchitecture?: boolean;
  includeTechnicalDebt?: boolean;
  includeChat?: boolean;
}

export interface ShareLinkRequest {
  expiresIn?: number; // milliseconds
}

export interface BulkExportRequest {
  repositoryIds: string[];
  format?: 'json' | 'markdown' | 'html';
}

export interface ExecutiveSummary {
  repositoryName: string;
  keyMetrics: {
    codebaseSize: number;
    totalFiles: number;
    primaryLanguage: string;
    technicalDebtScore: number;
  };
  healthAssessment: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention' | 'Unknown';
  topPriorities: string[];
  generatedAt: string;
}

export interface ComparisonExportRequest {
  comparisonData: any;
  format?: 'json' | 'markdown' | 'html';
}

// Made with Bob