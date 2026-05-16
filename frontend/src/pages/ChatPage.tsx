import { useParams } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

export default function ChatPage() {
  const { id } = useParams();
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">AI Chat</h1>
        <p className="text-dark-400">Repository ID: {id}</p>
      </div>
      
      <div className="glass rounded-lg p-12 text-center">
        <MessageSquare className="w-16 h-16 text-primary-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">AI Chat Interface</h2>
        <p className="text-dark-400">Interactive AI chat for code exploration coming soon</p>
      </div>
    </div>
  );
}

// Made with Bob
