import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  Plus,
  Search,
  Filter,
  Upload,
  Github,
  Trash2,
  Eye,
  Calendar,
  Code,
  AlertCircle
} from 'lucide-react';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import Card from '@components/ui/Card';
import api from '@services/api';

interface Repository {
  id: string;
  name: string;
  sourceType: 'github' | 'upload';
  sourceUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  metadata?: {
    languages?: string[];
    fileCount?: number;
    totalLines?: number;
    frameworks?: string[];
    dependencies?: Record<string, string>;
  };
  createdAt: string;
  updatedAt: string;
}

export default function RepositoriesPage() {
  const navigate = useNavigate();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'github' | 'upload'>('github');
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [repoName, setRepoName] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRepositories();
  }, []);

  // Poll for status updates when any repository is still processing
  useEffect(() => {
    const hasProcessing = repositories.some(
      (repo) => repo.status.toUpperCase() === 'PROCESSING'
    );
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchRepositories(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [repositories]);

  const fetchRepositories = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get('/repositories');
      setRepositories(response.data.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch repositories:', err);
      if (!silent) setError(err.response?.data?.message || 'Failed to load repositories');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleAddRepository = async () => {
    if (!repoName.trim()) {
      setError('Repository name is required');
      return;
    }

    if (addType === 'github' && !githubUrl.trim()) {
      setError('GitHub URL is required');
      return;
    }

    if (addType === 'upload' && !uploadFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (addType === 'github') {
        await api.post('/repositories/clone', {
          name: repoName,
          url: githubUrl,
        });
      } else {
        const formData = new FormData();
        formData.append('name', repoName);
        formData.append('file', uploadFile!);

        await api.post('/repositories/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      // Reset form
      setRepoName('');
      setGithubUrl('');
      setUploadFile(null);
      setShowAddModal(false);
      
      // Refresh list
      fetchRepositories();
    } catch (err: any) {
      console.error('Failed to add repository:', err);
      setError(err.response?.data?.message || 'Failed to add repository');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRepository = async (id: string) => {
    if (!confirm('Are you sure you want to delete this repository?')) {
      return;
    }

    try {
      await api.delete(`/repositories/${id}`);
      fetchRepositories();
    } catch (err: any) {
      console.error('Failed to delete repository:', err);
      setError(err.response?.data?.message || 'Failed to delete repository');
    }
  };

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'text-green-400 bg-green-400/10';
      case 'PROCESSING':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'FAILED':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getMainLanguage = (languages?: string[]) => {
    if (!languages || languages.length === 0) return 'Unknown';
    return languages[0];
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Repositories</h1>
          <p className="text-dark-400">Manage and explore your code repositories</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="spinner w-12 h-12 mx-auto mb-4"></div>
            <p className="text-dark-400">Loading repositories...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Repositories</h1>
          <p className="text-dark-400">Manage and explore your code repositories</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Repository
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="glass rounded-lg p-4 border border-red-500/20 bg-red-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium">Error</p>
              <p className="text-red-300/80 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <Input
            type="text"
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="secondary">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Repository Grid */}
      {filteredRepositories.length === 0 ? (
        <div className="glass rounded-lg p-12 text-center">
          <FolderGit2 className="w-16 h-16 text-primary-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            {searchQuery ? 'No repositories found' : 'No repositories yet'}
          </h2>
          <p className="text-dark-400 mb-6">
            {searchQuery 
              ? 'Try adjusting your search query'
              : 'Get started by adding your first repository'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Repository
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRepositories.map((repo) => (
            <Card key={repo.id} className="p-6 hover:border-primary-500/30 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {repo.sourceType === 'github' ? (
                    <Github className="w-8 h-8 text-primary-400" />
                  ) : (
                    <Upload className="w-8 h-8 text-primary-400" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-white">{repo.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(repo.status)}`}>
                      {repo.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-dark-400">
                  <Code className="w-4 h-4" />
                  <span>{getMainLanguage(repo.metadata?.languages)}</span>
                </div>
                {repo.metadata?.fileCount && (
                  <div className="flex items-center gap-2 text-sm text-dark-400">
                    <FolderGit2 className="w-4 h-4" />
                    <span>{repo.metadata.fileCount} files</span>
                  </div>
                )}
                {repo.metadata?.totalLines && (
                  <div className="flex items-center gap-2 text-sm text-dark-400">
                    <Code className="w-4 h-4" />
                    <span>{repo.metadata.totalLines.toLocaleString()} lines</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-dark-400">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(repo.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate(`/repositories/${repo.id}`)}
                  disabled={repo.status.toUpperCase() !== 'COMPLETED'}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDeleteRepository(repo.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Repository Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">Add Repository</h2>

            {/* Type Selection */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setAddType('github')}
                className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                  addType === 'github'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-700 hover:border-dark-600'
                }`}
              >
                <Github className="w-8 h-8 mx-auto mb-2 text-primary-400" />
                <p className="text-white font-medium">GitHub</p>
                <p className="text-dark-400 text-sm">Clone from URL</p>
              </button>
              <button
                onClick={() => setAddType('upload')}
                className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                  addType === 'upload'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-700 hover:border-dark-600'
                }`}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-primary-400" />
                <p className="text-white font-medium">Upload</p>
                <p className="text-dark-400 text-sm">Upload ZIP file</p>
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Repository Name
                </label>
                <Input
                  type="text"
                  placeholder="my-awesome-project"
                  value={repoName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRepoName(e.target.value)}
                />
              </div>

              {addType === 'github' ? (
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    GitHub URL
                  </label>
                  <Input
                    type="url"
                    placeholder="https://github.com/username/repo"
                    value={githubUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGithubUrl(e.target.value)}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    ZIP File
                  </label>
                  <input
                    type="file"
                    accept=".zip"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUploadFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-dark-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary-500 file:text-white
                      hover:file:bg-primary-600
                      file:cursor-pointer cursor-pointer"
                  />
                  {uploadFile && (
                    <p className="text-sm text-dark-400 mt-2">
                      Selected: {uploadFile.name}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowAddModal(false);
                  setError(null);
                  setRepoName('');
                  setGithubUrl('');
                  setUploadFile(null);
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleAddRepository}
                disabled={submitting}
              >
                {submitting ? 'Adding...' : 'Add Repository'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Made with Bob
