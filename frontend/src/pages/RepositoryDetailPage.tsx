import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FolderGit2, Code, Calendar, Package, ArrowLeft, FileCode,
  GitBranch, Loader2, Sparkles, BarChart3, Shield, Zap,
  AlertTriangle, CheckCircle, Info, Eye
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, RadialBarChart, RadialBar
} from 'recharts';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import api from '@services/api';

interface LanguageStat {
  language: string;
  fileCount: number;
  totalLines: number;
  percentage: number;
}

interface Repository {
  id: string;
  name: string;
  sourceType: string;
  sourceUrl?: string;
  status: string;
  metadata?: {
    languages?: string[];
    frameworks?: string[];
    fileCount?: number;
    totalLines?: number;
    dependencies?: Record<string, string>;
    entryPoints?: string[];
    packageManager?: string;
    summary?: string;
    languageStats?: LanguageStat[];
  };
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
}

type TabType = 'overview' | 'analysis';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

export default function RepositoryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => { fetchRepository(); }, [id]);

  const fetchRepository = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/repositories/${id}`);
      setRepository(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load repository');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-12 h-12 animate-spin text-primary-400" />
      </div>
    );
  }

  if (error || !repository) {
    return (
      <div className="space-y-8">
        <Button variant="secondary" onClick={() => navigate('/repositories')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="glass rounded-lg p-12 text-center border border-red-500/20">
          <p className="text-red-400">{error || 'Repository not found'}</p>
        </div>
      </div>
    );
  }

  const meta = repository.metadata || {};
  const depCount = Object.keys(meta.dependencies || {}).length;
  const langStats = meta.languageStats || [];

  // Compute health score from metadata
  const healthScore = computeHealthScore(meta);
  const healthData = [{ name: 'Health', value: healthScore, fill: healthScore > 70 ? '#10b981' : healthScore > 40 ? '#f59e0b' : '#ef4444' }];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/repositories')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{repository.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-xs px-3 py-1 rounded-full border ${
                repository.status === 'COMPLETED' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                repository.status === 'PROCESSING' ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' :
                'text-red-400 bg-red-400/10 border-red-400/20'
              }`}>
                {repository.status}
              </span>
              <span className="text-dark-400 text-sm">
                {repository.sourceType === 'GITHUB' ? '🔗 GitHub' : '📁 ZIP Upload'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-dark-800/50 rounded-lg w-fit">
        {(['overview', 'analysis'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                : 'text-dark-400 hover:text-white hover:bg-dark-700'
            }`}
          >
            {tab === 'overview' ? '📊 Overview' : '🔬 Analysis'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' ? (
        <OverviewTab repository={repository} meta={meta} langStats={langStats} depCount={depCount} />
      ) : (
        <AnalysisTab meta={meta} langStats={langStats} depCount={depCount} healthScore={healthScore} healthData={healthData} />
      )}
    </div>
  );
}

/* ============= OVERVIEW TAB ============= */
function OverviewTab({ repository, meta, langStats, depCount }: {
  repository: Repository; meta: any; langStats: LanguageStat[]; depCount: number;
}) {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<FileCode className="w-5 h-5" />} label="Total Files" value={meta.fileCount || 0} />
        <StatCard icon={<Code className="w-5 h-5" />} label="Lines of Code" value={(meta.totalLines || 0).toLocaleString()} />
        <StatCard icon={<GitBranch className="w-5 h-5" />} label="Languages" value={meta.languages?.length || 0} />
        <StatCard icon={<Package className="w-5 h-5" />} label="Dependencies" value={depCount} />
      </div>

      {/* AI Summary — "What is this code doing?" */}
      <Card className="p-6 border-primary-500/20 bg-gradient-to-br from-primary-500/5 to-transparent relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5">
          <Sparkles className="w-32 h-32 text-primary-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-400" />
          What is this code doing?
        </h3>
        {meta.summary ? (
          <div className="text-dark-200 leading-relaxed whitespace-pre-wrap text-sm">
            {meta.summary}
          </div>
        ) : (
          <p className="text-dark-400 text-sm italic">
            Summary not yet available. Re-upload or re-clone this repository to generate one.
          </p>
        )}
      </Card>

      {/* Language Chart + Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-400" />
            Language Breakdown
          </h3>
          {langStats.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={langStats} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="totalLines" nameKey="language">
                    {langStats.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-dark-400">No language data</div>
          )}
        </Card>

        {/* Quick Facts */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-primary-400" />
            Quick Facts
          </h3>
          <div className="space-y-3">
            <FactRow label="Source" value={repository.sourceType === 'GITHUB' ? 'Cloned from GitHub' : 'Uploaded ZIP file'} />
            <FactRow label="Main Language" value={meta.languages?.[0] || 'Unknown'} />
            {meta.frameworks?.length > 0 && <FactRow label="Frameworks" value={meta.frameworks.join(', ')} />}
            {meta.packageManager && <FactRow label="Package Manager" value={meta.packageManager} />}
            <FactRow label="Added" value={new Date(repository.createdAt).toLocaleDateString()} />
            {repository.processedAt && <FactRow label="Processed" value={new Date(repository.processedAt).toLocaleDateString()} />}
            {repository.sourceUrl && (
              <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                <span className="text-dark-400 text-sm">URL</span>
                <a href={repository.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary-400 text-sm hover:underline truncate max-w-[200px]">
                  {repository.sourceUrl}
                </a>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Dependencies */}
      {depCount > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-400" />
            Dependencies ({depCount})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {Object.entries(meta.dependencies || {}).map(([name, version]) => (
              <div key={name} className="flex items-center justify-between p-2.5 bg-dark-800 rounded-lg">
                <span className="text-white text-sm font-medium truncate">{name}</span>
                <span className="text-dark-400 text-xs ml-2">{version as string}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ============= ANALYSIS TAB ============= */
function AnalysisTab({ meta, langStats, depCount, healthScore, healthData }: {
  meta: any; langStats: LanguageStat[]; depCount: number; healthScore: number; healthData: any[];
}) {
  const fileCount = meta.fileCount || 0;
  const totalLines = meta.totalLines || 0;
  const avgLinesPerFile = fileCount > 0 ? Math.round(totalLines / fileCount) : 0;

  // Build insights
  const insights = generateInsights(meta, langStats, depCount, healthScore);

  return (
    <div className="space-y-6">
      {/* Health Score + Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Health Score Gauge */}
        <Card className="p-6 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold text-white mb-2">Project Health</h3>
          <div className="h-40 w-40">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={healthData} startAngle={180} endAngle={0}>
                <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#1f2937' }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-3xl font-bold text-white -mt-4">{healthScore}<span className="text-lg text-dark-400">/100</span></p>
          <p className="text-sm text-dark-400 mt-1">
            {healthScore > 70 ? '✅ Looking good!' : healthScore > 40 ? '⚠️ Needs attention' : '🔴 Critical issues'}
          </p>
        </Card>

        {/* Key Metrics */}
        <Card className="p-6 col-span-1 md:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary-400" />
            Key Metrics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <MetricCard label="Avg Lines/File" value={avgLinesPerFile} status={avgLinesPerFile < 200 ? 'good' : avgLinesPerFile < 400 ? 'warning' : 'bad'} hint={avgLinesPerFile < 200 ? 'Files are well-sized' : 'Some files may be too long'} />
            <MetricCard label="Language Count" value={meta.languages?.length || 0} status={(meta.languages?.length || 0) <= 4 ? 'good' : 'warning'} hint={(meta.languages?.length || 0) <= 4 ? 'Focused tech stack' : 'Many languages — complex to maintain'} />
            <MetricCard label="Dependencies" value={depCount} status={depCount < 20 ? 'good' : depCount < 50 ? 'warning' : 'bad'} hint={depCount < 20 ? 'Lean dependency tree' : 'Heavy dependency tree'} />
            <MetricCard label="Entry Points" value={meta.entryPoints?.length || 0} status={(meta.entryPoints?.length || 0) <= 3 ? 'good' : 'warning'} hint={(meta.entryPoints?.length || 0) <= 3 ? 'Clear entry structure' : 'Multiple entry points'} />
          </div>
        </Card>
      </div>

      {/* Language Bar Chart */}
      {langStats.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-400" />
            Lines of Code by Language
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={langStats} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis dataKey="language" type="category" tick={{ fill: '#fff', fontSize: 12 }} width={75} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                <Bar dataKey="totalLines" name="Lines" radius={[0, 4, 4, 0]}>
                  {langStats.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* AI Insights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-400" />
          Smart Insights
        </h3>
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${
              insight.type === 'success' ? 'bg-green-500/5 border border-green-500/20' :
              insight.type === 'warning' ? 'bg-yellow-500/5 border border-yellow-500/20' :
              insight.type === 'danger' ? 'bg-red-500/5 border border-red-500/20' :
              'bg-blue-500/5 border border-blue-500/20'
            }`}>
              {insight.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" /> :
               insight.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" /> :
               insight.type === 'danger' ? <Shield className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" /> :
               <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />}
              <div>
                <p className="text-white text-sm font-medium">{insight.title}</p>
                <p className="text-dark-400 text-xs mt-0.5">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Entry Points */}
      {meta.entryPoints && meta.entryPoints.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary-400" />
            Where to Start Reading
          </h3>
          <p className="text-dark-400 text-sm mb-3">These are the main entry points — start here to understand the code flow:</p>
          <div className="space-y-2">
            {meta.entryPoints.map((ep: string) => (
              <div key={ep} className="flex items-center gap-2 p-2.5 bg-dark-800 rounded-lg">
                <FileCode className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <code className="text-green-400 text-sm">{ep}</code>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ============= HELPER COMPONENTS ============= */
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-1 text-primary-400">{icon}<span className="text-dark-400 text-xs">{label}</span></div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </Card>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
      <span className="text-dark-400 text-sm">{label}</span>
      <span className="text-white text-sm">{value}</span>
    </div>
  );
}

function MetricCard({ label, value, status, hint }: { label: string; value: number; status: 'good' | 'warning' | 'bad'; hint: string }) {
  const colors = { good: 'border-green-500/20 bg-green-500/5', warning: 'border-yellow-500/20 bg-yellow-500/5', bad: 'border-red-500/20 bg-red-500/5' };
  const textColors = { good: 'text-green-400', warning: 'text-yellow-400', bad: 'text-red-400' };
  return (
    <div className={`p-3 rounded-lg border ${colors[status]}`}>
      <p className="text-dark-400 text-xs">{label}</p>
      <p className={`text-xl font-bold ${textColors[status]}`}>{value}</p>
      <p className="text-dark-500 text-xs mt-1">{hint}</p>
    </div>
  );
}

/* ============= HELPER FUNCTIONS ============= */
function computeHealthScore(meta: any): number {
  let score = 50; // base

  const fileCount = meta.fileCount || 0;
  const totalLines = meta.totalLines || 0;
  const avgLines = fileCount > 0 ? totalLines / fileCount : 0;
  const depCount = Object.keys(meta.dependencies || {}).length;
  const langCount = meta.languages?.length || 0;

  // Good: has entry points
  if (meta.entryPoints?.length > 0) score += 10;
  // Good: uses a package manager
  if (meta.packageManager) score += 5;
  // Good: has frameworks detected
  if (meta.frameworks?.length > 0) score += 10;
  // Penalty: too many languages
  if (langCount > 6) score -= 10;
  // Penalty: huge average file size
  if (avgLines > 500) score -= 15;
  else if (avgLines > 300) score -= 5;
  else score += 10;
  // Penalty: too many dependencies
  if (depCount > 50) score -= 10;
  else if (depCount < 20) score += 5;
  // Small bonus for reasonable file count
  if (fileCount > 0 && fileCount < 500) score += 5;

  return Math.max(0, Math.min(100, score));
}

interface Insight { title: string; description: string; type: 'success' | 'warning' | 'danger' | 'info' }

function generateInsights(meta: any, langStats: LanguageStat[], depCount: number, healthScore: number): Insight[] {
  const insights: Insight[] = [];
  const fileCount = meta.fileCount || 0;
  const totalLines = meta.totalLines || 0;
  const avgLines = fileCount > 0 ? Math.round(totalLines / fileCount) : 0;

  // Size insight
  if (totalLines < 1000) {
    insights.push({ title: 'Lightweight project', description: 'This is a small codebase — easy to understand and navigate.', type: 'success' });
  } else if (totalLines > 50000) {
    insights.push({ title: 'Large codebase detected', description: `With ${totalLines.toLocaleString()} lines, this is a substantial project. Consider modular architecture.`, type: 'warning' });
  }

  // File size insight
  if (avgLines > 400) {
    insights.push({ title: 'Large file sizes', description: `Average file is ${avgLines} lines. Consider splitting files > 300 lines.`, type: 'warning' });
  } else if (avgLines > 0) {
    insights.push({ title: 'Good file sizes', description: `Average file is ${avgLines} lines — well within best practices.`, type: 'success' });
  }

  // Dependency insight
  if (depCount > 50) {
    insights.push({ title: 'Heavy dependency tree', description: `${depCount} dependencies. Review if all are necessary to reduce security surface.`, type: 'danger' });
  } else if (depCount > 0) {
    insights.push({ title: 'Manageable dependencies', description: `${depCount} packages — a focused dependency tree.`, type: 'success' });
  }

  // Frameworks
  if (meta.frameworks?.length > 0) {
    insights.push({ title: `Uses ${meta.frameworks.join(', ')}`, description: 'Established frameworks detected — the project follows industry patterns.', type: 'info' });
  }

  // Entry points
  if (!meta.entryPoints || meta.entryPoints.length === 0) {
    insights.push({ title: 'No clear entry point', description: 'Could not detect a main entry file (index.ts, app.py, etc.).', type: 'warning' });
  }

  // Multi-language
  if ((meta.languages?.length || 0) > 4) {
    insights.push({ title: 'Multi-language project', description: `Uses ${meta.languages.length} languages. This adds complexity for new developers.`, type: 'warning' });
  }

  return insights;
}

// Made with Bob
