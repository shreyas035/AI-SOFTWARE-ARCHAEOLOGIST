/**
 * Search-related type definitions
 */

export interface SearchResult {
  file: string;
  line: number;
  column: number;
  content: string;
  context: {
    before: string[];
    after: string[];
  };
  language: string;
}

export interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regex?: boolean;
  filePattern?: string;
  excludePattern?: string;
  maxResults?: number;
  contextLines?: number;
}

export interface CodeSearchRequest {
  query: string;
  options?: SearchOptions;
}

export interface CodeSearchResponse {
  success: boolean;
  data: {
    query: string;
    resultsCount: number;
    results: SearchResult[];
  };
}

export interface RepositorySearchFilters {
  query?: string;
  language?: string;
  framework?: string;
  status?: 'processing' | 'completed' | 'failed';
  sourceType?: 'zip' | 'github';
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchSuggestion {
  type: 'language' | 'framework' | 'file' | 'function' | 'class';
  value: string;
  description?: string;
}

// Made with Bob