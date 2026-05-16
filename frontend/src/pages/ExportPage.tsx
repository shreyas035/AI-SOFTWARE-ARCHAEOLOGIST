import { useState } from 'react';
import { Download, FileJson, FileText, FileCode, Share2, Package } from 'lucide-react';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import Card from '@components/ui/Card';
import api from '@services/api';

export default function ExportPage() {
  const [repositoryId, setRepositoryId] = useState('');
  const [format, setFormat] = useState<'json' | 'markdown' | 'html'>('json');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [exportType, setExportType] = useState<'repository' | 'summary' | 'share'>('repository');

  // Export options
  const [includeAnalysis, setIncludeAnalysis] = useState(true);
  const [includeArchitecture, setIncludeArchitecture] = useState(true);
  const [includeTechnicalDebt, setIncludeTechnicalDebt] = useState(true);

  const handleExport = async () => {
    if (!repositoryId.trim()) {
      setError('Please enter a repository ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.post(
        `/export/repository/${repositoryId}`,
        {
          format,
          includeAnalysis,
          includeArchitecture,
          includeTechnicalDebt,
        },
        {
          responseType: 'blob',
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `repository-export.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!repositoryId.trim()) {
      setError('Please enter a repository ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/export/summary/${repositoryId}`);
      
      // Display summary or download
      const summary = JSON.stringify(response.data.data.summary, null, 2);
      const blob = new Blob([summary], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'executive-summary.json');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShareLink = async () => {
    if (!repositoryId.trim()) {
      setError('Please enter a repository ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.post(`/export/share/${repositoryId}`, {
        expiresIn: 86400, // 24 hours
      });

      setShareLink(response.data.data.shareLink);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const formats = [
    { id: 'json', label: 'JSON', icon: FileJson, description: 'Machine-readable format' },
    { id: 'markdown', label: 'Markdown', icon: FileText, description: 'Documentation format' },
    { id: 'html', label: 'HTML', icon: FileCode, description: 'Web-ready format' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Export & Reporting</h1>
        <p className="text-dark-400">Export repository data and create shareable reports</p>
      </div>

      {/* Export Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setExportType('repository')}
          className={`p-6 rounded-lg border-2 transition-colors text-left ${
            exportType === 'repository'
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-dark-700 hover:border-dark-600'
          }`}
        >
          <Download className="w-8 h-8 text-primary-400 mb-3" />
          <h3 className="text-white font-semibold mb-2">Full Export</h3>
          <p className="text-dark-400 text-sm">Export complete repository data and analysis</p>
        </button>

        <button
          onClick={() => setExportType('summary')}
          className={`p-6 rounded-lg border-2 transition-colors text-left ${
            exportType === 'summary'
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-dark-700 hover:border-dark-600'
          }`}
        >
          <FileText className="w-8 h-8 text-primary-400 mb-3" />
          <h3 className="text-white font-semibold mb-2">Executive Summary</h3>
          <p className="text-dark-400 text-sm">Generate high-level overview report</p>
        </button>

        <button
          onClick={() => setExportType('share')}
          className={`p-6 rounded-lg border-2 transition-colors text-left ${
            exportType === 'share'
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-dark-700 hover:border-dark-600'
          }`}
        >
          <Share2 className="w-8 h-8 text-primary-400 mb-3" />
          <h3 className="text-white font-semibold mb-2">Share Link</h3>
          <p className="text-dark-400 text-sm">Create shareable link for analysis</p>
        </button>
      </div>

      {/* Repository Input */}
      <Card className="p-6">
        <Input
          label="Repository ID"
          type="text"
          placeholder="Enter repository ID"
          value={repositoryId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRepositoryId(e.target.value)}
          helperText="Get this from your repositories list"
        />
      </Card>

      {/* Full Export Options */}
      {exportType === 'repository' && (
        <>
          {/* Format Selection */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Export Format</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formats.map((fmt) => {
                const Icon = fmt.icon;
                return (
                  <button
                    key={fmt.id}
                    onClick={() => setFormat(fmt.id as any)}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      format === fmt.id
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-dark-700 hover:border-dark-600'
                    }`}
                  >
                    <Icon className="w-6 h-6 text-primary-400 mb-2" />
                    <h3 className="text-white font-medium mb-1">{fmt.label}</h3>
                    <p className="text-dark-400 text-sm">{fmt.description}</p>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Export Options */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Include in Export</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg bg-dark-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAnalysis}
                  onChange={(e) => setIncludeAnalysis(e.target.checked)}
                  className="w-5 h-5 rounded border-dark-600 text-primary-500 focus:ring-primary-500"
                />
                <div>
                  <h3 className="text-white font-medium">Analysis Results</h3>
                  <p className="text-dark-400 text-sm">Code metrics and quality analysis</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg bg-dark-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeArchitecture}
                  onChange={(e) => setIncludeArchitecture(e.target.checked)}
                  className="w-5 h-5 rounded border-dark-600 text-primary-500 focus:ring-primary-500"
                />
                <div>
                  <h3 className="text-white font-medium">Architecture Map</h3>
                  <p className="text-dark-400 text-sm">System architecture and dependencies</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg bg-dark-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTechnicalDebt}
                  onChange={(e) => setIncludeTechnicalDebt(e.target.checked)}
                  className="w-5 h-5 rounded border-dark-600 text-primary-500 focus:ring-primary-500"
                />
                <div>
                  <h3 className="text-white font-medium">Technical Debt Report</h3>
                  <p className="text-dark-400 text-sm">Issues and recommendations</p>
                </div>
              </label>
            </div>
          </Card>

          <Button onClick={handleExport} disabled={loading} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            {loading ? 'Exporting...' : 'Export Repository'}
          </Button>
        </>
      )}

      {/* Executive Summary */}
      {exportType === 'summary' && (
        <>
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 text-primary-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Executive Summary</h2>
            <p className="text-dark-400 mb-6">
              Generate a high-level overview perfect for stakeholders and presentations
            </p>
            <Button onClick={handleGenerateSummary} disabled={loading}>
              <Package className="w-4 h-4 mr-2" />
              {loading ? 'Generating...' : 'Generate Summary'}
            </Button>
          </Card>
        </>
      )}

      {/* Share Link */}
      {exportType === 'share' && (
        <>
          <Card className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Share Settings</h2>
            <div className="space-y-4">
              <div className="p-4 bg-dark-800 rounded-lg">
                <h3 className="text-white font-medium mb-2">Link Expiration</h3>
                <p className="text-dark-400 text-sm mb-3">Link will expire in 24 hours</p>
                <select className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white">
                  <option value="86400">24 hours</option>
                  <option value="604800">7 days</option>
                  <option value="2592000">30 days</option>
                  <option value="0">Never</option>
                </select>
              </div>

              <Button onClick={handleCreateShareLink} disabled={loading} className="w-full">
                <Share2 className="w-4 h-4 mr-2" />
                {loading ? 'Creating...' : 'Create Share Link'}
              </Button>
            </div>
          </Card>

          {shareLink && (
            <Card className="p-6 border-primary-500/30">
              <h2 className="text-xl font-bold text-white mb-4">Share Link Created!</h2>
              <div className="p-4 bg-dark-900 rounded-lg mb-4">
                <code className="text-primary-400 break-all">{shareLink}</code>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(shareLink);
                  alert('Link copied to clipboard!');
                }}
                className="w-full"
              >
                Copy Link
              </Button>
            </Card>
          )}
        </>
      )}

      {/* Error Message */}
      {error && (
        <div className="glass rounded-lg p-4 border border-red-500/20 bg-red-500/5">
          <p className="text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}

// Made with Bob