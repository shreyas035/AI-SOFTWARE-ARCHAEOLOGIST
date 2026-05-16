import { useParams } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';

export default function AnalysisPage() {
  const { id } = useParams();
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Code Analysis</h1>
        <p className="text-dark-400">Repository ID: {id}</p>
      </div>
      
      <div className="glass rounded-lg p-12 text-center">
        <BarChart3 className="w-16 h-16 text-primary-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Analysis Dashboard</h2>
        <p className="text-dark-400">Code metrics and technical debt analysis coming soon</p>
      </div>
    </div>
  );
}

// Made with Bob
