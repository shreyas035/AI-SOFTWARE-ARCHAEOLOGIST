import { Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { getInitials } from '@utils/format';

/**
 * Header component with user menu and notifications
 */
export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-dark-900 border-b border-dark-700 flex items-center justify-between px-6">
      {/* Search or breadcrumbs could go here */}
      <div className="flex-1"></div>

      {/* Right side - User menu */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-dark-400">{user?.email}</p>
          </div>
          
          <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold">
            {user?.name ? getInitials(user.name) : 'U'}
          </div>

          <button
            onClick={logout}
            className="p-2 text-dark-400 hover:text-red-400 hover:bg-dark-800 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

// Made with Bob
