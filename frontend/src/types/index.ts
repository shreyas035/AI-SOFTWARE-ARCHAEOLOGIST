/**
 * Core type definitions for the frontend application
 */

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Repository types
export interface Repository {
  id: string;
  name: string;
  description?: string;
  url?: string;
  language: string;
  size: number;
  fileCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  language?: string;
  children?: FileNode[];
}

// Analysis types
export interface CodeMetrics {
  linesOfCode: number;
  complexity: number;
  maintainabilityIndex: number;
  technicalDebt: number;
  testCoverage?: number;
}

export interface TechnicalDebtItem {
  id: string;
  type: 'code_smell' | 'bug' | 'vulnerability' | 'duplication';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  file: string;
  line?: number;
  suggestion?: string;
  estimatedEffort?: string;
}

export interface AnalysisResult {
  id: string;
  repositoryId: string;
  metrics: CodeMetrics;
  technicalDebt: TechnicalDebtItem[];
  dependencies: Dependency[];
  createdAt: string;
}

export interface Dependency {
  name: string;
  version: string;
  type: 'production' | 'development';
  outdated?: boolean;
  latestVersion?: string;
}

// Architecture types
export interface ArchitectureNode {
  id: string;
  type: 'module' | 'class' | 'function' | 'component';
  name: string;
  path: string;
  description?: string;
  dependencies: string[];
  metrics?: {
    complexity: number;
    linesOfCode: number;
  };
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  type: 'import' | 'extends' | 'implements' | 'calls';
  weight?: number;
}

export interface ArchitectureMap {
  id: string;
  repositoryId: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  layers: string[];
  createdAt: string;
}

// Chat types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    files?: string[];
    codeBlocks?: CodeBlock[];
  };
}

export interface CodeBlock {
  language: string;
  code: string;
  file?: string;
  startLine?: number;
  endLine?: number;
}

export interface ChatSession {
  id: string;
  repositoryId: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

// Documentation types
export interface Documentation {
  id: string;
  repositoryId: string;
  type: 'overview' | 'api' | 'architecture' | 'setup' | 'contributing';
  title: string;
  content: string;
  sections: DocumentationSection[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentationSection {
  id: string;
  title: string;
  content: string;
  level: number;
  order: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RepositoryUploadForm {
  name: string;
  description?: string;
  file?: File;
  url?: string;
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}

// Filter and sort types
export interface FilterOptions {
  search?: string;
  language?: string;
  status?: Repository['status'];
  dateFrom?: string;
  dateTo?: string;
}

export interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}

// Made with Bob
