import { useState } from 'react';
import { GitCompare, TrendingUp, Award, Plus, X } from 'lucide-react';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import Card from '@components/ui/Card';
import api from '@services/api';

interface ComparisonResult {
  repositories: Array<{
    id: string;
    name: string;
  }>;
  comparison: {
    techStack: any;
    complexity: any;
    metrics: any;
  };
  recommendations: string[];
}

export default function ComparisonPage() {
  const [repositoryIds, setRepositoryIds] = useState<string[]>(['', '']);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'compare' | 'trends' | 'benchmark'>('compare');

  const addRepository = () => {
    if (repositoryIds.length < 10) {
      setRepositoryIds([...repositoryIds, '']);
    }
  };

  const removeRepository = (index: number) => {
    if (repositoryIds.length > 2) {
      setRepositoryIds(repositoryIds.filter((_, i) => i !== index));
    }
  };

  const updateRepository = (index: number, value: string) => {
    const newIds = [...repositoryIds];
    newIds[index] = value;
    setRepositoryIds(newIds);
  };

  const handleCompare = async () => {
    const validIds = repositoryIds.filter(id => id.trim());
    
    if (validIds.length < 2) {
      setError('Please enter at least 2 repository IDs');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let response;
      if (validIds.length === 2) {
        response = await api.post('/comparison/compare', {
          repositoryId1: validIds[0],
          repositoryId2: validIds[1],
        });
      } else {
        response = await api.post('/comparison/compare-multiple', {
          repositoryIds: validIds,
        });
      }

      setResult(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Repository Comparison</h1>
        <p className="text-dark-400">Compare repositories side-by-side to identify differences and similarities</p>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('compare')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'compare'
              ? 'bg-primary-500 text-white'
              : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
          }`}
        >
          <GitCompare className="w-4 h-4 inline mr-2" />
          Compare
        </button>
        <button
          onClick={() => setViewMode('trends')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'trends'
              ? 'bg-primary-500 text-white'
              : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Trends
        </button>
        <button
          onClick={() => setViewMode('benchmark')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'benchmark'
              ? 'bg-primary-500 text-white'
              : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
          }`}
        >
          <Award className="w-4 h-4 inline mr-2" />
          Benchmark
        </button>
      </div>

      {/* Compare View */}
      {viewMode === 'compare' && (
        <>
          {/* Repository Input */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Select Repositories</h2>
            <div className="space-y-3">
              {repositoryIds.map((id, index) => (
                <div key={index} className="flex gap-3">
                  <Input
                    type="text"
                    placeholder={`Repository ${index + 1} ID`}
                    value={id}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRepository(index, e.target.value)}
                    className="flex-1"
                  />
                  {repositoryIds.length > 2 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => removeRepository(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-4">
              {repositoryIds.length < 10 && (
                <Button variant="secondary" onClick={addRepository}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Repository
                </Button>
              )}
              <Button onClick={handleCompare} disabled={loading} className="flex-1">
                <GitCompare className="w-4 h-4 mr-2" />
                {loading ? 'Comparing...' : 'Compare Repositories'}
              </Button>
            </div>
          </Card>

          {/* Error */}
          {error && (
            <div className="glass rounded-lg p-4 border border-red-500/20 bg-red-500/5">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-6">
              {/* Repository Names */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Comparing</h2>
                <div className="flex flex-wrap gap-3">
                  {result.repositories.map((repo, index) => (
                    <div key={index} className="px-4 py-2 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                      <span className="text-primary-400 font-medium">{repo.name}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Metrics Comparison */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-dark-800 rounded-lg">
                    <h3 className="text-dark-400 text-sm mb-1">Total Files</h3>
                    <p className="text-2xl font-bold text-white">
                      {result.comparison.metrics?.repo1?.totalFiles || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-dark-800 rounded-lg">
                    <h3 className="text-dark-400 text-sm mb-1">Total Lines</h3>
                    <p className="text-2xl font-bold text-white">
                      {result.comparison.metrics?.repo1?.totalLines || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-dark-800 rounded-lg">
                    <h3 className="text-dark-400 text-sm mb-1">Avg File Size</h3>
                    <p className="text-2xl font-bold text-white">
                      {result.comparison.metrics?.repo1?.avgFileSize || 0}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Recommendations</h2>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-primary-400 mt-1">•</span>
                        <span className="text-dark-300">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          )}

          {/* Empty State */}
          {!loading && !result && !error && (
            <Card className="p-12 text-center">
              <GitCompare className="w-16 h-16 text-primary-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Ready to Compare</h2>
              <p className="text-dark-400">
                Enter repository IDs above and click compare to see detailed analysis
              </p>
            </Card>
          )}
        </>
      )}

      {/* Trends View */}
      {viewMode === 'trends' && (
        <Card className="p-12 text-center">
          <TrendingUp className="w-16 h-16 text-primary-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Repository Trends</h2>
          <p className="text-dark-400 mb-4">
            Track how repository metrics change over time
          </p>
          <Input
            type="text"
            placeholder="Enter repository ID"
            className="max-w-md mx-auto mb-4"
          />
          <Button>View Trends</Button>
        </Card>
      )}

      {/* Benchmark View */}
      {viewMode === 'benchmark' && (
        <Card className="p-12 text-center">
          <Award className="w-16 h-16 text-primary-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Industry Benchmarks</h2>
          <p className="text-dark-400 mb-4">
            Compare your repository against industry standards
          </p>
          <Input
            type="text"
            placeholder="Enter repository ID"
            className="max-w-md mx-auto mb-4"
          />
          <Button>Compare with Benchmarks</Button>
        </Card>
      )}
    </div>
  );
}

// Made with Bob