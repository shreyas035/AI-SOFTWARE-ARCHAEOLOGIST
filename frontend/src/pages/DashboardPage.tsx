import { Link } from 'react-router-dom';
import { FolderGit2, Plus, TrendingUp, Clock, Code } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { repositoryApi } from '@services/api';
import Card, { CardHeader, CardContent } from '@components/ui/Card';
import Button from '@components/ui/Button';
import { Repository } from '@types';
import { formatRelativeTime, formatNumber } from '@utils/format';

/**
 * Dashboard page - Overview of repositories and recent activity
 */
export default function DashboardPage() {
  const { data: repositoriesData, isLoading } = useQuery({
    queryKey: ['repositories', { limit: 5 }],
    queryFn: async () => {
      const response = await repositoryApi.getAll({ limit: 5 });
      return response.data;
    },
  });

  const repositories = repositoriesData?.data || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-dark-400">Welcome back! Here's your code archaeology overview.</p>
        </div>
        <Link to="/repositories">
          <Button variant="primary" leftIcon={<Plus className="w-5 h-5" />}>
            New Repository
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card variant="glass">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
                <FolderGit2 className="w-6 h-6 text-primary-400" />
              </div>
              <div>
                <p className="text-dark-400 text-sm">Total Repositories</p>
                <p className="text-2xl font-bold text-white">{formatNumber(repositories.length)}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card variant="glass">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-dark-400 text-sm">Analyzed</p>
                <p className="text-2xl font-bold text-white">
                  {formatNumber(repositories.filter((r: Repository) => r.status?.toUpperCase() === 'COMPLETED').length)}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card variant="glass">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Code className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-dark-400 text-sm">Lines of Code</p>
                <p className="text-2xl font-bold text-white">
                  {formatNumber(repositories.reduce((acc: number, r: Repository) => acc + (r.size || 0), 0))}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Recent Repositories */}
      <Card>
        <CardHeader
          title="Recent Repositories"
          description="Your most recently accessed repositories"
          action={
            <Link to="/repositories">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          }
        />
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="spinner w-8 h-8 mx-auto mb-4"></div>
              <p className="text-dark-400">Loading repositories...</p>
            </div>
          ) : repositories.length === 0 ? (
            <div className="text-center py-12">
              <FolderGit2 className="w-16 h-16 text-dark-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No repositories yet</h3>
              <p className="text-dark-400 mb-6">Get started by adding your first repository</p>
              <Link to="/repositories">
                <Button variant="primary" leftIcon={<Plus className="w-5 h-5" />}>
                  Add Repository
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {repositories.map((repo: Repository, index: number) => (
                <motion.div
                  key={repo.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Link to={`/repositories/${repo.id}`}>
                    <div className="glass-hover rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                          <FolderGit2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{repo.name}</h4>
                          <p className="text-sm text-dark-400">
                            {repo.language} • {formatNumber(repo.fileCount)} files
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`badge ${
                          repo.status?.toUpperCase() === 'COMPLETED' ? 'badge-success' :
                            repo.status?.toUpperCase() === 'PROCESSING' ? 'badge-primary' :
                            repo.status?.toUpperCase() === 'FAILED' ? 'badge-error' :
                            'badge-warning'
                          }`}>
                            {repo.status}
                          </div>
                          <p className="text-xs text-dark-400 mt-1">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {formatRelativeTime(repo.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Made with Bob
