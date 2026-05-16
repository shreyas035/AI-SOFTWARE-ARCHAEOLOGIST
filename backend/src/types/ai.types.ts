// ============================================
// IBM BOB AI TYPES
// ============================================

export interface IBMBobConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface AIContext {
  repositoryId: string;
  repositoryName: string;
  fileTree: string;
  relevantFiles: FileContext[];
  dependencies: Record<string, string>;
  frameworks: string[];
  languages: string[];
}

export interface FileContext {
  path: string;
  content: string;
  language: string;
  linesOfCode: number;
  imports?: string[];
  exports?: string[];
}

export interface AIPrompt {
  system: string;
  context: string;
  query: string;
  examples?: string[];
}

export interface AIResponse {
  content: string;
  referencedFiles: string[];
  codeSnippets: CodeSnippet[];
  confidence: number;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  processingTime: number;
}

export interface CodeSnippet {
  file: string;
  language: string;
  startLine: number;
  endLine: number;
  code: string;
}

export interface SemanticSearchResult {
  file: string;
  relevance: number;
  snippet: string;
  line: number;
}

export interface ArchitecturePromptData {
  fileTree: string;
  entryPoints: string[];
  dependencies: Record<string, string>;
  frameworks: string[];
  importGraph: ImportRelationship[];
}

export interface ImportRelationship {
  source: string;
  target: string;
  type: string;
}

export interface DocumentationPromptData {
  repositoryName: string;
  description?: string;
  techStack: string[];
  fileStructure: string;
  entryPoints: string[];
  keyFeatures: string[];
}

export interface TechnicalDebtPromptData {
  files: FileAnalysis[];
  dependencies: DependencyInfo[];
  metrics: CodeMetrics;
}

export interface FileAnalysis {
  path: string;
  linesOfCode: number;
  complexity: number;
  duplication: number;
  issues: string[];
}

export interface DependencyInfo {
  name: string;
  version: string;
  outdated: boolean;
  vulnerabilities: number;
}

export interface CodeMetrics {
  totalFiles: number;
  totalLines: number;
  averageComplexity: number;
  duplicationPercentage: number;
  testCoverage: number;
}

export interface StreamOptions {
  onToken?: (token: string) => void;
  onComplete?: (response: AIResponse) => void;
  onError?: (error: Error) => void;
}

// ============================================
// BOB API REQUEST/RESPONSE TYPES
// ============================================

export interface BobAIRequest {
  model: string;
  messages: BobMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface BobMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface BobAIResponse {
  id: string;
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface BobAIStreamChunk {
  id: string;
  content: string;
  model: string;
  finishReason?: string;
}

// Made with Bob
