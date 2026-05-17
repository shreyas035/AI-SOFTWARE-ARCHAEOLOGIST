import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Code, Map, Shield, MessageSquare, FileText, Compass } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-950 text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">Software <span className="text-primary-400">Archaeologist</span></span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-dark-300 hover:text-white transition-colors text-sm">Sign In</Link>
          <Link to="/register" className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary-500/20">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-5xl mx-auto px-8 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-500/10 border border-primary-500/30 rounded-full text-primary-400 text-xs font-medium mb-8">
          <Sparkles className="w-3 h-3" />
          Powered by IBM Bob AI
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
          Understand legacy code
          <br />
          <span className="bg-gradient-to-r from-primary-400 via-purple-400 to-primary-400 bg-clip-text text-transparent">
            like discovering ancient ruins
          </span>
        </h1>

        <p className="text-lg text-dark-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload any repository. Our AI reconstructs its architecture, explains business logic,
          maps dependencies, detects risks — and generates full documentation in minutes.
        </p>

        <div className="flex items-center justify-center gap-4 mb-20">
          <Link to="/register" className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3.5 rounded-xl text-sm font-semibold transition-all shadow-xl shadow-primary-500/25 flex items-center gap-2 hover:gap-3">
            Start Excavating <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/login" className="bg-dark-800 hover:bg-dark-700 text-white px-8 py-3.5 rounded-xl text-sm font-semibold transition-colors border border-dark-700">
            Live Demo
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left max-w-4xl mx-auto">
          {[
            { icon: Code, title: 'Repository Ingestion', desc: 'Upload ZIP or paste GitHub URL. We scan every file, detect languages, parse dependencies.' },
            { icon: Map, title: 'Architecture Mapping', desc: 'Interactive React Flow graphs showing module dependencies and relationships.' },
            { icon: MessageSquare, title: 'AI Code Explainer', desc: 'Ask questions about your codebase. Get answers referencing actual files.' },
            { icon: Shield, title: 'Risk & Debt Analysis', desc: 'Detect complex files, security issues, dead code, and technical debt.' },
            { icon: FileText, title: 'Auto Documentation', desc: 'Generate README, API docs, architecture guides, and onboarding materials.' },
            { icon: Compass, title: 'Onboarding Mode', desc: 'Step-by-step learning roadmap for new developers joining legacy projects.' },
          ].map((f, i) => (
            <div key={i} className="p-5 bg-dark-900/80 border border-dark-700/50 rounded-xl hover:border-primary-500/30 transition-all group">
              <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center mb-3 border border-primary-500/20 group-hover:bg-primary-500/20 transition-colors">
                <f.icon className="w-5 h-5 text-primary-400" />
              </div>
              <h3 className="font-semibold text-white mb-1 text-sm">{f.title}</h3>
              <p className="text-dark-400 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-24 p-8 bg-dark-900/50 border border-dark-700/50 rounded-2xl max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">Legacy software understood in minutes.</h2>
          <p className="text-dark-400 mb-6 text-sm">Not hours. Not weeks. Minutes.</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-primary-500/20">
            <Sparkles className="w-4 h-4" />
            Try It Now — Free
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 border-t border-dark-800">
        <p className="text-dark-500 text-xs">Built with IBM Bob AI for the Bob Hackathon 2026</p>
      </footer>
    </div>
  );
}
