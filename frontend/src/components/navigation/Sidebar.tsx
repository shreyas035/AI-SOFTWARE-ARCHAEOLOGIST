import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  Search,
  GitCompare,
  Download,
  Settings,
  Sparkles
} from 'lucide-react';
import { cn } from '@utils/cn';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Repositories', href: '/repositories', icon: FolderGit2 },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Comparison', href: '/comparison', icon: GitCompare },
  { name: 'Export', href: '/export', icon: Download },
  { name: 'Settings', href: '/settings', icon: Settings },
];

/**
 * Sidebar navigation component
 */
export default function Sidebar() {
  return (
    <aside className="w-64 bg-dark-900 border-r border-dark-700 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-dark-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg gradient-text">Bob AI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                  : 'text-dark-300 hover:bg-dark-800 hover:text-white'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-dark-700">
        <div className="glass rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-medium text-white">AI Assistant</span>
          </div>
          <p className="text-xs text-dark-400">
            Your intelligent code archaeologist, ready to explore legacy codebases.
          </p>
        </div>
      </div>
    </aside>
  );
}

// Made with Bob
