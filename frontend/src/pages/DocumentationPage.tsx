import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Book,
  Map,
  Compass,
  Loader2,
  ArrowLeft,
  Sparkles,
  Download,
  RefreshCw,
  Clock
} from 'lucide-react';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import api from '@services/api';

interface Documentation {
  id: string;
  docType: string;
  title: string;
  content: string;
  updatedAt: string;
}

export default function DocumentationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<Documentation[]>([]);
  const [activeTab, setActiveTab] = useState<string>('README');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchDocs();
  }, [id]);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/documentation/${id}`);
      const fetchedDocs = response.data.data || [];
      setDocs(fetchedDocs);
      if (fetchedDocs.length > 0) {
        setActiveTab(fetchedDocs[0].docType);
      }
    } catch (err) {
      console.error('Failed to fetch documentation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (type: string) => {
    try {
      setGenerating(true);
      await api.post(`/documentation/${id}/generate`, { type });
      await fetchDocs();
      setActiveTab(type);
    } catch (err) {
      console.error('Failed to generate doc:', err);
    } finally {
      setGenerating(false);
    }
  };

  const activeDoc = docs.find(d => d.docType === activeTab);

  const docTypes = [
    { id: 'README', label: 'Overview', icon: FileText, desc: 'Project README & summary' },
    { id: 'API_REFERENCE', label: 'API Docs', icon: Book, desc: 'API endpoints & usage' },
    { id: 'ARCHITECTURE', label: 'Architecture', icon: Map, desc: 'System design guide' },
    { id: 'ONBOARDING', label: 'Onboarding', icon: Compass, desc: 'New developer roadmap' },
  ];

  if (loading) {
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-400 mx-auto mb-4" />
          <p className="text-dark-400">Loading documentation artifacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate(`/repositories/${id}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Compass className="w-6 h-6 text-primary-400" />
              Documentation Hub
            </h1>
            <p className="text-dark-400 text-sm">AI-generated docs & onboarding guides</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
        {/* Sidebar */}
        <div className="w-56 flex-shrink-0 flex flex-col gap-2">
          {docTypes.map((type) => {
            const Icon = type.icon;
            const exists = docs.some(d => d.docType === type.id);
            return (
              <button
                key={type.id}
                onClick={() => setActiveTab(type.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  activeTab === type.id
                    ? 'bg-primary-500/10 border-primary-500/40 text-white'
                    : 'bg-dark-800/50 border-dark-700 text-dark-400 hover:border-dark-600'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${activeTab === type.id ? 'text-primary-400' : ''}`} />
                <div className="min-w-0">
                  <span className="text-sm font-medium block">{type.label}</span>
                  <span className="text-[10px] text-dark-500 block truncate">{type.desc}</span>
                </div>
                {exists && <span className="ml-auto w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <Card className="flex-1 overflow-hidden flex flex-col border-primary-500/10">
          {activeDoc ? (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-dark-700 flex items-center justify-between bg-dark-900/50">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-white">{activeDoc.title}</h2>
                  <span className="flex items-center gap-1 text-[10px] text-dark-500 bg-dark-800 px-2 py-0.5 rounded">
                    <Clock className="w-3 h-3" />
                    {new Date(activeDoc.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => handleGenerate(activeTab)} disabled={generating}>
                    <RefreshCw className={`w-3 h-3 mr-1 ${generating ? 'animate-spin' : ''}`} />
                    Regen
                  </Button>
                  <Button variant="secondary" size="sm">
                    <Download className="w-3 h-3 mr-1" /> MD
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="markdown whitespace-pre-wrap text-sm leading-relaxed">
                  {activeDoc.content}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="p-5 bg-primary-500/10 rounded-full mb-5 border border-primary-500/20">
                <Sparkles className="w-10 h-10 text-primary-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Generate {docTypes.find(d => d.id === activeTab)?.label || activeTab}
              </h2>
              <p className="text-dark-400 max-w-sm mb-6 text-sm">
                Let IBM Bob analyze your repository and generate professional documentation automatically.
              </p>
              <Button
                variant="primary"
                onClick={() => handleGenerate(activeTab)}
                disabled={generating}
              >
                {generating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate Now
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// Made with Bob
