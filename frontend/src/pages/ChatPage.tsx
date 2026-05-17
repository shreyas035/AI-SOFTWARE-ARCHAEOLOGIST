import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Send,
  User,
  Bot,
  ArrowLeft,
  Sparkles,
  Trash2
} from 'lucide-react';
import Button from '@components/ui/Button';
import api from '@services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export default function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const query = input;
    setInput('');
    setLoading(true);

    try {
      const response = await api.post(`/chat/${id}/query`, { query });
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.data?.content || response.data.data?.response || 'I analyzed the repository but could not generate a response.',
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ I couldn't process that request. The AI engine may be initializing. Error: ${err.response?.data?.message || err.message}`,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    'How is this project structured?',
    'What are the main entry points?',
    'Explain the authentication flow',
    'What technologies does this use?',
    'Where is the business logic?',
    'What are the potential risks?'
  ];

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate(`/repositories/${id}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary-400" />
              Archaeologist AI
            </h1>
            <p className="text-dark-400 text-sm">Ask anything about this codebase</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setMessages([])}>
            <Trash2 className="w-4 h-4 text-red-400" />
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 glass rounded-xl border border-primary-500/20 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="p-4 bg-primary-500/10 rounded-full mb-4 border border-primary-500/20">
                <Bot className="w-12 h-12 text-primary-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">How can I help you explore?</h3>
              <p className="text-dark-400 mb-6 text-sm">
                I can analyze architecture, explain business logic, find risks, and help you understand this codebase.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                {suggestedQuestions.map(q => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="p-3 bg-dark-800 border border-dark-700 rounded-lg text-xs text-left hover:border-primary-500/50 transition-colors text-dark-300 hover:text-white"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`p-2 rounded-lg h-fit flex-shrink-0 ${msg.role === 'user' ? 'bg-primary-500' : 'bg-dark-700'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-primary-400" />}
                </div>
                <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white rounded-tr-sm'
                    : 'bg-dark-800 text-dark-200 rounded-tl-sm border border-dark-700'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-3">
              <div className="p-2 rounded-lg h-fit bg-dark-700">
                <Bot className="w-4 h-4 text-primary-400 animate-pulse" />
              </div>
              <div className="p-4 rounded-2xl bg-dark-800 border border-dark-700 rounded-tl-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-dark-700 bg-dark-900/80">
          <div className="relative flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask about the codebase architecture, business logic, risks..."
              className="flex-1 bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-4 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-700 disabled:text-dark-500 text-white rounded-lg transition-colors flex items-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-dark-600 mt-2 text-center">
            Powered by IBM Bob AI • Responses reference actual repository files
          </p>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
