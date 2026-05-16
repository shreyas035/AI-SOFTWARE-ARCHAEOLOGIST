import { Outlet } from 'react-router-dom';
import Sidebar from '@components/navigation/Sidebar';
import Header from '@components/navigation/Header';

/**
 * Main layout for authenticated pages
 * Includes sidebar navigation and header
 */
export default function MainLayout() {
  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-auto custom-scrollbar">
          <div className="container mx-auto px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

// Made with Bob
