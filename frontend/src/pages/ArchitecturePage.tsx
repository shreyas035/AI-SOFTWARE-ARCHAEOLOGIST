import { useParams } from 'react-router-dom';
import { Network } from 'lucide-react';

export default function ArchitecturePage() {
  const { id } = useParams();
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Architecture Map</h1>
        <p className="text-dark-400">Repository ID: {id}</p>
      </div>
      
      <div className="glass rounded-lg p-12 text-center">
        <Network className="w-16 h-16 text-primary-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Architecture Visualization</h2>
        <p className="text-dark-400">Interactive architecture diagrams coming soon</p>
      </div>
    </div>
  );
}

// Made with Bob
