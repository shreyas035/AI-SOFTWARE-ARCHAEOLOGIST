import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Circle,
  FileCode,
  Clock,
  Sparkles,
  ChevronRight,
  Map,
  MessageSquare
} from 'lucide-react';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import api from '@services/api';

interface OnboardingStep {
  order: number;
  title: string;
  description: string;
  files: string[];
  estimatedTime: string;
}

interface OnboardingPath {
  id: string;
  title: string;
  steps: OnboardingStep[];
  estimatedTime: string;
}

export default function OnboardingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [path, setPath] = useState<OnboardingPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    fetchOnboarding();
  }, [id]);

  const fetchOnboarding = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/analysis/onboarding/${id}`);
      if (response.data.success && response.data.data) {
        setPath(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch onboarding:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (order: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(order)) next.delete(order);
      else next.add(order);
      return next;
    });
  };

  const progress = path ? Math.round((completedSteps.size / path.steps.length) * 100) : 0;

  if (loading) {
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-400 mx-auto mb-4" />
          <p className="text-dark-400">Generating your onboarding roadmap...</p>
        </div>
      </div>
    );
  }

  if (!path) {
    return (
      <div className="space-y-8">
        <Button variant="secondary" onClick={() => navigate(`/repositories/${id}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Card className="p-12 text-center">
          <Compass className="w-12 h-12 text-primary-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Onboarding Path Yet</h2>
          <p className="text-dark-400">Re-process the repository to generate an onboarding roadmap.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate(`/repositories/${id}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Compass className="w-6 h-6 text-primary-400" />
              New Developer Onboarding
            </h1>
            <p className="text-dark-400 text-sm">Step-by-step roadmap to understand this codebase</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <Card className="p-5 border-primary-500/20 bg-gradient-to-r from-primary-500/5 to-transparent">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white font-medium">Your Progress</span>
          <span className="text-primary-400 font-bold">{progress}%</span>
        </div>
        <div className="w-full bg-dark-800 rounded-full h-2.5">
          <div
            className="bg-primary-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-3 text-sm text-dark-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Est. {path.estimatedTime} total
          </span>
          <span>{completedSteps.size}/{path.steps.length} steps done</span>
        </div>
      </Card>

      {/* Steps */}
      <div className="space-y-3">
        {path.steps.map((step, i) => {
          const isCompleted = completedSteps.has(step.order);
          const isActive = activeStep === i;

          return (
            <Card
              key={step.order}
              className={`overflow-hidden transition-all cursor-pointer ${
                isCompleted ? 'border-green-500/30 bg-green-500/5' :
                isActive ? 'border-primary-500/30 bg-primary-500/5' :
                'hover:border-dark-600'
              }`}
              onClick={() => setActiveStep(i)}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleStep(step.order); }}
                    className="mt-0.5 flex-shrink-0"
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : (
                      <Circle className="w-6 h-6 text-dark-600 hover:text-primary-400 transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-semibold ${isCompleted ? 'text-green-400 line-through' : 'text-white'}`}>
                        Step {step.order}: {step.title}
                      </h3>
                      <span className="text-dark-500 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {step.estimatedTime}
                      </span>
                    </div>
                    <p className="text-dark-400 text-sm mb-3">{step.description}</p>
                    {step.files.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {step.files.map((file) => (
                          <span key={file} className="inline-flex items-center gap-1 px-2.5 py-1 bg-dark-800 rounded-md text-xs text-primary-400 border border-dark-700">
                            <FileCode className="w-3 h-3" />
                            {file}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronRight className={`w-4 h-4 text-dark-600 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 hover:border-primary-500/30 transition-colors cursor-pointer" onClick={() => navigate(`/architecture/${id}`)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center border border-primary-500/20">
              <Map className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h4 className="text-white font-medium text-sm">Architecture Explorer</h4>
              <p className="text-dark-500 text-xs">Visualize module dependencies</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 hover:border-primary-500/30 transition-colors cursor-pointer" onClick={() => navigate(`/chat/${id}`)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center border border-primary-500/20">
              <MessageSquare className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h4 className="text-white font-medium text-sm">Ask the AI Archaeologist</h4>
              <p className="text-dark-500 text-xs">Get instant answers about this code</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Made with Bob
