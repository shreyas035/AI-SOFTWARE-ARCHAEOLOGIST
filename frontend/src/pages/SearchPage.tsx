import { useState } from 'react';
import { Search, Code, FileCode, Package, MessageSquare, Filter } from 'lucide-react';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import Card from '@components/ui/Card';
import api from '@services/api';

interface SearchResult {
  file: string;
  line: number;
  content: string;
  context: {
    before: string[];
    after: string[];
  };
}

export default function SearchPage() {
  const [searchType, setSearchType] = useState<'code' | 'functions' | 'classes' | 'imports' | 'todos'>('code');
  const [query, setQuery] = useState('');
  const [repositoryId, setRepositoryId] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim() || !repositoryId.trim()) {
      setError('Please enter both search query and repository ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let response;
      if (searchType === 'code') {
        response = await api.post(`/search/code/${repositoryId}`, {
          query,
          options: {
            regex: true,
            maxResults: 50,
          },
        });
      } else {
        response = await api.get(`/search/${searchType}/${repositoryId}`);
      }

      setResults(response.data.data.results || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const searchTypes = [
    { id: 'code', label: 'Code Patterns', icon: Code, description: 'Search for any code pattern' },
    { id: 'functions', label: 'Functions', icon: FileCode, description: 'Find function definitions' },
    { id: 'classes', label: 'Classes', icon: Package, description: 'Find class definitions' },
    { id: 'imports', label: 'Imports', icon: Package, description: 'Find import statements' },
    { id: 'todos', label: 'TODOs', icon: MessageSquare, description: 'Find TODO comments' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Code Search</h1>
        <p className="text-dark-400">Search across your repositories for code patterns, functions, and more</p>
      </div>

      {/* Search Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {searchTypes.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => setSearchType(type.id as any)}
              className={`p-4 rounded-lg border-2 transition-colors text-left ${
                searchType === type.id
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-dark-700 hover:border-dark-600'
              }`}
            >
              <Icon className="w-6 h-6 text-primary-400 mb-2" />
              <h3 className="text-white font-medium mb-1">{type.label}</h3>
              <p className="text-dark-400 text-sm">{type.description}</p>
            </button>
          );
        })}
      </div>

      {/* Search Form */}
      <Card className="p-6">
        <div className="space-y-4">
          <Input
            label="Repository ID"
            type="text"
            placeholder="Enter repository ID"
            value={repositoryId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRepositoryId(e.target.value)}
            helperText="Get this from your repositories list"
          />

          <Input
            label="Search Query"
            type="text"
            placeholder={
              searchType === 'code'
                ? 'e.g., async function.*export'
                : searchType === 'functions'
                ? 'e.g., handleSubmit (optional)'
                : 'Enter search term'
            }
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            helperText={searchType === 'code' ? 'Supports regex patterns' : undefined}
          />

          <div className="flex gap-3">
            <Button onClick={handleSearch} disabled={loading} className="flex-1">
              <Search className="w-4 h-4 mr-2" />
              {loading ? 'Searching...' : 'Search'}
            </Button>
            <Button variant="secondary">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="glass rounded-lg p-4 border border-red-500/20 bg-red-500/5">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              Results ({results.length})
            </h2>
          </div>

          <div className="space-y-3">
            {results.map((result, index) => (
              <Card key={index} className="p-4 hover:border-primary-500/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-primary-400" />
                    <span className="text-white font-mono text-sm">{result.file}</span>
                  </div>
                  <span className="text-dark-400 text-sm">Line {result.line}</span>
                </div>

                <div className="bg-dark-950 rounded-lg p-4 overflow-x-auto">
                  {result.context.before.length > 0 && (
                    <div className="text-dark-500 font-mono text-sm mb-1">
                      {result.context.before.map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </div>
                  )}
                  <div className="text-primary-400 font-mono text-sm font-bold">
                    {result.content}
                  </div>
                  {result.context.after.length > 0 && (
                    <div className="text-dark-500 font-mono text-sm mt-1">
                      {result.context.after.map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && !error && (
        <Card className="p-12 text-center">
          <Search className="w-16 h-16 text-primary-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Start Searching</h2>
          <p className="text-dark-400">
            Enter a repository ID and search query to find code patterns
          </p>
        </Card>
      )}
    </div>
  );
}

// Made with Bob